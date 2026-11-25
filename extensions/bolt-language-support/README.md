# Bolt Language Support

Makes `.bolt` files pleasant to write in VS Code.

- **Colors** for every Bolt keyword: pages, components, `styles:`, `layout:`, `resource`, `use`, `slot`, `styled as:` class lists, the `design system:` block and more
- **Snippets**: type `page`, `component`, `resource`, `styles`, `layout`, `form`, `fetch`, `design`, `themetoggle` ... and press Tab (33 snippets; every one is checked against the real compiler)
- **Suggestions** while you type:
  - style names after `styled as:` (from your `styles:` blocks)
  - component names after `show` or at the start of a line (inserted with their props)
  - page names after `go to` and `link ... to`
  - file names after `use` (any `.bolt`, `.js`, `.json`, `.css` file in the project)
- **Problems in the editor** from the real compiler (`bolt check`), for the whole project, every time you save. A status bar item shows `✓ Bolt`, or the number of problems; click it to check again
- **Format Document** (Shift+Alt+F) tidies the file with `bolt fmt`, including unsaved text
- **Commands** (Ctrl+Shift+P): `Bolt: Check Project`, `Bolt: Show Size Report (Bolt vs React)`

## Install

From the Bolt repository:

```bash
npm run install:vscode
```

Then restart VS Code.

## Settings

| Setting | Default | Meaning |
|---|---|---|
| `bolt.checkOnSave` | `true` | check the whole project when you save a `.bolt` file |
| `bolt.cliPath` | empty | path to `bolt` (for example `C:/projects/bolt-lang/cli/bolt.js`). Empty = find it automatically: `cli/bolt.js` in the project, then `node_modules/bolt-lang`, then `bolt` on your PATH |

If problems are not showing, open your Bolt project as the VS Code folder, or set `bolt.cliPath`.

## Publishing

See [PUBLISHING.md](PUBLISHING.md). `npm run package:vscode` (in the Bolt repository) builds the `.vsix` file.
