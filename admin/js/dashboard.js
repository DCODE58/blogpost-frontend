// v3 — no token, visible errors, version-stamped for cache verification
console.log('[dashboard.js] v3 loaded — token-free build');

// ── USER ───────────────────────────────────────────────────────────────
const username = localStorage.getItem('admin_username') || 'Admin';
document.getElementById('user-name').textContent   = username;
document.getElementById('user-avatar').textContent = username.charAt(0).toUpperCase();

// ── SIDEBAR ────────────────────────────────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}

// ── TOAST ──────────────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast show${type === 'error' ? ' error' : type === 'success' ? ' success' : ''}`;
  setTimeout(() => t.className = 'toast', 3200);
}

// ── HELPERS ────────────────────────────────────────────────────────────
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function escAttr(str) {
  return String(str).replace(/'/g, '&#39;').replace(/"/g, '&quot;');
}

// ── STATE ──────────────────────────────────────────────────────────────
let deleteTarget = null;
let debounce;

// ── RENDER TABLE ───────────────────────────────────────────────────────
function renderTable(posts) {
  const tbody = document.getElementById('posts-tbody');

  if (!posts.length) {
    tbody.innerHTML = `
      <tr><td colspan="6" class="table-empty" style="padding:2rem">
        <p>No posts found. <a href="create.html">Create your first post →</a></p>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = posts.map(p => `
    <tr>
      <td class="td-title" title="${escAttr(p.title)}">${escHtml(p.title)}</td>
      <td>${escHtml(p.category || 'General')}</td>
      <td>
        <span class="badge badge-${p.status}">
          <span class="badge-dot"></span>${p.status}
        </span>
      </td>
      <td>${Number(p.views || 0).toLocaleString()}</td>
      <td>${fmtDate(p.created_at)}</td>
      <td class="td-actions">
        <a href="edit.html?id=${p.id}" class="btn btn-secondary btn-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Edit
        </a>
        <button class="btn btn-danger btn-sm"
          onclick="confirmDelete(${p.id}, '${escAttr(p.title)}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4h6v2"/>
          </svg>
          Delete
        </button>
      </td>
    </tr>`).join('');
}

// ── FETCH POSTS ────────────────────────────────────────────────────────
async function fetchPosts() {
  const tbody  = document.getElementById('posts-tbody');
  const search = document.getElementById('filter-search').value.trim();
  const status = document.getElementById('filter-status').value;

  tbody.innerHTML = `<tr><td colspan="6" class="table-empty" style="padding:2rem">
    <p>Loading…</p></td></tr>`;

  const params = new URLSearchParams({ limit: 100 });
  if (search) params.set('search', search);
  if (status) params.set('status', status);

  const url = `${window.API_BASE}/posts/admin/all?${params}`;
  console.log('[dashboard] fetching:', url);

  try {
    const res  = await fetch(url);
    const data = await res.json();
    console.log('[dashboard] response:', res.status, data);

    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

    const posts = data.posts || [];
    const s     = data.stats  || {};

    document.getElementById('stat-published').textContent =
      Number(s.published   || 0).toLocaleString();
    document.getElementById('stat-draft').textContent =
      Number(s.draft       || 0).toLocaleString();
    document.getElementById('stat-views').textContent =
      Number(s.total_views || 0).toLocaleString();

    renderTable(posts);

  } catch (err) {
    console.error('[dashboard] fetchPosts failed:', err);
    tbody.innerHTML = `
      <tr><td colspan="6" class="table-empty" style="padding:2rem">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
             width="32" height="32" style="margin-bottom:0.5rem">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p style="font-weight:600">Failed to load posts</p>
        <p style="font-size:0.8rem;opacity:0.6;margin-top:0.2rem">${escHtml(err.message)}</p>
        <button class="btn btn-secondary btn-sm"
          onclick="fetchPosts()" style="margin-top:1rem">Retry</button>
      </td></tr>`;
  }
}

// ── DELETE ─────────────────────────────────────────────────────────────
function confirmDelete(id, title) {
  deleteTarget = id;
  document.getElementById('modal-post-title').textContent = title;
  document.getElementById('delete-modal').classList.add('open');
}

document.getElementById('modal-cancel').onclick = () => {
  document.getElementById('delete-modal').classList.remove('open');
  deleteTarget = null;
};

document.getElementById('modal-confirm').onclick = async () => {
  if (!deleteTarget) return;
  const btn = document.getElementById('modal-confirm');
  btn.classList.add('loading');
  try {
    const res = await fetch(`${window.API_BASE}/posts/${deleteTarget}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Delete failed');
    document.getElementById('delete-modal').classList.remove('open');
    deleteTarget = null;
    showToast('Post deleted', 'success');
    fetchPosts();
  } catch {
    showToast('Failed to delete post', 'error');
  } finally {
    btn.classList.remove('loading');
  }
};

// ── LOGOUT ─────────────────────────────────────────────────────────────
document.getElementById('logout-btn').onclick = () => {
  localStorage.clear();
  window.location.reload();
};

// ── FILTER EVENTS ──────────────────────────────────────────────────────
document.getElementById('filter-search').addEventListener('input', () => {
  clearTimeout(debounce);
  debounce = setTimeout(fetchPosts, 350);
});
document.getElementById('filter-status').addEventListener('change', fetchPosts);

// ── INIT ───────────────────────────────────────────────────────────────
fetchPosts();
