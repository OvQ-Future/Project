'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(ROOT, 'data'));
const DATA_FILE = path.join(DATA_DIR, 'site.json');
const PORT = Number.parseInt(process.env.PORT, 10) || 4173;
const HOST = normalizeBindHost(process.env.HOST);
const ADMIN_KEY = process.env.ADMIN_KEY || null;
const SECURE_COOKIES = process.env.COOKIE_SECURE === 'true' || (process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== 'false');
const BUILTIN_KEY_HASH = '909f59a3a74e38b27e27cdcff084bc39640c2a9329853656db756f059e26eaab';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 8;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;

const sessions = new Map();
const loginAttempts = new Map();
const expectedKeyHash = ADMIN_KEY
  ? crypto.createHash('sha256').update(ADMIN_KEY).digest()
  : Buffer.from(BUILTIN_KEY_HASH, 'hex');

const STATUS_VALUES = new Set(['active', 'wip', 'shipped', 'archived']);

function normalizeBindHost(value) {
  const host = String(value || '').trim();
  if (!host || host === '[::]' || host === '::') return '0.0.0.0';
  return host;
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function isoDaysAgo(days, hour = 10) {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function createInitialData() {
  const now = new Date().toISOString();
  const projects = [
    {
      id: 'pulseboard',
      title: 'Pulseboard',
      summary: '为独立开发者设计的轻量数据看板，把真正重要的信号留在视线里。',
      description: '# 项目概览\n\nPulseboard 是一个面向独立开发者和小型产品团队的轻量数据看板。它不试图替代专业 BI 工具，而是帮助你在每天开始时快速回答一个问题：**现在最值得关注的是什么？**\n\n## 核心能力\n\n- 用一行配置接入网站、API 与数据库指标\n- 自动生成日/周趋势，并标记异常波动\n- 可组合的轻量卡片，适合放在第二块屏幕常驻\n- 所有数据默认存储在你的设备或私有服务中\n\n## 技术选择\n\n前端使用 React + TypeScript，服务端采用 Node.js，指标存储使用 SQLite。项目保持单机可运行，也提供 Docker 部署方式。\n\n> 当前目标：把首次配置时间压缩到 3 分钟以内。\n\n## 下一步\n\n1. 完成 Webhook 告警通道\n2. 增加 CSV 导入\n3. 发布 v1.3 与公开文档',
      status: 'active',
      tags: ['React', 'TypeScript', 'SQLite'],
      createdAt: isoDaysAgo(214, 9),
      updatedAt: isoDaysAgo(1, 16),
      children: [
        {
          id: 'pulse-metrics',
          title: '实时指标引擎',
          summary: '用增量计算替代全量扫描的指标聚合模块。',
          description: '# 实时指标引擎\n\n这是 Pulseboard 的底层指标聚合模块。目标是在低资源设备上也能稳定处理秒级事件流。\n\n## 设计要点\n\n- 事件先写入环形缓冲区，再批量落盘\n- 按时间窗口预聚合，避免重复扫描\n- 查询层只读取已经压缩过的指标快照\n\n## 当前状态\n\n核心链路已经稳定，正在补充压力测试和故障恢复用例。',
          status: 'active',
          tags: ['Node.js', 'Streaming'],
          createdAt: isoDaysAgo(122, 11),
          updatedAt: isoDaysAgo(12, 15),
          children: []
        },
        {
          id: 'pulse-ui',
          title: '可视化组件库',
          summary: '为数据产品准备的一套克制、可组合的界面组件。',
          description: '# 可视化组件库\n\n一套以信息密度和可读性优先的界面组件，包含趋势卡片、状态标记、筛选器与数据表格。\n\n目前以内部包的形式维护，等待 API 稳定后开源。',
          status: 'wip',
          tags: ['Design System', 'React'],
          createdAt: isoDaysAgo(86, 13),
          updatedAt: isoDaysAgo(29, 10),
          children: []
        }
      ]
    },
    {
      id: 'papertrail',
      title: 'PaperTrail',
      summary: '把零散的灵感整理成可检索、可行动的个人知识网络。',
      description: '# PaperTrail\n\nPaperTrail 是一个本地优先的个人知识工具，帮助我把阅读笔记、产品灵感和待验证的假设连接起来。\n\n## 它解决什么问题\n\n传统笔记工具擅长保存，却不擅长提醒你「这条信息与什么有关」。PaperTrail 通过轻量标签、双向链接和每日回顾，让旧笔记重新进入工作流。\n\n## 功能切片\n\n- 本地优先的数据存储与离线可用\n- 双向链接与无感标签\n- 每日 3 条回顾卡片\n- 可导出的 Markdown 数据\n\n## 我的收获\n\n这个项目让我重新思考了搜索与组织之间的关系：**好的检索，往往来自更好的结构。**',
      status: 'wip',
      tags: ['TypeScript', 'IndexedDB', 'Local-first'],
      createdAt: isoDaysAgo(156, 14),
      updatedAt: isoDaysAgo(4, 20),
      children: []
    },
    {
      id: 'opengrid',
      title: 'OpenGrid',
      summary: '一个开源的响应式布局实验场，记录那些不常见的界面解法。',
      description: '# OpenGrid\n\nOpenGrid 是一个开放的响应式布局实验场。每个案例都尽量只使用 CSS Grid、容器查询和少量渐进增强脚本。\n\n## 已收录\n\n- 可变列数的编辑型布局\n- 不依赖 JavaScript 的瀑布流\n- 面向数据密集场景的折叠面板\n- 支持键盘导航的复杂卡片网格\n\n项目文档站已经上线，案例仍在持续补充。',
      status: 'shipped',
      tags: ['CSS', 'Open Source'],
      createdAt: isoDaysAgo(330, 10),
      updatedAt: isoDaysAgo(8, 18),
      children: []
    }
  ];

  const heatmap = {};

  return {
    profile: {
      name: 'XAj',
      handle: '@xaj',
      tagline: '正在构建一些值得被记住的东西。',
      bio: '独立开发者 / 产品设计者。喜欢把复杂的问题拆成简单、可靠、每天都能用的产品。目前专注于开发者工具与本地优先应用。',
      location: '中国',
      skills: ['Product Engineering', 'TypeScript', 'Node.js', 'UI Design'],
      avatar: ''
    },
    projects,
    activities: [],
    heatmap,
    createdAt: now,
    updatedAt: now
  };
}

function ensureDataShape(data) {
  const fallback = createInitialData();
  if (!data || typeof data !== 'object') return fallback;
  data.profile = { ...fallback.profile, ...(data.profile || {}) };
  data.projects = Array.isArray(data.projects) ? data.projects : [];
  data.activities = Array.isArray(data.activities) ? data.activities : [];
  data.heatmap = data.heatmap && typeof data.heatmap === 'object' ? data.heatmap : fallback.heatmap;
  data.createdAt = data.createdAt || new Date().toISOString();
  data.updatedAt = data.updatedAt || new Date().toISOString();
  return data;
}

function persist() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tempFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(store, null, 2), 'utf8');
  fs.renameSync(tempFile, DATA_FILE);
}

