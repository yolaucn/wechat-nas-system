import { Request, Response, NextFunction } from 'express';
import { verifyJWT } from '../utils/jwt';
import User, { UserRole, UserStatus } from '../models/User';
import logger from '../utils/logger';

// 扩展Request类型，添加userId和userRole
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: UserRole;
    }
  }
}

/**
 * 验证JWT token中间件
 */
export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 从请求头获取token
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No token provided',
      });
      return;
    }

    const token = authHeader.substring(7); // 移除 "Bearer " 前缀

    // 验证token
    const decoded = verifyJWT(token);

    // 查询用户
    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // 检查用户状态
    if (user.status !== UserStatus.ACTIVE) {
      res.status(403).json({
        success: false,
        message: 'User account is disabled',
      });
      return;
    }

    // 将用户信息添加到请求对象
    req.userId = user._id.toString();
    req.userRole = user.role;

    next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Token expired') {
        res.status(401).json({
          success: false,
          message: 'Token expired',
        });
        return;
      } else if (error.message === 'Invalid token') {
        res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
        return;
      }
    }

    logger.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * 检查用户角色中间件
 */
export const checkRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.userRole) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    if (!allowedRoles.includes(req.userRole)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};

/**
 * 可选的token验证中间件（token可以不存在）
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyJWT(token);

    const user = await User.findById(decoded.userId);

    if (user && user.status === UserStatus.ACTIVE) {
      req.userId = user._id.toString();
      req.userRole = user.role;
    }

    next();
  } catch (error) {
    // 忽略错误，继续执行
    next();
  }
};
