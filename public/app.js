'use strict';

const state = {
  site: null,
  error: null,
  route: parseRoute()
};

const app = document.getElementById('app');
const authActions = document.getElementById('auth-actions');
const modalRoot = document.getElementById('modal-root');
const toastRoot = document.getElementById('toast-root');
const avatarInput = document.getElementById('avatar-input');
const DAY_MS = 24 * 60 * 60 * 1000;

const ACTIVITY_LABELS = {
  release: 'Release',
  update: 'Update',
  note: 'Note',
  milestone: 'Milestone'
};

const STATUS_LABELS = {
  active: '进行中',
  wip: '开发中',
  shipped: '已发布',
  archived: '已归档'
};

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

function icon(name) {
  const icons = {
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 14v3"/></svg>',
    logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>',
    location: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.4"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M5 20h14"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6"/></svg>',
    folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></svg>',
    release: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.8-.5 5-2c.7-.8.7-2 0-2.8a2.2 2.2 0 0 0-3-.2Z"/><path d="m12 15-3-3c1.6-4 4.5-7.2 9-9 1.3-.5 3.6-.4 3.6-.4s.1 2.3-.4 3.6c-1.8 4.5-5 7.4-9 9Z"/><circle cx="15" cy="9" r="1.2"/></svg>',
    update: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7h-7a5 5 0 0 0-5 5v2"/><path d="m17 4 3 3-3 3"/><path d="M4 17h7a5 5 0 0 0 5-5v-2"/><path d="m7 20-3-3 3-3"/></svg>',
    note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h11l3 3v15H5Z"/><path d="M8 11h8M8 15h6"/></svg>',
    milestone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/></svg>',
    code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>'
  };
  return icons[name] || '';
}

function parseRoute() {
  const pathname = window.location.pathname;
  if (pathname.startsWith('/project/')) {
    let id = pathname.slice('/project/'.length);
    try { id = decodeURIComponent(id); } catch (error) { /* keep raw id */ }
    return { name: 'project', id };
  }
  if (pathname === '/projects') return { name: 'projects' };
  return { name: 'developer' };
}

