# The Chronicle — Frontend

A statically deployed blog frontend built with vanilla HTML, CSS, and JavaScript. No build step required for the public site. The admin section bundles TipTap via esbuild for a self-hosted rich text editor with zero CDN dependency.

Deployed on **Vercel**. Talks to a separate Node/Express backend deployed on **Render**.

---

## Table of Contents

- [Project Structure](#project-structure)
- [Pages](#pages)
- [Admin Panel](#admin-panel)
- [Editor](#editor)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [SEO](#seo)
- [View Counting](#view-counting)
- [Security](#security)
- [Design System](#design-system)
- [Recent Updates](#recent-updates)

---

## Project Structure

```
blogpost-frontend/
├── index.html                  # Public homepage — post grid + hero
├── post.html                   # Individual post page
├── vercel.json                 # Vercel routing + cache headers
├── README.md
│
├── css/
│   └── styles.css              # Public site styles + CSS variables
│
├── js/
│   ├── config.js               # API base URL (auto-switches dev/prod)
│   ├── main.js                 # Homepage logic — fetch, render, paginate
│   └── post.js                 # Single post logic — load, SEO, view count
│
└── admin/
    ├── dashboard.html          # Post list + stats
    ├── create.html             # New post editor
    ├── edit.html               # Edit existing post
    ├── login.html              # Login page (redirects — auth removed)
    │
    ├── css/
    │   ├── admin.css           # Admin layout, sidebar, dashboard styles
    │   └── editor.css          # TipTap editor styles (matches blog aesthetic)
    │
    ├── editor/
    │   └── tiptap.bundle.js    # Self-hosted TipTap 2 bundle (esbuild, 370KB)
    │
    └── js/
        ├── config.js           # Re-uses ../js/config.js (loaded via relative path)
        ├── editor.js           # Shared TipTap init + toolbar builder
        ├── create.js           # New post page logic
        ├── edit.js             # Edit post page logic
        ├── dashboard.js        # Dashboard fetch + render + delete
        └── login.js            # Immediately redirects to dashboard (no auth)
```

---

## Pages

### `index.html` — Homepage

- Hero section featuring the latest published post
- Filterable, paginated post grid (9 posts per page)
- Search input with 420ms debounce
- Category dropdown filter
- Skeleton loading cards shown while fetching
- Context-aware empty states (search miss vs no posts vs no category results)
- Retry button on network error
- Dynamic `<title>` and `<meta description>` set on load

**Key functions in `main.js`:**

| Function | Purpose |
|---|---|
| `loadHeroFeatured()` | Fetches the latest post, populates hero section |
| `fetchPosts()` | Fetches paginated/filtered posts, renders grid |
| `renderPosts(posts)` | Builds post card HTML from data |
| `renderPagination(total, page, limit)` | Builds prev/next/numbered pagination |
| `showSkeleton()` | Shows 6 skeleton cards while loading |
| `smartExcerpt(html, maxLen)` | Strips HTML, trims at nearest word boundary |
| `setMeta(title, description)` | Updates document title and meta description |

### `post.html` — Single Post

- Fetches post by `?id=` query parameter
- Skeleton loader shown while fetching
- Displays: category pill, title, date, view count, estimated read time, cover image, full content
- Fires view increment (`POST /posts/:id/view`) only if this device hasn't viewed the post in 90 days (localStorage gate)
- Distinct 404 state when post is not found or unpublished
- Distinct error state with Retry button on network failure
- Dynamic SEO: sets `<title>`, `<meta name="description">`, and all Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`)

---

## Admin Panel

The admin is a set of static HTML pages under `/admin/`. No framework, no build step for the HTML or CSS. Auth has been removed — all routes are open. The only "auth" is the absence of a public link to `/admin/`.

### `dashboard.html`

- Fetches all posts from `GET /api/posts/admin/all`
- Displays stats bar: published count, draft count, total views
- Searchable, filterable post table (by status)
- Edit button links to `edit.html?id=<id>`
- Delete button opens a confirmation modal, then calls `DELETE /api/posts/:id`
- Errors rendered inside the table (not just a toast) so failures are impossible to miss
- Console logs prefixed `[dashboard]` for easy debugging

### `create.html`

- TipTap rich text editor (see [Editor](#editor) section)
- Title input, category select, cover image URL input with live preview
- Status toggle: Draft / Published
- Keyboard shortcuts: `Ctrl+S` saves draft, `Ctrl+Enter` publishes
- Validates title (≥ 3 chars) and content (≥ 10 chars plain text) before submitting
- On success: toast + redirect to dashboard after 1.1s

### `edit.html`

- Loads existing post via `GET /api/posts/admin/:id`
- Populates all fields including TipTap content via `editor.commands.setContent(html)`
- Same validation, keyboard shortcuts, and status toggle as create
- Preview link appears in topbar once post is published
- `Ctrl+S` saves without redirect

---

## Editor

The admin editor has been migrated from **Quill 1.3.7** (abandoned, CDN-dependent) to **TipTap 2** (actively maintained, self-hosted).

### Why TipTap

- Quill 1.3.7 had no updates since 2019 and known unfixed bugs
- Pasting from Google Docs or Word imported invisible `<span>` tags
- No table support, no YouTube embeds, broken mobile toolbar
- Loaded from an external CDN with no integrity hash

### Bundle

TipTap is not available as a simple CDN drop-in. It was bundled using **esbuild** into a single file:

```
admin/editor/tiptap.bundle.js   (370 KB minified)
```

The bundle exports `window.TipTap` containing the `Editor` class and all extensions. No internet request is made when the admin loads the editor.

**Extensions included:**

| Extension | Feature |
|---|---|
| `StarterKit` | Bold, italic, strike, headings, lists, blockquote, code, horizontal rule, undo/redo |
| `Underline` | Underline formatting |
| `TextStyle` + `Color` | Per-character text colour via colour picker |
| `Highlight` | Text highlight (orange tint matching blog accent) |
| `Image` | Insert images by URL |
| `Link` | Hyperlinks with auto-link detection |
| `TextAlign` | Left / centre / right alignment on paragraphs and headings |
| `Youtube` | Paste a YouTube URL to embed a responsive iframe |
| `Placeholder` | Ghost placeholder text |
| `CharacterCount` | Live word count and estimated read time in footer bar |

### Shared Init — `editor.js`

Both `create.js` and `edit.js` call:

```js
const editor = initEditor('editor-wrap', 'Write your story here…');
```

`editor.js` builds the toolbar programmatically from SVG icons, wires every button to a TipTap chain command, and refreshes active states on every selection change and transaction. There is no duplicated toolbar code between the two pages.

### TipTap API used in page scripts

| Operation | Code |
|---|---|
| Read content | `editor.getHTML()` |
| Read plain text | `editor.getText()` |
| Load content | `editor.commands.setContent(html)` |
| Focus editor | `editor.commands.focus()` |
| Word count | `editor.getText().trim().split(/\s+/).length` |

### Toolbar features

Bold · Italic · Underline · Strikethrough · H1 · H2 · H3 · Align left · Align centre · Align right · Bullet list · Numbered list · Blockquote · Inline code · Code block · Divider · Insert link · Insert image · Embed YouTube · Highlight · Text colour · Undo · Redo

---

## Configuration

### API base URL — `js/config.js`

```js
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api'
  : 'https://blogpost-backend-7l0a.onrender.com/api';

window.API_BASE = API_BASE;
```

Update the production URL if you redeploy the backend to a different Render service. Admin pages load this file via `../js/config.js`.

### `vercel.json`

```json
{
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [
    {
      "source": "/admin/js/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "no-store, no-cache, must-revalidate" }]
    },
    {
      "source": "/js/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "no-store, no-cache, must-revalidate" }]
    }
  ]
}
```

- `cleanUrls` serves `.html` files without the extension (`/admin/dashboard` instead of `/admin/dashboard.html`)
- `trailingSlash: false` prevents redirect loops
- `Cache-Control: no-store` on all JS files prevents Vercel's CDN from serving stale scripts after a deploy — this was the cause of the persistent "token not defined" error during development

---

## Deployment

### First deploy

1. Push the repository to GitHub
2. In [Vercel](https://vercel.com), create a new project and import the repository
3. Set **Root Directory** to the frontend folder if it is in a monorepo, otherwise leave as default
4. No build command is needed — Vercel detects a static site automatically
5. Click **Deploy**

### Subsequent deploys

```bash
git add .
git commit -m "your message"
git push
```

Vercel auto-deploys on every push to the default branch.

### Verify a deploy

After pushing, open the Vercel dashboard → your project → **Deployments** → click the latest deployment → **Source** to confirm the correct file versions were included.

To verify the admin JS is the latest version, open the browser console on the dashboard page. You should see:

```
[dashboard.js] v3 loaded — token-free build
```

---

## SEO

### Homepage (`main.js`)

Sets on load:

```html
<title>The Chronicle — Latest Stories</title>
<meta name="description" content="Discover in-depth articles, opinions and stories on business, culture and more.">
```

### Post page (`post.js`)

Sets dynamically after the post loads:

```html
<title>{post.title} — The Chronicle</title>
<meta name="description" content="{first 160 chars of post, trimmed at word boundary}">
<meta property="og:title"       content="{post.title}">
<meta property="og:description" content="{same as meta description}">
<meta property="og:type"        content="article">
<meta property="og:url"         content="{window.location.href}">
<meta property="og:image"       content="{post.image_url}">  <!-- if present -->
```

Open Graph tags are what WhatsApp, Twitter/X, Slack, and iMessage use when someone shares a post link. The `og:image` tag means shared links show the post cover image as a preview card.

---

## View Counting

View counts are deduplicated at two independent layers:

### Layer 1 — localStorage (client, fires first)

Before the view increment request is sent, `post.js` checks:

```js
localStorage.getItem('view_' + postId)  // timestamp in ms
```

If the stored timestamp is less than 90 days old, the fetch is skipped entirely — the server is never contacted. On first view, the timestamp is written.

```js
var VIEW_WINDOW_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
```

This covers the common case: the same person refreshing or revisiting a post on their own device.

### Layer 2 — IP hash (server, fallback)

If localStorage is unavailable (private browsing, storage cleared, different browser), the request reaches the server. The backend hashes the client IP with SHA-256 (raw IP is never stored), checks the `post_views` table for a matching `(post_id, ip_hash)` within the last 90 days, and only increments `posts.views` if no match is found.

The two layers together mean a view is only counted once per device per post per 90 days under normal conditions, and once per IP per post per 90 days as a fallback.

---

## Security

### CORS

The backend restricts `Access-Control-Allow-Origin` to:

- `https://blogpost-frontend-silk.vercel.app` (production)
- `http://localhost:5500`, `http://127.0.0.1:5500`, `http://localhost:3001` (local dev)

Additional origins can be added via the `ALLOWED_ORIGINS` environment variable on Render (comma-separated).

### Content sanitization

All HTML content submitted through the editor is sanitized on the **backend** using `sanitize-html` before it is saved to the database. Allowed tags include standard formatting elements (`p`, `h1`–`h4`, `strong`, `em`, `ul`, `ol`, `li`, `blockquote`, `pre`, `code`, `a`, `img`). Disallowed: `<script>`, `<style>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, and all event handler attributes (`onclick`, `onerror`, etc.). External links have `rel="noopener noreferrer"` and `target="_blank"` injected automatically.

### Rate limiting

The backend applies three tiers via `express-rate-limit`:

| Tier | Limit | Window |
|---|---|---|
| Public reads | 200 requests | 15 minutes |
| View increment | 60 requests | 1 hour |
| Admin writes (POST/PUT/DELETE) | 30 requests | 15 minutes |

### Admin access

Authentication has been removed from this version. The admin panel is security-by-obscurity only — there is no public link to `/admin/`. If you need proper authentication, re-add a bcrypt-hashed password stored in an environment variable with a JWT session (no database table required).

---

## Design System

The public site uses a warm editorial palette defined in `css/styles.css`:

| Variable | Value | Usage |
|---|---|---|
| `--orange` | `#E86428` | Primary accent, links, active states |
| `--paper` | `#F5F0E6` | Page background |
| `--ink` | `#1A1814` | Primary text |
| `--muted` | `#6B6456` | Secondary text, metadata |
| `--cream` | `#EDE4D0` | Card backgrounds |
| `--border-light` | `#D4CABC` | Borders, dividers |

**Fonts** (Google Fonts):

| Font | Role |
|---|---|
| Fraunces | Display / headings |
| Syne | UI / labels / nav |
| DM Sans | Body copy |

The admin panel (`admin.css`) uses a dark theme that shares the same `--orange` accent. The TipTap editor (`editor.css`) is written entirely in CSS variables so it inherits the admin dark palette automatically — no hardcoded colours.

---

## Recent Updates

### TipTap editor migration (Quill → TipTap 2)
Replaced the abandoned Quill 1.3.7 rich text editor with TipTap 2. Quill was loaded from an external CDN with no integrity hash and had not been maintained since 2019. TipTap is now self-hosted as a single esbuild bundle (`admin/editor/tiptap.bundle.js`). The new editor supports tables, YouTube embeds, text colour, alignment, and has a fully functional mobile toolbar. Editor logic is shared between `create.js` and `edit.js` through a single `initEditor()` function in `editor.js`.

### Smart excerpt truncation
`smartExcerpt()` in `main.js` now walks back to the nearest space before cutting, so excerpts never end mid-word. Previously used a hard `.slice(0, 155)`.

### Dynamic SEO
`post.js` now writes `<title>`, `<meta name="description">`, and all five Open Graph tags to `<head>` after the post loads. Previously the title was static and there were no OG tags.

### View count deduplication
Added localStorage-based view tracking in `post.js`. The view increment endpoint is only called if the current device has not viewed this post in the last 90 days, preventing view inflation from repeated visits or refreshes. The server-side IP hash check remains as a second layer for private/incognito browsing.

### Skeleton loaders
`post.js` now shows a full skeleton layout (matching the real post structure) while the post is loading, replacing a blank white screen.

### Vercel configuration
Added `vercel.json` to fix two issues: subfolder CSS returning 403 (now properly routed as static files) and JS files being served from Vercel's CDN cache after a deploy (now forced no-cache).

### Error and empty states
Both `main.js` and `post.js` now have distinct error states (network failure with Retry button), 404 states (post not found or unpublished), and context-aware empty states (different message for search vs category filter vs no posts). Previously all failures showed a generic message or nothing.

### Admin token removal
Removed all references to `localStorage.getItem('admin_token')` and `Authorization: Bearer` headers from all admin JS files (`create.js`, `edit.js`, `dashboard.js`, `login.js`). The backend no longer requires auth tokens and the frontend no longer sends them. `login.js` now redirects immediately to `dashboard.html`.
