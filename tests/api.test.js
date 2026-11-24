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