let store;
try {
  store = ensureDataShape(JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')));
  persist();
} catch (error) {
  store = createInitialData();
  persist();
}

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function publicError(res, status, message) {
  json(res, status, { error: message });
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  return header.split(';').reduce((acc, part) => {
    const index = part.indexOf('=');
    if (index > -1) {
      acc[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
    }
    return acc;
  }, {});
}

function getSession(req) {
  const sid = parseCookies(req).sid;
  if (!sid) return null;
  const session = sessions.get(sid);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    sessions.delete(sid);
    return null;
  }
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  return { sid, ...session };
}

function isOwner(req) {
  return Boolean(getSession(req));
}

function sessionCookie(sid) {
  const secure = SECURE_COOKIES ? '; Secure' : '';
  return `sid=${encodeURIComponent(sid)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}${secure}`;
}

function clearCookie() {
  return 'sid=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0';
}

function getClientIp(req) {
  return req.socket.remoteAddress || 'unknown';
}

function loginRateLimited(ip) {
  const record = loginAttempts.get(ip);
  if (!record) return false;
  if (record.resetAt < Date.now()) {
    loginAttempts.delete(ip);
    return false;
  }
  return record.count >= MAX_LOGIN_ATTEMPTS;
}

function recordLoginFailure(ip) {
  const existing = loginAttempts.get(ip);
  if (!existing || existing.resetAt < Date.now()) {
    loginAttempts.set(ip, { count: 1, resetAt: Date.now() + LOGIN_WINDOW_MS });
    return;
  }
  existing.count += 1;
}

function safeKeyMatch(value) {
  if (typeof value !== 'string') return false;
  const candidate = crypto.createHash('sha256').update(value).digest();
  return crypto.timingSafeEqual(candidate, expectedKeyHash);
}

function readJson(req, limit = 32 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let tooLarge = false;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        tooLarge = true;
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (tooLarge) {
        const error = new Error('请求内容过大。');
        error.status = 413;
        reject(error);
        return;
      }
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (error) {
        const parseError = new Error('请求内容不是有效的 JSON。');
        parseError.status = 400;
        reject(parseError);
      }
    });
    req.on('error', reject);
  });
}

