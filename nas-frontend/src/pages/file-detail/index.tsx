import { View, Text, Button, Image } from '@tarojs/components';
import { useState } from 'react';
import Taro, { useLoad, useRouter, useShareAppMessage } from '@tarojs/taro';
import { getFileDetail, deleteFile as deleteFileApi, renameFile as renameFileApi, downloadFile, createShare } from '../../utils/request';
import './index.scss';

export default function FileDetail() {
  const router = useRouter();
  const { fileId } = router.params;
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 启用分享功能
  useShareAppMessage(() => {
    if (file) {
      return {
        title: `分享文件: ${file.filename}`,
        path: `/pages/file-detail/index?fileId=${fileId}`,
        imageUrl: file.mimeType.startsWith('image/') ? file.url : 'https://img.icons8.com/clouds/200/000000/file.png',
      };
    }
    return {
      title: 'NAS文件管理系统 - 文件详情',
      path: `/pages/file-detail/index?fileId=${fileId}`,
      imageUrl: 'https://img.icons8.com/clouds/200/000000/file.png',
    };
  });

  useLoad(() => {
    if (fileId) {
      loadFileDetail();
    }
  });

  const loadFileDetail = async () => {
    setLoading(true);
    try {
      const response = await getFileDetail(fileId!);
      if (response.success) {
        setFile(response.data);
      }
    } catch (error) {
      console.error('加载文件详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!file) return;

    try {
      const fileUrl = file.url;
      const mimeType = file.mimeType;

      // 图片预览
      if (mimeType.startsWith('image/')) {
        await Taro.previewImage({
          urls: [fileUrl],
          current: fileUrl,
        });
        return;
      }

      // 文档预览
      if (
        mimeType === 'application/pdf' ||
        mimeType.includes('word') ||
        mimeType.includes('excel') ||
        mimeType.includes('powerpoint')
      ) {
        const tempFilePath = await downloadFile(fileUrl);
        await Taro.openDocument({
          filePath: tempFilePath,
          fileType: getFileExtension(file.filename),
        });
        return;
      }

      // 其他文件提示下载
      Taro.showModal({
        title: '提示',
        content: '该文件类型暂不支持预览',
      });
    } catch (error) {
      console.error('预览失败:', error);
      Taro.showToast({
        title: '预览失败',
        icon: 'error',
      });
    }
  };

  const handleDownload = async () => {
    if (!file) return;

    try {
      const tempFilePath = await downloadFile(file.url);
      Taro.showToast({
        title: '下载成功',
        icon: 'success',
      });
    } catch (error) {
      console.error('下载失败:', error);
      Taro.showToast({
        title: '下载失败',
        icon: 'error',
      });
    }
  };

  const handleRename = () => {
    Taro.showModal({
      title: '重命名',
      editable: true,
      placeholderText: file.filename,
      success: async (res) => {
        if (res.confirm && res.content) {
          try {
            const response = await renameFileApi(fileId!, res.content);
            if (response.success) {
              Taro.showToast({
                title: '重命名成功',
                icon: 'success',
              });
              loadFileDetail();
            }
          } catch (error) {
            console.error('重命名失败:', error);
          }
        }
      },
    });
  };

  const handleShare = async () => {
    try {
      const response = await createShare({
        fileId: fileId!,
        shareType: 'public',
        expiresIn: 7 * 24 * 60 * 60, // 7天
      });

      if (response.success) {
        const shareCode = response.data.shareCode;
        Taro.showModal({
          title: '分享成功',
          content: `分享码: ${shareCode}`,
          confirmText: '复制',
          success: (res) => {
            if (res.confirm) {
              Taro.setClipboardData({
                data: shareCode,
                success: () => {
                  Taro.showToast({
                    title: '已复制',
                    icon: 'success',
                  });
                },
              });
            }
          },
        });
      }
    } catch (error) {
      console.error('分享失败:', error);
    }
  };

  const handleDelete = () => {
    Taro.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除吗？',
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (res.confirm) {
          try {
            const response = await deleteFileApi(fileId!);
            if (response.success) {
              Taro.showToast({
                title: '删除成功',
                icon: 'success',
              });
              setTimeout(() => {
                Taro.navigateBack();
              }, 1500);
            }
          } catch (error) {
            console.error('删除失败:', error);
          }
        }
      },
    });
  };

  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎬';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel')) return '📊';
    if (mimeType.includes('powerpoint')) return '📽️';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
    return '📁';
  };

  if (loading || !file) {
    return (
      <View className='file-detail-container'>
        <View className='loading'>加载中...</View>
      </View>
    );
  }

  return (
    <View className='file-detail-container'>
      {/* 文件预览区 */}
      <View className='preview-section'>
        {file.mimeType.startsWith('image/') ? (
          <Image className='preview-image' src={file.url} mode='aspectFit' />
        ) : (
          <View className='preview-icon'>
            <Text className='icon'>{getFileIcon(file.mimeType)}</Text>
          </View>
        )}
      </View>

      {/* 文件信息 */}
      <View className='info-section'>
        <Text className='filename'>{file.filename}</Text>
        <View className='info-item'>
          <Text className='info-label'>文件大小</Text>
          <Text className='info-value'>{formatFileSize(file.size)}</Text>
        </View>
        <View className='info-item'>
          <Text className='info-label'>文件类型</Text>
          <Text className='info-value'>{file.mimeType}</Text>
        </View>
        <View className='info-item'>
          <Text className='info-label'>上传时间</Text>
          <Text className='info-value'>{formatDate(file.createdAt)}</Text>
        </View>
        <View className='info-item'>
          <Text className='info-label'>修改时间</Text>
          <Text className='info-value'>{formatDate(file.updatedAt)}</Text>
        </View>
      </View>

      {/* 操作按钮 */}
      <View className='action-section'>
        <Button className='action-btn primary' onClick={handlePreview}>
          预览
        </Button>
        <Button className='action-btn' onClick={handleDownload}>
          下载
        </Button>
        <Button className='action-btn' onClick={handleShare}>
          分享
        </Button>
        <Button className='action-btn' onClick={handleRename}>
          重命名
        </Button>
        <Button className='action-btn danger' onClick={handleDelete}>
          删除
        </Button>
      </View>
    </View>
  );
}
