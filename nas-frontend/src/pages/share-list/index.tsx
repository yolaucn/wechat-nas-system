import { View, Text, Button, ScrollView } from '@tarojs/components';
import { useState } from 'react';
import Taro, { useLoad, usePullDownRefresh, useShareAppMessage } from '@tarojs/taro';
import { useShareStore } from '../../store/shareStore';
import { getShareList as fetchShareList, revokeShare as revokeShareApi } from '../../utils/request';
import { requireAuth } from '../../utils/auth';
import './index.scss';

export default function ShareList() {
  const { shares, loading, setShares, setLoading, removeShare } = useShareStore();

  // 启用分享功能
  useShareAppMessage(() => {
    return {
      title: 'NAS文件管理系统 - 我的分享',
      path: '/pages/share-list/index',
      imageUrl: 'https://img.icons8.com/clouds/200/000000/share.png',
    };
  });

  useLoad(() => {
    // 暂时注释掉登录检查
    // if (!requireAuth()) {
    //   return;
    // }
    loadShares();
  });

  usePullDownRefresh(() => {
    loadShares().then(() => {
      Taro.stopPullDownRefresh();
    });
  });

  const loadShares = async () => {
    setLoading(true);
    try {
      const response = await fetchShareList({
        status: 'active',
        page: 1,
        limit: 50,
      });

      if (response.success) {
        setShares(response.data.shares);
      }
    } catch (error) {
      console.error('加载分享列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyShareCode = (shareCode: string) => {
    Taro.setClipboardData({
      data: shareCode,
      success: () => {
        Taro.showToast({
          title: '已复制分享码',
          icon: 'success',
        });
      },
    });
  };

  const handleRevoke = (shareId: string) => {
    Taro.showModal({
      title: '确认撤销',
      content: '撤销后分享链接将失效，确定要撤销吗？',
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (res.confirm) {
          try {
            const response = await revokeShareApi(shareId);
            if (response.success) {
              Taro.showToast({
                title: '撤销成功',
                icon: 'success',
              });
              removeShare(shareId);
            }
          } catch (error) {
            console.error('撤销失败:', error);
          }
        }
      },
    });
  };

  const getShareTypeText = (type: string): string => {
    const typeMap: Record<string, string> = {
      public: '公开',
      password: '密码',
      internal: '内部',
    };
    return typeMap[type] || type;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  const isExpired = (expiresAt?: string): boolean => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <View className='share-list-container'>
      {/* 头部 */}
      <View className='header'>
        <Text className='title'>我的分享</Text>
      </View>

      {/* 分享列表 */}
      <ScrollView className='share-list' scrollY>
        {shares.length === 0 && !loading ? (
          <View className='empty'>
            <Text className='empty-icon'>🔗</Text>
            <Text className='empty-text'>暂无分享</Text>
          </View>
        ) : (
          shares.map((share) => (
            <View key={share._id} className='share-item'>
              <View className='share-header'>
                <Text className='file-name'>
                  {share.fileId?.filename || '未知文件'}
                </Text>
                <View className={`share-type ${share.shareType}`}>
                  <Text className='type-text'>{getShareTypeText(share.shareType)}</Text>
                </View>
              </View>

              <View className='share-code-section'>
                <Text className='share-code'>{share.shareCode}</Text>
                <Button
                  className='copy-btn'
                  size='mini'
                  onClick={() => handleCopyShareCode(share.shareCode)}
                >
                  复制
                </Button>
              </View>

              <View className='share-info'>
                <View className='info-row'>
                  <Text className='info-label'>访问次数</Text>
                  <Text className='info-value'>{share.accessCount}</Text>
                </View>
                <View className='info-row'>
                  <Text className='info-label'>下载次数</Text>
                  <Text className='info-value'>
                    {share.downloadCount}
                    {share.downloadLimit ? ` / ${share.downloadLimit}` : ''}
                  </Text>
                </View>
                {share.expiresAt && (
                  <View className='info-row'>
                    <Text className='info-label'>过期时间</Text>
                    <Text className={`info-value ${isExpired(share.expiresAt) ? 'expired' : ''}`}>
                      {formatDate(share.expiresAt)}
                      {isExpired(share.expiresAt) && ' (已过期)'}
                    </Text>
                  </View>
                )}
              </View>

              <View className='share-actions'>
                <Button
                  className='revoke-btn'
                  size='mini'
                  onClick={() => handleRevoke(share._id)}
                >
                  撤销分享
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
