// Tests for the built-in API server that powers `resource` blocks.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApiServer, validateRecord } from '../src/server/api.js';

const fields = [
  { name: 'title', type: 'text', required: true },
  { name: 'price', type: 'number', required: false },
  { name: 'contact', type: 'email', required: false }
];

test('validateRecord: required, number and email checks', () => {
  assert.deepEqual(validateRecord(fields, { title: 'Pen', price: '12', contact: 'a@b.com' }).value,
    { title: 'Pen', price: 12, contact: 'a@b.com' });

  const bad = validateRecord(fields, { price: 'x', contact: 'nope' });
  assert.deepEqual(bad.errors, ['title is required', 'price must be a number', 'contact must be a valid email']);
});

test('API: create, list, get, patch, delete and persist to a JSON file', async () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bolt-api-'));
  const api = createApiServer({ resources: [{ name: 'products', url: '/api/products', fields }], dataDir });
  const port = await api.listen(0);
  const base = `http://localhost:${port}/api/products`;
  const json = { 'Content-Type': 'application/json' };

  try {
    let res = await fetch(base, { method: 'POST', headers: json, body: JSON.stringify({ title: 'Pen', price: '12' }) });
    assert.equal(res.status, 201);
    assert.deepEqual(await res.json(), { id: 1, title: 'Pen', price: 12 });

    res = await fetch(base, { method: 'POST', headers: json, body: JSON.stringify({ price: 3 }) });
    assert.equal(res.status, 400);
    assert.match((await res.json()).error, /title is required/);

    res = await fetch(base);
    assert.equal((await res.json()).length, 1);

    res = await fetch(`${base}/1`, { method: 'PATCH', headers: json, body: JSON.stringify({ price: 20 }) });
    assert.deepEqual(await res.json(), { id: 1, title: 'Pen', price: 20 });

    const onDisk = JSON.parse(fs.readFileSync(path.join(dataDir, 'products.json'), 'utf-8'));
    assert.equal(onDisk[0].price, 20);

    res = await fetch(`${base}/1`, { method: 'DELETE' });
    assert.equal(res.status, 200);
    res = await fetch(`${base}/1`);
    assert.equal(res.status, 404);

    res = await fetch(`http://localhost:${port}/nothing`);
    assert.equal(res.status, 404);
  } finally {
    await api.close();
  }
});

test('API: ids keep counting up after a delete and data survives a restart', async () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bolt-api-'));
  const resource = { name: 'notes', url: '/api/notes', fields: [{ name: 'text', type: 'text', required: true }] };
  const json = { 'Content-Type': 'application/json' };

  let api = createApiServer({ resources: [resource], dataDir });
  let port = await api.listen(0);
  await fetch(`http://localhost:${port}/api/notes`, { method: 'POST', headers: json, body: JSON.stringify({ text: 'a' }) });
  await api.close();

  api = createApiServer({ resources: [resource], dataDir });
  port = await api.listen(0);
  try {
    const res = await fetch(`http://localhost:${port}/api/notes`, { method: 'POST', headers: json, body: JSON.stringify({ text: 'b' }) });
    assert.equal((await res.json()).id, 2);
    const list = await (await fetch(`http://localhost:${port}/api/notes`)).json();
    assert.deepEqual(list.map(r => r.text), ['a', 'b']);
  } finally {
    await api.close();
  }
});

// ── custom endpoints ──────────────────────────────────────────────────

import { compileToAST } from '../src/index.js';

function endpointsFrom(source) {
  return compileToAST(source).body.filter(n => n.type === 'EndpointDef');
}

