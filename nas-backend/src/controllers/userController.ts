import { Request, Response } from 'express';
import User, { UserRole, UserStatus } from '../models/User';
import logger from '../utils/logger';

/**
 * 获取用户列表（管理员）
 * GET /api/v1/users
 */
export const getUserList = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, status, page = 1, limit = 20 } = req.query;

    // 构建查询条件
    const query: any = {};
    if (role) query.role = role;
    if (status) query.status = status;

    // 分页参数
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // 查询用户列表
    const users = await User.find(query)
      .select('-openid') // 不返回敏感信息
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // 查询总数
    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    logger.error('Get user list error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * 更新用户角色（管理员）
 * PUT /api/v1/users/:userId/role
 */
export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    // @ts-ignore
    const currentUserId = req.userId;

    // 验证角色值
    if (!Object.values(UserRole).includes(role)) {
      res.status(400).json({
        success: false,
        message: 'Invalid role value',
      });
      return;
    }

    // 禁止修改自己的角色
    if (userId === currentUserId) {
      res.status(403).json({
        success: false,
        message: 'Cannot modify your own role',
      });
      return;
    }

    // 查找用户
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // 更新角色
    user.role = role;
    await user.save();

    logger.info(`User role updated: ${userId} -> ${role} by ${currentUserId}`);

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: {
        id: user._id,
        nickname: user.nickname,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * 切换用户状态（管理员）
 * PUT /api/v1/users/:userId/status
 */
export const updateUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    // @ts-ignore
    const currentUserId = req.userId;

    // 验证状态值
    if (!Object.values(UserStatus).includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Invalid status value',
      });
      return;
    }

    // 禁止禁用自己
    if (userId === currentUserId) {
      res.status(403).json({
        success: false,
        message: 'Cannot modify your own status',
      });
      return;
    }

    // 查找用户
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // 更新状态
    user.status = status;
    await user.save();

    logger.info(`User status updated: ${userId} -> ${status} by ${currentUserId}`);

    res.status(200).json({
      success: true,
      message: 'User status updated successfully',
      data: {
        id: user._id,
        nickname: user.nickname,
        status: user.status,
      },
    });
  } catch (error) {
    logger.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
