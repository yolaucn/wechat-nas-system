import Taro from '@tarojs/taro';

/**
 * 检查用户是否已登录
 */
export const isLoggedIn = (): boolean => {
  const token = Taro.getStorageSync('token');
  return !!token;
};

/**
 * 路由守卫 - 需要登录才能访问
 */
export const requireAuth = (callback?: () => void) => {
  if (!isLoggedIn()) {
    Taro.showToast({
      title: '请先登录',
      icon: 'none',
      duration: 2000,
    });
    
    setTimeout(() => {
      Taro.redirectTo({
        url: '/pages/login/index',
      });
    }, 2000);
    
    return false;
  }
  
  if (callback) {
    callback();
  }
  
  return true;
};

/**
 * 跳转到登录页
 */
export const navigateToLogin = () => {
  Taro.redirectTo({
    url: '/pages/login/index',
  });
};

/**
 * 登录成功后跳转
 */
export const navigateAfterLogin = () => {
  Taro.switchTab({
    url: '/pages/files/index',
  });
};
