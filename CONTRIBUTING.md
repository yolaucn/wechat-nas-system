# 贡献指南

感谢你对微信小程序 NAS 文件管理系统的关注！我们欢迎任何形式的贡献。

## 如何贡献

### 报告 Bug

如果你发现了 bug，请创建一个 issue 并包含以下信息：

- 详细的 bug 描述
- 复现步骤
- 期望的行为
- 实际的行为
- 环境信息（操作系统、Node.js 版本等）
- 相关的错误日志

### 提出新功能

如果你有新功能的想法：

1. 先检查是否已有相关的 issue
2. 创建一个新的 issue 描述你的想法
3. 等待维护者的反馈

### 提交代码

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/your-feature-name`
3. 进行开发
4. 确保代码通过所有测试
5. 提交更改：`git commit -m 'Add some feature'`
6. 推送到你的分支：`git push origin feature/your-feature-name`
7. 创建 Pull Request

## 开发环境设置

### 前置要求

- Node.js 18+
- MongoDB 6.0+
- 微信开发者工具

### 安装依赖

```bash
# 后端
cd nas-backend
npm install

# 前端
cd nas-frontend
npm install
```

### 运行项目

```bash
# 后端
cd nas-backend
npm run dev

# 前端
cd nas-frontend
npm run dev:weapp
```

## 代码规范

### TypeScript

- 使用 TypeScript 编写所有代码
- 为函数和复杂对象提供类型注解
- 避免使用 `any` 类型

### 代码风格

- 使用 ESLint 和 Prettier
- 提交前运行 `npm run lint`
- 保持代码简洁和可读性

### 提交信息

使用清晰的提交信息：

- `feat: 添加新功能`
- `fix: 修复 bug`
- `docs: 更新文档`
- `style: 代码格式调整`
- `refactor: 重构代码`
- `test: 添加测试`

## Pull Request 指南

### 提交前检查

- [ ] 代码通过 ESLint 检查
- [ ] 所有测试通过
- [ ] 更新相关文档
- [ ] 添加必要的测试用例

### PR 描述

请在 PR 中包含：

- 更改的简要描述
- 相关的 issue 编号
- 测试说明
- 截图（如果是 UI 更改）

## 问题和讨论

如果你有任何问题或想法，欢迎：

- 创建 issue 进行讨论
- 在现有 issue 中参与讨论
- 联系维护者

## 行为准则

请遵守以下准则：

- 尊重所有参与者
- 使用友好和包容的语言
- 接受建设性的批评
- 专注于对社区最有利的事情

感谢你的贡献！🎉