function cleanText(value, maxLength, label, required = false) {
  if (value === undefined || value === null) value = '';
  if (typeof value !== 'string') throw new Error(`${label}格式不正确。`);
  const trimmed = value.trim();
  if (required && !trimmed) throw new Error(`请填写${label}。`);
  if (trimmed.length > maxLength) throw new Error(`${label}不能超过 ${maxLength} 个字符。`);
  return trimmed;
}

function normalizeTags(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((tag) => String(tag).trim()).filter(Boolean))].slice(0, 10).map((tag) => tag.slice(0, 30));
}

function touchHeatmap(amount = 1) {
  const key = dateKey();
  store.heatmap[key] = (store.heatmap[key] || 0) + amount;
  store.updatedAt = new Date().toISOString();
}

function addActivity(type, text, detail = '') {
  store.activities.unshift({
    id: `a_${crypto.randomUUID()}`,
    type: ['release', 'update', 'note', 'milestone'].includes(type) ? type : 'update',
    text,
    detail,
    createdAt: new Date().toISOString()
  });
  store.activities = store.activities.slice(0, 200);
}

function findProject(nodes, id, parent = null) {
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    if (node.id === id) return { node, parent, siblings: nodes, index };
    if (Array.isArray(node.children)) {
      const found = findProject(node.children, id, node);
      if (found) return found;
    }
  }
  return null;
}

function collectProjectIds(node, ids = []) {
  ids.push(node.id);
  (node.children || []).forEach((child) => collectProjectIds(child, ids));
  return ids;
}

function flattenProjects(nodes, depth = 0, output = []) {
  nodes.forEach((node) => {
    output.push({ id: node.id, title: node.title, depth });
    flattenProjects(node.children || [], depth + 1, output);
  });
  return output;
}

function countProjects(nodes) {
  return nodes.reduce((total, node) => total + 1 + countProjects(node.children || []), 0);
}

function requestSite(req) {
  return {
    profile: store.profile,
    projects: store.projects,
    activities: store.activities,
    heatmap: store.heatmap,
    updatedAt: store.updatedAt,
    isOwner: isOwner(req)
  };
}

function sendSite(req, res, status = 200, ownerOverride = undefined) {
  const payload = requestSite(req);
  if (typeof ownerOverride === 'boolean') payload.isOwner = ownerOverride;
  json(res, status, payload);
}

function validateProjectInput(body, existing = null) {
  const title = cleanText(body.title, 80, '项目名称', true);
  const summary = cleanText(body.summary, 180, '项目摘要');
  const description = cleanText(body.description, 16000, '项目描述');
  const status = STATUS_VALUES.has(body.status) ? body.status : 'active';
  const tags = normalizeTags(body.tags);
  const parentId = body.parentId ? String(body.parentId) : null;
  let targetParent = null;
  if (parentId) {
    const parent = findProject(store.projects, parentId);
    if (!parent) throw new Error('选择的上级项目不存在。');
    targetParent = parent.node;
  }
  if (existing) {
    const descendants = new Set(collectProjectIds(existing));
    if (parentId && descendants.has(parentId)) throw new Error('不能将项目移动到它自身或子项目下。');
  }
  return { title, summary, description, status, tags, parentId, targetParent };
}

