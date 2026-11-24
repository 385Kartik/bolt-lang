// Tests for the VS Code extension (everything that can run without VS Code).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { compileToAST } from '../src/index.js';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const extDir = path.join(root, 'extensions', 'bolt-language-support');
const readJson = rel => JSON.parse(fs.readFileSync(path.join(extDir, rel), 'utf-8'));

const { scanSource, mergeScans, contextAt } = require(path.join(extDir, 'lib', 'scan.js'));
const { findCli, runBolt, groupErrors } = require(path.join(extDir, 'lib', 'cli.js'));

// ── package and JSON files ────────────────────────────────────────────

test('extension files are valid JSON and package.json points at real files', () => {
  const pkg = readJson('package.json');
  readJson('language-configuration.json');
  readJson('snippets/bolt.json');
  readJson('syntaxes/bolt.tmLanguage.json');

  assert.ok(fs.existsSync(path.join(extDir, pkg.main)));
  for (const g of pkg.contributes.grammars) assert.ok(fs.existsSync(path.join(extDir, g.path)));
  for (const s of pkg.contributes.snippets) assert.ok(fs.existsSync(path.join(extDir, s.path)));
  const commands = pkg.contributes.commands.map(c => c.command);
  assert.deepEqual(commands.sort(), ['bolt.check', 'bolt.stats']);
});

// ── syntax grammar ────────────────────────────────────────────────────

function allRegexes(node, found = []) {
  if (Array.isArray(node)) node.forEach(n => allRegexes(n, found));
  else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (['match', 'begin', 'end'].includes(k) && typeof v === 'string') found.push(v);
      else allRegexes(v, found);
    }
  }
  return found;
}

test('grammar: every pattern is a valid regular expression', () => {
  const grammar = readJson('syntaxes/bolt.tmLanguage.json');
  const regexes = allRegexes(grammar.repository);
  assert.ok(regexes.length > 20);
  for (const r of regexes) assert.doesNotThrow(() => new RegExp(r), r);
});

test('grammar: new keywords are recognised by the right rules', () => {
  const repo = readJson('syntaxes/bolt.tmLanguage.json').repository;
  const rule = (group, test) => repo[group].patterns.find(p => p.match && test(p));
  const re = p => new RegExp(p.match);

  // definitions
  const defs = repo.definitions.patterns;
  assert.ok(defs.some(p => p.match && new RegExp(p.match).test('page home:')));
  assert.ok(defs.some(p => p.match && new RegExp(p.match).test('component Card takes title:')));
  assert.ok(defs.some(p => p.match && new RegExp(p.match).test('resource products at "/api/products":')));
  assert.ok(defs.some(p => p.match && new RegExp(p.match).test('layout:')));
  assert.ok(defs.some(p => p.match && new RegExp(p.match).test('    layout none')));
  assert.ok(defs.some(p => p.match && new RegExp(p.match).test('use helpers')));
  assert.ok(defs.some(p => p.match && new RegExp(p.match).test('        slot')));

  // blocks start only on their own line
  assert.ok(new RegExp(repo['styles-block'].begin).test('styles:'));
  assert.ok(!new RegExp(repo['styles-block'].begin).test('styles = 1'));
  assert.ok(new RegExp(repo['design-block'].begin).test('design system:'));

  // a style line inside `styles:` splits into name and classes
  const styleLine = repo['styles-block'].patterns.find(p => p.match);
  const m = '    product-card: card hover:shadow-xl p-4'.match(new RegExp(styleLine.match));
  assert.equal(m[1], 'product-card');
  assert.equal(m[3], 'card hover:shadow-xl p-4');

  // `styled as:` captures the class list, not the block colon
  const styled = new RegExp(repo['styled-as'].match);
  assert.equal('show "x" styled as: card mt-2'.match(styled)[4], 'card mt-2');
  assert.equal('button "Save" styled as: bg-red-600 hover:bg-red-800:'.match(styled)[4], 'bg-red-600 hover:bg-red-800');

  // component use: `Card:` and `Card with ...:` but not `show Card` or a lowercase name
  const comp = new RegExp(repo['component-use'].match);
  assert.ok(comp.test('    Card:'));
  assert.ok(comp.test('    Card with title="Hi":'));
  assert.ok(!comp.test('    show Card'));
  assert.ok(!comp.test('    loading:'));

  // keyword groups
  const kw = repo.keywords.patterns.map(p => new RegExp(p.match));
  for (const word of ['fetch', 'store', 'show', 'required', 'otherwise', 'login', 'into', 'filtered']) {
    assert.ok(kw.some(r => r.test(word)), word);
  }
  void rule; void re;
});

// ── scanning names ────────────────────────────────────────────────────

test('scan: finds components, pages, styles, resources and actions', () => {
  const s = scanSource([
    'component Card takes title, size:',
    '    show title',
    'component Row for item:',
    '    show item',
    'page product(id):',
    '    show id',
    'resource posts at "/api/posts":',
    '    title text',
    'action total:',
    '    give 5',
    'styles:',
    '    card: p-4 rounded',
    '    // note: ignored',
    '    muted: text-sm',
    'page after:',
    '    show 1',
    ''
  ].join('\r\n'));

  assert.deepEqual(s.components, [{ name: 'Card', props: ['title', 'size'] }, { name: 'Row', props: ['item'] }]);
  assert.deepEqual(s.pages.map(p => p.name), ['product', 'posts', 'after']);
  assert.deepEqual(s.pages[0].params, ['id']);
  assert.deepEqual(s.styles, [{ name: 'card', classes: 'p-4 rounded' }, { name: 'muted', classes: 'text-sm' }]);
  assert.deepEqual(s.resources, [{ name: 'posts', url: '/api/posts' }]);
  assert.deepEqual(s.actions, [{ name: 'total' }]);
});

