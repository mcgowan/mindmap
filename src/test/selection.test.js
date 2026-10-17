// SelectionCore tests: selection algebra, structural units, move planning, clipboard payload, marquee math.
// selection.js is DOM-free and loads like store.js; app.js wiring is asserted on source text where it is textual.
// Run with `npm test` from src/.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = (...p) => fs.readFileSync(path.join(__dirname, '..', ...p), 'utf8');
vm.runInThisContext(read('js', 'selection.js'), { filename: 'selection.js' });
const S = vm.runInThisContext('SelectionCore');

/* ---------- fixtures ---------- */
// root
// ├─ A (R)      ├─ a1  ├─ a2 ─ a2x
// ├─ B (L)      ├─ b1
// └─ C (R)
const N = (id, children = [], extra = {}) => ({ id, text: id, children, ...extra });
function tree() {
  return N('root', [
    N('A', [N('a1'), N('a2', [N('a2x')])], { side: 'R', color: 0 }),
    N('B', [N('b1')], { side: 'L', color: 1 }),
    N('C', [], { side: 'R', color: 2 }),
  ]);
}
const ids = t => t.children.map(c => c.id);
const sel = (ids, primaryId = ids[0] || null) => ({ ids, primaryId });

/* ---------- algebra ---------- */
test('replace: one node as primary; null clears', () => {
  const t = tree();
  assert.deepEqual(S.replace(sel(['A', 'B']), t, 'C'), { ids: ['C'], primaryId: 'C' });
  assert.deepEqual(S.replace(sel(['A']), t, null), { ids: [], primaryId: null });
});

test('toggle: adds as primary, removes, never empties, primary falls back in document order', () => {
  const t = tree();
  let s = S.toggle(sel(['A']), t, 'C');
  assert.deepEqual(s, { ids: ['A', 'C'], primaryId: 'C' });
  s = S.toggle(s, t, 'C');                                   // remove the primary → A is the only one left
  assert.deepEqual(s, { ids: ['A'], primaryId: 'A' });
  assert.deepEqual(S.toggle(sel(['A']), t, 'A'), { ids: ['A'], primaryId: 'A' }, 'last remaining stays selected');
  s = S.toggle(S.toggle(sel(['C']), t, 'a1'), t, 'C');       // C was primary, removed → a1 (first in doc order of the rest)
  assert.deepEqual(s, { ids: ['a1'], primaryId: 'a1' });
  s = S.toggle({ ids: ['C', 'B', 'A'], primaryId: 'C' }, t, 'C');
  assert.equal(s.primaryId, 'A', 'fallback is document order, not insertion order');
});

test('add: keeps the primary; sets it only when the set was empty', () => {
  const t = tree();
  assert.deepEqual(S.add(sel(['A']), t, 'C'), { ids: ['A', 'C'], primaryId: 'A' });
  assert.deepEqual(S.add(sel([]), t, 'C'), { ids: ['C'], primaryId: 'C' });
  assert.deepEqual(S.add(sel(['A']), t, 'A'), { ids: ['A'], primaryId: 'A' });
});

test('addRange: siblings by parent.children index, both directions, across root L/R sides', () => {
  const t = tree();
  assert.deepEqual(S.addRange(sel(['A']), t, 'A', 'C'), { ids: ['A', 'B', 'C'], primaryId: 'A' });
  assert.deepEqual(S.addRange(sel(['C']), t, 'C', 'A'), { ids: ['C', 'A', 'B'], primaryId: 'C' }, 'backward range adds in index order');
  assert.deepEqual(S.addRange(sel(['a1']), t, 'a1', 'B'), { ids: ['a1', 'B'], primaryId: 'a1' }, 'different parent → plain add');
  assert.deepEqual(S.addRange(sel(['A']), t, 'A', 'nope'), { ids: ['A'], primaryId: 'A' }, 'unknown target → unchanged');
});

