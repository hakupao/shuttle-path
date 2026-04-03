<p align="center">
  <img src="public/favicon.svg" width="60" alt="Shuttle Path Logo" />
</p>

<h1 align="center">Shuttle Path</h1>

<p align="center">
  <strong>羽毛球教学知识平台</strong><br/>
  系统化的知识库与沉浸式教学日记
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Astro-5-BC52EE?logo=astro&logoColor=white" alt="Astro 5" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/MDX-3-FCB32D?logo=mdx&logoColor=black" alt="MDX" />
  <img src="https://img.shields.io/badge/Cloudflare_Pages-Deployed-F38020?logo=cloudflarepages&logoColor=white" alt="Cloudflare Pages" />
</p>

---

## 概览

Shuttle Path 是一个面向羽毛球爱好者和教练的教学知识平台，包含两大核心板块：

- **知识库** — 手法、步法、运动科学，统一学术排版，结构化的技术知识
- **教学日记** — 每节课独立设计，沉浸式的视觉叙事体验（灵感来自 [pudding.cool](https://pudding.cool)）

> 每一篇教学日记都拥有完全独立的视觉风格——从樱花飘落的春日步法课，到未来更多主题的创意呈现。

## 特性

- **Islands 架构** — Astro 5 静态优先，React 组件按需水合
- **Content Collections** — 类型安全的内容管理，MDX 支持丰富组件嵌入
- **教学日记自由设计** — 每篇日记可拥有独立的主题、字体、配色、动画
- **手绘插画风** — 活力绿 + 阳光橙的运动主题，得意黑 (Smiley Sans) 标题字体
- **响应式设计** — 移动端与桌面端均精心适配
- **无障碍友好** — 语义化 HTML、`prefers-reduced-motion` 动画降级

## 项目结构

```
shuttle-path/
├── src/
│   ├── components/
│   │   ├── common/             # 全站共享（Nav、Footer）
│   │   └── lessons/            # 教学日记专属主题组件
│   ├── content/
│   │   ├── knowledge/          # 知识库文章 (MDX)
│   │   └── lessons/            # 教学日记 (MDX)
│   ├── layouts/                # 页面布局
│   ├── pages/                  # 路由页面
│   └── styles/
│       └── global.css          # 设计系统 + Tailwind CSS
├── docs/                       # 开发日志与技术方案
├── public/
│   ├── fonts/                  # 得意黑字体
│   └── images/                 # 静态图片资源
└── CLAUDE.md                   # AI 协作指令
```

## 快速开始

```bash
# 克隆项目
git clone https://github.com/hakupao/shuttle-path.git
cd shuttle-path

# 安装依赖
npm install

# 启动开发服务器
npm run dev
# → http://localhost:4321

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 技术栈

| 技术 | 用途 |
|------|------|
| [Astro 5](https://astro.build) | 静态站点框架，Content Collections |
| [React 19](https://react.dev) | 交互组件（Islands 架构） |
| [Tailwind CSS 4](https://tailwindcss.com) | 样式系统（CSS-based 配置） |
| [MDX](https://mdxjs.com) | Markdown + 组件混合内容格式 |
| [TypeScript](https://www.typescriptlang.org) | 类型安全 |
| [Cloudflare Pages](https://pages.cloudflare.com) | 边缘部署 |

## 内容管理

详细的内容更新指南见 [`docs/10-内容更新教程.md`](docs/10-内容更新教程.md)。

### 知识库文章

```bash
# 新建文章
touch src/content/knowledge/your-topic.mdx
```

必填 frontmatter: `title`, `description`, `category`, `publishDate`

### 教学日记

```bash
# 新建教学日记
touch src/content/lessons/your-lesson.mdx
```

必填 frontmatter: `title`, `date`

每篇教学日记可以创建专属的 Astro 主题组件（位于 `src/components/lessons/`），实现完全独立的视觉设计。

## 开发文档

项目的需求讨论、技术方案和设计决策记录在 `docs/` 目录中：

| 文档 | 内容 |
|------|------|
| `01` ~ `03` | 需求讨论与确认 |
| `04` | 技术方案 |
| `05` | 部署方案对比 |
| `06` ~ `07` | 前端设计方向 |
| `08` | 页面线框与实施计划 |
| `09` | 待交付素材清单 |
| `10` | 内容更新教程 |

## 部署

项目通过 GitHub 推送自动部署到 Cloudflare Pages：

```
git push origin main → Cloudflare Pages 自动构建 → shuttle-path.pages.dev
```

## License

MIT

---

<p align="center">
  Made with ❤ by <a href="https://github.com/hakupao">hakupao</a>
</p>
