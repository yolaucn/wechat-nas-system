# NAS Frontend

微信小程序NAS系统前端（基于Taro + React）

## 技术栈

- Taro 3.6+
- React 18
- TypeScript
- Zustand（状态管理）
- Taro UI（UI组件库）

## 开发环境设置

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

**微信小程序：**
```bash
npm run dev:weapp
```

然后使用微信开发者工具打开 `dist` 目录

**H5：**
```bash
npm run dev:h5
```

浏览器访问 http://localhost:10086

## 可用脚本

- `npm run dev:weapp` - 启动微信小程序开发模式
- `npm run dev:h5` - 启动H5开发模式
- `npm run build:weapp` - 编译微信小程序生产版本
- `npm run build:h5` - 编译H5生产版本
- `npm run lint` - 运行ESLint检查

## 项目结构

```
src/
├── pages/           # 页面
├── components/      # 组件
├── services/        # API服务
├── store/           # 状态管理
├── utils/           # 工具函数
├── app.config.ts    # 应用配置
├── app.tsx          # 应用入口
└── app.scss         # 全局样式
```

## 注意事项

1. 使用微信开发者工具打开项目时，选择 `dist` 目录
2. 修改代码后会自动编译，刷新开发者工具即可看到效果
3. API地址在 `config/dev.ts` 和 `config/prod.ts` 中配置
