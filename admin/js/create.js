// ── Auth / user ───────────────────────────────────────────────────────
const username = localStorage.getItem('admin_username') || 'Admin';
document.getElementById('user-name').textContent   = username;
document.getElementById('user-avatar').textContent = username.charAt(0).toUpperCase();
document.getElementById('logout-btn').onclick = () => { localStorage.clear(); window.location.reload(); };

// ── Sidebar ───────────────────────────────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}

// ── Toast ─────────────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast show${type === 'error' ? ' error' : type === 'success' ? ' success' : ''}`;
  setTimeout(() => t.className = 'toast', 3200);
}

// ── Init TipTap editor ────────────────────────────────────────────────
const editor = initEditor('editor-wrap', 'Write your story here…');

// ── Status toggle ─────────────────────────────────────────────────────
document.querySelectorAll('.toggle-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('post-status').value = btn.dataset.status;
  });
});

// ── Cover image preview ───────────────────────────────────────────────
document.getElementById('post-image').addEventListener('input', e => {
  const url     = e.target.value.trim();
  const preview = document.getElementById('image-preview');
  const img     = document.getElementById('preview-img');
  if (url && url.startsWith('http')) {
    img.src     = url;
    img.onload  = () => preview.classList.add('visible');
    img.onerror = () => preview.classList.remove('visible');
  } else {
    preview.classList.remove('visible');
  }
});

// ── Keyboard shortcuts ────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    submitPost('draft');
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    submitPost('published');
  }
});

// ── Submit ────────────────────────────────────────────────────────────
async function submitPost(statusOverride) {
  const title     = document.getElementById('post-title').value.trim();
  const content   = editor.getHTML();
  const plainText = editor.getText().trim();
  const image_url = document.getElementById('post-image').value.trim();
  const category  = document.getElementById('post-category').value;
  const status    = statusOverride || document.getElementById('post-status').value;
  const errBox    = document.getElementById('form-error');

  errBox.style.display = 'none';

  if (!title || title.length < 3) {
    errBox.textContent   = 'Title is required (at least 3 characters).';
    errBox.style.display = 'block';
    document.getElementById('post-title').focus();
    return;
  }
  if (plainText.length < 10) {
    errBox.textContent   = 'Content is required — write at least a few words.';
    errBox.style.display = 'block';
    editor.commands.focus();
    return;
  }

  const allBtns = ['publish-btn', 'save-draft-btn', 'publish-btn-2', 'save-draft-btn-2'];
  allBtns.forEach(id => {
    const b = document.getElementById(id);
    if (b) { b.classList.add('loading'); b.disabled = true; }
  });

  try {
    const res = await fetch(`${window.API_BASE}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, image_url: image_url || null, category, status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save');

    showToast(status === 'published' ? 'Post published!' : 'Draft saved!', 'success');
    setTimeout(() => window.location.href = 'dashboard.html', 1100);
  } catch (err) {
    errBox.textContent   = err.message || 'Something went wrong.';
    errBox.style.display = 'block';
    allBtns.forEach(id => {
      const b = document.getElementById(id);
      if (b) { b.classList.remove('loading'); b.disabled = false; }
    });
  }
}

document.getElementById('publish-btn').onclick      = () => submitPost('published');
document.getElementById('save-draft-btn').onclick   = () => submitPost('draft');
document.getElementById('publish-btn-2').onclick    = () => submitPost('published');
document.getElementById('save-draft-btn-2').onclick = () => submitPost('draft');
