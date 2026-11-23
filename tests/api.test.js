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
