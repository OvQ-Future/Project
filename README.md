# Developer Space

一个可直接运行的开发者个人主页，包含「开发者」与「项目」两个页面，以及仅作者可用的编辑模式。

## 快速启动

需要 Node.js 18 或更高版本，无第三方依赖。

```powershell
cd "E:\DeepSeek Workplace\Project"
node server.js
```

打开 <http://localhost:4173>。

Windows 也可以直接双击项目目录中的 open-website.cmd：它会启动服务并打开浏览器。也可以双击 start-website.cmd 前台运行服务；使用期间请保持命令窗口打开。

也可以使用 npm：

```powershell
npm start
```

## 作者登录

点击右上角「作者登录」，输入你指定的密钥即可解锁编辑模式。

密钥不会出现在前端代码中，服务端保存的是密钥摘要，所有写操作都会在服务端再次校验登录状态。普通访客始终是只读的。

生产部署时建议通过环境变量覆盖密钥：

```powershell
$env:ADMIN_KEY = "换成你的新密钥"
node server.js
```

并且请务必使用 HTTPS 部署。修改 `ADMIN_KEY` 后，旧的内置密钥将不再有效。

## 已实现功能

### 开发者页

- 作者名称、账号标识、头像上传、个性签名、个人介绍、所在地、技能关键词
- 最近 365 天创作活跃度热力图，仅统计作者真实发布动态与创建/更新项目的记录
- 作者动态：仅显示作者本人手动发布的内容，支持发布、删除
- 访客只读，作者登录后可编辑

### 项目页

- 层级化项目树，支持任意层级子项目
- 每个项目拥有独立链接：`/project/<项目 id>`
- 项目详情页展示摘要、状态、标签、详细 Markdown 描述和子项目
- 项目创建、编辑、移动、删除（仅作者）
- 删除父项目时会提示同时删除其子项目

### 数据与安全

- 数据持久化在 `data/site.json`
- 登录态使用 `HttpOnly + SameSite=Strict` 会话 Cookie，默认 7 天过期
- 所有修改接口都要求有效作者会话
- 上传头像限制为 PNG / JPG / WebP / GIF，最大 2MB
- 内置了基础的安全响应头与 XSS 文本转义

## 文件结构

```text
Project/
├─ public/
│  ├─ index.html
│  ├─ styles.css
│  └─ app.js
├─ data/
│  └─ site.json
├─ server.js
└─ package.json
```

## 说明

首次启动会生成一套示例项目用于展示页面结构；动态与创作趋势均为空，不包含任何伪造记录。登录作者账号后，可以发布真实动态、创建或更新项目，趋势图会按实际日期累计。



## 云端部署

项目已包含 Docker、持久化卷、环境变量和健康检查配置，可直接部署到云服务器、Render、Railway 或 Zeabur。

完整步骤见 [DEPLOY.md](DEPLOY.md)。

核心要求：

- 生产环境必须设置 `ADMIN_KEY`
- 必须将 `/app/data` 挂载到持久化磁盘
- 使用 HTTPS 时设置 `COOKIE_SECURE=true`


## 本机 Docker 运行（当前已部署）

当前电脑已通过 WSL2 Ubuntu 安装 Docker Engine，并已用 Docker Compose 启动网站。

```text
容器名：developer-space
数据卷：developer-space-data
访问地址：http://localhost:4173
```

常用命令：

```powershell
# 启动并打开网站
.\open-website.cmd

# 停止网站
.\stop-website.cmd
```

查看容器状态：

```powershell
wsl -d Ubuntu -u root -- docker ps
```

Windows 登录后自动启动配置位于：

```text
%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\DeveloperSpace.vbs
```

注意：这是本机部署。电脑关机后网站仍无法访问；如需关机后继续访问，需要部署到云服务器。
