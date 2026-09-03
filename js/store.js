/* Storage adapter.
 * All methods are async so the localStorage backend can be swapped for an HTTP API
 * without touching the rest of the app.
 */
function uid() {
  if (crypto && crypto.randomUUID) return crypto.randomUUID().replace(/-/g, '').slice(0, 10);
  return Math.random().toString(36).slice(2, 12);
}

const Store = (() => {
  const INDEX_KEY = 'mindmap.index.v1';
  const MAP_KEY = id => `mindmap.map.v1.${id}`;

  const readJSON = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  };
  const writeJSON = (key, value) => localStorage.setItem(key, JSON.stringify(value));

  const countNodes = root => {
    let n = 0;
    (function walk(x) { n++; (x.children || []).forEach(walk); })(root);
    return n;
  };

  const getIndex = () => readJSON(INDEX_KEY, []);
  const setIndex = idx => writeJSON(INDEX_KEY, idx);

  const indexEntry = map => ({
    id: map.id,
    title: map.title,
    createdAt: map.createdAt,
    updatedAt: map.updatedAt,
    nodeCount: countNodes(map.root),
  });

  return {
    hasData() {
      return localStorage.getItem(INDEX_KEY) !== null;
    },

    async list() {
      return getIndex().sort((a, b) => b.updatedAt - a.updatedAt);
    },

    async get(id) {
      return readJSON(MAP_KEY(id), null);
    },

    /** touch=false persists without bumping updatedAt (used for view state). */
    async save(map, { touch = true } = {}) {
      if (touch) map.updatedAt = Date.now();
      writeJSON(MAP_KEY(map.id), map);
      const idx = getIndex().filter(e => e.id !== map.id);
      idx.push(indexEntry(map));
      setIndex(idx);
      return map;
    },

    async remove(id) {
      localStorage.removeItem(MAP_KEY(id));
      setIndex(getIndex().filter(e => e.id !== id));
    },

    async create({ title = 'Untitled map', rootText = 'Central idea', root = null } = {}) {
      const now = Date.now();
      const map = {
        id: uid(),
        title,
        titleCustom: false,
        createdAt: now,
        updatedAt: now,
        root: root || { id: uid(), text: rootText, children: [] },
        view: null,
      };
      await this.save(map);
      return map;
    },
  };
})();
