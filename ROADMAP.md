# Bolt Future Roadmap

Based on the core necessity of building real-world applications (like e-commerce, SaaS, and CRM platforms), the roadmap for Bolt's development is prioritized as follows:

## [x] Named Styles, Import-by-Name, Default Style Vocabulary & Implicit State ✅
- `input ... into email` declares `email` automatically
- `bolt init` ships a starter `styles.bolt` (card, heading, button-primary, ...)
- `styles:` blocks for reusable Tailwind classes, usable by name in any file
- `use <name>` imports files by name from anywhere in the project

## [ ] Next: Simpler, Smaller Bolt (fewer tokens for people and AI)
- `layout.bolt`: wrap every page in Navbar/Footer without repeating them
- Default loading/error/empty UI for `fetch` from the design system
- `resource` block for one-line CRUD (`resource products at "/api/products"`)
- `bolt stats`: compare Bolt vs generated React size and tokens
- AI tooling: compact cheat-sheet (`llms.txt`) and `bolt check --json` with fix suggestions
- Backend: `model` / `api` blocks that generate an Express + SQLite server

## [x] Phase 9: Dynamic Routing ✅
- URL parameters in page definitions: `page product(id):`
- Multiple params: `page store(storeId, productId):`
- Dynamic linking: `link "View" to product(123)`
- Dynamic navigation: `go to product(product.id)`
- Compile-time parameter count validation
- Route collision detection (duplicate page names)
- Reserved parameter protection (prevents `store id = 5` inside `page product(id):`)
- Fetch reactivity: `useEffect` dependency array auto-populated with route params
- Static routes sorted before dynamic routes for React Router priority

## [ ] Phase 10: Action Return Values
- Allow `action` blocks to explicitly return complex data types.
- Example: `store total = run calculateTotal(cart)`.
- Support async actions and await inference natively (e.g. `store user = run getUser(id)`).
- **Why #2?** Business logic currently relies on side effects. Returning values allows clean, logical data flow.

## [ ] Phase 11: Component Composition
- Add support for the `children` prop.
- Example:
  ```bolt
  Card:
      show "Hello"
      button "Save"
  ```
- **Why #3?** This is React's superpower. It unlocks reusable structural components like Modals, Drawers, Layouts, and Accordions.

## [ ] Phase 12: Multi-prop Components
- Allow passing multiple properties explicitly to a component.
- Example: `component ProductCard takes product, index, onDelete:`
- **Why #4?** Better than forcing everything into a single object wrapper. Improves readability and flexibility.

## [ ] Phase 13: Reactive Effects (Better `useEffect`)
- Seamless real-time reactivity without manual dependency arrays.
- Example:
  ```bolt
  input "Search" into query
  when query changes:
      run fetchResults
  ```
- **Why #5?** Killer feature for real-time search, filters, and debounced API calls.

## [ ] Phase 14: Design System & Theming
- Introduce a `design system:` block for defining global tokens (colors, typography, spacing).
- Native Dark Mode support and semantic color mapping.

## [ ] Phase 15: Tooling Ecosystem
- **VS Code Extension:** Syntax highlighting, autocomplete, and inline diagnostics.
- **Bolt Formatter:** Auto-formatting of `.bolt` files.
