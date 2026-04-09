// ── AUTH ───────────────────────────────────────────────────────────────
const token = localStorage.getItem('admin_token');
if (!token) window.location.href = 'login.html';

const username = localStorage.getItem('admin_username') || 'Admin';
document.getElementById('user-name').textContent   = username;
document.getElementById('user-avatar').textContent = username.charAt(0).toUpperCase();

document.getElementById('logout-btn').onclick = () => { localStorage.clear(); window.location.href = 'login.html'; };

// ── TOAST ──────────────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast show${type === 'error' ? ' error' : type === 'success' ? ' success' : ''}`;
  setTimeout(() => t.className = 'toast', 3200);
}

// ── QUILL ──────────────────────────────────────────────────────────────
const quill = new Quill('#quill-editor', {
  theme: 'snow',
  placeholder: 'Write your story here...',
  modules: {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      ['clean'],
    ],
  },
});

// ── STATUS TOGGLE ──────────────────────────────────────────────────────
document.querySelectorAll('.toggle-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('post-status').value = btn.dataset.status;
  });
});

// ── IMAGE PREVIEW ──────────────────────────────────────────────────────
document.getElementById('post-image').addEventListener('input', (e) => {
  const url = e.target.value.trim();
  const preview = document.getElementById('image-preview');
  const img     = document.getElementById('preview-img');

  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    img.src = url;
    img.onload  = () => preview.classList.add('visible');
    img.onerror = () => preview.classList.remove('visible');
  } else {
    preview.classList.remove('visible');
  }
});

// ── SUBMIT ─────────────────────────────────────────────────────────────
async function submitPost(statusOverride) {
  const title     = document.getElementById('post-title').value.trim();
  const content   = quill.root.innerHTML.trim();
  const image_url = document.getElementById('post-image').value.trim();
  const category  = document.getElementById('post-category').value;
  const status    = statusOverride || document.getElementById('post-status').value;

  const errBox = document.getElementById('form-error');
  errBox.style.display = 'none';

  if (!title || title.length < 3) {
    errBox.textContent = 'Title is required (at least 3 characters).';
    errBox.style.display = 'block';
    document.getElementById('post-title').focus();
    return;
  }

  if (!content || quill.getText().trim().length < 10) {
    errBox.textContent = 'Content is required (write at least a few words).';
    errBox.style.display = 'block';
    return;
  }

  // Set all submit buttons loading
  const allBtns = ['publish-btn', 'save-draft-btn', 'publish-btn-2', 'save-draft-btn-2'];
  allBtns.forEach(id => {
    const b = document.getElementById(id);
    if (b) { b.classList.add('loading'); b.disabled = true; }
  });

  try {
    const res = await fetch(`${window.API_BASE}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ title, content, image_url: image_url || null, category, status }),
    });

    if (res.status === 401) { localStorage.clear(); window.location.href = 'login.html'; return; }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save');

    showToast(`Post ${status === 'published' ? 'published' : 'saved as draft'}!`, 'success');
    setTimeout(() => window.location.href = 'dashboard.html', 1200);
  } catch (err) {
    errBox.textContent = err.message || 'Something went wrong.';
    errBox.style.display = 'block';
    allBtns.forEach(id => {
      const b = document.getElementById(id);
      if (b) { b.classList.remove('loading'); b.disabled = false; }
    });
  }
}

document.getElementById('publish-btn').onclick    = () => submitPost('published');
document.getElementById('save-draft-btn').onclick = () => submitPost('draft');
document.getElementById('publish-btn-2').onclick  = () => submitPost('published');
document.getElementById('save-draft-btn-2').onclick = () => submitPost('draft');
