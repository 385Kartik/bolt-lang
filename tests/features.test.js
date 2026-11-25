// Tests for named styles (`styles:`) and import-by-name (`use <name>`).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { compileToAST, compile as compileJs } from '../src/index.js';
import { buildProject, scaffoldProject } from '../src/builder/builder.js';

function makeProject(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bolt-test-'));
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  }
  return root;
}

function build(root) {
  const body = [];
  const walk = d => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (e.name !== '.bolt-generated') walk(p); }
      else if (p.endsWith('.bolt')) {
        const ast = compileToAST(fs.readFileSync(p, 'utf-8'));
        ast.body.forEach(n => { n.fileName = path.basename(p, '.bolt'); });
        body.push(...ast.body);
      }
    }
  };
  walk(root);
  const out = path.join(root, 'src', '.bolt-generated');
  const log = console.log;
  console.log = () => {};
  try {
    buildProject({ type: 'Program', body, line: 1 }, out, '', { projectRoot: root });
  } finally {
    console.log = log;
  }
  return out;
}

const read = (out, rel) => fs.readFileSync(path.join(out, rel), 'utf-8');

test('styles: names expand, compose, and take variant prefixes', () => {
  const root = makeProject({
    'src/styles.bolt': 'styles:\n    card: flex flex-col rounded-2xl\n    product-card: card p-4\n    muted: text-xs text-gray-400\n',
    'src/pages/home.bolt': 'page home:\n    show "A" styled as: product-card mt-2\n    show "B" styled as: md:muted font-bold\n'
  });
  const out = build(root);
  const page = read(out, 'pages/HomePage.jsx');
  assert.match(page, /className="flex flex-col rounded-2xl p-4 mt-2"/);
  assert.match(page, /className="md:text-xs md:text-gray-400 font-bold"/);
});

test('styles: unknown tokens (plain Tailwind) pass through untouched', () => {
  const root = makeProject({
    'src/pages/home.bolt': 'page home:\n    show "A" styled as: text-xl font-bold\n'
  });
  assert.match(read(build(root), 'pages/HomePage.jsx'), /className="text-xl font-bold"/);
});

test('styles: circular and duplicate definitions are compile errors', () => {
  const circular = makeProject({
    'src/styles.bolt': 'styles:\n    a: b\n    b: a\n',
    'src/pages/home.bolt': 'page home:\n    show "A" styled as: a\n'
  });
  assert.throws(() => build(circular), /uses itself/);

  const dup = makeProject({
    'src/one.bolt': 'styles:\n    card: p-1\n',
    'src/two.bolt': 'styles:\n    card: p-2\n',
    'src/pages/home.bolt': 'page home:\n    show "A"\n'
  });
  assert.throws(() => build(dup), /defined twice/);
});

test('use <name>: finds js/json files anywhere and computes the relative path', () => {
  const root = makeProject({
    'lib/deep/helpers.js': 'export const money = x => "$" + x;',
    'data/config.json': '{"name":"x"}',
    'src/pages/home.bolt': 'use helpers\nuse config\n\npage home:\n    show helpers.money(5)\n'
  });
  const page = read(build(root), 'pages/HomePage.jsx');
  assert.match(page, /import \* as helpers from '\.\.\/\.\.\/\.\.\/lib\/deep\/helpers\.js';/);
  assert.match(page, /import config from '\.\.\/\.\.\/\.\.\/data\/config\.json';/);
  assert.match(page, /\{helpers\.money\(5\)\}/);
});

test('use <name>: missing and ambiguous names give clear errors', () => {
  const missing = makeProject({
    'lib/helpers.js': 'export const a = 1;',
    'src/pages/home.bolt': 'use helper\n\npage home:\n    show "A"\n'
  });
  assert.throws(() => build(missing), /Cannot find a file named 'helper'[\s\S]*Did you mean: helpers/);

  const ambiguous = makeProject({
    'a/helpers.js': 'export const a = 1;',
    'b/helpers.js': 'export const b = 1;',
    'src/pages/home.bolt': 'use helpers\n\npage home:\n    show "A"\n'
  });
  assert.throws(() => build(ambiguous), /matches 2 files/);
});

