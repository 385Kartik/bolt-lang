// Tests for `bolt fmt` (the formatter).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { formatSource, formatPath } from '../src/format.js';

const cli = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'cli', 'bolt.js');
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'bolt-fmt-'));

test('fmt: tabs, odd indentation, trailing spaces and blank lines are tidied', () => {
  const messy = [
    'page home:',
    '\tstore count = 0   ',
    '',
    '',
    '',
    '\tshow "A"',
    '\tif count == 0:',
    '\t\t\tshow "zero"',
    '\totherwise:',
    '\t\t\tshow "more"',
    'component Card:',
    '  column:',
    '      slot',
    ''
  ].join('\r\n');

  const r = formatSource(messy);
  assert.equal(r.ok, true);
  assert.equal(r.changed, true);
  assert.equal(r.text, [
    'page home:',
    '    store count = 0',
    '',
    '    show "A"',
    '    if count == 0:',
    '        show "zero"',
    '    otherwise:',
    '        show "more"',
    '',
    'component Card:',
    '    column:',
    '        slot',
    ''
  ].join('\n'));
});

test('fmt: already tidy code is left exactly as it is, and formatting twice changes nothing', () => {
  const tidy = 'page home:\n    show "A"\n\npage about:\n    show "B"\n';
  const once = formatSource(tidy);
  assert.equal(once.changed, false);
  assert.equal(once.text, tidy);

  const messy = formatSource('page a:\n\tshow "x"\npage b:\n\tshow "y"\n');
  assert.equal(formatSource(messy.text).changed, false);
});

test('fmt: consecutive top-level declarations stay together, comments stay attached', () => {
  const src = 'global store a = 1\nglobal store b = 2\n// the home page\npage home:\n    show "x"\n';
  const r = formatSource(src);
  assert.equal(r.text, src);          // no blank lines inserted between stores, comment stays above the page
});

test('fmt: blocks with `styles:` and strings keep their content', () => {
  const src = 'styles:\n\tcard: p-4 hover:shadow-xl\n\tmuted: text-sm\n';
  const r = formatSource(src);
  assert.equal(r.text, 'styles:\n    card: p-4 hover:shadow-xl\n    muted: text-sm\n');
});

test('fmt: inconsistent indentation is reported and the file is not touched', () => {
  const src = 'page home:\n        show "a"\n    show "b"\n';
  const r = formatSource(src);
  assert.equal(r.ok, false);
  assert.equal(r.text, src);
  assert.match(r.reason, /Inconsistent indentation/);
});

test('fmt: formatPath rewrites files, --check does not', () => {
  const dir = tmp();
  const file = path.join(dir, 'home.bolt');
  fs.writeFileSync(file, 'page home:\n\tshow "x"\n');

  const check = formatPath(dir, { check: true });
  assert.equal(check.changed.length, 1);
  assert.equal(fs.readFileSync(file, 'utf-8'), 'page home:\n\tshow "x"\n');   // untouched

  const done = formatPath(dir);
  assert.equal(done.changed.length, 1);
  assert.equal(fs.readFileSync(file, 'utf-8'), 'page home:\n    show "x"\n');
  assert.equal(formatPath(dir, { check: true }).changed.length, 0);
});

test('fmt: the command line works (--check exit codes and --stdout)', () => {
  const dir = tmp();
  const file = path.join(dir, 'home.bolt');
  fs.writeFileSync(file, 'page home:\n\tshow "x"\n');

  assert.equal(spawnSync(process.execPath, [cli, 'fmt', dir, '--check']).status, 1);
  const out = spawnSync(process.execPath, [cli, 'fmt', file, '--stdout'], { encoding: 'utf-8' });
  assert.equal(out.stdout, 'page home:\n    show "x"\n');
  assert.equal(spawnSync(process.execPath, [cli, 'fmt', dir]).status, 0);
  assert.equal(spawnSync(process.execPath, [cli, 'fmt', dir, '--check']).status, 0);
});

test('fmt: the repo\'s own example project is already formatted', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  assert.equal(formatPath(path.join(root, 'store-app'), { check: true }).changed.length, 0);
});
