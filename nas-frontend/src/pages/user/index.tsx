import { View, Text, Button, Image } from '@tarojs/components';
import Taro, { useLoad, useShareAppMessage } from '@tarojs/taro';
import { useUserStore } from '../../store/userStore';
import { getUserInfo } from '../../utils/request';
import { navigateToLogin } from '../../utils/auth';
import './index.scss';

export default function User() {
  const { user, isLoggedIn, logout, setUser, initializeFromStorage } = useUserStore();

  // 启用分享功能
  useShareAppMessage(() => {
    return {
      title: 'NAS文件管理系统 - 个人中心',
      path: '/pages/user/index',
      imageUrl: 'https://img.icons8.com/clouds/200/000000/user.png',
    };
  });

  useLoad(() => {
    // 初始化用户状态
    initializeUserState();
  });

  const initializeUserState = async () => {
    // 从本地存储初始化状态
    initializeFromStorage();
    
    // 检查本地存储的token
    const token = Taro.getStorageSync('token');
    if (!token) {
      // 没有token，显示未登录状态
      return;
    }

    // 有token，尝试获取用户信息
    await loadUserInfo();
  };

  const loadUserInfo = async () => {
    try {
      const response = await getUserInfo();
      if (response.success) {
        setUser(response.data);
      } else {
        console.error('获取用户信息失败:', response.message);
        // 如果获取用户信息失败，可能是token过期，清除登录状态
        logout();
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      // 网络错误或其他错误，清除登录状态
      logout();
    }
  };

  const handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          logout();
          Taro.showToast({
            title: '已退出登录',
            icon: 'success',
          });
          setTimeout(() => {
            navigateToLogin();
          }, 1500);
        }
      },
    });
  };

  const formatStorage = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const getStoragePercent = (): number => {
    if (!user || user.storageQuota === 0) return 0;
    return Math.round((user.storageUsed / user.storageQuota) * 100);
  };

  const getRoleName = (role: string): string => {
    const roleMap: Record<string, string> = {
      admin: '管理员',
      user: '普通用户',
      guest: '访客',
    };
    return roleMap[role] || role;
  };

  if (!isLoggedIn || !user) {
    return (
      <View className='user-container'>
        <View className='not-login'>
          <Text className='tips'>请先登录</Text>
          <Button
            className='login-btn'
            type='primary'
            onClick={() => navigateToLogin()}
          >
            去登录
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View className='user-container'>
      {/* 用户信息卡片 */}
      <View className='user-card'>
        <Image className='avatar' src={user.avatar || 'https://img.icons8.com/clouds/100/000000/user.png'} />
        <Text className='nickname'>{user.nickname}</Text>
        <Text className='role'>{getRoleName(user.role)}</Text>
      </View>

      {/* 存储空间 */}
      <View className='storage-card'>
        <View className='storage-header'>
          <Text className='storage-title'>存储空间</Text>
          <Text className='storage-percent'>{getStoragePercent()}%</Text>
        </View>
        <View className='storage-bar'>
          <View
            className='storage-bar-fill'
            style={{ width: `${getStoragePercent()}%` }}
          />
        </View>
        <View className='storage-info'>
          <Text className='storage-text'>
            已使用 {formatStorage(user.storageUsed)}
          </Text>
          <Text className='storage-text'>
            总容量 {formatStorage(user.storageQuota)}
          </Text>
        </View>
      </View>

      {/* 功能列表 */}
      <View className='menu-list'>
        <View className='menu-item' onClick={() => {
          // 切换到文件tab页面
          Taro.switchTab({ url: '/pages/files/index' });
        }}>
          <Text className='menu-icon'>📁</Text>
          <Text className='menu-text'>我的文件</Text>
          <Text className='menu-arrow'>›</Text>
        </View>
        <View className='menu-item' onClick={() => Taro.switchTab({ url: '/pages/share-list/index' })}>
          <Text className='menu-icon'>🔗</Text>
          <Text className='menu-text'>我的分享</Text>
          <Text className='menu-arrow'>›</Text>
        </View>
        {user.role === 'admin' && (
          <View className='menu-item' onClick={() => Taro.navigateTo({ url: '/pages/admin-users/index' })}>
            <Text className='menu-icon'>👥</Text>
            <Text className='menu-text'>用户管理</Text>
            <Text className='menu-arrow'>›</Text>
          </View>
        )}
        <View className='menu-item'>
          <Text className='menu-icon'>⚙️</Text>
          <Text className='menu-text'>设置</Text>
          <Text className='menu-arrow'>›</Text>
        </View>
        <View className='menu-item'>
          <Text className='menu-icon'>ℹ️</Text>
          <Text className='menu-text'>关于</Text>
          <Text className='menu-arrow'>›</Text>
        </View>
      </View>

      {/* 退出登录按钮 */}
      <View className='logout-section'>
        <Button className='logout-btn' onClick={handleLogout}>
          退出登录
        </Button>
      </View>
    </View>
  );
}