test('set: requested primary, else previous when still present, else first in document order; empty clears', () => {
  const t = tree();
  assert.deepEqual(S.set(sel(['B']), t, ['C', 'A', 'B']), { ids: ['C', 'A', 'B'], primaryId: 'B' });
  assert.deepEqual(S.set(sel(['b1']), t, ['C', 'A']), { ids: ['C', 'A'], primaryId: 'A' });
  assert.deepEqual(S.set(sel(['b1']), t, ['C', 'A'], { primary: 'C' }), { ids: ['C', 'A'], primaryId: 'C' });
  assert.deepEqual(S.set(sel(['b1']), t, ['C', 'C', null]), { ids: ['C'], primaryId: 'C' }, 'dedupes and drops blanks');
  assert.deepEqual(S.set(sel(['b1']), t, []), { ids: [], primaryId: null });
});

test('prune: drops vanished or failing ids; fallbackPrimary as id or function; empty → root', () => {
  const t = tree();
  assert.deepEqual(S.prune(sel(['A', 'zzz', 'C'], 'A'), t), { ids: ['A', 'C'], primaryId: 'A' });
  assert.deepEqual(S.prune(sel(['A', 'C'], 'A'), t, id => id !== 'A'), { ids: ['C'], primaryId: 'C' });
  assert.deepEqual(S.prune(sel(['a2x', 'C'], 'a2x'), t, id => id !== 'a2x', { fallbackPrimary: 'A' }), { ids: ['C', 'A'], primaryId: 'A' });
  assert.deepEqual(S.prune(sel(['a2x'], 'a2x'), t, () => false, { fallbackPrimary: former => (former === 'a2x' ? 'a2' : null) }), { ids: ['a2'], primaryId: 'a2' });
  assert.deepEqual(S.prune(sel(['a2x'], 'a2x'), t, () => false), { ids: ['root'], primaryId: 'root' });
  assert.deepEqual(S.prune(sel(['A'], 'A'), t, () => false, { fallbackPrimary: 'nope' }), { ids: ['root'], primaryId: 'root' }, 'unknown fallback is ignored');
});

test('resolvePress truth table', () => {
  assert.equal(S.resolvePress({}), 'replace');
  assert.equal(S.resolvePress({ isMember: true, isMulti: false }), 'replace');
  assert.equal(S.resolvePress({ isMember: true, isMulti: true }), 'keep');
  assert.equal(S.resolvePress({ meta: true, shift: true, isMember: true, isMulti: true }), 'toggle', 'meta wins');
  assert.equal(S.resolvePress({ shift: true, sameParent: true }), 'addRange');
  assert.equal(S.resolvePress({ shift: true, sameParent: false }), 'add');
});

test('isRendered / renderedAncestor follow collapsed ancestors', () => {
  const t = tree();
  assert.equal(S.isRendered(t, 'a2x'), true);
  t.children[0].collapsed = true;                            // A collapsed hides a1, a2, a2x
  assert.equal(S.isRendered(t, 'a2x'), false);
  assert.equal(S.isRendered(t, 'A'), true);
  assert.equal(S.renderedAncestor(t, 'a2x'), 'A');
  t.children[0].children[1].collapsed = true;                // a2 also collapsed: the outermost (A) is what is rendered
  assert.equal(S.renderedAncestor(t, 'a2x'), 'A');
  assert.equal(S.renderedAncestor(t, 'A'), null);
});

/* ---------- structural units ---------- */
test('selectionRoots: ancestor absorbs descendants; document order; the root never counts as an ancestor when selected with others', () => {
  const t = tree();
  assert.deepEqual(S.selectionRoots(t, ['a2x', 'A']).map(u => u.id), ['A']);
  assert.deepEqual(S.selectionRoots(t, ['C', 'a1', 'B']).map(u => u.id), ['a1', 'B', 'C']);
  assert.deepEqual(S.selectionRoots(t, ['root', 'B', 'C']).map(u => u.id), ['B', 'C'], 'root + children → the children');
  assert.deepEqual(S.selectionRoots(t, ['root']).map(u => u.id), ['root'], 'the root alone is the unit');
  assert.deepEqual(S.selectionRoots(t, ['A', 'a2x', 'C']).map(u => u.id), ['A', 'C'], 'deep cross-level selection');
  assert.deepEqual(S.selectionRoots(t, ['root', 'a2x']).map(u => u.id), ['a2x'], 'a deeper member with no selected non-root ancestor is a unit');
  assert.deepEqual(S.selectionRoots(t, ['root', 'A', 'a2x']).map(u => u.id), ['A'], 'a2x sits under selected A');
  assert.deepEqual(S.selectionRoots(t, ['root', 'a1', 'b1']).map(u => u.id), ['a1', 'b1'], 'document order across branches');
});

