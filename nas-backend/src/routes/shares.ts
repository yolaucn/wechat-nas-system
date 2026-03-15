import express from 'express';
import { 
  createShare,
  accessShare,
  recordDownload,
  revokeShare,
  getShareList
} from '../controllers/shareController';
import { verifyToken, optionalAuth } from '../middleware/auth';

const router = express.Router();

// 创建分享（需要认证）
router.post('/', verifyToken, createShare);

// 访问分享（可选认证，用于内部分享）
router.get('/:shareCode', optionalAuth, accessShare);

// 记录下载
router.post('/:shareCode/download', recordDownload);

// 撤销分享（需要认证）
router.delete('/:shareId', verifyToken, revokeShare);

// 分享列表查询（需要认证）
router.get('/', verifyToken, getShareList);

export default router;
