# Bolt Architecture

## What is Bolt?

Bolt is a high-level frontend programming language that abstracts away the boilerplate of React, React Router, Tailwind CSS, State Management, Forms, Authentication, and API Integration. 

A developer describes the application in Bolt syntax, and the compiler parses that syntax to generate a production-ready React application.

**Flow:**
```
     CLI
      │
      ▼
 File Scanner
      │
      ▼
    Lexer
      │
      ▼
    Parser
      │
      ▼
     AST
      │
      ▼
Code Generator
      │
      ▼
   Builder
      │
      ▼
 Vite Project
```

## Philosophy

Bolt's primary goal is:
**"Developer describes UI and business logic, the compiler handles implementation details."**

In React:
```javascript
const [products, setProducts] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
   fetch(...)
}, []);
```

In Bolt:
```bolt
fetch "/products" into products
```

## Core Compiler Architecture

### 1. Lexer
**Purpose:** Convert the source code into tokens.
**Core File:** `src/lexer/tokens.js`, `src/lexer/lexer.js`

**Supported Tokens:**
- Layout & UI: `PAGE`, `COMPONENT`, `SHOW`, `BUTTON`, `ROW`, `COLUMN`, `GRID`, `CARD`, `HERO`, `SECTION`, `CONTAINER`, `IMAGE`, `VIDEO`
- Styling: `STYLED` (using `styled as:`)
- State: `STORE`, `REMEMBER`, `GLOBAL`
- Control Flow: `IF`, `OTHERWISE`, `REPEAT`, `FOR_EVERY`, `WHEN`
- API & Data: `FETCH`, `SUBMIT`, `UPDATE_DATA`, `DELETE_DATA`
- Forms: `FORM`, `INPUT`, `REQUIRED`, `EMAIL`, `MIN`, `MAX`, `MATCH`
- Auth: `LOGIN`, `LOGOUT`, `LOGGED_IN`

### 2. Parser
**Purpose:** Convert Tokens into an Abstract Syntax Tree (AST).
**Core File:** `src/parser/ast.js`, `src/parser/parser.js`

The parser is indentation-based (like Python). It constructs semantic objects from tokens.
Example AST Nodes: `PageDef`, `ComponentDef`, `ShowStatement`, `StoreDeclaration`, `FetchStatement`, `LayoutBlock`.

### 3. Global AST & Builder
Single file or Multi-file parsing are merged into a Global AST.
Every `.bolt` file in the project is merged automatically, so all pages, components, actions and styles are accessible everywhere without imports.

**Import by name (`src/builder/resolve.js`):** `use helpers` resolves `helpers.js` (or `.ts`, `.json`, `.css`, `.bolt`) anywhere in the project by file name. The resolver walks the project root (skipping `node_modules`, `dist`, `.bolt-generated`), reports missing names with "Did you mean" hints, reports ambiguous names with every matching path, and computes the relative import path for each generated page, component and `actions.js`.

**Checker (`src/check.js`):** `bolt check` parses every `.bolt` file, then runs the full builder into a temp folder and returns each problem as `{file, line, column, message, hint}`. `bolt stats` reuses it to compare Bolt tokens with generated React tokens (estimated by counting words, numbers and symbols).

**Resource (`src/builder/resource.js`):** a `ResourceDef` is turned into Bolt source for a page (fetch list, form, `for every` rows, delete buttons) and parsed with the normal parser, so it flows through the same layout, styles and validation as any page.

**API server (`src/server/api.js`):** `bolt serve` and `bolt dev` read every `ResourceDef` (`findResources` in `src/check.js`) and start a small `node:http` server that implements the REST shape each resource expects, saving records as JSON files. `bolt dev` keeps it in sync when `.bolt` files change.

**Children:** a capitalized name followed by `:` (or `with`) is parsed as an implicit `show`, so a component call with a block becomes a `ShowStatement` with a body. Inside a component, `slot` is rewritten to `show children` before generation. The builder rejects blocks for unknown components.

**Class merging (`src/generator/tailwind.js`):** `mergeClasses(defaults, yours)` classifies every Tailwind class by what it sets (background, text size, padding side, flex direction ...) plus its variant (`md:`, `hover:`), and drops a default when you set the same thing. Your recolor also removes the default hover and focus color of that kind. Used by `styled as:` on elements, layout blocks and buttons.

