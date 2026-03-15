import { View, Text, Button, Picker, ScrollView } from '@tarojs/components';
import { useState } from 'react';
import Taro, { useLoad, useShareAppMessage } from '@tarojs/taro';
import { request } from '../../utils/request';
import './index.scss';

interface User {
  _id: string;
  nickname: string;
  avatar: string;
  role: string;
  status: string;
  storageUsed: number;
  storageQuota: number;
  createdAt: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const roleOptions = ['全部', '管理员', '普通用户', '访客'];
  const roleValues = ['', 'admin', 'user', 'guest'];
  const statusOptions = ['全部', '正常', '禁用'];
  const statusValues = ['', 'active', 'disabled'];

  // 启用分享功能
  useShareAppMessage(() => {
    return {
      title: 'NAS文件管理系统 - 用户管理',
      path: '/pages/admin-users/index',
    };
  });

  useLoad(() => {
    loadUsers();
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;

      const response = await request('/users', {
        method: 'GET',
        data: params,
      });

      if (response.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('加载用户列表失败:', error);
      Taro.showToast({
        title: '加载失败',
        icon: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (e: any) => {
    const index = e.detail.value;
    setRoleFilter(roleValues[index]);
    setTimeout(() => loadUsers(), 100);
  };

  const handleStatusChange = (e: any) => {
    const index = e.detail.value;
    setStatusFilter(statusValues[index]);
    setTimeout(() => loadUsers(), 100);
  };

  const handleChangeRole = (user: User) => {
    const roles = ['admin', 'user', 'guest'];
    const roleNames = ['管理员', '普通用户', '访客'];
    const currentIndex = roles.indexOf(user.role);

    Taro.showActionSheet({
      itemList: roleNames,
      success: async (res) => {
        const newRole = roles[res.tapIndex];
        if (newRole === user.role) return;

        try {
          const response = await request(`/users/${user._id}/role`, {
            method: 'PUT',
            data: { role: newRole },
          });

          if (response.success) {
            Taro.showToast({
              title: '角色已更新',
              icon: 'success',
            });
            loadUsers();
          }
        } catch (error: any) {
          Taro.showToast({
            title: error.message || '更新失败',
            icon: 'error',
          });
        }
      },
    });
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'active' ? 'disabled' : 'active';
    const action = newStatus === 'disabled' ? '禁用' : '启用';

    Taro.showModal({
      title: '确认操作',
      content: `确定要${action}用户 ${user.nickname} 吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            const response = await request(`/users/${user._id}/status`, {
              method: 'PUT',
              data: { status: newStatus },
            });

            if (response.success) {
              Taro.showToast({
                title: `已${action}`,
                icon: 'success',
              });
              loadUsers();
            }
          } catch (error: any) {
            Taro.showToast({
              title: error.message || '操作失败',
              icon: 'error',
            });
          }
        }
      },
    });
  };

  const getRoleName = (role: string): string => {
    const roleMap: Record<string, string> = {
      admin: '管理员',
      user: '普通用户',
      guest: '访客',
    };
    return roleMap[role] || role;
  };

  const getStatusName = (status: string): string => {
    return status === 'active' ? '正常' : '禁用';
  };

  const formatStorage = (bytes: number): string => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  return (
    <View className='admin-users-container'>
      {/* 头部 */}
      <View className='header'>
        <Text className='title'>用户管理</Text>
      </View>

      {/* 筛选器 */}
      <View className='filters'>
        <View className='filter-item'>
          <Text className='filter-label'>角色：</Text>
          <Picker mode='selector' range={roleOptions} onChange={handleRoleChange}>
            <View className='picker'>
              <Text>{roleOptions[roleValues.indexOf(roleFilter)]}</Text>
            </View>
          </Picker>
        </View>
        <View className='filter-item'>
          <Text className='filter-label'>状态：</Text>
          <Picker mode='selector' range={statusOptions} onChange={handleStatusChange}>
            <View className='picker'>
              <Text>{statusOptions[statusValues.indexOf(statusFilter)]}</Text>
            </View>
          </Picker>
        </View>
      </View>

      {/* 用户列表 */}
      <ScrollView className='user-list' scrollY>
        {users.length === 0 && !loading ? (
          <View className='empty'>
            <Text className='empty-icon'>👥</Text>
            <Text className='empty-text'>暂无用户</Text>
          </View>
        ) : (
          users.map((user) => (
            <View key={user._id} className='user-item'>
              <View className='user-header'>
                <Text className='user-name'>{user.nickname}</Text>
                <View className={`user-role ${user.role}`}>
                  <Text className='role-text'>{getRoleName(user.role)}</Text>
                </View>
                <View className={`user-status ${user.status}`}>
                  <Text className='status-text'>{getStatusName(user.status)}</Text>
                </View>
              </View>

              <View className='user-info'>
                <View className='info-row'>
                  <Text className='info-label'>存储使用</Text>
                  <Text className='info-value'>
                    {formatStorage(user.storageUsed)} / {formatStorage(user.storageQuota)}
                  </Text>
                </View>
                <View className='info-row'>
                  <Text className='info-label'>注册时间</Text>
                  <Text className='info-value'>{formatDate(user.createdAt)}</Text>
                </View>
              </View>

              <View className='user-actions'>
                <Button
                  className='action-btn'
                  size='mini'
                  onClick={() => handleChangeRole(user)}
                >
                  更改角色
                </Button>
                <Button
                  className={`action-btn ${user.status === 'active' ? 'danger' : 'primary'}`}
                  size='mini'
                  onClick={() => handleToggleStatus(user)}
                >
                  {user.status === 'active' ? '禁用' : '启用'}
                </Button>
              </View>
            </View>
          ))
        )}

        {loading && (
          <View className='loading'>
            <Text>加载中...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
