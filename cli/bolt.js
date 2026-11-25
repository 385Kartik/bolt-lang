#!/usr/bin/env node
// ─── Bolt CLI ─────────────────────────────────────────────────────────
// Usage:
//   bolt run app.bolt        → Compile and execute
//   bolt compile app.bolt    → Compile to JS and print to stdout
//   bolt compile app.bolt -o out.js  → Compile and write to file
//

import { readFileSync, writeFileSync, statSync, readdirSync } from 'fs';
import { resolve, join, extname, parse } from 'path';
import { compile, run, compileToAST } from '../src/index.js';

const args = process.argv.slice(2);
const command = args[0];
const file = args[1];

function showHelp() {
  console.log(`
  ⚡ Bolt Language Compiler v0.1

  Usage:
    bolt init <dir>                    Scaffold a new Bolt project
    bolt dev <dir>                     Start development server with live reload
    bolt build <dir>                   Build production React files in .bolt-generated
    bolt run <file.bolt>               Compile and execute
    bolt compile <file.bolt>           Compile to JS (stdout)
    bolt compile <file.bolt> -o <out>  Compile to JS file
    bolt tokens <file.bolt>            Show token stream (debug)
    bolt ast <file.bolt | dir>         Show AST (debug)
    bolt check [dir] [--json]          Check the whole project, list every problem
    bolt stats [dir] [--json]          Compare Bolt size with the React it generates
    bolt fmt [dir|file] [--check]      Tidy .bolt files (indentation, spacing)
    bolt serve [dir] [--db sqlite]     Run the built-in API for your 'resource' and 'endpoint' blocks
    bolt spec                          Print the short language cheat-sheet (for AI)
    bolt help                          Show this message
`);
}

function readSource(filePath) {
  const resolved = resolve(filePath);
  try {
    return readFileSync(resolved, 'utf-8');
  } catch (err) {
    console.error(`\n  ⚡ Error: Could not read file "${filePath}"\n`);
    process.exit(1);
  }
}

function findBoltFiles(dir) {
  let results = [];
  const list = readdirSync(dir);
  for (const file of list) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findBoltFiles(filePath));
    } else if (extname(filePath) === '.bolt') {
      results.push(filePath);
    }
  }
  return results;
}

if (!command || command === 'help' || command === '--help') {
  showHelp();
  process.exit(0);
}

