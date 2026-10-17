// Layout tests: the DOM-free parts of js/layout.js (clamp + fit decision) load like selection.js;
// the measurement path and app.js gesture wiring are asserted on source text. Run with `npm test` from src/.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = (...p) => fs.readFileSync(path.join(__dirname, '..', ...p), 'utf8');
vm.runInThisContext(read('js', 'layout.js'), { filename: 'layout.js' });
const L = vm.runInThisContext('Layout');

/* ---------- clampWidth ---------- */
test('clampWidth: finite widths clamp to 80..800, anything else is automatic', () => {
  assert.equal(L.MIN_NODE_W, 80);
  assert.equal(L.MAX_NODE_W, 800);
  assert.equal(L.clampWidth(40), 80);
  assert.equal(L.clampWidth(300), 300);
  assert.equal(L.clampWidth(1200), 800);
  assert.equal(L.clampWidth(NaN), undefined);
  assert.equal(L.clampWidth(undefined), undefined);
  assert.equal(L.clampWidth('300'), undefined);
});

/* ---------- resolveFitWidth(current, fit, auto) ---------- */
test('fit <= auto: automatic sizing already yields one line → clear (or stay) automatic', () => {
  assert.equal(L.resolveFitWidth(undefined, 90, 90), undefined, 'short text, no custom width');
  assert.equal(L.resolveFitWidth(120, 90, 90), undefined, 'short text dragged narrow → back to auto');
  assert.equal(L.resolveFitWidth(undefined, 40, 40), undefined, 'below MIN: the fit <= auto path wins');
});

test('fit > auto: sets the one-line width, refits a dragged width', () => {
  assert.equal(L.resolveFitWidth(undefined, 520, 300), 520, 'long text, no custom width');
  assert.equal(L.resolveFitWidth(400, 520, 300), 520, 'dragged to 400 → refit');
});

test('already at the fit width: toggles back to automatic', () => {
  assert.equal(L.resolveFitWidth(520, 520, 300), undefined);
});

test('fit beyond MAX: caps at 800; already capped toggles back', () => {
  assert.equal(L.resolveFitWidth(undefined, 1200, 300), 800, 'very long text caps');
  assert.equal(L.resolveFitWidth(400, 1200, 300), 800, 'dragged wide, still under the cap → cap');
  assert.equal(L.resolveFitWidth(800, 1200, 300), undefined, 'at the cap → back to auto');
});

/* ---------- fitWidth measurement hygiene (source text — the measure element is shared with layout) ---------- */
function fnSource(src, name) {
  const start = src.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} is defined`);
  const end = src.indexOf('\n  }\n', start);
  assert.ok(end > start, `${name} closes at the IIFE's 2-space indentation`);
  return src.slice(start, end + 4);
}

test('fitWidth: single-line whitespace mode is set for the measurement and reset before returning; max-width lifted', () => {
  const src = read('js', 'layout.js');
  const fit = fnSource(src, 'fitWidth');
  const set = fit.indexOf("style.whiteSpace = 'pre'");   // pre, not nowrap: live nodes render pre-wrap, so runs of spaces must count
  const rect = fit.indexOf('getBoundingClientRect()');
  const reset = fit.indexOf("style.whiteSpace = ''");
  assert.ok(set >= 0 && rect > set && reset > rect, 'set → measure → reset, in that order');
  assert.ok(fit.includes("style.maxWidth = 'none'"), 'the 300px auto cap must not wrap the one-line measure');
  const prep = fnSource(src, 'prepareMeasureEl');
  for (const s of ["style.width = ''", "style.maxWidth = ''", "style.whiteSpace = ''"]) assert.ok(prep.includes(s), `prepareMeasureEl resets ${s}`);
});

test('fitWidth: cache key carries the fit| prefix plus depth, bold and marks, like measure()', () => {
  const fit = fnSource(read('js', 'layout.js'), 'fitWidth');
  assert.match(fit, /const key = 'fit\|' \+ depthClass\(depth\) \+ \(bold \? ' b ' : ' '\) \+ sig \+ '\|' \+ text/);
});

test('Layout exports measure, fitWidth and resolveFitWidth for app.js', () => {
  assert.equal(typeof L.measure, 'function');
  assert.equal(typeof L.fitWidth, 'function');
  assert.equal(typeof L.resolveFitWidth, 'function');
});

/* ---------- app.js gesture wiring (source text) ---------- */
test('endResize double-tap branch delegates to fitNodeWidth; the old reset-only guard is gone', () => {
  const end = fnSource(read('js', 'app.js'), 'endResize');
  const tap = end.slice(end.indexOf('lastHandleTap.t < RESIZE_TAP_MS'));
  assert.ok(tap.includes('fitNodeWidth(rd.id)'), 'second tap fits');
  assert.ok(!tap.includes('node.width !== undefined'), 'a node without a custom width is a valid fit target');
  assert.ok(!tap.includes('delete node.width'), 'the decision lives in fitNodeWidth, not inline');
});

test('fitNodeWidth: measures fit and auto, decides via resolveFitWidth, and records one undo step only when data changes', () => {
  const fn = fnSource(read('js', 'app.js'), 'fitNodeWidth');
  assert.ok(fn.includes('Layout.fitWidth(node.text, ln.depth, bold, node.marks)'));
  assert.ok(fn.includes('Layout.measure(node.text, ln.depth, bold, undefined, node.marks).w'));
  assert.ok(fn.includes('Layout.clampWidth(node.width)'), 'current is clamped before the decision');
  assert.ok(fn.includes('Layout.resolveFitWidth(current, fit, auto)'));
  const bail = fn.indexOf('if (next === current) return;');
  const undo = fn.indexOf('pushUndo()');
  assert.ok(bail >= 0 && undo > bail, 'the unchanged check precedes the single pushUndo');
  assert.equal(fn.split('pushUndo()').length - 1, 1, 'exactly one undo step');
  assert.ok(undo < fn.indexOf('persist()') && fn.indexOf('persist()') < fn.indexOf('relayout()'), 'undo → persist → relayout, as the drag commit does');
});

test('a handle double-tap never opens the editor: the fit is stamped and the following dblclick is ignored', () => {
  // dblclick fires after the second pointerup; by then the fit relayout has moved the node under the pointer,
  // so the handler's hit-test would land on the text — node-editing/Double-Click To Edit forbids editing here
  const app = read('js', 'app.js');
  const end = fnSource(app, 'endResize');
  const tap = end.slice(end.indexOf('lastHandleTap.t < RESIZE_TAP_MS'));
  assert.ok(tap.indexOf('lastHandleFitAt = now') >= 0 && tap.indexOf('lastHandleFitAt = now') < tap.indexOf('fitNodeWidth(rd.id)'), 'stamped before the fit relayouts');
  const dbl = app.slice(app.indexOf("el.viewport.addEventListener('dblclick'"));
  const guard = dbl.indexOf('performance.now() - lastHandleFitAt < DBLCLICK_MS) { lastHandleFitAt = -Infinity; return; }');
  assert.ok(guard >= 0 && guard < dbl.indexOf('startEdit('), 'the guard precedes the hit-test and startEdit, and consumes the stamp so exactly one dblclick is swallowed');
});
