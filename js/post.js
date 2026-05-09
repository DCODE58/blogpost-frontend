// ── View deduplication (client-side) ───────────────────────────────────
// Check localStorage before firing the view endpoint.
// The same device will not count as a new view for 90 days.
var VIEW_WINDOW_MS = 90 * 24 * 60 * 60 * 1000;

function hasViewedRecently(postId) {
  try {
    var ts = localStorage.getItem('view_' + postId);
    if (!ts) return false;
    return (Date.now() - parseInt(ts, 10)) < VIEW_WINDOW_MS;
  } catch (_) {
    return false; // private browsing / storage blocked — allow the call
  }
}

function markViewed(postId) {
  try {
    localStorage.setItem('view_' + postId, Date.now().toString());
  } catch (_) {}
}

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
  'var(--card-yellow)', 'var(--card-pink)',
  'var(--card-sage)',   'var(--card-sky)',
];
function pillColour(category) {
  var hash = 0;
  for (var i = 0; i < category.length; i++) hash = category.charCodeAt(i) + ((hash << 5) - hash);
  return PILL_COLOURS[Math.abs(hash) % PILL_COLOURS.length];
}

/**
 * Trim plain text at nearest word boundary for meta description.
 */
function smartPlain(html, maxLen) {
  var plain = (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (plain.length <= maxLen) return plain;
  var cut = plain.lastIndexOf(' ', maxLen);
  return plain.slice(0, cut > 0 ? cut : maxLen) + '…';
}

// ── Show skeleton while loading ────────────────────────────────────────
function showSkeleton() {
  document.getElementById('post-content').innerHTML = `
    <div style="padding:2rem 0">
      <div class="skeleton" style="height:18px;width:90px;border-radius:100px;margin-bottom:1.2rem"></div>
      <div class="skeleton" style="height:38px;width:85%;margin-bottom:0.5rem"></div>
      <div class="skeleton" style="height:38px;width:65%;margin-bottom:1.5rem"></div>
      <div class="skeleton" style="height:14px;width:160px;margin-bottom:2rem"></div>
      <div class="skeleton" style="height:320px;border-radius:12px;margin-bottom:2rem"></div>
      ${Array(6).fill('<div class="skeleton" style="height:14px;width:100%;margin-bottom:0.6rem"></div>').join('')}
      <div class="skeleton" style="height:14px;width:55%;margin-bottom:0"></div>
    </div>`;
}

async function loadPost() {
  const params = new URLSearchParams(window.location.search);
  const id     = params.get('id');

  if (!id || isNaN(Number(id))) {
    document.title = 'Post Not Found — The Chronicle';
    document.getElementById('post-content').innerHTML = `
      <div style="text-align:center;padding:3rem 0">
        <h3 style="font-family:var(--font-display);font-size:1.5rem;margin-bottom:0.5rem">Post not found</h3>
        <a href="index.html" style="color:var(--orange);font-family:var(--font-ui);font-weight:700">Return home &rarr;</a>
      </div>`;
    return;
  }

  showSkeleton();

  try {
    const res = await fetch(window.API_BASE + '/posts/' + id);

    if (res.status === 404) {
      document.title = 'Post Not Found — The Chronicle';
      document.getElementById('post-content').innerHTML = `
        <div style="text-align:center;padding:3rem 0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
               style="width:52px;height:52px;margin:0 auto 1rem;display:block;color:var(--border-light)">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h3 style="font-family:var(--font-display);font-size:1.4rem;margin-bottom:0.4rem">Story not found</h3>
          <p style="color:var(--muted);margin-bottom:1.2rem">This article may have been removed or unpublished.</p>
          <a href="index.html"
             style="display:inline-flex;align-items:center;gap:0.4rem;font-family:var(--font-ui);
                    font-weight:700;font-size:0.85rem;color:var(--orange)">
            &larr; Return home
          </a>
        </div>`;
      return;
    }

    if (!res.ok) throw new Error('HTTP ' + res.status);

    const post = await res.json();

    // ── Dynamic SEO ──────────────────────────────────────────────────
    document.title = post.title + ' \u2014 The Chronicle';

    var description = smartPlain(post.excerpt || post.content, 160);

    var metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    // Open Graph tags for social sharing
    function setOg(prop, content) {
      var el = document.querySelector('meta[property="' + prop + '"]');
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', prop);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    }
    setOg('og:title',       post.title);
    setOg('og:description', description);
    setOg('og:type',        'article');
    setOg('og:url',         window.location.href);
    if (post.image_url) setOg('og:image', post.image_url);

    // ── Render ───────────────────────────────────────────────────────
    var colour  = pillColour(post.category || 'General');
    var imgHtml = post.image_url
      ? '<div class="post-hero-image"><img src="' + post.image_url + '" alt="' + post.title + '" /></div>'
      : '';

    var readMins = Math.max(1, Math.ceil(
      (post.content || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length / 200
    ));

    document.getElementById('post-content').innerHTML =
      '<header class="post-header">' +
        '<div class="post-kicker" style="background:' + colour + '">' + (post.category || 'General') + '</div>' +
        '<h1 class="post-title">' + post.title + '</h1>' +
        '<div class="post-meta">' +
          '<span class="post-meta-item">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
              '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>' +
              '<line x1="16" y1="2" x2="16" y2="6"/>' +
              '<line x1="8" y1="2" x2="8" y2="6"/>' +
              '<line x1="3" y1="10" x2="21" y2="10"/>' +
            '</svg>' +
            formatDate(post.created_at) +
          '</span>' +
          '<span class="post-meta-item">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
              '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>' +
              '<circle cx="12" cy="12" r="3"/>' +
            '</svg>' +
            (post.views + 1).toLocaleString() + ' views' +
          '</span>' +
          '<span class="post-meta-item">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
              '<circle cx="12" cy="12" r="10"/>' +
              '<polyline points="12 6 12 12 16 14"/>' +
            '</svg>' +
            readMins + ' min read' +
          '</span>' +
        '</div>' +
      '</header>' +
      imgHtml +
      '<div class="post-content">' + post.content + '</div>';

    // Only count a view if this device hasn't viewed this post in 90 days.
    // localStorage is the first gate; the server-side IP hash is the second.
    if (!hasViewedRecently(id)) {
      markViewed(id);
      fetch(window.API_BASE + '/posts/' + id + '/view', { method: 'POST' }).catch(function() {});
    }

  } catch (_) {
    document.title = 'Error — The Chronicle';
    document.getElementById('post-content').innerHTML = `
      <div style="text-align:center;padding:3rem 0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
             style="width:52px;height:52px;margin:0 auto 1.2rem;display:block;color:var(--border-light)">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h3 style="font-family:var(--font-display);font-size:1.4rem;margin-bottom:0.4rem">Something went wrong</h3>
        <p style="color:var(--muted);margin-bottom:1.2rem">Could not load this story. Please try again.</p>
        <div style="display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap">
          <button onclick="loadPost()"
            style="padding:0.5rem 1.2rem;border:1.5px solid var(--border-light);
                   border-radius:8px;background:none;cursor:pointer;
                   font-family:var(--font-ui);font-size:0.85rem">
            Retry
          </button>
          <a href="index.html"
             style="padding:0.5rem 1.2rem;border:1.5px solid var(--border-light);
                    border-radius:8px;font-family:var(--font-ui);font-size:0.85rem;
                    color:inherit;text-decoration:none;display:inline-block">
            Return home
          </a>
        </div>
      </div>`;
  }
}

loadPost();
