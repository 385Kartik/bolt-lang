# Bolt Language Specification & React Mapping Guide

Welcome to the comprehensive Bolt language specification. This document outlines every feature of the Bolt language, its exact syntax, and **what React code the compiler generates** under the hood. 

This guide serves as both a reference for writing Bolt code and an architecture insight into how Bolt abstracts complex React boilerplate.

---

## 1. Pages and Components

Bolt automatically handles React components, functional exports, and props.

### 1.1 Pages
Pages automatically hook into React Router and map to a route.

**Bolt Code:**
```bolt
page home:
    show "Welcome to Bolt!"
```

**Generated React Code:**
```jsx
// src/pages/HomePage.jsx
import React from 'react';

export default function HomePage() {
  return (
    <>
      <p>Welcome to Bolt!</p>
    </>
  );
}
```

### 1.1.1 Layout (shared wrapper for every page)

Write the parts every page shares (navbar, footer, page width) **once** in a `layout:` block,
in any file (usually `layout.bolt`). `slot` marks where each page's content goes.

```bolt
// layout.bolt
layout:
    show Navbar
    column styled as: page-wrap:
        slot
    show Footer
```

Every page is wrapped automatically, so pages no longer start with `show Navbar` and end with
`show Footer`. A page that should not use the layout (login, landing page) says so:

```bolt
page login:
    layout none
    show "Welcome back"
```

Rules: a project has at most one `layout:`, and it must contain exactly one `slot`. `slot` can be
nested inside other elements.

### 1.2 Components
Components are reusable pieces of UI. The compiler automatically identifies properties via the `for` keyword and turns them into React props.

**Bolt Code:**
```bolt
component ProductCard for product:
    show product.name as title
```

**Generated React Code:**
```jsx
// src/components/ProductCard.jsx
import React from 'react';

export default function ProductCard({ product }) {
  return (
    <>
      <h1>{product.name}</h1>
    </>
  );
}
```

---

### 1.2.1 Actions that return values

An `action` can `give` a value back. Use it in a `store` with `run`:

```bolt
action calculateTotal:
    give 5

page cart:
    store total = run calculateTotal()
    show total
```

Actions are async, so `total` is `null` for a moment and then fills in with the result.

### 1.2.2 Components with children (wrappers)

A component can wrap other content: modals, cards, panels, accordions. Put `slot` where the
wrapped content goes. To use it, write the component name followed by `:` and indent the content.

**Bolt Code:**
```bolt
// components/Card.bolt
component Card takes title:
    column styled as: card:
        show title as subtitle
        slot

// pages/home.bolt
page home:
    Card with title="Settings":
        show "Everything inside goes into the slot."
        Box:
            show "Wrappers can be nested."
```

**Generated React Code:**
```jsx
function Card({ title, children }) {
  return <div className="..."><h2>{title}</h2>{children}</div>;
}

<Card title={"Settings"}>
  <p>Everything inside goes into the slot.</p>
  <Box><p>Wrappers can be nested.</p></Box>
</Card>
```

- A component name starts with a capital letter. `Card:` and `show Card:` mean the same thing.
- `slot` inside a component and `show children` are the same. `slot` is also the word used by `layout:`.
- Props work as before: `Card with title="Hi":`.
- Using `Nope:` when no component `Nope` exists is a compile error with a "Did you mean ..." hint.

### 1.3 Dynamic Pages (URL Parameters)
Pages can accept URL parameters for dynamic routing. The compiler generates React Router's `useParams()` automatically.

**Bolt Code:**
```bolt
page product(id):
    fetch env.API_URL + "/products/" + id into product
    show product.name as title
```

**Generated React Code:**
```jsx
import { useParams } from 'react-router-dom';

export default function ProductPage() {
  const { id } = useParams();

  // fetch with useEffect dependency on [id]
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/products/${id}`)...
  }, [id]);  // Re-fetches when id changes!
}
```

**Multiple Parameters:**
```bolt
page store(storeId, productId):
    show "Store: {storeId}, Product: {productId}"