function navigate(path, replace = false) {
  const next = new URL(path, window.location.origin);
  const target = `${next.pathname}${next.search}${next.hash}`;
  if (replace) window.history.replaceState({}, '', target);
  else window.history.pushState({}, '', target);
  state.route = parseRoute();
  closeModal();
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function api(path, options = {}) {
  const request = {
    method: options.method || 'GET',
    credentials: 'same-origin',
    headers: {}
  };
  if (options.body !== undefined) {
    request.headers['Content-Type'] = 'application/json';
    request.body = JSON.stringify(options.body);
  }
  const response = await fetch(path, request);
  let data = {};
  try {
    data = await response.json();
  } catch (error) {
    data = {};
  }
  if (!response.ok) {
    const requestError = new Error(data.error || `请求失败（${response.status}）`);
    requestError.status = response.status;
    throw requestError;
  }
  return data;
}

function applySite(data) {
  if (!data || !data.profile) return;
  state.site = data;
  state.error = null;
  render();
}

function render() {
  renderAuthActions();
  updateNav();
  if (state.error) {
    renderErrorState();
    return;
  }
  if (!state.site) {
    app.innerHTML = `
      <div class="page-loading" role="status">
        <span class="loading-orbit" aria-hidden="true"></span>
        <span>正在加载开发者空间</span>
      </div>`;
    return;
  }

  if (state.route.name === 'project') {
    const found = findProjectWithPath(state.site.projects, state.route.id);
    if (!found) renderNotFound();
    else renderProjectDetail(found);
    return;
  }

  if (state.route.name === 'projects') {
    renderProjectsPage();
    return;
  }

  renderDeveloperPage();
}

function renderAuthActions() {
  if (!state.site) return;
  if (state.site.isOwner) {
    authActions.innerHTML = `
      <span class="owner-mode">编辑模式</span>
      <button class="icon-btn" type="button" data-action="logout" title="退出登录" aria-label="退出登录">${icon('logout')}</button>`;
  } else {
    authActions.innerHTML = `
      <button class="btn btn-ghost btn-small" type="button" data-action="login">
        ${icon('lock')} 作者登录
      </button>`;
  }
}

function updateNav() {
  let active = 'developer';
  if (state.route.name === 'projects' || state.route.name === 'project') active = 'projects';
  document.querySelectorAll('[data-nav]').forEach((link) => {
    const isActive = link.dataset.nav === active;
    link.classList.toggle('is-active', isActive);
    if (isActive) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

function renderErrorState() {
  app.innerHTML = `
    <section class="panel not-found">
      <div class="not-found-code">CONNECTION / ERROR</div>
      <h1>暂时无法加载</h1>
      <p>${escapeHtml(state.error || '服务器没有响应，请稍后重试。')}</p>
      <button class="btn btn-primary" type="button" data-action="retry">重新加载</button>
    </section>`;
}

function renderNotFound() {
  app.innerHTML = `
    <section class="panel not-found">
      <div class="not-found-code">ERROR / 404</div>
      <h1>项目不在这里</h1>
      <p>这个项目可能已经被移动、移除，或者链接输入有误。</p>
      <a class="btn btn-primary" href="/projects">返回项目列表</a>
    </section>`;
}

function countProjects(nodes) {
  return nodes.reduce((total, node) => total + 1 + countProjects(node.children || []), 0);
}

function countStatus(nodes, status) {
  return nodes.reduce((total, node) => total + (node.status === status ? 1 : 0) + countStatus(node.children || [], status), 0);
}

function findProjectWithPath(nodes, id, path = []) {
  for (const node of nodes) {
    if (node.id === id) return { node, path };
    const found = findProjectWithPath(node.children || [], id, [...path, node]);
    if (found) return found;
  }
  return null;
}

function flattenProjects(nodes, depth = 0, output = []) {
  nodes.forEach((node) => {
    output.push({ node, depth });
    flattenProjects(node.children || [], depth + 1, output);
  });
  return output;
}

function getAllProjectIds(nodes) {
  return flattenProjects(nodes).map(({ node }) => node.id);
}

function formatDate(value, withTime = false) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '未知时间';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  if (withTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  return new Intl.DateTimeFormat('zh-CN', options).format(date);
}

function formatRelative(value) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  if (Number.isNaN(diff) || diff < 0) return formatDate(value);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 8) return `${days} 天前`;
  return formatDate(value);
}

function getInitials(name) {
  const value = String(name || '?').trim();
  if (!value) return '?';
  const words = value.split(/\s+/).filter(Boolean);
  if (words.length > 1 && /^[\x00-\x7F]/.test(value)) {
    return words.slice(0, 2).map((word) => word.charAt(0)).join('').toUpperCase();
  }
  return value.slice(0, 2).toUpperCase();
}

function localDateKey(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function computeContributionStats(heatmap) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - 364);
  let total = 0;
  let activeDays = 0;
  const keys = [];
  for (let i = 0; i < 365; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = localDateKey(d);
    const count = Number(heatmap[key] || 0);
    if (count > 0) {
      total += count;
      activeDays += 1;
    }
    keys.push({ key, count });
  }

  let longest = 0;
  let running = 0;
  keys.forEach(({ count }) => {
    if (count > 0) {
      running += 1;
      longest = Math.max(longest, running);
    } else {
      running = 0;
    }
  });

  let current = 0;
  let cursor = keys.length - 1;
  if (keys[cursor] && keys[cursor].count === 0) cursor -= 1;
  while (cursor >= 0 && keys[cursor].count > 0) {
    current += 1;
    cursor -= 1;
  }

  return { total, activeDays, longest, current, keys };
}

function heatmapHtml(heatmap) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - 364);
  start.setDate(start.getDate() - start.getDay());
  const weeks = Math.ceil(((today.getTime() - start.getTime()) / DAY_MS + 1) / 7);
  const monthLabels = new Array(weeks).fill('');
  const seenMonths = new Set();
  const cells = [];

  for (let week = 0; week < weeks; week += 1) {
    for (let day = 0; day < 7; day += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + week * 7 + day);
      const key = localDateKey(d);
      const future = d.getTime() > today.getTime();
      const count = Number(heatmap[key] || 0);
      const level = count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : count === 3 ? 3 : 4;
      const title = future ? `${d.getMonth() + 1} 月 ${d.getDate()} 日` : `${d.getMonth() + 1} 月 ${d.getDate()} 日 · ${count} 次更新`;
      cells.push(`<span class="heat-cell level-${level}${future ? ' is-future' : ''}" title="${escapeAttr(title)}" aria-label="${escapeAttr(title)}"></span>`);
      const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
      if (!future && d.getDate() <= 7 && !seenMonths.has(monthKey)) {
        seenMonths.add(monthKey);
        monthLabels[week] = `${d.getMonth() + 1}月`;
      }
    }
  }

  const dayLabels = ['', '一', '', '三', '', '五', ''];
  return `
    <div class="heatmap-scroll">
      <div class="heatmap-shell">
        <div></div>
        <div class="heatmap-months" aria-hidden="true">${monthLabels.map((label) => `<span class="heatmap-month">${label}</span>`).join('')}</div>
        <div class="heatmap-days" aria-hidden="true">${dayLabels.map((label) => `<span>${label}</span>`).join('')}</div>
        <div class="heatmap-grid" role="img" aria-label="最近一年的创作活跃度热力图">${cells.join('')}</div>
      </div>
    </div>`;
}