function handleApi(req, res, url) {
  const pathname = url.pathname;
  const method = req.method;

  if (pathname === '/healthz' && method === 'GET') {
    json(res, 200, { status: 'ok', uptime: Math.floor(process.uptime()) });
    return true;
  }

  if (pathname === '/api/site' && method === 'GET') {
    sendSite(req, res);
    return true;
  }

  if (pathname === '/api/session' && method === 'GET') {
    json(res, 200, { isOwner: isOwner(req) });
    return true;
  }

  if (pathname === '/api/login' && method === 'POST') {
    (async () => {
      const ip = getClientIp(req);
      if (loginRateLimited(ip)) {
        publicError(res, 429, '尝试次数过多，请 10 分钟后再试。');
        return;
      }
      try {
        const body = await readJson(req, 8 * 1024);
        if (!safeKeyMatch(body.key)) {
          recordLoginFailure(ip);
          publicError(res, 401, '密钥不正确，请检查后重试。');
          return;
        }
        loginAttempts.delete(ip);
        const sid = crypto.randomBytes(32).toString('hex');
        sessions.set(sid, { createdAt: Date.now(), expiresAt: Date.now() + SESSION_TTL_MS });
        res.setHeader('Set-Cookie', sessionCookie(sid));
        sendSite(req, res, 200, true);
      } catch (error) {
        publicError(res, error.status || 400, error.message || '登录失败。');
      }
    })();
    return true;
  }

  if (pathname === '/api/logout' && method === 'POST') {
    const session = getSession(req);
    if (session) sessions.delete(session.sid);
    res.setHeader('Set-Cookie', clearCookie());
    json(res, 200, { ok: true });
    return true;
  }

  const protectedRoute = pathname.startsWith('/api/');
  if (protectedRoute && !isOwner(req)) {
    publicError(res, 401, '仅作者可以执行此操作。');
    return true;
  }

  if (pathname === '/api/profile' && method === 'PUT') {
    (async () => {
      try {
        const body = await readJson(req, 32 * 1024);
        const name = cleanText(body.name, 50, '作者名称', true);
        const handle = cleanText(body.handle, 40, '账号标识');
        const tagline = cleanText(body.tagline, 140, '个性签名');
        const bio = cleanText(body.bio, 800, '个人介绍');
        const location = cleanText(body.location, 80, '所在地');
        const skills = normalizeTags(body.skills);
        store.profile = { ...store.profile, name, handle, tagline, bio, location, skills };
        persist();
        sendSite(req, res);
      } catch (error) {
        publicError(res, error.status || 400, error.message || '保存失败。');
      }
    })();
    return true;
  }

  if (pathname === '/api/avatar' && method === 'POST') {
    (async () => {
      try {
        const body = await readJson(req, 3 * 1024 * 1024);
        const dataUrl = body.avatar;
        if (typeof dataUrl !== 'string' || !/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(dataUrl)) {
          throw new Error('请选择 PNG、JPG、WebP 或 GIF 图片。');
        }
        if (Buffer.byteLength(dataUrl, 'utf8') > 2 * 1024 * 1024) {
          throw new Error('头像不能超过 2MB。');
        }
        store.profile.avatar = dataUrl;
        persist();
        sendSite(req, res);
      } catch (error) {
        publicError(res, error.status || 400, error.message || '头像上传失败。');
      }
    })();
    return true;
  }

  if (pathname === '/api/activities' && method === 'POST') {
    (async () => {
      try {
        const body = await readJson(req, 32 * 1024);
        const text = cleanText(body.text, 120, '动态内容', true);
        const detail = cleanText(body.detail, 500, '动态详情');
        const type = ['release', 'update', 'note', 'milestone'].includes(body.type) ? body.type : 'update';
        addActivity(type, text, detail);
        touchHeatmap(1);
        persist();
        sendSite(req, res, 201);
      } catch (error) {
        publicError(res, error.status || 400, error.message || '发布失败。');
      }
    })();
    return true;
  }

  if (pathname.startsWith('/api/activities/') && method === 'DELETE') {
    const id = decodeURIComponent(pathname.slice('/api/activities/'.length));
    const index = store.activities.findIndex((item) => item.id === id);
    if (index === -1) {
      publicError(res, 404, '没有找到这条动态。');
      return true;
    }
    store.activities.splice(index, 1);
    persist();
    sendSite(req, res);
    return true;
  }

  if (pathname === '/api/projects' && method === 'POST') {
    (async () => {
      try {
        const body = await readJson(req, 64 * 1024);
        if (countProjects(store.projects) >= 200) throw new Error('项目数量已达到上限。');
        const input = validateProjectInput(body);
        const now = new Date().toISOString();
        const project = {
          id: `p_${crypto.randomBytes(6).toString('hex')}`,
          title: input.title,
          summary: input.summary,
          description: input.description,
          status: input.status,
          tags: input.tags,
          createdAt: now,
          updatedAt: now,
          children: []
        };
        if (input.targetParent) input.targetParent.children.push(project);
        else store.projects.push(project);
        touchHeatmap(1);
        persist();
        sendSite(req, res, 201);
      } catch (error) {
        publicError(res, error.status || 400, error.message || '创建项目失败。');
      }
    })();
    return true;
  }

  if (pathname.startsWith('/api/projects/') && method === 'PUT') {
    (async () => {
      try {
        const id = decodeURIComponent(pathname.slice('/api/projects/'.length));
        const located = findProject(store.projects, id);
        if (!located) {
          publicError(res, 404, '没有找到这个项目。');
          return;
        }
        const body = await readJson(req, 64 * 1024);
        const input = validateProjectInput(body, located.node);
        const updated = {
          ...located.node,
          title: input.title,
          summary: input.summary,
          description: input.description,
          status: input.status,
          tags: input.tags,
          updatedAt: new Date().toISOString()
        };
        const currentParentId = located.parent ? located.parent.id : null;
        if (currentParentId === input.parentId) {
          located.siblings[located.index] = updated;
        } else {
          located.siblings.splice(located.index, 1);
          if (input.targetParent) input.targetParent.children.push(updated);
          else store.projects.push(updated);
        }
        touchHeatmap(1);
        persist();
        sendSite(req, res);
      } catch (error) {
        publicError(res, error.status || 400, error.message || '更新项目失败。');
      }
    })();
    return true;
  }

  if (pathname.startsWith('/api/projects/') && method === 'DELETE') {
    const id = decodeURIComponent(pathname.slice('/api/projects/'.length));
    const located = findProject(store.projects, id);
    if (!located) {
      publicError(res, 404, '没有找到这个项目。');
      return true;
    }
    const removedCount = collectProjectIds(located.node).length;
    located.siblings.splice(located.index, 1);
    persist();
    sendSite(req, res);
    return true;
  }

  if (pathname === '/api/projects' || pathname === '/api/activities' || pathname === '/api/profile' || pathname === '/api/avatar') {
    publicError(res, 405, '请求方法不被允许。');
    return true;
  }

  if (pathname.startsWith('/api/')) {
    publicError(res, 404, '接口不存在。');
    return true;
  }

  return false;
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon'
};

