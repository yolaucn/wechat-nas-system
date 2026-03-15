import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import Share from '../models/Share';
import File from '../models/File';
import logger from '../utils/logger';

/**
 * 生成唯一分享码（8位字符）
 */
const generateShareCode = async (): Promise<string> => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const maxRetries = 10;
  
  for (let retry = 0; retry < maxRetries; retry++) {
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    // 检查唯一性
    const existing = await Share.findOne({ shareCode: code });
    if (!existing) {
      return code;
    }
  }
  
  throw new Error('Failed to generate unique share code');
};

/**
 * 创建分享接口
 * POST /api/v1/shares
 */
export const createShare = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { 
      fileId, 
      shareType = 'public', 
      password, 
      expiresIn, 
      downloadLimit 
    } = req.body;

    // 1. 验证必填字段
    if (!fileId) {
      res.status(400).json({
        success: false,
        message: 'File ID is required',
      });
      return;
    }

    // 2. 查询文件
    const file = await File.findById(fileId);
    if (!file) {
      res.status(404).json({
        success: false,
        message: 'File not found',
      });
      return;
    }

    // 3. 验证文件读取权限（只有文件所有者可以创建分享）
    if (file.uploaderId.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    // 4. 验证分享类型
    if (!['public', 'password', 'internal'].includes(shareType)) {
      res.status(400).json({
        success: false,
        message: 'Invalid share type',
      });
      return;
    }

    // 5. 如果是密码分享，验证密码
    let hashedPassword: string | undefined;
    if (shareType === 'password') {
      if (!password || password.length < 4) {
        res.status(400).json({
          success: false,
          message: 'Password must be at least 4 characters',
        });
        return;
      }
      // 加密密码
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // 6. 计算过期时间
    let expiresAt: Date | undefined;
    if (expiresIn) {
      const expiresInMs = parseInt(expiresIn) * 1000; // 转换为毫秒
      expiresAt = new Date(Date.now() + expiresInMs);
    }

    // 7. 生成唯一分享码
    const shareCode = await generateShareCode();

    // 8. 创建分享记录
    const share = new Share({
      fileId: file._id,
      sharerId: userId,
      shareCode,
      shareType,
      password: hashedPassword,
      expiresAt,
      downloadLimit: downloadLimit ? parseInt(downloadLimit) : undefined,
    });

    await share.save();

    // 9. 生成分享链接
    const shareLink = `${process.env.FILE_BASE_URL}/share/${shareCode}`;

    logger.info(`Share created: ${share._id} for file ${fileId} by user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Share created successfully',
      data: {
        id: share._id,
        shareCode: share.shareCode,
        shareLink,
        shareType: share.shareType,
        expiresAt: share.expiresAt,
        downloadLimit: share.downloadLimit,
        createdAt: share.createdAt,
      },
    });
  } catch (error) {
    logger.error('Create share error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * 访问分享接口
 * GET /api/v1/shares/:shareCode
 */
export const accessShare = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shareCode } = req.params;
    const { password } = req.query;
    const userId = req.userId; // 可选，用于内部分享验证

    // 1. 查询分享记录
    const share = await Share.findOne({ shareCode }).populate('fileId');
    
    if (!share) {
      res.status(404).json({
        success: false,
        message: 'Share not found',
      });
      return;
    }

    // 2. 验证分享状态
    if (share.status !== 'active') {
      res.status(403).json({
        success: false,
        message: 'Share has been revoked',
      });
      return;
    }

    // 3. 验证有效期
    if (share.expiresAt && share.expiresAt < new Date()) {
      res.status(403).json({
        success: false,
        message: 'Share has expired',
      });
      return;
    }

    // 4. 验证密码（如果是密码分享）
    if (share.shareType === 'password') {
      if (!password) {
        res.status(401).json({
          success: false,
          message: 'Password required',
          requirePassword: true,
        });
        return;
      }

      const isPasswordValid = await bcrypt.compare(password as string, share.password!);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid password',
        });
        return;
      }
    }

    // 5. 验证内部分享权限（如果是内部分享）
    if (share.shareType === 'internal') {
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }
    }

    // 6. 检查下载次数限制
    if (share.downloadLimit && share.downloadCount >= share.downloadLimit) {
      res.status(403).json({
        success: false,
        message: 'Download limit exceeded',
      });
      return;
    }

    // 7. 获取文件信息
    const file = share.fileId as any;
    if (!file) {
      res.status(404).json({
        success: false,
        message: 'File not found',
      });
      return;
    }

    // 8. 增加访问次数
    share.accessCount += 1;
    await share.save();

    // 9. 返回文件信息和访问URL
    res.status(200).json({
      success: true,
      data: {
        file: {
          id: file._id,
          filename: file.filename,
          size: file.size,
          mimeType: file.mimeType,
          url: file.url,
          createdAt: file.createdAt,
        },
        share: {
          shareCode: share.shareCode,
          shareType: share.shareType,
          expiresAt: share.expiresAt,
          downloadLimit: share.downloadLimit,
          downloadCount: share.downloadCount,
          accessCount: share.accessCount,
        },
      },
    });
  } catch (error) {
    logger.error('Access share error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * 记录下载（增加下载次数）
 * POST /api/v1/shares/:shareCode/download
 */
export const recordDownload = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shareCode } = req.params;

    const share = await Share.findOne({ shareCode });
    
    if (!share) {
      res.status(404).json({
        success: false,
        message: 'Share not found',
      });
      return;
    }

    // 增加下载次数
    share.downloadCount += 1;
    await share.save();

    res.status(200).json({
      success: true,
      message: 'Download recorded',
    });
  } catch (error) {
    logger.error('Record download error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * 撤销分享接口
 * DELETE /api/v1/shares/:shareId
 */
export const revokeShare = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { shareId } = req.params;

    // 1. 查询分享记录
    const share = await Share.findById(shareId);
    
    if (!share) {
      res.status(404).json({
        success: false,
        message: 'Share not found',
      });
      return;
    }

    // 2. 验证分享所有者权限
    if (share.sharerId.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    // 3. 更新分享状态为revoked
    share.status = 'revoked' as any;
    await share.save();

    logger.info(`Share revoked: ${shareId} by user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Share revoked successfully',
    });
  } catch (error) {
    logger.error('Revoke share error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * 分享列表查询接口
 * GET /api/v1/shares
 */
export const getShareList = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { 
      status = 'active',
      page = '1', 
      limit = '20' 
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // 构建查询条件
    const query: any = {
      sharerId: userId,
    };

    if (status && status !== 'all') {
      query.status = status;
    }

    // 查询分享列表
    const shares = await Share.find(query)
      .populate('fileId', 'filename size mimeType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // 查询总数
    const total = await Share.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        shares,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    logger.error('Get share list error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
