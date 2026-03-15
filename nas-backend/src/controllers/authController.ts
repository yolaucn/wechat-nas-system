import { Request, Response } from 'express';
import axios from 'axios';
import User, { UserRole } from '../models/User';
import Session from '../models/Session';
import { generateJWT } from '../utils/jwt';
import logger from '../utils/logger';

const WECHAT_APP_ID = process.env.WECHAT_APP_ID || '';
const WECHAT_APP_SECRET = process.env.WECHAT_APP_SECRET || '';

/**
 * 微信登录接口
 * POST /api/v1/auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, nickname, avatar } = req.body;

    if (!code) {
      res.status(400).json({
        success: false,
        message: 'Missing code parameter',
      });
      return;
    }

    // 1. 使用code换取openid和session_key
    const wechatResponse = await axios.get(
      'https://api.weixin.qq.com/sns/jscode2session',
      {
        params: {
          appid: WECHAT_APP_ID,
          secret: WECHAT_APP_SECRET,
          js_code: code,
          grant_type: 'authorization_code',
        },
      }
    );

    const { openid, errcode, errmsg } = wechatResponse.data;

    if (errcode) {
      logger.error('WeChat login error:', { errcode, errmsg });
      res.status(400).json({
        success: false,
        message: `WeChat login failed: ${errmsg}`,
      });
      return;
    }

    if (!openid) {
      res.status(400).json({
        success: false,
        message: 'Failed to get openid from WeChat',
      });
      return;
    }

    // 2. 查询或创建用户
    let user = await User.findOne({ openid });

    if (!user) {
      // 创建新用户
      user = new User({
        openid,
        nickname: nickname || '微信用户',
        avatar: avatar || '',
        role: UserRole.USER,
      });
      await user.save();
      logger.info(`New user created: ${user._id}`);
    } else {
      // 更新用户信息
      if (nickname) user.nickname = nickname;
      if (avatar) user.avatar = avatar;
      await user.save();
      logger.info(`User logged in: ${user._id}`);
    }

    // 3. 生成JWT token
    const token = generateJWT({
      userId: user._id.toString(),
      role: user.role,
    });

    // 4. 创建Session记录
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7天后过期

    const session = new Session({
      userId: user._id,
      token,
      expiresAt,
    });
    await session.save();

    // 5. 返回响应
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          nickname: user.nickname,
          avatar: user.avatar,
          role: user.role,
          storageUsed: user.storageUsed,
          storageQuota: user.storageQuota,
        },
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * 获取用户信息接口
 * GET /api/v1/auth/userinfo
 */
export const getUserInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore - userId is added by auth middleware
    const userId = req.userId;

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        nickname: user.nickname,
        avatar: user.avatar,
        role: user.role,
        status: user.status,
        storageUsed: user.storageUsed,
        storageQuota: user.storageQuota,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    logger.error('Get user info error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
