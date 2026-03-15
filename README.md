# 微信小程序企业 NAS 文件存储系统

一个基于微信小程序的小公司内部文件存储系统，支持团队协作、文件分享和权限管理。

## 🌟 项目亮点

🎯 **专为小公司设计** - 轻量级企业文件管理解决方案  
📱 **微信小程序** - 无需安装APP，随时随地移动办公  
🔐 **安全可靠** - 微信授权登录 + JWT认证 + 角色权限控制  
🚀 **开箱即用** - 完整的前后端解决方案，快速部署  
💼 **企业级功能** - 文件分享、用户管理、权限控制  
🛠️ **技术栈现代** - TypeScript + React + Node.js + MongoDB  

## ✨ 特性

- 🔐 **微信授权登录** - 安全便捷的企业用户认证
- 📁 **文件管理** - 上传、下载、重命名、删除文件
- 🔗 **文件分享** - 支持公开、密码、内部三种分享模式
- 👥 **用户管理** - 管理员可管理团队成员角色和状态
- 🔒 **权限控制** - 基于角色的访问控制，保障企业数据安全
- 📱 **移动办公** - 支持微信小程序，随时随地访问公司文件
- 🎨 **现代化UI** - 简洁美观的企业级用户界面
- 🏢 **企业级** - 专为小公司内部使用设计

## 🏗️ 技术栈

### 前端
- **框架**: Taro 3.x + React 18
- **语言**: TypeScript
- **状态管理**: Zustand
- **样式**: SCSS
- **构建工具**: Webpack 5

### 后端
- **运行时**: Node.js 18+
- **框架**: Express.js
- **语言**: TypeScript
- **数据库**: MongoDB
- **认证**: JWT + 微信小程序授权
- **文件存储**: 本地存储（支持扩展至阿里云OSS）
- **进程管理**: PM2

## 🎯 适用场景

### 目标企业
- 10-100人的小公司
- 需要移动办公的团队  
- 重视数据安全的企业
- 希望降低IT成本的公司

### 小公司内部文件管理
- 团队文档共享
- 项目资料存储
- 工作文件协作
- 企业资料归档

### 移动办公支持
- 随时随地访问公司文件
- 移动端文件上传下载
- 外出办公文件分享
- 客户资料快速查阅

## 📦 项目结构

```
├── nas-frontend/          # 前端小程序
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   ├── store/         # 状态管理
│   │   ├── utils/         # 工具函数
│   │   └── assets/        # 静态资源
│   └── config/            # 编译配置
├── nas-backend/           # 后端API
│   ├── src/
│   │   ├── controllers/   # 控制器
│   │   ├── models/        # 数据模型
│   │   ├── routes/        # 路由
│   │   ├── middleware/    # 中间件
│   │   ├── services/      # 服务层
│   │   └── utils/         # 工具函数
│   └── uploads/           # 文件存储目录
└── docs/                  # 文档
```

## 🚀 快速开始

### 环境要求

- Node.js 18+
- MongoDB 6.0+
- 微信开发者工具
- 已注册的微信小程序

### 1. 克隆项目

```bash
git clone https://github.com/yolaucn/wechat-nas-system.git
cd wechat-nas-system
```

### 2. 后端配置

```bash
cd nas-backend

# 安装依赖
npm install

# 复制环境变量文件
cp .env.example .env

# 编辑环境变量
vim .env
```

配置 `.env` 文件：

```env
# 应用配置
NODE_ENV=development
PORT=3000
APP_NAME=NAS-System

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/nas

# JWT配置
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=7d

# 文件存储配置
STORAGE_TYPE=local
STORAGE_PATH=./uploads
FILE_BASE_URL=http://localhost:3000/files

# 微信小程序配置
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret

# 日志配置
LOG_LEVEL=info
LOG_DIR=./logs

# 文件上传限制
MAX_FILE_SIZE=104857600
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp,image/svg+xml,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/csv,application/zip,application/x-rar-compressed,application/x-7z-compressed,audio/mpeg,audio/wav,video/mp4,video/mpeg,application/json
```

启动后端服务：

```bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm start
```

### 3. 前端配置

```bash
cd nas-frontend

# 安装依赖
npm install

# 开发模式
npm run dev:weapp

# 生产构建
npm run build:weapp
```

### 4. 微信开发者工具

1. 打开微信开发者工具
2. 导入项目，选择 `nas-frontend` 目录
3. 填入你的小程序 AppID
4. 开始开发调试

## 📱 功能截图

### 登录页面
- 微信授权登录
- 用户信息填写

### 文件管理
- 文件列表展示
- 文件上传下载
- 文件重命名删除

### 文件分享
- 创建分享链接
- 分享权限设置
- 分享管理

### 用户管理（管理员）
- 用户列表
- 角色管理
- 状态控制

## 🔧 部署指南

### 开发环境