// ── check / stats / spec: work on a whole project (default: current folder) ──
if (command === 'check' || command === 'stats' || command === 'spec' || command === 'serve') {
  const wantJson = args.includes('--json');
  const target = args.slice(1).find(a => !a.startsWith('--')) || '.';

  if (command === 'spec') {
    const { fileURLToPath } = await import('url');
    const specPath = join(fileURLToPath(new URL('..', import.meta.url)), 'llms.txt');
    process.stdout.write(readFileSync(specPath, 'utf-8'));
    process.exit(0);
  }

  if (command === 'serve') {
    const { findApi } = await import('../src/check.js');
    const { createApiServer } = await import('../src/server/api.js');
    const root = resolve(target);
    const { resources, endpoints } = findApi(root);
    if (resources.length === 0 && endpoints.length === 0) {
      console.log(`
  ⚡ No 'resource' blocks found in ${root}.
     Add one, for example:

     resource products at "/api/products":
         title text required
         price number
`);
      process.exit(1);
    }
    const storage = args.includes('sqlite') && args.includes('--db') ? 'sqlite' : (process.env.BOLT_DB === 'sqlite' ? 'sqlite' : 'json');
    let api;
    try {
      api = createApiServer({ resources, endpoints, storage, dataDir: join(root, '.bolt-data') });
    } catch (e) {
      console.error(`
  ⚡ ${e.message}
`);
      process.exit(1);
    }
    const port = Number(process.env.BOLT_API_PORT) || 3001;
    try {
      await api.listen(port);
    } catch (e) {
      console.error(`
  ⚡ Could not start the API on port ${port}: ${e.message}
     Use another port with:  BOLT_API_PORT=3002 bolt serve
`);
      process.exit(1);
    }
    console.log(`
  ⚡ Bolt API running on http://localhost:${port}
`);
    for (const r of resources) console.log(`     ${r.url}   (${r.fields.map(f => f.name).join(', ')})`);
    for (const e of endpoints) console.log(`     ${e.method.toUpperCase().padEnd(6)} ${e.path}   (endpoint)`);
    console.log(`
     Data is saved in ${storage === 'sqlite' ? join(root, '.bolt-data', 'bolt.db') + ' (SQLite)' : join(root, '.bolt-data')}
`);
    await new Promise(() => {}); // keep running
  }

  const { checkProject, projectStats } = await import('../src/check.js');

  if (command === 'check') {
    const result = checkProject(target);
    if (wantJson) {
      console.log(JSON.stringify(result, null, 2));
    } else if (result.ok) {
      console.log(`\n  ✓ No problems found (${result.files} .bolt files checked).\n`);
    } else {
      console.log(`\n  ⚡ ${result.errors.length} problem${result.errors.length === 1 ? '' : 's'} found:\n`);
      for (const e of result.errors) {
        const where = e.file ? `${e.file}${e.line ? ':' + e.line : ''}` : (e.line ? `line ${e.line}` : 'project');
        console.log(`  ✗ ${where}\n    ${e.message}`);
        if (e.hint) console.log(`    💡 ${e.hint}`);
        console.log('');
      }
    }
    process.exit(result.ok ? 0 : 1);
  }

  const stats = projectStats(target);
  if (wantJson) {
    console.log(JSON.stringify(stats, null, 2));
  } else if (!stats.ok) {
    console.log(`\n  ⚡ Fix these problems first (run: bolt check):\n`);
    for (const e of stats.errors) console.log(`  ✗ ${e.file || 'project'}${e.line ? ':' + e.line : ''}  ${e.message}`);
    console.log('');
  } else {
    console.log(`
  ⚡ Bolt size report (${stats.bolt.files} .bolt files)

     Bolt source        ${String(stats.bolt.tokens).padStart(7)} tokens   ${String(stats.bolt.chars).padStart(8)} chars
     Generated React    ${String(stats.react.tokens).padStart(7)} tokens   ${String(stats.react.chars).padStart(8)} chars
     React is           ${stats.ratio}x bigger than the Bolt you write

     (tokens are estimated: words, numbers and symbols each count as one)
`);
  }
  process.exit(stats.ok ? 0 : 1);
}

// ── fmt: tidy .bolt files (indentation, spacing). --check only reports, --stdout prints one file ──
if (command === 'fmt') {
  const check = args.includes('--check');
  const toStdout = args.includes('--stdout');   // print one file; --stdin formats text piped in (used by editors)
  const target = args.slice(1).find(a => !a.startsWith('--')) || '.';
  const { formatPath, formatSource } = await import('../src/format.js');

  if (toStdout || args.includes('--stdin')) {
    const text = args.includes('--stdin') ? readFileSync(0, 'utf-8') : readFileSync(resolve(target), 'utf-8');
    const r = formatSource(text);
    process.stdout.write(r.text);
    process.exit(r.ok ? 0 : 1);
  }

  const result = formatPath(target, { check });
  for (const f of result.changed) console.log(`  ${check ? '✗ needs formatting' : '✓ formatted'}  ${f}`);
  for (const s of result.skipped) console.log(`  ⚠ skipped  ${s.file}\n      ${s.reason}`);
  const total = result.changed.length + result.unchanged + result.skipped.length;
  if (check) {
    console.log(result.changed.length === 0 ? `\n  ✓ All ${total} files are formatted.\n` : `\n  ⚡ ${result.changed.length} of ${total} files need formatting. Run: bolt fmt\n`);
    process.exit(result.changed.length === 0 ? 0 : 1);
  }
  console.log(`\n  ⚡ ${result.changed.length} formatted, ${result.unchanged} already tidy${result.skipped.length ? `, ${result.skipped.length} skipped` : ''}.\n`);
  process.exit(0);
}

if (!file) {
  console.error('\n  ⚡ Error: No file or directory specified.\n');
  showHelp();
  process.exit(1);
}

