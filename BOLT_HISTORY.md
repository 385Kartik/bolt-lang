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
