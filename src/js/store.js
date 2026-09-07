/* Storage adapter.
 * All methods are async so the localStorage backend can be swapped for an HTTP API
 * without touching the rest of the app — except usage() and migrate(), which are
 * synchronous localStorage-only utilities (boot needs migration done before routing).
 */
function uid() {
  if (crypto && crypto.randomUUID) return crypto.randomUUID().replace(/-/g, '').slice(0, 10);
  return Math.random().toString(36).slice(2, 12);
}

const Store = (() => {
  const INDEX_KEY = 'mindmap.index.v1';
  const PREFIX = 'mindmap.';
  const MAP_KEY = id => `mindmap.map.v2.${id}`;
  const LEGACY_MAP_KEY = id => `mindmap.map.v1.${id}`;

  /* v2 value envelope: MARK + lz-string UTF-16 when that is shorter, else plain JSON.
   * lz-string never emits code points < 32 and JSON never starts with one, so the
   * first character identifies the encoding. */
  const Codec = {
    MARK: '\u0001',
    encode(doc) {
      const json = JSON.stringify(doc);
      const packed = Codec.MARK + LZString.compressToUTF16(json);
      return packed.length < json.length ? packed : json;
    },
    decode(raw) {
      if (typeof raw !== 'string' || !raw) return null;
      try {
        const json = raw[0] === Codec.MARK ? LZString.decompressFromUTF16(raw.slice(1)) : raw;
        return json ? JSON.parse(json) : null;
      } catch (e) {
        return null;
      }
    },
  };

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
    codec: Codec,

    hasData() {
      return localStorage.getItem(INDEX_KEY) !== null;
    },

    async list() {
      return getIndex().sort((a, b) => b.updatedAt - a.updatedAt);
    },

    /** Reads the v2 envelope; falls back to a plain-JSON v1 key migration could not convert. */
    async get(id) {
      const raw = localStorage.getItem(MAP_KEY(id));
      if (raw !== null) return Codec.decode(raw);
      return readJSON(LEGACY_MAP_KEY(id), null);
    },

    /** touch=false persists without bumping updatedAt (used for view state). */
    async save(map, { touch = true } = {}) {
      if (touch) map.updatedAt = Date.now();
      localStorage.setItem(MAP_KEY(map.id), Codec.encode(map));
      localStorage.removeItem(LEGACY_MAP_KEY(map.id));
      const idx = getIndex().filter(e => e.id !== map.id);
      idx.push(indexEntry(map));
      setIndex(idx);
      return map;
    },

    async remove(id) {
      localStorage.removeItem(MAP_KEY(id));
      localStorage.removeItem(LEGACY_MAP_KEY(id));
      setIndex(getIndex().filter(e => e.id !== id));
    },

    /** Bytes occupied by every mindmap.* key (UTF-16: 2 bytes per code unit). Sync. */
    usage() {
      let units = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(PREFIX)) units += key.length + (localStorage.getItem(key) || '').length;
      }
      return units * 2;
    },

    /** One-shot eager move of every plain-JSON v1 map to the v2 envelope. Sync; runs before routing.
     *  Unparseable or unwritable maps are skipped and keep their v1 key (still readable via get()). */
    migrate() {
      const legacyPrefix = LEGACY_MAP_KEY('');
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(legacyPrefix)) keys.push(key);
      }
      const result = { migrated: 0, skipped: [] };
      for (const key of keys) {
        const id = key.slice(legacyPrefix.length);
        let doc;
        try { doc = JSON.parse(localStorage.getItem(key)); } catch (e) { result.skipped.push(id); continue; }
        if (!doc || typeof doc !== 'object') { result.skipped.push(id); continue; }
        try { localStorage.setItem(MAP_KEY(id), Codec.encode(doc)); } catch (e) { result.skipped.push(id); continue; }
        localStorage.removeItem(key);
        result.migrated++;
      }
      return result;
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
