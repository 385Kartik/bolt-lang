// Tests for named styles (`styles:`) and import-by-name (`use <name>`).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { compileToAST } from '../src/index.js';
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

  const page = read(build(root), 'pages/HomePage.jsx');
  assert.match(page, /text-4xl font-extrabold tracking-tight text-gray-900/);   // heading
  assert.match(page, /max-w-5xl mx-auto px-6 py-12/);                           // page-wrap
  assert.match(page, /rounded-xl font-semibold/);                               // button-primary
});