const resolvedFile = resolve(file);

if (command === 'init') {
  try {
    const { scaffoldProject } = await import('../src/builder/builder.js');
    scaffoldProject(resolvedFile);
  } catch (error) {
    console.error(`\n  ⚡ Error: Could not scaffold project.\n`, error);
    process.exit(1);
  }
  process.exit(0);
}

let isDirectory = false;
try {
  isDirectory = statSync(resolvedFile).isDirectory();
} catch (e) {
  console.error(`\n  ⚡ Error: Path not found "${file}"\n`);
  process.exit(1);
}

let sourceOrAst;
let rawSource = ''; // For single file commands that need string source

if (isDirectory) {
  const files = findBoltFiles(resolvedFile);
  if (files.length === 0) {
    console.error(`\n  ⚡ Error: No .bolt files found in "${file}"\n`);
    process.exit(1);
  }
  let globalBody = [];
  rawSource = '';
  for (const f of files) {
    try {
      const src = readFileSync(f, 'utf-8');
      rawSource += `\n/* ─── File: ${f} ─── */\n` + src + '\n';
      const ast = compileToAST(src);
      
      const fileName = parse(f).name;
      ast.body.forEach(node => node.fileName = fileName);
      const pageNode = ast.body.find(n => n.type === 'PageDef');
      if (pageNode && pageNode.name.toLowerCase() !== fileName.toLowerCase()) {
        console.error(`\n  ⚡ Error in file ${f}:\n`);
        console.error(`     Page name '${pageNode.name}' must match the file name '${fileName}'\n`);
        process.exit(1);
      }
      
      globalBody = globalBody.concat(ast.body);
    } catch (e) {
      console.error(`\n  ⚡ Error in file ${f}:\n`);
      const { formatError } = await import('../src/errors/errors.js');
      console.error(formatError(e, readFileSync(f, 'utf-8')));
      process.exit(1);
    }
  }
  sourceOrAst = { type: 'Program', body: globalBody, line: 1 };
} else {
  rawSource = readSource(file);
  sourceOrAst = rawSource;
}

