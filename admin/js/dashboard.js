// ── NO AUTH — admin is open access ────────────────────────────────────
const username = localStorage.getItem('admin_username') || 'Admin';

// ── SIDEBAR TOGGLE (mobile) ────────────────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}

// ── INIT USER UI ───────────────────────────────────────────────────────
document.getElementById('user-name').textContent   = username;
document.getElementById('user-avatar').textContent = username.charAt(0).toUpperCase();

// ── JSON HEADERS (no auth token) ───────────────────────────────────────
function jsonHeaders() {
  return { 'Content-Type': 'application/json' };
}

// ── TOAST ──────────────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast show${type === 'error' ? ' error' : type === 'success' ? ' success' : ''}`;
  setTimeout(() => t.className = 'toast', 3200);
}

// ── DATE FORMAT ────────────────────────────────────────────────────────
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── STATE ──────────────────────────────────────────────────────────────
let posts        = [];
let deleteTarget = null;
let debounce;

// ── FETCH ALL POSTS ────────────────────────────────────────────────────
async function fetchPosts() {
  const search = document.getElementById('filter-search').value.trim();
  const status = document.getElementById('filter-status').value;

  const params = new URLSearchParams({ limit: 100, ...(search && { search }), ...(status && { status }) });

  try {
    const res  = await fetch(`${window.API_BASE}/posts/admin/all?${params}`, { headers: jsonHeaders() });
    const data = await res.json();

    posts = data.posts || [];

    // Stats
    const s = data.stats || {};
    document.getElementById('stat-published').textContent = s.published || 0;
    document.getElementById('stat-draft').textContent     = s.draft     || 0;
    document.getElementById('stat-views').textContent     = Number(s.total_views || 0).toLocaleString();

    renderTable(posts);
  } catch {
    showToast('Failed to load posts', 'error');
  }
}

// ── RENDER TABLE ───────────────────────────────────────────────────────
function renderTable(list) {
  const tbody = document.getElementById('posts-tbody');

  if (!list.length) {
    tbody.innerHTML = `
      <tr><td colspan="6" class="table-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586l5.414 5.414V19a2 2 0 0 1-2 2z"/>
        </svg>
        <p>No posts found</p>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(p => `
    <tr>
      <td class="td-title" title="${p.title}">${p.title}</td>
      <td>${p.category || 'General'}</td>
      <td>
        <span class="badge badge-${p.status}">
          <span class="badge-dot"></span>
          ${p.status}
        </span>
      </td>
      <td>${p.views}</td>
      <td>${fmtDate(p.created_at)}</td>
      <td class="td-actions">
        <a href="edit.html?id=${p.id}" class="btn btn-secondary btn-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Edit
        </a>
        <button class="btn btn-danger btn-sm" onclick="confirmDelete(${p.id}, '${p.title.replace(/'/g, "\\'")}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
          Delete
        </button>
      </td>
    </tr>`).join('');
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
      headers: jsonHeaders(),
    });

    if (!res.ok) throw new Error();

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

// ── LOGOUT (clears stored name only) ───────────────────────────────────
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