function renderDeveloperPage() {
  const { profile, activities, heatmap } = state.site;
  const isOwner = Boolean(state.site.isOwner);
  const projectCount = countProjects(state.site.projects);
  const stats = computeContributionStats(heatmap);
  const avatar = profile.avatar
    ? `<img class="avatar" src="${escapeAttr(profile.avatar)}" alt="${escapeAttr(profile.name)}的头像">`
    : `<div class="avatar avatar-fallback" aria-label="${escapeAttr(profile.name)}的头像">${escapeHtml(getInitials(profile.name))}</div>`;
  const skills = (profile.skills || []).map((skill) => `<span class="meta-pill"># ${escapeHtml(skill)}</span>`).join('');
  const meta = [
    profile.location ? `<span class="meta-pill">${icon('location')} ${escapeHtml(profile.location)}</span>` : '',
    `<span class="meta-pill">${icon('folder')} ${projectCount} 个项目</span>`
  ].join('');

  const activitiesHtml = activities.length
    ? activities.map((activity) => activityItemHtml(activity, isOwner)).join('')
    : `<li class="empty-state">
        <div class="empty-state-icon">${icon('note')}</div>
        <h3>还没有动态</h3>
        <p>${isOwner ? '发布第一条动态，让访客看到最近在做什么。' : '作者还没有发布动态。'}</p>
      </li>`;

  app.innerHTML = `
    <div class="page-enter">
      <section class="profile-hero" aria-labelledby="profile-name">
        <article class="panel profile-main">
          <div class="profile-topline">
            <div class="profile-identity">
              <div class="avatar-shell">
                <div class="avatar-ring">${avatar}</div>
                ${isOwner ? `<button class="avatar-edit" type="button" data-action="upload-avatar" title="更换头像" aria-label="更换头像">${icon('upload')}</button>` : ''}
              </div>
              <div>
                <p class="eyebrow">Developer Profile</p>
                <h1 class="profile-name" id="profile-name">${escapeHtml(profile.name)}</h1>
                <div class="profile-handle">${escapeHtml(profile.handle || '@developer')}</div>
              </div>
            </div>
            ${isOwner ? `<button class="btn btn-ghost btn-small profile-edit-btn" type="button" data-action="edit-profile">${icon('edit')} 编辑资料</button>` : ''}
          </div>
          <p class="profile-tagline">${escapeHtml(profile.tagline || '在这里写下你的个性签名。')}</p>
          <p class="profile-bio">${escapeHtml(profile.bio || '这位开发者还没有填写个人介绍。')}</p>
          <div class="profile-meta">
            ${meta}
            ${skills}
          </div>
        </article>

        <aside class="panel signal-card" aria-label="创作概览">
          <div class="signal-top">
            <div class="traffic-lights" aria-hidden="true"><i></i><i></i><i></i></div>
            <span>developer.signal</span>
          </div>
          <div class="signal-code" aria-hidden="true">
            <div><span class="code-muted">const</span> <span class="code-key">developer</span> = {</div>
            <div>&nbsp;&nbsp;name: <span class="code-string">${escapeHtml(JSON.stringify(profile.name))}</span>,</div>
            <div>&nbsp;&nbsp;status: <span class="code-value">'building'</span>,</div>
            <div>&nbsp;&nbsp;focus: <span class="code-string">'ship &amp; learn'</span><span class="code-cursor"></span></div>
            <div>};</div>
          </div>
          <div class="mini-stats">
            <div class="mini-stat"><strong>${projectCount}</strong><span>PROJECTS</span></div>
            <div class="mini-stat"><strong>${stats.total}</strong><span>CONTRIBUTIONS</span></div>
            <div class="mini-stat"><strong>${stats.current}</strong><span>DAY STREAK</span></div>
          </div>
        </aside>
      </section>

      <section class="content-section" aria-labelledby="activity-title">
        <div class="section-head">
          <div class="section-title-wrap">
            <p class="eyebrow">Pulse</p>
            <h2 class="section-title" id="activity-title">最近动态</h2>
            <p class="section-caption">正在发生的事，以及刚刚完成的里程碑。</p>
          </div>
          ${isOwner ? `<button class="btn btn-ghost btn-small" type="button" data-action="add-activity">${icon('plus')} 发布动态</button>` : ''}
        </div>
        <div class="panel activity-panel">
          <ol class="activity-list">${activitiesHtml}</ol>
        </div>
      </section>

      <section class="content-section" aria-labelledby="contribution-title">
        <div class="section-head">
          <div class="section-title-wrap">
            <p class="eyebrow">Consistency</p>
            <h2 class="section-title" id="contribution-title">创作趋势</h2>
            <p class="section-caption">过去一年里，由你真实发布动态或创建、更新项目留下的记录。</p>
          </div>
        </div>
        <div class="panel contribution-card">
          <div class="contribution-head">
            <div>
              <p class="contribution-total"><strong>${stats.total}</strong> 次创作活动</p>
              <div class="contribution-meta">
                <span>${stats.activeDays} 个活跃日</span>
                <span>最长连续 ${stats.longest} 天</span>
                <span>当前连续 ${stats.current} 天</span>
              </div>
            </div>
            <div class="contribution-legend" aria-label="活跃度图例">
              <span>少</span>
              <i class="legend-cell"></i>
              <i class="legend-cell l1"></i>
              <i class="legend-cell l2"></i>
              <i class="legend-cell l3"></i>
              <i class="legend-cell l4"></i>
              <span>多</span>
            </div>
          </div>
          ${heatmapHtml(heatmap)}
          ${stats.total === 0 ? `<p class="contribution-empty">${isOwner ? '还没有真实创作记录。发布动态，或创建、更新项目后，这里会按实际日期开始累计。' : '作者还没有产生创作记录。'}</p>` : ''}
        </div>
      </section>
    </div>`;
}

function activityItemHtml(activity, isOwner) {
  const type = ACTIVITY_LABELS[activity.type] ? activity.type : 'update';
  return `
    <li class="activity-item">
      <div class="activity-icon type-${type}" aria-hidden="true">${icon(type)}</div>
      <div class="activity-body">
        <div class="activity-title-row">
          <h3 class="activity-title">${escapeHtml(activity.text)}</h3>
          <span class="activity-type">${ACTIVITY_LABELS[type]}</span>
        </div>
        ${activity.detail ? `<p class="activity-detail">${escapeHtml(activity.detail)}</p>` : ''}
      </div>
      <div class="activity-aside">
        <time class="activity-time" datetime="${escapeAttr(activity.createdAt)}" title="${escapeAttr(formatDate(activity.createdAt, true))}">${escapeHtml(formatRelative(activity.createdAt))}</time>
        ${isOwner ? `<button class="icon-btn" type="button" data-action="delete-activity" data-id="${escapeAttr(activity.id)}" title="删除动态" aria-label="删除动态">${icon('trash')}</button>` : ''}
      </div>
    </li>`;
}

function statusBadge(status) {
  const normalized = STATUS_LABELS[status] ? status : 'active';
  return `<span class="status-badge status-${normalized}">${STATUS_LABELS[normalized]}</span>`;
}

