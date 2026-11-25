# Bolt Development History

## Phase 1: Core Compiler Fundamentals
- Custom Lexer and Tokenizer
- Indentation-based Parser
- Abstract Syntax Tree (AST) definition
- Basic Code Generator mapping to Javascript

## Phase 2: UI & Reactivity
- **Phase 2a: Collections**
  - Syntactic sugar for array operations (`add`, `remove`, `count of`, `filtered by`, `sorted by`)
- **Phase 2b: UI Primitives**
  - Pages (`page`) and Components (`component`)
  - Rendering elements (`show`, `button`, `link`, `image`, `video`)
  - Popups (`toast`, `modal`)
  - Layout wrappers (`row`, `column`, `grid`, `hero`, `card`, `section`)
- **Phase 2c: State Management**
  - Local state (`store`)
  - Persistent state (`remember`)
  - Actions and logic (`action`, `run`)

## Phase 3: Routing & Multi-File Architecture
- Automatic routing generation mapping pages to React Router
- Directory scanning (`bolt build app/`)
- Module system (`use` keyword)
- Global AST merging across multiple files
- Navigation (`go to`)

## Phase 4: Diagnostics & Source Maps
- **Phase 4a: Source Maps**
  - `.js.map` generation matching output to `.bolt` files
- **Phase 4b: Error Mapping System**
  - Custom React Error Boundary (`<BoltErrorBoundary>`)
  - Line-marker injection (`__BOLT_MAPS`)
  - Red overlay capturing original Bolt line numbers on runtime crashes

## Phase 5: Styling Engine
- Integrated Tailwind CSS
- `styled as:` keyword for natural syntax styling application

## Phase 6: Forms & Validation
- Integrated Form Builder (`form:`)
- Input generation and binding (`input`)
- Declarative validation rules (`required`, `email`, `min`, `max`, `match`)
- Form submission handlers

## Phase 7: API & Backend Integration
- Built-in Fetch engine (`fetch`, `loading:`, `error:`, `empty:`)
- Data mutation commands (`submit`, `update`, `delete`)

## Phase 8: Authentication
- Context-based Auth Provider generator
- Login and Logout handlers (`login`, `logout`)
- Conditional rendering (`if logged in:`)

## Phase 9: Global State Management
- `global store` primitive mapping to a Zustand-style pub/sub architecture
- State modifications without Redux boilerplate (`clear cart`, `persist`)

## Phase 10: CLI & Build Tools
- Complete Vite integration
- `bolt init` scaffolding command
- Hot Module Replacement (HMR) / Fast Refresh in `bolt dev`
- Production bundling via `bolt build`

## Phase 11: Dynamic Routing
- URL parameters: `page product(id):` → `/product/:id`
- Multiple params: `page store(storeId, productId):` → `/store/:storeId/:productId`
- Dynamic linking: `link "View" to product(123)` → `<Link to={\`/product/${123}\`}>`
- Dynamic navigation: `go to product(id)` → `navigate(\`/product/${id}\`)`
- Compile-time parameter count validation for `go to` and `link`
- Route collision detection for duplicate page names
- Reserved parameter protection (prevents `store` from shadowing route params)
- Fetch reactivity: `useEffect` dependency array auto-populated with referenced route params
- Static-first route sorting for React Router priority

## Phase 12: Named Styles & Import-by-Name
- `styles:` blocks: define Tailwind class sets once and use them by name in any file
- Style composition (styles using styles), variant prefixes (`md:card`), duplicate and circular-reference errors
- `use <name>`: import `.js`, `.ts`, `.json`, `.css` files by file name from anywhere in the project (no paths)
- Missing-name "Did you mean" hints and ambiguous-name errors listing every matching file
- Member calls with parentheses: `helpers.money(5)`

## Phase 13: Stabilization
- Fixed builder writing theme files into a nested `src/.bolt-generated/src` folder
- Fixed `useAuth()` redeclaring a component prop named `user`
- Fixed `link ... to "/home"` generating `//home`
- Fixed build crash for projects without a `design system`
- Removed leftover debug output from builds
- Updated the e2e suite and added `tests/features.test.js`

## Phase 14: store-app on Named Styles
- Converted the demo store to `styles:` (`store-app/src/styles.bolt`, 10 shared styles such as `avatar-badge`, `pill-button`, `heading-black`)
- Generated React is byte-identical before and after, so the conversion is behavior-neutral
- Measured: Bolt source went from 31,158 to 30,417 characters (about 4% fewer approximate tokens, including the styles file itself). Most Tailwind strings in the app are unique, so extracting repeats saves little; the bigger savings come from a shared vocabulary that new pages reuse

