import { Request, Response } from 'express';
import multer from 'multer';
import File from '../models/File';
import User from '../models/User';
import localStorageService from '../services/localStorage';
import logger from '../utils/logger';

// 配置multer使用内存存储
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600'), // 100MB
  },
});

// 导出multer中间件
export const uploadMiddleware = upload.single('file');

/**
 * 文件上传接口
 * POST /api/v1/files/upload
 */
export const uploadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const file = req.file;
    const { folder = '/' } = req.body;

    if (!file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
      return;
    }

    // 1. 查询用户
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // 2. 验证存储配额
    if (!user.hasEnoughStorage(file.size)) {
      res.status(400).json({
        success: false,
        message: 'Storage quota exceeded',
        data: {
          storageUsed: user.storageUsed,
          storageQuota: user.storageQuota,
          fileSize: file.size,
        },
      });
      return;
    }

    // 3. 验证文件类型（可选）
    const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [];
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
      res.status(400).json({
        success: false,
        message: 'File type not allowed',
        data: {
          fileType: file.mimetype,
          allowedTypes,
        },
      });
      return;
    }

    // 4. 保存文件到本地存储
    const relativePath = await localStorageService.saveFile(file, userId);

    // 5. 生成文件访问URL
    const fileUrl = localStorageService.generateFileUrl(relativePath);

    // 6. 创建文件元数据记录
    const newFile = new File({
      filename: file.originalname,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: relativePath,
      url: fileUrl,
      uploaderId: userId,
      folder: folder,
    });

    await newFile.save();

    // 7. 更新用户存储空间
    await user.updateStorageUsed(file.size);

    logger.info(`File uploaded: ${newFile._id} by user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        id: newFile._id,
        filename: newFile.filename,
        size: newFile.size,
        mimeType: newFile.mimeType,
        url: newFile.url,
        folder: newFile.folder,
        createdAt: newFile.createdAt,
      },
    });
  } catch (error) {
    logger.error('Upload file error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};


/**
 * 文件列表查询接口
 * GET /api/v1/files
 */
export const getFileList = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { 
      folder = '/', 
      page = '1', 
      limit = '20',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // 构建查询条件
    const query: any = {
      uploaderId: userId,
      status: 'active',
      folder: folder,
    };

    // 构建排序
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    // 查询文件列表
    const files = await File.find(query)
      .select('filename originalName mimeType size url folder createdAt updatedAt')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // 查询总数
    const total = await File.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        files,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    logger.error('Get file list error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * 文件详情查询接口
 * GET /api/v1/files/:fileId
 */
export const getFileDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { fileId } = req.params;

    const file = await File.findById(fileId);

    if (!file) {
      res.status(404).json({
        success: false,
        message: 'File not found',
      });
      return;
    }

    // 检查权限（上传者或有权限的用户）
    if (file.uploaderId.toString() !== userId) {
      // TODO: 检查permissions数组
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: file._id,
        filename: file.filename,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        url: file.url,
        folder: file.folder,
        uploaderId: file.uploaderId,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
      },
    });
  } catch (error) {
    logger.error('Get file detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * 文件下载接口
 * GET /api/v1/files/:fileId/download
 */
export const downloadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { fileId } = req.params;

    const file = await File.findById(fileId);

    if (!file) {
      res.status(404).json({
        success: false,
        message: 'File not found',
      });
      return;
    }

    // 检查权限
    if (file.uploaderId.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    // 获取文件路径
    const filePath = await localStorageService.getFile(file.path);

    // 设置响应头
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.filename)}"`);
    res.setHeader('Content-Length', file.size.toString());

    // 使用stream传输文件
    const fs = require('fs');
    const fileStream = fs.createReadStream(filePath);

    fileStream.on('error', (error: Error) => {
      logger.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Failed to download file',
        });
      }
    });

    fileStream.pipe(res);
  } catch (error) {
    logger.error('Download file error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
};


/**
 * 文件删除接口
 * DELETE /api/v1/files/:fileId
 */
export const deleteFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const userRole = req.userRole!;
    const { fileId } = req.params;

    const file = await File.findById(fileId);

    if (!file) {
      res.status(404).json({
        success: false,
        message: 'File not found',
      });
      return;
    }

    // 检查权限（只有管理员或文件所有者可以删除）
    if (file.uploaderId.toString() !== userId && userRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    // 删除本地文件
    try {
      await localStorageService.deleteFile(file.path);
    } catch (error) {
      logger.error('Delete local file error:', error);
    }

    // 标记文件状态为deleted
    file.status = 'deleted' as any;
    await file.save();

    // 减少用户存储空间
    const user = await User.findById(file.uploaderId);
    if (user) {
      await user.updateStorageUsed(-file.size);
    }

    logger.info(`File deleted: ${fileId} by user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    logger.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * 文件重命名接口
 * PUT /api/v1/files/:fileId/rename
 */
export const renameFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { fileId } = req.params;
    const { filename } = req.body;

    if (!filename || filename.trim() === '') {
      res.status(400).json({
        success: false,
        message: 'Filename is required',
      });
      return;
    }

    const file = await File.findById(fileId);

    if (!file) {
      res.status(404).json({
        success: false,
        message: 'File not found',
      });
      return;
    }

    // 检查权限（只有文件所有者可以重命名）
    if (file.uploaderId.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    // 检查文件名是否已存在
    const existingFile = await File.findOne({
      uploaderId: userId,
      folder: file.folder,
      filename: filename,
      status: 'active',
      _id: { $ne: fileId },
    });

    if (existingFile) {
      res.status(400).json({
        success: false,
        message: 'Filename already exists in this folder',
      });
      return;
    }

    // 更新文件名
    file.filename = filename;
    await file.save();

    logger.info(`File renamed: ${fileId} to ${filename}`);

    res.status(200).json({
      success: true,
      message: 'File renamed successfully',
      data: {
        id: file._id,
        filename: file.filename,
      },
    });
  } catch (error) {
    logger.error('Rename file error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * 设置文件权限（管理员或文件所有者）
 * PUT /api/v1/files/:fileId/permissions
 */
export const setFilePermissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileId } = req.params;
    const { permissions } = req.body;
    const userId = req.userId!;

    // 验证权限数据格式
    if (!Array.isArray(permissions)) {
      res.status(400).json({
        success: false,
        message: 'Permissions must be an array',
      });
      return;
    }

    // 查找文件
    const file = await File.findById(fileId);
    if (!file) {
      res.status(404).json({
        success: false,
        message: 'File not found',
      });
      return;
    }

    // 验证权限：只有文件所有者或管理员可以设置权限
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const isOwner = file.uploaderId.toString() === userId;
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isAdmin) {
      res.status(403).json({
        success: false,
        message: 'No permission to manage file permissions',
      });
      return;
    }

    // 禁止修改文件所有者的权限
    const ownerPermission = permissions.find(
      (p: any) => p.userId === file.uploaderId.toString()
    );
    if (ownerPermission) {
      res.status(403).json({
        success: false,
        message: 'Cannot modify owner permissions',
      });
      return;
    }

    // 更新权限列表
    file.permissions = permissions;
    await file.save();

    logger.info(`File permissions updated: ${fileId} by ${userId}`);

    res.status(200).json({
      success: true,
      message: 'File permissions updated successfully',
      data: {
        fileId: file._id,
        permissions: file.permissions,
      },
    });
  } catch (error) {
    logger.error('Set file permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * 获取文件权限列表
 * GET /api/v1/files/:fileId/permissions
 */
export const getFilePermissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileId } = req.params;
    const userId = req.userId!;

    // 查找文件
    const file = await File.findById(fileId).populate('permissions.userId', 'nickname avatar');
    if (!file) {
      res.status(404).json({
        success: false,
        message: 'File not found',
      });
      return;
    }

    // 验证权限：只有文件所有者或管理员可以查看权限
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const isOwner = file.uploaderId.toString() === userId;
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isAdmin) {
      res.status(403).json({
        success: false,
        message: 'No permission to view file permissions',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        fileId: file._id,
        owner: file.uploaderId,
        permissions: file.permissions,
      },
    });
  } catch (error) {
    logger.error('Get file permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
