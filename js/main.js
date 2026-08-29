// ── SCROLL FX: progress bar, header shrink, back-to-top ─────────────────
(function initScrollFx() {
  const progress = document.getElementById('scroll-progress');
  const header   = document.getElementById('site-header');
  const toTop    = document.getElementById('back-to-top');

  function onScroll() {
    const scrollTop    = window.scrollY;
    const docHeight    = document.documentElement.scrollHeight - window.innerHeight;
    const pct          = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    if (progress) progress.style.width = pct + '%';
    if (header) header.classList.toggle('scrolled', scrollTop > 8);
    if (toTop)  toTop.classList.toggle('visible', scrollTop > 500);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }
})();

// ── HERO FEATURED CARD TILT ──────────────────────────────────────────────
(function initHeroTilt() {
  const card = document.getElementById('hero-featured');
  if (!card || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(800px) rotateX(${-y * 6}deg) rotateY(${x * 8}deg)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg)';
  });
})();

// ── SCROLL REVEAL ─────────────────────────────────────────────────────────
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

function observeReveal(el) { revealObserver.observe(el); }
document.querySelectorAll('.reveal').forEach(observeReveal);

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

/**
 * Trim excerpt at nearest word boundary — never cuts mid-word.
 */
function smartExcerpt(html, maxLen = 155) {
  const plain = stripHtml(html).replace(/\s+/g, ' ').trim();
  if (plain.length <= maxLen) return plain;
  const cut = plain.lastIndexOf(' ', maxLen);
  return plain.slice(0, cut > 0 ? cut : maxLen) + '…';
}

const PILL_COLOURS = [
  'var(--card-yellow)', 'var(--card-pink)',
  'var(--card-sage)',   'var(--card-sky)',
];
function pillColour(category) {
  let hash = 0;
  for (let i = 0; i < category.length; i++) hash = category.charCodeAt(i) + ((hash << 5) - hash);
  return PILL_COLOURS[Math.abs(hash) % PILL_COLOURS.length];
}

// ── CATEGORY ICONS & COLOURS ──────────────────────────────────────────
// Each known category gets its own icon + colour pairing (not an
// arbitrary hash) so the badge is actually meaningful at a glance.
const ICONS = {
  technology: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/></svg>',
  business: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
  culture: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 20 7 4 7"/><line x1="6" y1="10" x2="6" y2="18"/><line x1="10" y1="10" x2="10" y2="18"/><line x1="14" y1="10" x2="14" y2="18"/><line x1="18" y1="10" x2="18" y2="18"/><line x1="3" y1="21" x2="21" y2="21"/></svg>',
  health: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  science: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 2v6.34a2 2 0 0 1-.3 1.06L4.24 17.7A2 2 0 0 0 6 21h12a2 2 0 0 0 1.76-3.3l-4.46-8.3A2 2 0 0 1 15 8.34V2"/><path d="M8.5 2h7"/><path d="M6.5 14.5h11"/></svg>',
  general: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2H3v9l9.6 9.6a2 2 0 0 0 2.83 0l6.17-6.17a2 2 0 0 0 0-2.83z"/><circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" stroke="none"/></svg>',
  all: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
};

const CATEGORY_META = {
  Technology: { bg: 'var(--card-sky)',  fg: 'var(--ink)',   icon: ICONS.technology },
  Business:   { bg: 'var(--orange)',    fg: 'var(--paper)', icon: ICONS.business },
  Culture:    { bg: 'var(--card-pink)', fg: 'var(--ink)',   icon: ICONS.culture },
  Health:     { bg: '#F0968A',          fg: 'var(--ink)',   icon: ICONS.health },
  Science:    { bg: '#C9B8E8',          fg: 'var(--ink)',   icon: ICONS.science },
  General:    { bg: 'var(--cream-2)',   fg: 'var(--ink)',   icon: ICONS.general },
};

function getCategoryMeta(name) {
  if (CATEGORY_META[name]) return CATEGORY_META[name];
  // Unknown/custom category from the backend — still colourful, generic icon.
  return { bg: pillColour(name || 'General'), fg: 'var(--ink)', icon: ICONS.general };
}

// ── SEO ────────────────────────────────────────────────────────────────
function setMeta(title, description) {
  document.title = title;
  let meta = document.querySelector('meta[name="description"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'description');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', description);
}