test('use <name>: legacy path/glob form is still accepted', () => {
  const root = makeProject({
    'src/components/Card.bolt': 'component Card for item:\n    show item.name\n',
    'src/pages/home.bolt': 'use components/*\n\npage home:\n    show "A"\n'
  });
  assert.doesNotThrow(() => build(root));
});

test('bolt init: scaffolded project builds and uses the default style vocabulary', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bolt-init-'));
  const log = console.log;
  console.log = () => {};
  try { scaffoldProject(root); } finally { console.log = log; }

  assert.ok(fs.existsSync(path.join(root, 'src', 'styles.bolt')));
  assert.ok(fs.existsSync(path.join(root, 'src', 'pages', 'home.bolt')));

  // theme.css must be imported FIRST, or browsers ignore it (CSS @import rule)
  const css = fs.readFileSync(path.join(root, 'src', 'styles', 'global.css'), 'utf-8');
  assert.ok(css.trimStart().startsWith("@import '../.bolt-generated/theme.css';"));

  const page = read(build(root), 'pages/HomePage.jsx');
  assert.match(page, /text-4xl font-extrabold tracking-tight text-ink/);        // heading
  assert.match(page, /max-w-5xl mx-auto px-6 py-12/);                           // page-wrap
  assert.match(page, /rounded-xl font-semibold/);                               // button-primary
});

test('implicit state: input fields declare their own state, explicit store wins', () => {
  const source = [
    'page login:',
    '    store email = "a@b.com"',
    '    form:',
    '        input "Email" into email',
    '        input "Pass" into password',
    '        submit "Go":',
    '            show toast "ok" as success',
    ''
  ].join('\n');
  const root = makeProject({ 'src/pages/login.bolt': source });
  const page = read(build(root), 'pages/LoginPage.jsx');
  assert.match(page, /const \[password, setPassword\] = useState\(""\);/);
  assert.equal((page.match(/const \[email, setEmail\]/g) || []).length, 1);   // not declared twice
  assert.match(page, /useState\("a@b\.com"\)/);
});

test('layout: wraps every page, supports nested slot and `layout none`', () => {
  const root = makeProject({
    'src/components/Navbar.bolt': ['component Navbar:', '    show "NAV"', ''].join('\n'),
    'src/layout.bolt': ['layout:', '    show Navbar', '    column styled as: p-4:', '        slot', ''].join('\n'),
    'src/pages/home.bolt': ['page home:', '    show "HOME"', ''].join('\n'),
    'src/pages/login.bolt': ['page login:', '    layout none', '    show "LOGIN"', ''].join('\n')
  });
  const out = build(root);
  const home = read(out, 'pages/HomePage.jsx');
  assert.match(home, /<Navbar \/>/);
  assert.match(home, /className="flex flex-col p-4"/);
  assert.ok(home.indexOf('<Navbar') < home.indexOf('HOME'));
  const login = read(out, 'pages/LoginPage.jsx');
  assert.doesNotMatch(login, /Navbar/);
  assert.match(login, /LOGIN/);
});

test('layout: must contain exactly one slot, only one layout allowed', () => {
  const noSlot = makeProject({
    'src/layout.bolt': ['layout:', '    show "x"', ''].join('\n'),
    'src/pages/home.bolt': ['page home:', '    show "HOME"', ''].join('\n')
  });
  assert.throws(() => build(noSlot), /exactly one 'slot'/);

  const two = makeProject({
    'src/a.bolt': ['layout:', '    slot', ''].join('\n'),
    'src/b.bolt': ['layout:', '    slot', ''].join('\n'),
    'src/pages/home.bolt': ['page home:', '    show "HOME"', ''].join('\n')
  });
  assert.throws(() => build(two), /Only one 'layout:'/);
});

