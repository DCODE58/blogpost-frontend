// ── SIDEBAR TOGGLE ─────────────────────────────────────────────────────
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

// ── QUILL ──────────────────────────────────────────────────────────────
const Font = Quill.import('formats/font');
Font.whitelist = ['serif', 'monospace', 'playfair', 'georgia', 'courier'];
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

// ── WORD COUNT ─────────────────────────────────────────────────────────
function updateWordCount() {
  const text  = quill.getText().trim();
  const words = text.length === 0 ? 0 : text.split(/\s+/).filter(Boolean).length;
  document.getElementById('word-count').textContent = words.toLocaleString();
  document.getElementById('char-count').textContent = text.length.toLocaleString();
  document.getElementById('read-time').textContent  = Math.max(1, Math.ceil(words / 200));
}
quill.on('text-change', updateWordCount);

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

// ── SUBMIT ─────────────────────────────────────────────────────────────
async function submitPost(statusOverride) {
  const title     = document.getElementById('post-title').value.trim();
  const content   = quill.root.innerHTML.trim();
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
  if (!content || quill.getText().trim().length < 10) {
    errBox.textContent   = 'Content is required (write at least a few words).';
    errBox.style.display = 'block';
    return;
  }

  const allBtns = ['publish-btn','save-draft-btn','publish-btn-2','save-draft-btn-2'];
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

    showToast(`Post ${status === 'published' ? 'published' : 'saved as draft'}!`, 'success');
    setTimeout(() => window.location.href = 'dashboard.html', 1200);
  } catch (err) {
    errBox.textContent   = err.message || 'Something went wrong.';
    errBox.style.display = 'block';
    allBtns.forEach(id => {
      const b = document.getElementById(id);
      if (b) { b.classList.remove('loading'); b.disabled = false; }
    });
  }
}

document.getElementById('publish-btn').onclick        = () => submitPost('published');
document.getElementById('save-draft-btn').onclick     = () => submitPost('draft');
document.getElementById('publish-btn-2').onclick      = () => submitPost('published');
document.getElementById('save-draft-btn-2').onclick   = () => submitPost('draft');
