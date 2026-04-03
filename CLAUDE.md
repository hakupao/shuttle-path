# Shuttle Path — AI 协作指令

## 项目概述

羽毛球教学知识平台。知识库 + 教学日记，公开站点，无需登录。
作者 GitHub: https://github.com/hakupao

## 技术栈

- **框架**: Astro 5（静态站点，Content Collections）
- **交互组件**: React 19（Islands 架构，按需加载）
- **内容格式**: MDX（Markdown + React 组件）
- **样式**: Tailwind CSS 4（CSS-based 配置，无独立 config 文件）
- **部署**: GitHub → Cloudflare Pages
- **媒体存储**: Cloudflare R2（后续阶段）
- **搜索**: Pagefind（后续阶段）

## 项目结构规则

- `docs/` — 开发日志，公开的需求讨论和技术方案记录
- `src/content/knowledge/` — 知识库文章（手法/步法/运动科学），使用统一的 KnowledgeLayout
- `src/content/lessons/` — 教学日记，每节课一个文件夹，可含专属组件，布局完全自由
- `src/components/common/` — 全站共享组件
- `src/components/knowledge/` — 知识库专用组件
- `src/components/media/` — 媒体相关组件

## 编码约定

- **语言**: TypeScript 优先
- **样式**: Tailwind CSS，避免内联 style（教学日记定制部分除外）
- **组件命名**: PascalCase（`ArticleCard.astro`）
- **文件命名**: kebab-case（`basic-stance.mdx`）
- **Git 分支**: `main` 为生产分支；功能开发用 `feature/xxx`
- **提交信息**: 中文，简明扼要

## 内容规则

- 网站语言：中文
- 知识库文章 frontmatter 必须包含: title, description, category, publishDate
- 教学日记 frontmatter 必须包含: title, date
- 专有名词使用 `<Term>` 组件包裹，自动链接到知识库词条
- 教学日记不使用主题模板，每节课独立设计

## 设计原则

- 全站导航和页脚保持一致
- 知识库页面统一学术风格，干净排版
- 教学日记每篇可以有完全不同的视觉风格（参考 pudding.cool）
- 响应式设计：移动端和桌面端都要做好
- 作者信息低调融入 footer（GitHub 链接）
- 注重细节打磨：微动画、呼吸感排版、流畅的阅读体验

## 开发流程

- 所有需求讨论和技术决策记录在 `docs/` 目录
- MVP 先行，快速上线，持续迭代
- 详细需求和技术方案见 `docs/01` ~ `docs/05`