1. 启动 MongoDB
2. 启动后端：`cd nas-backend && npm run dev`
3. 启动前端：`cd nas-frontend && npm run dev:weapp`
4. 使用微信开发者工具打开前端项目

### 生产环境部署

#### 服务器要求
- 操作系统: Ubuntu 20.04+ / CentOS 7+
- Node.js: 18+
- MongoDB: 6.0+
- Nginx: 1.18+
- 内存: 2GB+
- 存储: 20GB+

#### 快速部署步骤

1. **准备服务器环境**
```bash
# 安装 Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# 安装 Nginx
sudo apt-get install -y nginx

# 安装 PM2
sudo npm install -g pm2
```

2. **部署后端代码**
```bash
# 克隆代码到服务器
git clone https://github.com/yolaucn/wechat-nas-system.git
cd wechat-nas-system/nas-backend

# 安装依赖
npm install --production

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库连接、JWT密钥等

# 启动服务
pm2 start npm --name "nas-backend" -- start
pm2 save
pm2 startup
```

3. **配置 Nginx**
```bash
# 创建 Nginx 配置文件
sudo nano /etc/nginx/sites-available/nas
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/nas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

4. **配置 HTTPS（推荐）**
```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 申请 SSL 证书
sudo certbot --nginx -d your-domain.com
```

5. **配置微信小程序域名**
- 登录微信公众平台
- 进入"开发" -> "开发管理" -> "开发设置"
- 配置服务器域名：
  - request合法域名: `https://your-domain.com`
  - uploadFile合法域名: `https://your-domain.com`
  - downloadFile合法域名: `https://your-domain.com`

#### Docker 部署（可选）

```bash
# 构建镜像
docker build -t nas-backend ./nas-backend

# 运行容器
docker run -d \
  --name nas-backend \
  -p 3000:3000 \
  -v /data/uploads:/app/uploads \
  -e MONGODB_URI=mongodb://your-mongodb-host:27017/nas \
  nas-backend
```

#### 常用管理命令

```bash
# PM2 管理
pm2 status              # 查看状态
pm2 logs nas-backend    # 查看日志
pm2 restart nas-backend # 重启服务
pm2 stop nas-backend    # 停止服务

# Nginx 管理
sudo systemctl status nginx   # 查看状态
sudo systemctl restart nginx  # 重启
sudo nginx -t                 # 测试配置

# MongoDB 管理
sudo systemctl status mongod  # 查看状态
sudo systemctl restart mongod # 重启
```

#### 备份建议

```bash
# 数据库备份
mongodump --db nas --out /backup/mongodb/$(date +%Y%m%d)

# 文件备份
tar -czf /backup/files/nas-files-$(date +%Y%m%d).tar.gz ./uploads
```

更多详细部署信息请参考：[部署文档](nas-backend/DEPLOYMENT.md)

## 🔑 API 文档

### 认证相关
- `POST /api/v1/auth/login` - 微信登录
- `GET /api/v1/auth/userinfo` - 获取用户信息

### 文件管理
- `POST /api/v1/files/upload` - 文件上传
- `GET /api/v1/files` - 文件列表
- `GET /api/v1/files/:id` - 文件详情
- `DELETE /api/v1/files/:id` - 删除文件
- `PUT /api/v1/files/:id/rename` - 重命名文件

### 文件分享
- `POST /api/v1/shares` - 创建分享
- `GET /api/v1/shares/:code` - 访问分享
- `DELETE /api/v1/shares/:id` - 撤销分享
- `GET /api/v1/shares` - 分享列表

### 用户管理（管理员）
- `GET /api/v1/users` - 用户列表
- `PUT /api/v1/users/:id/role` - 更新用户角色
- `PUT /api/v1/users/:id/status` - 更新用户状态

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发流程

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add some amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 提交 Pull Request

### 代码规范

- 使用 TypeScript
- 遵循 ESLint 规则
- 提交前运行测试
- 保持代码注释完整

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [Taro](https://taro.js.org/) - 跨平台开发框架
- [Express.js](https://expressjs.com/) - Web 应用框架
- [MongoDB](https://www.mongodb.com/) - 数据库
- [微信小程序](https://developers.weixin.qq.com/miniprogram/dev/framework/) - 小程序平台

## 📞 联系方式

- 项目链接：https://github.com/yolaucn/wechat-nas-system

## 🗺️ 路线图

- [ ] 支持阿里云 OSS 存储
- [ ] 文件夹功能和目录管理
- [ ] 文件搜索和标签系统
- [ ] 批量操作和文件同步
- [ ] 文件预览优化（Office文档）
- [ ] 移动端 H5 版本
- [ ] 企业数据统计面板
- [ ] 文件版本管理和历史记录
- [ ] 审批流程集成
- [ ] 企业通讯录集成

---

⭐ 如果这个项目对你的公司有帮助，请给个 Star 支持一下！