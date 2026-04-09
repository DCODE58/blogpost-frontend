// ── TOAST ──────────────────────────────────────────────────────────────
function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (type === 'error' ? ' error' : '');
  setTimeout(() => { t.className = 'toast'; }, 3200);
}

// ── HELPERS ────────────────────────────────────────────────────────────
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

function stripHtml(html) {
  const d = document.createElement('div');
  d.innerHTML = html;
  return d.textContent || d.innerText || '';
}

// Cycle through pastel colours for category pills
const PILL_COLOURS = [
  'var(--card-yellow)',
  'var(--card-pink)',
  'var(--card-sage)',
  'var(--card-sky)',
];

function pillColour(category) {
  let hash = 0;
  for (let i = 0; i < category.length; i++) hash = category.charCodeAt(i) + ((hash << 5) - hash);
  return PILL_COLOURS[Math.abs(hash) % PILL_COLOURS.length];
}

// ── STATE ──────────────────────────────────────────────────────────────
let currentPage     = 1;
let currentSearch   = '';
let currentCategory = '';
let debounceTimer;

// ── HERO FEATURED ──────────────────────────────────────────────────────
async function loadHeroFeatured() {
  try {
    const res  = await fetch(window.API_BASE + '/posts?limit=1&page=1');
    if (!res.ok) return;
    const data = await res.json();
    if (!data.posts || !data.posts.length) return;

    const p    = data.posts[0];
    const link = document.getElementById('hero-featured');
    link.href  = 'post.html?id=' + p.id;

    const imgWrap = document.getElementById('hero-featured-img');
    if (p.image_url) {
      imgWrap.innerHTML = '<img src="' + p.image_url + '" alt="' + p.title + '" />';
    }

    document.getElementById('hero-featured-cat').textContent   = p.category || 'General';
    document.getElementById('hero-featured-title').textContent = p.title;
  } catch (_) { /* silent */ }
}

// ── SKELETON ───────────────────────────────────────────────────────────
function showSkeleton() {
  const grid = document.getElementById('posts-grid');
  grid.innerHTML = Array(6).fill(0).map(() => `
    <div class="post-card" style="pointer-events:none">
      <div class="post-card-image">
        <div class="skeleton" style="width:100%;height:100%"></div>
      </div>
      <div class="post-card-body">
        <div class="skeleton" style="height:20px;width:72px;border-radius:100px;margin-bottom:0.9rem"></div>
        <div class="skeleton" style="height:22px;width:92%;margin-bottom:0.4rem"></div>
        <div class="skeleton" style="height:22px;width:76%;margin-bottom:1rem"></div>
        <div class="skeleton" style="height:13px;width:100%;margin-bottom:0.45rem"></div>
        <div class="skeleton" style="height:13px;width:100%;margin-bottom:0.45rem"></div>
        <div class="skeleton" style="height:13px;width:66%"></div>
      </div>
    </div>`).join('');
}

// ── RENDER POSTS ───────────────────────────────────────────────────────
function renderPosts(posts) {
  const grid = document.getElementById('posts-grid');

  if (!posts.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/>
        </svg>
        <h3>No stories found</h3>
        <p>Try a different search or category.</p>
      </div>`;
    return;
  }

  grid.innerHTML = posts.map(function(post) {
    const excerpt = stripHtml(post.excerpt || post.content || '').slice(0, 155) + '...';
    const colour  = pillColour(post.category || 'General');

    const imageHtml = post.image_url
      ? '<img src="' + post.image_url + '" alt="' + post.title + '" loading="lazy" />'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m3 9 4-4 4 4 4-4 4 4"/><circle cx="8.5" cy="13.5" r="1.5"/></svg>';

    return `
      <article class="post-card">
        <a href="post.html?id=${post.id}" class="post-card-image${!post.image_url ? ' no-image' : ''}">
          ${imageHtml}
        </a>
        <div class="post-card-body">
          <span class="post-card-category" style="background:${colour}">
            ${post.category || 'General'}
          </span>
          <a href="post.html?id=${post.id}">
            <h2 class="post-card-title">${post.title}</h2>
          </a>
          <p class="post-card-excerpt">${excerpt}</p>
          <div class="post-card-footer">
            <div class="post-card-meta">
              <span class="post-card-date">${formatDate(post.created_at)}</span>
              <span class="post-card-views">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                ${post.views} views
              </span>
            </div>
            <a href="post.html?id=${post.id}" class="read-more">
              Read
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
          </div>
        </div>
      </article>`;
  }).join('');
}

// ── PAGINATION ─────────────────────────────────────────────────────────
function renderPagination(total, page, limit) {
  const pages = Math.ceil(total / limit);
  const pag   = document.getElementById('pagination');
  if (pages <= 1) { pag.innerHTML = ''; return; }

  let html = '';
  if (page > 1) html += '<button class="page-btn" onclick="goPage(' + (page - 1) + ')">&larr; Prev</button>';
  for (let i = 1; i <= pages; i++) {
    html += '<button class="page-btn' + (i === page ? ' active' : '') + '" onclick="goPage(' + i + ')">' + i + '</button>';
  }
  if (page < pages) html += '<button class="page-btn" onclick="goPage(' + (page + 1) + ')">Next &rarr;</button>';
  pag.innerHTML = html;
}

window.goPage = function(p) {
  currentPage = p;
  fetchPosts();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ── FETCH ──────────────────────────────────────────────────────────────
async function fetchPosts() {
  showSkeleton();

  const params = new URLSearchParams({ page: currentPage, limit: 9 });
  if (currentSearch)   params.set('search',   currentSearch);
  if (currentCategory) params.set('category', currentCategory);

  try {
    const res = await fetch(window.API_BASE + '/posts?' + params.toString());
    if (!res.ok) throw new Error('Failed');
    const data = await res.json();

    renderPosts(data.posts || []);
    renderPagination(data.total || 0, data.page || 1, data.limit || 9);

    const count = document.getElementById('post-count');
    if (count) count.textContent = data.total + ' article' + (data.total !== 1 ? 's' : '');

  } catch (_) {
    showToast('Could not load posts. Is the backend running?', 'error');
    document.getElementById('posts-grid').innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h3>Unable to load stories</h3>
        <p>Please check your connection or try again later.</p>
      </div>`;
  }
}

// ── EVENTS ─────────────────────────────────────────────────────────────
document.getElementById('search-input').addEventListener('input', function(e) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(function() {
    currentSearch = e.target.value.trim();
    currentPage   = 1;
    fetchPosts();
  }, 420);
});

document.getElementById('category-filter').addEventListener('change', function(e) {
  currentCategory = e.target.value;
  currentPage     = 1;
  fetchPosts();
});

// ── INIT ───────────────────────────────────────────────────────────────
loadHeroFeatured();
fetchPosts();
