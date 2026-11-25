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
