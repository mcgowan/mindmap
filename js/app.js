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
  };
  const nodeEls = new Map();   // id -> .node element
  const linkEls = new Map();   // child id -> <path>
  const pos = new Map();       // id -> {x, y} current animated position

  /* ================================================================ LIBRARY */
  async function showHome() {
    if (state.editingId) commitEdit();
    state.map = null;
    el.editor.hidden = true;
    el.home.hidden = false;
    el.help.hidden = true;
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
  function setStatus(s) {
    el.status.classList.toggle('is-saved', s === 'saved');
    el.status.classList.toggle('is-saving', s === 'saving');
    $('.label', el.status).textContent = s === 'saved' ? 'All changes saved' : 'Saving…';
  }
  function persist() {
    if (!state.map) return;
    setStatus('saving');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      await Store.save(state.map);
      setStatus('saved');
    }, 120);
  }
  function persistView() {
    if (!state.map) return;
    clearTimeout(viewTimer);
    viewTimer = setTimeout(() => {
      state.map.view = { ...state.view };
      Store.save(state.map, { touch: false });
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
        n.innerHTML = '<span class="node-text"></span><button class="badge" tabindex="-1" title="Collapse / expand"></button><i class="note-mark"></i>';
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
    if (ln.id !== state.editingId) $('.node-text', n).textContent = ln.node.text;
    $('.badge', n).textContent = ln.collapsed ? ln.hiddenCount : '';
  }

  /* ---------- selection ---------- */
  function select(id, { reveal = true } = {}) {
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
      txt.textContent = replaceWith;
    } else {
      txt.textContent = found.node.text;
    }
    txt.focus();
    const range = document.createRange();
    range.selectNodeContents(txt);
    if (replaceWith !== null) range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    if (replaceWith !== null) relayout();
  }

  function commitEdit({ cancel = false } = {}) {
    const id = state.editingId;
    if (!id) return;
    const n = nodeEls.get(id);
    const txt = n ? $('.node-text', n) : null;
    const found = findNode(state.map.root, id);
    state.editingId = null;
    if (n) { n.classList.remove('editing'); txt.contentEditable = 'false'; }
    if (!found) return;
    const { node, parent } = found;
    let text = cancel ? state.editStartText : (txt ? txt.textContent : node.text).replace(/\s+/g, ' ').trim();
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
      text = state.editStartText || (parent ? 'Untitled' : 'Central idea');
    }
    node.text = text;
    if (txt) txt.textContent = text;
    if (text !== state.editStartText) {
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
    }
  }

  el.nodes.addEventListener('input', e => {
    const txt = e.target.closest('.node-text');
    if (!txt || !state.editingId) return;
    const found = findNode(state.map.root, state.editingId);
    if (!found) return;
    found.node.text = txt.textContent.replace(/\n/g, ' ');
    relayout();
    ensureVisible(state.editingId);
    renderNotesPane();
  });
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
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEdit();
      if (!e.shiftKey && findNode(state.map.root, id)) { const n = addSibling(id); startEdit(n.id); }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      commitEdit();
      if (findNode(state.map.root, id)) { const n = addChild(id); startEdit(n.id); }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      commitEdit();
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault(); toggleStyle(id, 'bold');
    } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'x') {
      e.preventDefault(); toggleStyle(id, 'strike');
    } else if ((e.metaKey || e.ctrlKey) && ['i', 'u'].includes(e.key.toLowerCase())) {
      e.preventDefault(); // keep contenteditable free of inline markup
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

  /* ---------- per-node style ---------- */
  const FILLS = ['#e11d48', '#ea580c', '#d97706', '#16a34a', '#0d9488', '#2563eb', '#7c3aed', '#db2777', '#64748b', '#1e293b'];
  const TEXT_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#a855f7', '#ec4899', '#94a3b8', '#ffffff', '#0f172a'];
  const STYLE_CLIP_KEY = 'mindmap.styleClipboard';

  function contrastText(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex);
    if (!m) return '';
    const v = parseInt(m[1], 16);
    const r = (v >> 16) & 255, g = (v >> 8) & 255, b = v & 255;
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return lum > 150 ? '#0f172a' : '#ffffff';
  }
  function getStyle(id) {
    const f = findNode(state.map.root, id);
    return f ? (f.node.style || {}) : {};
  }
  function setStyle(id, patch) {
    const f = findNode(state.map.root, id);
    if (!f) return;
    pushUndo();
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
    pushUndo();
    if (Object.keys(clip).length) f.node.style = { ...clip }; else delete f.node.style;
    persist(); relayout(); updateStyleBar();
    flashStyleBtn('paste');
  }
  function flashStyleBtn(name) {
    const b = $(`[data-sb="${name}"]`, el.stylebar);
    b.classList.add('flash');
    setTimeout(() => b.classList.remove('flash'), 350);
  }

  function updateStyleBar() {
    const id = state.selectedId;
    const ln = state.layout && id ? state.layout.byId.get(id) : null;
    const show = !!ln && !state.editingId && !(nodeDrag && nodeDrag.active) && !el.editor.hidden;
    el.stylebar.hidden = !show;
    if (!show) { closeStylePop(); return; }
    const st = ln.node.style || {};
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
    $('#sb-bg-swatch').style.background = st.bg || 'transparent';
    $('#sb-bg-swatch').classList.toggle('none', !st.bg);
    $('#sb-color-swatch').style.color = st.color || '';
    $('#sb-color-swatch').style.textDecorationColor = st.color || 'var(--muted)';
    $('[data-sb="bold"]', el.stylebar).classList.toggle('active', !!st.bold);
    $('[data-sb="strike"]', el.stylebar).classList.toggle('active', !!st.strike);
    $('[data-sb="paste"]', el.stylebar).disabled = !styleClipboard();
    $('[data-sb="clear"]', el.stylebar).disabled = !Object.keys(st).length;
  }
  function closeStylePop() {
    el.sbPop.hidden = true;
    $$('.sb-btn.open', el.stylebar).forEach(b => b.classList.remove('open'));
  }
  function openStylePop(kind) {
    const id = state.selectedId;
    const st = getStyle(id);
    const swatches = kind === 'bg' ? FILLS : TEXT_COLORS;
    const current = kind === 'bg' ? st.bg : st.color;
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
    if (sw) {
      setStyle(state.selectedId, { [el.sbPop.dataset.kind]: sw.dataset.value });
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
      case 'bold': toggleStyle(id, 'bold'); break;
      case 'strike': toggleStyle(id, 'strike'); break;
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
    if (!el.notesPane) return;
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
    let best = null, bestScore = Infinity;
    for (const ln of L.nodes) {
      if (ln === cur) continue;
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
  function dropTargetAt(x, y) {
    const hit = document.elementFromPoint(x, y);
    const n = hit && hit.closest('.node');
    if (!n) return null;
    const id = n.dataset.id;
    if (nodeDrag.subtree.has(id)) return null;               // itself or its own descendants
    const ln = state.layout.byId.get(nodeDrag.id);
    if (ln.parent && ln.parent.id === id) return null;      // current parent
    return id;
  }
  function moveNodeDrag(e) {
    nodeDrag.ghost.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 12}px)`;
    const target = dropTargetAt(e.clientX, e.clientY);
    if (target !== nodeDrag.targetId) {
      if (nodeDrag.targetId && nodeEls.has(nodeDrag.targetId)) nodeEls.get(nodeDrag.targetId).classList.remove('drop-target');
      nodeDrag.targetId = target;
      if (target) nodeEls.get(target).classList.add('drop-target');
    }
    nodeDrag.ghost.classList.toggle('can-drop', !!target);
  }
  function endNodeDrag(commit) {
    const { id, targetId, ghost, subtree } = nodeDrag;
    nodeDrag = null;
    if (ghost) ghost.remove();
    el.viewport.classList.remove('dragging');
    if (subtree) subtree.forEach(sid => { const n = nodeEls.get(sid); if (n) n.classList.remove('dragging'); });
    if (targetId && nodeEls.has(targetId)) nodeEls.get(targetId).classList.remove('drop-target');
    if (commit && targetId) reparent(id, targetId); else updateStyleBar();
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

  el.viewport.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    if (e.target.closest('.stylebar')) return;
    closeStylePop();
    if (document.activeElement === el.title) el.title.blur();
    const nodeEl = e.target.closest('.node');
    if (nodeEl) {
      const id = nodeEl.dataset.id;
      if (e.target.closest('.badge')) { e.preventDefault(); toggleCollapse(id); return; }
      if (e.target.closest('.note-mark')) { e.preventDefault(); if (state.editingId) commitEdit(); select(id, { reveal: false }); setNotesPaneOpen(true); return; }
      if (state.editingId === id) return;
      e.preventDefault();
      if (state.editingId) commitEdit();
      select(id, { reveal: false });
      if (id !== state.map.root.id) {
        nodeDrag = { id, x: e.clientX, y: e.clientY, active: false, ghost: null, targetId: null, subtree: null };
        el.viewport.setPointerCapture(e.pointerId);
      }
      return;
    }
    drag = { x: e.clientX, y: e.clientY, vx: state.view.x, vy: state.view.y, moved: false };
    el.viewport.setPointerCapture(e.pointerId);
  });
  el.viewport.addEventListener('pointermove', e => {
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
  el.viewport.addEventListener('pointercancel', () => {
    if (nodeDrag) endNodeDrag(false);
    drag = null;
    el.viewport.classList.remove('panning');
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nodeDrag && nodeDrag.active) endNodeDrag(false); }, true);

  el.viewport.addEventListener('dblclick', e => {
    const nodeEl = e.target.closest('.node');
    if (nodeEl && !e.target.closest('.badge')) startEdit(nodeEl.dataset.id);
  });

  $('#zoom-in').addEventListener('click', () => zoomAt(1.25, undefined, undefined, true));
  $('#zoom-out').addEventListener('click', () => zoomAt(0.8, undefined, undefined, true));
  $('#zoom-fit').addEventListener('click', () => fitView(true));
  el.zoomLabel.addEventListener('click', () => zoomAt(1 / state.view.z, undefined, undefined, true));
  window.addEventListener('resize', () => { if (state.map) applyView(); });

  /* ---------- title ---------- */
  el.title.addEventListener('input', () => {
    state.map.title = el.title.value.trim() || 'Untitled map';
    state.map.titleCustom = true;
    persist();
  });
  el.title.addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key === 'Enter' || e.key === 'Escape') el.title.blur();
  });
  el.title.addEventListener('blur', () => { if (!el.title.value.trim()) el.title.value = state.map.title; });

  /* ---------- help ---------- */
  const SHORTCUTS = [
    ['Create & edit', [
      [['Tab'], 'Add a child'],
      [['Enter'], 'Add a sibling below'],
      [['Shift', 'Enter'], 'Add a sibling above'],
      [['Type'], 'Replace the selected node’s text'],
      [['Space'], 'Edit the selected node'],
      [['Enter'], 'Commit and start the next sibling (while editing)'],
      [['Tab'], 'Commit and start a child (while editing)'],
      [['Shift', 'Enter'], 'Commit only (while editing)'],
      [['Esc'], 'Stop editing'],
      [['⌫'], 'Delete the node and its branch'],
      [[MOD, 'I'], 'Open the notes pane for the node'],
      [['Esc'], 'Leave the notes pane (while writing notes)'],
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
      [['Drag'], 'Drop a node on another to move it there (with its branch)'],
      [[MOD, 'Z'], 'Undo'],
      [[MOD, 'Shift', 'Z'], 'Redo'],
    ]],
    ['Style', [
      [[MOD, 'B'], 'Bold'],
      [[MOD, 'Shift', 'X'], 'Strikethrough'],
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
  document.addEventListener('keydown', e => {
    if (!state.map || el.editor.hidden) return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (state.editingId) return;

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
    if (key === 'Tab') { e.preventDefault(); const n = addChild(id); if (n) startEdit(n.id); return; }
    if (key === 'Enter') { e.preventDefault(); const n = addSibling(id, e.shiftKey); if (n) startEdit(n.id); return; }
    if (key === 'Backspace' || key === 'Delete') { e.preventDefault(); deleteNode(id); return; }
    if (key === ' ' || key === 'F2') { e.preventDefault(); startEdit(id); return; }
    if (mod && key === '/') { e.preventDefault(); toggleCollapse(id); return; }
    if (mod && !e.shiftKey && key.toLowerCase() === 'i') { e.preventDefault(); setNotesPaneOpen(!el.notesPane || el.notesPane.hidden); return; }
    if (mod && !e.shiftKey && key.toLowerCase() === 'b') { e.preventDefault(); toggleStyle(id, 'bold'); return; }
    if (mod && e.shiftKey && key.toLowerCase() === 'x') { e.preventDefault(); toggleStyle(id, 'strike'); return; }
    if (mod && e.shiftKey && key.toLowerCase() === 'c') { e.preventDefault(); copyStyle(id); return; }
    if (mod && e.shiftKey && key.toLowerCase() === 'v') { e.preventDefault(); pasteStyle(id); return; }
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

  document.fonts.ready.then(() => {
    Layout.clearCache();
    if (state.map) relayout(true); else if (!el.home.hidden) renderLibrary();
  });

  seedIfEmpty().then(route);

  // Small read/select hook for alternative front-ends (see tactical.html). Additive only.
  window.Mindmap = { state, select, findNode: id => (state.map ? findNode(state.map.root, id) : null) };
})();
