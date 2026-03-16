import Taro from '@tarojs/taro';

// API 基础地址配置
// 使用简单的环境判断
const getApiBaseUrl = () => {
  // 检查是否在生产环境
  if (process.env.NODE_ENV === 'production') {
    console.log('Using production API URL');
    return 'https://nas.okdev.ink/api/v1';
  }
  
  console.log('Using development API URL');
  return 'http://localhost:3000/api/v1';
};

const API_BASE_URL = getApiBaseUrl();
console.log('Final API_BASE_URL:', API_BASE_URL);

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  header?: any;
  retry?: number; // 重试次数
  showLoading?: boolean; // 是否显示加载提示
  showError?: boolean; // 是否显示错误提示
}

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * 封装的请求函数
 */
export const request = async <T = any>(
  url: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> => {
  const {
    method = 'GET',
    data,
    header = {},
    retry = 0,
    showLoading = false,
    showError = true,
  } = options;

  // 显示加载提示
  if (showLoading) {
    Taro.showLoading({ title: '加载中...' });
  }

  // 获取token
  const token = Taro.getStorageSync('token');
  if (token) {
    header.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await Taro.request({
      url: `${API_BASE_URL}${url}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...header,
      },
    });

    if (showLoading) {
      Taro.hideLoading();
    }

    // 处理成功响应
    if (response.statusCode === 200 || response.statusCode === 201) {
      return response.data as ApiResponse<T>;
    }

    // 处理认证错误
    if (response.statusCode === 401) {
      if (showError) {
        Taro.showToast({
          title: '请先登录',
          icon: 'none',
        });
      }
      // 清除token并跳转到登录页
      Taro.removeStorageSync('token');
      // TODO: 跳转到登录页
      throw new Error('Unauthorized');
    }

    // 处理其他错误
    const errorMessage = response.data?.message || '请求失败';
    if (showError) {
      Taro.showToast({
        title: errorMessage,
        icon: 'none',
      });
    }
    throw new Error(errorMessage);
  } catch (error) {
    if (showLoading) {
      Taro.hideLoading();
    }

    // 网络错误重试
    if (retry > 0 && error instanceof Error && error.message.includes('request:fail')) {
      console.log(`Request failed, retrying... (${retry} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 等待1秒后重试
      return request<T>(url, { ...options, retry: retry - 1 });
    }

    // 显示错误提示
    if (showError) {
      const errorMessage = error instanceof Error ? error.message : '网络请求失败';
      Taro.showToast({
        title: errorMessage,
        icon: 'none',
      });
    }

    console.error('Request error:', error);
    throw error;
  }
};

/**
 * 文件上传
 */
export const uploadFile = async (
  filePath: string,
  formData: Record<string, any> = {}
): Promise<ApiResponse> => {
  const token = Taro.getStorageSync('token');

  try {
    const response = await Taro.uploadFile({
      url: `${API_BASE_URL}/files/upload`,
      filePath,
      name: 'file',
      header: {
        Authorization: `Bearer ${token}`,
      },
      formData,
    });

    const data = JSON.parse(response.data);
    return data;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

/**
 * 文件下载
 */
export const downloadFile = async (fileUrl: string): Promise<string> => {
  const token = Taro.getStorageSync('token');

  try {
    Taro.showLoading({ title: '下载中...' });

    const response = await Taro.downloadFile({
      url: fileUrl,
      header: {
        Authorization: `Bearer ${token}`,
      },
    });

    Taro.hideLoading();

    if (response.statusCode === 200) {
      return response.tempFilePath;
    } else {
      throw new Error('下载失败');
    }
  } catch (error) {
    Taro.hideLoading();
    console.error('Download error:', error);
    throw error;
  }
};

// ==================== 认证相关 API ====================

/**
 * 登录接口
 */
export const login = async (code: string, nickname?: string, avatar?: string) => {
  return request('/auth/login', {
    method: 'POST',
    data: { code, nickname, avatar },
    showError: true,
  });
};

/**
 * 获取用户信息
 */
export const getUserInfo = async () => {
  return request('/auth/userinfo', {
    method: 'GET',
  });
};

// ==================== 文件相关 API ====================

/**
 * 获取文件列表
 */
export const getFileList = async (params: {
  folder?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
  const query = new URLSearchParams(params as any).toString();
  return request(`/files?${query}`, {
    method: 'GET',
  });
};

/**
 * 获取文件详情
 */
export const getFileDetail = async (fileId: string) => {
  return request(`/files/${fileId}`, {
    method: 'GET',
  });
};

/**
 * 删除文件
 */
export const deleteFile = async (fileId: string) => {
  return request(`/files/${fileId}`, {
    method: 'DELETE',
    showLoading: true,
  });
};

/**
 * 重命名文件
 */
export const renameFile = async (fileId: string, filename: string) => {
  return request(`/files/${fileId}/rename`, {
    method: 'PUT',
    data: { filename },
    showLoading: true,
  });
};

// ==================== 分享相关 API ====================

/**
 * 创建分享
 */
export const createShare = async (params: {
  fileId: string;
  shareType?: 'public' | 'password' | 'internal';
  password?: string;
  expiresIn?: number;
  downloadLimit?: number;
}) => {
  return request('/shares', {
    method: 'POST',
    data: params,
    showLoading: true,
  });
};

/**
 * 访问分享
 */
export const accessShare = async (shareCode: string, password?: string) => {
  const query = password ? `?password=${password}` : '';
  return request(`/shares/${shareCode}${query}`, {
    method: 'GET',
  });
};

/**
 * 撤销分享
 */
export const revokeShare = async (shareId: string) => {
  return request(`/shares/${shareId}`, {
    method: 'DELETE',
    showLoading: true,
  });
};

/**
 * 获取分享列表
 */
export const getShareList = async (params: {
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const query = new URLSearchParams(params as any).toString();
  return request(`/shares?${query}`, {
    method: 'GET',
  });
};


// ==================== 文件夹管理相关 API ====================

/**
 * 创建文件夹
 */
export const createFolder = async (folderName: string, parentPath: string = '/') => {
  return request('/files/folder', {
    method: 'POST',
    data: { folderName, parentPath },
    showLoading: true,
  });
};

/**
 * 删除文件夹
 */
export const deleteFolder = async (folderId: string) => {
  return request(`/files/folder/${folderId}`, {
    method: 'DELETE',
    showLoading: true,
  });
};

/**
 * 重命名文件夹
 */
export const renameFolder = async (folderId: string, folderName: string) => {
  return request(`/files/folder/${folderId}/rename`, {
    method: 'PUT',
    data: { folderName },
    showLoading: true,
  });
};

/**
 * 移动文件到文件夹
 */
export const moveFile = async (fileId: string, targetFolder: string) => {
  return request(`/files/${fileId}/move`, {
    method: 'PUT',
    data: { targetFolder },
    showLoading: true,
  });
};