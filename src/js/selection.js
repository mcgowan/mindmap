/* Selection core — DOM-free: selection-set algebra, structural units, move planning,
 * clipboard payload shape, marquee hit-testing. Loaded before app.js; unit-tested under node.
 * A selection value is { ids: string[], primaryId: string|null } — ids in insertion order, no duplicates,
 * primaryId always a member (or null when empty). Trees are the map's { id, text, children, ... } nodes.
 */
const SelectionCore = (() => {
  'use strict';

  /* ---------------------------------------------------------------- tree */
  function findNode(root, id) {
    let found = null;
    (function walk(node, parent, depth) {
      if (found) return;
      if (node.id === id) { found = { id, node, parent, depth, index: parent ? parent.children.indexOf(node) : -1 }; return; }
      for (const c of node.children || []) walk(c, node, depth + 1);
    })(root, null, 0);
    return found;
  }
  /** Ids of `ids` that exist in the tree, in depth-first document order (parent before children, siblings by index). */
  function documentOrder(root, ids) {
    const want = new Set(ids);
    const out = [];
    (function walk(node) {
      if (want.has(node.id)) out.push(node.id);
      for (const c of node.children || []) walk(c);
    })(root);
    return out;
  }
  /** Ancestor chain of `id`, nearest first; [] for the root or an unknown id. */
  function ancestorsOf(root, id) {
    let chain = null;
    (function walk(node, path) {
      if (chain) return;
      if (node.id === id) { chain = path.slice().reverse(); return; }
      for (const c of node.children || []) walk(c, path.concat(node));
    })(root, []);
    return chain || [];
  }
  /** True when no ancestor of `id` is collapsed — the node has a rendered element. */
  function isRendered(root, id) {
    return !!findNode(root, id) && ancestorsOf(root, id).every(a => !a.collapsed);
  }
  /** The rendered node that stands in for a hidden `id`: its outermost collapsed ancestor (null when rendered or unknown). */
  function renderedAncestor(root, id) {
    const chain = ancestorsOf(root, id);
    let top = null;
    for (const a of chain) if (a.collapsed) top = a;
    return top ? top.id : null;
  }

  /* ---------------------------------------------------------------- selection algebra */
  // Every operation takes (sel, root, ...): the tree decides document order whenever a primary must be chosen.
  const empty = () => ({ ids: [], primaryId: null });
  const firstInDoc = (root, ids) => documentOrder(root, ids)[0] || null;

  function replace(sel, root, id) { return id ? { ids: [id], primaryId: id } : empty(); }

  /** Cmd/Ctrl+click: add (becomes primary) or remove — never below one node; a dropped primary falls back to document order. */
  function toggle(sel, root, id) {
    if (!sel.ids.includes(id)) return { ids: sel.ids.concat(id), primaryId: id };
    if (sel.ids.length === 1) return { ids: [id], primaryId: id };
    const ids = sel.ids.filter(x => x !== id);
    return { ids, primaryId: sel.primaryId === id ? firstInDoc(root, ids) : sel.primaryId };
  }
  /** Shift+click across parents: add without touching the primary. */
  function add(sel, root, id) {
    if (sel.ids.includes(id)) return { ids: sel.ids.slice(), primaryId: sel.primaryId };
    return { ids: sel.ids.concat(id), primaryId: sel.primaryId || id };
  }
  /** Shift+click on a sibling of the primary: every sibling between them by parent.children index (either direction). */
  function addRange(sel, root, fromId, toId) {
    const from = fromId && findNode(root, fromId), to = findNode(root, toId);
    if (!to) return { ids: sel.ids.slice(), primaryId: sel.primaryId };
    if (!from || from.parent !== to.parent || !to.parent) return add(sel, root, toId);
    const [a, b] = from.index <= to.index ? [from.index, to.index] : [to.index, from.index];
    let next = { ids: sel.ids.slice(), primaryId: sel.primaryId };
    for (let i = a; i <= b; i++) next = add(next, root, to.parent.children[i].id);
    return next;
  }
  /** Marquee commit / select-all: primary = requested, else the previous one when still present, else first in document order. */
  function set(sel, root, ids, { primary } = {}) {
    const uniq = [];
    for (const id of ids) if (id && !uniq.includes(id)) uniq.push(id);
    if (!uniq.length) return empty();
    if (primary && uniq.includes(primary)) return { ids: uniq, primaryId: primary };
    if (sel.primaryId && uniq.includes(sel.primaryId)) return { ids: uniq, primaryId: sel.primaryId };
    return { ids: uniq, primaryId: firstInDoc(root, uniq) };
  }
  /**
   * Drop ids that vanished or fail `predicate`. A dropped primary is replaced by `fallbackPrimary`
   * (an id, or a function of the former primary; added to the set when absent), else by document order.
   * An empty result selects the root.
   */
  function prune(sel, root, predicate = () => true, { fallbackPrimary } = {}) {
    const kept = sel.ids.filter(id => findNode(root, id) && predicate(id));
    if (sel.primaryId && kept.includes(sel.primaryId)) return { ids: kept, primaryId: sel.primaryId };
    const fallback = typeof fallbackPrimary === 'function' ? fallbackPrimary(sel.primaryId) : fallbackPrimary;
    if (fallback && findNode(root, fallback)) return { ids: kept.includes(fallback) ? kept : kept.concat(fallback), primaryId: fallback };
    if (!kept.length) return { ids: [root.id], primaryId: root.id };
    return { ids: kept, primaryId: firstInDoc(root, kept) };
  }
  /** Pointerdown on a node → which operation the modifiers and current membership call for. */
  function resolvePress({ meta = false, shift = false, isMember = false, isMulti = false, sameParent = false } = {}) {
    if (meta) return 'toggle';
    if (shift) return sameParent ? 'addRange' : 'add';
    if (isMember && isMulti) return 'keep';
    return 'replace';
  }

  /* ---------------------------------------------------------------- structural units */
  /**
   * Selected nodes with no selected ancestor, in document order, each { id, node, parent, index }.
   * When the map root is selected together with other nodes it does not count as an ancestor: the effective roots are
   * every selected node whose only selected ancestor is the root. The root itself is a root only when it is selected alone.
   */
  function selectionRoots(root, ids) {
    const want = new Set(ids);
    if (want.has(root.id) && want.size === 1) return [{ id: root.id, node: root, parent: null, index: -1 }];
    const roots = [];
    (function walk(node, parent, index, underSelected) {
      const selected = want.has(node.id) && node !== root;
      if (selected && !underSelected) roots.push({ id: node.id, node, parent, index });
      (node.children || []).forEach((c, i) => walk(c, node, i, underSelected || selected));
    })(root, null, -1, false);
    return roots;
  }
  /** Ids of a subtree (the node and every descendant), document order. */
  function subtreeIds(node) {
    const out = [];
    (function walk(n) { out.push(n.id); for (const c of n.children || []) walk(c); })(node);
    return out;
  }
  /**
   * The selection as a copy filter. Returns `node` itself when nothing below it is selected (its whole subtree
   * travels, so a single-node copy is byte-identical to before); otherwise a shallow copy keeping only the children
   * that are selected or hold a selected descendant — unselected path nodes come along, their unselected siblings
   * do not — each child filtered the same way. Never mutates the tree.
   */
  function copiedSubtree(node, ids) {
    const want = new Set(ids);
    const holds = new Set();                                  // nodes with a selected node somewhere below them
    (function mark(n) {
      let any = false;
      for (const c of n.children || []) if (mark(c) || want.has(c.id)) any = true;
      if (any) holds.add(n);
      return any;
    })(node);
    return (function filter(n) {
      if (!holds.has(n)) return n;
      return { ...n, children: n.children.filter(c => want.has(c.id) || holds.has(c)).map(filter) };
    })(node);
  }

  /**
   * Move the units (non-root nodes with their subtrees) so they sit as the last children of `targetId` ('onto')
   * or as a contiguous run right before/after it among its siblings. Mutates the tree in place and returns
   * { newParent, target, zone, units, entered, left } — `units` as [{ id, node, oldParent, oldIndex }] in document order,
   * `entered` the units that now need first-level side/color, `left` the units that stopped being first-level —
   * or null when the move is rejected or would change nothing (the tree is then untouched).
   */
  function planMove(root, unitIds, targetId, zone) {
    const ordered = documentOrder(root, unitIds);
    const units = ordered.map(id => findNode(root, id)).filter(u => u && u.parent);
    if (!units.length) return null;
    const target = findNode(root, targetId);
    if (!target) return null;
    for (const u of units) if (findNode(u.node, targetId)) return null;         // target inside a dragged unit
    const onto = zone === 'onto';
    if (onto && units.every(u => u.parent === target.node)) return null;        // already exactly its children
    if (!onto && !target.parent) return null;                                   // the root has no peers
    const newParent = onto ? target.node : target.parent;

    const unitNodes = new Set(units.map(u => u.node));
    const parents = new Set(units.map(u => u.parent));
    parents.add(newParent);
    const plan = new Map();
    for (const p of parents) plan.set(p, p.children.filter(c => !unitNodes.has(c)));
    const into = plan.get(newParent);
    const at = onto ? into.length : into.indexOf(target.node) + (zone === 'after' ? 1 : 0);
    into.splice(at, 0, ...units.map(u => u.node));
    const sameChildren = (p, next) => next.length === p.children.length && next.every((c, i) => c === p.children[i]);
    if ([...plan].every(([p, next]) => sameChildren(p, next))) return null;

    for (const [p, next] of plan) { p.children.length = 0; p.children.push(...next); }
    const moved = units.map(u => ({ id: u.id, node: u.node, oldParent: u.parent, oldIndex: u.index }));
    const atRoot = newParent === root;
    // a beside-drop at the root re-sides every unit to the target's side; a nest keeps units that were already first-level
    const entered = atRoot ? moved.filter(u => !onto || u.oldParent !== root) : [];
    const left = moved.filter(u => u.oldParent === root && !atRoot);
    return { newParent, target, zone, units: moved, entered, left };
  }

  /** Where the selection lands after deleting the units: from the first unit in document order — next surviving sibling, previous, else parent. */
  function nextSelectionAfterDelete(root, unitIds) {
    const ordered = documentOrder(root, unitIds);
    const gone = new Set(ordered);
    const first = ordered.map(id => findNode(root, id)).find(u => u && u.parent);
    if (!first) return root.id;
    const kids = first.parent.children;
    for (let i = first.index + 1; i < kids.length; i++) if (!gone.has(kids[i].id)) return kids[i].id;
    for (let i = first.index - 1; i >= 0; i--) if (!gone.has(kids[i].id)) return kids[i].id;
    return first.parent.id;
  }

  /* ---------------------------------------------------------------- first-level balance */
  function countNodes(node) { let n = 0; (function walk(x) { n++; for (const c of x.children || []) walk(c); })(node); return n; }
  /** Side of the root with fewer nodes (ties → 'R'); `exclude` = first-level nodes not yet sided, which must not count. */
  function emptierSide(root, exclude = null) {
    let l = 0, r = 0;
    for (const c of root.children) {
      if (exclude && exclude.has(c)) continue;
      const size = countNodes(c);
      if (c.side === 'L') l += size; else r += size;
    }
    return r <= l ? 'R' : 'L';
  }

  /* ---------------------------------------------------------------- node-level style */
  /** Merge a patch into a style set, dropping defaulted keys; undefined when nothing remains. */
  function applyStylePatch(style, patch) {
    const next = { ...(style || {}), ...patch };
    for (const k of Object.keys(next)) if (next[k] === undefined || next[k] === false || next[k] === null || next[k] === '') delete next[k];
    return Object.keys(next).length ? next : undefined;
  }

  /* ---------------------------------------------------------------- node clipboard payload */
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
  /** v1 { node } and v2 { nodes[] } payloads are both accepted; `outline` optional string. */
  function isValidClipPayload(p) {
    if (!p || !Number.isFinite(p.at) || (p.outline !== undefined && typeof p.outline !== 'string')) return false;
    if (p.v === 1) return isValidClipNode(p.node);
    if (p.v === 2) return Array.isArray(p.nodes) && p.nodes.length >= 1 && p.nodes.every(isValidClipNode);
    return false;
  }
  /** Any valid payload as v2; null otherwise. */
  function normalizeClipPayload(p) {
    if (!isValidClipPayload(p)) return null;
    if (p.v === 2) return p;
    const out = { v: 2, at: p.at, nodes: [p.node] };
    if (typeof p.outline === 'string') out.outline = p.outline;
    return out;
  }
  /** Outlines of several roots as one text: single LF between, none trailing. */
  function joinOutlines(outlines) { return outlines.join('\n'); }

  /* ---------------------------------------------------------------- marquee */
  /** Ids of layout boxes ({ id, x, y, w, h } — x/y centers) that intersect the rectangle (any corner order). */
  function rectHits(boxes, { x0, y0, x1, y1 }) {
    const l = Math.min(x0, x1), r = Math.max(x0, x1), t = Math.min(y0, y1), b = Math.max(y0, y1);
    const out = [];
    for (const n of boxes) {
      const nl = n.x - n.w / 2, nr = n.x + n.w / 2, nt = n.y - n.h / 2, nb = n.y + n.h / 2;
      if (nr >= l && nl <= r && nb >= t && nt <= b) out.push(n.id);
    }
    return out;
  }

  return {
    findNode, documentOrder, ancestorsOf, isRendered, renderedAncestor,
    replace, toggle, add, addRange, set, prune, resolvePress,
    selectionRoots, subtreeIds, copiedSubtree, planMove, nextSelectionAfterDelete, emptierSide,
    applyStylePatch,
    isValidMarks, isValidClipNode, isValidClipPayload, normalizeClipPayload, joinOutlines,
    rectHits,
  };
})();
