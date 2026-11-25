// ─── Bolt — built-in API server ────────────────────────────────────────
// Gives every `resource` block a working REST API with no setup:
//
//   GET    /api/products        list
//   GET    /api/products/:id    one record
//   POST   /api/products        create (validates the fields, returns the record)
//   PUT    /api/products/:id    replace fields
//   PATCH  /api/products/:id    change some fields
//   DELETE /api/products/:id    delete
//
// And runs your own `endpoint` blocks (search, stats, login ...) written in Bolt:
//
//   endpoint get "/api/search":
//       give data.products filtered by p: contains p.title, request.query.q
//
// Login helpers for endpoints: hash_password, check_password, sign_token, request.user, need_login.
//
// Data is saved as plain JSON files (one per resource) so there is nothing
// to install and you can read or edit the data by hand. For a single-file
// database use SQLite instead:  bolt serve --db sqlite

import fs from 'fs';
import crypto from 'crypto';
import http from 'http';
import path from 'path';
import { createRequire } from 'module';
import { generateWithRuntime } from '../generator/generator.js';
import { FunctionDef } from '../parser/ast.js';

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const MAX_BODY = 1024 * 1024;

// Checks `body` against the resource fields. Returns { value } or { errors }.
export function validateRecord(fields, body, { partial = false } = {}) {
  const value = {};
  const errors = [];
  for (const f of fields) {
    const raw = body ? body[f.name] : undefined;
    const missing = raw === undefined || raw === null || (typeof raw === 'string' && raw.trim() === '');

    if (missing) {
      if (f.required && !(partial && raw === undefined)) errors.push(`${f.name} is required`);
      else if (raw !== undefined && !partial) value[f.name] = f.type === 'number' ? null : '';
      continue;
    }
    if (f.type === 'number') {
      const n = Number(raw);
      if (Number.isNaN(n)) { errors.push(`${f.name} must be a number`); continue; }
      value[f.name] = n;
    } else if (f.type === 'email') {
      if (!EMAIL_RE.test(String(raw))) { errors.push(`${f.name} must be a valid email`); continue; }
      value[f.name] = String(raw);
    } else {
      value[f.name] = String(raw);
    }
  }
  return errors.length ? { errors } : { value };
}

// ── Custom endpoints ──────────────────────────────────────────────────

