const username = localStorage.getItem('admin_username') || 'Admin';
document.getElementById('user-name').textContent   = username;
document.getElementById('user-avatar').textContent = username.charAt(0).toUpperCase();
document.getElementById('logout-btn').onclick = () => { localStorage.clear(); window.location.reload(); };

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}

const params = new URLSearchParams(window.location.search);
const postId = params.get('id');
if (!postId || isNaN(postId)) window.location.href = 'dashboard.html';
document.getElementById('post-id-badge').textContent = `#${postId}`;

function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast show${type === 'error' ? ' error' : type === 'success' ? ' success' : ''}`;
  setTimeout(() => t.className = 'toast', 3200);
}

const Font = Quill.import('formats/font');
Font.whitelist = ['serif','monospace','playfair','georgia','courier'];
Quill.register(Font, true);

const Size = Quill.import('attributors/style/size');
Size.whitelist = ['10px','12px','14px','16px','18px','20px','24px','28px','32px','36px','48px'];
Quill.register(Size, true);

const quill = new Quill('#quill-editor', {
  theme: 'snow',
  placeholder: 'Write your story here...',
  modules: {
    toolbar: {
      container: [
        [{ font: Font.whitelist }, { size: Size.whitelist }, { header: [1,2,3,4,false] }],
        ['bold','italic','underline','strike'],
        [{ script:'sub' }, { script:'super' }],
        [{ color:[] }, { background:[] }],
        [{ align:[] }, { indent:'-1' }, { indent:'+1' }],
        ['blockquote','code-block'],
        [{ list:'ordered' }, { list:'bullet' }],
        ['link','image','video'],
        ['clean'],
      ],
    },
  },
});

function updateWordCount() {
  const text  = quill.getText().trim();
  const words = text.length === 0 ? 0 : text.split(/\s+/).filter(Boolean).length;
  document.getElementById('word-count').textContent = words.toLocaleString();
  document.getElementById('char-count').textContent = text.length.toLocaleString();
  document.getElementById('read-time').textContent  = Math.max(1, Math.ceil(words / 200));
}
quill.on('text-change', updateWordCount);

document.querySelectorAll('.toggle-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('post-status').value = btn.dataset.status;
  });
});

function setStatus(status) {
  document.getElementById('post-status').value = status;
  document.querySelectorAll('.toggle-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.status === status);
  });
}

document.getElementById('post-image').addEventListener('input', (e) => {
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

async function loadPost() {
  try {
    const res  = await fetch(`${window.API_BASE}/posts/admin/${postId}`);
    if (!res.ok) throw new Error('Post not found');
    const post = await res.json();

    document.getElementById('post-title').value    = post.title;
    document.getElementById('post-image').value    = post.image_url || '';
    document.getElementById('post-category').value = post.category  || 'General';
    setStatus(post.status || 'draft');
    quill.root.innerHTML = post.content || '';
    updateWordCount();

    if (post.image_url) {
      const img = document.getElementById('preview-img');
      img.src   = post.image_url;
      img.onload = () => document.getElementById('image-preview').classList.add('visible');
    }
    if (post.status === 'published') {
      const link = document.getElementById('preview-link');
      link.href  = `../post.html?id=${postId}`;
      link.style.display = 'inline-flex';
    }

    document.getElementById('loading-overlay').style.display  = 'none';
    document.getElementById('editor-container').style.display = 'block';
  } catch {
    document.getElementById('loading-overlay').innerHTML =
      `<div style="text-align:center;color:var(--muted)">
        <p style="font-family:var(--font-ui);font-weight:600">Post not found.</p>
        <a href="dashboard.html" class="btn btn-secondary" style="margin-top:1rem">Back to Dashboard</a>
      </div>`;
  }
}

async function updatePost() {
  const title     = document.getElementById('post-title').value.trim();
  const content   = quill.root.innerHTML.trim();
  const image_url = document.getElementById('post-image').value.trim();
  const category  = document.getElementById('post-category').value;
  const status    = document.getElementById('post-status').value;
  const errBox    = document.getElementById('form-error');

  errBox.style.display = 'none';

  if (!title || title.length < 3) {
    errBox.textContent = 'Title is required (at least 3 characters).';
    errBox.style.display = 'block';
    document.getElementById('post-title').focus();
    return;
  }
  if (!content || quill.getText().trim().length < 10) {
    errBox.textContent = 'Content is required.';
    errBox.style.display = 'block';
    return;
  }

  ['update-btn','update-btn-2'].forEach(id => {
    const b = document.getElementById(id);
    if (b) { b.classList.add('loading'); b.disabled = true; }
  });

  try {
    const res = await fetch(`${window.API_BASE}/posts/${postId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, image_url: image_url || null, category, status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Update failed');
    showToast('Post updated successfully!', 'success');
    if (status === 'published') {
      const link = document.getElementById('preview-link');
      link.href  = `../post.html?id=${postId}`;
      link.style.display = 'inline-flex';
    }
  } catch (err) {
    errBox.textContent   = err.message || 'Something went wrong.';
    errBox.style.display = 'block';
  } finally {
    ['update-btn','update-btn-2'].forEach(id => {
      const b = document.getElementById(id);
      if (b) { b.classList.remove('loading'); b.disabled = false; }
    });
  }
}

document.getElementById('update-btn').onclick   = updatePost;
document.getElementById('update-btn-2').onclick = updatePost;

loadPost();
