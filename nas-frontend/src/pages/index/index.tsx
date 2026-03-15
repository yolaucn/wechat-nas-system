import { View, Text, Button } from '@tarojs/components'
import { useLoad, useShareAppMessage } from '@tarojs/taro'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import './index.scss'

// API 基础地址
const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://nas.okdev.ink';
  }
  return 'http://localhost:3000';
};

const API_BASE_URL = getApiBaseUrl();

export default function Index() {
  const [testResult, setTestResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [fileList, setFileList] = useState([])

  // 启用分享功能
  useShareAppMessage(() => {
    return {
      title: 'NAS文件管理系统 - API测试',
      path: '/pages/index/index',
      imageUrl: 'https://img.icons8.com/clouds/200/000000/api.png',
    };
  });

  useLoad(() => {
    console.log('Page loaded.')
  })

  // 测试健康检查
  const testHealth = async () => {
    setLoading(true)
    try {
      const res = await Taro.request({
        url: `${API_BASE_URL}/health`,
        method: 'GET',
      })
      setTestResult(JSON.stringify(res.data, null, 2))
      Taro.showToast({
        title: '健康检查成功',
        icon: 'success',
      })
    } catch (error) {
      setTestResult('错误: ' + error)
      Taro.showToast({
        title: '请求失败',
        icon: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  // 测试模拟登录
  const testLogin = async () => {
    setLoading(true)
    try {
      // 1. 调用微信登录获取真实code
      const loginRes = await Taro.login()
      
      if (!loginRes.code) {
        Taro.showToast({
          title: '获取code失败',
          icon: 'error',
        })
        setTestResult('错误: 无法获取微信登录code')
        setLoading(false)
        return
      }

      // 2. 获取用户信息
      let nickName = '微信用户'
      let avatarUrl = ''
      
      try {
        const userInfoRes = await Taro.getUserProfile({
          desc: '用于完善用户资料',
        })
        nickName = userInfoRes.userInfo.nickName
        avatarUrl = userInfoRes.userInfo.avatarUrl
      } catch (userInfoError) {
        console.log('获取用户信息失败，使用默认值:', userInfoError)
        // 用户拒绝授权，使用默认值继续
      }

      // 3. 使用真实code和用户信息调用后端登录接口
      const res = await Taro.request({
        url: `${API_BASE_URL}/api/v1/auth/login`,
        method: 'POST',
        data: {
          code: loginRes.code,
          nickname: nickName,
          avatar: avatarUrl,
        },
        header: {
          'Content-Type': 'application/json',
        },
      })
      
      if (res.data.success) {
        // 保存token
        Taro.setStorageSync('token', res.data.data.token)
        setTestResult(JSON.stringify(res.data, null, 2))
        Taro.showToast({
          title: '登录成功',
          icon: 'success',
        })
      } else {
        setTestResult('登录失败: ' + res.data.message)
        Taro.showToast({
          title: '登录失败',
          icon: 'error',
        })
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      setTestResult('错误: ' + errorMsg)
      console.error('登录错误:', error)
      Taro.showToast({
        title: '请求失败',
        icon: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  // 测试获取用户信息
  const testGetUserInfo = async () => {
    setLoading(true)
    try {
      const token = Taro.getStorageSync('token')
      if (!token) {
        Taro.showToast({
          title: '请先登录',
          icon: 'none',
        })
        setTestResult('错误: 未找到token，请先测试登录')
        setLoading(false)
        return
      }

      const res = await Taro.request({
        url: `${API_BASE_URL}/api/v1/auth/userinfo`,
        method: 'GET',
        header: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      setTestResult(JSON.stringify(res.data, null, 2))
      Taro.showToast({
        title: '获取用户信息成功',
        icon: 'success',
      })
    } catch (error) {
      setTestResult('错误: ' + error)
      Taro.showToast({
        title: '请求失败',
        icon: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  // 测试文件上传
  const testUploadFile = async () => {
    setLoading(true)
    try {
      const token = Taro.getStorageSync('token')
      if (!token) {
        Taro.showToast({
          title: '请先登录',
          icon: 'none',
        })
        setTestResult('错误: 未找到token，请先测试登录')
        setLoading(false)
        return
      }

      // 选择文件
      const chooseResult = await Taro.chooseMessageFile({
        count: 1,
        type: 'all',
      })

      if (!chooseResult.tempFiles || chooseResult.tempFiles.length === 0) {
        Taro.showToast({
          title: '未选择文件',
          icon: 'none',
        })
        setLoading(false)
        return
      }

      const file = chooseResult.tempFiles[0]

      // 上传文件
      const uploadRes = await Taro.uploadFile({
        url: `${API_BASE_URL}/api/v1/files/upload`,
        filePath: file.path,
        name: 'file',
        header: {
          Authorization: `Bearer ${token}`,
        },
        formData: {
          folder: '/',
        },
      })

      const data = JSON.parse(uploadRes.data)
      setTestResult(JSON.stringify(data, null, 2))
      
      if (data.success) {
        Taro.showToast({
          title: '上传成功',
          icon: 'success',
        })
        // 刷新文件列表
        testGetFileList()
      } else {
        Taro.showToast({
          title: '上传失败',
          icon: 'error',
        })
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      setTestResult('错误: ' + errorMsg)
      console.error('上传错误:', error)
      Taro.showToast({
        title: '上传失败',
        icon: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  // 测试获取文件列表
  const testGetFileList = async () => {
    setLoading(true)
    try {
      const token = Taro.getStorageSync('token')
      if (!token) {
        Taro.showToast({
          title: '请先登录',
          icon: 'none',
        })
        setTestResult('错误: 未找到token，请先测试登录')
        setLoading(false)
        return
      }

      const res = await Taro.request({
        url: `${API_BASE_URL}/api/v1/files`,
        method: 'GET',
        header: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      if (res.data.success) {
        setFileList(res.data.data.files)
        setTestResult(JSON.stringify(res.data, null, 2))
        Taro.showToast({
          title: `获取成功，共${res.data.data.files.length}个文件`,
          icon: 'success',
        })
      } else {
        setTestResult('获取失败: ' + res.data.message)
      }
    } catch (error) {
      setTestResult('错误: ' + error)
      Taro.showToast({
        title: '请求失败',
        icon: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  // 预览文件
  const previewFile = async (file: any) => {
    try {
      const token = Taro.getStorageSync('token')
      if (!token) {
        Taro.showToast({
          title: '请先登录',
          icon: 'none',
        })
        return
      }

      // file.url 已经是完整的URL，直接使用
      const fileUrl = file.url
      const mimeType = file.mimeType

      // 图片预览
      if (mimeType.startsWith('image/')) {
        await Taro.previewImage({
          urls: [fileUrl],
          current: fileUrl,
        })
        return
      }

      // 文档预览（PDF, Word, Excel, PPT）
      if (
        mimeType === 'application/pdf' ||
        mimeType === 'application/msword' ||
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimeType === 'application/vnd.ms-excel' ||
        mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        mimeType === 'application/vnd.ms-powerpoint' ||
        mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ) {
        Taro.showLoading({ title: '下载中...' })
        
        // 下载文件到本地
        const downloadRes = await Taro.downloadFile({
          url: fileUrl,
          header: {
            Authorization: `Bearer ${token}`,
          },
        })

        Taro.hideLoading()

        if (downloadRes.statusCode === 200) {
          // 打开文档
          await Taro.openDocument({
            filePath: downloadRes.tempFilePath,
            fileType: getFileExtension(file.filename),
          })
        } else {
          Taro.showToast({
            title: '下载失败',
            icon: 'error',
          })
        }
        return
      }

      // 其他文件类型提示下载
      Taro.showModal({
        title: '提示',
        content: '该文件类型暂不支持预览，是否下载？',
        success: async (res) => {
          if (res.confirm) {
            Taro.showLoading({ title: '下载中...' })
            const downloadRes = await Taro.downloadFile({
              url: fileUrl,
              header: {
                Authorization: `Bearer ${token}`,
              },
            })
            Taro.hideLoading()
            
            if (downloadRes.statusCode === 200) {
              Taro.showToast({
                title: '下载成功',
                icon: 'success',
              })
            }
          }
        },
      })
    } catch (error) {
      console.error('预览文件错误:', error)
      Taro.showToast({
        title: '预览失败',
        icon: 'error',
      })
    }
  }

  // 获取文件扩展名
  const getFileExtension = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() || ''
    return ext
  }

  return (
    <View className='index'>
      <Text className='title'>NAS系统 - API测试</Text>
      
      <View className='button-group'>
        <Button 
          onClick={testHealth} 
          disabled={loading}
          type='default'
          size='mini'
        >
          测试健康检查
        </Button>
        
        <Button 
          onClick={testLogin} 
          disabled={loading}
          type='primary'
        >
          测试登录接口
        </Button>
        
        <Button 
          onClick={testGetUserInfo} 
          disabled={loading}
          type='default'
        >
          测试获取用户信息
        </Button>

        <Button 
          onClick={testUploadFile} 
          disabled={loading}
          type='primary'
        >
          测试文件上传
        </Button>

        <Button 
          onClick={testGetFileList} 
          disabled={loading}
          type='default'
        >
          测试获取文件列表
        </Button>
      </View>

      {fileList.length > 0 && (
        <View className='file-list'>
          <Text className='list-title'>文件列表：</Text>
          {fileList.map((file: any) => (
            <View 
              key={file._id} 
              className='file-item'
              onClick={() => previewFile(file)}
            >
              <Text className='file-name'>{file.filename}</Text>
              <Text className='file-size'>{(file.size / 1024).toFixed(2)} KB</Text>
            </View>
          ))}
        </View>
      )}

      {testResult && (
        <View className='result'>
          <Text className='result-title'>测试结果：</Text>
          <Text className='result-content'>{testResult}</Text>
        </View>
      )}
    </View>
  )
}