// ── STATE ──────────────────────────────────────────────────────────────
let currentPage     = 1;
let currentSearch   = '';
let currentCategory = '';
let debounceTimer;

setMeta(
  'The Chronicle — Latest Stories',
  'Discover in-depth articles, opinions and stories on business, culture and more.'
);

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
    if (p.image_url)
      imgWrap.innerHTML = '<img src="' + p.image_url + '" alt="' + p.title + '" />';

    document.getElementById('hero-featured-cat').textContent   = p.category || 'General';
    document.getElementById('hero-featured-title').textContent = p.title;
  } catch (_) { /* silent — hero is decorative */ }
}

// ── SKELETON ───────────────────────────────────────────────────────────
function showSkeleton() {
  document.getElementById('posts-grid').innerHTML = Array(6).fill(0).map(() => `
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
function postCardHtml(post, i, isLead) {
  const excerpt  = smartExcerpt(post.excerpt || post.content || '');
  const catName  = post.category || 'General';
  const meta     = getCategoryMeta(catName);
  const imageHtml = post.image_url
    ? `<img src="${post.image_url}" alt="${post.title}" loading="lazy" />`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
         <rect x="3" y="3" width="18" height="18" rx="2"/>
         <path d="m3 9 4-4 4 4 4-4 4 4"/>
         <circle cx="8.5" cy="13.5" r="1.5"/>
       </svg>`;
  const delay = (i % 9) * 0.06;
  const badgeHtml = isLead
    ? `<span class="post-card-category">${ICONS.star}Featured</span>`
    : `<span class="post-card-category" style="background:${meta.bg};color:${meta.fg}">${meta.icon}${catName}</span>`;
  const readCta = isLead
    ? `<a href="post.html?id=${post.id}" class="lead-cta">
         Read the story
         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
           <path d="M5 12h14M12 5l7 7-7 7"/>
         </svg>
       </a>`
    : `<a href="post.html?id=${post.id}" class="read-more">
         Read
         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13">
           <path d="M5 12h14M12 5l7 7-7 7"/>
         </svg>
       </a>`;

  return `
    <article class="post-card card-reveal${isLead ? ' lead-card' : ''}" style="--reveal-delay:${delay}s">
      <a href="post.html?id=${post.id}" class="post-card-image${!post.image_url ? ' no-image' : ''}">
        ${imageHtml}
      </a>
      <div class="post-card-body">
        ${badgeHtml}
        <a href="post.html?id=${post.id}">
          <h2 class="post-card-title">${post.title}</h2>
        </a>
        <p class="post-card-excerpt">${excerpt}</p>
        <div class="post-card-footer">
          <div class="post-card-meta">
            <span class="post-card-date">${formatDate(post.created_at)}</span>
            <span class="post-card-views">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              ${Number(post.views).toLocaleString()} views
            </span>
          </div>
          ${readCta}
        </div>
      </div>
    </article>`;
}

function renderPosts(posts) {
  const grid = document.getElementById('posts-grid');

  if (!posts.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/>
        </svg>
        <h3>No stories found</h3>
        <p>${currentSearch ? 'Try a different search term.' : currentCategory ? 'No posts in this category yet.' : 'No published posts yet.'}</p>
      </div>`;
    return;
  }

  // The magazine "lead" treatment only makes sense for the freshest post
  // on the unfiltered, first page — once someone searches or filters,
  // there's no meaningful "featured" story to highlight.
  const showLead = currentPage === 1 && !currentSearch && !currentCategory;

  let html = '';
  if (showLead) {
    html += postCardHtml(posts[0], 0, true);
    if (posts.length > 1) {
      html += `<div class="more-stories-label">More Stories</div>`;
      html += posts.slice(1).map((post, i) => postCardHtml(post, i, false)).join('');
    }
  } else {
    html += posts.map((post, i) => postCardHtml(post, i, false)).join('');
  }

  grid.innerHTML = html;
  grid.querySelectorAll('.card-reveal').forEach(observeReveal);
}

// ── PAGINATION ─────────────────────────────────────────────────────────
function renderPagination(total, page, limit) {
  const pages = Math.ceil(total / limit);
  const pag   = document.getElementById('pagination');
  if (pages <= 1) { pag.innerHTML = ''; return; }

  let html = '';
  if (page > 1)     html += `<button class="page-btn" onclick="goPage(${page-1})">&larr; Prev</button>`;
  for (let i = 1; i <= pages; i++)
    html += `<button class="page-btn${i === page ? ' active' : ''}" onclick="goPage(${i})">${i}</button>`;
  if (page < pages) html += `<button class="page-btn" onclick="goPage(${page+1})">Next &rarr;</button>`;
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
    if (!res.ok) throw new Error(`Server error ${res.status}`);
    const data = await res.json();

    renderPosts(data.posts || []);
    renderPagination(data.total || 0, data.page || 1, data.limit || 9);

    const count = document.getElementById('post-count');
    if (count) {
      const n = data.total || 0;
      count.textContent = n + ' article' + (n !== 1 ? 's' : '');
    }
  } catch (err) {
    document.getElementById('pagination').innerHTML = '';
    document.getElementById('posts-grid').innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h3>Unable to load stories</h3>
        <p>Please check your connection or try again later.</p>
        <button onclick="fetchPosts()" style="margin-top:1rem;padding:0.5rem 1.2rem;
          border:1.5px solid var(--border-light);border-radius:8px;background:none;
          cursor:pointer;font-family:var(--font-ui);font-size:0.85rem">
          Retry
        </button>
      </div>`;
    showToast('Could not load posts — ' + err.message, 'error');
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

document.getElementById('category-filter')?.addEventListener('change', function(e) {
  currentCategory = e.target.value;
  currentPage     = 1;
  fetchPosts();
});

// ── CATEGORY DROPDOWN (custom, colourful) ────────────────────────────────
(function initCategoryDropdown() {
  const CATEGORIES = ['Technology', 'Culture', 'Health', 'Business', 'Science', 'General'];

  const root      = document.getElementById('cat-select');
  const trigger   = document.getElementById('cat-select-trigger');
  const label     = document.getElementById('cat-select-label');
  const triggerIc = document.getElementById('cat-select-icon');
  const menu      = document.getElementById('cat-select-menu');
  if (!root || !menu) return;

  function optionRow(value, text) {
    const meta = value ? getCategoryMeta(value) : { bg: null, fg: null, icon: ICONS.all };
    const li = document.createElement('li');
    li.className = 'cat-select-option' + (value === currentCategory ? ' selected' : '');
    li.setAttribute('role', 'option');
    li.setAttribute('data-value', value);
    const badgeStyle = meta.bg ? `style="--badge-bg:${meta.bg};--badge-fg:${meta.fg}"` : '';
    li.innerHTML = `
      <span class="cat-select-icon" ${badgeStyle}>${meta.icon}</span>
      <span>${text}</span>
      <svg class="cat-select-option-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
        <polyline points="20 6 9 17 4 12"/>
      </svg>`;
    li.addEventListener('click', () => selectCategory(value, text, meta));
    return li;
  }

  function renderMenu() {
    menu.innerHTML = '';
    menu.appendChild(optionRow('', 'All Categories'));
    CATEGORIES.forEach(cat => menu.appendChild(optionRow(cat, cat)));
  }

  function selectCategory(value, text, meta) {
    currentCategory = value;
    currentPage     = 1;
    label.textContent = text;
    triggerIc.innerHTML = meta.icon;
    if (meta.bg) {
      triggerIc.style.setProperty('--badge-bg', meta.bg);
      triggerIc.style.setProperty('--badge-fg', meta.fg);
    } else {
      triggerIc.style.removeProperty('--badge-bg');
      triggerIc.style.removeProperty('--badge-fg');
    }
    closeMenu();
    renderMenu();
    fetchPosts();
  }

  function openMenu()  { root.classList.add('is-open');  trigger.setAttribute('aria-expanded', 'true'); }
  function closeMenu() { root.classList.remove('is-open'); trigger.setAttribute('aria-expanded', 'false'); }
  function toggleMenu() { root.classList.contains('is-open') ? closeMenu() : openMenu(); }

  trigger.addEventListener('click', toggleMenu);
  document.addEventListener('click', e => { if (!root.contains(e.target)) closeMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  triggerIc.innerHTML = ICONS.all;
  renderMenu();
})();

// ── INIT ───────────────────────────────────────────────────────────────
loadHeroFeatured();
fetchPosts();
