# Cloudflare Pages 自动部署教程

> 实现 GitHub 推送后自动构建并部署到 Cloudflare Pages

## 前置条件

- GitHub 仓库已创建（`hakupao/shuttle-path`）
- Cloudflare 账号（免费即可）

## 步骤一：创建 Cloudflare Pages 项目

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 左侧菜单选择 **Workers & Pages**
3. 点击 **Create** → 选择 **Pages** 标签
4. 选择 **Connect to Git**

## 步骤二：连接 GitHub 仓库

1. 点击 **Connect GitHub**，授权 Cloudflare 访问你的 GitHub
2. 选择 `hakupao/shuttle-path` 仓库
3. 点击 **Begin setup**

## 步骤三：配置构建设置

填写以下配置：

| 配置项 | 值 |
|---|---|
| **Project name** | `shuttle-path`（会生成 `shuttle-path.pages.dev` 域名） |
| **Production branch** | `main` |
| **Framework preset** | 选择 `Astro` |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |

### 环境变量（如需要）

点击 **Environment variables** 展开，当前阶段不需要额外配置。后续如果用到 R2 等服务再添加。

## 步骤四：部署

点击 **Save and Deploy**，Cloudflare 会：

1. 拉取仓库代码
2. 执行 `npm install`
3. 执行 `npm run build`
4. 将 `dist/` 目录部署到边缘网络

首次部署需要 1-2 分钟。完成后可以通过 `shuttle-path.pages.dev` 访问。

## 自动部署机制

设置完成后，以下操作会自动触发部署：

- **推送到 `main` 分支** → 自动部署到生产环境
- **推送到其他分支 / 创建 PR** → 自动生成预览部署（preview URL）

每次 `git push` 后，Cloudflare 会在 1-2 分钟内完成构建和部署。

## 查看部署状态

- **Cloudflare Dashboard**: Workers & Pages → shuttle-path → Deployments
- **GitHub**: 每次推送后，commit 旁边会显示部署状态图标（✓ 或 ✗）

## 自定义域名（可选）

如果你有自己的域名：

1. 进入 Cloudflare Pages 项目 → **Custom domains**
2. 点击 **Set up a custom domain**
3. 输入域名（如 `shuttlepath.com`）
4. 按提示配置 DNS 记录（如果域名也在 Cloudflare 管理，会自动配置）

## Node.js 版本

Cloudflare Pages 默认的 Node.js 版本可能较旧。如果构建失败，在环境变量中添加：

| 变量名 | 值 |
|---|---|
| `NODE_VERSION` | `22` |

## 常见问题

### 构建失败怎么办？

1. 进入 Deployments → 点击失败的部署 → 查看构建日志
2. 常见原因：
   - Node.js 版本不兼容 → 设置 `NODE_VERSION` 环境变量
   - 依赖安装失败 → 检查 `package.json` 和 `package-lock.json` 是否都已提交

### 如何回滚？

在 Deployments 页面，找到之前正常的部署，点击 **Rollback to this deploy**。

### 预览部署是什么？

每个非 `main` 分支的推送都会生成一个独立的预览 URL（如 `abc123.shuttle-path.pages.dev`），方便在合并前预览效果。

## 日常工作流

```bash
# 1. 修改代码或内容
# 2. 提交
git add .
git commit -m "更新内容"

# 3. 推送（自动触发部署）
git push

# 4. 等待 1-2 分钟，访问网站查看更新
```

就这么简单，推送即部署。
