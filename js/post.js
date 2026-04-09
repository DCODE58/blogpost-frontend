function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (type === 'error' ? ' error' : '');
  setTimeout(function() { t.className = 'toast'; }, 3200);
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

const PILL_COLOURS = [
  'var(--card-yellow)',
  'var(--card-pink)',
  'var(--card-sage)',
  'var(--card-sky)',
];

function pillColour(category) {
  var hash = 0;
  for (var i = 0; i < category.length; i++) hash = category.charCodeAt(i) + ((hash << 5) - hash);
  return PILL_COLOURS[Math.abs(hash) % PILL_COLOURS.length];
}

async function loadPost() {
  const params = new URLSearchParams(window.location.search);
  const id     = params.get('id');

  if (!id || isNaN(Number(id))) {
    document.getElementById('post-content').innerHTML = `
      <div style="text-align:center;padding:3rem 0">
        <h3 style="font-family:var(--font-display);font-size:1.5rem;margin-bottom:0.5rem">Post not found</h3>
        <a href="index.html" style="color:var(--orange);font-family:var(--font-ui);font-weight:700">Return home &rarr;</a>
      </div>`;
    return;
  }

  try {
    const res = await fetch(window.API_BASE + '/posts/' + id);
    if (!res.ok) throw new Error('Not found');
    const post = await res.json();

    // Update page meta
    document.title = post.title + ' \u2014 The Chronicle';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content',
        (post.content || '').replace(/<[^>]+>/g, '').slice(0, 160));
    }

    const colour   = pillColour(post.category || 'General');
    const imgHtml  = post.image_url
      ? '<div class="post-hero-image"><img src="' + post.image_url + '" alt="' + post.title + '" /></div>'
      : '';

    document.getElementById('post-content').innerHTML = `
      <header class="post-header">
        <div class="post-kicker" style="background:${colour}">${post.category || 'General'}</div>
        <h1 class="post-title">${post.title}</h1>
        <div class="post-meta">
          <span class="post-meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            ${formatDate(post.created_at)}
          </span>
          <span class="post-meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            ${(post.views + 1).toLocaleString()} views
          </span>
        </div>
      </header>

      ${imgHtml}

      <div class="post-content">${post.content}</div>
    `;

    // Increment view counter (fire and forget)
    fetch(window.API_BASE + '/posts/' + id + '/view', { method: 'POST' }).catch(function() {});

  } catch (_) {
    document.getElementById('post-content').innerHTML = `
      <div style="text-align:center;padding:3rem 0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
          style="width:52px;height:52px;margin:0 auto 1.2rem;display:block;color:var(--border-light)">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h3 style="font-family:var(--font-display);font-size:1.4rem;margin-bottom:0.4rem">Post not found</h3>
        <p style="color:var(--muted);margin-bottom:1.2rem">This story may have been removed.</p>
        <a href="index.html"
          style="display:inline-flex;align-items:center;gap:0.4rem;font-family:var(--font-ui);font-weight:700;font-size:0.85rem;color:var(--orange)">
          &larr; Return home
        </a>
      </div>`;
  }
}

loadPost();
