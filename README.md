<div align="center">

# ⚡ Bolt

### The frontend language that compiles to React, Vite & Tailwind.
**Write intent. Ship React.**

[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)
![Status](https://img.shields.io/badge/status-experimental-orange)
![Compiles to](https://img.shields.io/badge/compiles%20to-React%20%2B%20Vite%20%2B%20Tailwind-61dafb)
![Zero boilerplate](https://img.shields.io/badge/boilerplate-zero-brightgreen)

</div>

---

Bolt is a **new programming language and compiler** for building web apps. There is no `useState`, no `useEffect`, no router setup and no imports. You describe *what* the UI does. The compiler generates the React, routing, state, forms, auth and API plumbing.

Bolt is not a React replacement. It is an abstraction layer over React, so the output is a normal Vite + React + Tailwind project that works with the whole ecosystem.

```bolt
page home:
    show "Hello, World!" as title
```

becomes a real React page, wired into a router, with source maps back to your `.bolt` line.

## Why Bolt?

| In React you write... | In Bolt you write... |
|---|---|
| `useState`, `useEffect`, loading and error flags | `fetch "/products" into products:` with `loading:` / `error:` / `success:` blocks |
| `<BrowserRouter>`, `<Routes>`, `<Route>` | `page about:` (route is automatic) |
| `useParams()` and template-string URLs | `page product(id):`, `go to product(1)` |
| Form state, validators, submit handlers | `form:` with `required`, `email`, `min 8`, `match` |
| Context providers for auth, toast, modal | `if logged in:`, `show toast "Saved" as success` |
| Zustand or Redux setup | `global store cart = []`, `add product to cart` |
| Reading a stack trace in generated code | Errors point at the exact `.bolt` line |

**Real example from this repo:** the product detail page in [`store-app`](store-app/src/pages/product.bolt) is **47 lines of Bolt**. It compiles to a ~240-line React component.

## A taste of Bolt

```bolt
page product(id):
    show Navbar

    fetch "https://fakestoreapi.com/products/" + id into product:
        loading:
            show "Loading product details..." styled as: text-xl animate-pulse
        error err:
            show err as subtitle styled as: text-red-500
        success:
            show product.title as title styled as: text-4xl font-black
            show "$" + product.price as price

            button "Add to Cart" as primary:
                if logged in:
                    add product to cart
                    show toast "Added to cart!" as success
                otherwise:
                    show toast "Please login first" as danger
                    go to login

    show Footer
```

What the compiler generates for you:

- `/product/:id` route, `useParams()` injected
- `fetch` becomes `useEffect` + state, **re-fetching automatically when `id` changes**
- Auth check, toast system, global cart store
- Tailwind classes from `styled as:`

## Write less: named styles and import-by-name

```bolt
// styles.bolt: write Tailwind once, use the name anywhere
styles:
    card: flex flex-col rounded-2xl border bg-white
    product-card: card hover:shadow-xl p-4

// any page or component
use helpers                      // finds helpers.js anywhere, no paths
show product.title styled as: product-card mt-2
show helpers.money(product.price)
```

## Features

- **Zero boilerplate:** no hooks, no imports, no router config
- **Automatic routing:** pages map to URLs, with dynamic params `page store(storeId, productId):`
- **Compile-time route validation:** `go to product(1, 2)` is a compiler error, not a 404
- **State primitives:** `store` (local), `remember` (persisted to localStorage), `global store` (shared)
- **Smart forms:** built-in validation pipeline
- **Data layer:** `fetch`, `submit`, `update`, `delete` with loading, error and empty states
- **Authentication:** login, logout and `if logged in:` out of the box
- **Collections DSL:** `add`, `remove`, `count of`, `filtered by`, `sorted by`
- **Design system block:** light/dark themes and component variants compile to CSS variables + Tailwind tokens
- **Tailwind built in:** `styled as:` on any element
- **Named styles:** define classes once in `styles:` and use the name anywhere
- **Import by name:** `use helpers` finds `helpers.js` anywhere in the project, no paths
- **Source maps and error overlay:** runtime crashes show the original `.bolt` file and line
- **VS Code extension:** syntax highlighting in [`extensions/bolt-language-support`](extensions/bolt-language-support)
- **Hot reload:** `bolt dev` with Vite HMR

## Quick start

```bash
git clone https://github.com/385Kartik/bolt-lang.git
cd bolt-lang
npm install

# Scaffold a new app
node cli/bolt.js init my-app
cd my-app
npm install
npm run dev
```

### CLI

```
bolt init <dir>                    Scaffold a new Bolt project
bolt dev <dir>                     Dev server with live reload
bolt build <dir>                   Build React files into src/.bolt-generated
bolt run <file.bolt>               Compile and execute
bolt compile <file.bolt> [-o out]  Compile to JS
bolt tokens <file.bolt>            Show token stream (debug)
bolt ast <file.bolt | dir>         Show AST (debug)
```

### Tests

```bash
npm test
```

## How it works

```
 .bolt files → Lexer → Parser → AST → Generator → Builder → Vite project
```

| Stage | File | Role |
|---|---|---|
| Lexer | [`src/lexer`](src/lexer) | Indentation-aware tokenizer |
| Parser | [`src/parser`](src/parser) | Recursive-descent parser producing the AST |
| Generator | [`src/generator/generator.js`](src/generator/generator.js) | AST to React/JSX with source maps |
| Builder | [`src/builder/builder.js`](src/builder/builder.js) | Merges files, validates routes, emits runtime (auth, toast, modal, store, error boundary) |

Deep dive: [ARCHITECTURE.md](ARCHITECTURE.md) · Syntax reference: [LANGUAGE_SPEC.md](LANGUAGE_SPEC.md) · History: [BOLT_HISTORY.md](BOLT_HISTORY.md)

## Demo app

[`store-app/`](store-app) is a full e-commerce demo written in Bolt: home, product listing, product detail, login/signup, admin, contact, team, with a small Express backend.

```bash
node cli/bolt.js build store-app
cd store-app && npm install && npm run dev
```

## Roadmap

Dynamic routing is done. Next up:

- [ ] Action return values (`store total = run calculateTotal(cart)`)
- [ ] Component composition with `children`
- [ ] Multi-prop components
- [ ] Reactive effects (`when query changes:`)
- [ ] Richer design system and theming
- [ ] Formatter, autocomplete and diagnostics

See [ROADMAP.md](ROADMAP.md).

## Status

Bolt is **experimental (v0.1)**. The e2e suite passes (`node --test tests/e2e.test.js`). The language is evolving quickly. Expect rough edges. Issues and ideas are welcome, see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT, built by [Kartik](https://github.com/385Kartik).
