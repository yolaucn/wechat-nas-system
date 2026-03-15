import mongoose, { Schema, Document } from 'mongoose';

// 文件状态枚举
export enum FileStatus {
  ACTIVE = 'active',
  DELETED = 'deleted',
}

// 权限等级枚举
export enum PermissionLevel {
  READ = 'read',
  WRITE = 'write',
  MANAGE = 'manage',
}

// 文件权限接口
export interface IFilePermission {
  userId: mongoose.Types.ObjectId;
  level: PermissionLevel;
}

// 文件接口
export interface IFile extends Document {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
  uploaderId: mongoose.Types.ObjectId;
  status: FileStatus;
  permissions: IFilePermission[];
  folder: string;
  createdAt: Date;
  updatedAt: Date;
}

// 文件Schema
const FileSchema: Schema = new Schema(
  {
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
      min: 0,
    },
    path: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    uploaderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(FileStatus),
      default: FileStatus.ACTIVE,
      index: true,
    },
    permissions: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        level: {
          type: String,
          enum: Object.values(PermissionLevel),
          required: true,
        },
      },
    ],
    folder: {
      type: String,
      default: '/',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// 创建复合索引
FileSchema.index({ uploaderId: 1, status: 1, createdAt: -1 });
FileSchema.index({ folder: 1, status: 1 });

// 实例方法：检查用户权限
FileSchema.methods.checkPermission = function (
  userId: string,
  requiredLevel: PermissionLevel
): boolean {
  // 上传者拥有所有权限
  if (this.uploaderId.toString() === userId) {
    return true;
  }

  // 检查权限列表
  const permission = this.permissions.find(
    (p: IFilePermission) => p.userId.toString() === userId
  );

  if (!permission) {
    return false;
  }

  // 权限等级：read < write < manage
  const levels = [PermissionLevel.READ, PermissionLevel.WRITE, PermissionLevel.MANAGE];
  const userLevelIndex = levels.indexOf(permission.level);
  const requiredLevelIndex = levels.indexOf(requiredLevel);

  return userLevelIndex >= requiredLevelIndex;
};

export default mongoose.model<IFile>('File', FileSchema);
