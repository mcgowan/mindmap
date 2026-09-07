// Storage-layer tests: load js/lz-string.js + js/store.js as browser-style scripts
// against an in-memory localStorage stub. Run with `npm test` from src/.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function makeLocalStorage() {
  const data = new Map();
  let failures = 0;
  return {
    getItem: k => (data.has(k) ? data.get(k) : null),
    setItem(k, v) {
      if (failures > 0) {
        failures--;
        throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
      }
      data.set(String(k), String(v));
    },
    removeItem: k => { data.delete(k); },
    key: i => [...data.keys()][i] ?? null,
    get length() { return data.size; },
    clear() { data.clear(); failures = 0; },
    // Test hook: make the next n setItem calls throw QuotaExceededError.
    failNext(n = 1) { failures = n; },
    keys: () => [...data.keys()],
  };
}

const localStorage = makeLocalStorage();
globalThis.localStorage = localStorage;
if (!globalThis.crypto) globalThis.crypto = require('node:crypto').webcrypto;

const js = f => fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8');
vm.runInThisContext(js('lz-string.js'), { filename: 'lz-string.js' });
vm.runInThisContext(js('store.js'), { filename: 'store.js' });
const LZString = vm.runInThisContext('LZString');
const Store = vm.runInThisContext('Store');

test.beforeEach(() => localStorage.clear());

test('harness: lz-string round-trips through UTF-16', () => {
  const packed = LZString.compressToUTF16('abc');
  assert.equal(LZString.decompressFromUTF16(packed), 'abc');
  assert.ok(Store && typeof Store.save === 'function');
});

test('harness: failNext makes setItem throw QuotaExceededError once', () => {
  localStorage.failNext(1);
  assert.throws(() => localStorage.setItem('k', 'v'), { name: 'QuotaExceededError' });
  localStorage.setItem('k', 'v');
  assert.equal(localStorage.getItem('k'), 'v');
});

/* ---------- fixtures ---------- */
const N = (text, children = [], extra = {}) => ({ id: Math.random().toString(36).slice(2, 12), text, children, ...extra });
function welcomeMap(id = 'w1') {
  const root = N('Welcome to Mindmap', [
    N('Keyboard first', [N('Tab adds a child'), N('Enter adds a sibling'), N('Just start typing to edit'), N('Arrow keys move around')], { side: 'R', collapsed: true }),
    N('Organize', [N('⌘ / collapses a branch'), N('⌥ ↑ ↓ reorders siblings'), N('Backspace deletes a branch'), N('⌘ Z undoes anything')], { side: 'L' }),
    N('Autosave', [N('Every change is saved instantly'), N('Stored locally in this browser')], { side: 'R' }),
    N('Navigate', [N('Scroll to pan, pinch to zoom'), N('⌘ 0 fits the map to the screen'), N('Press ? for all shortcuts')], { side: 'L', style: { color: '#ff0000' } }),
  ]);
  return { id, title: 'Welcome to Mindmap', titleCustom: false, createdAt: 1700000000000, updatedAt: 1700000001000, root, view: { x: 1, y: 2, z: 1.5 } };
}
const Codec = Store.codec;
const V2 = id => `mindmap.map.v2.${id}`;
const V1 = id => `mindmap.map.v1.${id}`;

/* ---------- Codec ---------- */
test('Codec: encode→decode round-trips a Welcome-sized map deep-equal', () => {
  const map = welcomeMap();
  const raw = Codec.encode(map);
  assert.equal(raw[0], Codec.MARK, 'a real map compresses, so the marker form wins');
  assert.deepEqual(Codec.decode(raw), map);
});

test('Codec: never longer than plain JSON (smaller-wins NFR)', () => {
  for (const doc of [{}, [], 'x', 1, { id: 'a' }, { id: 'a', text: 'hi', children: [] }, welcomeMap()]) {
    const json = JSON.stringify(doc);
    const raw = Codec.encode(doc);
    assert.ok(raw.length <= json.length, `${json.slice(0, 40)}: ${raw.length} > ${json.length}`);
    assert.deepEqual(Codec.decode(raw), doc);
  }
});

