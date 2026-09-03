/* MINDSCOPE — tactical chrome on top of the shared mindmap engine.
 * Loaded before app.js: swaps the branch palette to phosphor tones, then (after app.js has
 * booted) drives the clock, HUD readouts, status bar and the NODE DATA panel by reading the
 * small window.Mindmap hook. It never mutates map data itself.
 */
(() => {
  'use strict';

  // Phosphor branch palette (same length as the default so stored color slots stay valid).
  const TACTICAL_PALETTE = ['#4af626', '#ffb02e', '#37e7ff', '#ff3b3b', '#a4ff85', '#ff7ad9', '#7dd3fc', '#ffe066'];
  Layout.PALETTE.splice(0, Layout.PALETTE.length, ...TACTICAL_PALETTE);

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const pad2 = n => String(n).padStart(2, '0');

  /* ---------- clock ---------- */
  function tickClock() {
    const d = new Date();
    const time = d.toLocaleTimeString('en-US', { hourCycle: 'h23', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const wd = d.toLocaleDateString('en-US', { weekday: 'short' });
    const mon = d.toLocaleDateString('en-US', { month: 'short' });
    const date = `${wd} ${pad2(d.getDate())} ${mon} ${d.getFullYear()}`.toUpperCase();
    $$('.js-clock').forEach(e => { e.textContent = time; });
    $$('.js-date').forEach(e => { e.textContent = date; });
  }

  /* ---------- tree helpers (read-only) ---------- */
  const countNodes = n => 1 + n.children.reduce((a, c) => a + countNodes(c), 0);
  const maxDepth = (n, d = 0) => n.children.reduce((m, c) => Math.max(m, maxDepth(c, d + 1)), d);
  function pathTo(root, id) {
    const out = [];
    (function walk(n, trail) {
      if (out.length) return;
      const t = [...trail, n];
      if (n.id === id) { out.push(...t); return; }
      n.children.forEach(c => walk(c, t));
    })(root, []);
    return out;
  }

  /* ---------- HUD + status bar + panel ---------- */
  let lastSig = '';
  function refresh() {
    const M = window.Mindmap;
    if (!M) return;
    const { state } = M;
    const editorOpen = !$('#editor').hidden;

    if (!editorOpen) {
      const files = $$('#cards .card').length;
      $$('.js-file-count').forEach(e => { e.textContent = files; });
      lastSig = '';
      return;
    }
    if (!state.map || !state.layout) return;

    const sel = state.selectedId && M.findNode(state.selectedId);
    const sig = [state.selectedId, state.editingId, state.map.updatedAt, state.layout.nodes.length,
      $('#zoom-level').textContent, $('#save-status').className, sel && JSON.stringify(sel.node.style || {})].join('|');
    if (sig === lastSig) return;
    const typingNotes = document.activeElement && document.activeElement.classList.contains('notes-input');
    if (typingNotes) return; // re-render after blur; keeps the caret where it is
    lastSig = sig;

    const root = state.map.root;
    const total = countNodes(root);
    const depth = maxDepth(root);
    const branches = root.children.length;
    const zoom = $('#zoom-level').textContent;
    const synced = $('#save-status').classList.contains('is-saved');

    $('.js-hud-nodes').textContent = total;
    $('.js-hud-depth').textContent = `DEPTH ${depth} · ${branches} BRANCH${branches === 1 ? '' : 'ES'}`;
    $('.js-hud-zoom').textContent = zoom;
    const link = $('.js-hud-link');
    link.textContent = synced ? 'SYNCED' : 'TX';
    link.classList.toggle('hud__amber', !synced);
    const lock = $('.js-hud-lock');
    lock.textContent = sel ? sel.node.text.toUpperCase() : 'NONE';
    lock.classList.toggle('hud__red', !sel);
    $('.js-hud-lock-sub').textContent = sel ? (state.editingId ? 'EDITING' : `DEPTH ${sel.depth} · ${sel.node.children.length} CHILD${sel.node.children.length === 1 ? '' : 'REN'}`) : 'NO TARGET';

    $('.js-st-nodes').textContent = total;
    $('.js-st-branches').textContent = branches;
    $('.js-st-depth').textContent = depth;
    $('.js-st-lock').textContent = sel ? sel.node.text.toUpperCase() : 'NONE';

    const status = $('.js-lock-status');
    status.textContent = state.editingId ? 'EDITING' : (sel ? 'LOCKED' : 'NO LOCK');
    status.classList.toggle('locked', !!sel && !state.editingId);
    status.classList.toggle('editing', !!state.editingId);

    renderPanel(sel);
  }

  function branchOf(ln) {
    let n = ln;
    while (n.parent && n.parent.parent) n = n.parent;
    return n.parent ? n : null; // null for the root
  }

  function renderPanel(sel) {
    const M = window.Mindmap;
    const { state } = M;
    const body = $('.js-panel-body');
    const root = state.map.root;
    const L = state.layout;

    if (!sel) {
      const rows = root.children.map((c, i) => {
        const ln = L.byId.get(c.id);
        const color = ln ? ln.color : Layout.PALETTE[(c.color !== undefined ? c.color : i) % Layout.PALETTE.length];
        return `<li data-id="${c.id}"><i class="sym sym--branch" style="color:${color}"></i><span class="ttl">${esc(c.text)}${c.notes ? ' <i class="note-flag">N</i>' : ''}</span><span class="cnt">${countNodes(c) - 1} SUB · ${(c.side || 'R')}</span></li>`;
      }).join('');
      body.innerHTML = `
        <div class="empty__msg"><b>NO NODE LOCKED</b>SELECT A NODE ON SCOPE<br>OR TYPE TO EDIT THE ROOT</div>
        <h3 class="panel__h3">BRANCHES <span>${root.children.length}</span></h3>
        <ul class="nearest">${rows || '<li class="none">NO BRANCHES · PRESS TAB</li>'}</ul>
        <div class="hint-block"><span><kbd>TAB</kbd> CHILD</span><span><kbd>ENTER</kbd> SIBLING</span><span><kbd>⌫</kbd> DELETE</span><span><kbd>⌘/</kbd> COLLAPSE</span><span><kbd>⌘B</kbd> BOLD</span><span><kbd>?</kbd> ALL KEYS</span></div>`;
      bindList(body);
      return;
    }

    const { node, depth } = sel;
    const ln = L.byId.get(node.id);
    const branch = ln ? branchOf(ln) : null;
    const color = ln ? (ln.color || '#4af626') : '#4af626';
    const st = node.style || {};
    const styleFlags = [st.bold && 'BOLD', st.strike && 'STRIKE', st.bg && 'FILL', st.color && 'TEXT'].filter(Boolean).join(' · ') || 'DEFAULT';
    const stateTxt = !node.children.length ? 'LEAF' : (node.collapsed ? 'COLLAPSED' : 'EXPANDED');
    const trail = pathTo(root, node.id);
    const kids = node.children.map(c =>
      `<li data-id="${c.id}"><i class="sym ${c.children.length ? 'sym--branch' : 'sym--leaf'}" style="color:${color}"></i><span class="ttl">${esc(c.text)}</span><span class="cnt">${c.children.length ? `${countNodes(c) - 1} SUB` : 'LEAF'}</span></li>`).join('');
    const siblings = (trail[trail.length - 2] || { children: [] }).children;
    const idx = siblings.indexOf(node);

    body.innerHTML = `
      <div class="tgt">
        <div class="tgt__meta"><span>ID ${esc(node.id.slice(0, 6).toUpperCase())}</span><span>DEPTH ${depth}</span><span>${depth === 0 ? 'CENTER' : `SIDE ${ln && ln.side ? ln.side : '—'}`}</span></div>
        <h2 class="tgt__title${st.strike ? ' is-strike' : ''}">${esc(node.text)}</h2>
        <dl class="tgt__grid">
          <div><dt>Branch</dt><dd><i class="swatch" style="background:${color}"></i>${depth === 0 ? 'ROOT' : esc(branch ? branch.node.text : node.text)}</dd></div>
          <div><dt>State</dt><dd class="${node.collapsed ? 'pri--amber' : ''}">${stateTxt}</dd></div>
          <div><dt>Children</dt><dd>${node.children.length}</dd></div>
          <div><dt>Subtree</dt><dd>${countNodes(node) - 1}</dd></div>
          <div><dt>Position</dt><dd>${depth === 0 ? '—' : `${idx + 1} OF ${siblings.length}`}</dd></div>
          <div><dt>Style</dt><dd>${styleFlags}</dd></div>
        </dl>
        <section>
          <h3 class="panel__h3">Path <span>${trail.length - 1} HOPS</span></h3>
          <ol class="path">${trail.map((n, i) => `<li class="${i < trail.length - 1 ? 'link' : ''}" data-id="${n.id}">${esc(n.text)}</li>`).join('')}</ol>
        </section>
        <section>
          <h3 class="panel__h3">Notes <span>${node.notes ? `${node.notes.length} CHARS` : 'NONE'}</span></h3>
          <textarea class="notes-input" data-id="${node.id}" placeholder="FREE TEXT · INTEL, CONTEXT, LINKS" spellcheck="false">${esc(node.notes || '')}</textarea>
        </section>
        <section>
          <h3 class="panel__h3">Children <span>${node.children.length}</span></h3>
          <ul class="nearest">${kids || '<li class="none">NO CHILDREN · PRESS TAB</li>'}</ul>
        </section>
      </div>`;
    bindList(body);
  }

  function bindList(body) {
    $$('[data-id]', body).forEach(el => el.addEventListener('click', () => {
      const id = el.dataset.id;
      if (!$(`.node[data-id="${id}"]`)) return; // hidden inside a collapsed branch
      window.Mindmap.select(id);
      lastSig = '';
    }));
  }

  document.addEventListener('DOMContentLoaded', () => {
    tickClock();
    setInterval(tickClock, 1000);
    setInterval(refresh, 150);
    window.addEventListener('hashchange', () => { lastSig = ''; });
  });
})();
