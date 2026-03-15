# 需求文档：微信小程序NAS系统

## 简介

本文档定义了微信小程序NAS（网络附加存储）系统的功能需求。该系统面向50人以下的公司内部使用，提供文件存储、分享和权限管理功能。系统采用Taro 3.x + React 18开发前端（支持微信小程序和H5），后端使用阿里云轻量服务器（香港）+ Node.js + Express + MongoDB，存储使用阿里云OSS（香港）。

## 术语表

- **系统（System）**: 微信小程序NAS系统的整体
- **用户认证模块（Auth_Module）**: 负责用户登录和身份验证的模块
- **文件管理模块（File_Module）**: 负责文件上传、下载、删除等操作的模块
- **分享模块（Share_Module）**: 负责文件分享功能的模块
- **权限管理模块（Permission_Module）**: 负责用户角色和文件权限管理的模块
- **存储服务（Storage_Service）**: 阿里云OSS对象存储服务
- **数据库（Database）**: MongoDB数据库
- **管理员（Admin）**: 拥有系统管理权限的用户角色
- **普通用户（User）**: 拥有基本文件操作权限的用户角色
- **文件所有者（File_Owner）**: 上传文件的用户
- **分享码（Share_Code）**: 8位唯一标识符，用于访问分享文件
- **存储配额（Storage_Quota）**: 用户可使用的最大存储空间
- **JWT令牌（JWT_Token）**: 用于用户身份认证的JSON Web Token
- **临时访问URL（Temporary_URL）**: 带签名的限时文件访问链接
- **上传凭证（Upload_Credential）**: 用于直传文件到OSS的临时凭证

## 需求

### 需求1：用户认证

**用户故事**: 作为用户，我希望通过微信登录系统，以便安全地访问我的文件。

#### 验收标准

1. WHEN 用户提供有效的微信授权码 THEN THE 用户认证模块 SHALL 向微信服务器验证授权码并获取用户标识
2. WHEN 用户首次登录 THEN THE 用户认证模块 SHALL 创建新用户记录并分配默认存储配额5GB
3. WHEN 用户登录成功 THEN THE 用户认证模块 SHALL 生成有效期为7天的JWT令牌
4. WHEN 用户提供无效的授权码 THEN THE 用户认证模块 SHALL 返回错误码INVALID_CODE
5. WHEN 已禁用的用户尝试登录 THEN THE 用户认证模块 SHALL 返回错误码USER_DISABLED
6. WHEN 用户请求获取个人信息 THEN THE 用户认证模块 SHALL 验证JWT令牌并返回用户信息
7. WHEN JWT令牌已过期 THEN THE 用户认证模块 SHALL 返回错误码TOKEN_EXPIRED

### 需求2：文件上传

**用户故事**: 作为用户，我希望上传文件到系统，以便存储和管理我的文件。

#### 验收标准

1. WHEN 用户请求上传文件 THEN THE 文件管理模块 SHALL 验证用户身份和存储配额
2. WHEN 用户存储空间不足 THEN THE 文件管理模块 SHALL 返回错误码QUOTA_EXCEEDED
3. WHEN 文件大小超过100MB THEN THE 文件管理模块 SHALL 返回错误码FILE_TOO_LARGE
4. WHEN 文件类型不在允许列表中 THEN THE 文件管理模块 SHALL 返回错误码INVALID_FILE_TYPE
5. WHEN 文件名包含非法字符 THEN THE 文件管理模块 SHALL 返回错误码INVALID_FILE_NAME
6. WHEN 上传请求通过验证 THEN THE 文件管理模块 SHALL 生成上传凭证并返回OSS上传URL
7. WHEN 文件上传到OSS完成 THEN THE 文件管理模块 SHALL 保存文件元数据到数据库
8. WHEN 文件元数据保存成功 THEN THE 文件管理模块 SHALL 更新用户已使用存储空间
9. WHEN 上传的文件是图片 THEN THE 文件管理模块 SHALL 自动生成缩略图

### 需求3：文件列表查询

**用户故事**: 作为用户，我希望查看我的文件列表，以便管理我的文件。

#### 验收标准

1. WHEN 用户请求文件列表 THEN THE 文件管理模块 SHALL 返回该用户所有活跃状态的文件
2. WHEN 用户指定文件夹路径 THEN THE 文件管理模块 SHALL 返回该路径下的文件
3. WHEN 用户指定排序方式 THEN THE 文件管理模块 SHALL 按指定方式排序文件列表
4. WHEN 用户请求分页数据 THEN THE 文件管理模块 SHALL 返回指定页码和每页数量的文件
5. WHEN 文件列表为空 THEN THE 文件管理模块 SHALL 返回空数组和总数为0

### 需求4：文件详情查询

**用户故事**: 作为用户，我希望查看文件的详细信息，以便了解文件属性和权限。

#### 验收标准

1. WHEN 用户请求文件详情 THEN THE 文件管理模块 SHALL 验证用户对该文件的读取权限
2. WHEN 用户无权限访问文件 THEN THE 文件管理模块 SHALL 返回错误码PERMISSION_DENIED
3. WHEN 文件不存在 THEN THE 文件管理模块 SHALL 返回错误码FILE_NOT_FOUND
4. WHEN 用户有权限访问文件 THEN THE 文件管理模块 SHALL 返回文件详细信息和临时访问URL
5. WHEN 生成临时访问URL THEN THE 文件管理模块 SHALL 设置1小时有效期

### 需求5：文件删除

**用户故事**: 作为用户，我希望删除不需要的文件，以便释放存储空间。

#### 验收标准

1. WHEN 用户请求删除文件 THEN THE 文件管理模块 SHALL 验证用户对该文件的管理员权限
2. WHEN 用户无权限删除文件 THEN THE 文件管理模块 SHALL 返回错误码PERMISSION_DENIED
3. WHEN 文件删除成功 THEN THE 文件管理模块 SHALL 将文件状态标记为deleted
4. WHEN 文件删除成功 THEN THE 文件管理模块 SHALL 减少用户已使用存储空间
5. WHEN 文件删除成功 THEN THE 文件管理模块 SHALL 记录删除操作日志
6. WHEN 用户尝试删除已删除的文件 THEN THE 文件管理模块 SHALL 返回错误码FILE_NOT_FOUND

### 需求6：文件重命名

**用户故事**: 作为用户，我希望重命名文件，以便更好地组织文件。

#### 验收标准

1. WHEN 用户请求重命名文件 THEN THE 文件管理模块 SHALL 验证用户对该文件的写入权限
2. WHEN 新文件名包含非法字符 THEN THE 文件管理模块 SHALL 返回错误码INVALID_FILE_NAME
3. WHEN 同路径下已存在同名文件 THEN THE 文件管理模块 SHALL 返回错误码N