test('Codec: decodes a plain-JSON value without marker', () => {
  assert.deepEqual(Codec.decode('{"a":1}'), { a: 1 });
});

test('Codec: garbage, marker+junk, empty and non-string → null, no throw', () => {
  assert.equal(Codec.decode('not json'), null);
  assert.equal(Codec.decode(Codec.MARK + 'junk\uffff'), null);
  assert.equal(Codec.decode(Codec.MARK), null);
  assert.equal(Codec.decode(''), null);
  assert.equal(Codec.decode(null), null);
  assert.equal(Codec.decode(undefined), null);
});

/* ---------- Store keys ---------- */
test('Store.save writes only the v2 key and the index; removes a stale v1 key', async () => {
  const map = welcomeMap('s1');
  localStorage.setItem(V1('s1'), JSON.stringify(map));
  await Store.save(map, { touch: false });
  assert.deepEqual(localStorage.keys().sort(), [V2('s1'), 'mindmap.index.v1'].sort());
  assert.deepEqual(await Store.get('s1'), map);
  const idx = JSON.parse(localStorage.getItem('mindmap.index.v1'));
  assert.equal(idx.length, 1);
  assert.equal(idx[0].id, 's1');
  assert.equal(idx[0].nodeCount, 18);
  assert.equal(map.updatedAt, 1700000001000, 'touch:false leaves updatedAt alone');
});

test('Store.get falls back to a plain-JSON v1 key when v2 is absent', async () => {
  const map = welcomeMap('g1');
  localStorage.setItem(V1('g1'), JSON.stringify(map));
  assert.deepEqual(await Store.get('g1'), map);
  assert.equal(await Store.get('missing'), null);
  localStorage.setItem(V1('bad'), '{oops');
  assert.equal(await Store.get('bad'), null);
});

test('Store.get returns null on an undecodable v2 value and leaves it in place', async () => {
  localStorage.setItem(V2('c1'), Codec.MARK + 'garbage');
  assert.equal(await Store.get('c1'), null);
  assert.equal(localStorage.getItem(V2('c1')), Codec.MARK + 'garbage');
});

test('Store.remove clears v2 and v1 keys and the index entry', async () => {
  const a = welcomeMap('r1'), b = welcomeMap('r2');
  await Store.save(a);
  await Store.save(b);
  localStorage.setItem(V1('r1'), JSON.stringify(a));
  await Store.remove('r1');
  assert.equal(localStorage.getItem(V2('r1')), null);
  assert.equal(localStorage.getItem(V1('r1')), null);
  assert.deepEqual((await Store.list()).map(e => e.id), ['r2']);
});

test('Store.save rejects when the write throws; nothing else changes', async () => {
  const map = welcomeMap('q1');
  localStorage.failNext(1);
  await assert.rejects(Store.save(map), { name: 'QuotaExceededError' });
  assert.equal(localStorage.getItem(V2('q1')), null);
  assert.equal(localStorage.getItem('mindmap.index.v1'), null);
});

test('Store.save: index write failing after the map write propagates; the next save heals the index', async () => {
  const map = welcomeMap('q2');
  localStorage.setItem(V1('q2'), JSON.stringify(map));
  const orig = localStorage.setItem;
  localStorage.setItem = function (k, v) {
    if (k === 'mindmap.index.v1') throw new DOMException('full', 'QuotaExceededError');
    return orig.call(this, k, v);
  };
  try {
    await assert.rejects(Store.save(map, { touch: false }), { name: 'QuotaExceededError' });
  } finally {
    localStorage.setItem = orig;
  }
  assert.deepEqual(await Store.get('q2'), map, 'map value landed before the index failed');
  assert.equal(localStorage.getItem(V1('q2')), null, 'stale v1 key already removed');
  assert.equal(localStorage.getItem('mindmap.index.v1'), null, 'index never written');
  await Store.save(map, { touch: false });
  assert.deepEqual((await Store.list()).map(e => e.id), ['q2']);
});