test('fetch: default loading and error UI when no handlers are written', () => {
  const root = makeProject({
    'src/components/ProductCard.bolt': ['component ProductCard for product:', '    show product.title', ''].join('\n'),
    'src/pages/home.bolt': ['page home:', '    fetch "/api/products" into products', '    show all products', ''].join('\n')
  });
  const page = read(build(root), 'pages/HomePage.jsx');
  assert.match(page, /productsLoading \? \(<p className="text-gray-400 animate-pulse">Loading\.\.\.<\/p>\)/);
  assert.match(page, /productsError \? \(<p className="text-red-500">Something went wrong: \{productsError\}<\/p>\)/);
  // data is only used after the loading/error checks
  assert.ok(page.indexOf('productsLoading ?') < page.indexOf('products.map'));
});

test('fetch: your own loading/error blocks replace the defaults', () => {
  const source = [
    'page home:',
    '    fetch "/api/p" into items:',
    '        loading:',
    '            show "WAIT"',
    '        error err:',
    '            show "BROKEN"',
    '        success:',
    '            show "DONE"',
    ''
  ].join('\n');
  const root = makeProject({ 'src/pages/home.bolt': source });
  const page = read(build(root), 'pages/HomePage.jsx');
  assert.match(page, /WAIT/);
  assert.match(page, /BROKEN/);
  assert.doesNotMatch(page, /Loading\.\.\./);
  assert.doesNotMatch(page, /Something went wrong/);
});

test('check: reports parse errors with file and line, as data', async () => {
  const { checkProject } = await import('../src/check.js');
  const root = makeProject({
    'src/pages/home.bolt': ['page home:', '    show "ok"', ''].join('\n'),
    'src/pages/about.bolt': ['page about:', '    show @@', ''].join('\n')
  });
  const result = checkProject(root);
  assert.equal(result.ok, false);
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].file, 'src/pages/about.bolt');
  assert.equal(result.errors[0].line, 2);
  assert.match(result.errors[0].message, /Unexpected character/);
});

test('check: reports project-level problems (missing use file) with a hint', async () => {
  const { checkProject } = await import('../src/check.js');
  const root = makeProject({
    'lib/helpers.js': 'export const a = 1;',
    'src/pages/home.bolt': ['use helpr', '', 'page home:', '    show "ok"', ''].join('\n')
  });
  const result = checkProject(root);
  assert.equal(result.ok, false);
  assert.match(result.errors[0].message, /Cannot find a file named 'helpr'/);
  assert.match(result.errors[0].hint, /helpers/);
});

test('check: a good project passes and writes nothing into the project', async () => {
  const { checkProject } = await import('../src/check.js');
  const root = makeProject({ 'src/pages/home.bolt': ['page home:', '    show "ok"', ''].join('\n') });
  const result = checkProject(root);
  assert.equal(result.ok, true);
  assert.equal(fs.existsSync(path.join(root, 'src', '.bolt-generated')), false);
});

test('stats: generated React is bigger than the Bolt source', async () => {
  const { projectStats } = await import('../src/check.js');
  const root = makeProject({ 'src/pages/home.bolt': ['page home:', '    show "ok" as title', ''].join('\n') });
  const s = projectStats(root);
  assert.equal(s.ok, true);
  assert.ok(s.react.tokens > s.bolt.tokens);
  assert.ok(s.ratio > 1);
});

test('CRLF (Windows) files compile the same as LF files', () => {
  const lf = makeProject({ 'src/pages/home.bolt': ['page home:', '    show "ok"', ''].join('\n') });
  const crlf = makeProject({ 'src/pages/home.bolt': ['page home:', '    show "ok"', ''].join('\r\n') });
  assert.equal(read(build(lf), 'pages/HomePage.jsx'), read(build(crlf), 'pages/HomePage.jsx'));
});