test('endpoints: search, params, reply and writes work over real HTTP', async () => {
  const eps = endpointsFrom([
    'endpoint get "/api/search":',
    '    q = request.query.q',
    '    give data.products filtered by p: contains p.title, q',
    '',
    'endpoint get "/api/products/stats":',
    '    give {count: count of data.products}',
    '',
    'endpoint get "/api/products/:id/discount":',
    '    found = data.products filtered by p: p.id == request.params.id * 1',
    '    if count of found == 0:',
    '        reply 404, "No such product"',
    '    give {price: found[0].price * 0.9}',
    '',
    'endpoint post "/api/products/bulk":',
    '    for every entry in request.body.items:',
    '        add entry to data.products',
    '    give {added: count of request.body.items}',
    ''
  ].join('\n'));
  assert.equal(eps.length, 4);

  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bolt-ep-'));
  const resource = { name: 'products', url: '/api/products', fields: [
    { name: 'title', type: 'text', required: true }, { name: 'price', type: 'number', required: false }] };
  const api = createApiServer({ resources: [resource], endpoints: eps, dataDir });
  const port = await api.listen(0);
  const base = `http://localhost:${port}/api`;
  const json = { 'Content-Type': 'application/json' };

  try {
    for (const p of [{ title: 'Red Pen', price: 10 }, { title: 'Blue Pen', price: 20 }, { title: 'Notebook', price: 50 }]) {
      await fetch(`${base}/products`, { method: 'POST', headers: json, body: JSON.stringify(p) });
    }

    let res = await fetch(`${base}/search?q=PEN`);                           // case-insensitive contains
    assert.deepEqual((await res.json()).map(r => r.title), ['Red Pen', 'Blue Pen']);

    res = await fetch(`${base}/products/stats`);                             // beats /products/:id
    assert.deepEqual(await res.json(), { count: 3 });

    res = await fetch(`${base}/products/3/discount`);                        // path parameter
    assert.deepEqual(await res.json(), { price: 45 });

    res = await fetch(`${base}/products/99/discount`);                       // reply 404
    assert.equal(res.status, 404);
    assert.deepEqual(await res.json(), { error: 'No such product' });

    res = await fetch(`${base}/products/bulk`, { method: 'POST', headers: json,
      body: JSON.stringify({ items: [{ id: 10, title: 'X', price: 1 }, { id: 11, title: 'Y', price: 2 }] }) });
    assert.deepEqual(await res.json(), { added: 2 });
    assert.equal(JSON.parse(fs.readFileSync(path.join(dataDir, 'products.json'), 'utf-8')).length, 5);   // saved to disk

    res = await fetch(`${base}/products/1`);                                 // normal resource routes still work
    assert.equal((await res.json()).title, 'Red Pen');
  } finally {
    await api.close();
  }
});

test('endpoints: wrong method falls through, and a crash is a clear 500', async () => {
  const eps = endpointsFrom('endpoint get "/api/boom":\n    give request.nothing.here\n');
  const api = createApiServer({ resources: [], endpoints: eps, dataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'bolt-ep-')) });
  const port = await api.listen(0);
  try {
    let res = await fetch(`http://localhost:${port}/api/boom`);
    assert.equal(res.status, 500);
    assert.match((await res.json()).error, /GET \/api\/boom failed/);
    res = await fetch(`http://localhost:${port}/api/boom`, { method: 'POST', body: '{}' });
    assert.equal(res.status, 404);
  } finally {
    await api.close();
  }
});

// ── login helpers and hidden fields ───────────────────────────────────

test('auth: signup, login, tokens, hidden password field', async () => {
  const resources = [{ name: 'users', url: '/api/users', fields: [
    { name: 'email', type: 'email', required: true },
    { name: 'password', type: 'text', required: true, hidden: true }] }];
  const eps = endpointsFrom([
    'endpoint post "/api/signup":',
    '    email = request.body.email',
    '    exists = data.users filtered by u: u.email == email',
    '    if count of exists > 0:',
    '        reply 409, "Email already used"',
    '    user = {id: count of data.users + 1, email: email, password: hash_password request.body.password}',
    '    add user to data.users',
    '    payload = {id: user.id, email: email}',
    '    token = sign_token payload',
    '    give {token: token, user: payload}',
    '',
    'endpoint post "/api/login":',
    '    found = data.users filtered by u: u.email == request.body.email',
    '    if count of found == 0:',
    '        reply 401, "Wrong email or password"',
    '    user = found[0]',
    '    if not check_password request.body.password, user.password:',
    '        reply 401, "Wrong email or password"',
    '    payload = {id: user.id, email: user.email}',
    '    token = sign_token payload',
    '    give {token: token, user: payload}',
    '',
    'endpoint get "/api/me":',
    '    me = need_login request',
    '    give me',
    ''
  ].join('\n'));

  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bolt-auth-'));
  const api = createApiServer({ resources, endpoints: eps, dataDir });
  const port = await api.listen(0);
  const base = `http://localhost:${port}/api`;
  const json = { 'Content-Type': 'application/json' };
  const post = (p, body) => fetch(base + p, { method: 'POST', headers: json, body: JSON.stringify(body) });

  try {
    let res = await post('/signup', { email: 'a@b.com', password: 'secret1' });
    assert.equal(res.status, 200);
    assert.deepEqual(Object.keys(await res.json()).sort(), ['token', 'user']);

    assert.equal((await post('/signup', { email: 'a@b.com', password: 'x' })).status, 409);          // duplicate
    assert.equal((await post('/login', { email: 'a@b.com', password: 'wrong' })).status, 401);        // wrong password
    assert.equal((await post('/login', { email: 'nobody@b.com', password: 'x' })).status, 401);       // unknown user

    res = await post('/login', { email: 'a@b.com', password: 'secret1' });
    const { token } = await res.json();

    assert.equal((await fetch(`${base}/me`)).status, 401);                                            // no token
    res = await fetch(`${base}/me`, { headers: { Authorization: `Bearer ${token}` } });
    assert.equal((await res.json()).email, 'a@b.com');                                                // good token
    res = await fetch(`${base}/me`, { headers: { Authorization: `Bearer ${token.slice(0, -3)}abc` } });
    assert.equal(res.status, 401);                                                                     // forged token

    const list = await (await fetch(`${base}/users`)).json();                                          // password never sent out
    assert.deepEqual(list, [{ id: 1, email: 'a@b.com' }]);

    const stored = JSON.parse(fs.readFileSync(path.join(dataDir, 'users.json'), 'utf-8'));
    assert.ok(stored[0].password.includes(':'));                                                       // saved hashed
    assert.ok(!JSON.stringify(stored).includes('secret1'));
  } finally {
    await api.close();
  }
});

