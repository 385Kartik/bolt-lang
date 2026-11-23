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
// Data is saved as plain JSON files (one per resource) so there is nothing
// to install and you can read or edit the data by hand.

import fs from 'fs';
import http from 'http';
import path from 'path';

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

export function createApiServer({ resources = [], dataDir }) {
  let current = resources;
  const cache = new Map(); // resource name -> array of records

  const fileFor = r => path.join(dataDir, `${r.name}.json`);

  function load(r) {
    if (cache.has(r.name)) return cache.get(r.name);
    let rows = [];
    try {
      rows = JSON.parse(fs.readFileSync(fileFor(r), 'utf-8'));
      if (!Array.isArray(rows)) rows = [];
    } catch {
      rows = [];
    }
    cache.set(r.name, rows);
    return rows;
  }

  function save(r) {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(fileFor(r), JSON.stringify(cache.get(r.name), null, 2));
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

  const server = http.createServer(async (req, res) => {
    try {
      if (req.method === 'OPTIONS') return send(res, 204);

      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/\/+$/, '') || '/';
      const resource = current.find(r => pathname === r.url || pathname.startsWith(r.url + '/'));
      if (!resource) return send(res, 404, { error: 'Not found' });

      const rest = pathname.slice(resource.url.length).replace(/^\//, '');
      const rows = load(resource);

      // Collection: list or create
      if (rest === '') {
        if (req.method === 'GET') return send(res, 200, rows);
        if (req.method === 'POST') {
          const body = await readBody(req);
          const { value, errors } = validateRecord(resource.fields, body);
          if (errors) return send(res, 400, { error: errors.join(', '), errors });
          const id = rows.reduce((m, row) => Math.max(m, Number(row.id) || 0), 0) + 1;
          const record = { id, ...value };
          rows.push(record);
          save(resource);
          return send(res, 201, record);
        }
        return send(res, 405, { error: 'Method not allowed' });
      }

      // One record
      const index = rows.findIndex(row => String(row.id) === rest);
      if (index === -1) return send(res, 404, { error: 'Not found' });

      if (req.method === 'GET') return send(res, 200, rows[index]);
      if (req.method === 'DELETE') {
        const [removed] = rows.splice(index, 1);
        save(resource);
        return send(res, 200, removed);
      }
      if (req.method === 'PUT' || req.method === 'PATCH') {
        const body = await readBody(req);
        const { value, errors } = validateRecord(resource.fields, body, { partial: req.method === 'PATCH' });
        if (errors) return send(res, 400, { error: errors.join(', '), errors });
        rows[index] = { ...rows[index], ...value, id: rows[index].id };
        save(resource);
        return send(res, 200, rows[index]);
      }
      return send(res, 405, { error: 'Method not allowed' });
    } catch (e) {
      return send(res, 400, { error: e.message });
    }
  });

  return {
    server,
    setResources(list) { current = list; },
    listen(port) {
      return new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, () => resolve(server.address().port));
      });
    },
    close() { return new Promise(resolve => server.close(resolve)); }
  };
}
