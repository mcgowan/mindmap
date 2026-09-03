/* Symmetric tree layout.
 * Root sits at (0,0). First-level children are split left/right (node.side = 'L'|'R'),
 * every subtree is stacked vertically and centered on its parent. Positions are centers.
 */
const Layout = (() => {
  const H_GAP = 72;   // horizontal distance between a parent edge and a child edge
  const V_GAP = 14;   // vertical gap between sibling subtrees

  const PALETTE = [
    '#5b8def', // blue
    '#2dd4bf', // teal
    '#f5b342', // amber
    '#f472b6', // rose
    '#a78bfa', // violet
    '#4ade80', // green
    '#fb923c', // orange
    '#38bdf8', // sky
  ];

  const cache = new Map();
  let measureEl = null;
  let measureText = null;

  const depthClass = d => (d === 0 ? 'depth-0' : d === 1 ? 'depth-1' : 'depth-n');

  function measure(text, depth, bold = false) {
    const key = depthClass(depth) + (bold ? ' b ' : ' ') + text;
    let m = cache.get(key);
    if (m) return m;
    if (!measureEl) {
      measureEl = document.getElementById('measure');
      measureText = measureEl.querySelector('.node-text');
    }
    measureEl.className = 'node measure ' + depthClass(depth) + (bold ? ' is-bold' : '');
    measureText.textContent = text || ' ';
    const r = measureEl.getBoundingClientRect();
    // +1 guards against sub-pixel rounding that would otherwise wrap the last letter
    m = { w: Math.ceil(r.width) + 1, h: Math.ceil(r.height) };
    cache.set(key, m);
    return m;
  }

  function countDescendants(node) {
    let n = 0;
    (function walk(x) { (x.children || []).forEach(c => { n++; walk(c); }); })(node);
    return n;
  }

  function compute(root) {
    const nodes = [];
    const byId = new Map();

    function build(node, depth, parent, side, color) {
      const size = measure(node.text, depth, !!(node.style && node.style.bold));
      const ln = {
        id: node.id, node, depth, parent, side, color,
        w: size.w, h: size.h, x: 0, y: 0,
        children: [],
        hasChildren: node.children.length > 0,
        collapsed: !!node.collapsed && node.children.length > 0,
        hiddenCount: node.collapsed ? countDescendants(node) : 0,
      };
      nodes.push(ln);
      byId.set(node.id, ln);
      if (!ln.collapsed) {
        node.children.forEach((child, i) => {
          const childSide = depth === 0 ? (child.side || (i % 2 === 0 ? 'R' : 'L')) : side;
          const childColor = depth === 0 ? PALETTE[(child.color !== undefined ? child.color : i) % PALETTE.length] : color;
          ln.children.push(build(child, depth + 1, ln, childSide, childColor));
        });
      }
      return ln;
    }

    const rootLn = build(root, 0, null, null, null);

    function extent(ln) {
      if (ln.ext !== undefined) return ln.ext;
      if (!ln.children.length) return (ln.ext = ln.h);
      const sum = ln.children.reduce((acc, c) => acc + extent(c), 0) + V_GAP * (ln.children.length - 1);
      return (ln.ext = Math.max(ln.h, sum));
    }

    function place(ln, x, y) {
      ln.x = x;
      ln.y = y;
      if (!ln.children.length) return;
      const groups = { L: [], R: [] };
      ln.children.forEach(c => groups[c.side].push(c));
      for (const side of ['L', 'R']) {
        const kids = groups[side];
        if (!kids.length) continue;
        const dir = side === 'L' ? -1 : 1;
        const total = kids.reduce((acc, c) => acc + extent(c), 0) + V_GAP * (kids.length - 1);
        let cy = y - total / 2;
        for (const kid of kids) {
          const kx = x + dir * (ln.w / 2 + H_GAP + kid.w / 2);
          const ky = cy + extent(kid) / 2;
          place(kid, kx, ky);
          cy += extent(kid) + V_GAP;
        }
      }
    }

    place(rootLn, 0, 0);

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const ln of nodes) {
      minX = Math.min(minX, ln.x - ln.w / 2);
      maxX = Math.max(maxX, ln.x + ln.w / 2);
      minY = Math.min(minY, ln.y - ln.h / 2);
      maxY = Math.max(maxY, ln.y + ln.h / 2);
    }

    return { nodes, byId, root: rootLn, bounds: { minX, minY, maxX, maxY } };
  }

  /** Anchor points of the straight connector between a parent and child layout node. */
  function linkPoints(parent, child, ppos, cpos) {
    const dir = child.side === 'L' ? -1 : 1;
    return {
      x1: ppos.x + dir * parent.w / 2,
      y1: ppos.y,
      x2: cpos.x - dir * child.w / 2,
      y2: cpos.y,
    };
  }

  /** Orthogonal connector path: horizontal out of the parent, vertical spine, horizontal into the child.
   *  Corners are rounded; all children of a parent share the same spine so the branch reads as one bracket. */
  const CORNER = 10;
  function linkPath(parent, child, ppos, cpos) {
    const { x1, y1, x2, y2 } = linkPoints(parent, child, ppos, cpos);
    const dir = child.side === 'L' ? -1 : 1;
    const dy = y2 - y1;
    const midX = x1 + dir * (Math.abs(x2 - x1) / 2);
    const r = Math.min(CORNER, Math.abs(dy) / 2, Math.abs(x2 - x1) / 2);
    if (Math.abs(dy) < 0.5 || r < 0.5) return `M${x1} ${y1}L${x2} ${y2}`;
    const s = dy > 0 ? 1 : -1;
    return [
      `M${x1} ${y1}`,
      `L${midX - dir * r} ${y1}`,
      `Q${midX} ${y1} ${midX} ${y1 + s * r}`,
      `L${midX} ${y2 - s * r}`,
      `Q${midX} ${y2} ${midX + dir * r} ${y2}`,
      `L${x2} ${y2}`,
    ].join('');
  }

  return { compute, linkPoints, linkPath, clearCache: () => cache.clear(), PALETTE, H_GAP, V_GAP };
})();