// ── SQLite storage ────────────────────────────────────────────────────

import { createRequire } from 'node:module';

const hasSqlite = (() => { try { createRequire(import.meta.url)('node:sqlite'); return true; } catch { return false; } })();

test('sqlite: records survive a restart, ids keep counting, deletes stick', { skip: !hasSqlite && 'node:sqlite needs Node 22.5+' }, async () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bolt-db-'));
  const resource = { name: 'notes', url: '/api/notes', fields: [{ name: 'text', type: 'text', required: true }] };
  const json = { 'Content-Type': 'application/json' };
  const add = (base, text) => fetch(`${base}/api/notes`, { method: 'POST', headers: json, body: JSON.stringify({ text }) }).then(r => r.json());

  let api = createApiServer({ resources: [resource], dataDir, storage: 'sqlite' });
  assert.equal(api.storage, 'sqlite');
  let base = `http://localhost:${await api.listen(0)}`;
  await add(base, 'a');
  await add(base, 'b');
  await fetch(`${base}/api/notes/1`, { method: 'DELETE' });
  await api.close();
  assert.ok(fs.existsSync(path.join(dataDir, 'bolt.db')));
  assert.ok(!fs.existsSync(path.join(dataDir, 'notes.json')));        // not using JSON files

  api = createApiServer({ resources: [resource], dataDir, storage: 'sqlite' });
  base = `http://localhost:${await api.listen(0)}`;
  try {
    assert.deepEqual((await (await fetch(`${base}/api/notes`)).json()).map(r => r.text), ['b']);
    assert.equal((await add(base, 'c')).id, 3);                       // ids never reused
  } finally {
    await api.close();
  }
});

test('sqlite: records saved earlier as JSON move over on first use', { skip: !hasSqlite && 'node:sqlite needs Node 22.5+' }, async () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bolt-db-'));
  fs.writeFileSync(path.join(dataDir, 'notes.json'), JSON.stringify([{ id: 7, text: 'old' }]));
  const resource = { name: 'notes', url: '/api/notes', fields: [{ name: 'text', type: 'text', required: true }] };
  const api = createApiServer({ resources: [resource], dataDir, storage: 'sqlite' });
  const base = `http://localhost:${await api.listen(0)}`;
  try {
    assert.deepEqual(await (await fetch(`${base}/api/notes`)).json(), [{ id: 7, text: 'old' }]);
  } finally {
    await api.close();
  }
});

// ── calling other APIs, answers with a status, forms, secrets ─────────

import http from 'node:http';
import { parseEnv, loadEnvFile } from '../src/server/env.js';

// A small "other API" for the tests to call.
function startUpstream() {
  const seen = [];
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
      seen.push({ method: req.method, url: req.url, headers: req.headers, body });
      if (req.url.startsWith('/missing')) { res.writeHead(404, { 'Content-Type': 'application/json' }); return res.end('{"error":"nope"}'); }
      if (req.url.startsWith('/text')) { res.writeHead(200, { 'Content-Type': 'text/plain' }); return res.end('plain words'); }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, method: req.method, sent: body ? JSON.parse(body) : null, auth: req.headers.authorization || null }));
    });
  });
  return new Promise(resolve => server.listen(0, () => resolve({ server, seen, base: `http://localhost:${server.address().port}` })));
}

