import { View, Text, Button, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro, { useLoad, usePullDownRefresh, useReachBottom, useShareAppMessage } from '@tarojs/taro';
import { useFileStore } from '../../store/fileStore';
import { useUserStore } from '../../store/userStore';
import { 
  getFileList as fetchFileList, 
  uploadFile, 
  deleteFile, 
  renameFile,
  createFolder,
  deleteFolder,
  renameFolder,
  moveFile
} from '../../utils/request';
import { requireAuth } from '../../utils/auth';
import './index.scss';

export default function Files() {
  const {
    files,
    loading,
    page,
    currentFolder,
    sortBy,
    sortOrder,
    setFiles,
    setLoading,
    setPage,
    setTotal,
    setSortBy,
    setSortOrder,
    navigateToFolder,
    navigateUp,
  } = useFileStore();

  const { user, initializeFromStorage } = useUserStore();
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
    // 初始化用户状态
    initializeFromStorage();
    
    // 检查登录状态
    if (!requireAuth()) {
      return;
    }
    // 重置到根目录并加载文件
    navigateToFolder('/');
    loadFiles(true);
  });

  // 监听当前文件夹变化，自动加载文件
  useEffect(() => {
    if (currentFolder !== undefined) {
      loadFiles(true);
    }
  }, [currentFolder]);

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
      Taro.showToast({
        title: '加载文件失败',
        icon: 'error',
      });
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
    if (file.mimeType === 'folder') {
      // 点击文件夹，进入文件夹
      let folderPath = file.path;
      
      // 如果 file.path 不存在，构建路径
      if (!folderPath) {
        if (currentFolder === '/') {
          folderPath = `/${file.filename}`;
        } else {
          folderPath = `${currentFolder}/${file.filename}`;
        }
      }
      
      // 确保路径格式正确
      if (!folderPath.startsWith('/')) {
        folderPath = '/' + folderPath;
      }
      
      navigateToFolder(folderPath);
      // useEffect 会自动监听 currentFolder 变化并加载文件
    } else {
      // 点击文件，查看详情
      Taro.navigateTo({
        url: `/pages/file-detail/index?fileId=${file._id}`,
      });
    }
  };

  const handleFileLongPress = (file: any) => {
    const isAdmin = user?.role === 'admin';
    const canEdit = file.canEdit || isAdmin;
    const canDelete = file.canDelete || isAdmin;
    
    let itemList = ['查看详情'];
    
    if (file.mimeType === 'folder') {
      // 文件夹操作
      if (canEdit) {
        itemList.push('重命名');
      }
      if (canDelete) {
        itemList.push('删除');
      }
    } else {
      // 文件操作
      if (canEdit) {
        itemList.push('重命名');
      }
      if (file.canShare) {
        itemList.push('分享');
      }
      if (isAdmin) {
        itemList.push('移动');
      }
      if (canDelete) {
        itemList.push('删除');
      }
    }

    Taro.showActionSheet({
      itemList,
      success: (res) => {
        const action = itemList[res.tapIndex];
        switch (action) {
          case '查看详情':
            handleFileClick(file);
            break;
          case '重命名':
            if (file.mimeType === 'folder') {
              handleFolderRename(file);
            } else {
              handleRename(file);
            }
            break;
          case '分享':
            handleShare(file);
            break;
          case '移动':
            handleMove(file);
            break;
          case '删除':
            if (file.mimeType === 'folder') {
              handleFolderDelete(file);
            } else {
              handleDelete(file);
            }
            break;
        }
      }
    });
  };

  const handleRename = (file: any) => {
    // 使用 actionSheet 提供一些预设选项
    Taro.showActionSheet({
      itemList: [`重命名为: ${file.filename}_new`, `重命名为: ${file.filename}_copy`, '自定义重命名'],
      success: async (res) => {
        let newName = '';
        
        switch (res.tapIndex) {
          case 0:
            newName = `${file.filename}_new`;
            break;
          case 1:
            newName = `${file.filename}_copy`;
            break;
          case 2:
            // 自定义名称，添加时间戳
            newName = `${file.filename}_${Date.now()}`;
            break;
        }

        if (newName) {
          try {
            const response = await renameFile(file._id, newName);
            if (response.success) {
              Taro.showToast({
                title: '重命名成功',
                icon: 'success',
              });
              loadFiles(true);
            } else {
              Taro.showToast({
                title: response.message || '重命名失败',
                icon: 'error',
              });
            }
          } catch (error) {
            console.error('重命名失败:', error);
            Taro.showToast({
              title: '重命名失败',
              icon: 'error',
            });
          }
        }
      }
    });
  };

  const handleShare = (file: any) => {
    Taro.navigateTo({
      url: `/pages/share-create/index?fileId=${file._id}`,
    });
  };

  const handleDelete = (file: any) => {
    Taro.showModal({
      title: '确认删除',
      content: `确定要删除文件"${file.filename}"吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            const response = await deleteFile(file._id);
            if (response.success) {
              Taro.showToast({
                title: '删除成功',
                icon: 'success',
              });
              loadFiles(true);
            } else {
              Taro.showToast({
                title: response.message || '删除失败',
                icon: 'error',
              });
            }
          } catch (error) {
            console.error('删除失败:', error);
            Taro.showToast({
              title: '删除失败',
              icon: 'error',
            });
          }
        }
      }
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const getFileIcon = (mimeType: string): string => {
    if (mimeType === 'folder') return '📁';
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

  // 文件夹管理函数
  const handleCreateFolder = () => {
    if (user?.role !== 'admin') {
      Taro.showToast({
        title: '只有管理员可以创建文件夹',
        icon: 'none',
      });
      return;
    }

    // 使用 actionSheet 让用户选择预设的文件夹名称
    Taro.showActionSheet({
      itemList: ['documents', 'images', 'videos', '自定义名称'],
      success: async (res) => {
        let folderName = '';
        
        switch (res.tapIndex) {
          case 0:
            folderName = 'documents';
            break;
          case 1:
            folderName = 'images';
            break;
          case 2:
            folderName = 'videos';
            break;
          case 3:
            // 自定义名称，使用时间戳
            folderName = `新建文件夹_${Date.now()}`;
            break;
        }

        if (folderName) {
          try {
            const response = await createFolder(folderName, currentFolder);
            if (response.success) {
              Taro.showToast({
                title: '创建成功',
                icon: 'success',
              });
              loadFiles(true);
            } else {
              Taro.showToast({
                title: response.message || '创建失败',
                icon: 'error',
              });
            }
          } catch (error) {
            console.error('创建文件夹失败:', error);
            Taro.showToast({
              title: '创建失败',
              icon: 'error',
            });
          }
        }
      }
    });
  };

  const handleFolderRename = (folder: any) => {
    Taro.showActionSheet({
      itemList: [`重命名为: ${folder.filename}_new`, `重命名为: ${folder.filename}_backup`, '自定义重命名'],
      success: async (res) => {
        let newName = '';
        
        switch (res.tapIndex) {
          case 0:
            newName = `${folder.filename}_new`;
            break;
          case 1:
            newName = `${folder.filename}_backup`;
            break;
          case 2:
            newName = `${folder.filename}_${Date.now()}`;
            break;
        }

        if (newName) {
          try {
            const response = await renameFolder(folder._id, newName);
            if (response.success) {
              Taro.showToast({
                title: '重命名成功',
                icon: 'success',
              });
              loadFiles(true);
            } else {
              Taro.showToast({
                title: response.message || '重命名失败',
                icon: 'error',
              });
            }
          } catch (error) {
            console.error('重命名文件夹失败:', error);
            Taro.showToast({
              title: '重命名失败',
              icon: 'error',
            });
          }
        }
      }
    });
  };

  const handleFolderDelete = (folder: any) => {
    Taro.showModal({
      title: '确认删除',
      content: `确定要删除文件夹"${folder.filename}"吗？只能删除空文件夹。`,
      success: async (res) => {
        if (res.confirm) {
          try {
            const response = await deleteFolder(folder._id);
            if (response.success) {
              Taro.showToast({
                title: '删除成功',
                icon: 'success',
              });
              loadFiles(true);
            } else {
              Taro.showToast({
                title: response.message || '删除失败',
                icon: 'error',
              });
            }
          } catch (error) {
            console.error('删除文件夹失败:', error);
            Taro.showToast({
              title: '删除失败',
              icon: 'error',
            });
          }
        }
      }
    });
  };

  const handleMove = (file: any) => {
    Taro.showModal({
      title: '移动文件',
      content: '选择移动到根目录还是documents文件夹？',
      confirmText: 'documents',
      cancelText: '根目录',
      success: async (res) => {
        const targetFolder = res.confirm ? '/documents' : '/';
        try {
          const response = await moveFile(file._id, targetFolder);
          if (response.success) {
            Taro.showToast({
              title: '移动成功',
              icon: 'success',
            });
            loadFiles(true);
          } else {
            Taro.showToast({
              title: response.message || '移动失败',
              icon: 'error',
            });
          }
        } catch (error) {
          console.error('移动文件失败:', error);
          Taro.showToast({
            title: '移动失败',
            icon: 'error',
          });
        }
      }
    });
  };

  const handleSort = () => {
    Taro.showActionSheet({
      itemList: ['按名称排序', '按大小排序', '按时间排序'],
      success: (res) => {
        let newSortBy = sortBy;
        switch (res.tapIndex) {
          case 0:
            newSortBy = 'filename';
            break;
          case 1:
            newSortBy = 'size';
            break;
          case 2:
            newSortBy = 'createdAt';
            break;
        }
        
        // 如果是同一个排序字段，切换排序顺序
        const newSortOrder = (newSortBy === sortBy && sortOrder === 'asc') ? 'desc' : 'asc';
        
        setSortBy(newSortBy);
        setSortOrder(newSortOrder);
        loadFiles(true);
      }
    });
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
        <View className='header-actions'>
          <Button className='sort-btn' size='mini' onClick={handleSort}>
            排序
          </Button>
          {user?.role === 'admin' && (
            <Button className='folder-btn' size='mini' onClick={handleCreateFolder}>
              新建文件夹
            </Button>
          )}
          <Button className='upload-btn' type='primary' size='mini' onClick={handleUpload}>
            上传
          </Button>
        </View>
      </View>

      {/* 面包屑导航 */}
      {currentFolder !== '/' && (
        <View className='breadcrumb'>
          <Button 
            className='back-btn' 
            size='mini' 
            onClick={navigateUp}
          >
            ← 返回上级
          </Button>
          <Text className='path'>当前位置: {currentFolder}</Text>
        </View>
      )}

      {/* 文件列表 */}
      <ScrollView className='file-list' scrollY>
        {files.length === 0 && !loading ? (
          <View className='empty'>
            <Text className='empty-icon'>📂</Text>
            <Text className='empty-text'>暂无文件</Text>
            <View className='empty-actions'>
              {user?.role === 'admin' && (
                <Button className='empty-btn' onClick={handleCreateFolder}>
                  创建文件夹
                </Button>
              )}
              <Button className='empty-btn' type='primary' onClick={handleUpload}>
                上传文件
              </Button>
            </View>
          </View>
        ) : (
          files.map((file) => (
            <View
              key={file._id}
              className='file-item'
              onClick={() => handleFileClick(file)}
              onLongPress={() => handleFileLongPress(file)}
            >
              <Text className='file-icon'>{getFileIcon(file.mimeType)}</Text>
              <View className='file-info'>
                <Text className='file-name'>{file.filename}</Text>
                <View className='file-meta'>
                  {file.mimeType !== 'folder' && (
                    <Text className='file-size'>{formatFileSize(file.size)}</Text>
                  )}
                  <Text className='file-date'>{formatDate(file.createdAt)}</Text>
                  {file.uploader && (
                    <Text className='file-uploader'>
                      {file.uploader.role === 'admin' ? '👑' : '👤'} {file.uploader.nickname}
                    </Text>
                  )}
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
