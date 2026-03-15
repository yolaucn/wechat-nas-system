import { Router } from 'express';
import { getUserList, updateUserRole, updateUserStatus } from '../controllers/userController';
import { verifyToken, checkRole } from '../middleware/auth';
import { UserRole } from '../models/User';

const router = Router();

// 所有路由都需要管理员权限
router.use(verifyToken);
router.use(checkRole(UserRole.ADMIN));

// 获取用户列表
router.get('/', getUserList);

// 更新用户角色
router.put('/:userId/role', updateUserRole);

// 更新用户状态
router.put('/:userId/status', updateUserStatus);

export default router;
