<img src="https://wsrv.nl/?url=github.com%2FKemeow0815.png" align="right" />

# 克喵の友链屋 | KeMiao's Links Hub

欢迎来到克喵の友链屋！这是一个基于 [VitePress](https://vitepress.dev/zh/) 构建的友链聚合站点，收录了众多优秀的个人博客。

## 功能特性

- 📋 **成员展示** - 展示所有友链成员的头像、简介和博客链接
- 📰 **文章聚合** - 自动抓取友链博客的最新文章
- 🔍 **通达性检测** - 定期检测友链网站可访问性
- 🤖 **自动化管理** - 通过 GitHub Issues 申请友链，自动化处理

## 快速入门

### 安装依赖

```sh
pnpm i
```

### 本地测试

```sh
pnpm dev
```

### 构建

```sh
pnpm build
```

## 友链申请

### 申请方式

1. 访问本仓库的 [Issues](https://github.com/Kemeow0815/miaoluoge-links/issues) 页面
2. 点击 **New Issue** → 选择 **友链申请** 模板
3. 填写表单信息并提交
4. 等待审核（关闭议题后自动触发检测）

### 申请要求

#### 基本要求
- ✅ 网站可以正常访问
- ✅ 内容健康、积极向上
- ✅ 拥有独立域名（非免费二级域名）
- ✅ 网站已稳定运行至少 3 个月

#### 信息填写
| 字段 | 必填 | 说明 |
|------|------|------|
| 用户昵称 | ✓ | 在友链列表中显示的名称 |
| 博客名称 | ✓ | 您的博客标题 |
| 博客介绍 | ✓ | 简短介绍您的博客或自己 |
| 头像类型 | ✓ | qq / github / url |
| 头像标识 | ✓ | QQ号/GitHub用户名/头像链接 |
| GitHub | ✗ | 您的 GitHub 用户名 |
| 博客链接 | ✓ | 您的博客网站地址 |
| RSS 订阅 | ✗ | 博客 RSS/Atom 订阅地址 |

#### 头像类型说明
- **qq**: 使用 QQ 头像，填写 QQ 号码
- **github**: 使用 GitHub 头像，填写 GitHub 用户名
- **url**: 使用自定义头像，填写图片链接

### 审核流程

1. **提交申请** - 填写表单创建议题
2. **自动检测** - 关闭议题后自动检测网站可访问性
3. **结果通知**
   - ✅ **通过**: 友链自动添加，议题评论通知成功
   - ❌ **失败**: 议题重新打开，评论说明失败原因

### 检测标准

- 博客链接必须可访问（HTTP 2xx/3xx）
- RSS 订阅链接（如有）必须可访问
- 每个链接最多尝试 3 次
- 3 次均失败则判定为不可达

## 友链维护

### 定期检测

系统会每 7 天自动检测所有友链的通达性：

- 检测 website 和 feed（如有）的可访问性
- 连续 3 次检测失败的友链将被自动移除
- 相关议题会被重新打开并通知博主

### 失效处理

如果您的友链被移除，您可以：

1. 检查网站是否可以正常访问
2. 修复问题后重新提交友链申请
3. 在原有议题中回复说明情况

## 项目结构

```
.
├── docs/                          # VitePress 文档目录
│   ├── .vitepress/
│   │   ├── data/                  # 数据文件
│   │   │   ├── members.json       # 友链成员数据
│   │   │   └── articles.json      # 聚合文章数据
│   │   ├── components/            # Vue 组件
│   │   ├── theme/                 # 主题样式
│   │   └── config.mts             # VitePress 配置
│   ├── index.md                   # 首页
│   └── article.md                 # 文章聚合页
├── .github/
│   ├── workflows/                 # GitHub Actions 工作流
│   │   ├── fetch-rss-articles.yml # 每4小时抓取 RSS 文章
│   │   ├── check-friend-links.yml # 每7天检测友链通达性
│   │   ├── process-friend-link-request.yml # 处理友链申请
│   │   └── deploy.yml             # 部署工作流
│   ├── scripts/                   # 自动化脚本
│   │   ├── fetch-rss-articles.js  # RSS 文章抓取
│   │   ├── check-friend-links.js  # 友链检测
│   │   └── process-friend-link-request.js # 友链申请处理
│   └── ISSUE_TEMPLATE/            # Issue 模板
│       └── friend-link-request.yml # 友链申请模板
└── package.json
```

## 自动化工作流

| 工作流 | 触发条件 | 功能 |
|--------|----------|------|
| `fetch-rss-articles.yml` | 每4小时 / members.json 修改 | 抓取所有友链的 RSS 文章 |
| `check-friend-links.yml` | 每7天 | 检测友链通达性，移除失效友链 |
| `process-friend-link-request.yml` | 友链申请议题关闭 | 自动审核并添加友链 |

## 技术栈

- [VitePress](https://vitepress.dev/) - 静态站点生成器
- [Vue 3](https://vuejs.org/) - 前端框架
- [Pinia](https://pinia.vuejs.org/) - 状态管理
- [VueUse](https://vueuse.org/) - 实用工具库
- [rss-parser](https://github.com/rbren/rss-parser) - RSS 解析

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

[MIT](LICENSE)

---

<p align="center">Made with ❤️ by <a href="https://github.com/Kemeow0815">Kemeow0815</a></p>
