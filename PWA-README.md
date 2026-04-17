# PWA 功能说明文档

## 概述

本项目已完整适配 PWA (Progressive Web App) 功能，支持离线访问、应用安装、后台同步等特性。

## 已实现功能

### 1. Service Worker
- **文件**: `sw.js`
- **功能**: 
  - 预缓存核心资源（HTML、CSS、JS、字体等）
  - 运行时缓存策略（NetworkFirst、CacheFirst、StaleWhileRevalidate）
  - 自动清理过期缓存
  - 离线页面支持

### 2. Web App Manifest
- **文件**: `manifest.json` / `manifest.webmanifest`
- **配置**:
  - 应用名称：克喵の友链屋
  - 主题色：#5f67ee
  - 背景色：#ffffff
  - 显示模式：standalone
  - 支持快捷方式（成员列表、文章列表）

### 3. 缓存策略

| 资源类型 | 策略 | 缓存时间 |
|---------|------|---------|
| 页面导航 | NetworkFirst | 1天 |
| 静态资源 | CacheFirst | 7天 |
| 图片资源 | CacheFirst | 30天 |
| CDN 资源 | StaleWhileRevalidate | 7天 |
| API 请求 | NetworkFirst | 1小时 |
| JSON 数据 | StaleWhileRevalidate | 1天 |

### 4. 离线状态检测
- **组件**: `PWAStatus.vue`
- **功能**:
  - 网络断开提示
  - 网络恢复提示
  - Service Worker 更新提示
  - 应用安装提示

### 5. PWA 元数据
已添加的 Meta 标签：
- `theme-color` - 主题颜色
- `apple-mobile-web-app-capable` - iOS 全屏支持
- `apple-mobile-web-app-status-bar-style` - iOS 状态栏样式
- `mobile-web-app-capable` - Android 全屏支持
- `viewport` - 视口优化
- Open Graph 标签
- Twitter Card 标签

## 安装依赖

```bash
# 已安装的依赖
pnpm add -D vite-plugin-pwa workbox-window

# 可选：用于生成图标和截图
pnpm add -D sharp puppeteer
```

## 构建和测试

```bash
# 开发模式（支持 PWA）
pnpm dev

# 生产构建
pnpm build

# 预览生产构建
pnpm preview

# 生成 PWA 图标（需要放置 icon-source.png）
pnpm run pwa:icons

# 生成 PWA 截图（需要运行开发服务器）
pnpm run pwa:screenshots

# 生成所有 PWA 资源
pnpm run pwa:generate-assets
```

## 图标要求

在 `docs/.vitepress/public/icons/` 目录下放置以下尺寸的图标：
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

可以使用 `pnpm run pwa:icons` 自动生成（需要 sharp 和源图片）。

## 截图要求

在 `docs/.vitepress/public/screenshots/` 目录下放置：
- screenshot-wide.png (1280x720) - 桌面端
- screenshot-narrow.png (750x1334) - 移动端

可以使用 `pnpm run pwa:screenshots` 自动生成（需要 puppeteer）。

## 浏览器支持

- Chrome/Edge 80+
- Firefox 80+
- Safari 14+
- iOS Safari 14+
- Android Chrome 80+

## 测试 PWA

1. **Lighthouse 测试**:
   - 打开 Chrome DevTools
   - 切换到 Lighthouse 面板
   - 选择 "PWA" 类别
   - 点击 "Generate report"

2. **应用安装测试**:
   - 在 Chrome/Edge 中打开网站
   - 查看地址栏右侧是否出现安装图标
   - 或在菜单中选择 "安装 克喵の友链屋"

3. **离线测试**:
   - 打开网站并等待加载完成
   - 断开网络连接
   - 刷新页面，应显示离线页面或缓存内容

## 注意事项

1. **HTTPS**: PWA 功能需要 HTTPS 环境（本地开发除外）
2. **缓存更新**: Service Worker 更新后需要刷新页面才能生效
3. **存储限制**: 注意浏览器缓存存储限制（通常为 50MB-100MB）
4. **图标生成**: 建议使用 1024x1024 的源图片生成各种尺寸图标

## 故障排除

### Service Worker 未注册
- 检查浏览器是否支持 Service Worker
- 确保网站运行在 HTTPS 或 localhost
- 查看浏览器控制台错误信息

### 离线页面不显示
- 检查 `offline.html` 是否在 `public` 目录
- 确认 Service Worker 已正确安装
- 检查网络面板中的缓存状态

### 更新不生效
- 使用 "更新" 按钮或关闭并重新打开应用
- 在开发者工具中勾选 "Update on reload"
- 手动注销 Service Worker 后刷新

## 相关文件

- `docs/.vitepress/config.mts` - VitePress 主配置
- `docs/.vitepress/config/pwa.ts` - PWA 配置
- `docs/.vitepress/theme/index.ts` - 主题配置（Service Worker 注册）
- `docs/.vitepress/theme/components/PWAStatus.vue` - PWA 状态组件
- `docs/.vitepress/public/manifest.json` - Web App Manifest
- `docs/.vitepress/public/offline.html` - 离线页面
- `docs/.vitepress/public/browserconfig.xml` - IE/Edge 配置