test('scan: styles stop at the next unindented line, and files merge', () => {
  const a = scanSource('styles:\n    a: p-1\npage x:\n    show "y"\n');
  const b = scanSource('styles:\n    b: p-2\n');
  assert.deepEqual(mergeScans([a, b]).styles.map(s => s.name), ['a', 'b']);
});

test('scan: knows what the cursor is doing', () => {
  assert.equal(contextAt('use hel'), 'file');
  assert.equal(contextAt('    show x styled as: card hov:'), 'style');
  assert.equal(contextAt('    go to ho'), 'page');
  assert.equal(contextAt('    link "A" to pr'), 'page');
  assert.equal(contextAt('    show Ca'), 'component');
  assert.equal(contextAt('    Ca'), 'component');
  assert.equal(contextAt('    sho'), 'statement');
});

// ── running the compiler from the editor ──────────────────────────────

test('cli: finds the repo command and groups errors by file', () => {
  const found = findCli(root);
  assert.equal(found.viaNode, true);
  assert.ok(found.command.endsWith(path.join('cli', 'bolt.js')));
  assert.deepEqual(findCli('/nowhere', 'C:/x/bolt.js'), { command: 'C:/x/bolt.js', viaNode: true });

  const grouped = groupErrors([
    { file: 'src/pages/a.bolt', line: 3, column: 5, message: 'Bad', hint: 'Fix it' },
    { file: null, line: null, message: 'Project problem' }
  ]);
  assert.deepEqual(grouped.get('src/pages/a.bolt'), [{ line: 2, column: 4, message: 'Bad\n💡 Fix it' }]);
  assert.equal(grouped.get('')[0].line, 0);
});

test('cli: runBolt reports problems from a real project', async () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'bolt-ext-'));
  fs.mkdirSync(path.join(project, 'src', 'pages'), { recursive: true });
  fs.writeFileSync(path.join(project, 'src', 'pages', 'home.bolt'), 'page home:\n    show "ok"\n');
  fs.writeFileSync(path.join(project, 'src', 'pages', 'about.bolt'), 'page about:\n    show @@\n');

  const result = await runBolt(project, 'check', path.join(root, 'cli', 'bolt.js'));
  assert.equal(result.ok, true);
  assert.equal(result.data.ok, false);
  const grouped = groupErrors(result.data.errors);
  assert.ok(grouped.has('src/pages/about.bolt'));
  assert.equal(grouped.get('src/pages/about.bolt')[0].line, 1);

  fs.writeFileSync(path.join(project, 'src', 'pages', 'about.bolt'), 'page about:\n    show "fine"\n');
  const clean = await runBolt(project, 'check', path.join(root, 'cli', 'bolt.js'));
  assert.equal(clean.data.ok, true);
});

// ── snippets ──────────────────────────────────────────────────────────

// Fill the placeholders with their defaults so the snippet becomes real Bolt.
function expandSnippet(body) {
  const text = (Array.isArray(body) ? body.join('\n') : body)
    .replace(/\$\{\d+\|([^,|]+)[^}]*\|\}/g, '$1')       // ${2|success,danger|} -> success
    .replace(/\$\{\d+:([^}]*)\}/g, '$1')                // ${1:home} -> home
    .replace(/\$\d+/g, 'print "x"');                     // $0 $1 -> a harmless statement
  return text.replace(/\t/g, '    ');
}

test('snippets: no duplicate prefixes and every snippet has a description', () => {
  const snippets = readJson('snippets/bolt.json');
  const prefixes = Object.values(snippets).map(s => s.prefix);
  assert.equal(new Set(prefixes).size, prefixes.length);
  for (const [name, s] of Object.entries(snippets)) {
    assert.ok(s.description, name);
    assert.ok(s.body, name);
  }
});

test('snippets: every snippet expands to Bolt that the compiler accepts', () => {
  const snippets = readJson('snippets/bolt.json');
  const topLevel = /^(page|component|action|resource|styles|layout:|design system|use)\b/;
  for (const [name, s] of Object.entries(snippets)) {
    let code = expandSnippet(s.body);
    if (!topLevel.test(code)) {
      code = 'page demo:\n' + code.split('\n').map(l => '    ' + l).join('\n');   // statements live inside a page
    }
    assert.doesNotThrow(() => compileToAST(code + '\n'), `snippet "${name}" produced invalid Bolt:\n${code}`);
  }
});

test('cli: formatText formats unsaved editor text through `bolt fmt --stdin`', async () => {
  const { formatText } = require(path.join(extDir, 'lib', 'cli.js'));
  const out = await formatText(root, 'page home:\n\tshow "x"\n', path.join(root, 'cli', 'bolt.js'));
  assert.equal(out, 'page home:\n    show "x"\n');
  // text it cannot format safely gives null (the editor then leaves the document alone)
  const odd = 'page home:\n        show "a"\n    show "b"\n';
  assert.equal(await formatText(root, odd, path.join(root, 'cli', 'bolt.js')), null);
});
