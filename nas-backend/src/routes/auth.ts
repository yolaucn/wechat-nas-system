import express from 'express';
import { login, getUserInfo } from '../controllers/authController';
import { verifyToken } from '../middleware/auth';

const router = express.Router();

// 微信登录
router.post('/login', login);

// 获取用户信息（需要认证）
router.get('/userinfo', verifyToken, getUserInfo);

export default router;