test('documentOrder and subtreeIds', () => {
  const t = tree();
  assert.deepEqual(S.documentOrder(t, ['C', 'a2x', 'zzz', 'A']), ['A', 'a2x', 'C']);
  assert.deepEqual(S.subtreeIds(t.children[0]), ['A', 'a1', 'a2', 'a2x']);
});

/* ---------- copied subtree: the selection as a copy filter (fix-copy-selected-nodes-only) ---------- */
// P ─ A ─ G, H
//   ─ B
//   ─ C
const shape = n => ({ id: n.id, children: (n.children || []).map(shape) });
const pTree = () => N('P', [N('A', [N('G'), N('H')]), N('B'), N('C')]);

test('copiedSubtree: parent + one child selected → only that child, whole (P{A} with A intact)', () => {
  const P = pTree();
  const out = S.copiedSubtree(P, ['P', 'A']);
  assert.deepEqual(shape(out), { id: 'P', children: [{ id: 'A', children: [{ id: 'G', children: [] }, { id: 'H', children: [] }] }] });
  assert.equal(out.children[0], P.children[0], 'A has no selected descendant: its own subtree travels as-is');
  assert.deepEqual(shape(P), shape(pTree()), 'the map is untouched');
});

test('copiedSubtree: no selected descendant → the node itself (single-node payload unchanged)', () => {
  const P = pTree();
  assert.equal(S.copiedSubtree(P, ['P']), P);
  assert.equal(S.copiedSubtree(P, []), P);
  assert.equal(S.copiedSubtree(P, ['P', 'zzz']), P, 'unknown ids do not filter');
});

test('copiedSubtree: a skipped generation comes along as the path; its unselected children do not', () => {
  const out = S.copiedSubtree(pTree(), ['P', 'G']);
  assert.deepEqual(shape(out), { id: 'P', children: [{ id: 'A', children: [{ id: 'G', children: [] }] }] });
});

test('copiedSubtree: keeps every node field except the filtered children; collapsed survives for the outline', () => {
  const P = pTree();
  P.collapsed = true; P.text = 'parent'; P.style = { bold: true };
  const out = S.copiedSubtree(P, ['P', 'B']);
  assert.equal(out.collapsed, true);
  assert.equal(out.text, 'parent');
  assert.deepEqual(out.style, { bold: true });
  assert.deepEqual(out.children.map(c => c.id), ['B']);
});

test('copiedSubtree: siblings selected together keep document order regardless of selection order', () => {
  const out = S.copiedSubtree(pTree(), ['C', 'P', 'A']);
  assert.deepEqual(out.children.map(c => c.id), ['A', 'C']);
});

test('copiedSubtree over selectionRoots: unrelated roots filter independently; the map root is never copied', () => {
  const t = tree();
  const roots = S.selectionRoots(t, ['A', 'a1', 'B']).map(u => S.copiedSubtree(u.node, ['A', 'a1', 'B']));
  assert.deepEqual(roots.map(shape), [{ id: 'A', children: [{ id: 'a1', children: [] }] }, { id: 'B', children: [{ id: 'b1', children: [] }] }]);
  const withRoot = S.selectionRoots(t, ['root', 'A', 'a2x']).map(u => S.copiedSubtree(u.node, ['root', 'A', 'a2x']));
  assert.deepEqual(withRoot.map(shape), [{ id: 'A', children: [{ id: 'a2', children: [{ id: 'a2x', children: [] }] }] }]);
});

test('outline of a copied subtree: one line per copied node, none for a filtered-out node (P\\n    A)', () => {
  // outlineText lives inside app.js's IIFE; lift its source so the outline is exercised, not just regex-matched
  const app = read('js', 'app.js');
  const start = app.indexOf('function outlineText(node) {');
  assert.ok(start >= 0, 'outlineText is where the lift expects it');
  const src = app.slice(start, app.indexOf('\n  }\n', start) + 4);
  const indent = /const OUTLINE_INDENT = '([^']+)'/.exec(app)[1];
  const outlineText = new Function('OUTLINE_INDENT', `${src}; return outlineText;`)(indent);
  assert.equal(outlineText(S.copiedSubtree(pTree(), ['P', 'A'])), 'P\n    A\n        G\n        H');
  assert.equal(outlineText(S.copiedSubtree(pTree(), ['P', 'G'])), 'P\n    A\n        G', 'the path node keeps its level; H, B, C have no line');
  assert.equal(outlineText(S.copiedSubtree(pTree(), ['P'])), 'P\n    A\n        G\n        H\n    B\n    C');
});