**VS Code extension (`extensions/bolt-language-support`):** a TextMate grammar for colors, a snippets file, and `extension.js` for suggestions and problems. Problems are not computed in the editor: `lib/cli.js` runs `bolt check <folder> --json` and `lib/scan.js` reads names (components, pages, styles) from the text for suggestions. Both libs avoid importing `vscode`, so `tests/extension.test.js` covers them.

**Formatter (`src/format.js`):** re-indents by mapping each indent width to a level (like Python), tidies blank lines, then checks that the formatted text parses to the same syntax tree (line numbers ignored) before accepting it. `bolt fmt --stdin` is what the VS Code formatter calls.

**Endpoints:** an `EndpointDef` body is wrapped in a `FunctionDef('handler', ['request', 'data'])`, compiled with the normal generator, and evaluated with the helper functions in scope (`compileEndpoint` in `src/server/api.js`). The server matches routes by method and a `:name` pattern, runs the handler, and saves every resource touched through `data`.

**Login helpers:** `makeAuthHelpers` in `src/server/api.js` builds the password and token functions per server (the signing secret lives in `.bolt-data/.secret`). The server turns the `Authorization: Bearer` header into `request.user` before each endpoint runs, and `publicRecord` strips `hidden` fields from resource answers.

**Layout:** the builder finds the single `LayoutDef`, validates it has exactly one `slot`, and injects each page's body into a copy of the layout body before code generation (pages with `layout none` are skipped).

**Scaffold:** `bolt init` (`scaffoldProject` in `builder.js`) writes `src/styles.bolt` (the `DEFAULT_STYLES_BOLT` vocabulary) and `src/pages/home.bolt`.

**Named styles:** `styles:` blocks (parsed as `StylesDef`) from every file are merged into one style map by the builder (duplicates are errors) and passed to the generator, which expands style names into Tailwind classes in `styled as:` (supports composition, `md:`/`hover:` prefixes and circular-reference detection).

## Generator Architecture

The Generator (`src/generator/generator.js`) transforms the Global AST into React code.

### Pages & Components
Bolt: `page home:` → React: `export default function HomePage() {}`
Bolt: `component ProductCard for product:` → React: `function ProductCard({ product }) {}`

### Routing System
Pages map automatically to React Router.
Bolt:
```bolt
page home:
page contact:
```
Generates:
```jsx
<BrowserRouter>
   <Routes>
      <Route path="/" />
      <Route path="/contact" />
   </Routes>
</BrowserRouter>
```

### Links & Navigation
Bolt: `link "Contact" to contact` → React: `<Link to="/contact">Contact</Link>`
Bolt: `go to checkout` → React: `navigate("/checkout")`

### Styling & Layout Engine
Bolt styling is Tailwind-based.
Bolt: `show "Hello" styled as: text-xl` → React: `className="text-xl"`
Bolt: `show "Hello" styled as: product-card mt-2` → React: `className="<expanded classes of product-card> mt-2"` (see `styles:` in the Language Specification)
Layout primitives:
- `row:` → `<div className="flex flex-row flex-wrap">`
- `column:` → `<div className="flex flex-col">`
- `grid 3:` → `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">`

### State System
1. **Local State:** `store name = ""` → `useState("")`
2. **Persistent State:** `remember name = ""` → `useState` with `localStorage` sync
3. **Global State:** `global store cart = []` → Zustand-style pub/sub store

### Forms & Validation Engine
Bolt: `form:`
Automatically generates `useState`, submit handlers, and error state mapping.
Validations like `required`, `email`, `min 8` compile into a cohesive `validateForm()` pipeline.

### API Engine
- `fetch "/products" into products` → Generates `useEffect` + `fetch` + `useState`
- `submit "/products"` → Generates `fetch` with `POST`
- `update "/products/1"` → Generates `PUT` request
- `delete "/products/1"` → Generates `DELETE` request

### Authentication System
React Context based Auth injected by the builder.
Features: `login url`, `logout`, `logged_in` conditionals.

### Actions System
Separates business logic from UI.
Bolt: `action createProduct:` → React: `export async function createProduct() {}`
Bolt: `run createProduct()` → React: `await createProduct()`

### Error Mapping System (Source Maps)
Bolt generates `.js.map` source maps. When a runtime error occurs (e.g. Cannot read property 'name'), the custom `BoltErrorBoundary` overlays the exact `.bolt` file and original line number, hiding the React implementation details from the developer.
