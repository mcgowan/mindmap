// Style bar CSS contract: the text-color indicator (.sb-a) keeps a ring that does
// not depend on the chosen color, so a color equal to the bar background
// (#ffffff light, #0f172a dark/tactical) cannot make the control vanish.
// Static rule assertions — there is no DOM harness in this repo.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const css = f => fs.readFileSync(path.join(__dirname, '..', 'css', f), 'utf8');

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

const ring = decls => /box-shadow\s*:\s*0\s+0\s+0\s+[\d.]+px\s+[^;]+/i.exec(decls)?.[0] ?? null;

test('default skin: .sb-a carries a box-shadow ring (dark theme baseline)', () => {
  const decls = declarationsOf(css('styles.css'), '.sb-a');
  assert.ok(decls, '.sb-a rule missing from styles.css');
  assert.ok(ring(decls), `.sb-a has no box-shadow ring: ${decls.trim()}`);
});

test('default skin: light theme overrides the ring color for .sb-a', () => {
  const decls = declarationsOf(css('styles.css'), '[data-theme="light"] .sb-a');
  assert.ok(ring(decls), `no [data-theme="light"] .sb-a box-shadow ring override: ${decls.trim()}`);
});

test('tactical skin: ring color overrides the default skin regardless of data-theme', () => {
  // tactical.css maps both data-theme values to one palette, so the light-theme
  // ring from styles.css (dark rgba) would vanish on the near-black tactical bar.
  const decls = declarationsOf(css('tactical.css'), '.stylebar .sb-a');
  assert.ok(ring(decls), `tactical.css has no .stylebar .sb-a box-shadow ring: ${decls.trim()}`);
});

test('the ring never colors the glyph or underline itself', () => {
  for (const f of ['styles.css', 'tactical.css']) {
    for (const sel of ['.sb-a', '[data-theme="light"] .sb-a', '.stylebar .sb-a', '.sb-a.low-contrast']) {
      const decls = declarationsOf(css(f), sel);
      assert.doesNotMatch(decls, /(^|;)\s*color\s*:/, `${f} ${sel} sets color`);
      assert.doesNotMatch(decls, /text-decoration-color\s*:/, `${f} ${sel} sets text-decoration-color`);
    }
  }
});

test('low-contrast state puts a backdrop behind the glyph', () => {
  // updateStyleBar adds .low-contrast when the chosen color is close to the bar background
  const decls = declarationsOf(css('styles.css'), '.sb-a.low-contrast');
  assert.match(decls, /(^|;)\s*background(-color)?\s*:\s*#[0-9a-f]{6}/i, `.sb-a.low-contrast has no fixed backdrop: ${decls.trim()}`);
});
