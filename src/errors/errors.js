// ─── Bolt Language — Error Formatting ──────────────────────────────────
// Human-friendly error messages for non-programmers.
// Every error shows: what went wrong, where, and a hint for fixing it.

export class BoltError extends Error {
  constructor(message, line, column, hint) {
    super(message);
    this.name = 'BoltError';
    this.line = line;
    this.column = column;
    this.hint = hint || null;
  }
}

export class LexerError extends BoltError {
  constructor(message, line, column, hint) {
    super(message, line, column, hint);
    this.name = 'LexerError';
  }
}

export class ParseError extends BoltError {
  constructor(message, line, column, hint) {
    super(message, line, column, hint);
    this.name = 'ParseError';
  }
}

export class GeneratorError extends BoltError {
  constructor(message, line, column, hint) {
    super(message, line, column, hint);
    this.name = 'GeneratorError';
  }
}

// ── Format an error for display ─────────────────────────────────────
// Produces output like:
//
//   ⚡ Error on line 5, column 12:
//      Unexpected character '#'
//
//   💡 Hint: Bolt uses "//" for comments, not "#".
//
//      3 │ name = "Kartik"
//      4 │ age = 25
//    → 5 │ # this is wrong
//      6 │ active = true
//
export function formatError(error, source) {
  const lines = source.split('\n');
  const lineNum = error.line || 1;

  let output = '\n';
  output += `  ⚡ Error on line ${lineNum}`;
  if (error.column) output += `, column ${error.column}`;
  output += ':\n';
  output += `     ${error.message}\n`;

  if (error.hint) {
    output += '\n';
    output += `  💡 Hint: ${error.hint}\n`;
  }

  // Show source context (2 lines before, error line, 1 line after)
  output += '\n';
  const start = Math.max(0, lineNum - 3);
  const end = Math.min(lines.length, lineNum + 1);

  for (let i = start; i < end; i++) {
    const num = String(i + 1).padStart(4);
    const prefix = (i + 1 === lineNum) ? '  → ' : '    ';
    output += `${prefix}${num} │ ${lines[i]}\n`;
  }

  output += '\n';
  return output;
}

// ── Collect multiple errors ──────────────────────────────────────────
export class ErrorCollector {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  addError(message, line, column, hint) {
    this.errors.push(new BoltError(message, line, column, hint));
  }

  addWarning(message, line, column, hint) {
    this.warnings.push({ message, line, column, hint });
  }

  hasErrors() {
    return this.errors.length > 0;
  }

  format(source) {
    return this.errors.map(e => formatError(e, source)).join('');
  }
}