function projectTreeHtml(nodes, isOwner) {
  if (!nodes.length) {
    return `<li class="empty-state">
      <div class="empty-state-icon">${icon('folder')}</div>
      <h3>还没有项目</h3>
      <p>${isOwner ? '创建第一个项目，开始搭建你的项目树。' : '作者还没有添加项目。'}</p>
    </li>`;
  }

  return nodes.map((node) => {
    const children = node.children || [];
    const tags = (node.tags || []).slice(0, 3).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('');
    return `
      <li class="project-node">
        <a class="project-card" href="/project/${encodeURIComponent(node.id)}">
          <span class="project-icon" aria-hidden="true">${escapeHtml(getInitials(node.title).slice(0, 1))}</span>
          <span class="project-card-main">
            <span class="project-card-title-row">
              <span class="project-card-title">${escapeHtml(node.title)}</span>
              ${statusBadge(node.status)}
            </span>
            <span class="project-card-summary">${escapeHtml(node.summary || '暂无项目摘要。')}</span>
            <span class="project-card-meta">
              ${tags}
              <span class="tag">${escapeHtml(formatDate(node.updatedAt))}</span>
            </span>
          </span>
          <span class="project-arrow" aria-hidden="true">${icon('arrow')}</span>
        </a>
        ${isOwner ? `
          <div class="project-owner-tools">
            <button class="btn btn-small" type="button" data-action="add-child" data-id="${escapeAttr(node.id)}">${icon('plus')} 子项目</button>
            <button class="btn btn-small" type="button" data-action="edit-project" data-id="${escapeAttr(node.id)}">${icon('edit')} 编辑</button>
            <button class="btn btn-small" type="button" data-action="delete-project" data-id="${escapeAttr(node.id)}">${icon('trash')} 删除</button>
          </div>` : ''}
        ${children.length ? `<ul class="project-children">${projectTreeHtml(children, isOwner)}</ul>` : ''}
      </li>`;
  }).join('');
}

function renderProjectsPage() {
  const isOwner = Boolean(state.site.isOwner);
  const projectCount = countProjects(state.site.projects);
  const activeCount = countStatus(state.site.projects, 'active') + countStatus(state.site.projects, 'wip');
  const all = flattenProjects(state.site.projects);
  const latest = all
    .map(({ node }) => node.updatedAt)
    .filter(Boolean)
    .sort((a, b) => new Date(b) - new Date(a))[0];

  app.innerHTML = `
    <div class="page-enter">
      <header class="page-head">
        <div>
          <p class="eyebrow">Project Index</p>
          <h1 class="page-title">项目</h1>
          <p class="page-subtitle">一棵持续生长的项目树。每个节点都有自己的上下文、状态与故事。</p>
        </div>
        ${isOwner ? `<div class="page-actions">
          <button class="btn btn-primary" type="button" data-action="new-project">${icon('plus')} 新建项目</button>
        </div>` : ''}
      </header>

      <div class="project-summary-grid">
        <div class="summary-tile"><span>All projects</span><strong>${projectCount}</strong></div>
        <div class="summary-tile"><span>In progress</span><strong>${activeCount}</strong></div>
        <div class="summary-tile"><span>Last update</span><strong>${latest ? escapeHtml(formatDate(latest)) : '—'}</strong></div>
      </div>

      <div class="project-layout">
        <section class="panel project-tree-panel" aria-label="项目树">
          <ul class="project-tree">${projectTreeHtml(state.site.projects, isOwner)}</ul>
        </section>
        <aside class="project-sidebar">
          <div class="side-card">
            <h3>阅读方式</h3>
            <p>项目按层级组织。点击任意项目卡片，可进入它的独立页面查看完整描述。</p>
            <p class="side-tip">每个项目都有稳定的分享链接。</p>
          </div>
          ${isOwner ? `
          <div class="side-card">
            <h3>编辑权限</h3>
            <p>你正处于作者模式。可以新建项目、添加子项目，或编辑任意节点的内容与位置。</p>
          </div>` : `
          <div class="side-card">
            <h3>只读访问</h3>
            <p>当前为访客视角。项目内容由作者维护，你可以浏览所有公开信息。</p>
          </div>`}
        </aside>
      </div>
    </div>`;
}

