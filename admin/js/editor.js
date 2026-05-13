/**
 * Chronicle TipTap Editor
 * Shared between create.js and edit.js.
 * Call initEditor(containerId, placeholder) → returns the editor instance.
 */

/* ── SVG icon helper ──────────────────────────────────────────────────── */
function icon(path, viewBox) {
  return `<svg viewBox="${viewBox || '0 0 24 24'}" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

const ICONS = {
  bold:        icon('<path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>'),  
  italic:      icon('<line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/>'),
  underline:   icon('<path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/>'),
  strike:      icon('<line x1="5" y1="12" x2="19" y2="12"/><path d="M16 6C16 6 14.5 4 12 4s-4 1.5-4 3.5c0 2.19 1.6 3.1 4 4"/><path d="M8 18c0 0 1.5 2 4 2s4-1.5 4-3.5"/>'),
  alignL:      icon('<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/>'),
  alignC:      icon('<line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>'),
  alignR:      icon('<line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/>'),
  ul:          icon('<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>'),
  ol:          icon('<line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10H6"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>'),
  quote:       icon('<path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>'),
  code:        icon('<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>'),
  codeBlock:   icon('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/>'),
  link:        icon('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'),
  image:       icon('<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>'),
  youtube:     icon('<path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>'),
  highlight:   icon('<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>'),
  hr:          icon('<line x1="3" y1="12" x2="21" y2="12"/>'),
  undo:        icon('<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.67"/>'),
  redo:        icon('<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.49-3.67"/>'),
};

/* ── Toolbar builder ──────────────────────────────────────────────────── */
function btn(title, iconHtml, onClick, dataAttr) {
  const b = document.createElement('button');
  b.type      = 'button';
  b.className = 'toolbar-btn';
  b.title     = title;
  b.innerHTML = iconHtml;
  if (dataAttr) Object.entries(dataAttr).forEach(([k,v]) => b.setAttribute(k,v));
  b.addEventListener('mousedown', e => { e.preventDefault(); onClick(); });
  return b;
}

function sep() {
  const d = document.createElement('div');
  d.className = 'toolbar-sep';
  return d;
}

function buildToolbar(editor, toolbar) {
  const add = (...els) => els.forEach(el => toolbar.appendChild(el));

  // ── Inline formatting ────────────────────────────────────────────────
  add(
    btn('Bold (Ctrl+B)',      ICONS.bold,      () => editor.chain().focus().toggleBold().run()),
    btn('Italic (Ctrl+I)',    ICONS.italic,    () => editor.chain().focus().toggleItalic().run()),
    btn('Underline (Ctrl+U)', ICONS.underline, () => editor.chain().focus().toggleUnderline().run()),
    btn('Strikethrough',      ICONS.strike,    () => editor.chain().focus().toggleStrike().run()),
    sep(),
  );

  // ── Headings ─────────────────────────────────────────────────────────
  [1, 2, 3].forEach(level => {
    add(btn(`Heading ${level}`, `H${level}`,
      () => editor.chain().focus().toggleHeading({ level }).run(),
      { 'data-level': level }));
  });
  add(sep());

  // ── Alignment ────────────────────────────────────────────────────────
  add(
    btn('Align left',   ICONS.alignL, () => editor.chain().focus().setTextAlign('left').run()),
    btn('Align centre', ICONS.alignC, () => editor.chain().focus().setTextAlign('center').run()),
    btn('Align right',  ICONS.alignR, () => editor.chain().focus().setTextAlign('right').run()),
    sep(),
  );

  // ── Lists + blocks ───────────────────────────────────────────────────
  add(
    btn('Bullet list',     ICONS.ul,        () => editor.chain().focus().toggleBulletList().run()),
    btn('Numbered list',   ICONS.ol,        () => editor.chain().focus().toggleOrderedList().run()),
    btn('Blockquote',      ICONS.quote,     () => editor.chain().focus().toggleBlockquote().run()),
    btn('Inline code',     ICONS.code,      () => editor.chain().focus().toggleCode().run()),
    btn('Code block',      ICONS.codeBlock, () => editor.chain().focus().toggleCodeBlock().run()),
    btn('Divider',         ICONS.hr,        () => editor.chain().focus().setHorizontalRule().run()),
    sep(),
  );

  // ── Media ────────────────────────────────────────────────────────────
  add(
    btn('Insert link', ICONS.link, () => {
      const prev = editor.getAttributes('link').href || '';
      const url  = window.prompt('URL', prev);
      if (url === null) return;
      if (url === '') { editor.chain().focus().unsetLink().run(); return; }
      editor.chain().focus().setLink({ href: url, target: '_blank' }).run();
    }),
    btn('Insert image', ICONS.image, () => {
      const url = window.prompt('Image URL');
      if (url) editor.chain().focus().setImage({ src: url }).run();
    }),
    btn('Embed YouTube', ICONS.youtube, () => {
      const url = window.prompt('YouTube URL');
      if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run();
    }),
    sep(),
  );

  // ── Highlight ────────────────────────────────────────────────────────
  add(
    btn('Highlight', ICONS.highlight, () => editor.chain().focus().toggleHighlight().run()),
  );

  // ── Text colour ──────────────────────────────────────────────────────
  const colorBtn = document.createElement('button');
  colorBtn.type      = 'button';
  colorBtn.className = 'toolbar-btn color-btn';
  colorBtn.title     = 'Text colour';
  const dot          = document.createElement('div');
  dot.className      = 'color-dot';
  const colorInput   = document.createElement('input');
  colorInput.type    = 'color';
  colorInput.value   = '#d2691e';
  colorInput.addEventListener('input', e => {
    dot.style.background = e.target.value;
    editor.chain().focus().setColor(e.target.value).run();
  });
  colorBtn.appendChild(dot);
  colorBtn.appendChild(colorInput);
  add(sep(), colorBtn, sep());

  // ── History ──────────────────────────────────────────────────────────
  add(
    btn('Undo (Ctrl+Z)',     ICONS.undo, () => editor.chain().focus().undo().run()),
    btn('Redo (Ctrl+Shift+Z)', ICONS.redo, () => editor.chain().focus().redo().run()),
  );
}

/* ── Active-state refresh ─────────────────────────────────────────────── */
function refreshToolbar(editor, toolbar) {
  const map = {
    '[title^="Bold"]':        () => editor.isActive('bold'),
    '[title^="Italic"]':      () => editor.isActive('italic'),
    '[title^="Underline"]':   () => editor.isActive('underline'),
    '[title^="Strike"]':      () => editor.isActive('strike'),
    '[title^="Bullet"]':      () => editor.isActive('bulletList'),
    '[title^="Numbered"]':    () => editor.isActive('orderedList'),
    '[title^="Block"]':       () => editor.isActive('blockquote'),
    '[title^="Inline code"]': () => editor.isActive('code'),
    '[title^="Code block"]':  () => editor.isActive('codeBlock'),
    '[title^="Highlight"]':   () => editor.isActive('highlight'),
    '[title^="Insert link"]': () => editor.isActive('link'),
    '[data-level="1"]':       () => editor.isActive('heading', { level: 1 }),
    '[data-level="2"]':       () => editor.isActive('heading', { level: 2 }),
    '[data-level="3"]':       () => editor.isActive('heading', { level: 3 }),
    '[title^="Align left"]':  () => editor.isActive({ textAlign: 'left' }),
    '[title^="Align centre"]':() => editor.isActive({ textAlign: 'center' }),
    '[title^="Align right"]': () => editor.isActive({ textAlign: 'right' }),
  };

  Object.entries(map).forEach(([sel, check]) => {
    toolbar.querySelectorAll(sel).forEach(el =>
      el.classList.toggle('is-active', check()));
  });
}

/* ── Public: initEditor ───────────────────────────────────────────────── */
function initEditor(wrapId, placeholder) {
  const wrap    = document.getElementById(wrapId);
  const toolbar = wrap.querySelector('.editor-toolbar');
  const mount   = wrap.querySelector('.editor-content');
  const wdEl    = wrap.querySelector('.editor-word-count');
  const rdEl    = wrap.querySelector('.editor-read-time');

  const { Editor, extensions: ext } = window.TipTap;

  const editor = new Editor({
    element: mount,
    extensions: [
      ext.StarterKit,
      ext.Underline,
      ext.TextStyle,
      ext.Color,
      ext.Highlight,
      ext.Image.configure({ allowBase64: false, inline: false }),
      ext.Link.configure({ openOnClick: false, autolink: true }),
      ext.TextAlign.configure({ types: ['heading', 'paragraph'] }),
      ext.Youtube.configure({ width: '100%', height: 400 }),
      ext.Placeholder.configure({ placeholder }),
      ext.CharacterCount,
    ],
    onUpdate({ editor }) {
      updateCounts(editor, wdEl, rdEl);
      refreshToolbar(editor, toolbar);
    },
    onSelectionUpdate({ editor }) {
      refreshToolbar(editor, toolbar);
    },
    onTransaction({ editor }) {
      refreshToolbar(editor, toolbar);
    },
    editorProps: {
      attributes: { spellcheck: 'true' },
    },
  });

  buildToolbar(editor, toolbar);
  refreshToolbar(editor, toolbar);

  return editor;
}

function updateCounts(editor, wdEl, rdEl) {
  const text  = editor.getText();
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  const mins  = Math.max(1, Math.ceil(words / 200));
  if (wdEl) wdEl.textContent = words.toLocaleString() + ' words';
  if (rdEl) rdEl.textContent = mins + ' min read';
}