```
→ Route: `/store/:storeId/:productId`

**Dynamic Links & Navigation:**
```bolt
link "View Product" to product(42)
go to product(product.id)
go to store(store.id, product.id)
```
→ `<Link to={\`/product/${42}\`}>`, `navigate(\`/product/${product.id}\`)`, etc.

**Compile-time Validation:**
- `link "X" to product()` → Error: Route 'product' expects 1 parameter. Received 0.
- `go to store(id)` when `page store(storeId, productId):` → Error: expects 2, received 1.
- `store id = 5` inside `page product(id):` → Error: 'id' is a route parameter.

---

## 2. Rendering UI

Bolt abstracts away JSX tags with simple rendering commands.

### 2.1 Basic Text and Expressions
**Bolt Code:**
```bolt
show "Hello World"
show count
show "Welcome {user.name}!"
```

**Generated React Code:**
```jsx
<p>Hello World</p>
<p>{count}</p>
<p>{`Welcome ${user.name}!`}</p>
```

### 2.2 Semantic HTML Hints
You can use `as` to specify semantic meaning.

**Bolt Code:**
```bolt
show "Hello" as title
show "Subtitle" as subtitle
```

**Generated React Code:**
```jsx
<h1>Hello</h1>
<h2>Subtitle</h2>
```

### 2.3 Interactive Elements
**Bolt Code:**
```bolt
button "Click Me":
    print "Clicked"

link "Go Home" to home
go to checkout
```

**Generated React Code:**
```jsx
<button onClick={() => console.log("Clicked")}>Click Me</button>

<Link to="/">Go Home</Link>

// go to compiles to:
navigate("/checkout");
```

### 2.4 Media
**Bolt Code:**
```bolt
image "https://example.com/img.png"
video "https://example.com/vid.mp4"
```

**Generated React Code:**
```jsx
<img src="https://example.com/img.png" alt="Generated by Bolt" />
<video src="https://example.com/vid.mp4" controls />
```

### 2.5 Popups
**Bolt Code:**
```bolt
toast "Saved successfully"
modal "Are you sure?"
```

**Generated React Code:**
```jsx
// Requires toast provider configuration internally
toast("Saved successfully");
showModal("Are you sure?");
```

---

## 3. Rendering Collections (Lists)

Bolt eliminates manual `.map()` loops and automatically infers component usage.

### 3.1 Implicit Component Inference
If a component named `ProductCard` exists and you pass `products`, Bolt binds them.

**Bolt Code:**
```bolt
show all products
```

**Generated React Code:**
```jsx
{products.map((item, index) => (
  <ProductCard key={index} product={item} />
))}
```

### 3.2 Explicit Component Rendering
**Bolt Code:**
```bolt
show ProductCard for each product in products
```

**Generated React Code:**
```jsx
{products.map((product, index) => (
  <ProductCard key={index} product={product} />
))}
```

---

## 4. Layouts

Bolt provides built-in responsive wrappers.

**Bolt Code:**
```bolt
row:
    show "Left"
    show "Right"

column:
    show "Top"
    show "Bottom"

grid 3:
    show all products
```

**Generated React Code:**
```jsx
<div className="flex flex-row flex-wrap">
   <p>Left</p>
   <p>Right</p>
</div>

<div className="flex flex-col">
   <p>Top</p>
   <p>Bottom</p>
</div>

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
   {products.map(...)}
</div>
```

---

## 5. Styling Engine

Styling uses the `styled as:` keyword, which passes utility classes directly to Tailwind CSS.

**Bolt Code:**
```bolt
show "Warning" styled as: text-red-500 font-bold
button "Save" styled as: bg-blue-600 rounded px-4 py-2 text-white
```

**Generated React Code:**
```jsx
<p className="text-red-500 font-bold">Warning</p>
<button className="bg-blue-600 rounded px-4 py-2 text-white">Save</button>
```

### 5.1 Named Styles (`styles:`)

Write your Tailwind classes **once**, give them a name, and use the name anywhere,
in any file. Put them in a file like `styles.bolt` (any file works, names are global).

**Bolt Code:**
```bolt
// styles.bolt
styles:
    card: flex flex-col rounded-2xl border border-gray-100 bg-white
    muted: text-xs text-gray-400
    product-card: card hover:shadow-xl p-4      // styles can use other styles
```

```bolt
// pages/home.bolt
show product.title styled as: product-card mt-2     // names + normal Tailwind mix freely
show product.note  styled as: md:muted              // variant prefixes work on names too
```

**Default vocabulary:** `bolt init` creates `src/styles.bolt` with ready-made names, so new pages never start from raw Tailwind. Edit or delete any of them.

| Group | Names |
|---|---|
| Layout | `page-wrap`, `stack`, `cluster`, `center` |
| Surfaces | `card`, `panel` |
| Text | `heading`, `subheading`, `body`, `muted`, `link` |
| Controls | `button-primary`, `button-secondary`, `field`, `badge` |

**Rules:**
- A name expands to its classes at compile time, so the output is plain Tailwind.
- Anything that is not a style name is passed through unchanged.
- A style name wins over a Tailwind class with the same name.
- Defining the same name twice, or a style that uses itself, is a compile error.

---

### 5.2 Your classes always win

Bolt gives elements default classes (a button is blue, a `row` is a flex row). When you write
`styled as:`, your classes replace the default ones of the same kind, so what you write is what
you get:

```bolt
button "Delete" styled as: bg-red-600 hover:bg-red-800
```

The default blue background (and the default blue hover color) are removed. Defaults you did not
touch (padding, rounded corners ...) stay. `p-8` replaces default `px-4 py-2`, `flex-col` replaces
`flex-row`, and so on. Breakpoints are kept apart (`md:p-8` only replaces a default `md:p-*`).

Inputs follow the same rule: every `input` gets a visible default look (border, padding, rounded corners),
and your `styled as:` classes replace the parts you set.

### 5.3 Colors and dark mode (design system)

`bolt init` creates `src/design.bolt` with a light and a dark theme using named colors:

```bolt
design system:
    themes:
        light:
            background: "#ffffff"
            surface: "#f8fafc"
            ink: "#0f172a"
            soft: "#64748b"
            line: "#e2e8f0"
            brand: "#2563eb"
            onbrand: "#ffffff"
        dark:
            background: "#0b1220"
            ...
```

Every name becomes a Tailwind color that switches with the theme: `bg-surface`, `text-ink`,
`border-line`, `bg-brand`. The default style vocabulary (`card`, `heading`, `button-primary` ...)
is written with these names, so dark mode works with no extra work. Add or rename colors freely.

Switch the theme from any page. The first visit follows the device setting, and the choice is
remembered:

```bolt
button "Toggle dark mode":
    if theme == "dark":
        theme = "light"
    otherwise:
        theme = "dark"
```

---

## 6. State Management

Bolt handles all state management without manual `useState` or `useEffect` hooks.

### 6.1 Local State
**Bolt Code:**
```bolt
store count = 0
count = count + 1
```

**Generated React Code:**
```jsx
const [count, setCount] = useState(0);

// on assignment:
setCount(count + 1);
```

### 6.2 Persistent State (LocalStorage)
**Bolt Code:**
```bolt
remember theme = "dark"
theme = "light"
forget theme
```

**Generated React Code:**
```jsx
// Custom hook handling React state + localStorage
const [theme, setTheme] = useLocalStorage("theme", "dark");

setTheme("light");
localStorage.removeItem("theme");
```

### 6.3 Global State (Zustand-style)
**Bolt Code:**
```bolt
global store cart = []
```

**Generated React Code:**
```jsx
// Generated in src/store.js
export const useStore = create((set) => ({
  cart: [],
  setCart: (val) => set({ cart: val })
}));

// In component:
const cart = useStore(state => state.cart);
const setCart = useStore(state => state.setCart);
```

### 6.4 Reactivity (Effects)
**Bolt Code:**
```bolt
when count changes:
    print "Changed!"
```

**Generated React Code:**
```jsx
useEffect(() => {
   console.log("Changed!");
}, [count]);
```

---

## 7. Collections Logic (Arrays)

Bolt provides readable English syntax for Javascript array methods.

**Bolt Code:**
```bolt
add item to cart
remove item from cart
check if item in cart

store num = count of cart
store first_item = first of cart
store last_item = last of cart

store adults = users filtered by user: user.age >= 18
store sorted_users = users sorted by name
```

**Generated React Code:**
```jsx
setCart([...cart, item]);
setCart(cart.filter(_item => _item !== item));
cart.includes(item);

const num = cart.length;
const first_item = cart[0];
const last_item = cart[cart.length - 1];

const adults = users.filter(user => user.age >= 18);
const sorted_users = [...users].sort((a,b) => a.name > b.name ? 1 : -1);
```

---

## 8. Forms & Validation

Bolt completely abstracts React Controlled Components and form state management.

**Bolt Code:**
```bolt
form:
    input "Email Address" into email required email
    input "Password" into password required min 8
    
    submit "Login":
        print "Submitting " + email
```

> **No `store` needed:** `input ... into email` declares `email` for you (as an empty text
> state). Write `store email = "something"` yourself only when you want a different
> starting value. Names already used as a store, remember, route parameter, component
> prop or global store are never redeclared.

**Generated React Code:**
```jsx
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [formErrors, setFormErrors] = useState({});

const validateForm = () => {
   let errors = {};
   if (!email) errors.email = "Required";
   else if (!/\S+@\S+\.\S+/.test(email)) errors.email = "Invalid email format";
   
   if (!password) errors.password = "Required";
   else if (password.length < 8) errors.password = "Minimum length is 8";
   
   setFormErrors(errors);
   return Object.keys(errors).length === 0;
};

const handleSubmit = (e) => {
   e.preventDefault();
   if (validateForm()) {
       console.log("Submitting " + email);
   }
};

return (
  <form onSubmit={handleSubmit}>
    <input 
       placeholder="Email Address"
       value={email} 
       onChange={e => setEmail(e.target.value)} 
       className={formErrors.email ? "error" : ""}
    />
    {formErrors.email && <span>{formErrors.email}</span>}
    
    <input 
       placeholder="Password"
       value={password} 
       onChange={e => setPassword(e.target.value)} 
    />
    {formErrors.password && <span>{formErrors.password}</span>}

    <button type="submit">Login</button>
  </form>
);
```

---

## 9. API & Data Fetching

Bolt makes networking declarative, handling loading and error states automatically.

### 9.1 Fetching Data (GET)
**Bolt Code:**
```bolt
fetch "/api/products" into products
    loading:
        show "Loading..."
    error:
        show "Failed to load"
    empty:
        show "No products"
```

**Generated React Code:**
```jsx
const [products, setProducts] = useState(null);
const [productsLoading, setProductsLoading] = useState(true);
const [productsError, setProductsError] = useState(null);

useEffect(() => {
  setProductsLoading(true);
  fetch("/api/products")
    .then(res => res.json())
    .then(data => {
      setProducts(data);
      setProductsLoading(false);
    })
    .catch(err => {
      setProductsError(err);
      setProductsLoading(false);
    });
}, []);

// Render logic generated:
if (productsLoading) return <p>Loading...</p>;
if (productsError) return <p>Failed to load</p>;
if (!products || products.length === 0) return <p>No products</p>;
// (Continues to render products)
```

**Default loading and error UI:** the shortest form needs no blocks at all.

```bolt
fetch "/api/products" into products
show all products
```

Bolt shows `Loading...` while the request runs and `Something went wrong: <message>`
if it fails, and only then renders the rest of the page with your data. Write your own
`loading:`, `error:` or `empty:` block whenever you want a different look. Your block
replaces only that default.

### 9.2 Mutating Data (POST, PUT, DELETE)
**Bolt Code:**
```bolt
submit "/api/users" with user_data
update "/api/users/1" with user_data
delete "/api/users/1"
```

**Generated React Code:**
```jsx
await fetch("/api/users", {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(user_data)
});

await fetch("/api/users/1", {
  method: 'PUT', ...
});

await fetch("/api/users/1", {
  method: 'DELETE'
});
```

---

### 9.3 Resource (a whole CRUD page in one block)

`resource` builds a page that lists records, adds new ones and deletes them. You only
describe the data.

**Bolt Code:**
```bolt
resource products at "/api/products":
    title text required
    price number
    contact email
```

Each field line is `name type` plus the optional word `required`. Types: `text`, `number`, `email`
(`email` also checks the format).

**What you get:** a page at `/products` with the list, an "Add" form (with validation, a toast on
success or failure) and a Delete button on every row. It is a normal page, so `layout:` and named
styles work with it, and the page name (`products`) cannot clash with another page.

**Your API should follow the usual REST shape:**

| Action | Request | Expected answer |
|---|---|---|
| List | `GET /api/products` | a list of records |
| Add | `POST /api/products` | the new record (with its `id`) |
| Delete | `DELETE /api/products/<id>` | anything, an empty answer is fine |

Field names `items`, `item` and `created` are reserved. `number` fields are sent as numbers.

**You do not have to write that API.** Bolt ships one. `bolt dev` starts it for you on port 3001
(set `BOLT_API_PORT` to change it) and the dev server forwards `/api/...` to it. Or run it alone:

```bash
bolt serve
```

For every `resource` it provides `GET`, `POST`, `PUT`, `PATCH` and `DELETE`, checks the fields
(required, number, email) and answers `400` with the problems when something is wrong. Data is
saved as plain JSON in `.bolt-data/<name>.json` (already in the `.gitignore` made by `bolt init`),
so you can read or edit it by hand. It is meant for development and prototypes; point the
`resource` at your own server when you go to production.

**SQLite instead of JSON files.** By default records are JSON files (easy to read and edit). For a single
database file run `bolt serve --db sqlite`, or set `BOLT_DB=sqlite` (this also works with `bolt dev`).
Records then live in `.bolt-data/bolt.db`. Records you saved earlier as JSON are moved over the first time.
SQLite needs Node 22.5 or newer (Node marks it experimental, so it prints a warning). Everything else
(resources, endpoints, login helpers) works the same on both.

### 9.4 Your own API routes (`endpoint`)

`resource` covers list, add and delete. For everything else (search, totals, login, bulk actions)
write an `endpoint`. It runs on the built-in server (`bolt dev` / `bolt serve`), in Bolt:

**Bolt Code:**
```bolt
endpoint get "/api/search":
    q = request.query.q
    give data.products filtered by p: contains p.title, q

endpoint get "/api/products/:id/discount":
    found = data.products filtered by p: p.id == request.params.id * 1
    if count of found == 0:
        reply 404, "No such product"
    give {price: found[0].price * 0.9}

endpoint post "/api/products/bulk":
    for every entry in request.body.items:
        add entry to data.products
    give {added: count of request.body.items}
```

Then the page can call it like any API: `fetch "/api/search?q=pen" into results`.

- **Methods:** `get`, `post`, `put`, `patch`, `delete`. The address can have `:name` parts.
- **`request`:** `request.query` (the `?a=b` part), `request.params` (the `:name` parts), `request.body` (JSON sent by the page), `request.method`, `request.path`.
- **`data`:** the records of every `resource`, for example `data.products`. Reading `data.products` and adding to it (`add entry to data.products`) is saved to disk for you.
- **`give`** sends the answer as JSON (nothing given = empty answer). **`reply 404, "message"`** stops with an error status; the page gets `{"error": "message"}`.
- **Helpers:** `contains text, word` (ignores upper/lower case), `lower text`, `upper text`, `now`.
- **Order:** your endpoints are checked before the `resource` routes, so `/api/products/stats` is not mistaken for a product with the id `stats`.
- `bolt check` compiles every endpoint and reports mistakes (including two endpoints with the same method and address).
- It is for development and prototypes. A crash inside an endpoint answers `500` with the reason.

Small helpers in the language that endpoints use (they work everywhere): `items[0]` (item at a position, no space before the bracket), `count of data.products` (works on `a.b` too), and `users filtered by user: user.age >= 18` (name each item yourself).

### 9.5 Login for your API (passwords and tokens)

Endpoints come with login helpers, so you can build signup and login in a few lines:

```bolt
resource users at "/api/users":
    email email required
    password text required hidden

endpoint post "/api/signup":
    email = request.body.email
    exists = data.users filtered by u: u.email == email
    if count of exists > 0:
        reply 409, "Email already used"
    user = {id: count of data.users + 1, email: email, password: hash_password request.body.password}
    add user to data.users
    payload = {id: user.id, email: email}
    token = sign_token payload
    give {token: token, user: payload}

endpoint post "/api/login":
    found = data.users filtered by u: u.email == request.body.email
    if count of found == 0:
        reply 401, "Wrong email or password"
    user = found[0]
    if not check_password request.body.password, user.password:
        reply 401, "Wrong email or password"
    payload = {id: user.id, email: user.email}
    token = sign_token payload
    give {token: token, user: payload}

endpoint get "/api/me":
    me = need_login request
    give me
```

- `hash_password text` returns a safe hash to store (never store the plain password). `check_password text, hash` is true when they match.
- `sign_token payload` returns a signed token that expires in 7 days. A page that calls `login "/api/login" with credentials` keeps it, and every later request sends it as `Authorization: Bearer <token>`.
- `request.user` is the token's payload, or empty when nobody is logged in. `need_login request` stops with `401 Login required` when there is no user, and returns the user otherwise.
- A resource field marked **`hidden`** is saved but never sent to the browser (the list, get and add answers leave it out). Inside an endpoint, `data.users` still has it.
- The signing secret is created once in `.bolt-data/.secret`. Keep `.bolt-data` out of git (`bolt init` already does).
- Inside `{ ... }` give plain values: write `token = sign_token payload` on its own line first, then use `token`.
- This is meant for development and prototypes. Use a hardened auth service for a real production site.

---

## 10. Authentication

Bolt handles conditional UI access and integrates with a generated AuthProvider.

**Bolt Code:**
```bolt
if logged in:
    show "Dashboard"
otherwise:
    go to login

login "/api/login" with credentials
logout
```

**Generated React Code:**
```jsx
// Using the generated AuthContext:
const { user, loginFn, logoutFn } = useAuth();

if (user) {
    // Render Dashboard
} else {
    navigate("/login");
}

// login compiles to:
await loginFn("/api/login", credentials);

// logout compiles to:
logoutFn();
```

---

## 11. Control Flow & Conditionals

### 11.1 If / Else
**Bolt Code:**
```bolt
if count > 10:
    show "High"
otherwise if count > 5:
    show "Medium"
otherwise:
    show "Low"
```

**Generated React Code:**
```jsx
{count > 10 ? (
  <p>High</p>
) : count > 5 ? (
  <p>Medium</p>
) : (
  <p>Low</p>
)}
```

### 11.2 Iteration
**Bolt Code:**
```bolt
repeat 5 times:
    print "Hello"

for every user in users:
    print user.name
```

Inside a page or component, `for every` draws its body once for each item:

```bolt
page team:
    store people = [{name: "Asha"}, {name: "Ravi"}]
    for every person in people:
        show person.name
```

**Generated React Code:**
```jsx
for (let i = 0; i < 5; i++) {
  console.log("Hello");
}

for (const user of users) {
  console.log(user.name);
}
```

---

## 12. Actions (Business Logic)

Bolt allows moving complex logic out of the view layer.

**Bolt Code:**
```bolt
action calculateTotal for items:
    store total = 0
    // do math
    give total

run calculateTotal with cart
```

**Generated React Code:**
```jsx
export async function calculateTotal(items) {
    let total = 0;
    // ...
    return total;
}

await calculateTotal(cart);
```

---

## 13. Modules & Architecture

Bolt code is organized similarly to modern frameworks, utilizing imports seamlessly.

**Bolt Code:**
```bolt
use helpers        // finds helpers.js anywhere in the project
use config         // finds config.json anywhere in the project
use theme          // finds theme.css anywhere in the project
```

`use <name>` takes **just the file name**, never a path. The compiler searches the
whole project (skipping `node_modules`, `dist`, `.bolt-generated`) and works out the
relative path for you.

- `.js` / `.ts` files: use their exports as `helpers.money(5)`
- `.json` files: use the data as `config.name`
- `.css` files: loaded automatically
- `.bolt` files: already merged project-wide, `use` just checks that the file exists
- Names with dashes become camelCase: `use my-utils` gives `myUtils`
- If two files share a name, you get an error listing both. Write the full file name
  (`use helpers.js`) or rename one of them.
- A typo gives a "Did you mean ...?" hint.

The old form `use components/*` still works but is no longer needed.

**Generated React Code:**
```jsx
// The compiler reads all matching files, merges their ASTs,
// and resolves all dependencies globally so you don't have to write
// manual import statements for each component in your files!
```

---

## 14. Formal Grammar

For compiler engineers and contributors, this is a subset of the formal grammar used by the Bolt parser:

```ebnf
PageDef
    := page IDENTIFIER ( '(' IDENTIFIER (',' IDENTIFIER)* ')' )? : Block

GoTo
    := go to IDENTIFIER ( '(' Expression (',' Expression)* ')' )?

LinkStatement
    := link Expression to IDENTIFIER ( '(' Expression (',' Expression)* ')' )? (styled as: RawStyle)?

ComponentDef
    := component IDENTIFIER for IDENTIFIER : Block

ActionDef
    := action IDENTIFIER for IDENTIFIER : Block

StoreDeclaration
    := store IDENTIFIER = Expression

RememberDeclaration
    := remember IDENTIFIER = Expression

GlobalStoreDeclaration
    := global store IDENTIFIER = Expression (persist)?

ShowStatement
    := show Expression (as IDENTIFIER)? (styled as: RawStyle)?
    | show all IDENTIFIER (styled as: RawStyle)?
    | show IDENTIFIER for each IDENTIFIER in IDENTIFIER (styled as: RawStyle)?

ButtonStatement
    := button StringLiteral (styled as: RawStyle)? : Block

FetchStatement
    := fetch StringLiteral into IDENTIFIER Block

StylesDef
    := styles : INDENT (StyleName : ClassList NEWLINE)+ DEDENT
    StyleName := [A-Za-z_][A-Za-z0-9_-]*

UseStatement
    := use FileName                      // find the file by name anywhere in the project
    | use Path/Glob                      // legacy form, accepted and ignored

CallExpression
    := Identifier ('.' IDENTIFIER)+ '(' (Expression (',' Expression)*)? ')'   // no space before '('

ResourceDef
    := resource IDENTIFIER at StringLiteral : INDENT (IDENTIFIER Type required?)+ DEDENT
    Type := text | number | email

EndpointDef
    := endpoint (get|post|put|patch|delete) StringLiteral : Block

IndexExpression
    := Expression '[' Expression ']'          // no space before '['

Block
    := INDENT Statement* DEDENT
```
