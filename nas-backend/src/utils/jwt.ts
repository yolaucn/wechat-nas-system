import jwt from 'jsonwebtoken';
import logger from './logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';

export interface JWTPayload {
  userId: string;
  role: string;
}

/**
 * 生成JWT token
 */
export const generateJWT = (payload: JWTPayload): string => {
  try {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  } catch (error) {
    logger.error('Failed to generate JWT:', error);
    throw new Error('Failed to generate token');
  }
};

/**
 * 验证JWT token
 */
export const verifyJWT = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    logger.error('Failed to verify JWT:', error);
    throw new Error('Token verification failed');
  }
};

/**
 * 刷新JWT token
 */
export const refreshToken = (oldToken: string): string => {
  try {
    const decoded = verifyJWT(oldToken);
    return generateJWT({
      userId: decoded.userId,
      role: decoded.role,
    });
  } catch (error) {
    throw error;
  }
};
