import { View, Text, Button, Image, Input } from '@tarojs/components';
import { useState } from 'react';
import Taro from '@tarojs/taro';
import { useUserStore } from '../../store/userStore';
import { login } from '../../utils/request';
import { navigateAfterLogin } from '../../utils/auth';
import './index.scss';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState('');
  const { login: setUserLogin } = useUserStore();

  // 选择头像
  const handleChooseAvatar = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
      });
      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        setAvatar(res.tempFilePaths[0]);
      }
    } catch (error) {
      console.log('选择头像失败:', error);
    }
  };

  const handleLogin = async () => {
    if (!nickname.trim()) {
      Taro.showToast({
        title: '请输入昵称',
        icon: 'none',
      });
      return;
    }

    setLoading(true);
    try {
      // 1. 调用微信登录获取 code
      const loginRes = await Taro.login();

      if (!loginRes.code) {
        Taro.showToast({
          title: '获取登录凭证失败',
          icon: 'error',
        });
        setLoading(false);
        return;
      }

      // 2. 使用用户输入的昵称和头像
      const userNickname = nickname.trim() || '微信用户';
      const userAvatar = avatar || '';

      // 3. 调用后端登录接口
      const response = await login(loginRes.code, userNickname, userAvatar);

      if (response.success) {
        // 保存用户信息和 token
        setUserLogin(response.data.user, response.data.token);

        Taro.showToast({
          title: '登录成功',
          icon: 'success',
        });

        // 跳转到文件列表页
        setTimeout(() => {
          navigateAfterLogin();
        }, 1500);
      } else {
        Taro.showToast({
          title: response.message || '登录失败',
          icon: 'error',
        });
      }
    } catch (error) {
      console.error('登录错误:', error);
      Taro.showToast({
        title: '登录失败，请重试',
        icon: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className='login-container'>
      <View className='login-content'>
        <Image
          className='logo'
          src='https://img.icons8.com/clouds/200/000000/cloud-storage.png'
          mode='aspectFit'
        />
        <Text className='title'>NAS 文件管理系统</Text>
        <Text className='subtitle'>安全 · 便捷 · 高效</Text>

        <View className='user-info-form'>
          <View className='avatar-section' onClick={handleChooseAvatar}>
            {avatar ? (
              <Image className='avatar-preview' src={avatar} mode='aspectFill' />
            ) : (
              <View className='avatar-placeholder'>
                <Text className='avatar-icon'>📷</Text>
                <Text className='avatar-text'>点击选择头像</Text>
              </View>
            )}
          </View>

          <View className='nickname-section'>
            <Input
              className='nickname-input'
              type='text'
              placeholder='请输入昵称'
              value={nickname}
              onInput={(e) => setNickname(e.detail.value)}
              maxlength={20}
            />
          </View>
        </View>

        <View className='features'>
          <View className='feature-item'>
            <Text className='feature-icon'>📁</Text>
            <Text className='feature-text'>文件管理</Text>
          </View>
          <View className='feature-item'>
            <Text className='feature-icon'>🔗</Text>
            <Text className='feature-text'>文件分享</Text>
          </View>
          <View className='feature-item'>
            <Text className='feature-icon'>☁️</Text>
            <Text className='feature-text'>云端存储</Text>
          </View>
        </View>

        <Button
          className='login-button'
          type='primary'
          onClick={handleLogin}
          loading={loading}
          disabled={loading}
        >
          {loading ? '登录中...' : '立即登录'}
        </Button>

        <Text className='tips'>登录即表示同意用户协议和隐私政策</Text>
      </View>
    </View>
  );
}