switch (command) {
  case 'run': {
    run(sourceOrAst);
    break;
  }

  case 'dev': {
    try {
      const { spawn } = await import('child_process');
      const { watch, existsSync } = await import('fs');
      const { buildProject } = await import('../src/builder/builder.js');
      
      // 1. Initial build
      let ast = sourceOrAst;
      if (typeof sourceOrAst === 'string') {
        ast = compileToAST(sourceOrAst);
      }
      buildProject(ast, join(resolvedFile, 'src', '.bolt-generated'), rawSource, { projectRoot: resolvedFile });

      // 2. Check node_modules and npm install if needed
      if (!existsSync(join(resolvedFile, 'node_modules'))) {
        console.log(`  📦 Installing dependencies...`);
        const installProcess = spawn('npm', ['install'], { cwd: resolvedFile, stdio: 'inherit', shell: true });
        await new Promise(resolveP => installProcess.on('close', resolveP));
      }

      // 2.5 Built-in API for `resource` blocks (same process, port 3001)
      let devApi = null;
      const startApi = async () => {
        const { findApi } = await import('../src/check.js');
        const { createApiServer } = await import('../src/server/api.js');
        const { resources, endpoints } = findApi(resolvedFile);
        if (resources.length === 0 && endpoints.length === 0) return;
        try {
          if (devApi) { devApi.setApi({ resources, endpoints }); return; }
          devApi = createApiServer({ resources, endpoints, storage: process.env.BOLT_DB === 'sqlite' ? 'sqlite' : 'json', dataDir: join(resolvedFile, '.bolt-data') });
        } catch (e) {
          console.log(`  ⚠️  ${e.message}`);
          return;
        }
        const apiPort = Number(process.env.BOLT_API_PORT) || 3001;
        try {
          await devApi.listen(apiPort);
          console.log(`  🗄️  Bolt API on http://localhost:${apiPort} (${[...resources.map(r => r.url), ...endpoints.map(e => `${e.method.toUpperCase()} ${e.path}`)].join(', ')})`);
        } catch (e) {
          console.log(`  ⚠️  Could not start the Bolt API on port ${apiPort}: ${e.message}`);
          devApi = null;
        }
      };
      await startApi();

      // 3. Start Vite
      console.log(`  🚀 Starting Dev Server...`);
      const viteProcess = spawn('npm', ['run', 'dev:vite'], { cwd: resolvedFile, stdio: 'inherit', shell: true });

      // 4. File Watcher
      let rebuildTimeout = null;
      watch(resolvedFile, { recursive: true }, (eventType, filename) => {
        if (filename && filename.endsWith('.bolt')) {
          if (rebuildTimeout) clearTimeout(rebuildTimeout);
          rebuildTimeout = setTimeout(() => {
            console.log(`\n  ⚡ Change detected in ${filename}, rebuilding...`);
            try {
              const files = findBoltFiles(resolvedFile);
              let globalBody = [];
              let watcherRawSource = '';
              for (const f of files) {
                const src = readFileSync(f, 'utf-8');
                watcherRawSource += `\n/* ─── File: ${f} ─── */\n` + src + '\n';
                const fileAst = compileToAST(src);
                
                const fileName = parse(f).name;
                fileAst.body.forEach(node => node.fileName = fileName);
                const pageNode = fileAst.body.find(n => n.type === 'PageDef');
                if (pageNode && pageNode.name.toLowerCase() !== fileName.toLowerCase()) {
                  throw new Error(`Page name '${pageNode.name}' must match the file name '${fileName}' in ${f}`);
                }
                
                globalBody = globalBody.concat(fileAst.body);
              }
              const newAst = { type: 'Program', body: globalBody, line: 1 };
              buildProject(newAst, join(resolvedFile, 'src', '.bolt-generated'), watcherRawSource, { projectRoot: resolvedFile });
              startApi();
            } catch (err) {
              console.error(`  ❌ Rebuild failed:`, err.message);
            }
          }, 100);
        }
      });
      
    } catch (error) {
      console.error(`\n  ⚡ Error: Could not start dev server.\n`, error);
      process.exit(1);
    }
    break;
  }

  case 'build': {
    try {
      const { buildProject } = await import('../src/builder/builder.js');
      // If we're building a directory, ast is already globalBody
      let ast = sourceOrAst;
      if (typeof sourceOrAst === 'string') {
        ast = compileToAST(sourceOrAst);
      }
      buildProject(ast, join(resolvedFile, 'src', '.bolt-generated'), rawSource, { projectRoot: resolvedFile });
    } catch (error) {
      const { formatError } = await import('../src/errors/errors.js');
      console.error(formatError(error, rawSource));
      process.exit(1);
    }
    break;
  }

  case 'compile': {
    try {
      const js = compile(sourceOrAst);
      const outputFlag = args.indexOf('-o');
      if (outputFlag !== -1 && args[outputFlag + 1]) {
        writeFileSync(args[outputFlag + 1], js, 'utf-8');
        console.log(`  ⚡ Compiled to ${args[outputFlag + 1]}`);
      } else {
        console.log(js);
      }
    } catch (error) {
      const { formatError } = await import('../src/errors/errors.js');
      console.error(formatError(error, rawSource));
      process.exit(1);
    }
    break;
  }

  case 'tokens': {
    const { compileToTokens } = await import('../src/index.js');
    const tokens = compileToTokens(rawSource);
    for (const t of tokens) {
      console.log(`  ${t.type.padEnd(16)} ${JSON.stringify(t.value).padEnd(20)} line:${t.line} col:${t.column}`);
    }
    break;
  }

  case 'ast': {
    // If it's a directory, sourceOrAst is already the AST
    let ast;
    if (typeof sourceOrAst === 'string') {
      const { compileToAST } = await import('../src/index.js');
      ast = compileToAST(sourceOrAst);
    } else {
      ast = sourceOrAst;
    }
    console.log(JSON.stringify(ast, null, 2));
    break;
  }

  default: {
    console.error(`\n  ⚡ Unknown command: "${command}"\n`);
    showHelp();
    process.exit(1);
  }
}