test('planMove onto: units appended in document order, subtrees intact, entered/left reported for the caller', () => {
  const t = tree();
  const r = S.planMove(t, ['C', 'a1'], 'B', 'onto');
  assert.ok(r);
  assert.equal(r.newParent.id, 'B');
  assert.deepEqual(ids(r.newParent), ['b1', 'a1', 'C']);
  assert.deepEqual(ids(t.children[0]), ['a2']);
  assert.deepEqual(ids(t), ['A', 'B']);
  assert.deepEqual(r.units.map(u => [u.id, u.oldParent.id, u.oldIndex]), [['a1', 'A', 0], ['C', 'root', 2]]);
  assert.deepEqual(r.entered, []);
  assert.deepEqual(r.left.map(u => u.id), ['C']);
});

test('planMove onto the root: units already first-level are re-appended but not re-sided', () => {
  const t = tree();
  const r = S.planMove(t, ['A', 'b1'], 'root', 'onto');
  assert.ok(r);
  assert.deepEqual(ids(t), ['B', 'C', 'A', 'b1']);
  assert.deepEqual(r.entered.map(u => u.id), ['b1']);
  assert.deepEqual(r.left, []);
});

test('planMove keeps relative depth of a cross-level selection: only the root of the unit moves', () => {
  const t = tree();
  const r = S.planMove(t, ['A'], 'C', 'onto');          // caller already reduced [A, a2x] to roots → [A]
  assert.ok(r);
  const A = r.newParent.children[0];
  assert.equal(A.id, 'A');
  assert.deepEqual(ids(A), ['a1', 'a2']);
  assert.deepEqual(ids(A.children[1]), ['a2x']);
});

test('planMove before/after: contiguous run at the right index after detaching a preceding sibling', () => {
  let t = tree();
  let r = S.planMove(t, ['A', 'b1'], 'C', 'before');
  assert.ok(r);
  assert.deepEqual(ids(t), ['B', 'A', 'b1', 'C']);
  assert.deepEqual(ids(t.children[0]), []);
  assert.deepEqual(r.entered.map(u => u.id), ['A', 'b1'], 'a beside-drop at the root re-sides every unit');
  t = tree();
  r = S.planMove(t, ['A'], 'B', 'after');
  assert.ok(r);
  assert.deepEqual(ids(t), ['B', 'A', 'C']);
  t = tree();
  r = S.planMove(t, ['C'], 'A', 'before');
  assert.ok(r);
  assert.deepEqual(ids(t), ['C', 'A', 'B']);
});

test('planMove rejections leave the tree untouched and return null', () => {
  const t = tree();
  const before = JSON.stringify(t);
  assert.equal(S.planMove(t, ['A'], 'a2x', 'onto'), null, 'target inside a unit');
  assert.equal(S.planMove(t, ['A'], 'A', 'before'), null, 'target is the unit');
  assert.equal(S.planMove(t, ['a1', 'a2'], 'A', 'onto'), null, 'target already parent of every unit');
  assert.equal(S.planMove(t, ['A'], 'root', 'before'), null, 'root has no peers');
  assert.equal(S.planMove(t, ['root'], 'A', 'onto'), null, 'the root is never a unit');
  assert.equal(S.planMove(t, ['A'], 'zzz', 'onto'), null, 'unknown target');
  assert.equal(S.planMove(t, ['A'], 'B', 'before'), null, 'no-op: A already sits right before B');
  assert.equal(S.planMove(t, ['B'], 'A', 'after'), null, 'no-op: B already sits right after A');
  assert.equal(S.planMove(t, ['A', 'B'], 'C', 'before'), null, 'no-op: the run already precedes C');
  assert.equal(JSON.stringify(t), before);
});