// Thrown by `reply 404, "Not found"` inside an endpoint.
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Helpers every endpoint can call (Bolt's natural call style: `contains title, word`).
const helpers = {
  reply: (status, message) => { throw new HttpError(Number(status) || 400, String(message ?? 'Error')); },
  contains: (text, part) => String(text ?? '').toLowerCase().includes(String(part ?? '').toLowerCase()),
  lower: text => String(text ?? '').toLowerCase(),
  upper: text => String(text ?? '').toUpperCase(),
  now: () => new Date().toISOString(),
  // login helpers; the real versions are built per server (they need its secret)
  hash_password: () => { throw new HttpError(500, 'Login helpers are not ready'); },
  check_password: () => { throw new HttpError(500, 'Login helpers are not ready'); },
  sign_token: () => { throw new HttpError(500, 'Login helpers are not ready'); },
  need_login: () => { throw new HttpError(500, 'Login helpers are not ready'); }
};

const TOKEN_DAYS = 7;
const b64 = buf => Buffer.from(buf).toString('base64url');

// Password hashing (scrypt), signed tokens (HMAC-SHA256) and the login check.
function makeAuthHelpers(getSecret) {
  const sign = text => crypto.createHmac('sha256', getSecret()).update(text).digest('base64url');
  return {
    hash_password(text) {
      const salt = crypto.randomBytes(16);
      return `${salt.toString('hex')}:${crypto.scryptSync(String(text), salt, 32).toString('hex')}`;
    },
    check_password(text, hashed) {
      const [saltHex, hashHex] = String(hashed || '').split(':');
      if (!saltHex || !hashHex) return false;
      const actual = crypto.scryptSync(String(text ?? ''), Buffer.from(saltHex, 'hex'), 32);
      const expected = Buffer.from(hashHex, 'hex');
      return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
    },
    sign_token(payload) {
      const body = b64(JSON.stringify({ ...payload, exp: Date.now() + TOKEN_DAYS * 86400000 }));
      return `${body}.${sign(body)}`;
    },
    need_login(request) {
      if (!request || !request.user) throw new HttpError(401, 'Login required');
      return request.user;
    },
    // used by the server (not callable from endpoints): token -> payload or null
    verify(token) {
      const [body, sig] = String(token || '').split('.');
      if (!body || !sig) return null;
      const expected = sign(body);
      if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
      try {
        const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
        return payload.exp && payload.exp > Date.now() ? payload : null;
      } catch {
        return null;
      }
    }
  };
}

// "/api/items/:id" -> { regex, keys: ['id'] }
function routePattern(routePath) {
  const keys = [];
  const source = routePath.replace(/\/+$/, '').split('/').map(part => {
    if (part.startsWith(':')) { keys.push(part.slice(1)); return '([^/]+)'; }
    return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }).join('/');
  return { regex: new RegExp(`^${source || ''}/?$`), keys };
}

// Turns an `endpoint` block into a JavaScript function (request, data) => result.
export function compileEndpoint(endpoint, extra = {}) {
  const fn = FunctionDef('handler', ['request', 'data'], endpoint.body, endpoint.line);
  let js;
  try {
    js = generateWithRuntime({ type: 'Program', body: [fn], line: 1 });
  } catch (e) {
    const where = endpoint.file ? ` (in ${endpoint.file}, line ${e.line || endpoint.line})` : '';
    const err = new Error(`Endpoint ${endpoint.method} ${endpoint.path}${where}: ${e.message}${e.hint ? `\n  💡 ${e.hint}` : ''}`);
    err.line = e.line || endpoint.line;
    throw err;
  }
  const all = { ...helpers, ...extra };
  const names = Object.keys(all);
  // eslint-disable-next-line no-new-func
  const build = new Function(...names, `${js}\nreturn handler;`);
  return build(...names.map(n => all[n]));
}

// ── Storage: where the records live ───────────────────────────────────
//   json    one file per resource in .bolt-data/ (default, easy to read and edit)
//   sqlite  one database file, .bolt-data/bolt.db (needs Node 22.5 or newer)
// Both keep the same shape: a resource is a list of records.

function jsonStorage(dataDir) {
  const file = name => path.join(dataDir, `${name}.json`);
  return {
    kind: 'json',
    read(name) {
      try {
        const rows = JSON.parse(fs.readFileSync(file(name), 'utf-8'));
        return Array.isArray(rows) ? rows : [];
      } catch {
        return [];
      }
    },
    write(name, rows) {
      fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(file(name), JSON.stringify(rows, null, 2));
    }
  };
}

function sqliteStorage(dataDir) {
  let sqlite;
  try {
    sqlite = createRequire(import.meta.url)('node:sqlite');
  } catch {
    throw new Error('SQLite needs Node 22.5 or newer. Update Node, or use the default JSON storage (remove --db sqlite).');
  }
  fs.mkdirSync(dataDir, { recursive: true });
  const db = new sqlite.DatabaseSync(path.join(dataDir, 'bolt.db'));
  db.exec('CREATE TABLE IF NOT EXISTS records (resource TEXT NOT NULL, id INTEGER NOT NULL, data TEXT NOT NULL, PRIMARY KEY (resource, id))');
  const json = jsonStorage(dataDir);

  return {
    kind: 'sqlite',
    read(name) {
      const rows = db.prepare('SELECT data FROM records WHERE resource = ? ORDER BY id').all(name).map(r => JSON.parse(r.data));
      if (rows.length === 0) {
        // first time on SQLite: bring over records saved earlier as JSON
        const old = json.read(name);
        if (old.length) { this.write(name, old); return old; }
      }
      return rows;
    },
    write(name, rows) {
      db.exec('BEGIN');
      try {
        db.prepare('DELETE FROM records WHERE resource = ?').run(name);
        const insert = db.prepare('INSERT INTO records (resource, id, data) VALUES (?, ?, ?)');
        for (const row of rows) insert.run(name, Number(row.id), JSON.stringify(row));
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    }
  };
}

export function createApiServer({ resources = [], endpoints = [], dataDir, storage = 'json' }) {
  const store = storage === 'sqlite' ? sqliteStorage(dataDir) : jsonStorage(dataDir);
  let currentResources = resources;
  let routes = [];
  const cache = new Map(); // resource name -> array of records

  // The secret that signs login tokens is created once and kept next to the data.
  let secret = null;
  function getSecret() {
    if (secret) return secret;
    const file = path.join(dataDir, '.secret');
    try {
      secret = fs.readFileSync(file, 'utf-8').trim();
    } catch {
      secret = crypto.randomBytes(32).toString('hex');
      fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(file, secret);
    }
    return secret;
  }
  const { verify, ...authHelpers } = makeAuthHelpers(getSecret);

  function setEndpoints(list) {
    routes = list.map(ep => ({
      method: ep.method.toUpperCase(),
      path: ep.path,
      ...routePattern(ep.path),
      run: compileEndpoint(ep, authHelpers)
    }));
  }
  setEndpoints(endpoints);

  // Fields marked `hidden` (like a password) are saved but never sent to the browser.
  const publicRecord = (r, row) => {
    const hidden = r.fields.filter(f => f.hidden).map(f => f.name);
    if (!hidden.length || !row) return row;
    const copy = { ...row };
    for (const name of hidden) delete copy[name];
    return copy;
  };

  function load(r) {
    if (cache.has(r.name)) return cache.get(r.name);
    const rows = store.read(r.name);
    cache.set(r.name, rows);
    return rows;
  }

  function save(r) {
    store.write(r.name, cache.get(r.name));
  }

  function send(res, status, data) {
    const body = data === undefined ? '' : JSON.stringify(data);
    res.writeHead(status, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(body);
  }

  function readBody(req) {
    return new Promise((resolve, reject) => {
      let size = 0;
      const chunks = [];
      req.on('data', c => {
        size += c.length;
        if (size > MAX_BODY) { reject(new Error('Request is too large')); req.destroy(); return; }
        chunks.push(c);
      });
      req.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf-8');
        if (!text) return resolve({});
        try { resolve(JSON.parse(text)); } catch { reject(new Error('Body must be valid JSON')); }
      });
      req.on('error', reject);
    });
  }

  // Runs one custom endpoint. `data.products` is the live list of that resource; reading it
  // marks it for saving, so changes you make are written to disk after the endpoint finishes.
  async function runEndpoint(route, match, url, req) {
    const params = {};
    route.keys.forEach((k, i) => { params[k] = decodeURIComponent(match[i + 1]); });
    const body = ['GET', 'HEAD'].includes(req.method) ? {} : await readBody(req);
    const request = {
      method: req.method,
      path: url.pathname,
      params,
      query: Object.fromEntries(url.searchParams),
      body,
      user: verify((req.headers.authorization || '').replace(/^Bearer\s+/i, ''))   // null when not logged in
    };

    const touched = new Set();
    const data = new Proxy({}, {
      get: (_, name) => {
        const r = currentResources.find(x => x.name === name);
        if (!r) return undefined;
        touched.add(r);
        return load(r);
      }
    });

    const result = await route.run(request, data);
    for (const r of touched) save(r);
    return result;
  }

  const server = http.createServer(async (req, res) => {
    try {
      if (req.method === 'OPTIONS') return send(res, 204);

      const url = new URL(req.url, 'http://localhost');
      const pathname = decodeURIComponent(url.pathname).replace(/\/+$/, '') || '/';

      // 1. your own endpoints (checked first, so /api/products/stats can beat /api/products/:id)
      for (const route of routes) {
        if (route.method !== req.method) continue;
        const match = pathname.match(route.regex);
        if (!match) continue;
        try {
          const result = await runEndpoint(route, match, url, req);
          return result === undefined ? send(res, 204) : send(res, 200, result);
        } catch (e) {
          if (e instanceof HttpError) return send(res, e.status, { error: e.message });
          return send(res, 500, { error: `Endpoint ${route.method} ${route.path} failed: ${e.message}` });
        }
      }

      // 2. resources
      const resource = currentResources.find(r => pathname === r.url || pathname.startsWith(r.url + '/'));
      if (!resource) return send(res, 404, { error: 'Not found' });

      const rest = pathname.slice(resource.url.length).replace(/^\//, '');
      const rows = load(resource);

      // Collection: list or create
      if (rest === '') {
        if (req.method === 'GET') return send(res, 200, rows.map(row => publicRecord(resource, row)));
        if (req.method === 'POST') {
          const body = await readBody(req);
          const { value, errors } = validateRecord(resource.fields, body);
          if (errors) return send(res, 400, { error: errors.join(', '), errors });
          const id = rows.reduce((m, row) => Math.max(m, Number(row.id) || 0), 0) + 1;
          const record = { id, ...value };
          rows.push(record);
          save(resource);
          return send(res, 201, publicRecord(resource, record));
        }
        return send(res, 405, { error: 'Method not allowed' });
      }

      // One record
      const index = rows.findIndex(row => String(row.id) === rest);
      if (index === -1) return send(res, 404, { error: 'Not found' });

      if (req.method === 'GET') return send(res, 200, publicRecord(resource, rows[index]));
      if (req.method === 'DELETE') {
        const [removed] = rows.splice(index, 1);
        save(resource);
        return send(res, 200, publicRecord(resource, removed));
      }
      if (req.method === 'PUT' || req.method === 'PATCH') {
        const body = await readBody(req);
        const { value, errors } = validateRecord(resource.fields, body, { partial: req.method === 'PATCH' });
        if (errors) return send(res, 400, { error: errors.join(', '), errors });
        rows[index] = { ...rows[index], ...value, id: rows[index].id };
        save(resource);
        return send(res, 200, publicRecord(resource, rows[index]));
      }
      return send(res, 405, { error: 'Method not allowed' });
    } catch (e) {
      return send(res, 400, { error: e.message });
    }
  });

  return {
    server,
    setResources(list) { currentResources = list; },
    setEndpoints,
    storage: store.kind,
    setApi({ resources: r = currentResources, endpoints: e = [] }) { currentResources = r; setEndpoints(e); },
    listen(port) {
      return new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, () => resolve(server.address().port));
      });
    },
    close() { return new Promise(resolve => server.close(resolve)); }
  };
}
