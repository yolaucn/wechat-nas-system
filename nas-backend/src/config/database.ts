import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

// 数据库配置接口
interface DatabaseConfig {
  uri: string;
  options: mongoose.ConnectOptions;
}

// 数据库连接配置
const config: DatabaseConfig = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/nas',
  options: {
    maxPoolSize: 10, // 连接池最大连接数
    minPoolSize: 5, // 连接池最小连接数
    socketTimeoutMS: 45000, // Socket超时时间
    serverSelectionTimeoutMS: 5000, // 服务器选择超时
    family: 4, // 使用IPv4
  },
};

// 重连配置
const RECONNECT_INTERVAL = 5000; // 5秒
const MAX_RECONNECT_ATTEMPTS = 5;
let reconnectAttempts = 0;

/**
 * 连接数据库
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(config.uri, config.options);
    logger.info('✅ MongoDB connected successfully');
    reconnectAttempts = 0; // 重置重连次数
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error);
    
    // 尝试重连
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      logger.warn(
        `Attempting to reconnect to MongoDB (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`
      );
      setTimeout(connectDatabase, RECONNECT_INTERVAL);
    } else {
      logger.error('Max reconnection attempts reached. Exiting...');
      process.exit(1);
    }
  }
};

/**
 * 断开数据库连接
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected successfully');
  } catch (error) {
    logger.error('MongoDB disconnection error:', error);
  }
};

/**
 * 获取数据库连接状态
 */
export const getDatabaseStatus = (): string => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return states[mongoose.connection.readyState] || 'unknown';
};

// 监听连接事件
mongoose.connection.on('connected', () => {
  logger.info('MongoDB connection established');
});

mongoose.connection.on('error', (error) => {
  logger.error('MongoDB connection error:', error);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
  
  // 自动重连
  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    reconnectAttempts++;
    logger.info(
      `Attempting to reconnect to MongoDB (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`
    );
    setTimeout(connectDatabase, RECONNECT_INTERVAL);
  }
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected successfully');
  reconnectAttempts = 0;
});

// 优雅关闭
process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

export default mongoose;
