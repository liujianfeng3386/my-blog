const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'posts.json');

app.use(express.static(path.join(__dirname, 'public')));

function getPosts() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function escape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function readingTime(content) {
  const chars = content.replace(/<[^>]*>/g, '').length;
  return Math.max(1, Math.ceil(chars / 400));
}

function layout(title, body, activePath = '/') {
  const navItems = [
    { href: '/', label: '首页' },
    { href: '/about', label: '关于' },
  ];
  const navHtml = navItems
    .map(item => `<a href="${item.href}" class="nav-link${activePath === item.href ? ' active' : ''}">${item.label}</a>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escape(title)} - My Blog</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <header class="site-header">
    <div class="container header-inner">
      <a href="/" class="logo">
        <span class="logo-mark"></span>
        My Blog
      </a>
      <nav class="nav">${navHtml}</nav>
    </div>
  </header>

  <main class="main-content">
    ${body}
  </main>

  <footer class="site-footer">
    <div class="container footer-inner">
      <span class="footer-logo">My Blog</span>
      <span>&copy; 2026 &mdash; 用 Node.js + Express 构建</span>
    </div>
  </footer>
</body>
</html>`;
}

// Home
app.get('/', (req, res) => {
  const posts = getPosts().slice().sort((a, b) => new Date(b.date) - new Date(a.date));
  const uniqueTags = new Set(posts.flatMap(p => p.tags)).size;

  const cards = posts.map(post => {
    const minutes = readingTime(post.content);
    return `
      <article class="post-card">
        <div class="card-body">
          <div class="post-meta">
            <time>${escape(post.date)}</time>
            <span class="meta-dot"></span>
            <span>${escape(post.author)}</span>
            <span class="meta-dot"></span>
            <span>${minutes} 分钟阅读</span>
          </div>
          <h2 class="post-title">
            <a href="/post/${post.id}">${escape(post.title)}</a>
          </h2>
          <p class="post-summary">${escape(post.summary)}</p>
          <div class="card-footer">
            <div class="tags">
              ${post.tags.map(t => `<span class="tag">${escape(t)}</span>`).join('')}
            </div>
            <a href="/post/${post.id}" class="read-more">阅读全文 <span class="arrow">&rarr;</span></a>
          </div>
        </div>
      </article>
    `;
  }).join('');

  const body = `
    <section class="hero">
      <div class="hero-blob hero-blob-1"></div>
      <div class="hero-blob hero-blob-2"></div>
      <div class="hero-blob hero-blob-3"></div>
      <div class="container hero-inner">
        <p class="hero-eyebrow">个人博客</p>
        <h1 class="hero-title">技术与思考</h1>
        <p class="hero-sub">记录学习过程，分享工程实践，保持对技术的好奇心</p>
        <div class="hero-stats-row">
          <div class="hero-stat">
            <span class="stat-num">${posts.length}</span>
            <span class="stat-label">篇文章</span>
          </div>
          <span class="stat-sep"></span>
          <div class="hero-stat">
            <span class="stat-num">${uniqueTags}</span>
            <span class="stat-label">个标签</span>
          </div>
          <span class="stat-sep"></span>
          <div class="hero-stat">
            <span class="stat-num">2026</span>
            <span class="stat-label">年创建</span>
          </div>
        </div>
      </div>
    </section>

    <div class="container">
      <section class="post-list-section">
        <h2 class="section-heading">最新文章</h2>
        <div class="post-list">${cards}</div>
      </section>
    </div>
  `;

  res.send(layout('首页', body, '/'));
});

// Article detail
app.get('/post/:id', (req, res) => {
  const posts = getPosts();
  const post = posts.find(p => p.id === parseInt(req.params.id, 10));

  if (!post) {
    const body = `
      <div class="container">
        <div class="not-found">
          <h1>404</h1>
          <p>文章不存在或已被删除。</p>
          <a href="/" class="btn-back">&larr; 返回首页</a>
        </div>
      </div>
    `;
    return res.status(404).send(layout('页面不存在', body));
  }

  const allPosts = posts.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
  const idx = allPosts.findIndex(p => p.id === post.id);
  const prev = allPosts[idx + 1];
  const next = allPosts[idx - 1];
  const minutes = readingTime(post.content);

  const body = `
    <div class="container">
      <article class="post-detail">
        <header class="detail-header">
          <div class="tags">${post.tags.map(t => `<span class="tag">${escape(t)}</span>`).join('')}</div>
          <h1>${escape(post.title)}</h1>
          <div class="post-meta">
            <time>${escape(post.date)}</time>
            <span class="meta-dot"></span>
            <span>${escape(post.author)}</span>
            <span class="meta-dot"></span>
            <span>${minutes} 分钟阅读</span>
          </div>
        </header>

        <div class="post-body">${post.content}</div>

        <footer class="detail-footer">
          <a href="/" class="btn-back">&larr; 返回首页</a>
          <nav class="post-nav">
            <div class="post-nav-item">
              ${prev ? `<span class="nav-label">上一篇</span><a href="/post/${prev.id}" class="post-nav-link">&larr; ${escape(prev.title)}</a>` : ''}
            </div>
            <div class="post-nav-item post-nav-right">
              ${next ? `<span class="nav-label">下一篇</span><a href="/post/${next.id}" class="post-nav-link">${escape(next.title)} &rarr;</a>` : ''}
            </div>
          </nav>
        </footer>
      </article>
    </div>
  `;

  res.send(layout(post.title, body, ''));
});

// About
app.get('/about', (req, res) => {
  const body = `
    <div class="container">
      <div class="about-page">
        <h1>关于本站</h1>
        <div class="about-body">
          <p>欢迎来到 My Blog，这是一个专注于技术分享的个人博客，记录我在后端开发、前端工程和软件架构方面的学习与实践。</p>
          <h2>技术栈</h2>
          <ul>
            <li><strong>后端：</strong>Node.js + Express</li>
            <li><strong>数据存储：</strong>JSON 文件</li>
            <li><strong>前端：</strong>原生 HTML + CSS</li>
          </ul>
          <h2>写作初衷</h2>
          <p>费曼学习法告诉我们，能用简单的语言解释清楚一件事，才说明真正理解了它。写博客是检验自己理解深度的最好方式之一。</p>
          <h2>联系我</h2>
          <p>如有问题或建议，欢迎随时交流。</p>
        </div>
      </div>
    </div>
  `;
  res.send(layout('关于', body, '/about'));
});

// 404 fallback
app.use((req, res) => {
  const body = `
    <div class="container">
      <div class="not-found">
        <h1>404</h1>
        <p>你访问的页面不存在。</p>
        <a href="/" class="btn-back">&larr; 返回首页</a>
      </div>
    </div>
  `;
  res.status(404).send(layout('页面不存在', body));
});

app.listen(PORT, () => {
  console.log(`Blog running at http://localhost:${PORT}`);
});
