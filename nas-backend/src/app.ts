import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase, getDatabaseStatus } from './config/database';
import logger from './utils/logger';
import localStorageService from './services/localStorage';
import authRoutes from './routes/auth';
import fileRoutes from './routes/files';
import shareRoutes from './routes/shares';
import userRoutes from './routes/userRoutes';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务（用于文件下载）
app.use('/files', express.static(localStorageService.getStoragePath()));

// API路由
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/files', fileRoutes);
app.use('/api/v1/shares', shareRoutes);
app.use('/api/v1/users', userRoutes);

// 健康检查
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'NAS Backend is running',
    database: getDatabaseStatus(),
    timestamp: new Date().toISOString(),
  });
});

// 启动服务器
if (require.main === module) {
  const startServer = async () => {
    try {
      // 连接数据库
      await connectDatabase();

      // 启动服务器
      app.listen(PORT, () => {
        logger.info(`🚀 Server is running on port ${PORT}`);
        logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
      });
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  };

  startServer();
}

export default app;
