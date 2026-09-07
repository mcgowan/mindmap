# Mindmap

A keyboard-first mind mapping app. Plain HTML/CSS/JS, no build step.

## Run

```
npm start            # python3 -m http.server 8080
# or any static server, e.g. npx serve .
npm test             # node --test — storage-layer tests in test/ (Node ≥ 18)
```

Then open http://localhost:8080.

## Alternative UI

`tactical.html` is a second front-end over the same maps and engine: a phosphor-green CRT look
with HUD readouts, a NODE DATA panel and a status bar (`css/tactical.css`, `js/tactical.js`).
Both UIs share `store.js`, `layout.js` and `app.js`, so anything created in one shows up in the other.

## Structure

- `index.html` — library and editor views
- `css/styles.css` — theme tokens (dark/light), nodes, connectors, UI
- `js/store.js` — async storage adapter (localStorage now; swap for an API later), compressed map envelope, one-shot migration
- `js/lz-string.js` — vendored lz-string 1.5.0 (MIT), used for the map envelope
- `js/layout.js` — symmetric tree layout and text measurement
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
double-click the handle to return to automatic sizing.
`⌘C` copies the selected node with its whole branch and `⌘V` pastes a copy as the last child of the
selected node (new ids, pasted expanded, works across maps; one `⌘Z` removes the whole paste).
While editing, select part of the text and press `⌘B`, `⌘I`, `⌘U` or `⌘⇧X` (or use the style bar) to
bold, italicise, underline or strike just that range; with nothing or everything selected, `⌘B`/`⌘⇧X`
style the whole node as before.
`⌘C` also puts the visible branch on the system clipboard as a plain-text outline (4-space indent per
level, collapsed branches omitted), so it can be pasted into any other app. Plain text copied elsewhere
pastes with `⌘V` as child nodes — one per line, nested by indentation (tabs or spaces), up to 1000 nodes.

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
`⌘⇧C` copies a node's style and `⌘⇧V` paints it onto another node (works across maps). Styles live on
each node as `node.style = { bg, color, bold, strike }`.
