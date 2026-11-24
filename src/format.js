// ─── Bolt — formatter ──────────────────────────────────────────────────
// `bolt fmt` makes every .bolt file look the same:
//   - indentation is 4 spaces per level (tabs and odd widths are fixed)
//   - no trailing spaces, Unix line endings, one newline at the end
//   - at most one blank line in a row
//   - one blank line before each top-level block (page, component, styles ...)
//
// It never changes what your code means: the formatted file must produce the
// same syntax tree as the original, otherwise the file is left alone.

import fs from 'fs';
import path from 'path';
import { compileToAST } from './index.js';
import { findBoltFiles } from './check.js';

const TOP_LEVEL = /^(page|component|action|resource|layout|styles|design system)\b/;
const INDENT = 4;

function widthOf(ws) {
  let w = 0;
  for (const ch of ws) w += ch === '\t' ? INDENT : 1;
  return w;
}

// Remove `line` numbers so two trees can be compared by meaning only.
function withoutLines(node) {
  if (Array.isArray(node)) return node.map(withoutLines);
  if (node && typeof node === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(node)) if (k !== 'line' && k !== 'column') out[k] = withoutLines(v);
    return out;
  }
  return node;
}

function sameMeaning(a, b) {
  try {
    return JSON.stringify(withoutLines(compileToAST(a))) === JSON.stringify(withoutLines(compileToAST(b)));
  } catch {
    return false;
  }
}

// Returns { text, changed, ok, reason }. When ok is false the original text is returned untouched.
export function formatSource(source) {
  const original = String(source);
  const lines = original.replace(/\r\n?/g, '\n').split('\n');

  // 1. Re-indent: map each distinct indent width to a level (like Python does)
  const stack = [0];
  const out = [];
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (line === '') { out.push(''); continue; }

    const lead = line.match(/^[ \t]*/)[0];
    const width = widthOf(lead);
    const body = line.slice(lead.length);
    const isComment = body.startsWith('//');

    if (isComment) {
      // comments never change the nesting; sit at the closest known level
      let level = 0;
      for (let i = 0; i < stack.length; i++) if (stack[i] <= width) level = i;
      out.push(' '.repeat(level * INDENT) + body);
      continue;
    }

    if (width > stack[stack.length - 1]) {
      stack.push(width);
    } else {
      while (stack.length > 1 && width < stack[stack.length - 1]) stack.pop();
      if (width !== stack[stack.length - 1]) {
        return { text: original, changed: false, ok: false, reason: 'Inconsistent indentation (a line does not line up with any earlier level).' };
      }
    }
    out.push(' '.repeat((stack.length - 1) * INDENT) + body);
  }

  // 2. Blank lines: at most one in a row, one before each top-level block, none at the start
  const spaced = [];
  for (let i = 0; i < out.length; i++) {
    const line = out[i];
    if (line === '') {
      if (spaced.length === 0 || spaced[spaced.length - 1] === '') continue;
      spaced.push('');
      continue;
    }
    if (TOP_LEVEL.test(line) && spaced.length > 0 && spaced[spaced.length - 1] !== '') {
      // keep a comment that sits directly above the block attached to it
      const prev = spaced[spaced.length - 1];
      if (!/^\s*\/\//.test(prev)) spaced.push('');
    }
    spaced.push(line);
  }
  while (spaced.length && spaced[spaced.length - 1] === '') spaced.pop();

  const text = spaced.length ? spaced.join('\n') + '\n' : '';

  if (text === original) return { text, changed: false, ok: true };
  if (!sameMeaning(original, text)) {
    return { text: original, changed: false, ok: false, reason: 'Formatting would change what the file means, so it was left as it is.' };
  }
  return { text, changed: true, ok: true };
}

// Formats files or folders. `check` only reports; otherwise files are rewritten.
export function formatPath(target, { check = false } = {}) {
  const resolved = path.resolve(target);
  const files = fs.statSync(resolved).isDirectory() ? findBoltFiles(resolved) : [resolved];
  const result = { changed: [], unchanged: 0, skipped: [] };

  for (const file of files) {
    const rel = path.relative(process.cwd(), file) || file;
    const r = formatSource(fs.readFileSync(file, 'utf-8'));
    if (!r.ok) { result.skipped.push({ file: rel, reason: r.reason }); continue; }
    if (!r.changed) { result.unchanged++; continue; }
    if (!check) fs.writeFileSync(file, r.text);
    result.changed.push(rel);
  }
  return result;
}
