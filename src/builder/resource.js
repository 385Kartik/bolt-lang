// ─── Bolt — resource expansion ─────────────────────────────────────────
// `resource products at "/api/products":` becomes an ordinary Bolt page
// (list + add form + delete buttons). We write that page as Bolt source and
// parse it, so everything downstream treats it like a page you wrote by hand.
//
// REST convention (same as json-server and most simple APIs):
//   GET    <url>        returns a list
//   POST   <url>        creates one and returns it (with an id)
//   DELETE <url>/<id>   deletes one

import { compileToAST } from '../index.js';

const RESERVED = new Set(['items', 'item', 'created']);

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

function fail(node, message, hint) {
  const file = node.fileName ? ` (in ${node.fileName}.bolt, line ${node.line})` : '';
  return new Error(`\n  ⚡ Compiler Error${file}:\n     ${message}\n${hint ? `\n  💡 Hint: ${hint}\n` : ''}`);
}

export function resourceSource(node) {
  const { name, url, fields } = node;
  const q = JSON.stringify;

  for (const f of fields) {
    if (RESERVED.has(f.name)) {
      throw fail(node, `Field '${f.name}' in resource '${name}' uses a name Bolt needs for itself.`,
        `Rename it (for example '${f.name}Name'). Reserved names: ${[...RESERVED].join(', ')}.`);
    }
  }

  const L = [];
  const add = (indent, text) => L.push(' '.repeat(indent) + text);

  add(0, `page ${name}:`);
  add(4, `fetch ${q(url)} into items:`);
  add(8, 'success:');
  add(12, 'column styled as: flex flex-col gap-6 max-w-3xl mx-auto py-8:');
  add(16, `show ${q(cap(name))} as title styled as: text-3xl font-extrabold`);

  // Add form
  add(16, 'form styled as: flex flex-col gap-3 p-6 border border-gray-300 rounded-2xl:');
  for (const f of fields) {
    const flags = [];
    if (f.required) flags.push('required');
    if (f.type === 'email') flags.push('email');
    if (flags.length) {
      add(20, `input ${q(cap(f.name))} into ${f.name}:`);
      for (const flag of flags) add(24, flag);
    } else {
      add(20, `input ${q(cap(f.name))} into ${f.name}`);
    }
  }
  const payload = fields.map(f => (f.type === 'number' ? `${f.name}: ${f.name} * 1` : `${f.name}: ${f.name}`)).join(', ');
  add(20, 'submit "Add" styled as: px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold:');
  add(24, `submit ${q(url)} with {${payload}}:`);
  add(28, 'success created:');
  add(32, 'add created to items');
  for (const f of fields) add(32, `${f.name} = ""`);
  add(32, `show toast "${cap(name)}: saved" as success`);
  add(28, 'error:');
  add(32, 'show toast "Could not save" as danger');

  // List with delete
  add(16, 'for every item in items:');
  add(20, 'row styled as: items-center justify-between gap-4 py-3 border-b border-gray-300:');
  add(24, 'row styled as: items-center gap-6:');
  for (const f of fields.filter(x => !x.hidden)) add(28, `show item.${f.name}`);
  add(24, 'button "Delete" styled as: text-sm font-medium text-red-500 bg-transparent:');
  add(28, `delete ${q(url + '/')} + item.id:`);
  add(32, 'success:');
  add(36, 'remove item from items');
  add(36, 'show toast "Deleted" as success');
  add(32, 'error:');
  add(36, 'show toast "Could not delete" as danger');

  return L.join('\n') + '\n';
}

// Returns a PageDef node for a ResourceDef.
export function expandResource(node) {
  let ast;
  try {
    ast = compileToAST(resourceSource(node));
  } catch (e) {
    if (e instanceof Error && e.message.includes('Compiler Error')) throw e;
    throw fail(node, `Could not build resource '${node.name}': ${e.message}`);
  }
  const page = ast.body.find(n => n.type === 'PageDef');
  // Point error markers at the resource line in the user's file.
  const relabel = n => {
    if (Array.isArray(n)) return n.forEach(relabel);
    if (n && typeof n === 'object') {
      if ('line' in n) n.line = node.line;
      Object.values(n).forEach(relabel);
    }
  };
  relabel(page);
  page.fileName = node.fileName;
  return page;
}