test('planMove single unit matches the legacy reparent/moveBeside outcomes', () => {
  let t = tree();
  S.planMove(t, ['a1'], 'C', 'onto');
  assert.deepEqual(ids(t.children[2]), ['a1']);
  t = tree();
  const r = S.planMove(t, ['a1'], 'B', 'after');
  assert.deepEqual(ids(t), ['A', 'B', 'a1', 'C']);
  assert.equal(r.newParent.id, 'root');
});

test('nextSelectionAfterDelete: next surviving sibling → previous → parent; from the first unit in document order', () => {
  const t = tree();
  assert.equal(S.nextSelectionAfterDelete(t, ['A']), 'B');
  assert.equal(S.nextSelectionAfterDelete(t, ['B', 'A']), 'C', 'next sibling also deleted → skip to the survivor');
  assert.equal(S.nextSelectionAfterDelete(t, ['C']), 'B');
  assert.equal(S.nextSelectionAfterDelete(t, ['A', 'B', 'C']), 'root');
  assert.equal(S.nextSelectionAfterDelete(t, ['a2x']), 'a2');
  assert.equal(S.nextSelectionAfterDelete(t, ['a2x', 'C']), 'a2', 'first unit in document order decides');
  assert.equal(S.nextSelectionAfterDelete(t, ['root']), 'root');
});

/* ---------- first-level balance ---------- */
test('emptierSide: a unit already inserted at the root must be excluded while its own side is chosen (R1)', () => {
  // L = 3 nodes, R = 3 nodes, then the dragged unit (side undefined, counted as R) already sits in root.children
  const unit = N('u');
  const t = N('root', [N('L1', [N('l1a'), N('l1b')], { side: 'L' }), N('Rt', [N('r1a'), N('r1b')], { side: 'R' }), unit]);
  assert.equal(S.emptierSide(t), 'L', 'counted as R while unsided, the unit biases its own choice');
  assert.equal(S.emptierSide(t, new Set([unit])), 'R', 'excluded, the tie resolves to R like the legacy reparent');
  assert.equal(S.emptierSide(N('root', [N('A', [], { side: 'L' })])), 'R');
  const app = read('js', 'app.js');
  const loop = app.slice(app.indexOf('for (const u of r.entered)'), app.indexOf('for (const u of r.left)'));
  assert.ok(loop.indexOf('chooseSide(pending)') < loop.indexOf('pending.delete(u.node)'), 'moveUnits chooses the side before releasing the unit from `pending`');
});

/* ---------- style ---------- */test('applyStylePatch drops defaulted keys and returns undefined when empty', () => {
  assert.deepEqual(S.applyStylePatch({ bg: '#fff', bold: true }, { bold: false, color: '#000' }), { bg: '#fff', color: '#000' });
  assert.equal(S.applyStylePatch({ bold: true }, { bold: false }), undefined);
  assert.equal(S.applyStylePatch(undefined, { bg: '', color: null, strike: undefined }), undefined);
  assert.deepEqual(S.applyStylePatch(undefined, { bold: true }), { bold: true });
});

/* ---------- clipboard payload ---------- */
const clipNode = (text = 'x', children = []) => ({ text, children });
test('clipboard: v1 payloads upgrade to v2 on read; v2 written shape validated', () => {
  const v1 = { v: 1, at: 5, node: clipNode('a', [clipNode('b')]), outline: 'a\n    b' };
  assert.equal(S.isValidClipPayload(v1), true);
  assert.deepEqual(S.normalizeClipPayload(v1), { v: 2, at: 5, nodes: [v1.node], outline: 'a\n    b' });
  const v1NoOutline = { v: 1, at: 5, node: clipNode('a') };
  assert.deepEqual(S.normalizeClipPayload(v1NoOutline), { v: 2, at: 5, nodes: [v1NoOutline.node] });
  const v2 = { v: 2, at: 6, nodes: [clipNode('a'), clipNode('b')] };
  assert.equal(S.isValidClipPayload(v2), true);
  assert.equal(S.normalizeClipPayload(v2), v2);
});