function serveStatic(req, res, url) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    publicError(res, 405, '请求方法不被允许。');
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch (error) {
    publicError(res, 400, '地址格式不正确。');
    return;
  }

  let filePath = null;
  if (pathname === '/' || pathname === '/developer' || pathname === '/projects' || pathname.startsWith('/project/')) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  } else {
    const relative = pathname.replace(/^\/+/, '');
    const candidate = path.resolve(PUBLIC_DIR, relative);
    if (candidate.startsWith(`${PUBLIC_DIR}${path.sep}`)) {
      try {
        if (fs.statSync(candidate).isFile()) filePath = candidate;
      } catch (error) {
        filePath = null;
      }
    }
  }

  if (!filePath) {
    if (!path.extname(pathname)) {
      filePath = path.join(PUBLIC_DIR, 'index.html');
    } else {
      publicError(res, 404, '文件不存在。');
      return;
    }
  }

  try {
    const data = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Content-Length': data.length,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=300'
    });
    if (req.method === 'HEAD') res.end();
    else res.end(data);
  } catch (error) {
    publicError(res, 500, '读取页面失败。');
  }
}

const server = http.createServer((req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");

  let url;
  try {
    url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  } catch (error) {
    publicError(res, 400, '请求地址不正确。');
    return;
  }

  try {
    if (handleApi(req, res, url)) return;
    serveStatic(req, res, url);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) publicError(res, 500, '服务器发生了意外错误。');
  }
});

server.on('error', (error) => {
  console.error('Server failed to start:', error.message);
});

server.listen(PORT, HOST, () => {
  console.log(`Developer space running at http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`Data directory: ${DATA_DIR}`);
  console.log(`Owner key source: ${ADMIN_KEY ? 'ADMIN_KEY environment variable' : 'built-in protected key hash'}`);
  console.log(`Secure cookies: ${SECURE_COOKIES ? 'enabled' : 'disabled'}`);
  if (process.env.NODE_ENV === 'production' && !ADMIN_KEY) {
    console.warn('WARNING: Set ADMIN_KEY in production to replace the built-in login key.');
  }
});



