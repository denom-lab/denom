# Denom 项目部署指南

## GitHub Pages 部署

本项目使用 GitHub Actions 自动部署到 GitHub Pages，访问地址：`https://denom-lab.github.io`

### 部署流程

1. **推送代码到主分支**：当代码推送到 `main` 或 `master` 分支时，GitHub Actions 会自动触发构建和部署。

2. **手动触发部署**：在 GitHub 仓库的 Actions 页面可以手动触发部署。

### 部署配置

- **构建环境**：Ubuntu Latest + Node.js 20.19.4
- **构建命令**：`npm ci && npm run build`
- **部署路径**：根路径 `/` (无子路径)
- **输出目录**：`frontend/dist`

### 本地测试

在推送代码前，可以在本地测试构建：

```bash
cd frontend
npm run build
```

构建成功后会在 `frontend/dist` 目录生成静态文件。

### 注意事项

1. **路由配置**：已配置为支持 GitHub Pages 根路径
2. **SPA 支持**：添加了 404.html 和路由重定向脚本，支持 React Router
3. **资源路径**：所有静态资源路径使用绝对路径

### 故障排除

如果部署失败，请检查：

1. GitHub Actions 日志中的错误信息
2. 确保 `frontend/package.json` 中的构建脚本正确
3. 检查 Node.js 版本兼容性
4. 验证所有依赖是否正确安装

### 自定义部署

如需修改部署配置，请编辑 `.github/workflows/gh-pages.yml` 文件。