test('endpoints: call other APIs with every method, headers, and clear 502 errors', async () => {
  const upstream = await startUpstream();
  process.env.UPSTREAM = upstream.base;
  const eps = endpointsFrom([
    'endpoint get "/api/proxy":',
    '    h = {Authorization: "Bearer abc"}',
    '    answer = http_get env.UPSTREAM + "/thing", h',
    '    give answer',
    '',
    'endpoint post "/api/forward":',
    '    answer = http_post env.UPSTREAM + "/thing", request.body',
    '    give answer',
    '',
    'endpoint put "/api/replace":',
    '    give http_put env.UPSTREAM + "/thing", {a: 1}',
    '',
    'endpoint patch "/api/change":',
    '    give http_patch env.UPSTREAM + "/thing", {a: 2}',
    '',
    'endpoint delete "/api/remove":',
    '    give http_delete env.UPSTREAM + "/thing"',
    '',
    'endpoint get "/api/missing":',
    '    give http_get env.UPSTREAM + "/missing"',
    '',
    'endpoint get "/api/text":',
    '    give http_get env.UPSTREAM + "/text"',
    '',
    'endpoint get "/api/down":',
    '    give http_get "http://localhost:1/never"',
    ''
  ].join('\n'));

  const api = createApiServer({ resources: [], endpoints: eps, dataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'bolt-http-')) });
  const base = `http://localhost:${await api.listen(0)}/api`;
  const json = { 'Content-Type': 'application/json' };

  try {
    let res = await fetch(`${base}/proxy`);
    assert.deepEqual(await res.json(), { ok: true, method: 'GET', sent: null, auth: 'Bearer abc' });      // headers sent

    res = await fetch(`${base}/forward`, { method: 'POST', headers: json, body: JSON.stringify({ x: 1 }) });
    assert.deepEqual((await res.json()).sent, { x: 1 });                                                   // JSON body sent

    assert.equal((await (await fetch(`${base}/replace`, { method: 'PUT', headers: json, body: '{}' })).json()).method, 'PUT');
    assert.equal((await (await fetch(`${base}/change`, { method: 'PATCH', headers: json, body: '{}' })).json()).method, 'PATCH');
    assert.equal((await (await fetch(`${base}/remove`, { method: 'DELETE' })).json()).method, 'DELETE');

    res = await fetch(`${base}/missing`);                                                                  // upstream 404 -> our 502
    assert.equal(res.status, 502);
    assert.match((await res.json()).error, /answered 404: nope/);

    res = await fetch(`${base}/text`);                                                                     // not JSON: text is kept
    assert.equal(await res.json(), 'plain words');

    res = await fetch(`${base}/down`);                                                                     // cannot connect
    assert.equal(res.status, 502);
    assert.match((await res.json()).error, /failed/);
  } finally {
    await api.close();
    upstream.server.close();
    delete process.env.UPSTREAM;
  }
});

test('endpoints: respond sets status and headers, request.headers, form and text bodies', async () => {
  const eps = endpointsFrom([
    'endpoint post "/api/items":',
    '    extra = {"X-Made-By": "bolt"}',
    '    respond 201, {name: request.body.name, agent: request.headers["x-agent"]}, extra',
    '',
    'endpoint post "/api/hook":',
    '    give {kind: "text", body: request.body}',
    ''
  ].join('\n'));
  const api = createApiServer({ resources: [], endpoints: eps, dataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'bolt-http-')) });
  const base = `http://localhost:${await api.listen(0)}/api`;
  try {
    let res = await fetch(`${base}/items`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Agent': 'tester' }, body: 'name=Pen&size=2' });
    assert.equal(res.status, 201);
    assert.equal(res.headers.get('x-made-by'), 'bolt');
    assert.deepEqual(await res.json(), { name: 'Pen', agent: 'tester' });

    res = await fetch(`${base}/hook`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: 'raw words' });
    assert.deepEqual(await res.json(), { kind: 'text', body: 'raw words' });
  } finally {
    await api.close();
  }
});

test('endpoints: CORS can be a fixed origin or switched off', async () => {
  const resource = [{ name: 'n', url: '/api/n', fields: [{ name: 't', type: 'text', required: false }] }];
  for (const [cors, expected] of [['*', '*'], ['https://myapp.com', 'https://myapp.com'], [false, null]]) {
    const api = createApiServer({ resources: resource, dataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'bolt-cors-')), cors });
    const port = await api.listen(0);
    try {
      const res = await fetch(`http://localhost:${port}/api/n`);
      assert.equal(res.headers.get('access-control-allow-origin'), expected);
    } finally {
      await api.close();
    }
  }
});

