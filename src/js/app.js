/* Mindmap — application */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const IS_MAC = /Mac|iPhone|iPad/.test(navigator.platform);
  const MOD = IS_MAC ? '⌘' : 'Ctrl';
  const ALT = IS_MAC ? '⌥' : 'Alt';
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------------------------------------------------------------- icons */
  const ICONS = {
    'arrow-left': '<path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>',
    undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>',
    redo: '<path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 15-6.7L21 13"/>',
    minus: '<path d="M5 12h14"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    fit: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M16 3h3a2 2 0 0 1 2 2v3"/><path d="M8 21H5a2 2 0 0 1-2-2v-3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
    moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    x: '<path d="M18 6L6 18M6 6l12 12"/>',
    open: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14L21 3"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    roller: '<rect x="3" y="3" width="14" height="6" rx="1.5"/><path d="M17 6h2a2 2 0 0 1 2 2v3a1 1 0 0 1-1 1h-9v2"/><rect x="9" y="14" width="4" height="7" rx="1"/>',
    paste: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 14l2 2 4-4"/>',
    eraser: '<path d="M20 20H7L3 16a2 2 0 0 1 0-3l9-9a2 2 0 0 1 3 0l6 6a2 2 0 0 1 0 3l-7 7"/><path d="M6 11l7 7"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    note: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h6"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>',
  };
  const icon = name =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
  $$('[data-icon]').forEach(el => el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon)));

  /* ---------------------------------------------------------------- dom refs */
  const el = {
    home: $('#home'),
    editor: $('#editor'),
    cards: $('#cards'),
    empty: $('#empty'),
    search: $('#search'),
    mapCount: $('#map-count'),
    title: $('#map-title'),
    status: $('#save-status'),
    viewport: $('#viewport'),
    world: $('#world'),
    links: $('#links'),
    nodes: $('#nodes'),
    zoomLabel: $('#zoom-level'),
    undo: $('#undo'),
    redo: $('#redo'),
    help: $('#help'),
    helpBody: $('#help-body'),
    stats: $('#map-stats'),
    stylebar: $('#stylebar'),
    sbPop: $('#sb-pop'),
    notesPane: $('#notes-pane'),
    notesBtn: $('#notes-btn'),
  };

  /* ---------------------------------------------------------------- theme */
  const THEME_KEY = 'mindmap.theme';
  const THEME_MODES = ['light', 'dark', 'system'];
  const THEME_LABEL = { light: 'Light', dark: 'Dark', system: 'System' };
  const THEME_ICON = { light: 'sun', dark: 'moon', system: 'monitor' };
  const darkMQ = window.matchMedia('(prefers-color-scheme: dark)');
  let themeMode = localStorage.getItem(THEME_KEY);
  if (!THEME_MODES.includes(themeMode)) themeMode = 'system';

  const effectiveTheme = () => (themeMode === 'system' ? (darkMQ.matches ? 'dark' : 'light') : themeMode);

  function applyTheme(mode, { animate = true } = {}) {
    themeMode = THEME_MODES.includes(mode) ? mode : 'system';
    localStorage.setItem(THEME_KEY, themeMode);
    const eff = effectiveTheme();
    const html = document.documentElement;
    if (animate && html.dataset.theme !== eff) {
      html.classList.add('theme-transition');
      clearTimeout(applyTheme.timer);
      applyTheme.timer = setTimeout(() => html.classList.remove('theme-transition'), 400);
    }
    html.dataset.theme = eff;
    html.style.colorScheme = eff;
    $$('.theme-toggle').forEach(b => {
      b.innerHTML = icon(THEME_ICON[themeMode]);
      b.title = `Theme: ${THEME_LABEL[themeMode]}${themeMode === 'system' ? ` (${eff})` : ''}`;
      b.setAttribute('aria-label', b.title);
    });
    $$('.theme-menu button').forEach(b => b.classList.toggle('current', b.dataset.mode === themeMode));
  }
  darkMQ.addEventListener('change', () => { if (themeMode === 'system') applyTheme('system'); });
  applyTheme(themeMode, { animate: false });

  function openThemeMenu(btn) {
    closeMenus();
    const menu = document.createElement('div');
    menu.className = 'menu theme-menu';
    menu.innerHTML = THEME_MODES.map(m =>
      `<button data-mode="${m}" class="${m === themeMode ? 'current' : ''}">${icon(THEME_ICON[m])}${THEME_LABEL[m]}<span class="menu-check">${icon('check')}</span></button>`).join('');
    menu.addEventListener('click', e => {
      const b = e.target.closest('[data-mode]');
      if (!b) return;
      applyTheme(b.dataset.mode);
      closeMenus();
    });
    document.body.appendChild(menu);
    const r = btn.getBoundingClientRect();
    menu.style.top = `${r.bottom + 6}px`;
    menu.style.left = `${Math.max(8, Math.min(r.right - menu.offsetWidth, window.innerWidth - menu.offsetWidth - 8))}px`;
  }
  $$('.theme-toggle').forEach(b => b.addEventListener('click', () => {
    if ($('.theme-menu')) closeMenus(); else openThemeMenu(b);
  }));
  document.addEventListener('keydown', e => {
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      applyTheme(effectiveTheme() === 'dark' ? 'light' : 'dark');
    } else if (e.key === 'Escape' && $('.menu')) {
      closeMenus();
    }
  });

  /* ---------------------------------------------------------------- tree helpers */
  const makeNode = (text = '') => ({ id: uid(), text, children: [] });

  function findNode(root, id) {
    let found = null;
    (function walk(node, parent, depth) {
      if (found) return;
      if (node.id === id) { found = { node, parent, depth, index: parent ? parent.children.indexOf(node) : -1 }; return; }
      node.children.forEach(c => walk(c, node, depth + 1));
    })(root, null, 0);
    return found;
  }
  function countNodes(root) {
    let n = 0;
    (function walk(x) { n++; x.children.forEach(walk); })(root);
    return n;
  }
  function cloneWithNewIds(node) {
    return { ...node, id: uid(), children: node.children.map(cloneWithNewIds) };
  }
  function relTime(ts) {
    const d = Date.now() - ts;
    const m = Math.floor(d / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m} min ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} h ago`;
    const days = Math.floor(h / 24);
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days} days ago`;
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  /* ---------------------------------------------------------------- state */
  const state = {
    map: null,
    layout: null,
    selectedId: null,
    editingId: null,
    editStartText: '',
    editSnapshot: null,
    newNodeId: null,
    undo: [],
    redo: [],
    view: { x: 0, y: 0, z: 1 },
    pendingEditRoot: false,
    saveFailed: false,
  };
  const nodeEls = new Map();   // id -> .node element
  const linkEls = new Map();   // child id -> <path>
  const pos = new Map();       // id -> {x, y} current animated position

  /* ================================================================ LIBRARY */
  async function showHome() {
    if (state.saveFailed && state.map) {
      if (!confirm('Unsaved changes will be lost. Leave this map?')) {
        location.hash = `#/map/${state.map.id}`;
        return;
      }
      setStatus('saved');
    }
    if (state.editingId) commitEdit();
    state.map = null;
    el.editor.hidden = true;
    el.home.hidden = false;
    el.help.hidden = true;
    updateDocumentTitle();
    await renderLibrary();
  }

  function thumbSVG(root) {
    const L = Layout.compute(root);
    const b = L.bounds;
    const pad = 24;
    let w = b.maxX - b.minX + pad * 2;
    let h = b.maxY - b.minY + pad * 2;
    // keep a pleasant aspect ratio even for tiny maps
    const minW = 520, minH = 200;
    const cx = (b.minX + b.maxX) / 2, cy = (b.minY + b.maxY) / 2;
    w = Math.max(w, minW); h = Math.max(h, minH);
    if (w / h < 2.6) w = h * 2.6;
    const vb = `${cx - w / 2} ${cy - h / 2} ${w} ${h}`;
    const parts = [];
    for (const ln of L.nodes) {
      if (!ln.parent) continue;
      const d = Layout.linkPath(ln.parent, ln, ln.parent, ln);
      parts.push(`<path d="${d}" fill="none" stroke="${ln.color}" stroke-width="${ln.depth === 1 ? 3 : 2}" opacity="${ln.depth === 1 ? .8 : .45}" stroke-linecap="round"/>`);
    }
    for (const ln of L.nodes) {
      const fill = (ln.node.style && ln.node.style.bg) || (ln.depth === 0 ? 'var(--accent)' : ln.color);
      const op = ln.depth === 0 ? 1 : ln.depth === 1 ? .85 : .45;
      parts.push(`<rect x="${ln.x - ln.w / 2}" y="${ln.y - ln.h / 2}" width="${ln.w}" height="${ln.h}" rx="${ln.depth === 0 ? 12 : 8}" fill="${fill}" opacity="${op}"/>`);
    }
    return `<svg viewBox="${vb}" preserveAspectRatio="xMidYMid meet">${parts.join('')}</svg>`;
  }

  async function renderLibrary() {
    const q = el.search.value.trim().toLowerCase();
    const list = await Store.list();
    const shown = q ? list.filter(m => m.title.toLowerCase().includes(q)) : list;
    el.mapCount.textContent = list.length ? `${list.length} map${list.length === 1 ? '' : 's'}` : '';
    Usage.refresh();
    el.empty.hidden = list.length > 0;
    el.cards.innerHTML = '';
    if (q && !shown.length) {
      el.cards.innerHTML = `<p class="muted">No maps match “${escapeHTML(q)}”.</p>`;
      return;
    }
    for (const entry of shown) {
      const map = await Store.get(entry.id);
      if (!map) continue;
      const card = document.createElement('article');
      card.className = 'card';
      card.dataset.id = map.id;
      card.innerHTML = `
        <div class="thumb">${thumbSVG(map.root)}</div>
        <div class="card-body">
          <div class="card-title" title="${escapeHTML(map.title)}">${escapeHTML(map.title)}</div>
          <div class="card-meta"><span>${entry.nodeCount} node${entry.nodeCount === 1 ? '' : 's'}</span><span class="sep">·</span><span>Edited ${relTime(map.updatedAt)}</span></div>
        </div>
        <button class="icon-btn card-menu" title="More">${icon('more')}</button>`;
      el.cards.appendChild(card);
    }
  }

  const escapeHTML = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function closeMenus() { $$('.menu').forEach(m => m.remove()); }

  function openMenu(card) {
    closeMenus();
    const menu = document.createElement('div');
    menu.className = 'menu';
    menu.innerHTML = `
      <button data-act="open">${icon('open')}Open</button>
      <button data-act="rename">${icon('edit')}Rename</button>
      <button data-act="duplicate">${icon('copy')}Duplicate</button>
      <div class="menu-sep"></div>
      <button data-act="delete" class="danger">${icon('trash')}Delete</button>`;
    card.appendChild(menu);
  }

  el.cards.addEventListener('click', async e => {
    const card = e.target.closest('.card');
    if (!card) return;
    const id = card.dataset.id;
    const act = e.target.closest('[data-act]');
    if (act) {
      e.stopPropagation();
      const a = act.dataset.act;
      if (a === 'open') { location.hash = `#/map/${id}`; }
      else if (a === 'rename') { closeMenus(); startRename(card); }
      else if (a === 'duplicate') {
        const src = await Store.get(id);
        await Store.create({ title: `${src.title} copy`, root: cloneWithNewIds(src.root) });
        closeMenus(); renderLibrary();
      }
      else if (a === 'delete') {
        if (act.dataset.armed) { await Store.remove(id); closeMenus(); renderLibrary(); }
        else { act.dataset.armed = '1'; act.innerHTML = `${icon('trash')}Confirm delete`; }
      }
      return;
    }
    if (e.target.closest('.card-menu')) { e.stopPropagation(); openMenu(card); return; }
    if (e.target.closest('.card-title input')) return;
    location.hash = `#/map/${id}`;
  });

  function startRename(card) {
    const titleEl = $('.card-title', card);
    const old = titleEl.textContent;
    titleEl.innerHTML = `<input value="${escapeHTML(old)}" spellcheck="false">`;
    const input = $('input', titleEl);
    input.focus(); input.select();
    let done = false;
    const finish = async save => {
      if (done) return; done = true;
      const v = input.value.trim();
      if (save && v && v !== old) {
        const map = await Store.get(card.dataset.id);
        map.title = v; map.titleCustom = true;
        await Store.save(map);
      }
      renderLibrary();
    };
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') finish(true);
      if (e.key === 'Escape') finish(false);
      e.stopPropagation();
    });
    input.addEventListener('blur', () => finish(true));
  }

  document.addEventListener('click', e => { if (!e.target.closest('.menu, .card-menu, .theme-toggle')) closeMenus(); });
  el.search.addEventListener('input', () => renderLibrary());

  async function createMap() {
    const map = await Store.create();
    state.pendingEditRoot = true;
    location.hash = `#/map/${map.id}`;
  }
  $('#new-map').addEventListener('click', createMap);
  $('#empty-new').addEventListener('click', createMap);

  /* ================================================================ EDITOR */
  async function openEditor(id) {
    // Re-routing to the open map (e.g. the leave guard restoring the hash) must not reload the stored copy.
    if (state.map && state.map.id === id && !el.editor.hidden) return;
    const map = await Store.get(id);
    if (!map) { location.hash = '#/'; return; }
    if (state.editingId) commitEdit();
    state.map = map;
    state.undo = []; state.redo = [];
    state.selectedId = map.root.id;
    state.editingId = null;
    state.view = map.view ? { ...map.view } : { x: 0, y: 0, z: 1 };
    nodeEls.forEach(n => n.remove()); nodeEls.clear();
    linkEls.forEach(l => l.remove()); linkEls.clear();
    pos.clear();
    el.home.hidden = true;
    el.editor.hidden = false;
    el.title.value = map.title;
    updateDocumentTitle(map.title);
    if (ensureBranchColors()) Store.save(map, { touch: false });
    setNotesPaneOpen(localStorage.getItem(NOTES_PANE_KEY) === '1', { focus: false });
    setStatus('saved');
    updateUndoButtons();
    applyView();
    relayout(true);
    if (!map.view) fitView(false);
    if (state.pendingEditRoot) {
      state.pendingEditRoot = false;
      startEdit(map.root.id);
    }
  }

  /* ---------- persistence ---------- */
  let saveTimer = null, viewTimer = null;

  /* Storage usage against a nominal 5 MiB per-origin localStorage budget (no quota API exists). */
  const Usage = (() => {
    const BUDGET = 5 * 1024 * 1024;
    const WARN = 0.8;
    const format = bytes => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    function refresh() {
      const used = Store.usage();
      const pct = used / BUDGET;
      const warn = pct >= WARN;
      const percent = Math.round(pct * 100);
      const label = `${format(used)} / 5 MB`;
      const title = warn ? `Storage nearly full — ${percent}% used` : `${percent}% of local storage used`;
      $$('[data-storage-usage]').forEach(node => {
        node.textContent = label;
        node.title = title;
        node.classList.toggle('is-warn', warn);
      });
      if (warn) document.body.dataset.storageWarn = '1'; else delete document.body.dataset.storageWarn;
    }
    return { BUDGET, refresh };
  })();

  const STATUS_LABEL = { saved: 'All changes saved', saving: 'Saving…', failed: 'Not saved — storage full' };
  function setStatus(s) {
    el.status.classList.toggle('is-saved', s === 'saved');
    el.status.classList.toggle('is-saving', s === 'saving');
    el.status.classList.toggle('is-failed', s === 'failed');
    $('.label', el.status).textContent = STATUS_LABEL[s] ?? STATUS_LABEL.saving;
    state.saveFailed = s === 'failed';
  }
  function persist() {
    if (!state.map) return;
    setStatus('saving');
    clearTimeout(saveTimer);
    const map = state.map; // showHome() may null state.map before the debounce fires
    saveTimer = setTimeout(async () => {
      try {
        await Store.save(map);
        if (state.map === map) setStatus('saved');
      } catch (e) {
        if (state.map === map) setStatus('failed');
        else showToast(`Not saved — storage full. The last change to “${map.title}” was lost.`);
      }
      Usage.refresh();
    }, 120);
  }
  function persistView() {
    if (!state.map) return;
    clearTimeout(viewTimer);
    viewTimer = setTimeout(async () => {
      state.map.view = { ...state.view };
      try {
        await Store.save(state.map, { touch: false });
        if (state.saveFailed) setStatus('saved'); // the whole document just landed, so the failed edit is now stored
        Usage.refresh();
      } catch (e) {
        // view-only save: a full store is not worth alarming over
      }
    }, 400);
  }

  /* ---------- undo / redo ---------- */
  const snapshot = () => JSON.stringify(state.map.root);
  function pushUndo(snap = snapshot()) {
    state.undo.push(snap);
    if (state.undo.length > 200) state.undo.shift();
    state.redo = [];
    updateUndoButtons();
  }
  function applySnapshot(snap) {
    state.map.root = JSON.parse(snap);
    if (!findNode(state.map.root, state.selectedId)) state.selectedId = state.map.root.id;
    syncTitleFromRoot();
    persist();
    relayout();
    select(state.selectedId);
    renderNotesPane({ force: true });
  }
  function undo() {
    if (state.editingId) commitEdit();
    if (!state.undo.length) return;
    state.redo.push(snapshot());
    applySnapshot(state.undo.pop());
    updateUndoButtons();
  }
  function redo() {
    if (state.editingId) commitEdit();
    if (!state.redo.length) return;
    state.undo.push(snapshot());
    applySnapshot(state.redo.pop());
    updateUndoButtons();
  }
  function updateUndoButtons() {
    el.undo.disabled = !state.undo.length;
    el.redo.disabled = !state.redo.length;
  }
  el.undo.addEventListener('click', undo);
  el.redo.addEventListener('click', redo);

  /* ---------- layout & rendering ---------- */
  const ANIM_MS = 220;
  let animStart = 0, animating = false;

  function relayout(immediate = false) {
    if (!state.map) return;
    const L = Layout.compute(state.map.root);
    state.layout = L;
    const seen = new Set();

    for (const ln of L.nodes) {
      seen.add(ln.id);
      let n = nodeEls.get(ln.id);
      if (!n) {
        n = document.createElement('div');
        n.className = 'node';
        n.dataset.id = ln.id;
        n.innerHTML = '<span class="node-text"></span><button class="badge" tabindex="-1" title="Collapse / expand"></button><i class="note-mark"></i>'
          + '<div class="resize-handle" data-edge="L"></div><div class="resize-handle" data-edge="R"></div>';
        nodeEls.set(ln.id, n);
        el.nodes.appendChild(n);
      }
      updateNodeEl(n, ln);
      let p = pos.get(ln.id);
      if (!p) {
        const pp = ln.parent ? pos.get(ln.parent.id) : null;
        p = pp ? { x: pp.x, y: pp.y } : { x: ln.x, y: ln.y };
        pos.set(ln.id, p);
      }
      ln.from = { x: p.x, y: p.y };
      ln.to = { x: ln.x, y: ln.y };

      if (ln.parent) {
        let line = linkEls.get(ln.id);
        if (!line) {
          line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          linkEls.set(ln.id, line);
          el.links.appendChild(line);
        }
        line.setAttribute('class', ln.depth === 1 ? 'depth-1' : 'depth-n');
        line.setAttribute('stroke', ln.color);
      }
    }
    for (const [id, n] of nodeEls) if (!seen.has(id)) { n.remove(); nodeEls.delete(id); pos.delete(id); }
    for (const [id, line] of linkEls) if (!seen.has(id) || !L.byId.get(id).parent) { line.remove(); linkEls.delete(id); }

    el.stats.textContent = `${L.nodes.length} node${L.nodes.length === 1 ? '' : 's'}`;

    if (immediate) { applyFrame(1); animating = false; return; }
    animStart = performance.now();
    if (!animating) { animating = true; requestAnimationFrame(tick); }
  }

  function tick(now) {
    if (!animating) return;  // settled/cancelled — a stray scheduled frame must not re-apply stale positions
    const t = clamp((now - animStart) / ANIM_MS, 0, 1);
    applyFrame(1 - Math.pow(1 - t, 3));
    if (t < 1 && animating) requestAnimationFrame(tick); else animating = false;
  }

  function applyFrame(e) {
    const L = state.layout;
    for (const ln of L.nodes) {
      const p = pos.get(ln.id);
      p.x = ln.from.x + (ln.to.x - ln.from.x) * e;
      p.y = ln.from.y + (ln.to.y - ln.from.y) * e;
      nodeEls.get(ln.id).style.transform = `translate3d(${p.x - ln.w / 2}px, ${p.y - ln.h / 2}px, 0)`;
    }
    for (const ln of L.nodes) {
      if (!ln.parent) continue;
      linkEls.get(ln.id).setAttribute('d', Layout.linkPath(ln.parent, ln, pos.get(ln.parent.id), pos.get(ln.id)));
    }
    updateStyleBar();
  }

  function updateNodeEl(n, ln) {
    n.className = `node ${ln.depth === 0 ? 'depth-0' : ln.depth === 1 ? 'depth-1' : 'depth-n'}`
      + (ln.side ? ` side-${ln.side}` : '')
      + (ln.hasChildren ? ' has-children' : '')
      + (ln.collapsed ? ' collapsed' : '')
      + (ln.id === state.selectedId ? ' selected' : '')
      + (ln.id === state.editingId ? ' editing' : '')
      + (ln.node.style && ln.node.style.bold ? ' is-bold' : '')
      + (ln.node.style && ln.node.style.strike ? ' is-strike' : '')
      + (ln.node.notes ? ' has-notes' : '');
    $('.note-mark', n).title = ln.node.notes ? ln.node.notes.slice(0, 160) + (ln.node.notes.length > 160 ? '…' : '') : '';
    n.style.setProperty('--branch', ln.color || 'var(--accent)');
    const st = ln.node.style || {};
    n.style.background = st.bg || '';
    n.style.borderColor = st.bg || '';
    n.style.color = st.color || (st.bg ? contrastText(st.bg) : '');
    n.style.width = ln.w + 'px';
    // a custom width may exceed the CSS auto cap (max-width: 300px)
    n.style.maxWidth = Layout.clampWidth(ln.node.width) !== undefined ? 'none' : '';
    if (ln.id !== state.editingId) Marks.renderRuns($('.node-text', n), ln.node.text, ln.node.marks);
    $('.badge', n).textContent = ln.collapsed ? ln.hiddenCount : '';
  }

  /* ---------- selection ---------- */
  function select(id, { reveal = true } = {}) {
    if (id !== state.selectedId) {
      disarmStylebar();
      if (id && hoveredNodeId === id) armStylebarSoon();
    }
    if (state.selectedId && nodeEls.has(state.selectedId)) nodeEls.get(state.selectedId).classList.remove('selected');
    state.selectedId = id;
    const n = nodeEls.get(id);
    if (n) n.classList.add('selected');
    if (reveal && id) ensureVisible(id);
    updateStyleBar();
    renderNotesPane();
  }

  /* ---------- editing ---------- */
  function startEdit(id, replaceWith = null) {
    if (state.editingId) commitEdit();
    const found = findNode(state.map.root, id);
    const n = nodeEls.get(id);
    if (!found || !n) return;
    const txt = $('.node-text', n);
    select(id);
    state.editingId = id;
    state.editStartText = found.node.text;
    state.editSnapshot = snapshot();
    n.classList.add('editing');
    txt.contentEditable = 'true';
    txt.spellcheck = false;
    if (replaceWith !== null) {
      found.node.text = replaceWith;
      delete found.node.marks;                      // type-to-replace discards the old text and its marks
    }
    Marks.renderRuns(txt, found.node.text, found.node.marks);
    txt.focus();
    const range = document.createRange();
    range.selectNodeContents(txt);
    if (replaceWith !== null) range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    document.addEventListener('selectionchange', onEditSelectionChange);
    if (replaceWith !== null) relayout();
    updateStyleBar();
  }

  function commitEdit({ cancel = false } = {}) {
    const id = state.editingId;
    if (!id) return;
    const n = nodeEls.get(id);
    const txt = n ? $('.node-text', n) : null;
    const found = findNode(state.map.root, id);
    state.editingId = null;
    document.removeEventListener('selectionchange', onEditSelectionChange);
    if (n) { n.classList.remove('editing'); txt.contentEditable = 'false'; }
    if (!found) return;
    const { node, parent } = found;
    const snapNode = findNode(JSON.parse(state.editSnapshot), id);
    const before = snapNode ? snapNode.node : { text: state.editStartText };
    const raw = txt ? Marks.serializeDom(txt) : { text: node.text, marks: node.marks };
    let { text, marks } = Marks.remapWhitespace(raw.text, raw.marks);
    if (cancel) {                                   // dormant path: no trigger today, kept correct for a future cancel gesture
      text = before.text; marks = before.marks || [];
      if (before.style) node.style = { ...before.style }; else delete node.style;
    }
    const wasNew = state.newNodeId === id;
    state.newNodeId = null;

    if (text === '') {
      if (wasNew && parent && node.children.length === 0) {
        // discard the node: silently roll back its creation
        const snap = state.undo.pop();
        state.map.root = JSON.parse(snap);
        state.selectedId = parent.id;
        updateUndoButtons();
        persist();
        relayout();
        select(parent.id);
        return;
      }
      // empty fallback restores the previous text and its marks; node-level style changes from this session stay
      text = before.text || (parent ? 'Untitled' : 'Central idea');
      marks = text === before.text ? (before.marks || []) : [];
    }
    node.text = text;
    if (marks.length) node.marks = marks; else delete node.marks;
    if (txt) Marks.renderRuns(txt, text, node.marks);
    const changed = text !== before.text || JSON.stringify(node.marks || []) !== JSON.stringify(before.marks || []) || JSON.stringify(node.style || {}) !== JSON.stringify(before.style || {});
    if (changed) {
      if (!wasNew) pushUndo(state.editSnapshot);
      syncTitleFromRoot();
      persist();
    } else if (wasNew) {
      persist();
    }
    relayout();
  }

  function syncTitleFromRoot() {
    if (!state.map.titleCustom) {
      state.map.title = state.map.root.text;
      el.title.value = state.map.title;
      updateDocumentTitle(state.map.root.text);
    }
  }

  // Reads the source text, not state.map.title: the input handler coerces blanks to 'Untitled map'.
  function updateDocumentTitle(raw) {
    const t = (raw ?? '').trim();
    document.title = t ? `${t} · Mindmap` : 'Mindmap';
  }

  /* ---------- marks while editing: the selection decides between a range mark and the node-level style ---------- */
  function selectionOffsets(txt) {
    const sel = window.getSelection();
    const len = txt.textContent.length;
    if (!sel || !sel.rangeCount || !txt.contains(sel.anchorNode) || !txt.contains(sel.focusNode)) return { s: 0, e: 0, whole: false };
    const r = sel.getRangeAt(0);
    const pre = document.createRange();
    pre.selectNodeContents(txt);
    pre.setEnd(r.startContainer, r.startOffset);
    const s = pre.toString().length;
    const e = s + r.toString().length;
    return { s, e, whole: s === 0 && e === len && len > 0 };
  }
  function restoreSelection(txt, s, e) {
    const range = document.createRange();
    let acc = 0, startSet = false, endSet = false;
    const walk = node => {
      for (const ch of node.childNodes) {
        if (ch.nodeType === 3) {
          const end = acc + ch.length;
          if (!startSet && s <= end) { range.setStart(ch, s - acc); startSet = true; }
          if (!endSet && e <= end) { range.setEnd(ch, e - acc); endSet = true; return true; }
          acc = end;
        } else if (walk(ch)) return true;
      }
      return false;
    };
    if (!walk(txt)) { range.selectNodeContents(txt); if (!startSet) range.collapse(false); else range.setEnd(txt, txt.childNodes.length); }
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
  const MARK_KEY = { bold: 'b', italic: 'i', underline: 'u', strike: 'k' };
  /** key: bold | italic | underline | strike | color (value = '#hex' | ''). */
  function applyMarkAction(id, key, value) {
    const found = findNode(state.map.root, id);
    const n = nodeEls.get(id);
    if (!found || !n || state.editingId !== id) return;
    const txt = $('.node-text', n);
    const { text } = found.node;
    let { s, e, whole } = selectionOffsets(txt);
    // a whole-text selection whose inline mark already covers everything acts on that mark (toggle off / recolour) rather than the node layer
    const allFlags = whole ? Marks.flagsAt(found.node.marks, 0, text.length, text.length) : null;
    const inlineCoversAll = !!allFlags && (key === 'color' ? !!allFlags.c : allFlags[MARK_KEY[key]]);
    if ((s === e || whole) && !inlineCoversAll) {
      if (key === 'bold' || key === 'strike') { toggleStyle(id, key); return; }
      if (key === 'color') { setStyle(id, { color: value }); return; }
      s = 0; e = text.length;                       // italic / underline have no node-level form: mark the whole text
    }
    const marks = key === 'color'
      ? Marks.apply(found.node.marks, s, e, { c: value }, text.length)
      : Marks.toggle(found.node.marks, s, e, MARK_KEY[key], text.length);
    if (marks.length) found.node.marks = marks; else delete found.node.marks;
    const sel = selectionOffsets(txt);
    Marks.renderRuns(txt, text, found.node.marks);
    restoreSelection(txt, sel.s, sel.e);
    relayout();
    updateStyleBar();
  }

  el.nodes.addEventListener('input', e => {
    const txt = e.target.closest('.node-text');
    if (!txt || !state.editingId) return;
    const found = findNode(state.map.root, state.editingId);
    if (!found) return;
    if (e.inputType === 'historyUndo' || e.inputType === 'historyRedo') {
      // Chromium's history beforeinput is not cancelable: undo the replay by re-rendering the model as of the last real input
      Marks.renderRuns(txt, found.node.text, found.node.marks);
      restoreSelection(txt, found.node.text.length, found.node.text.length);
      return;
    }
    const { text, marks } = Marks.serializeDom(txt);   // the editor DOM is the source of truth while editing
    found.node.text = text;
    if (marks.length) found.node.marks = marks; else delete found.node.marks;
    if (!e.isComposing) canonicalizeEditor(txt, found.node);
    relayout();
    ensureVisible(state.editingId);
    renderNotesPane();
  });
  /** Browser typing-style spans / dropped markup are ignored by serializeDom — re-render so what is shown matches the model.
   *  Also re-renders when typing has moved a link boundary, so link styling tracks the text live. */
  function canonicalizeEditor(txt, node) {
    const foreign = [...txt.querySelectorAll('*')].some(x => !(x.tagName === 'SPAN' && x.classList.contains('m-run')));
    if (!foreign && !editorLinksStale(txt, node.text)) return;
    const { s, e } = selectionOffsets(txt);
    Marks.renderRuns(txt, node.text, node.marks);
    restoreSelection(txt, s, e);
  }
  function editorLinksStale(txt, text) {
    // a mark boundary inside a link splits it over several spans sharing one data-href — compare per link, not per span
    const dom = [];
    for (const a of txt.querySelectorAll('.m-a')) {
      const last = dom[dom.length - 1];
      if (last && last.href === a.dataset.href && last.el.nextSibling === a) { last.text += a.textContent; last.el = a; }
      else dom.push({ href: a.dataset.href, text: a.textContent, el: a });
    }
    const want = findLinks(text);
    return dom.length !== want.length || dom.some((d, i) => d.href !== want[i].href || d.text !== want[i].href);
  }
  // IME: the last input arrives while composing, so canonicalise once composition ends
  el.nodes.addEventListener('compositionend', e => {
    const txt = e.target.closest('.node-text[contenteditable="true"]');
    const found = txt && state.editingId && findNode(state.map.root, state.editingId);
    if (!found) return;
    const { text, marks } = Marks.serializeDom(txt);
    found.node.text = text;
    if (marks.length) found.node.marks = marks; else delete found.node.marks;
    canonicalizeEditor(txt, found.node);
    relayout();
  });
  // native undo/redo would replay detached run spans from earlier sessions into the editor — keep the browser history out of it
  el.nodes.addEventListener('beforeinput', e => {
    if (!state.editingId || !e.target.closest('.node-text[contenteditable="true"]')) return;
    if (e.inputType === 'historyUndo' || e.inputType === 'historyRedo') e.preventDefault();
  });
  /** Cmd/Ctrl+Z while editing: back to how the node looked when this edit began (text, marks, style), staying in edit mode. */
  function revertEditSession(id) {
    const found = findNode(state.map.root, id);
    const n = nodeEls.get(id);
    const snap = findNode(JSON.parse(state.editSnapshot), id);
    if (!found || !n || !snap) return;
    const txt = $('.node-text', n);
    found.node.text = snap.node.text;
    if (snap.node.marks) found.node.marks = snap.node.marks; else delete found.node.marks;
    if (snap.node.style) found.node.style = { ...snap.node.style }; else delete found.node.style;
    Marks.renderRuns(txt, found.node.text, found.node.marks);
    restoreSelection(txt, found.node.text.length, found.node.text.length);
    relayout();
    updateStyleBar();
  }
  el.nodes.addEventListener('paste', e => {
    if (!e.target.closest('.node-text[contenteditable="true"]')) return;
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\s+/g, ' ');
    document.execCommand('insertText', false, text);
  });
  el.nodes.addEventListener('focusout', e => {
    if (e.target.closest('.node-text') && state.editingId) commitEdit();
  });

  // keys while editing a node
  el.nodes.addEventListener('keydown', e => {
    const txt = e.target.closest('.node-text[contenteditable="true"]');
    if (!txt) return;
    const id = state.editingId;
    e.stopPropagation();
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      commitEdit();                                          // Enter only leaves edit mode
    } else if (e.key === 'Tab' || (e.key === 'Enter' && e.shiftKey)) {
      e.preventDefault();
      commitEdit();
      if (findNode(state.map.root, id)) { const n = addChild(id); startEdit(n.id); }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      commitEdit();
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault(); applyMarkAction(id, 'bold');
    } else if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === 'z' || e.key.toLowerCase() === 'y')) {
      e.preventDefault(); if (e.key.toLowerCase() === 'z' && !e.shiftKey) revertEditSession(id);   // redo: no-op
    } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'x') {
      e.preventDefault(); applyMarkAction(id, 'strike');
    } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
      e.preventDefault(); copyStyle(id);
    } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'v') {
      e.preventDefault(); pasteStyle(id);
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
      e.preventDefault(); applyMarkAction(id, 'italic');
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'u') {
      e.preventDefault(); applyMarkAction(id, 'underline');
    }
  });

  /* ---------- mutations ---------- */
  function chooseSide() {
    let l = 0, r = 0;
    for (const c of state.map.root.children) {
      const size = countNodes(c);
      if (c.side === 'L') l += size; else r += size;
    }
    return r <= l ? 'R' : 'L';
  }
  /** Least-used palette slot among first-level branches, so colors stay stable when branches move. */
  function pickColor() {
    const n = Layout.PALETTE.length;
    const used = new Array(n).fill(0);
    for (const c of state.map.root.children) if (c.color !== undefined) used[c.color % n]++;
    let best = 0;
    for (let i = 1; i < n; i++) if (used[i] < used[best]) best = i;
    return best;
  }
  function ensureBranchColors() {
    let changed = false;
    for (const c of state.map.root.children) if (c.color === undefined) { c.color = pickColor(); changed = true; }
    return changed;
  }
  function addChild(parentId, text = '') {
    const found = findNode(state.map.root, parentId);
    if (!found) return null;
    pushUndo();
    const n = makeNode(text);
    if (!found.parent) { n.side = chooseSide(); n.color = pickColor(); }
    found.node.collapsed = false;
    found.node.children.push(n);
    state.newNodeId = n.id;
    persist(); relayout(); select(n.id);
    return n;
  }
  function addSibling(id, before = false) {
    const found = findNode(state.map.root, id);
    if (!found) return null;
    if (!found.parent) return addChild(id);
    pushUndo();
    const n = makeNode('');
    if (found.depth === 1) { n.side = chooseSide(); n.color = pickColor(); } // keep the map balanced left/right
    found.parent.children.splice(before ? found.index : found.index + 1, 0, n);
    state.newNodeId = n.id;
    persist(); relayout(); select(n.id);
    return n;
  }
  function deleteNode(id) {
    const found = findNode(state.map.root, id);
    if (!found || !found.parent) return;
    pushUndo();
    const kids = found.parent.children;
    kids.splice(found.index, 1);
    const next = kids[found.index] || kids[found.index - 1] || found.parent;
    persist(); relayout(); select(next.id);
  }
  function toggleCollapse(id) {
    const found = findNode(state.map.root, id);
    if (!found || !found.node.children.length) return;
    found.node.collapsed = !found.node.collapsed;
    persist(); relayout(); select(id);
  }
  function copyNode(id) {
    const found = findNode(state.map.root, id);
    if (!found) return;
    const outline = outlineText(found.node);
    const at = Date.now();
    writeNodeClip(found.node, outline, at);                  // optimistic: outline recorded; no map change, no undo step
    const write = navigator.clipboard && navigator.clipboard.writeText
      ? navigator.clipboard.writeText(outline)
      : Promise.reject(new Error('clipboard API unavailable'));
    write.catch(() => {
      if (!nodeClipMem || nodeClipMem.at !== at) return;   // a newer copy already replaced this payload
      writeNodeClip(nodeClipMem.node, undefined, at);        // same sanitized subtree and `at`, minus the fingerprint
      showToast("Couldn't write to the system clipboard");
    });
  }
  /** One undoable append of already-sanitized clip nodes; selects the first. */
  function appendClipNodes(found, clipNodes) {
    pushUndo();
    const made = clipNodes.map(cloneWithNewIds);
    found.node.collapsed = false;
    for (const n of made) {
      if (!found.parent) { n.side = chooseSide(); n.color = pickColor(); }   // reads root.children: push one at a time so successive nodes balance
      found.node.children.push(n);
    }
    persist(); relayout(); select(made[0].id);
    return made;
  }
  function pasteNode(targetId) {
    const clip = readNodeClip();
    const found = findNode(state.map.root, targetId);
    if (!clip || !found) return;
    return appendClipNodes(found, [clip.node])[0];
  }
  function pasteText(targetId, roots) {
    const found = findNode(state.map.root, targetId);
    if (!found || !roots.length) return;
    if (countNodes({ children: roots }) - 1 > PASTE_NODE_LIMIT) { showToast(`Paste exceeds the ${PASTE_NODE_LIMIT}-node limit`); return; }   // synthetic parent, minus itself
    return appendClipNodes(found, roots);
  }
  function moveSibling(id, dir) {
    const found = findNode(state.map.root, id);
    if (!found || !found.parent) return;
    const kids = found.parent.children;
    // among first-level nodes only reorder within the same side
    let j = found.index + dir;
    while (found.depth === 1 && kids[j] && (kids[j].side || 'R') !== (found.node.side || 'R')) j += dir;
    if (j < 0 || j >= kids.length) return;
    pushUndo();
    kids.splice(found.index, 1);
    kids.splice(j, 0, found.node);
    persist(); relayout(); select(id);
  }
  function setSide(id, side) {
    const found = findNode(state.map.root, id);
    if (!found || found.depth !== 1 || found.node.side === side) return;
    pushUndo();
    found.node.side = side;
    persist(); relayout(); select(id);
  }

  /* ---------- inline marks: offset runs over node.text ---------- */
  // Run: { s, e, b?, i?, u?, k?, c? } — half-open [s, e) code-unit offsets; only truthy flags are stored.
  const MARK_FLAGS = ['b', 'i', 'u', 'k'];
  const MARK_CLASS = { b: 'm-b', i: 'm-i', u: 'm-u', k: 'm-k' };
  const HEX_COLOR = /^#[0-9a-f]{6}$/i;

  function markFlags(run) {
    const f = {};
    for (const k of MARK_FLAGS) if (run[k] === true) f[k] = true;
    if (typeof run.c === 'string' && HEX_COLOR.test(run.c)) f.c = run.c.toLowerCase();
    return f;
  }
  const sameFlags = (a, b) => MARK_FLAGS.every(k => !!a[k] === !!b[k]) && (a.c || '') === (b.c || '');
  const hasFlags = f => MARK_FLAGS.some(k => f[k]) || !!f.c;

  /** Sorted, disjoint, merged, in-range runs; anything malformed is dropped or clamped. Text is never touched. */
  function normalizeMarks(marks, len) {
    if (!Array.isArray(marks) || !Number.isFinite(len) || len <= 0) return [];
    // flatten to per-boundary events so overlapping runs resolve to disjoint segments with merged flags
    const cuts = new Set([0, len]);
    const runs = [];
    for (const r of marks) {
      if (!r || typeof r !== 'object') continue;
      const s = Math.max(0, Math.min(len, Math.floor(Number(r.s))));
      const e = Math.max(0, Math.min(len, Math.floor(Number(r.e))));
      if (!Number.isFinite(s) || !Number.isFinite(e) || s >= e) continue;
      const f = markFlags(r);
      if (!hasFlags(f)) continue;
      runs.push({ s, e, f });
      cuts.add(s); cuts.add(e);
    }
    if (!runs.length) return [];
    const bounds = [...cuts].sort((a, b) => a - b);
    const out = [];
    for (let i = 0; i < bounds.length - 1; i++) {
      const s = bounds[i], e = bounds[i + 1];
      const f = {};
      for (const r of runs) if (r.s <= s && r.e >= e) { for (const k of MARK_FLAGS) if (r.f[k]) f[k] = true; if (r.f.c) f.c = r.f.c; }  // later runs win on color
      if (!hasFlags(f)) continue;
      const prev = out[out.length - 1];
      if (prev && prev.e === s && sameFlags(prev, f)) prev.e = e; else out.push({ s, e, ...f });
    }
    return out;
  }

  /** Set (patch.b/i/u/k = true|false, patch.c = '#hex' | '') over [s, e). */
  function applyMarks(marks, s, e, patch, len) {
    const base = normalizeMarks(marks, len);
    s = Math.max(0, Math.min(len, s)); e = Math.max(0, Math.min(len, e));
    if (s >= e) return base;
    const out = [];
    for (const r of base) {                       // keep what lies outside [s, e)
      if (r.e <= s || r.s >= e) { out.push(r); continue; }
      if (r.s < s) out.push({ ...r, e: s });
      if (r.e > e) out.push({ ...r, s: e });
    }
    // rebuild the inside from the old coverage plus the patch
    const cuts = new Set([s, e]);
    for (const r of base) { if (r.s > s && r.s < e) cuts.add(r.s); if (r.e > s && r.e < e) cuts.add(r.e); }
    const bounds = [...cuts].sort((a, b) => a - b);
    for (let i = 0; i < bounds.length - 1; i++) {
      const a = bounds[i], b = bounds[i + 1];
      const cover = base.find(r => r.s <= a && r.e >= b);
      const f = cover ? markFlags(cover) : {};
      for (const k of MARK_FLAGS) if (k in patch) { if (patch[k]) f[k] = true; else delete f[k]; }
      if ('c' in patch) { if (patch.c && HEX_COLOR.test(patch.c)) f.c = patch.c.toLowerCase(); else delete f.c; }
      if (hasFlags(f)) out.push({ s: a, e: b, ...f });
    }
    return normalizeMarks(out, len);
  }

  /** Flags carried by every character of [s, e); c only when uniform. */
  function marksAt(marks, s, e, len) {
    const base = normalizeMarks(marks, len);
    const f = { b: false, i: false, u: false, k: false, c: '' };
    if (s >= e) return f;
    let covered = 0, color = null;
    const all = { b: true, i: true, u: true, k: true };
    for (const r of base) {
      const a = Math.max(r.s, s), b = Math.min(r.e, e);
      if (a >= b) continue;
      covered += b - a;
      for (const k of MARK_FLAGS) if (!r[k]) all[k] = false;
      color = color === null ? (r.c || '') : (color === (r.c || '') ? color : '');
    }
    if (covered !== e - s) return f;           // gaps carry nothing
    for (const k of MARK_FLAGS) f[k] = all[k];
    f.c = color || '';
    return f;
  }

  function toggleMarks(marks, s, e, key, len) {
    const on = marksAt(marks, s, e, len)[key];
    return applyMarks(marks, s, e, { [key]: !on }, len);
  }

  /** text.replace(/\s+/g, ' ').trim() with runs remapped through the removed characters. */
  function remapWhitespace(text, marks) {
    const base = normalizeMarks(marks, text.length);
    const map = new Array(text.length + 1);   // old offset → new offset
    let out = '', pendingSpace = false;
    for (let i = 0; i < text.length; i++) {
      if (/\s/.test(text[i])) { map[i] = out.length; if (out.length) pendingSpace = true; continue; }
      if (pendingSpace) { out += ' '; pendingSpace = false; }
      map[i] = out.length;
      out += text[i];
    }
    map[text.length] = out.length;
    // a removed char maps to where the next kept char lands, so runs never grow
    const remapped = base.map(r => ({ ...r, s: map[r.s], e: map[r.e] }));
    return { text: out, marks: normalizeMarks(remapped, out.length) };
  }

  /** Project (text, marks) into a container as text nodes and <span class="m-*"> runs — DOM APIs only, never innerHTML.
   *  Links derived from the text split the runs too (class m-a + data-href); the hover hint is off inside a contenteditable. */
  function renderRuns(container, text, marks, { linkHints = !container.isContentEditable } = {}) {
    text = typeof text === 'string' ? text : '';
    const runs = normalizeMarks(marks, text.length);
    const links = findLinks(text);
    if (!runs.length && !links.length) { container.replaceChildren(document.createTextNode(text)); return; }
    const cuts = new Set([0, text.length]);
    for (const r of runs) { cuts.add(r.s); cuts.add(r.e); }
    for (const l of links) { cuts.add(l.s); cuts.add(l.e); }
    const bounds = [...cuts].sort((a, b) => a - b);
    const nodes = [];
    for (let i = 0; i < bounds.length - 1; i++) {
      const s = bounds[i], e = bounds[i + 1];
      const run = runs.find(r => r.s <= s && r.e >= e);
      const link = links.find(l => l.s <= s && l.e >= e);
      if (!run && !link) { nodes.push(document.createTextNode(text.slice(s, e))); continue; }
      const span = document.createElement('span');
      const cls = ['m-run'];
      if (run) for (const k of MARK_FLAGS) if (run[k]) cls.push(MARK_CLASS[k]);
      if (link) {
        cls.push('m-a');
        span.dataset.href = link.href;
        if (linkHints) span.title = `${MOD}+click to open link`;
      }
      span.className = cls.join(' ');
      if (run && run.c) span.style.color = run.c;
      span.textContent = text.slice(s, e);
      nodes.push(span);
    }
    container.replaceChildren(...nodes);
  }

  /** Inverse of renderRuns over a (possibly browser-mutated) contenteditable: flags come only from our m-* classes / validated color. */
  function serializeDom(container) {
    let text = '';
    const marks = [];
    const BLOCK = /^(BR|DIV|P|LI)$/;
    const flagsOf = node => {
      const f = {};
      for (let n = node.parentNode; n && n !== container; n = n.parentNode) {
        if (n.nodeType !== 1) continue;
        for (const k of MARK_FLAGS) if (n.classList.contains(MARK_CLASS[k])) f[k] = true;
        // color only from spans we rendered — browser typing-style spans and foreign markup contribute plain text
        const c = n.classList.contains('m-run') && n.style && n.style.color;
        if (c && !f.c) { const hex = cssColorToHex(c); if (hex) f.c = hex; }
      }
      return f;
    };
    const walk = node => {
      for (const ch of node.childNodes) {
        if (ch.nodeType === 3) {
          const s = text.length;
          text += ch.nodeValue.replace(/\n/g, ' ');
          const f = flagsOf(ch);
          if (hasFlags(f) && text.length > s) marks.push({ s, e: text.length, ...f });
        } else if (ch.nodeType === 1) {
          if (BLOCK.test(ch.tagName) && text && !text.endsWith(' ')) text += ' ';
          walk(ch);
        }
      }
    };
    walk(container);
    return { text, marks: normalizeMarks(marks, text.length) };
  }

  /** '#rrggbb' or 'rgb(r, g, b)' (what the DOM hands back) → lowercase hex; anything else → ''. */
  function cssColorToHex(c) {
    if (HEX_COLOR.test(c)) return c.toLowerCase();
    const m = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.exec(c);
    if (!m) return '';
    return '#' + [m[1], m[2], m[3]].map(v => Math.min(255, +v).toString(16).padStart(2, '0')).join('');
  }

  const Marks = { normalize: normalizeMarks, apply: applyMarks, toggle: toggleMarks, flagsAt: marksAt, remapWhitespace, renderRuns, serializeDom };
  window.Marks = Marks;

  /* ---------- links: http(s) URLs derived from node.text on every render, never stored ---------- */
  const URL_RUN = /https?:\/\/\S+/g;
  const TRAIL_PUNCT = /[.,;:!?)\]}'"]$/;
  const CLOSER_OPENER = { ')': '(', ']': '[', '}': '{' };

  /** Sorted, disjoint [{ s, e, href }] where href === text.slice(s, e); [] when the text carries no link. */
  function findLinks(text) {
    if (typeof text !== 'string' || !text) return [];
    const out = [];
    for (const m of text.matchAll(URL_RUN)) {
      let run = m[0];
      // trim trailing closing punctuation, keeping a bracket that closes an opener inside the URL
      while (TRAIL_PUNCT.test(run)) {
        const last = run[run.length - 1];
        const opener = CLOSER_OPENER[last];
        if (opener) {
          const body = run.slice(0, -1);
          const opens = body.split(opener).length - 1, closes = body.split(last).length - 1;
          if (opens > closes) break;
        }
        run = run.slice(0, -1);
      }
      if (!/^https?:\/\/./.test(run)) continue;      // bare scheme is ordinary text
      out.push({ s: m.index, e: m.index + run.length, href: run });
    }
    return out;
  }

  const Links = { find: findLinks };
  window.Links = Links;

  /* ---------- per-node style ---------- */
  // One palette for both style-bar pickers (fill and text) so they cannot drift apart.
  const PALETTE = Object.freeze(['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#a855f7', '#ec4899', '#94a3b8', '#ffffff', '#0f172a']);
  const STYLE_CLIP_KEY = 'mindmap.styleClipboard';

  // Relative luminance 0–255 of '#rrggbb' or 'rgb(r, g, b)'; NaN when unparseable.
  function luminance(color) {
    let r, g, b;
    const hex = /^#?([0-9a-f]{6})$/i.exec(color);
    const rgb = /^rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/i.exec(color);
    if (hex) { const v = parseInt(hex[1], 16); r = (v >> 16) & 255; g = (v >> 8) & 255; b = v & 255; }
    else if (rgb) { r = +rgb[1]; g = +rgb[2]; b = +rgb[3]; }
    else return NaN;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  function contrastText(hex) {
    const lum = luminance(hex);
    if (Number.isNaN(lum)) return '';
    return lum > 150 ? '#0f172a' : '#ffffff';
  }
  function getStyle(id) {
    const f = findNode(state.map.root, id);
    return f ? (f.node.style || {}) : {};
  }
  function setStyle(id, patch) {
    const f = findNode(state.map.root, id);
    if (!f) return;
    if (state.editingId !== id) pushUndo();          // while editing, the edit's snapshot covers the change (one undo step per session)
    const next = { ...(f.node.style || {}), ...patch };
    for (const k of Object.keys(next)) if (next[k] === undefined || next[k] === false || next[k] === null || next[k] === '') delete next[k];
    if (Object.keys(next).length) f.node.style = next; else delete f.node.style;
    persist(); relayout(); updateStyleBar();
  }
  function toggleStyle(id, key) { setStyle(id, { [key]: !getStyle(id)[key] }); }
  function clearStyle(id) { if (Object.keys(getStyle(id)).length) setStyle(id, { bg: '', color: '', bold: false, strike: false }); }
  function styleClipboard() { try { return JSON.parse(localStorage.getItem(STYLE_CLIP_KEY)); } catch (e) { return null; } }
  function copyStyle(id) {
    if (!findNode(state.map.root, id)) return;
    localStorage.setItem(STYLE_CLIP_KEY, JSON.stringify(getStyle(id)));
    updateStyleBar();
    flashStyleBtn('copy');
  }
  function pasteStyle(id) {
    const clip = styleClipboard();
    if (!clip || !findNode(state.map.root, id)) return;
    const f = findNode(state.map.root, id);
    if (state.editingId !== id) pushUndo();
    if (Object.keys(clip).length) f.node.style = { ...clip }; else delete f.node.style;
    persist(); relayout(); updateStyleBar();
    flashStyleBtn('paste');
  }
  function flashStyleBtn(name) {
    const b = $(`[data-sb="${name}"]`, el.stylebar);
    b.classList.add('flash');
    setTimeout(() => b.classList.remove('flash'), 350);
  }

  /* ---------- node clipboard: one sanitized subtree, shared across maps via localStorage ---------- */
  const NODE_CLIP_KEY = 'mindmap.nodeClipboard';
  let nodeClipMem = null;   // session fallback when the localStorage write fails

  /** Whitelist copy: portable fields only — ids are minted at paste, side/color/collapsed derive from the paste position. */
  function sanitizeSubtree(node) {
    const out = { text: typeof node.text === 'string' ? node.text : '', children: (node.children || []).map(sanitizeSubtree) };
    if (node.style && typeof node.style === 'object') out.style = { ...node.style };
    const marks = Marks.normalize(node.marks, out.text.length);
    if (marks.length) out.marks = marks;
    if (typeof node.notes === 'string' && node.notes) out.notes = node.notes;
    if (Number.isFinite(node.width)) out.width = node.width;
    return out;
  }
  function isValidMarks(marks) {
    return Array.isArray(marks) && marks.every(r => r && typeof r === 'object'
      && Number.isInteger(r.s) && Number.isInteger(r.e) && r.s >= 0 && r.s < r.e
      && ['b', 'i', 'u', 'k'].every(k => r[k] === undefined || r[k] === true)
      && (r.c === undefined || (typeof r.c === 'string' && /^#[0-9a-f]{6}$/i.test(r.c))));
  }
  function isValidClipNode(n) {
    if (!n || typeof n !== 'object' || typeof n.text !== 'string' || !Array.isArray(n.children)) return false;
    if (n.style !== undefined && (!n.style || typeof n.style !== 'object')) return false;
    if (n.marks !== undefined && !isValidMarks(n.marks)) return false;
    if (n.notes !== undefined && typeof n.notes !== 'string') return false;
    if (n.width !== undefined && !Number.isFinite(n.width)) return false;
    return n.children.every(isValidClipNode);
  }
  function isValidClipPayload(p) {
    return !!p && p.v === 1 && Number.isFinite(p.at) && isValidClipNode(p.node)
      && (p.outline === undefined || typeof p.outline === 'string');
  }
  function writeNodeClip(node, outline, at = Date.now()) {
    const payload = { v: 1, at, node: sanitizeSubtree(node) };
    if (typeof outline === 'string') payload.outline = outline;   // absent = system clipboard write failed (or pre-upgrade payload)
    nodeClipMem = payload;
    try { localStorage.setItem(NODE_CLIP_KEY, JSON.stringify(payload)); } catch (e) { /* quota / disabled storage: memory copy serves this session */ }
  }
  function readNodeClip() {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem(NODE_CLIP_KEY)); } catch (e) { stored = null; }
    if (!isValidClipPayload(stored)) stored = null;
    const mem = isValidClipPayload(nodeClipMem) ? nodeClipMem : null;
    if (stored && mem) return stored.at >= mem.at ? stored : mem;   // newest wins across tabs and failed writes
    return stored || mem;
  }

  /* ---------- plain-text outline: system clipboard interchange ---------- */
  const OUTLINE_INDENT = '    ';   // 4 spaces per level, never tabs
  const PASTE_NODE_LIMIT = 1000;

  /** Visible subtree as text — collapsed nodes keep their line and drop their descendants. */
  function outlineText(node) {
    const out = [];
    (function walk(n, depth) {
      out.push(OUTLINE_INDENT.repeat(depth) + n.text);
      if (!n.collapsed) for (const c of n.children || []) walk(c, depth + 1);
    })(node, 0);
    return out.join('\n');
  }
  function normalizeEol(s) { return s.replace(/\r\n?/g, '\n'); }
  /** Indented text → ClipNode[] (text + children only). Unit = smallest leading-space run; tab = one level. */
  function parseOutline(text) {
    const lines = normalizeEol(text).split('\n')
      .map(raw => { const m = /^([ \t]*)(.*)$/.exec(raw); return { ws: m[1], body: m[2].trim() }; })
      .filter(l => l.body);
    const spaceRuns = lines.map(l => l.ws.replace(/\t/g, '').length).filter(n => n > 0);
    const unit = spaceRuns.length ? Math.min(...spaceRuns) : Infinity;
    const roots = [], stack = [];   // stack: [{ level, node }] — the open ancestor chain
    for (const l of lines) {
      const tabs = (l.ws.match(/\t/g) || []).length;
      const spaces = l.ws.length - tabs;
      let level = tabs + (unit === Infinity ? 0 : Math.floor(spaces / unit));
      const prev = stack.length ? stack[stack.length - 1].level : -1;
      if (level > prev + 1) level = prev + 1;   // over-deep jump: at most one level below the previous line
      while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
      const node = { text: l.body.replace(/\s+/g, ' '), children: [] };
      (stack.length ? stack[stack.length - 1].node.children : roots).push(node);
      stack.push({ level, node });
    }
    return roots;
  }

  /* ---------- toast: transient, non-interactive status line ---------- */
  let toastEl = null, toastTimer = 0;
  function showToast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2500);
  }

  /* ---------- style bar: show only after the pointer dwells on the selected node ---------- */
  const STYLEBAR_DWELL_MS = 500;    // pointer must be perfectly still on the selected node this long
  const STYLEBAR_GRACE_MS = 300;    // time allowed to cross the gap from the node into the bar
  let hoveredNodeId = null;
  let stylebarArmed = false;
  let armTimer = null;
  let hideTimer = null;

  function armStylebarSoon() {
    clearTimeout(armTimer);
    armTimer = setTimeout(() => {
      if (hoveredNodeId === state.selectedId && !stylebarArmed) { stylebarArmed = true; updateStyleBar(); }
    }, STYLEBAR_DWELL_MS);
  }
  function disarmStylebar() {
    clearTimeout(armTimer);
    clearTimeout(hideTimer);
    if (stylebarArmed) { stylebarArmed = false; closeStylePop(); updateStyleBar(); }
  }
  function scheduleStylebarHide() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (hoveredNodeId === state.selectedId || el.stylebar.matches(':hover') || !el.sbPop.hidden) return;
      disarmStylebar();
    }, STYLEBAR_GRACE_MS);
  }
  el.nodes.addEventListener('mouseover', e => {
    const n = e.target.closest('.node');
    if (!n || n.dataset.id === hoveredNodeId) return;
    hoveredNodeId = n.dataset.id;
    if (hoveredNodeId === state.selectedId) {
      clearTimeout(hideTimer);
      if (!stylebarArmed) armStylebarSoon();
    }
  });
  // any movement restarts the stillness clock
  el.nodes.addEventListener('mousemove', e => {
    if (stylebarArmed || hoveredNodeId !== state.selectedId) return;
    const n = e.target.closest('.node');
    if (n && n.dataset.id === state.selectedId) armStylebarSoon();
  });
  el.nodes.addEventListener('mouseout', e => {
    const n = e.target.closest('.node');
    if (!n || (e.relatedTarget && n.contains(e.relatedTarget))) return;
    if (hoveredNodeId === n.dataset.id) hoveredNodeId = null;
    clearTimeout(armTimer);
    if (stylebarArmed) scheduleStylebarHide();
  });
  el.stylebar.addEventListener('mouseenter', () => clearTimeout(hideTimer));
  el.stylebar.addEventListener('mouseleave', () => { if (stylebarArmed) scheduleStylebarHide(); });

  function updateStyleBar() {
    const id = state.selectedId;
    const ln = state.layout && id ? state.layout.byId.get(id) : null;
    const editing = !!ln && state.editingId === id;
    const show = !!ln && (editing || (stylebarArmed && !state.editingId)) && !(nodeDrag && nodeDrag.active) && !el.editor.hidden;
    el.stylebar.hidden = !show;
    $('[data-sb="italic"]', el.stylebar).hidden = !editing;
    $('[data-sb="underline"]', el.stylebar).hidden = !editing;
    if (!show) { closeStylePop(); return; }
    const st = ln.node.style || {};
    const ef = editingFlags();                       // selection-aware flags while editing, null otherwise
    const r = viewportRect();
    const v = state.view;
    const p = pos.get(id);
    const cx = r.width / 2 + v.x + p.x * v.z;
    const top = r.height / 2 + v.y + (p.y - ln.h / 2) * v.z;
    const bw = el.stylebar.offsetWidth, bh = el.stylebar.offsetHeight;
    const left = clamp(cx - bw / 2, 8, r.width - bw - 8);
    let y = top - bh - 12;
    if (y < 8) y = r.height / 2 + v.y + (p.y + ln.h / 2) * v.z + 12;
    el.stylebar.style.transform = `translate(${Math.round(left)}px, ${Math.round(y)}px)`;
    el.stylebar.classList.toggle('below', y > top);
    const color = ef && (ef.partial || ef.c) ? ef.c : (st.color || '');
    $('#sb-bg-swatch').style.background = st.bg || 'transparent';
    $('#sb-bg-swatch').classList.toggle('none', !st.bg);
    $('#sb-color-swatch').style.color = color;
    $('#sb-color-swatch').style.textDecorationColor = color || 'var(--muted)';
    // Computed bar background, not the theme: tactical maps both themes to one palette.
    const barLum = luminance(getComputedStyle(el.stylebar).backgroundColor);
    const lowContrast = !!color && Math.abs(luminance(color) - barLum) < 48;
    $('#sb-color-swatch').classList.toggle('low-contrast', lowContrast);
    $('[data-sb="bold"]', el.stylebar).classList.toggle('active', !!st.bold || !!(ef && ef.b));
    $('[data-sb="strike"]', el.stylebar).classList.toggle('active', !!st.strike || !!(ef && ef.k));
    $('[data-sb="italic"]', el.stylebar).classList.toggle('active', !!(ef && ef.i));
    $('[data-sb="underline"]', el.stylebar).classList.toggle('active', !!(ef && ef.u));
    $('[data-sb="paste"]', el.stylebar).disabled = !styleClipboard();
    $('[data-sb="clear"]', el.stylebar).disabled = !Object.keys(st).length;
  }
  /** Marks carried by the whole current selection of the node being edited; partial = a real range short of the whole text. */
  function editingFlags() {
    const id = state.editingId;
    const n = id && nodeEls.get(id);
    const found = id && findNode(state.map.root, id);
    if (!n || !found) return null;
    const txt = $('.node-text', n);
    const { s, e, whole } = selectionOffsets(txt);
    const partial = s < e && !whole;
    return { ...Marks.flagsAt(found.node.marks, s, e, found.node.text.length), partial };
  }
  function onEditSelectionChange() { if (state.editingId) updateStyleBar(); }
  function closeStylePop() {
    el.sbPop.hidden = true;
    $$('.sb-btn.open', el.stylebar).forEach(b => b.classList.remove('open'));
    if (stylebarArmed && hoveredNodeId !== state.selectedId && !el.stylebar.matches(':hover')) scheduleStylebarHide();
  }
  function openStylePop(kind) {
    const id = state.selectedId;
    const st = getStyle(id);
    const ef = kind === 'color' ? editingFlags() : null;
    const swatches = PALETTE;
    const current = kind === 'bg' ? st.bg : (ef && (ef.partial || ef.c) ? ef.c : st.color);
    el.sbPop.innerHTML = `<div class="sb-pop-title">${kind === 'bg' ? 'Fill' : 'Text'}</div><div class="sb-swatches">`
      + `<button class="sb-sw none${current ? '' : ' current'}" data-value="" title="Default"></button>`
      + swatches.map(c => `<button class="sb-sw${current === c ? ' current' : ''}" data-value="${c}" style="background:${c}" title="${c}"></button>`).join('')
      + '</div>';
    el.sbPop.dataset.kind = kind;
    el.sbPop.hidden = false;
    $$('.sb-btn.open', el.stylebar).forEach(b => b.classList.remove('open'));
    $(`[data-sb="${kind}"]`, el.stylebar).classList.add('open');
  }
  el.stylebar.addEventListener('click', e => {
    const sw = e.target.closest('.sb-sw');
    const editing = state.editingId && state.editingId === state.selectedId;
    if (sw) {
      if (editing && el.sbPop.dataset.kind === 'color') applyMarkAction(state.selectedId, 'color', sw.dataset.value);
      else setStyle(state.selectedId, { [el.sbPop.dataset.kind]: sw.dataset.value });
      closeStylePop();
      return;
    }
    const b = e.target.closest('.sb-btn');
    if (!b) return;
    const id = state.selectedId;
    switch (b.dataset.sb) {
      case 'bg': case 'color':
        if (b.classList.contains('open')) closeStylePop(); else openStylePop(b.dataset.sb);
        break;
      case 'bold': if (editing) applyMarkAction(id, 'bold'); else toggleStyle(id, 'bold'); break;
      case 'strike': if (editing) applyMarkAction(id, 'strike'); else toggleStyle(id, 'strike'); break;
      case 'italic': if (editing) applyMarkAction(id, 'italic'); break;
      case 'underline': if (editing) applyMarkAction(id, 'underline'); break;
      case 'copy': copyStyle(id); break;
      case 'paste': pasteStyle(id); break;
      case 'clear': clearStyle(id); break;
    }
  });
  // keep the bar from stealing keyboard focus from the canvas
  el.stylebar.addEventListener('mousedown', e => e.preventDefault());

  /* ---------- notes ---------- */
  const NOTES_PANE_KEY = 'mindmap.notesPane';
  let notesSnapshot = null;
  let notesDirty = false;

  function autosize(ta) {
    if (ta.closest('.notes-pane')) return; // the standard pane's text area fills the pane via flex
    ta.style.height = 'auto';
    ta.style.height = Math.max(160, ta.scrollHeight + 2) + 'px';
  }
  function setNotesPaneOpen(open, { focus = true } = {}) {
    if (!el.notesPane) {
      // No pane in this front-end (tactical): focus whatever notes box the page renders for the node.
      const ta = open && $('.notes-input');
      if (ta && focus) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
      return;
    }
    const before = viewportRect().width;
    el.notesPane.hidden = !open;
    localStorage.setItem(NOTES_PANE_KEY, open ? '1' : '0');
    if (el.notesBtn) el.notesBtn.classList.toggle('active', open);
    renderNotesPane({ force: true });
    // the canvas is centered on the viewport, so keep the map where it was on screen
    if (state.map) { state.view.x -= (viewportRect().width - before) / 2; applyView(); }
    if (open && focus) {
      const ta = $('#notes-input');
      if (ta && !$('#notes-content').hidden) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
    }
  }
  function renderNotesPane({ force = false } = {}) {
    if (!el.notesPane || el.notesPane.hidden || !state.map) return;
    const f = state.selectedId ? findNode(state.map.root, state.selectedId) : null;
    $('#notes-empty').hidden = !!f;
    $('#notes-content').hidden = !f;
    if (!f) return;
    const ta = $('#notes-input');
    $('#notes-node').textContent = f.node.text || 'Untitled';
    const kids = f.node.children.length;
    $('#notes-meta').textContent = (f.parent ? `Depth ${f.depth}` : 'Central node') + ` · ${kids} child${kids === 1 ? '' : 'ren'}`;
    const notes = f.node.notes || '';
    const focused = document.activeElement === ta && ta.dataset.id === f.node.id;
    if (!focused || force) {
      if (ta.value !== notes) ta.value = notes;
      ta.dataset.id = f.node.id;
      autosize(ta);
    }
    $('#notes-count').textContent = notes.length ? `${notes.length} character${notes.length === 1 ? '' : 's'}` : 'No notes yet';
  }
  function setNodeNotes(id, value) {
    const f = findNode(state.map.root, id);
    if (!f) return;
    if (!notesDirty) { pushUndo(notesSnapshot || snapshot()); notesDirty = true; }
    if (value.trim()) f.node.notes = value; else delete f.node.notes;
    const n = nodeEls.get(id);
    if (n) {
      n.classList.toggle('has-notes', !!f.node.notes);
      $('.note-mark', n).title = f.node.notes ? f.node.notes.slice(0, 160) + (f.node.notes.length > 160 ? '…' : '') : '';
    }
    persist();
    const c = $('#notes-count');
    if (c) c.textContent = value.length ? `${value.length} character${value.length === 1 ? '' : 's'}` : 'No notes yet';
  }
  // Any textarea.notes-input on the page (standard pane or tactical panel) edits the node named by data-id.
  document.addEventListener('focusin', e => {
    if (!e.target.classList || !e.target.classList.contains('notes-input')) return;
    notesSnapshot = state.map ? snapshot() : null;
    notesDirty = false;
  });
  document.addEventListener('input', e => {
    const ta = e.target;
    if (!ta.classList || !ta.classList.contains('notes-input') || !state.map) return;
    autosize(ta);
    setNodeNotes(ta.dataset.id || state.selectedId, ta.value);
  });
  document.addEventListener('keydown', e => {
    const ta = e.target;
    if (!ta.classList || !ta.classList.contains('notes-input')) return;
    if (e.key === 'Escape' || ((e.metaKey || e.ctrlKey) && e.key === 'Enter')) { e.preventDefault(); ta.blur(); }
  });
  if (el.notesBtn) el.notesBtn.addEventListener('click', () => setNotesPaneOpen(el.notesPane.hidden));
  const notesClose = $('#notes-close');
  if (notesClose) notesClose.addEventListener('click', () => setNotesPaneOpen(false));

  /* ---------- navigation ---------- */
  function nearestVertical(id, dir) {
    const L = state.layout, cur = L.byId.get(id);
    if (cur.parent) {
      // siblings share a column; root children only count on their own side
      const column = cur.parent.children.filter(c => c.side === cur.side);
      const adjacent = column[column.indexOf(cur) + dir];
      if (adjacent) return adjacent;
    }
    let best = null, bestScore = Infinity;
    for (const ln of L.nodes) {
      if (ln === cur || (cur.side && ln.side !== cur.side)) continue;
      const dy = ln.y - cur.y;
      if (dir < 0 ? dy > -1 : dy < 1) continue;
      const score = Math.abs(dy) + Math.abs(ln.x - cur.x) * 2.2 + (ln.depth !== cur.depth ? 60 : 0);
      if (score < bestScore) { best = ln; bestScore = score; }
    }
    return best;
  }
  function closestInY(kids, y) {
    let best = null, d = Infinity;
    for (const k of kids) { const dd = Math.abs(k.y - y); if (dd < d) { d = dd; best = k; } }
    return best;
  }
  function navHorizontal(id, dir) {
    const ln = state.layout.byId.get(id);
    if (!ln.parent) return closestInY(ln.children.filter(c => (c.side === 'L' ? -1 : 1) === dir), ln.y);
    const nodeDir = ln.side === 'L' ? -1 : 1;
    return dir === nodeDir ? closestInY(ln.children, ln.y) : ln.parent;
  }

  /* ---------- view: pan / zoom ---------- */
  function viewportRect() { return el.viewport.getBoundingClientRect(); }
  function applyView(smooth = false) {
    const { x, y, z } = state.view;
    el.world.classList.toggle('smooth', smooth);
    el.world.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${z})`;
    const r = viewportRect();
    el.viewport.style.backgroundPosition = `${r.width / 2 + x}px ${r.height / 2 + y}px`;
    el.viewport.style.backgroundSize = `${24 * z}px ${24 * z}px`;
    el.zoomLabel.textContent = Math.round(z * 100) + '%';
    persistView();
    updateStyleBar();
  }
  function zoomAt(factor, sx, sy, smooth = false) {
    const r = viewportRect();
    const cx = r.width / 2, cy = r.height / 2;
    if (sx === undefined) { sx = cx; sy = cy; }
    const v = state.view;
    const z2 = clamp(v.z * factor, 0.2, 3);
    const wx = (sx - cx - v.x) / v.z, wy = (sy - cy - v.y) / v.z;
    v.x = sx - cx - wx * z2;
    v.y = sy - cy - wy * z2;
    v.z = z2;
    applyView(smooth);
  }
  function fitView(smooth = true) {
    if (!state.layout) return;
    const b = state.layout.bounds;
    const r = viewportRect();
    const bw = b.maxX - b.minX, bh = b.maxY - b.minY;
    const z = clamp(Math.min((r.width - 120) / bw, (r.height - 140) / bh), 0.2, 1);
    state.view.z = z;
    state.view.x = -((b.minX + b.maxX) / 2) * z;
    state.view.y = -((b.minY + b.maxY) / 2) * z;
    applyView(smooth);
  }
  function ensureVisible(id) {
    const ln = state.layout && state.layout.byId.get(id);
    if (!ln) return;
    const r = viewportRect();
    const v = state.view;
    const cx = r.width / 2, cy = r.height / 2;
    const left = cx + v.x + (ln.x - ln.w / 2) * v.z, right = left + ln.w * v.z;
    const top = cy + v.y + (ln.y - ln.h / 2) * v.z, bottom = top + ln.h * v.z;
    const m = 60;
    let dx = 0, dy = 0;
    if (left < m) dx = m - left; else if (right > r.width - m) dx = r.width - m - right;
    if (top < m) dy = m - top; else if (bottom > r.height - m - 50) dy = r.height - m - 50 - bottom;
    if (dx || dy) { v.x += dx; v.y += dy; applyView(true); }
  }

  el.viewport.addEventListener('wheel', e => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const r = viewportRect();
      zoomAt(Math.exp(-e.deltaY * 0.01), e.clientX - r.left, e.clientY - r.top);
    } else {
      state.view.x -= e.deltaX;
      state.view.y -= e.deltaY;
      applyView();
    }
  }, { passive: false });

  // pointer: pan on background, select on node, drag a node to reparent it
  let drag = null;       // background pan
  let nodeDrag = null;   // { id, x, y, active, ghost, targetId, subtree:Set }
  let resizeDrag = null;    // { id, edge, startX, startW, live, moved, el }
  let pendingLink = null;   // { href, x, y } armed by a modifier+pointerdown on a link, consumed by the matching pointerup
  let lastLinkOpen = { href: '', t: -Infinity };
  const DBLCLICK_MS = 500;  // a modifier double-click arms twice; the second release must not open a second tab
  const isModClick = e => e.button === 0 && (IS_MAC ? e.metaKey : e.ctrlKey);
  // body.mod-held drives the pointer cursor over links while the platform modifier is down
  const setModHeld = on => document.body.classList.toggle('mod-held', on);
  const onModKey = e => setModHeld(IS_MAC ? e.metaKey : e.ctrlKey);
  document.addEventListener('keydown', onModKey);
  document.addEventListener('keyup', onModKey);
  window.addEventListener('blur', () => setModHeld(false));
  document.addEventListener('visibilitychange', () => { if (document.hidden) setModHeld(false); });
  let lastHandleTap = null; // { id, edge, t } — double-tap/click reset detection
  const RESIZE_TAP_MS = 300;
  const DRAG_THRESHOLD = 6;

  function subtreeIds(id) {
    const ids = new Set();
    (function walk(ln) { ids.add(ln.id); ln.children.forEach(walk); })(state.layout.byId.get(id));
    return ids;
  }
  function beginNodeDrag(e) {
    const ln = state.layout.byId.get(nodeDrag.id);
    nodeDrag.active = true;
    nodeDrag.subtree = subtreeIds(nodeDrag.id);
    nodeDrag.subtree.forEach(id => nodeEls.get(id).classList.add('dragging'));
    const ghost = document.createElement('div');
    ghost.className = 'drag-ghost';
    ghost.style.setProperty('--branch', ln.color || 'var(--accent)');
    const extra = nodeDrag.subtree.size - 1;
    ghost.innerHTML = `<span class="ghost-text">${escapeHTML(ln.node.text || 'Untitled')}</span>${extra ? `<span class="ghost-count">+${extra}</span>` : ''}`;
    document.body.appendChild(ghost);
    nodeDrag.ghost = ghost;
    el.viewport.classList.add('dragging');
    updateStyleBar();
    moveNodeDrag(e);
  }
  // Returns { id, zone } where zone is 'before' | 'after' (insert beside the target) or 'onto' (nest under it).
  function dropTargetAt(x, y) {
    const hit = document.elementFromPoint(x, y);
    const n = hit && hit.closest('.node');
    if (!n) return null;
    const id = n.dataset.id;
    if (nodeDrag.subtree.has(id)) return null;               // itself or its own descendants
    const target = state.layout.byId.get(id);
    const dragged = state.layout.byId.get(nodeDrag.id);
    let zone = 'onto';
    if (target.parent) {                                     // the root has no peers
      const r = n.getBoundingClientRect();
      const rel = (y - r.top) / r.height;
      if (rel < 0.3) zone = 'before'; else if (rel > 0.7) zone = 'after';
    }
    if (zone === 'onto' && dragged.parent && dragged.parent.id === id) return null; // already its child
    return { id, zone };
  }
  let dropLine = null;
  function showDropLine(t) {
    if (!dropLine) {
      dropLine = document.createElement('div');
      dropLine.className = 'drop-line';
      el.nodes.appendChild(dropLine);
    }
    const ln = state.layout.byId.get(t.id);
    const p = pos.get(t.id);
    const y = t.zone === 'before' ? p.y - ln.h / 2 - Layout.V_GAP / 2 : p.y + ln.h / 2 + Layout.V_GAP / 2;
    dropLine.style.width = ln.w + 'px';
    dropLine.style.transform = `translate3d(${p.x - ln.w / 2}px, ${y - 1.5}px, 0)`;
    dropLine.classList.toggle('side-L', ln.side === 'L');
    dropLine.hidden = false;
  }
  function hideDropLine() { if (dropLine) dropLine.hidden = true; }
  function clearDropHighlight() {
    const t = nodeDrag && nodeDrag.target;
    if (t && nodeEls.has(t.id)) nodeEls.get(t.id).classList.remove('drop-target');
    hideDropLine();
  }
  function moveNodeDrag(e) {
    nodeDrag.ghost.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 12}px)`;
    const target = dropTargetAt(e.clientX, e.clientY);
    const key = target ? `${target.id}:${target.zone}` : null;
    if (key !== nodeDrag.targetKey) {
      clearDropHighlight();
      nodeDrag.target = target;
      nodeDrag.targetKey = key;
      if (target) {
        if (target.zone === 'onto') nodeEls.get(target.id).classList.add('drop-target');
        else showDropLine(target);
      }
    }
    nodeDrag.ghost.classList.toggle('can-drop', !!target);
  }
  function endNodeDrag(commit) {
    const { id, target, ghost, subtree } = nodeDrag;
    clearDropHighlight();
    nodeDrag = null;
    if (ghost) ghost.remove();
    el.viewport.classList.remove('dragging');
    if (subtree) subtree.forEach(sid => { const n = nodeEls.get(sid); if (n) n.classList.remove('dragging'); });
    if (commit && target) {
      if (target.zone === 'onto') reparent(id, target.id);
      else moveBeside(id, target.id, target.zone === 'after');
    } else updateStyleBar();
  }
  /** Move a node (with its branch) to sit right before/after another node, under that node's parent. */
  function moveBeside(id, targetId, after) {
    const src = findNode(state.map.root, id);
    const tgt = findNode(state.map.root, targetId);
    if (!src || !tgt || !src.parent || !tgt.parent) return;
    if (findNode(src.node, targetId)) return;                // would create a cycle
    const oldParent = src.parent, oldIndex = src.index, newParent = tgt.parent;
    const toRoot = newParent === state.map.root;
    let index = tgt.index + (after ? 1 : 0);
    if (newParent === oldParent) {
      if (oldIndex < index) index--;
      const sameSide = !toRoot || (src.node.side || 'R') === (tgt.node.side || 'R');
      if (index === oldIndex && sameSide) return;            // nothing would change
    }
    pushUndo();
    oldParent.children.splice(oldIndex, 1);
    if (toRoot) {
      src.node.side = tgt.node.side || 'R';
      if (src.node.color === undefined) src.node.color = pickColor();
    } else { delete src.node.side; delete src.node.color; }
    newParent.collapsed = false;
    newParent.children.splice(index, 0, src.node);
    persist(); relayout(); select(id);
  }
  function reparent(id, targetId) {
    const src = findNode(state.map.root, id);
    const dst = findNode(state.map.root, targetId);
    if (!src || !dst || !src.parent || dst.node === src.parent) return;
    if (findNode(src.node, targetId)) return;                // would create a cycle
    pushUndo();
    src.parent.children.splice(src.index, 1);
    if (!dst.parent) { src.node.side = chooseSide(); src.node.color = pickColor(); }
    else { delete src.node.side; delete src.node.color; }
    dst.node.collapsed = false;
    dst.node.children.push(src.node);
    persist(); relayout(); select(id);
  }

  /* drag a resize handle to set a custom node width; double-tap/click on it resets to auto */
  function beginResize(e, id, edge) {
    e.preventDefault();
    if (state.editingId) commitEdit();
    select(id, { reveal: false });
    if (animating) { applyFrame(1); animating = false; }  // settle in-flight tweens so the preview owns the transform
    const ln = state.layout.byId.get(id);
    resizeDrag = { id, edge, pointerId: e.pointerId, startX: e.clientX, startW: ln.w, live: ln.w, moved: false, el: nodeEls.get(id) };
    el.viewport.setPointerCapture(e.pointerId);
  }
  function moveResize(e) {
    if (!resizeDrag.moved && Math.abs(e.clientX - resizeDrag.startX) < 3) return;
    resizeDrag.moved = true;
    const dir = resizeDrag.edge === 'L' ? -1 : 1;
    const w = Layout.clampWidth(resizeDrag.startW + dir * (e.clientX - resizeDrag.startX) / state.view.z);
    if (w === resizeDrag.live) return;
    const ln = state.layout.byId.get(resizeDrag.id), p = pos.get(resizeDrag.id), n = resizeDrag.el;
    if (!ln || !p) return;                                   // node vanished mid-gesture
    resizeDrag.live = w;
    n.style.maxWidth = 'none';
    n.style.width = w + 'px';
    // preview only the grabbed node, opposite edge anchored; the tree reflows on release
    const x = resizeDrag.edge === 'L' ? p.x + resizeDrag.startW / 2 - w : p.x - resizeDrag.startW / 2;
    n.style.transform = `translate3d(${x}px, ${p.y - ln.h / 2}px, 0)`;
  }
  function endResize(commit) {
    const rd = resizeDrag;
    resizeDrag = null;
    const ln = state.layout.byId.get(rd.id);
    if (!ln) { relayout(); return; }              // node deleted mid-gesture
    const node = ln.node;
    if (rd.moved) {
      lastHandleTap = null;
      if (commit && rd.live !== rd.startW) {
        pushUndo(); node.width = Math.round(rd.live); persist(); relayout(); select(rd.id);
      } else {
        relayout();  // data unchanged — rerender to drop the preview styles
      }
      return;
    }
    if (!commit) { lastHandleTap = null; return; }  // cancelled press never taps or resets
    const now = performance.now();
    if (lastHandleTap && lastHandleTap.id === rd.id && lastHandleTap.edge === rd.edge && now - lastHandleTap.t < RESIZE_TAP_MS) {
      lastHandleTap = null;
      if (node.width !== undefined) { pushUndo(); delete node.width; persist(); relayout(); select(rd.id); }
    } else {
      lastHandleTap = { id: rd.id, edge: rd.edge, t: now };
    }
  }

  el.viewport.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    pendingLink = null;
    if (resizeDrag || nodeDrag || drag) return;              // one gesture at a time owns the interaction
    if (e.target.closest('.stylebar')) return;
    closeStylePop();
    if (document.activeElement === el.title) el.title.blur();
    const nodeEl = e.target.closest('.node');
    if (nodeEl) {
      const id = nodeEl.dataset.id;
      if (e.target.closest('.badge')) { e.preventDefault(); toggleCollapse(id); return; }
      if (e.target.closest('.note-mark')) { e.preventDefault(); if (state.editingId) commitEdit(); select(id, { reveal: false }); setNotesPaneOpen(true); return; }
      const rh = e.target.closest('.resize-handle');
      if (rh) { beginResize(e, id, rh.dataset.edge); return; }
      if (state.editingId === id) return;
      const link = e.target.closest('.m-a');
      if (link && isModClick(e)) {
        // follow the link on release; no select, no drag — another node's edit still commits like on any click outside it.
        // Capture first: that commit relayouts and re-renders this span, and a detached down-target would otherwise lose the release.
        e.preventDefault();
        try { el.viewport.setPointerCapture(e.pointerId); } catch { /* synthetic pointer: release still bubbles to the viewport */ }
        pendingLink = { href: link.dataset.href, x: e.clientX, y: e.clientY };
        if (state.editingId) commitEdit();
        return;
      }
      e.preventDefault();
      if (state.editingId) commitEdit();
      select(id, { reveal: false });
      if (id !== state.map.root.id) {
        nodeDrag = { id, x: e.clientX, y: e.clientY, active: false, ghost: null, target: null, targetKey: null, subtree: null };
        el.viewport.setPointerCapture(e.pointerId);
      }
      return;
    }
    drag = { x: e.clientX, y: e.clientY, vx: state.view.x, vy: state.view.y, moved: false };
    el.viewport.setPointerCapture(e.pointerId);
  });
  el.viewport.addEventListener('pointermove', e => {
    if (resizeDrag) { if (e.pointerId === resizeDrag.pointerId) moveResize(e); return; }
    if (nodeDrag) {
      if (!nodeDrag.active) {
        if (Math.hypot(e.clientX - nodeDrag.x, e.clientY - nodeDrag.y) < DRAG_THRESHOLD) return;
        beginNodeDrag(e);
      } else {
        moveNodeDrag(e);
      }
      return;
    }
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) > 3) { drag.moved = true; el.viewport.classList.add('panning'); }
    if (drag.moved) { state.view.x = drag.vx + dx; state.view.y = drag.vy + dy; applyView(); }
  });
  el.viewport.addEventListener('pointerup', e => {
    if (pendingLink) { openPendingLink(e); return; }
    if (resizeDrag) { if (e.pointerId === resizeDrag.pointerId) endResize(true); return; }
    if (nodeDrag) { if (nodeDrag.active) endNodeDrag(true); else nodeDrag = null; return; }
    if (!drag) return;
    if (!drag.moved) {
      if (state.editingId) commitEdit();
      select(null);
      el.help.hidden = true;
    }
    drag = null;
    el.viewport.classList.remove('panning');
  });
  el.viewport.addEventListener('pointercancel', e => {
    pendingLink = null;
    if (resizeDrag) { if (e.pointerId === resizeDrag.pointerId) endResize(false); return; }
    if (nodeDrag) endNodeDrag(false);
    drag = null;
    el.viewport.classList.remove('panning');
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    // consume the Escape that cancels a gesture so downstream handlers don't also act on it
    if (resizeDrag) { e.preventDefault(); e.stopPropagation(); endResize(false); return; }
    if (nodeDrag && nodeDrag.active) { e.preventDefault(); e.stopPropagation(); endNodeDrag(false); }
  }, true);

  el.viewport.addEventListener('dblclick', e => {
    // pointer capture armed for node drag retargets dblclick to the viewport; hit-test the real element
    const hit = document.elementFromPoint(e.clientX, e.clientY) || e.target;
    const nodeEl = hit.closest('.node');
    if (!nodeEl || nodeEl.dataset.id === state.editingId) return;  // already editing: keep the native word selection
    if (isModClick(e) && hit.closest('.m-a')) return;                // the first click already opened the link; don't also edit
    if (!hit.closest('.badge') && !hit.closest('.resize-handle') && !hit.closest('.note-mark')) startEdit(nodeEl.dataset.id);
  });
  /** Release of a modifier+pointerdown on a link: open it unless the pointer dragged off or this is a double-click's second release. */
  function openPendingLink(e) {
    const { href, x, y } = pendingLink;
    pendingLink = null;
    if (Math.hypot(e.clientX - x, e.clientY - y) > DRAG_THRESHOLD || !isModClick(e) || !/^https?:\/\//.test(href)) return;
    if (href === lastLinkOpen.href && e.timeStamp - lastLinkOpen.t < DBLCLICK_MS) return;
    lastLinkOpen = { href, t: e.timeStamp };
    window.open(href, '_blank', 'noopener,noreferrer');
  }

  $('#zoom-in').addEventListener('click', () => zoomAt(1.25, undefined, undefined, true));
  $('#zoom-out').addEventListener('click', () => zoomAt(0.8, undefined, undefined, true));
  $('#zoom-fit').addEventListener('click', () => fitView(true));
  el.zoomLabel.addEventListener('click', () => zoomAt(1 / state.view.z, undefined, undefined, true));
  window.addEventListener('resize', () => { if (state.map) applyView(); });

  /* ---------- title ---------- */
  el.title.addEventListener('input', () => {
    state.map.title = el.title.value.trim() || 'Untitled map';
    state.map.titleCustom = true;
    updateDocumentTitle(el.title.value);
    persist();
  });
  el.title.addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key === 'Enter' || e.key === 'Escape') el.title.blur();
  });
  el.title.addEventListener('blur', () => {
    if (!state.map) return; // focus-fixup blur after showHome() tore the editor down
    if (!el.title.value.trim()) el.title.value = state.map.title;
    updateDocumentTitle(el.title.value);
  });

  /* ---------- help ---------- */
  const SHORTCUTS = [
    ['Create & edit', [
      [['Tab'], 'Add a child'],
      [['Shift', 'Enter'], 'Add a child'],
      [['Enter'], 'Add a peer below'],
      [['F2', 'Space'], 'Edit the selected node'],
      [['Type'], 'Replace the selected node’s text'],
      [['Enter'], 'Finish editing (while editing)'],
      [['Tab'], 'Finish and start a child (while editing)'],
      [['Shift', 'Enter'], 'Finish and start a child (while editing)'],
      [['Esc'], 'Finish editing'],
      [['⌫'], 'Delete the node and its branch'],
      [[MOD, 'I'], 'Open the notes pane for the node'],
      [['Esc'], 'Leave the notes pane (while writing notes)'],
      [[MOD, 'C'], 'Copy the branch (also as text)'],
      [[MOD, 'V'], 'Paste the branch or clipboard text as children'],
    ]],
    ['Navigate', [
      [['↑', '↓'], 'Move between siblings'],
      [['←', '→'], 'Move toward parent or children'],
      [['Home'], 'Jump to the central node'],
      [['Esc'], 'Deselect'],
    ]],
    ['Organize', [
      [[ALT, '↑ ↓'], 'Reorder among siblings'],
      [[MOD, '/'], 'Collapse or expand a branch'],
      [[MOD, 'Shift', '← →'], 'Move a first-level branch to the other side'],
      [['Drag'], 'Drop on a node to nest under it, or between nodes to reorder'],
      [[MOD, 'Z'], 'Undo'],
      [[MOD, 'Shift', 'Z'], 'Redo'],
    ]],
    ['Style', [
      [[MOD, 'B'], 'Bold (selected text while editing, or the node)'],
      [[MOD, 'Shift', 'X'], 'Strikethrough (selected text while editing, or the node)'],
      [[MOD, 'I'], 'Italic (selected text, while editing)'],
      [[MOD, 'U'], 'Underline (selected text, while editing)'],
      [[MOD, 'Shift', 'C'], 'Copy the node’s style'],
      [[MOD, 'Shift', 'V'], 'Paste the copied style'],
    ]],
    ['View', [
      [['Scroll'], 'Pan'],
      [['Pinch', MOD + ' Scroll'], 'Zoom'],
      [[MOD, '+'], 'Zoom in'],
      [[MOD, '−'], 'Zoom out'],
      [[MOD, '0'], 'Fit map to screen'],
      [[MOD, 'Shift', 'L'], 'Toggle light / dark theme'],
      [['?'], 'Toggle this panel'],
    ]],
  ];
  el.helpBody.innerHTML = SHORTCUTS.map(([group, rows]) => `
    <div class="help-group"><h4>${group}</h4>
      ${rows.map(([keys, label]) => `<div class="help-row"><span>${label}</span><span class="keys">${keys.map(k => `<kbd>${k}</kbd>`).join('')}</span></div>`).join('')}
    </div>`).join('');
  const toggleHelp = () => { el.help.hidden = !el.help.hidden; };
  $('#help-btn').addEventListener('click', toggleHelp);
  $('#help-close').addEventListener('click', toggleHelp);
  $('#back').addEventListener('click', () => { location.hash = '#/'; });

  /* ---------- global keyboard ---------- */
  /** True while map-level shortcuts must stay out of the way: no editor, mid-gesture, text field focused, or a node being edited. */
  function shortcutsBlocked(e) {
    if (!state.map || el.editor.hidden) return true;
    if (resizeDrag || (nodeDrag && nodeDrag.active)) return true;   // no tree mutations mid-gesture (Escape is handled upstream)
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return true;
    return !!state.editingId;
  }
  document.addEventListener('keydown', e => {
    if (shortcutsBlocked(e)) return;

    const mod = e.metaKey || e.ctrlKey;
    const id = state.selectedId;
    const has = !!(id && findNode(state.map.root, id));
    const key = e.key;

    // global (no selection required)
    if (mod && !e.shiftKey && key.toLowerCase() === 'z') { e.preventDefault(); undo(); return; }
    if (mod && ((e.shiftKey && key.toLowerCase() === 'z') || key.toLowerCase() === 'y')) { e.preventDefault(); redo(); return; }
    if (mod && (key === '=' || key === '+')) { e.preventDefault(); zoomAt(1.25, undefined, undefined, true); return; }
    if (mod && key === '-') { e.preventDefault(); zoomAt(0.8, undefined, undefined, true); return; }
    if (mod && key === '0') { e.preventDefault(); fitView(true); return; }
    if (mod && key.toLowerCase() === 's') { e.preventDefault(); persist(); return; }
    if (key === '?' ) { e.preventDefault(); toggleHelp(); return; }
    if (key === 'Escape') { e.preventDefault(); if (!el.help.hidden) el.help.hidden = true; else select(null); return; }
    if (key === 'Home') { e.preventDefault(); select(state.map.root.id); return; }
    if (!has) {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(key)) { e.preventDefault(); select(state.map.root.id); }
      return;
    }

    // selection-based
    if (key === 'Tab' || (key === 'Enter' && e.shiftKey)) { e.preventDefault(); const n = addChild(id); if (n) startEdit(n.id); return; }
    if (key === 'Enter') { e.preventDefault(); const n = addSibling(id); if (n) startEdit(n.id); return; }
    if (key === 'Backspace' || key === 'Delete') { e.preventDefault(); deleteNode(id); return; }
    if (key === ' ' || key === 'F2') { e.preventDefault(); startEdit(id); return; }
    if (mod && key === '/') { e.preventDefault(); toggleCollapse(id); return; }
    if (mod && !e.shiftKey && key.toLowerCase() === 'i') { e.preventDefault(); setNotesPaneOpen(!el.notesPane || el.notesPane.hidden); return; }
    if (mod && !e.shiftKey && key.toLowerCase() === 'b') { e.preventDefault(); toggleStyle(id, 'bold'); return; }
    if (mod && e.shiftKey && key.toLowerCase() === 'x') { e.preventDefault(); toggleStyle(id, 'strike'); return; }
    if (mod && e.shiftKey && key.toLowerCase() === 'c') { e.preventDefault(); copyStyle(id); return; }
    if (mod && e.shiftKey && key.toLowerCase() === 'v') { e.preventDefault(); pasteStyle(id); return; }
    if (mod && !e.shiftKey && key.toLowerCase() === 'c') { e.preventDefault(); copyNode(id); return; }
    // plain Cmd/Ctrl+V is deliberately NOT intercepted: the browser's `paste` event (below) carries the system clipboard text
    if (mod && e.shiftKey && key === 'ArrowLeft') { e.preventDefault(); setSide(id, 'L'); return; }
    if (mod && e.shiftKey && key === 'ArrowRight') { e.preventDefault(); setSide(id, 'R'); return; }
    if (e.altKey && key === 'ArrowUp') { e.preventDefault(); moveSibling(id, -1); return; }
    if (e.altKey && key === 'ArrowDown') { e.preventDefault(); moveSibling(id, 1); return; }
    if (key === 'ArrowUp' || key === 'ArrowDown') {
      e.preventDefault();
      const n = nearestVertical(id, key === 'ArrowUp' ? -1 : 1);
      if (n) select(n.id);
      return;
    }
    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      e.preventDefault();
      const n = navHorizontal(id, key === 'ArrowLeft' ? -1 : 1);
      if (n) select(n.id);
      return;
    }
    // printable character: start editing with replacement
    if (!mod && !e.altKey && key.length === 1) {
      e.preventDefault();
      startEdit(id, key);
    }
  });

  // Cmd/Ctrl+V with a node selected: the node clipboard wins only while the system text is still our own outline.
  document.addEventListener('paste', e => {
    if (shortcutsBlocked(e)) return;                                  // text fields keep native paste
    const id = state.selectedId;
    if (!id || !findNode(state.map.root, id)) return;
    e.preventDefault();
    let text = null;
    try { text = e.clipboardData ? e.clipboardData.getData('text/plain') : null; } catch (err) { text = null; }
    const readable = typeof text === 'string';
    const clip = readNodeClip();
    const internalWins = clip && (typeof clip.outline !== 'string' || !readable || !text.trim()
      || normalizeEol(text) === normalizeEol(clip.outline));
    if (internalWins) { pasteNode(id); return; }
    if (readable && text.trim()) { pasteText(id, parseOutline(text)); return; }
    if (!readable) showToast("Couldn't read the system clipboard");
  });

  /* ================================================================ SEED + ROUTER */
  async function seedIfEmpty() {
    if (Store.hasData()) return;
    const N = (text, children = [], extra = {}) => ({ id: uid(), text, children, ...extra });
    const root = N('Welcome to Mindmap', [
      N('Keyboard first', [
        N('Tab adds a child'),
        N('Enter adds a sibling'),
        N('Just start typing to edit'),
        N('Arrow keys move around'),
      ], { side: 'R' }),
      N('Organize', [
        N(`${MOD} / collapses a branch`),
        N(`${ALT} ↑ ↓ reorders siblings`),
        N('Backspace deletes a branch'),
        N(`${MOD} Z undoes anything`),
      ], { side: 'L' }),
      N('Autosave', [
        N('Every change is saved instantly'),
        N('Stored locally in this browser'),
      ], { side: 'R' }),
      N('Navigate', [
        N('Scroll to pan, pinch to zoom'),
        N(`${MOD} 0 fits the map to the screen`),
        N('Press ? for all shortcuts'),
      ], { side: 'L' }),
    ]);
    await Store.create({ title: 'Welcome to Mindmap', root });
  }

  function route() {
    const m = location.hash.match(/^#\/map\/([\w-]+)/);
    if (m) openEditor(m[1]); else showHome();
  }
  window.addEventListener('hashchange', route);
  window.addEventListener('beforeunload', e => {
    if (state.saveFailed && state.map) { e.preventDefault(); e.returnValue = ''; }
  });

  document.fonts.ready.then(() => {
    Layout.clearCache();
    if (state.map) relayout(true); else if (!el.home.hidden) renderLibrary();
  });

  seedIfEmpty().then(() => {
    Store.migrate();
    Usage.refresh();
    route();
  });

  // Small read/select hook for alternative front-ends (see tactical.html) and console verification. Additive only.
  window.Mindmap = { state, select, findNode: id => (state.map ? findNode(state.map.root, id) : null), startEdit, commitEdit, readNodeClip, writeNodeClip, copyNode, pasteNode, pasteText, outlineText, parseOutline, showToast, Usage, PALETTE };
})();
