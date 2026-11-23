// ─── Bolt — project checker and size stats ─────────────────────────────
// Used by `bolt check` and `bolt stats`.
//
// check: compiles the whole project into a temp folder (nothing is written
//        to your project) and returns every problem as structured data, so
//        people and AI tools can read and fix them.
// stats: compares the size of your Bolt source with the React it generates.

import fs from 'fs';
import os from 'os';
import path from 'path';
import { compileToAST } from './index.js';
import { buildProject } from './builder/builder.js';

const SKIP_DIRS = new Set(['node_modules', '.bolt-generated', 'dist', 'build', 'coverage']);

export function findBoltFiles(dir) {
  const out = [];
  const walk = d => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) {
        if (!SKIP_DIRS.has(e.name) && !e.name.startsWith('.')) walk(p);
      } else if (p.endsWith('.bolt')) {
        out.push(p);
      }
    }
  };
  walk(dir);
  return out.sort();
}

// Rough token estimate: words, numbers and punctuation each count as one.
// It is a proxy for an LLM tokenizer, good for comparing two versions of the same code.
export function approxTokens(text) {
  return (text.match(/[A-Za-z]+|[0-9]+|[^\sA-Za-z0-9]/g) || []).length;
}

// Turns a thrown error into { message, hint, line, column }.
function describeError(err) {
  const raw = String(err && err.message ? err.message : err);
  let hint = err && err.hint ? err.hint : null;
  let message = raw;

  const hintMatch = raw.match(/💡 Hint:\s*([\s\S]*)$/);
  if (hintMatch) {
    hint = hint || hintMatch[1].trim();
    message = raw.slice(0, hintMatch.index);
  }
  message = message
    .replace(/⚡\s*Compiler Error[^\n]*:\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  let line = err && err.line ? err.line : null;
  if (!line) {
    const m = raw.match(/line (\d+)/);
    if (m) line = Number(m[1]);
  }
  return { message, hint, line, column: err && err.column ? err.column : null };
}

function silently(fn) {
  const log = console.log;
  console.log = () => {};
  try {
    return fn();
  } finally {
    console.log = log;
  }
}

// Parses every file. Returns { body, errors, files }.
function loadProject(root) {
  const errors = [];
  const body = [];
  const files = findBoltFiles(root);
  for (const file of files) {
    const rel = path.relative(root, file).split(path.sep).join('/');
    const fileName = path.basename(file, '.bolt');
    try {
      const ast = compileToAST(fs.readFileSync(file, 'utf-8'));
      ast.body.forEach(n => { n.fileName = fileName; });
      const page = ast.body.find(n => n.type === 'PageDef');
      if (page && page.name.toLowerCase() !== fileName.toLowerCase()) {
        errors.push({
          file: rel,
          line: page.line || null,
          column: null,
          message: `Page name '${page.name}' must match the file name '${fileName}'.`,
          hint: `Rename the file to ${page.name}.bolt or the page to '${fileName}'.`
        });
        continue;
      }
      body.push(...ast.body);
    } catch (e) {
      errors.push({ file: rel, ...describeError(e) });
    }
  }
  return { body, errors, files };
}

// Every `resource` block in the project, ready for the API server.
export function findResources(root) {
  const { body } = loadProject(path.resolve(root));
  return body
    .filter(n => n.type === 'ResourceDef')
    .map(n => ({ name: n.name, url: n.url, fields: n.fields }));
}

export function checkProject(root) {
  const resolved = path.resolve(root);
  const { body, errors, files } = loadProject(resolved);

  if (errors.length === 0) {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bolt-check-'));
    try {
      silently(() => buildProject({ type: 'Program', body, line: 1 }, tmp, '', { projectRoot: resolved }));
    } catch (e) {
      errors.push({ file: null, ...describeError(e) });
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  }

  return { ok: errors.length === 0, files: files.length, errors };
}

export function projectStats(root) {
  const resolved = path.resolve(root);
  const { body, errors, files } = loadProject(resolved);
  if (errors.length > 0) return { ok: false, errors };

  const boltText = files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bolt-stats-'));
  let reactText = '';
  try {
    silently(() => buildProject({ type: 'Program', body, line: 1 }, tmp, '', { projectRoot: resolved }));
    // Only the code generated from your pages and components (not shared runtime files).
    for (const dir of ['pages', 'components']) {
      const d = path.join(tmp, dir);
      if (!fs.existsSync(d)) continue;
      for (const f of fs.readdirSync(d)) {
        if (!f.endsWith('.jsx')) continue;
        if (/^(AuthContext|ToastContext|ModalContext|BoltErrorBoundary)\.jsx$/.test(f)) continue;
        reactText += fs.readFileSync(path.join(d, f), 'utf-8') + '\n';
      }
    }
  } catch (e) {
    return { ok: false, errors: [{ file: null, ...describeError(e) }] };
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  const bolt = { files: files.length, chars: boltText.length, tokens: approxTokens(boltText) };
  const react = { chars: reactText.length, tokens: approxTokens(reactText) };
  return {
    ok: true,
    bolt,
    react,
    ratio: react.tokens && bolt.tokens ? Number((react.tokens / bolt.tokens).toFixed(2)) : null
  };
}
