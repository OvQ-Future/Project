# 部署指南

这是一个 Node.js 单体应用，使用 `data/site.json` 持久化数据。推荐使用 Docker 部署到云服务器、Render、Railway 或 Zeabur。

## 重要前提

- 必须通过环境变量 `ADMIN_KEY` 设置新的作者密钥，不要在生产环境继续使用内置密钥。
- 必须把 `/app/data` 挂载到持久化磁盘或数据卷，否则容器重新部署后作者内容会丢失。
- 通过 HTTPS 访问时设置 `COOKIE_SECURE=true`。
- 本地 HTTP 测试时设置 `COOKIE_SECURE=false`。

## 方式一：云服务器 + Docker Compose（推荐）

### 1. 准备服务器

在 Ubuntu / Debian 云服务器上安装 Docker：

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
```

把本项目上传到服务器，进入项目目录。

### 2. 设置作者密钥

```bash
cp .env.example .env
nano .env
```

至少修改：

```dotenv
ADMIN_KEY=请换成一个足够长的随机密钥
APP_PORT=4173
COOKIE_SECURE=false
```

### 3. 启动

```bash
docker compose up -d --build
```

检查服务状态：

```bash
docker compose ps
curl http://127.0.0.1:4173/healthz
```

浏览器访问：

```text
http://服务器公网IP:4173
```

### 4. 配置域名和 HTTPS

可以安装 Caddy 作为反向代理：

```bash
sudo apt install -y caddy
sudo nano /etc/caddy/Caddyfile
```

写入（把域名换成你自己的）：

```caddyfile
your-domain.com {
    reverse_proxy 127.0.0.1:4173
}
```

然后：

```bash
sudo systemctl reload caddy
```

修改 `.env`，开启安全 Cookie：

```dotenv
COOKIE_SECURE=true
```

重新启动应用：

```bash
docker compose up -d
```

使用反向代理时，建议把 `.env` 中的端口改为只监听本机：

```dotenv
APP_PORT=127.0.0.1:4173
```

同时云服务器防火墙只需要开放 `80` 和 `443`。

## 方式二：Render

1. 把项目推送到 GitHub。
2. 在 Render 中选择 **New → Blueprint**，选择仓库。
3. Render 会读取根目录的 `render.yaml`。
4. 填写 `ADMIN_KEY` 环境变量，值使用你自己的强密钥。
5. 确认已配置持久化磁盘 `/app/data`。
6. 部署完成后访问 Render 分配的 HTTPS 域名。

说明：Render 免费实例会休眠，也不提供持久化磁盘。若希望数据保留，需要使用支持磁盘的付费实例。

## 方式三：Railway / Zeabur

1. 新建项目并导入本仓库，平台会自动识别 `Dockerfile`。
2. 设置环境变量：
   - `NODE_ENV=production`
   - `ADMIN_KEY=你的强密钥`
   - `COOKIE_SECURE=true`
   - `DATA_DIR=/app/data`
3. **必须添加持久化卷**，挂载路径为 `/app/data`。
4. 生成公网域名并访问。

## 环境变量

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `ADMIN_KEY` | 生产必填 | 作者登录密钥，设置后内置密钥失效 |
| `PORT` | 否 | 监听端口，默认 `4173` |
| `HOST` | 否 | 监听地址，Docker 中为 `0.0.0.0` |
| `DATA_DIR` | 否 | 数据目录，Docker 中为 `/app/data` |
| `COOKIE_SECURE` | 建议 | HTTPS 环境设为 `true` |

## 数据备份与恢复

查看数据文件：

```bash
docker compose exec developer-space cat /app/data/site.json
```

备份到服务器当前目录：

```bash
docker cp developer-space:/app/data/site.json ./site-backup.json
```

恢复：

```bash
docker cp ./site-backup.json developer-space:/app/data/site.json
docker compose restart developer-space
```

## 健康检查

```text
GET /healthz
```

正常返回：

```json
{"status":"ok","uptime":123}
```

Dockerfile 和 `docker-compose.yml` 已内置自动健康检查。

## 更新部署

```bash
git pull
docker compose up -d --build
```

更新前建议先备份 `site.json`。

## 上线检查清单

- [ ] 已设置新的 `ADMIN_KEY`
- [ ] 已配置持久化卷并挂载到 `/app/data`
- [ ] 已启用 HTTPS
- [ ] 已设置 `COOKIE_SECURE=true`
- [ ] 已备份初始数据
- [ ] 已确认访问者只能浏览，右上角登录后才出现编辑按钮
- [ ] 已确认 `/healthz` 返回正常
