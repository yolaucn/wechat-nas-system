import mongoose, { Schema, Document } from 'mongoose';

// 用户角色枚举
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
}

// 用户状态枚举
export enum UserStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
}

// 用户接口
export interface IUser extends Document {
  openid: string;
  nickname?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  storageUsed: number;
  storageQuota: number;
  createdAt: Date;
  updatedAt: Date;
  // 实例方法
  hasEnoughStorage(fileSize: number): boolean;
  updateStorageUsed(delta: number): Promise<void>;
}

// 用户Schema
const UserSchema: Schema = new Schema(
  {
    openid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    nickname: {
      type: String,
      default: '微信用户',
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.ACTIVE,
      index: true,
    },
    storageUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    storageQuota: {
      type: Number,
      default: 1073741824, // 1GB = 1024 * 1024 * 1024
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// 创建复合索引
UserSchema.index({ role: 1, status: 1 });

// 实例方法：检查存储空间是否足够
UserSchema.methods.hasEnoughStorage = function (fileSize: number): boolean {
  return this.storageUsed + fileSize <= this.storageQuota;
};

// 实例方法：更新存储使用量
UserSchema.methods.updateStorageUsed = async function (
  delta: number
): Promise<void> {
  this.storageUsed += delta;
  if (this.storageUsed < 0) {
    this.storageUsed = 0;
  }
  await this.save();
};

export default mongoose.model<IUser>('User', UserSchema);