function renderProjectDetail(found) {
  const { node, path } = found;
  const isOwner = Boolean(state.site.isOwner);
  const children = node.children || [];
  const breadcrumb = [
    `<a href="/projects">项目</a>`,
    ...path.map((parent) => `<span class="breadcrumb-sep">/</span><a href="/project/${encodeURIComponent(parent.id)}">${escapeHtml(parent.title)}</a>`),
    `<span class="breadcrumb-sep">/</span><span class="current">${escapeHtml(node.title)}</span>`
  ].join('');
  const tags = (node.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('');

  app.innerHTML = `
    <div class="page-enter">
      <nav class="breadcrumb" aria-label="面包屑">${breadcrumb}</nav>
      <header class="panel detail-header">
        <div class="detail-topline">
          <div>
            <p class="eyebrow">Project Detail</p>
            <div class="detail-title-row">
              <h1 class="detail-title">${escapeHtml(node.title)}</h1>
              ${statusBadge(node.status)}
            </div>
            <p class="detail-summary">${escapeHtml(node.summary || '这个项目还没有摘要。')}</p>
          </div>
          ${isOwner ? `
          <div class="detail-owner-actions">
            <button class="btn btn-ghost btn-small" type="button" data-action="add-child" data-id="${escapeAttr(node.id)}">${icon('plus')} 子项目</button>
            <button class="btn btn-ghost btn-small" type="button" data-action="edit-project" data-id="${escapeAttr(node.id)}">${icon('edit')} 编辑</button>
            <button class="btn btn-danger btn-small" type="button" data-action="delete-project" data-id="${escapeAttr(node.id)}">${icon('trash')} 删除</button>
          </div>` : ''}
        </div>
        <div class="detail-meta">
          <span class="detail-meta-item">${icon('calendar')} 创建于 ${escapeHtml(formatDate(node.createdAt))}</span>
          <span class="detail-meta-item">${icon('clock')} 更新于 ${escapeHtml(formatDate(node.updatedAt))}</span>
          <span class="detail-meta-item">${icon('folder')} ${children.length} 个子项目</span>
          ${tags ? `<span class="detail-meta-item">${tags}</span>` : ''}
        </div>
      </header>

      <div class="detail-layout">
        <article class="panel prose-card">
          <div class="prose">${renderMarkdown(node.description || '')}</div>
        </article>
        <aside class="detail-sidebar">
          <div class="side-card">
            <h3>项目信息</h3>
            <div class="side-stat-row"><span>状态</span><strong>${STATUS_LABELS[node.status] || STATUS_LABELS.active}</strong></div>
            <div class="side-stat-row"><span>子项目</span><strong>${children.length}</strong></div>
            <div class="side-stat-row"><span>最后更新</span><strong>${escapeHtml(formatDate(node.updatedAt))}</strong></div>
          </div>
          ${children.length ? `
          <div class="side-card">
            <h3>子项目</h3>
            <ul class="mini-tree">
              ${children.map((child) => `<li><a href="/project/${encodeURIComponent(child.id)}">↳ ${escapeHtml(child.title)}</a></li>`).join('')}
            </ul>
          </div>` : ''}
          <div class="side-card">
            <h3>分享这个项目</h3>
            <p>这是一个独立页面，可以直接复制链接分享给其他人。</p>
            <button class="btn btn-ghost btn-small" style="margin-top: 12px; width: 100%;" type="button" data-action="copy-link">${icon('link')} 复制页面链接</button>
          </div>
        </aside>
      </div>
    </div>`;
}

function inlineMarkdown(text) {
  let result = escapeHtml(text);
  result = result.replace(/`([^`]+)`/g, '<code>$1</code>');
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  result = result.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return result;
}

function renderMarkdown(markdown) {
  const source = String(markdown || '').replace(/\r\n?/g, '\n').trim();
  if (!source) return '<p>这个项目还没有详细描述。</p>';

  const lines = source.split('\n');
  const output = [];
  let paragraph = [];
  let listType = null;
  let inCode = false;
  let codeLines = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      output.push(`<p>${inlineMarkdown(paragraph.join('\n')).replace(/\n/g, '<br>')}</p>`);
      paragraph = [];
    }
  };
  const closeList = () => {
    if (listType) {
      output.push(`</${listType}>`);
      listType = null;
    }
  };

  lines.forEach((line) => {
    if (inCode) {
      if (line.trim().startsWith('```')) {
        output.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        inCode = false;
        codeLines = [];
      } else {
        codeLines.push(line);
      }
      return;
    }

    if (line.trim().startsWith('```')) {
      flushParagraph();
      closeList();
      inCode = true;
      return;
    }

    if (!line.trim()) {
      flushParagraph();
      closeList();
      return;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      closeList();
      const level = heading[1].length;
      output.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      return;
    }

    if (/^---+$/.test(line.trim())) {
      flushParagraph();
      closeList();
      output.push('<hr>');
      return;
    }

    const unordered = line.match(/^\s*[-*]\s+(.+)$/);
    if (unordered) {
      flushParagraph();
      if (listType !== 'ul') {
        closeList();
        output.push('<ul>');
        listType = 'ul';
      }
      output.push(`<li>${inlineMarkdown(unordered[1])}</li>`);
      return;
    }

    const ordered = line.match(/^\s*\d+\.\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      if (listType !== 'ol') {
        closeList();
        output.push('<ol>');
        listType = 'ol';
      }
      output.push(`<li>${inlineMarkdown(ordered[1])}</li>`);
      return;
    }

    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      flushParagraph();
      closeList();
      output.push(`<blockquote>${inlineMarkdown(quote[1])}</blockquote>`);
      return;
    }

    closeList();
    paragraph.push(line);
  });

  if (inCode) output.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
  flushParagraph();
  closeList();
  return output.join('\n');
}

function openModal(options) {
  const { title, subtitle = '', body = '', wide = false, onMount } = options;
  document.body.style.overflow = 'hidden';
  modalRoot.innerHTML = `
    <div class="modal-backdrop" data-modal-backdrop>
      <section class="modal ${wide ? 'modal-wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header class="modal-head">
          <div>
            <h2 id="modal-title">${escapeHtml(title)}</h2>
            ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}
          </div>
          <button class="icon-btn modal-close" type="button" data-action="close-modal" aria-label="关闭">${icon('close')}</button>
        </header>
        <div class="modal-body">${body}</div>
      </section>
    </div>`;
  const backdrop = modalRoot.querySelector('[data-modal-backdrop]');
  backdrop.addEventListener('mousedown', (event) => {
    if (event.target === backdrop) closeModal();
  });
  if (typeof onMount === 'function') onMount(modalRoot.querySelector('.modal'));
  const focusTarget = modalRoot.querySelector('input, textarea, select, button:not(.modal-close)');
  if (focusTarget) window.setTimeout(() => focusTarget.focus(), 40);
}

function closeModal() {
  modalRoot.innerHTML = '';
  document.body.style.overflow = '';
}

function setFormError(form, message) {
  const error = form.querySelector('.form-error');
  if (!error) return;
  error.textContent = message;
  error.classList.add('is-visible');
}

function setFormBusy(form, busy) {
  const buttons = form.querySelectorAll('button, input, textarea, select');
  buttons.forEach((element) => { element.disabled = busy; });
  const submit = form.querySelector('[type="submit"]');
  if (submit) submit.textContent = busy ? '处理中…' : (submit.dataset.label || submit.textContent);
}

