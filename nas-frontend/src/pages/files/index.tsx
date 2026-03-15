import { View, Text, Button, ScrollView } from '@tarojs/components';
import { useState } from 'react';
import Taro, { useLoad, usePullDownRefresh, useReachBottom, useShareAppMessage } from '@tarojs/taro';
import { useFileStore } from '../../store/fileStore';
import { getFileList as fetchFileList, uploadFile, downloadFile } from '../../utils/request';
import { requireAuth } from '../../utils/auth';
import './index.scss';

export default function Files() {
  const {
    files,
    loading,
    page,
    total,
    currentFolder,
    sortBy,
    sortOrder,
    setFiles,
    setLoading,
    setPage,
    setTotal,
    setSortBy,
    setSortOrder,
  } = useFileStore();

  const [hasMore, setHasMore] = useState(true);

  // 启用分享功能
  useShareAppMessage(() => {
    return {
      title: 'NAS文件管理系统 - 我的文件',
      path: '/pages/files/index',
      imageUrl: 'https://img.icons8.com/clouds/200/000000/cloud-storage.png',
    };
  });

  useLoad(() => {
    // 暂时注释掉登录检查，先让页面显示出来
    // if (!requireAuth()) {
    //   return;
    // }
    loadFiles(true);
  });

  // 下拉刷新
  usePullDownRefresh(() => {
    loadFiles(true).then(() => {
      Taro.stopPullDownRefresh();
    });
  });

  // 上拉加载更多
  useReachBottom(() => {
    if (!loading && hasMore) {
      loadFiles(false);
    }
  });

  const loadFiles = async (refresh: boolean = false) => {
    setLoading(true);
    try {
      const currentPage = refresh ? 1 : page + 1;
      const response = await fetchFileList({
        folder: currentFolder,
        page: currentPage,
        limit: 20,
        sortBy,
        sortOrder,
      });

      if (response.success) {
        const newFiles = response.data.files;
        if (refresh) {
          setFiles(newFiles);
        } else {
          setFiles([...files, ...newFiles]);
        }
        setPage(currentPage);
        setTotal(response.data.pagination.total);
        setHasMore(newFiles.length === 20);
      }
    } catch (error) {
      console.error('加载文件列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    try {
      const chooseResult = await Taro.chooseMessageFile({
        count: 1,
        type: 'all',
      });

      if (!chooseResult.tempFiles || chooseResult.tempFiles.length === 0) {
        return;
      }

      const file = chooseResult.tempFiles[0];

      Taro.showLoading({ title: '上传中...' });

      const response = await uploadFile(file.path, {
        folder: currentFolder,
      });

      Taro.hideLoading();

      if (response.success) {
        Taro.showToast({
          title: '上传成功',
          icon: 'success',
        });
        loadFiles(true);
      } else {
        Taro.showToast({
          title: response.message || '上传失败',
          icon: 'error',
        });
      }
    } catch (error) {
      Taro.hideLoading();
      console.error('上传失败:', error);
      Taro.showToast({
        title: '上传失败',
        icon: 'error',
      });
    }
  };

  const handleFileClick = (file: any) => {
    Taro.navigateTo({
      url: `/pages/file-detail/index?fileId=${file._id}`,
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎬';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return '📦';
    return '📁';
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString();
  };

  return (
    <View className='files-container'>
      {/* 头部 */}
      <View className='header'>
        <Text className='title'>我的文件</Text>
        <Button className='upload-btn' type='primary' size='mini' onClick={handleUpload}>
          上传
        </Button>
      </View>

      {/* 文件列表 */}
      <ScrollView className='file-list' scrollY>
        {files.length === 0 && !loading ? (
          <View className='empty'>
            <Text className='empty-icon'>📂</Text>
            <Text className='empty-text'>暂无文件</Text>
            <Button className='empty-btn' type='primary' onClick={handleUpload}>
              上传文件
            </Button>
          </View>
        ) : (
          files.map((file) => (
            <View
              key={file._id}
              className='file-item'
              onClick={() => handleFileClick(file)}
            >
              <Text className='file-icon'>{getFileIcon(file.mimeType)}</Text>
              <View className='file-info'>
                <Text className='file-name'>{file.filename}</Text>
                <View className='file-meta'>
                  <Text className='file-size'>{formatFileSize(file.size)}</Text>
                  <Text className='file-date'>{formatDate(file.createdAt)}</Text>
                </View>
              </View>
              <Text className='file-arrow'>›</Text>
            </View>
          ))
        )}

        {loading && (
          <View className='loading'>
            <Text>加载中...</Text>
          </View>
        )}

        {!loading && !hasMore && files.length > 0 && (
          <View className='no-more'>
            <Text>没有更多了</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
