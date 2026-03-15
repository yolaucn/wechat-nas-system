import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import logger from '../utils/logger';

const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);
const access = promisify(fs.access);

// 存储配置
const STORAGE_PATH = process.env.STORAGE_PATH || './uploads';
const FILE_BASE_URL = process.env.FILE_BASE_URL || 'http://localhost:3000/files';

/**
 * 本地文件存储服务
 */
class LocalStorageService {
  private storagePath: string;

  constructor() {
    this.storagePath = path.resolve(STORAGE_PATH);
    this.initStorage();
  }

  /**
   * 初始化存储目录
   */
  private async initStorage(): Promise<void> {
    try {
      await access(this.storagePath);
      logger.info(`Storage directory exists: ${this.storagePath}`);
    } catch {
      await mkdir(this.storagePath, { recursive: true });
      logger.info(`Storage directory created: ${this.storagePath}`);
    }
  }

  /**
   * 保存文件
   * @param file 文件对象（multer）
   * @param userId 用户ID
   * @returns 文件存储路径
   */
  async saveFile(file: Express.Multer.File, userId: string): Promise<string> {
    try {
      // 创建用户目录
      const userDir = path.join(this.storagePath, userId);
      await mkdir(userDir, { recursive: true });

      // 生成唯一文件名
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      const filename = `${timestamp}-${Math.random().toString(36).substring(7)}${ext}`;
      const filePath = path.join(userDir, filename);

      // 保存文件
      await fs.promises.writeFile(filePath, file.buffer);
      
      logger.info(`File saved: ${filePath}`);
      return path.relative(this.storagePath, filePath);
    } catch (error) {
      logger.error('Failed to save file:', error);
      throw new Error('Failed to save file');
    }
  }

  /**
   * 读取文件
   * @param relativePath 相对路径
   * @returns 文件绝对路径
   */
  async getFile(relativePath: string): Promise<string> {
    const filePath = path.join(this.storagePath, relativePath);
    
    try {
      await access(filePath);
      return filePath;
    } catch {
      throw new Error('File not found');
    }
  }

  /**
   * 删除文件
   * @param relativePath 相对路径
   */
  async deleteFile(relativePath: string): Promise<void> {
    const filePath = path.join(this.storagePath, relativePath);
    
    try {
      await unlink(filePath);
      logger.info(`File deleted: ${filePath}`);
    } catch (error) {
      logger.error('Failed to delete file:', error);
      throw new Error('Failed to delete file');
    }
  }

  /**
   * 生成文件访问URL
   * @param relativePath 相对路径
   * @returns 访问URL
   */
  generateFileUrl(relativePath: string): string {
    return `${FILE_BASE_URL}/${relativePath}`;
  }

  /**
   * 获取存储路径
   */
  getStoragePath(): string {
    return this.storagePath;
  }
}

export default new LocalStorageService();