test('actions: `store x = run action()` loads asynchronously instead of using await in render', () => {
  const root = makeProject({
    'src/pages/home.bolt': [
      'action total:',
      '    give 5',
      '',
      'page home:',
      '    store t = run total()',
      '    show t',
      ''
    ].join('\n')
  });
  const page = read(build(root), 'pages/HomePage.jsx');
  assert.match(page, /const \[t, setT\] = useState\(null\);/);
  assert.match(page, /actions\.total\(\)\.then\(setT\)/);
  assert.doesNotMatch(page, /useState\(await/);
});

test('resource: one block becomes a working list + add form + delete page', () => {
  const root = makeProject({
    'src/products.bolt': [
      'resource products at "/api/products":',
      '    title text required',
      '    price number',
      ''
    ].join('\n')
  });
  const out = build(root);
  const page = read(out, 'pages/ProductsPage.jsx');
  assert.match(page, /export default function ProductsPage/);
  assert.match(page, /boltFetch\("\/api\/products"\)/);                       // loads the list
  assert.match(page, /method: 'POST'/);                                        // add form
  assert.match(page, /price: \(price \* 1\)/);                                 // number field is sent as a number
  assert.match(page, /method: 'DELETE'/);                                      // delete button
  assert.match(page, /\(items \|\| \[\]\)\.map\(\(item, _i\)/);                // one row per item
  assert.match(page, /if \(!title \|\| title\.trim\(\) === ''\)/);             // required check
  assert.match(read(out, 'App.jsx'), /path="\/products"/);                     // route exists
});

test('resource: bad field type, reserved name and duplicate page are errors', () => {
  const badType = makeProject({ 'src/p.bolt': 'resource p at "/api/p":\n    title banana\n' });
  assert.throws(() => build(badType), /Unknown field type 'banana'/);

  const reserved = makeProject({ 'src/p.bolt': 'resource p at "/api/p":\n    items text\n' });
  assert.throws(() => build(reserved), /uses a name Bolt needs/);

  const dup = makeProject({
    'src/p.bolt': 'resource p at "/api/p":\n    title text\n',
    'src/pages/p.bolt': 'page p:\n    show "x"\n'
  });
  assert.throws(() => build(dup), /p/);
});

test('for every: draws the body once per item inside a page', () => {
  const source = ['page home:', '    store names = ["a", "b"]', '    for every n in names:', '        show n', ''].join('\n');
  const root = makeProject({ 'src/pages/home.bolt': source });
  assert.match(read(build(root), 'pages/HomePage.jsx'), /\(names \|\| \[\]\)\.map\(\(n, _i\)/);
});

test('remove: loop variable named item does not break removal', () => {
  const source = [
    'page home:',
    '    store items = [1, 2]',
    '    for every item in items:',
    '        button "x":',
    '            remove item from items',
    ''
  ].join('\n');
  const root = makeProject({ 'src/pages/home.bolt': source });
  assert.match(read(build(root), 'pages/HomePage.jsx'), /prev\.filter\(_item => _item !== item\)/);
});

test('markers: a fetch with a success body leaves no stray line markers in the page', () => {
  const root = makeProject({
    'src/pages/home.bolt': ['page home:', '    fetch "/api/p" into items', '    show "after"', ''].join('\n')
  });
  assert.doesNotMatch(read(build(root), 'pages/HomePage.jsx'), /__L:/);
});

test('children: `Card:` wraps content, `slot` inside a component receives it, nesting works', () => {
  const root = makeProject({
    'src/components/Card.bolt': ['component Card takes title:', '    column:', '        show title as subtitle', '        slot', ''].join('\n'),
    'src/components/Box.bolt': ['component Box:', '    column:', '        slot', ''].join('\n'),
    'src/pages/home.bolt': [
      'page home:',
      '    Card with title="Hi":',
      '        show "Body"',
      '        Box:',
      '            show "Nested"',
      ''
    ].join('\n')
  });
  const out = build(root);
  const home = read(out, 'pages/HomePage.jsx');
  assert.match(home, /<Card title=\{"Hi"\}>/);
  assert.match(home, /<Box>/);
  assert.ok(home.indexOf('<Card') < home.indexOf('<Box>'));
  assert.ok(home.indexOf('</Box>') < home.indexOf('</Card>'));
  assert.match(read(out, 'components/Card.jsx'), /Card\(\{ title, children \}\)/);
  assert.match(read(out, 'components/Card.jsx'), /\{children\}/);
  assert.match(read(out, 'components/Box.jsx'), /\{children\}/);
});

test('children: `show Card:` and `show children` (the long form) still work', () => {
  const root = makeProject({
    'src/components/Card.bolt': ['component Card:', '    column:', '        show children', ''].join('\n'),
    'src/pages/home.bolt': ['page home:', '    show Card:', '        show "Body"', ''].join('\n')
  });
  const out = build(root);
  assert.match(read(out, 'pages/HomePage.jsx'), /<Card>/);
  assert.match(read(out, 'components/Card.jsx'), /\{children\}/);
});

test('children: a block for an unknown component is a clear error with a suggestion', () => {
  const root = makeProject({
    'src/components/Box.bolt': ['component Box:', '    column:', '        slot', ''].join('\n'),
    'src/pages/home.bolt': ['page home:', '    Bx:', '        show "x"', ''].join('\n')
  });
  assert.throws(() => build(root), /no component named 'Bx'[\s\S]*Did you mean Box/);
});

test('styles: your classes beat Bolt defaults (a red button is not blue)', () => {
  const source = ['page home:', '    button "Delete" styled as: bg-red-600 hover:bg-red-800:', '        print "x"', ''].join('\n');
  const root = makeProject({ 'src/pages/home.bolt': source });
  const page = read(build(root), 'pages/HomePage.jsx');
  assert.match(page, /bg-red-600 hover:bg-red-800/);
  assert.doesNotMatch(page, /bg-blue-600/);
});

test('bolt init: includes a light and dark design system and a theme toggle', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bolt-init-'));
  const log = console.log;
  console.log = () => {};
  try { scaffoldProject(root); } finally { console.log = log; }
  const out = build(root);
  const css = read(out, 'theme.css');
  assert.match(css, /:root \{[\s\S]*--color-background/);
  assert.match(css, /\.dark \{[\s\S]*--color-background/);
  assert.match(read(out, 'pages/HomePage.jsx'), /s\.theme = "dark"/);
  assert.match(read(out, 'store.js'), /prefers-color-scheme: dark/);
});

test('input: fields are visible by default and your classes win', () => {
  const source = ['page home:', '    input "A" into a', '    input "B" into b styled as: border-red-500 rounded-full', ''].join('\n');
  const page = read(build(makeProject({ 'src/pages/home.bolt': source })), 'pages/HomePage.jsx');
  assert.match(page, /placeholder=\{"A"\}[\s\S]*?className="w-full px-4 py-2 border border-gray-300 rounded-lg/);
  const b = page.match(/placeholder=\{"B"\}[\s\S]*?className="([^"]*)"/)[1];
  assert.match(b, /border-red-500/);
  assert.match(b, /rounded-full/);
  assert.doesNotMatch(b, /border-gray-300/);
  assert.doesNotMatch(b, /rounded-lg/);
});

test('check: a single .bolt file can be checked on its own', async () => {
  const { checkProject } = await import('../src/check.js');
  const root = makeProject({
    'good.bolt': 'name = "World"\nprint "Hello, {name}!"\n',
    'bad.bolt': 'page bad:\n    show @@\n'
  });
  assert.equal(checkProject(path.join(root, 'good.bolt')).ok, true);
  const bad = checkProject(path.join(root, 'bad.bolt'));
  assert.equal(bad.ok, false);
  assert.equal(bad.errors[0].file, 'bad.bolt');
  assert.equal(bad.errors[0].line, 2);
});

test('check: endpoint problems are reported (duplicates and broken code)', async () => {
  const { checkProject } = await import('../src/check.js');
  const dup = makeProject({
    'src/a.bolt': 'endpoint get "/api/x":\n    give 1\n\nendpoint get "/api/x":\n    give 2\n'
  });
  const r = checkProject(dup);
  assert.equal(r.ok, false);
  assert.match(r.errors[0].message, /defined twice/);

  const good = makeProject({ 'src/a.bolt': 'endpoint get "/api/x":\n    give 1\n' });
  assert.equal(checkProject(good).ok, true);
});

test('language: count of a.b, items[0] and `filtered by name:` work in any expression', () => {
  const source = [
    'function pick data:',
    '    first_price = data.products[0].price',
    '    total = count of data.products',
    '    cheap = data.products filtered by p: p.price < 10',
    '    give {first_price: first_price, total: total, cheap: cheap}',
    ''
  ].join('\n');
  const js = compileToAST(source) && compileJs(source);
  assert.match(js, /data\.products\[0\]\.price/);
  assert.match(js, /data\.products\.length/);
  assert.match(js, /data\.products\.filter\(p => \(p\.price < 10\)\)/);
});

test('errors: using a Bolt word as a variable name says so', () => {
  assert.throws(() => compileToAST('for every row in rows:\n    show row\n'), err => /already uses/.test(err.hint));
});

test('resource: `hidden` fields parse, and the generated page does not list them', () => {
  const root = makeProject({
    'src/users.bolt': ['resource users at "/api/users":', '    email email required', '    password text required hidden', ''].join('\n')
  });
  const page = read(build(root), 'pages/UsersPage.jsx');
  assert.match(page, /item\.email/);
  assert.doesNotMatch(page, /item\.password/);
  assert.match(page, /setPassword/);                                   // can still be typed into the add form
  assert.throws(() => build(makeProject({ 'src/u.bolt': 'resource u at "/api/u":\n    x text secret\n' })), /Unknown field option 'secret'/);
});

test('http from pages: headers, PATCH, awaited requests in order, and failed requests reach the error block', () => {
  const source = [
    'page home:',
    '    fetch "https://api.example.com/items" into items with headers {Authorization: "Bearer abc"}',
    '    button "Go":',
    '        submit "/api/a" with {a: 1}, headers {"X-Key": "1"}:',
    '            success r:',
    '                print r',
    '        patch "/api/a/1" with {a: 2}',
    '        delete "/api/a/1" with headers {"X-Key": "1"}',
    '        update "/api/a/2" with {a: 3}',
    ''
  ].join('\n');
  const out = build(makeProject({ 'src/pages/home.bolt': source }));
  const page = read(out, 'pages/HomePage.jsx');

  assert.match(page, /boltFetch\("https:\/\/api\.example\.com\/items", \{ headers: \{ Authorization: "Bearer abc" \} \}\)/);
  assert.match(page, /method: 'POST', headers: \{ 'Content-Type': 'application\/json', \.\.\.\(\{ "X-Key": "1" \}\) \}/);
  assert.match(page, /method: 'PATCH'/);
  assert.match(page, /method: 'DELETE', headers: \{ "X-Key": "1" \}/);
  assert.match(page, /method: 'PUT'/);
  assert.equal((page.match(/await boltFetch/g) || []).length, 4);                    // all four run, one after another
  assert.doesNotMatch(page, /return boltFetch/);
  assert.match(page, /\.catch\(err => \{ console\.error\(err\); \}\)/);              // no unhandled failures

  const api = read(out, 'api.js');                                                    // 404 / 500 are errors, not data
  assert.match(api, /if \(!res\.ok\)/);
  assert.match(api, /body\.error \|\| body\.message/);
});

test('language: object keys can be quoted text (for header names)', () => {
  const js = compileJs('function h:\n    give {"Content-Type": "json", plain: 1}\n');
  assert.match(js, /\{ "Content-Type": "json", plain: 1 \}/);
});

test('when changes: requests inside are awaited in order', () => {
  const source = ['page home:', '    store q = ""', '    when q changes:', '        submit "/api/a" with {q: q}', '        delete "/api/b"', ''].join('\n');
  const page = read(build(makeProject({ 'src/pages/home.bolt': source })), 'pages/HomePage.jsx');
  assert.match(page, /useEffect\(\(\) => \{\s*\(async \(\) => \{/);
  assert.equal((page.match(/await boltFetch/g) || []).length, 2);
});

// ── requests in plain words ──────────────────────────────────────────

function pageWith(lines) {
  return read(build(makeProject({ 'src/pages/home.bolt': ['page home:', '    store name = ""', '    store price = ""', '    store token = ""', ...lines.map(l => '    ' + l), ''].join('\n') })), 'pages/HomePage.jsx');
}

test('plain-word requests: fields, renames, fixed values, whole objects and headers', () => {
  const page = pageWith([
    'fetch "https://api.example.com/items" into items with header token as Authorization',
    'button "Go":',
    '    submit "/api/items" with name, price, header token as X-Key',
    '    submit "/api/items" with name as title, "new" as status',
    '    patch "/api/items/1" with name',
    '    delete "/api/items/1" with header token as X-Key',
    '    update "/api/items/2" with all item'
  ]);
  assert.match(page, /boltFetch\("https:\/\/api\.example\.com\/items", \{ headers: \{ "Authorization": token \} \}\)/);
  assert.match(page, /\.\.\.\(\{ "X-Key": token \}\) \}, body: JSON\.stringify\(\{ name: name, price: price \}\)/);   // fields + header
  assert.match(page, /JSON\.stringify\(\{ title: name, status: "new" \}\)/);                                        // rename + fixed value
  assert.match(page, /method: 'PATCH'[^]*?JSON\.stringify\(\{ name: name \}\)/);                                    // one bare name = one field
  assert.match(page, /method: 'DELETE', headers: \{ "X-Key": token \}/);
  assert.match(page, /method: 'PUT'[^]*?JSON\.stringify\(item\)/);                                                  // `all` sends the object as is
});

test('plain-word requests: a member value sends the last word as the field', () => {
  const source = ['page home:', '    store user = {email: "a@b.com"}', '    button "Go":', '        submit "/api/x" with user.email', ''].join('\n');
  assert.match(read(build(makeProject({ 'src/pages/home.bolt': source })), 'pages/HomePage.jsx'), /JSON\.stringify\(\{ email: user\.email \}\)/);
});

test('plain-word requests: the older braces forms still work', () => {
  const page = pageWith([
    'button "Go":',
    '    submit "/api/items" with { name: name, price: price }, headers { "X-Key": token }'
  ]);
  assert.match(page, /JSON\.stringify\(\{ name: name, price: price \}\)/);
  assert.match(page, /\.\.\.\(\{ "X-Key": token \}\)/);
});

test('plain-word requests: mistakes get a clear message', () => {
  const failsWith = (line, pattern) => assert.throws(() => pageWith(['button "Go":', '    ' + line]), pattern);
  failsWith('submit "/api/x" with "new"', /Say what to call this value/);
  failsWith('submit "/api/x" with all name, name', /not both/);
  failsWith('submit "/api/x" with header token', /'as' and the header name/);
  assert.throws(() => pageWith(['fetch "/api/x" into items with name']), /fetch does not send data/);
  assert.throws(() => pageWith(['button "Go":', '    login "/api/login"']), /values to send after the login address/);
});

test('login: success and error blocks, so a wrong password can be shown', () => {
  const page = pageWith([
    'button "Go":',
    '    login "/api/login" with name, price:',
    '        success:',
    '            show toast "Welcome" as success',
    '        error err:',
    '            show toast err.message as danger'
  ]);
  assert.match(page, /JSON\.stringify\(\{ name: name, price: price \}\)/);
  assert.match(page, /loginUser\(data\);\s*addToast\("Welcome", "success"\)/);
  assert.match(page, /\.catch\(async err => \{\s*addToast\(err\.message, "danger"\)/);
});