function openLoginModal() {
  openModal({
    title: '作者登录',
    subtitle: '解锁编辑模式',
    body: `
      <div class="login-icon">${icon('lock')}</div>
      <p class="login-note">输入作者密钥后，你可以修改个人资料、上传头像、发布动态，并管理项目树。<strong>访客无需登录，始终可以浏览全部公开内容。</strong></p>
      <form id="login-form" novalidate>
        <div class="form-field">
          <label class="form-label" for="owner-key">作者密钥</label>
          <input class="input" id="owner-key" name="key" type="password" autocomplete="current-password" placeholder="请输入密钥" required>
        </div>
        <p class="form-error" role="alert"></p>
        <div class="modal-actions">
          <button class="btn btn-ghost" type="button" data-action="close-modal">取消</button>
          <button class="btn btn-primary" type="submit">解锁编辑模式</button>
        </div>
      </form>`,
    onMount(modal) {
      const form = modal.querySelector('#login-form');
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const key = form.key.value;
        if (!key) {
          setFormError(form, '请输入作者密钥。');
          return;
        }
        setFormError(form, '');
        form.querySelector('.form-error').classList.remove('is-visible');
        setFormBusy(form, true);
        try {
          const data = await api('/api/login', { method: 'POST', body: { key } });
          state.site = data;
          closeModal();
          render();
          toast('已进入编辑模式。', 'success');
        } catch (error) {
          setFormBusy(form, false);
          setFormError(form, error.message);
        }
      });
    }
  });
}

async function logout() {
  try {
    await api('/api/logout', { method: 'POST' });
  } catch (error) {
    // The local state should still be cleared if the session already expired.
  }
  if (state.site) state.site.isOwner = false;
  closeModal();
  render();
  toast('已退出作者模式。', 'success');
}

function openProfileModal() {
  const profile = state.site.profile;
  openModal({
    title: '编辑个人资料',
    subtitle: '这些内容会显示在开发者首页',
    wide: true,
    body: `
      <form id="profile-form" novalidate>
        <div class="form-grid">
          <div class="form-field">
            <label class="form-label" for="profile-name-input">作者名称 *</label>
            <input class="input" id="profile-name-input" name="name" maxlength="50" value="${escapeAttr(profile.name)}" required>
          </div>
          <div class="form-field">
            <label class="form-label" for="profile-handle-input">账号标识</label>
            <input class="input" id="profile-handle-input" name="handle" maxlength="40" value="${escapeAttr(profile.handle || '')}" placeholder="@yourname">
          </div>
          <div class="form-field full">
            <label class="form-label" for="profile-tagline-input">个性签名</label>
            <input class="input" id="profile-tagline-input" name="tagline" maxlength="140" value="${escapeAttr(profile.tagline || '')}" placeholder="一句话介绍你正在做的事">
          </div>
          <div class="form-field full">
            <label class="form-label" for="profile-bio-input">个人介绍</label>
            <textarea class="textarea" id="profile-bio-input" name="bio" maxlength="800" placeholder="介绍一下你的方向、经历和正在关注的事">${escapeHtml(profile.bio || '')}</textarea>
          </div>
          <div class="form-field">
            <label class="form-label" for="profile-location-input">所在地</label>
            <input class="input" id="profile-location-input" name="location" maxlength="80" value="${escapeAttr(profile.location || '')}" placeholder="例如：杭州，中国">
          </div>
          <div class="form-field">
            <label class="form-label" for="profile-skills-input">技能与关键词</label>
            <input class="input" id="profile-skills-input" name="skills" maxlength="300" value="${escapeAttr((profile.skills || []).join(', '))}" placeholder="用逗号分隔">
            <span class="form-hint">例如：TypeScript, Product Design, Node.js</span>
          </div>
        </div>
        <p class="form-error" role="alert"></p>
        <div class="modal-actions">
          <button class="btn btn-ghost" type="button" data-action="close-modal">取消</button>
          <button class="btn btn-primary" type="submit">保存资料</button>
        </div>
      </form>`,
    onMount(modal) {
      const form = modal.querySelector('#profile-form');
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const payload = {
          name: form.name.value,
          handle: form.handle.value,
          tagline: form.tagline.value,
          bio: form.bio.value,
          location: form.location.value,
          skills: form.skills.value.split(',').map((item) => item.trim()).filter(Boolean)
        };
        setFormBusy(form, true);
        try {
          const data = await api('/api/profile', { method: 'PUT', body: payload });
          state.site = data;
          closeModal();
          render();
          toast('个人资料已保存。', 'success');
        } catch (error) {
          setFormBusy(form, false);
          setFormError(form, error.message);
        }
      });
    }
  });
}

function openActivityModal() {
  openModal({
    title: '发布动态',
    subtitle: '记录一次更新、发布或里程碑',
    body: `
      <form id="activity-form" novalidate>
        <div class="form-grid">
          <div class="form-field">
            <label class="form-label" for="activity-type">动态类型</label>
            <select class="select" id="activity-type" name="type">
              <option value="update">更新</option>
              <option value="release">发布</option>
              <option value="milestone">里程碑</option>
              <option value="note">随笔</option>
            </select>
          </div>
          <div class="form-field">
            <label class="form-label" for="activity-text">一句话动态 *</label>
            <input class="input" id="activity-text" name="text" maxlength="120" placeholder="例如：发布了 v1.0" required>
          </div>
          <div class="form-field full">
            <label class="form-label" for="activity-detail">补充说明</label>
            <textarea class="textarea" id="activity-detail" name="detail" maxlength="500" placeholder="可选：补充背景、结果或下一步"></textarea>
          </div>
        </div>
        <p class="form-error" role="alert"></p>
        <div class="modal-actions">
          <button class="btn btn-ghost" type="button" data-action="close-modal">取消</button>
          <button class="btn btn-primary" type="submit">发布动态</button>
        </div>
      </form>`,
    onMount(modal) {
      const form = modal.querySelector('#activity-form');
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!form.text.value.trim()) {
          setFormError(form, '请填写动态内容。');
          return;
        }
        setFormBusy(form, true);
        try {
          const data = await api('/api/activities', {
            method: 'POST',
            body: { type: form.type.value, text: form.text.value, detail: form.detail.value }
          });
          state.site = data;
          closeModal();
          render();
          toast('动态已发布。', 'success');
        } catch (error) {
          setFormBusy(form, false);
          setFormError(form, error.message);
        }
      });
    }
  });
}

