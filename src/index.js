// ─── Bolt Language — Main Entry Point ──────────────────────────────────
// The public API for the Bolt compiler.
//
// Usage:
//   import { compile, run } from './src/index.js';
//
//   const js = compile(boltSource);     // → JavaScript string
//   run(boltSource);                    // → compile + execute
//

import { tokenize } from './lexer/lexer.js';
import { parse } from './parser/parser.js';
import { generate, generateWithRuntime } from './generator/generator.js';
import { formatError } from './errors/errors.js';

// ── compile(source) ─────────────────────────────────────────────────
// Takes Bolt source code, returns compiled JavaScript string.
// Throws BoltError on failure.
export function compile(sourceOrAst, options = {}) {
  const { debug = false } = options;

  let ast;
  if (typeof sourceOrAst === 'string') {
    // Step 1: Tokenize
    const tokens = tokenize(sourceOrAst);
    if (debug) {
      console.log('─── Tokens ───');
      console.log(tokens.map(t => `${t.type}(${JSON.stringify(t.value)})`).join(' '));
      console.log('');
    }

    // Step 2: Parse
    ast = parse(tokens);
  } else {
    // Already an AST
    ast = sourceOrAst;
  }

  if (debug) {
    console.log('─── AST ───');
    console.log(JSON.stringify(ast, null, 2));
    console.log('');
  }

  // Step 3: Generate
  const js = generateWithRuntime(ast);
  if (debug) {
    console.log('─── Generated JS ───');
    console.log(js);
    console.log('');
  }

  return js;
}

// ── run(source) ──────────────────────────────────────────────────────
// Compiles and executes Bolt source code.
// Returns the result of the last expression.
export function run(source, options = {}) {
  try {
    const js = compile(source, options);
    // Execute using Function constructor (safe for local usage)
    const fn = new Function(js);
    return fn();
  } catch (error) {
    if (error.line) {
      // It's a BoltError — format it nicely
      console.error(formatError(error, source));
    } else {
      // It's a JS runtime error from the generated code
      console.error(`\n  ⚡ Runtime Error: ${error.message}\n`);
    }
    process.exitCode = 1;
  }
}

// ── compileToAST(source) ─────────────────────────────────────────────
// Returns the AST without generating code. Useful for testing/tooling.
export function compileToAST(source) {
  const tokens = tokenize(source);
  return parse(tokens);
}

// ── compileToTokens(source) ──────────────────────────────────────────
// Returns the token stream. Useful for testing/tooling.
export function compileToTokens(source) {
  return tokenize(source);
}
