import express from 'express';
import { 
  uploadFile, 
  uploadMiddleware,
  getFileList,
  getFileDetail,
  downloadFile,
  deleteFile,
  renameFile,
  setFilePermissions,
  getFilePermissions,
  createFolder,
  deleteFolder,
  renameFolder,
  moveFile
} from '../controllers/fileController';
import { verifyToken } from '../middleware/auth';

const router = express.Router();

// 文件上传（需要认证）
router.post('/upload', verifyToken, uploadMiddleware, uploadFile);

// 文件列表查询（需要认证）
router.get('/', verifyToken, getFileList);

// 文件详情查询（需要认证）
router.get('/:fileId', verifyToken, getFileDetail);

// 文件下载（需要认证）
router.get('/:fileId/download', verifyToken, downloadFile);

// 文件删除（需要认证）
router.delete('/:fileId', verifyToken, deleteFile);

// 文件重命名（需要认证）
router.put('/:fileId/rename', verifyToken, renameFile);

// 文件权限管理（需要认证）
router.get('/:fileId/permissions', verifyToken, getFilePermissions);
router.put('/:fileId/permissions', verifyToken, setFilePermissions);

// 文件夹管理（需要认证）
router.post('/folder', verifyToken, createFolder);
router.delete('/folder/:folderId', verifyToken, deleteFolder);
router.put('/folder/:folderId/rename', verifyToken, renameFolder);

// 文件移动（需要认证）
router.put('/:fileId/move', verifyToken, moveFile);

export default router;