function openProjectModal(project = null, presetParentId = null) {
  const editing = Boolean(project);
  const excluded = new Set();
  if (editing) {
    const located = findProjectWithPath(state.site.projects, project.id);
    if (located) {
      const addIds = (node) => {
        excluded.add(node.id);
        (node.children || []).forEach(addIds);
      };
      addIds(located.node);
    }
  }
  const options = flattenProjects(state.site.projects)
    .filter(({ node }) => !excluded.has(node.id))
    .map(({ node, depth }) => `<option value="${escapeAttr(node.id)}" ${((editing ? findParentId(project.id) : presetParentId) === node.id) ? 'selected' : ''}>${escapeHtml(`${'— '.repeat(depth)}${node.title}`)}</option>`)
    .join('');

  openModal({
    title: editing ? '编辑项目' : '新建项目',
    subtitle: editing ? '更新项目信息或调整它在树中的位置' : '创建一个新的项目节点',
    wide: true,
    body: `
      <form id="project-form" novalidate>
        <div class="form-grid">
          <div class="form-field">
            <label class="form-label" for="project-title">项目名称 *</label>
            <input class="input" id="project-title" name="title" maxlength="80" value="${escapeAttr(project?.title || '')}" placeholder="例如：Pulseboard" required>
          </div>
          <div class="form-field">
            <label class="form-label" for="project-status">项目状态</label>
            <select class="select" id="project-status" name="status">
              ${Object.entries(STATUS_LABELS).map(([value, label]) => `<option value="${value}" ${(project?.status || 'active') === value ? 'selected' : ''}>${label}</option>`).join('')}
            </select>
          </div>
          <div class="form-field full">
            <label class="form-label" for="project-parent">上级项目</label>
            <select class="select" id="project-parent" name="parentId">
              <option value="">无（作为顶级项目）</option>
              ${options}
            </select>
            <span class="form-hint">选择一个上级项目，可以把它放进现有的项目树中。</span>
          </div>
          <div class="form-field full">
            <label class="form-label" for="project-summary">项目摘要</label>
            <input class="input" id="project-summary" name="summary" maxlength="180" value="${escapeAttr(project?.summary || '')}" placeholder="用一句话说明这个项目解决什么问题">
          </div>
          <div class="form-field full">
            <label class="form-label" for="project-tags">技术标签</label>
            <input class="input" id="project-tags" name="tags" maxlength="240" value="${escapeAttr((project?.tags || []).join(', '))}" placeholder="用逗号分隔，例如：TypeScript, React">
          </div>
          <div class="form-field full">
            <label class="form-label" for="project-description">项目详细描述</label>
            <textarea class="textarea tall" id="project-description" name="description" maxlength="16000" placeholder="支持简单 Markdown：# 标题、## 小标题、- 列表、**加粗**、代码">${escapeHtml(project?.description || '')}</textarea>
            <span class="form-hint">支持标题、列表、引用、代码块和基础 Markdown 格式。</span>
          </div>
        </div>
        <p class="form-error" role="alert"></p>
        <div class="modal-actions">
          <button class="btn btn-ghost" type="button" data-action="close-modal">取消</button>
          <button class="btn btn-primary" type="submit">${editing ? '保存修改' : '创建项目'}</button>
        </div>
      </form>`,
    onMount(modal) {
      const form = modal.querySelector('#project-form');
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!form.title.value.trim()) {
          setFormError(form, '请填写项目名称。');
          return;
        }
        const payload = {
          title: form.title.value,
          summary: form.summary.value,
          status: form.status.value,
          parentId: form.parentId.value || null,
          tags: form.tags.value.split(',').map((item) => item.trim()).filter(Boolean),
          description: form.description.value
        };
        const oldIds = new Set(getAllProjectIds(state.site.projects));
        setFormBusy(form, true);
        try {
          const data = editing
            ? await api(`/api/projects/${encodeURIComponent(project.id)}`, { method: 'PUT', body: payload })
            : await api('/api/projects', { method: 'POST', body: payload });
          state.site = data;
          const newProject = editing ? null : flattenProjects(data.projects).find(({ node }) => !oldIds.has(node.id));
          closeModal();
          if (newProject) {
            window.history.pushState({}, '', `/project/${encodeURIComponent(newProject.node.id)}`);
            state.route = parseRoute();
            render();
          } else {
            render();
          }
          toast(editing ? '项目已更新。' : '项目已创建。', 'success');
        } catch (error) {
          setFormBusy(form, false);
          setFormError(form, error.message);
        }
      });
    }
  });
}

function findParentId(projectId, nodes = state.site.projects, parentId = null) {
  for (const node of nodes) {
    if (node.id === projectId) return parentId;
    const found = findParentId(projectId, node.children || [], node.id);
    if (found !== null) return found;
  }
  return null;
}

function openDeleteActivity(activityId) {
  openConfirm({
    title: '删除这条动态？',
    message: '删除后将无法恢复，但不会影响项目内容。',
    confirmLabel: '删除动态',
    onConfirm: async () => {
      const data = await api(`/api/activities/${encodeURIComponent(activityId)}`, { method: 'DELETE' });
      state.site = data;
      closeModal();
      render();
      toast('动态已删除。', 'success');
    }
  });
}

