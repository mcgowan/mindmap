# Mindmap

A keyboard-first mind mapping app. Plain HTML/CSS/JS, no build step.

## Run

```
npm start            # python3 -m http.server 8080
# or any static server, e.g. npx serve .
npm test             # node --test — storage, palette, style-bar, selection-core and layout tests in test/ (Node ≥ 18)
```

Then open http://localhost:8080.

## Alternative UI

`tactical.html` is a second front-end over the same maps and engine: a phosphor-green CRT look
with HUD readouts, a NODE DATA panel and a status bar (`css/tactical.css`, `js/tactical.js`).
Both UIs share `store.js`, `layout.js`, `selection.js` and `app.js`, so anything created in one shows up in the other.

## Structure

- `index.html` — library and editor views
- `css/styles.css` — theme tokens (dark/light), nodes, connectors, UI
- `js/store.js` — async storage adapter (localStorage now; swap for an API later), compressed map envelope, one-shot migration
- `js/lz-string.js` — vendored lz-string 1.5.0 (MIT), used for the map envelope
- `js/layout.js` — symmetric tree layout and text measurement
- `js/selection.js` — DOM-free selection core: the selection-set algebra, selection roots, move planning, clipboard payload shape, marquee hit-test (unit-tested under node)
- `js/app.js` — views, editing, keyboard handling, pan/zoom, undo/redo, autosave
- `tactical.html`, `css/tactical.css`, `js/tactical.js` — the tactical skin and its extra chrome

## Data

Maps live in `localStorage` under `mindmap.index.v1` (plain-JSON list) and `mindmap.map.v2.<id>` (each map).
A map value is either `\u0001` + `LZString.compressToUTF16(json)` or the plain JSON when that is shorter, so a
value is never larger than its JSON. Legacy `mindmap.map.v1.<id>` plain-JSON maps are migrated to `v2` once, on
the first load that finds any; a map that cannot be re-encoded keeps its `v1` key and still opens.
Every mutation is persisted immediately; the view (pan/zoom) is saved per map without bumping its edit time.

The library header and editor status bar show how much of a nominal 5 MB localStorage budget the app's keys
occupy (amber from 80%). When a save fails for lack of space the status reads “Not saved — storage full”,
the map stays editable in memory, and leaving the map or closing the tab asks for confirmation; the next
successful save clears it.

## Keyboard

Press `?` inside the editor for the full list. The essentials: `Tab` or `Shift+Enter` child, `Enter` peer,
`F2` or `Space` to edit (or just type, or double-click the node), `Enter` finishes editing, `Backspace` delete, arrows to move,
`⌘/` collapse, `⌘Z` undo, `⌘0` fit.
Drag any node onto the middle of another node to nest it there (with its branch), or onto the top or
bottom edge of a node to drop it before or after that node, which reorders peers or moves it into
another parent at a chosen position.
Drag the thin handle on a node's outer edge to set a custom width (80–800px, wrapping the text);
double-click the handle to fit the text on one line (up to 800px — longer text wraps at the cap). Double-clicking
the handle of a node that is already at its fit width, or whose text already fits on one line, returns it to automatic sizing.
`⌘C` copies the selected node with its whole branch — or every selected branch, in document order — and `⌘V` pastes copies as the
last children of the primary node (new ids, pasted expanded, works across maps; one `⌘Z` removes the whole paste).
When a branch and some of its descendants are selected together, the selection acts as a filter: only the selected
descendants (and the path down to them) are copied; where the selection reaches no further, the whole sub-branch comes along.
While editing, select part of the text and press `⌘B`, `⌘I`, `⌘U` or `⌘⇧X` (or use the style bar) to
bold, italicise, underline or strike just that range; with nothing or everything selected, `⌘B`/`⌘⇧X`
style the whole node as before.
`⌘C` also puts the visible branch on the system clipboard as a plain-text outline (4-space indent per
level, collapsed branches omitted), so it can be pasted into any other app. Plain text copied elsewhere
pastes with `⌘V` as child nodes — one per line, nested by indentation (tabs or spaces), up to 1000 nodes.

## Selecting several nodes

A plain click selects one node. `⌘`-click adds or removes a node, `Shift`-click adds the run of siblings between the
primary node and the clicked one (or just that node when it lives elsewhere), `Shift`-drag on the background draws a
marquee (`⌘` held keeps what was already selected), `⌘A` selects every visible node and `Esc` clears. The **primary**
node — the one with the doubled ring (heavier brackets in the tactical skin) — is where `Tab`/`Enter`, editing and the
style bar's readouts point; every other command acts on the whole selection as one undo step: `Backspace` deletes all
the selected branches, `⌘/` collapses or expands them together, `⌘B` / `⌘⇧X` / the fill and text swatches / `⌘⇧V` style
them all, and `⌘C` copies every selected branch (filtered to the selected descendants when a branch and some of its nodes
are selected together). Dragging any selected node moves the whole selection: a branch and one
of its leaves keep their shape (the leaf stays inside the branch), and the separate branches land side by side in
document order.

## Theme

The theme button in the top bar opens a Light / Dark / System menu. System follows the OS setting live.
`⌘⇧L` toggles light and dark directly. The choice is stored in `localStorage` under `mindmap.theme`.
The tactical UI ignores it and always renders dark.

## Notes

Every node can carry free text. Press `⌘I` (or the notes button in the top bar) to open the notes pane for
the selected node; nodes with notes show a small marker you can click. Notes are stored as `node.notes`
and autosave like everything else. The tactical UI edits the same notes from its NODE DATA panel.

## Styling

Select a node to get a floating format bar: fill color, text color, bold (`⌘B`), strikethrough (`⌘⇧X`).
With several nodes selected the bar shows their count and every action applies to all of them in one undo step.
`⌘⇧C` copies the primary node's style and `⌘⇧V` paints it onto every selected node (works across maps). Styles live on
each node as `node.style = { bg, color, bold, strike }`.
