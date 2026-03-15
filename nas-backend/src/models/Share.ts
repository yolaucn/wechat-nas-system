import mongoose, { Schema, Document } from 'mongoose';

// 分享类型枚举
export enum ShareType {
  PUBLIC = 'public',
  PASSWORD = 'password',
  INTERNAL = 'internal',
}

// 分享状态枚举
export enum ShareStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

// 分享接口
export interface IShare extends Document {
  fileId: mongoose.Types.ObjectId;
  sharerId: mongoose.Types.ObjectId;
  shareCode: string;
  shareType: ShareType;
  password?: string;
  expiresAt?: Date;
  downloadLimit?: number;
  downloadCount: number;
  accessCount: number;
  status: ShareStatus;
  allowedUserIds?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

// 分享Schema
const ShareSchema: Schema = new Schema(
  {
    fileId: {
      type: Schema.Types.ObjectId,
      ref: 'File',
      required: true,
      index: true,
    },
    sharerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    shareCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    shareType: {
      type: String,
      enum: Object.values(ShareType),
      required: true,
    },
    password: {
      type: String,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
    downloadLimit: {
      type: Number,
      min: 0,
    },
    downloadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    accessCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(ShareStatus),
      default: ShareStatus.ACTIVE,
      index: true,
    },
    allowedUserIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// 创建复合索引
ShareSchema.index({ status: 1, expiresAt: 1 });
ShareSchema.index({ sharerId: 1, status: 1 });

// 实例方法：检查分享是否有效
ShareSchema.methods.isValid = function (): boolean {
  if (this.status !== ShareStatus.ACTIVE) {
    return false;
  }

  // 检查是否过期
  if (this.expiresAt && this.expiresAt < new Date()) {
    return false;
  }

  // 检查下载次数限制
  if (this.downloadLimit && this.downloadCount >= this.downloadLimit) {
    return false;
  }

  return true;
};

// 实例方法：检查用户是否有访问权限
ShareSchema.methods.canAccess = function (userId?: string): boolean {
  if (!this.isValid()) {
    return false;
  }

  // 公开分享
  if (this.shareType === ShareType.PUBLIC) {
    return true;
  }

  // 密码分享（需要在控制器中验证密码）
  if (this.shareType === ShareType.PASSWORD) {
    return true;
  }

  // 内部分享
  if (this.shareType === ShareType.INTERNAL) {
    if (!userId) {
      return false;
    }
    return this.allowedUserIds?.some((id: mongoose.Types.ObjectId) => id.toString() === userId) || false;
  }

  return false;
};

// 实例方法：增加下载次数
ShareSchema.methods.incrementDownloadCount = async function (): Promise<void> {
  this.downloadCount += 1;
  await this.save();
};

export default mongoose.model<IShare>('Share', ShareSchema);