function openDeleteProject(projectId) {
  const located = findProjectWithPath(state.site.projects, projectId);
  if (!located) return;
  const childCount = countProjects(located.node.children || []);
  openConfirm({
    title: '删除这个项目？',
    message: childCount
      ? `「${located.node.title}」包含 ${childCount} 个子项目。删除后，它们也会一并从项目树中移除，且无法恢复。`
      : `「${located.node.title}」将从项目树中移除，且无法恢复。`,
    confirmLabel: '删除项目',
    onConfirm: async () => {
      const data = await api(`/api/projects/${encodeURIComponent(projectId)}`, { method: 'DELETE' });
      state.site = data;
      closeModal();
      if (state.route.name === 'project' && state.route.id === projectId) {
        window.history.pushState({}, '', '/projects');
        state.route = parseRoute();
      }
      render();
      toast('项目已删除。', 'success');
    }
  });
}

function openConfirm({ title, message, confirmLabel, onConfirm }) {
  openModal({
    title,
    body: `
      <p class="login-note">${escapeHtml(message)}</p>
      <div class="form-error" role="alert"></div>
      <div class="modal-actions">
        <button class="btn btn-ghost" type="button" data-action="close-modal">取消</button>
        <button class="btn btn-danger" id="confirm-action" type="button">${escapeHtml(confirmLabel || '确认')}</button>
      </div>`,
    onMount(modal) {
      const button = modal.querySelector('#confirm-action');
      button.addEventListener('click', async () => {
        const errorBox = modal.querySelector('.form-error');
        button.disabled = true;
        button.textContent = '处理中…';
        try {
          await onConfirm();
        } catch (error) {
          button.disabled = false;
          button.textContent = confirmLabel || '确认';
          errorBox.textContent = error.message;
          errorBox.classList.add('is-visible');
          if (error.status === 401) {
            state.site.isOwner = false;
            renderAuthActions();
          }
        }
      });
    }
  });
}

function toast(message, type = 'success') {
  const element = document.createElement('div');
  element.className = `toast ${type}`;
  element.textContent = message;
  toastRoot.appendChild(element);
  window.setTimeout(() => {
    element.classList.add('is-leaving');
    window.setTimeout(() => element.remove(), 200);
  }, 2800);
}

async function copyCurrentLink() {
  try {
    await navigator.clipboard.writeText(window.location.href);
    toast('链接已复制到剪贴板。', 'success');
  } catch (error) {
    const helper = document.createElement('textarea');
    helper.value = window.location.href;
    helper.style.position = 'fixed';
    helper.style.opacity = '0';
    document.body.appendChild(helper);
    helper.select();
    document.execCommand('copy');
    helper.remove();
    toast('链接已复制到剪贴板。', 'success');
  }
}

async function uploadAvatar(file) {
  if (!file) return;
  if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) {
    toast('请选择 PNG、JPG、WebP 或 GIF 图片。', 'error');
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    toast('头像不能超过 2MB。', 'error');
    return;
  }
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const data = await api('/api/avatar', { method: 'POST', body: { avatar: reader.result } });
      state.site = data;
      render();
      toast('头像已更新。', 'success');
    } catch (error) {
      toast(error.message, 'error');
      if (error.status === 401 && state.site) {
        state.site.isOwner = false;
        render();
      }
    }
  };
  reader.onerror = () => toast('读取图片失败，请重试。', 'error');
  reader.readAsDataURL(file);
}

function handleAction(action, element) {
  if (!state.site && action !== 'retry') return;
  switch (action) {
    case 'login':
      openLoginModal();
      break;
    case 'logout':
      logout();
      break;
    case 'retry':
      loadSite();
      break;
    case 'edit-profile':
      openProfileModal();
      break;
    case 'upload-avatar':
      avatarInput.click();
      break;
    case 'add-activity':
      openActivityModal();
      break;
    case 'delete-activity':
      openDeleteActivity(element.dataset.id);
      break;
    case 'new-project':
      openProjectModal();
      break;
    case 'add-child':
      openProjectModal(null, element.dataset.id);
      break;
    case 'edit-project': {
      const located = findProjectWithPath(state.site.projects, element.dataset.id);
      if (located) openProjectModal(located.node);
      break;
    }
    case 'delete-project':
      openDeleteProject(element.dataset.id);
      break;
    case 'close-modal':
      closeModal();
      break;
    case 'copy-link':
      copyCurrentLink();
      break;
    default:
      break;
  }
}

async function loadSite() {
  state.error = null;
  state.site = null;
  render();
  try {
    const data = await api('/api/site');
    state.site = data;
    render();
  } catch (error) {
    state.error = error.message || '服务器没有响应，请稍后重试。';
    render();
  }
}

document.addEventListener('click', (event) => {
  const actionElement = event.target.closest('[data-action]');
  if (actionElement) {
    event.preventDefault();
    handleAction(actionElement.dataset.action, actionElement);
    return;
  }

  const link = event.target.closest('a[href]');
  if (!link) return;
  if (link.target === '_blank' || link.hasAttribute('download') || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const url = new URL(link.href, window.location.origin);
  if (url.origin !== window.location.origin || url.pathname.startsWith('/api/')) return;
  event.preventDefault();
  navigate(`${url.pathname}${url.search}${url.hash}`);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && modalRoot.innerHTML) closeModal();
});

window.addEventListener('popstate', () => {
  state.route = parseRoute();
  render();
});

avatarInput.addEventListener('change', () => {
  const file = avatarInput.files && avatarInput.files[0];
  avatarInput.value = '';
  uploadAvatar(file);
});

document.getElementById('footer-year').textContent = new Date().getFullYear();
loadSite();

