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