## Phase 15: Default Style Vocabulary & Working `bolt init`
- `bolt init` now creates `src/styles.bolt` with a starter vocabulary (`page-wrap`, `stack`, `cluster`, `center`, `card`, `panel`, `heading`, `subheading`, `body`, `muted`, `link`, `button-primary`, `button-secondary`, `field`, `badge`)
- `bolt init` now creates `src/pages/home.bolt` that uses those names
- Fixed: a freshly scaffolded project failed to build (`app.bolt` held `page home`, but a page must match its file name)
- Added a test that scaffolds a project, builds it and checks the vocabulary expands

## Phase 16: Implicit State
- `input "Email" into email` now declares `email` automatically (empty text state); no `store email = ""` line needed
- Existing `store`/`remember`, route params, component props and global stores are never redeclared
- store-app login, signup and contact pages dropped their boilerplate `store` lines; generated React is identical

## Phase 17: Layout
- `layout:` block with `slot` wraps every page (navbar, footer, width) so pages stop repeating `show Navbar` / `show Footer`
- `layout none` inside a page opts that page out
- Compile errors for a layout without exactly one `slot`, or more than one layout
- store-app moved to `layout.bolt` (login, signup and test pages keep their own structure with `layout none`); Navbar/Footer output per page is unchanged

## Phase 18: Default Fetch UI
- `fetch "/url" into data` now shows a default loading message and a default error message with no extra blocks
- Fixed: a fetch without `loading:` / `error:` blocks rendered the page while the data was still `null`, which crashed on `products.map`
- Your own `loading:` / `error:` blocks replace only their own default

## Phase 19: AI & Beginner Tooling
- `bolt check [dir] [--json]`: compiles the whole project into a temp folder and reports every problem as data (file, line, column, message, hint); writes nothing into the project
- `bolt stats [dir] [--json]`: Bolt tokens vs generated React tokens (store-app: about 5.1x)
- `bolt spec` and `llms.txt`: a one-page cheat-sheet to paste into an AI prompt
- Fixed: `.bolt` files with Windows line endings (CRLF) failed with "Unexpected character"; the lexer now accepts both
- New module `src/check.js`

## Phase 20: Theme CSS Actually Applies
- Verified the full flow end to end: `bolt init`, `npm install`, `bolt build`, `vite build` all succeed
- Fixed: `global.css` imported `theme.css` after the `@tailwind` rules, so browsers ignored it and design-system colors and dark/light themes never loaded. The import now comes first
- store-app now loads its theme (`global.css` import, `tailwind.config.js` extends the generated theme)

## Phase 21: Action Return Values
- `store total = run calculateTotal(cart)` now works: the value loads after the first render (starts as `null`, then fills in)
- Fixed: this used to generate `useState(await ...)`, which is invalid inside a React component
- Multi-prop components (`component Card takes a, b:`) and `when x changes:` effects were verified working and ticked off the roadmap

## Phase 22: Resource (one-block CRUD)
- `resource products at "/api/products":` with field lines (`title text required`, `price number`, `contact email`) builds a full page: list, add form with validation and toasts, delete buttons
- Expansion: the builder writes the page as Bolt source and parses it (`src/builder/resource.js`), so layout, styles and route checks apply as for any hand-written page
- `for every item in items:` now works inside pages and components (draws the body once per item)
- Fixed: `remove item from items` inside a loop that names its variable `item` removed nothing
- Fixed: `submit`/`update`/`delete` handlers crashed when the server answered with an empty body

## Phase 23: Built-in API Server
- `bolt serve` and `bolt dev` run a ready REST API for every `resource` block (`src/server/api.js`): list, get, create, replace, patch, delete, with field validation and `400` errors
- Data is saved as plain JSON (`.bolt-data/<name>.json`); no database to install; `bolt init` adds a Vite proxy for `/api` and a `.gitignore`
- Verified end to end in a real browser: add a record, see the toast and the row, reload (it persists), delete it
- Fixed: line markers could be left in the page as visible text (for example `/*__L:1*/`) when a fetch wrapped the page
- Fixed: an empty `theme.css` made Vite print a warning
- New tests: `tests/api.test.js` (server) and a marker test; the suite now has 27 tests

## Phase 24: Component Children (Wrappers)
- `Card:` / `Card with title="Hi":` followed by an indented block wraps content in a component, with no `show` needed (`show Card:` still works)
- `slot` inside a component marks where the wrapped content goes (same word as `layout:`; `show children` still works)
- Nesting works (`Card:` containing `Box:`)
- A block for a component that does not exist is a compile error with a "Did you mean ..." suggestion
- Verified in a real browser with a nested Card and Box