test('Store.usage counts mindmap.* keys only, 2 bytes per UTF-16 unit', async () => {
  assert.equal(Store.usage(), 0);
  localStorage.setItem('foo', 'x'.repeat(1000));
  assert.equal(Store.usage(), 0);
  await Store.save(welcomeMap('u1'));
  const expected = localStorage.keys().filter(k => k.startsWith('mindmap.'))
    .reduce((n, k) => n + k.length + localStorage.getItem(k).length, 0) * 2;
  assert.equal(Store.usage(), expected);
  assert.ok(expected > 0);
});

/* ---------- migrate ---------- */
function seedV1(...maps) {
  for (const m of maps) localStorage.setItem(V1(m.id), JSON.stringify(m));
  localStorage.setItem('mindmap.index.v1', JSON.stringify(maps.map(m => ({ id: m.id, title: m.title, createdAt: m.createdAt, updatedAt: m.updatedAt, nodeCount: 18 }))));
}

test('Store.migrate moves every v1 map to v2, leaves updatedAt and the index untouched', async () => {
  const maps = [welcomeMap('m1'), welcomeMap('m2'), welcomeMap('m3')];
  maps[1].updatedAt = 1700000005000;
  seedV1(...maps);
  const indexBefore = localStorage.getItem('mindmap.index.v1');
  assert.deepEqual(Store.migrate(), { migrated: 3, skipped: [] });
  for (const m of maps) {
    assert.equal(localStorage.getItem(V1(m.id)), null);
    assert.ok(localStorage.getItem(V2(m.id)));
    const got = await Store.get(m.id);
    assert.deepEqual(got, m);
    assert.equal(got.updatedAt, m.updatedAt);
  }
  assert.equal(localStorage.getItem('mindmap.index.v1'), indexBefore);
});

test('Store.migrate skips a corrupt v1 value, keeps its key and index entry, migrates the rest', async () => {
  const ok = welcomeMap('ok1');
  seedV1(ok, welcomeMap('bad1'));
  localStorage.setItem(V1('bad1'), '{not json');
  const res = Store.migrate();
  assert.deepEqual(res, { migrated: 1, skipped: ['bad1'] });
  assert.equal(localStorage.getItem(V1('bad1')), '{not json');
  assert.equal(localStorage.getItem(V2('bad1')), null);
  assert.ok((await Store.list()).some(e => e.id === 'bad1'));
  assert.equal(await Store.get('bad1'), null);
  assert.deepEqual(await Store.get('ok1'), ok);
});

test('Store.migrate skips a map whose v2 write throws; it stays on v1 and still opens', async () => {
  const [a, b, c] = [welcomeMap('w1'), welcomeMap('w2'), welcomeMap('w3')];
  seedV1(a, b, c);
  // keys are scanned in insertion order; fail the 2nd write only
  const orig = localStorage.setItem;
  let writes = 0;
  localStorage.setItem = function (k, v) {
    if (k.startsWith('mindmap.map.v2.') && ++writes === 2) throw new DOMException('full', 'QuotaExceededError');
    return orig.call(this, k, v);
  };
  try {
    assert.deepEqual(Store.migrate(), { migrated: 2, skipped: ['w2'] });
  } finally {
    localStorage.setItem = orig;
  }
  assert.ok(localStorage.getItem(V1('w2')));
  assert.equal(localStorage.getItem(V2('w2')), null);
  assert.deepEqual(await Store.get('w2'), b);
  assert.equal(localStorage.getItem(V1('w1')), null);
  assert.equal(localStorage.getItem(V1('w3')), null);
});

test('Store.migrate with no v1 keys does nothing and writes nothing', async () => {
  await Store.save(welcomeMap('v2only'));
  const orig = localStorage.setItem;
  let writes = 0;
  localStorage.setItem = function (...a) { writes++; return orig.apply(this, a); };
  try {
    assert.deepEqual(Store.migrate(), { migrated: 0, skipped: [] });
  } finally {
    localStorage.setItem = orig;
  }
  assert.equal(writes, 0);
});
