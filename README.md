# Mindmap

A keyboard-first mind mapping app. Plain HTML/CSS/JS, no build step.

## Run

```
npm start            # python3 -m http.server 8080
# or any static server, e.g. npx serve .
```

Then open http://localhost:8080.

## Alternative UI

`tactical.html` is a second front-end over the same maps and engine: a phosphor-green CRT look
with HUD readouts, a NODE DATA panel and a status bar (`css/tactical.css`, `js/tactical.js`).
Both UIs share `store.js`, `layout.js` and `app.js`, so anything created in one shows up in the other.

## Structure

- `index.html` — library and editor views
- `css/styles.css` — theme tokens (dark/light), nodes, connectors, UI
- `js/store.js` — async storage adapter (localStorage now; swap for an API later)
- `js/layout.js` — symmetric tree layout and text measurement
- `js/app.js` — views, editing, keyboard handling, pan/zoom, undo/redo, autosave
- `tactical.html`, `css/tactical.css`, `js/tactical.js` — the tactical skin and its extra chrome

## Data

Maps live in `localStorage` under `mindmap.index.v1` (list) and `mindmap.map.v1.<id>` (each map).
Every mutation is persisted immediately; the view (pan/zoom) is saved per map without bumping its edit time.

## Keyboard

Press `?` inside the editor for the full list. The essentials: `Tab` child, `Enter` sibling,
type to edit, `Backspace` delete, arrows to move, `⌘/` collapse, `⌘Z` undo, `⌘0` fit.
Drag any node onto another node to move it (and its branch) there.

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