## Phase 25: Design System Polish
- Your `styled as:` classes now always override Bolt's defaults (`src/generator/tailwind.js`): `bg-red-600` removes the default blue background and its blue hover, `p-8` replaces `px-4 py-2`, `flex-col` replaces `flex-row`, duplicates are dropped
- `bolt init` ships `src/design.bolt` (light and dark themes with named colors: background, surface, ink, soft, line, brand, onbrand) and a default style vocabulary written with those names, so dark mode works with no extra code
- Starter page has a dark mode toggle; the first visit follows the device theme, and a click switches at once (before, the first click could do nothing)
- Page background and text color follow the theme
- Verified in a real browser: starts dark on a dark device, one click switches to light, the choice is saved
- New tests: `tests/tailwind.test.js` and theme and override tests (38 tests in all)

## Phase 26: VS Code Extension 1.1
- New syntax colors for everything added since the first version: `styles:` (names and class lists), `layout:` and `slot`, `resource ... at`, `use`, `design system:` blocks, `styled as:` class lists, wrapper components such as `Card:`, and a split of keywords into groups (control, state, UI, data, validation, auth)
- 30 snippets (`page`, `component`, `resource`, `styles`, `layout`, `form`, `fetch`, `design`, `themetoggle` ...); a test expands every snippet and checks that the real compiler accepts it
- Suggestions: style names after `styled as:`, components after `show` (inserted with their props), pages after `go to` / `link ... to`, files after `use`
- Problems now come from `bolt check`, so the editor shows exactly what the compiler reports, for the whole project, on save (the old version loaded the compiler from `src/` and only worked inside the Bolt repo itself)
- Status bar item, commands `Bolt: Check Project` and `Bolt: Show Size Report`, settings `bolt.checkOnSave` and `bolt.cliPath`
- Indent rules (a line ending with `:` indents the next line)
- `npm run install:vscode` installs it; extension logic lives in `lib/` and is covered by `tests/extension.test.js`

## Phase 27: Recheck and Demo Polish
- Rechecked everything: 50 tests pass, `store-app` builds and checks clean, repo and GitHub in sync
- `bolt check` now accepts a single `.bolt` file (it used to crash on anything but a folder)
- `input` fields now have a visible default style (border, padding, rounded); your `styled as:` classes win over it
- store-app: the page background and text follow the theme, hard-coded light colors moved to theme colors, so dark mode now looks right across pages (verified in a real browser in dark and light)
- Housekeeping: root scratch files moved to `examples/experiments/` and `tests/scratch-modal-state.js`
- README size numbers refreshed (store-app: 6,542 tokens of Bolt, about 33,100 of React, 5.06x)

## Phase 28: Formatter (`bolt fmt`)
- `bolt fmt [dir|file]` rewrites `.bolt` files with 4-space indentation, no trailing spaces, Unix line endings, one newline at the end, at most one blank line in a row, and one blank line before each top-level block (`page`, `component`, `styles`, `layout`, ...)
- It never changes what code means: the formatted file must give the same syntax tree as the original, otherwise the file is skipped with a reason; inconsistent indentation is reported, not guessed
- `bolt fmt --check` only reports (exit code 1 if something needs formatting, good for CI); `--stdout` prints one file; `--stdin` formats piped text
- VS Code: Format Document uses it (extension 1.2.0); unsaved text works
- store-app and the examples were formatted with it, and a test keeps store-app formatted

## Phase 29: Custom API Endpoints
- `endpoint get|post|put|patch|delete "/api/path":` blocks written in Bolt run on the built-in server: `request` (query, params, body), `data.<resource>` (saved to disk when you change it), `give`, `reply 404, "message"`, and helpers `contains`, `lower`, `upper`, `now`
- Endpoints are checked before resource routes, support `:name` address parts, and a crash answers `500` with the reason
- `bolt check` compiles every endpoint and reports duplicates and mistakes; `bolt serve` and `bolt dev` list them and reload them when `.bolt` files change
- Language fixes found on the way: `count of data.products` (was `data.length.products`), `items[0]` position syntax (was parsed as a call), `users filtered by user: ...` (documented in the spec but not implemented)
- Clearer error when a Bolt word is used as a variable name (`for every row in ...`: "'row' is a word Bolt already uses"); removed a leftover debug print from parse errors
- VS Code extension 1.3.0: `endpoint` colors, helper words, two snippets (`endpoint`, `reply`)
- Verified over real HTTP: search, path parameter, `reply 404`, bulk insert saved to disk, resource routes still working

## Phase 30: Login for Endpoints
- Endpoint helpers `hash_password`, `check_password` (scrypt), `sign_token` (signed, expires in 7 days) and `need_login request`; `request.user` holds the logged-in user from the `Authorization: Bearer` header (empty if missing, forged or expired)
- Resource field option `hidden` (`password text required hidden`): saved, never sent to the browser, and left out of the generated list
- Fixed: after `login`, the page stored the user but dropped the token, so later requests were never authenticated; it now keeps the token
- Verified over real HTTP: signup (stored hashed), duplicate 409, wrong password 401, login, `/api/me` with no token, a good token and a forged token, and the password never appearing in `GET /api/users`
