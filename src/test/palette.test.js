// Style palette contract: the style bar's Fill and Text pickers draw on ONE constant
// (PALETTE) so they can never drift apart. app.js is DOM-bound and cannot be loaded
// in node, so the contract is asserted on the source text — same approach as
// stylebar.test.js. Run with `npm test` from src/.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (...p) => fs.readFileSync(path.join(__dirname, '..', ...p), 'utf8');
const app = read('js', 'app.js');

// Declarations of every rule whose selector list matches `selector` exactly, in order.
function declarationsOf(source, selector) {
  const out = [];
  const stripped = source.replace(/\/\*[\s\S]*?\*\//g, '');
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(stripped))) {
    const selectors = m[1].split(',').map(s => s.trim());
    if (selectors.includes(selector)) out.push(m[2]);
  }
  return out.join(';');
}

function paletteValues() {
  const decls = [...app.matchAll(/const PALETTE = Object\.freeze\(\[([^\]]*)\]\)/g)];
  assert.equal(decls.length, 1, `expected exactly one \`const PALETTE = Object.freeze([...])\`, found ${decls.length}`);
  return decls[0][1].split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
}

test('app.js declares a single PALETTE and no per-kind lists', () => {
  paletteValues();
  assert.doesNotMatch(app, /\bFILLS\b/, 'FILLS identifier still present');
  assert.doesNotMatch(app, /\bTEXT_COLORS\b/, 'TEXT_COLORS identifier still present');
});

test('PALETTE keeps the text palette: 11 unique lowercase hex values, same order', () => {
  const values = paletteValues();
  assert.equal(values.length, 11, `expected 11 colors, got ${values.length}`);
  assert.equal(new Set(values).size, values.length, 'duplicate palette entries');
  for (const v of values) assert.match(v, /^#[0-9a-f]{6}$/, `not lowercase #rrggbb: ${v}`);
  assert.equal(values[0], '#ef4444');
  assert.equal(values[values.length - 1], '#0f172a');
});

test('openStylePop offers PALETTE to both pickers (no per-kind ternary)', () => {
  const fn = /function openStylePop\(kind\) \{([\s\S]*?)\n  \}/.exec(app);
  assert.ok(fn, 'openStylePop(kind) not found');
  const line = /const swatches = ([^;]+);/.exec(fn[1]);
  assert.ok(line, 'no `const swatches =` line in openStylePop');
  assert.equal(line[1].trim(), 'PALETTE', `swatch list is ${line[1].trim()}`);
  assert.doesNotMatch(line[0], /kind === 'bg' \?/, 'swatch list still branches on kind');
});

test('fill indicator keeps a boundary independent of the fill, both skins', () => {
  assert.match(declarationsOf(read('css', 'styles.css'), '.sb-swatch'), /(^|;)\s*border\s*:\s*[\d.]+px\s+solid\s+/, 'styles.css .sb-swatch has no border');
  assert.match(declarationsOf(read('css', 'tactical.css'), '.sb-swatch'), /(^|;)\s*border(-color)?\s*:/, 'tactical.css .sb-swatch has no border-color');
});