test('.env: parses KEY=value lines and never overrides the real environment', () => {
  assert.deepEqual(parseEnv('# note\nA=1\nB="two words"\nexport C=\'three\'\nD=4 # trailing\n\nbad line\n'),
    { A: '1', B: 'two words', C: 'three', D: '4' });

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bolt-env-'));
  fs.writeFileSync(path.join(dir, '.env'), 'BOLT_TEST_NEW=fresh\nBOLT_TEST_SET=from-file\n');
  process.env.BOLT_TEST_SET = 'from-shell';
  try {
    const loaded = loadEnvFile(dir);
    assert.deepEqual(loaded, ['BOLT_TEST_NEW']);
    assert.equal(process.env.BOLT_TEST_NEW, 'fresh');
    assert.equal(process.env.BOLT_TEST_SET, 'from-shell');
  } finally {
    delete process.env.BOLT_TEST_NEW;
    delete process.env.BOLT_TEST_SET;
  }
  assert.deepEqual(loadEnvFile('/no/such/folder'), []);
});

// ── production: serve the built website and the API together ──────────

test('start: serves the site, page addresses, long-lived assets, security headers and blocks path tricks', async () => {
  const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'bolt-dist-'));
  fs.mkdirSync(path.join(dist, 'assets'));
  fs.writeFileSync(path.join(dist, 'index.html'), '<!doctype html><title>app</title>');
  fs.writeFileSync(path.join(dist, 'assets', 'app-abc123.js'), 'console.log(1)');
  const secret = path.join(os.tmpdir(), `bolt-secret-${Date.now()}.txt`);
  fs.writeFileSync(secret, 'top secret');

  const resource = { name: 'n', url: '/api/n', fields: [{ name: 't', type: 'text', required: false }] };
  const api = createApiServer({ resources: [resource], dataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'bolt-prod-')), cors: false, staticDir: dist });
  const base = `http://localhost:${await api.listen(0)}`;

  try {
    let res = await fetch(`${base}/`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/html/);
    assert.equal(res.headers.get('cache-control'), 'no-cache');
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('x-frame-options'), 'SAMEORIGIN');

    res = await fetch(`${base}/products/3`);                                   // a page address works after a refresh
    assert.match(await res.text(), /<title>app<\/title>/);

    res = await fetch(`${base}/assets/app-abc123.js`);                         // built files are cached for a year
    assert.match(res.headers.get('cache-control'), /immutable/);
    assert.match(res.headers.get('content-type'), /javascript/);

    assert.equal((await fetch(`${base}/assets/missing.js`)).status, 404);     // a missing file is a real 404
    assert.equal((await fetch(`${base}/%2e%2e/%2e%2e/${path.basename(secret)}`)).status, 404);   // cannot leave the build folder

    res = await fetch(`${base}/api/n`);                                        // the API lives on the same address, no CORS needed
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('access-control-allow-origin'), null);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');

    assert.equal((await fetch(`${base}/api/nothing`)).status, 404);          // unknown API address is a JSON 404, not the website
  } finally {
    await api.close();
    fs.rmSync(secret, { force: true });
  }
});

test('start: the command line runs a built project on the port you choose', async () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'bolt-start-'));
  fs.mkdirSync(path.join(project, 'src'), { recursive: true });
  fs.mkdirSync(path.join(project, 'dist'));
  fs.writeFileSync(path.join(project, 'dist', 'index.html'), '<h1>built</h1>');
  fs.writeFileSync(path.join(project, 'src', 'a.bolt'), 'endpoint get "/api/ping":\n    give {pong: true}\n');

  const { spawn, spawnSync } = await import('node:child_process');
  const { fileURLToPath } = await import('node:url');
  const cliPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'cli', 'bolt.js');

  // no build yet -> clear message
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'bolt-start-'));
  const bad = spawnSync(process.execPath, [cliPath, 'start', empty], { encoding: 'utf-8' });
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /npm run build/);

  const port = 20000 + Math.floor(Math.random() * 20000);
  const child = spawn(process.execPath, [cliPath, 'start', project, '--port', String(port)], { stdio: 'ignore' });
  try {
    let ok = false;
    for (let i = 0; i < 40 && !ok; i++) {
      await new Promise(r => setTimeout(r, 100));
      try { ok = (await fetch(`http://localhost:${port}/api/ping`)).ok; } catch { /* not up yet */ }
    }
    assert.ok(ok, 'server did not start');
    assert.deepEqual(await (await fetch(`http://localhost:${port}/api/ping`)).json(), { pong: true });
    assert.match(await (await fetch(`http://localhost:${port}/`)).text(), /built/);
  } finally {
    child.kill();
  }
});
