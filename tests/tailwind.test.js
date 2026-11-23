// Tests for how Bolt merges its default classes with yours (yours always win).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeClasses } from '../src/generator/tailwind.js';

const has = (str, cls) => str.split(' ').includes(cls);

test('your color replaces the default color and its hover', () => {
  const out = mergeClasses('px-4 py-2 bg-blue-600 text-white hover:bg-blue-700', 'bg-red-600');
  assert.ok(has(out, 'bg-red-600'));
  assert.ok(!has(out, 'bg-blue-600'));
  assert.ok(!has(out, 'hover:bg-blue-700'));      // would turn blue on hover otherwise
  assert.ok(has(out, 'px-4') && has(out, 'text-white'));
});

test('your own hover color is kept', () => {
  const out = mergeClasses('bg-blue-600 hover:bg-blue-700', 'bg-red-600 hover:bg-red-800');
  assert.equal(out, 'bg-red-600 hover:bg-red-800');
});

test('padding shorthand overrides px/py, and only the same breakpoint', () => {
  assert.equal(mergeClasses('px-4 py-2 rounded-lg', 'p-8'), 'rounded-lg p-8');
  assert.equal(mergeClasses('md:p-4 p-2', 'md:p-8'), 'p-2 md:p-8');
});

test('text size, text color and weight are separate things', () => {
  assert.equal(mergeClasses('text-sm text-gray-500 font-medium', 'text-xl'), 'text-gray-500 font-medium text-xl');
  assert.equal(mergeClasses('text-sm text-gray-500', 'text-red-600'), 'text-sm text-red-600');
});

test('flex direction is replaced, and duplicates are removed', () => {
  assert.equal(mergeClasses('flex flex-row flex-wrap', 'flex-col gap-4'), 'flex flex-wrap flex-col gap-4');
  assert.equal(mergeClasses('flex flex-col', 'flex flex-col gap-4'), 'flex flex-col gap-4');
});

test('classes that are not in conflict are all kept', () => {
  assert.equal(mergeClasses('rounded-lg shadow-sm', 'mt-4 opacity-50'), 'rounded-lg shadow-sm mt-4 opacity-50');
});