test('clipboard: invalid payloads read as null', () => {
  assert.equal(S.normalizeClipPayload(null), null);
  assert.equal(S.normalizeClipPayload({ v: 2, at: 1, nodes: [] }), null, 'empty nodes');
  assert.equal(S.normalizeClipPayload({ v: 2, at: 1, nodes: 'x' }), null, 'nodes not an array');
  assert.equal(S.normalizeClipPayload({ v: 2, at: 1, nodes: [clipNode('a', [{ text: 1, children: [] }])] }), null, 'bad child');
  assert.equal(S.normalizeClipPayload({ v: 2, at: 1, nodes: [{ text: 'a', children: [], style: 'bold' }] }), null, 'style must be an object');
  assert.equal(S.normalizeClipPayload({ v: 2, at: 1, nodes: [{ text: 'a', children: [], marks: [{ s: 2, e: 1 }] }] }), null, 'marks whitelist');
  assert.equal(S.normalizeClipPayload({ v: 3, at: 1, nodes: [clipNode()] }), null, 'unknown version');
  assert.equal(S.normalizeClipPayload({ v: 2, at: 'now', nodes: [clipNode()] }), null, 'at must be a number');
  assert.equal(S.normalizeClipPayload({ v: 2, at: 1, nodes: [clipNode()], outline: 7 }), null, 'outline must be a string');
});

test('joinOutlines: one outline is identity; several join with a single LF and no trailing LF', () => {
  assert.equal(S.joinOutlines(['a\n    b']), 'a\n    b');
  assert.equal(S.joinOutlines(['a\n    b', 'c']), 'a\n    b\nc');
});

/* ---------- marquee ---------- */
test('rectHits: AABB intersection in any corner order; edge touch counts; containment counts', () => {
  const boxes = [
    { id: 'p', x: 0, y: 0, w: 100, h: 40 },      // spans x -50..50, y -20..20
    { id: 'q', x: 200, y: 0, w: 100, h: 40 },    // spans x 150..250
    { id: 'r', x: 0, y: 200, w: 10, h: 10 },
  ];
  assert.deepEqual(S.rectHits(boxes, { x0: -60, y0: -30, x1: 60, y1: 30 }), ['p'], 'containment');
  assert.deepEqual(S.rectHits(boxes, { x0: 60, y0: 30, x1: -60, y1: -30 }), ['p'], 'reversed corners');
  assert.deepEqual(S.rectHits(boxes, { x0: 40, y0: 0, x1: 160, y1: 5 }), ['p', 'q'], 'partial overlap of two');
  assert.deepEqual(S.rectHits(boxes, { x0: 50, y0: 0, x1: 100, y1: 5 }), ['p'], 'edge touch');
  assert.deepEqual(S.rectHits(boxes, { x0: 60, y0: 50, x1: 100, y1: 100 }), []);
});

/* ---------- wiring ---------- */
test('both skins load selection.js before app.js', () => {
  for (const page of ['index.html', 'tactical.html']) {
    const html = read(page);
    const selAt = html.indexOf('js/selection.js'), appAt = html.indexOf('js/app.js');
    assert.ok(selAt > -1, `${page} loads selection.js`);
    assert.ok(selAt < appAt, `${page} loads selection.js before app.js`);
  }
});

