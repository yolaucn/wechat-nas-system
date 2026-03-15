import mongoose, { Schema, Document } from 'mongoose';

// Session接口
export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// SessionSchema
const SessionSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// 创建TTL索引，自动清理过期会话
// MongoDB会在expiresAt时间后自动删除文档
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// 实例方法：检查session是否有效
SessionSchema.methods.isValid = function (): boolean {
  return this.expiresAt > new Date();
};

export default mongoose.model<ISession>('Session', SessionSchema);