test('app.js owns no second copy of the clipboard whitelist or findNode', () => {
  const app = read('js', 'app.js');
  assert.doesNotMatch(app, /function isValidMarks\b/);
  assert.doesNotMatch(app, /function isValidClipNode\b/);
  assert.doesNotMatch(app, /function isValidClipPayload\b/);
  assert.doesNotMatch(app, /function findNode\b/);
  assert.match(app, /SelectionCore\.normalizeClipPayload\(/, 'readNodeClip validates and upgrades through SelectionCore');
});

/* ---------- Phase 3 wiring: group operations (source-text contracts) ---------- */
test('style operations run through mutateNodes with one undo step and a reference node', () => {
  const app = read('js', 'app.js');
  assert.match(app, /function mutateNodes\(ids, mutate\)/);
  assert.match(app, /function toggleStyleMany\(ids, key, refId\) \{ setStyleMany\(ids, \{ \[key\]: !getStyle\(refId\)\[key\] \}\); \}/, 'the reference flag is read once');
  assert.match(app, /toggleStyleMany\(Selection\.ids\(\), 'bold', id\)/);
  assert.match(app, /pasteStyleMany\(Selection\.ids\(\)\)/);
  assert.match(app, /disabled = !state\.selectedIds\.some\(isStyled\)/, 'clear is disabled only when no selected node is styled');
  assert.match(app, /SelectionCore\.applyStylePatch\(node\.style, patch\)/);
});

test('moveUnits snapshots before planMove and pushes the undo step only on a real move', () => {
  const app = read('js', 'app.js');
  const start = app.indexOf('function moveUnits(');
  const body = app.slice(start, app.indexOf('\n  }\n', start));
  assert.ok(body.indexOf('const snap = snapshot()') < body.indexOf('SelectionCore.planMove('), 'snapshot precedes planMove');
  assert.ok(body.indexOf('if (!r) return false') < body.indexOf('pushUndo(snap)'), 'rejection returns before pushUndo');
  assert.match(app, /commit && target && moveUnits\(unitIds, target\.id, target\.zone\)/);
  assert.match(app, /const extra = nodeDrag\.subtree\.size - 1/);
});

test('delete, collapse and clipboard act on the selection', () => {
  const app = read('js', 'app.js');
  assert.match(app, /SelectionCore\.nextSelectionAfterDelete\(state\.map\.root, units\.map\(u => u\.id\)\)/);
  assert.match(app, /key === 'Backspace' \|\| key === 'Delete'\) \{ e\.preventDefault\(\); deleteSelection\(\)/);
  assert.match(app, /mod && key === '\/'\) \{ e\.preventDefault\(\); toggleCollapseSelection\(\)/);
  assert.match(app, /Selection\.size\(\) > 1\) toggleCollapseSelection\(id\); else toggleCollapse\(id\)/, 'a badge click names its own node as the reference');
  assert.match(app, /const named = \[refId, state\.primaryId\]\.find\(/, 'the badge node outranks the primary as reference');
  assert.match(app, /const payload = \{ v: 2, at, nodes:/, 'writeNodeClip always writes v2');
  assert.match(app, /key\.toLowerCase\(\) === 'c'\) \{ e\.preventDefault\(\); copySelection\(\)/);
  assert.match(app, /function copySelection\(\) \{\s*copyNodes\(Selection\.roots\(\)\.map\(u => SelectionCore\.copiedSubtree\(u\.node, state\.selectedIds\)\)\);/, 'copy follows the effective roots (R2), each filtered by the selection (fix-copy-selected-nodes-only)');
  assert.match(app, /const outline = SelectionCore\.joinOutlines\(nodes\.map\(outlineText\)\);/, 'the outline is built from the same (filtered) trees as the node clipboard');
  assert.doesNotMatch(app, /const roots = op === 'keep'/, 'the empty-effective-roots drag fallback is gone (R2)');
  assert.match(app, /if \(internalWins\) \{ pasteClip\(id\); return; \}/);
});

/* ---------- Review R3: the armed style bar keeps its anchor across re-renders ---------- */
test('style bar latches its anchor member and only yields to the primary when that member leaves the selection', () => {
  const app = read('js', 'app.js');
  assert.match(app, /stylebarArmed = true; stylebarAnchorId = hoveredNodeId; updateStyleBar\(\)/, 'arming latches the hovered member');
  assert.match(app, /else \{ stylebarAnchorId = hoveredNodeId; updateStyleBar\(\); \}/, 'mouseover onto another member re-latches while armed');
  assert.match(app, /function disarmStylebar\(\) \{[^}]*stylebarAnchorId = null;/, 'disarming clears the latch');
  assert.match(app, /if \(stylebarAnchorId && !Selection\.has\(stylebarAnchorId\)\) stylebarAnchorId = null;/, 'an unselected latch is dropped');
  assert.match(app, /const anchorId = !editing && stylebarArmed && stylebarAnchorId \? stylebarAnchorId : id;/, 'updateStyleBar reads the latch, never the live hover');
  assert.doesNotMatch(app, /Selection\.has\(hoveredNodeId\) \? hoveredNodeId : id/, 'the old hover-derived anchor is gone');
});

/* ---------- Review R4 / R5 ---------- */
test('an empty selection survives a badge collapse; only undo/redo falls back to the root (R4)', () => {
  const app = read('js', 'app.js');
  assert.match(app, /function pruneToRendered\(\{ evenWhenEmpty = false, reveal = true \} = \{\}\) \{\s*if \(!state\.selectedIds\.length && !evenWhenEmpty\) return;/);
  assert.match(app, /pruneToRendered\(\{ evenWhenEmpty: true \}\)/, 'applySnapshot opts in');
  assert.equal((app.match(/pruneToRendered\(\{ evenWhenEmpty: true \}\)/g) || []).length, 1, 'nothing else opts in');
  assert.equal((app.match(/pruneToRendered\(\{ reveal: false \}\)/g) || []).length, 2, 'both collapse toggles leave the view where it is');
});

test('wheel input is ignored while a marquee is active (R5)', () => {
  const app = read('js', 'app.js');
  const wheel = app.slice(app.indexOf("addEventListener('wheel'"), app.indexOf('{ passive: false }'));
  assert.match(wheel, /e\.preventDefault\(\);\s*if \(marquee\) return;/);
});

/* ---------- Phase 4 wiring: chrome, skins, docs ---------- */
test('style bar carries a selection count in both skins and the help overlay documents a Select group', () => {
  const app = read('js', 'app.js'), css = read('css', 'styles.css'), tac = read('css', 'tactical.css');
  for (const page of ['index.html', 'tactical.html']) assert.match(read(page), /<span class="sb-count"[^>]*hidden><\/span>/, `${page} has the badge`);
  assert.match(css, /\.stylebar \.sb-count \{/);
  assert.match(tac, /\.stylebar \.sb-count \{/);
  assert.match(app, /count\.hidden = state\.selectedIds\.length <= 1/);
  assert.match(app, /\['Select', \[/, 'SHORTCUTS has a Select group');
  for (const row of ["[MOD, 'Click']", "['Shift', 'Click']", "['Shift', 'Drag']", "[MOD, 'A']"]) assert.ok(app.includes(row), `Select group lists ${row}`);
});

test('tactical HUD and README describe the selection set', () => {
  const tac = read('js', 'tactical.js'), readme = read('README.md');
  assert.match(tac, /selCount > 1 \? `\$\{selCount\} SELECTED/);
  assert.match(tac, /const sig = \[state\.selectedId, state\.selectedIds\.join\(\),/, 'HUD re-renders when the selection set changes');
  assert.match(readme, /## Selecting several nodes/);
  assert.match(readme, /`js\/selection\.js`/);
});

/* ---------- Phase 2 wiring: selection module, gestures, marquee (source-text contracts; app.js is DOM-bound) ---------- */
test('state.selectedId is an alias of the primary and the set lives in selectedIds', () => {
  const app = read('js', 'app.js');
  assert.match(app, /Object\.defineProperty\(state, 'selectedId'/);
  assert.match(app, /selectedIds: \[\]/);
  assert.match(app, /primaryId: null/);
  assert.doesNotMatch(app, /state\.selectedId\s*=\s*[^=]/, 'nothing assigns the alias directly');
});

test('pointerdown routes through SelectionCore.resolvePress and Cmd/Ctrl+A selects every rendered node', () => {
  const app = read('js', 'app.js');
  assert.match(app, /SelectionCore\.resolvePress\(\{/);
  assert.match(app, /key\.toLowerCase\(\) === 'a'\)/);
  assert.match(app, /Selection\.set\(state\.layout\.nodes\.map\(ln => ln\.id\)/);
  assert.match(app, /if \(e\.shiftKey\) \{ beginMarquee\(e\); return; \}/, 'Shift on the background starts a marquee instead of a pan');
  assert.match(app, /if \(marquee\) \{ e\.preventDefault\(\); e\.stopPropagation\(\); endMarquee\(false\); return; \}/, 'Escape cancels a marquee in the capture phase');
});

test('both skins style the primary marker by shape, hide handles in a multi-selection, and draw the marquee', () => {
  const css = read('css', 'styles.css'), tac = read('css', 'tactical.css');
  assert.match(css, /\.viewport\.multi-select \.node\.selected\.primary \{[^}]*0 0 0 7px var\(--ring\)/, 'doubled ring');
  assert.match(css, /\.viewport\.multi-select \.resize-handle \{ display: none; \}/);
  assert.match(css, /\.marquee \{ position: absolute; pointer-events: none;/);
  assert.match(tac, /\.viewport\.multi-select \.node\.selected\.primary::before[^{]*\{[^}]*border-width: 4px/, 'heavier brackets');
  assert.match(tac, /\.marquee \{/);
});
