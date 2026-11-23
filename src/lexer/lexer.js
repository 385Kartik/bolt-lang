// ─── Bolt Language — Lexer ─────────────────────────────────────────────
//
// Converts Bolt source code into a flat array of tokens for the parser.
//
// ── How Indentation Tracking Works ────────────────────────────────────
//
// Bolt uses indentation (like Python) instead of braces to define blocks.
// We maintain an "indent stack" — a stack of column-widths, starting at [0].
//
//   1. At the start of each logical line (right after a NEWLINE), we count
//      the number of leading spaces.
//
//   2. Compare that count to the top of the indent stack:
//      - GREATER → New block. Push the count, emit INDENT.
//      - EQUAL   → Same block. Do nothing.
//      - LESS    → Block(s) ended. Pop the stack (emitting DEDENT for each
//        pop) until the top matches. If no level matches, it's an error.
//
//   3. At EOF, emit one DEDENT for every remaining level above the base 0.
//
//   4. Blank lines and comment-only lines are skipped entirely — they
//      never produce NEWLINE or affect indentation.
//
// ── String Interpolation ──────────────────────────────────────────────
//
// Strings with `{expr}` inside are split into multiple tokens:
//   "Hello {name}, age {age}" →
//     STRING_START("Hello ")  IDENTIFIER(name)
//     STRING_MIDDLE(", age ") IDENTIFIER(age)
//     STRING_END("")
//
// Strings without interpolation produce a single STRING token.
//
// ─────────────────────────────────────────────────────────────────────

import { TokenType, KEYWORDS, createToken } from './tokens.js';
import { LexerError } from '../errors/errors.js';

/**
 * Tokenize Bolt source code into an array of tokens.
 * @param {string} source — the full source code string
 * @returns {Token[]} — array of token objects
 */
export function tokenize(source) {
  source = source.replace(/\r\n?/g, '\n'); // Windows (CRLF) files work the same as Unix files
  const tokens = [];
  const indentStack = [0]; // Stack of indentation levels, starts at column 0

  let pos = 0;      // Current position in the source string
  let line = 1;     // Current line number (1-indexed)
  let column = 1;   // Current column number (1-indexed)

  // ── Helpers ──────────────────────────────────────────────────────────

  /** Return the current character without advancing. */
  function peek() {
    return pos < source.length ? source[pos] : null;
  }

  /** Return the character at pos + offset without advancing. */
  function peekAt(offset) {
    const idx = pos + offset;
    return idx < source.length ? source[idx] : null;
  }

  /** Advance one character and return it. */
  function advance() {
    const ch = source[pos];
    pos++;
    if (ch === '\n') {
      line++;
      column = 1;
    } else {
      column++;
    }
    return ch;
  }

  /** Check if we've reached the end of source. */
  function isAtEnd() {
    return pos >= source.length;
  }

  /** Check if a character is a digit [0-9]. */
  function isDigit(ch) {
    return ch >= '0' && ch <= '9';
  }

  /** Check if a character can start an identifier [a-zA-Z_]. */
  function isAlpha(ch) {
    return (ch >= 'a' && ch <= 'z') ||
           (ch >= 'A' && ch <= 'Z') ||
           ch === '_';
  }

  /** Check if a character can continue an identifier [a-zA-Z0-9_]. */
  function isAlphaNumeric(ch) {
    return isAlpha(ch) || isDigit(ch);
  }

  /** Check if a character is a space or tab (not a newline). */
  function isHorizontalWhitespace(ch) {
    return ch === ' ' || ch === '\t';
  }

  /**
   * Check that the character after a word boundary is not alphanumeric,
   * ensuring we match whole words only (e.g., "if" but not "iffy").
   */
  function isWordBoundary(position) {
    if (position >= source.length) return true;
    const ch = source[position];
    return !isAlphaNumeric(ch);
  }

  // ── Emit helpers ─────────────────────────────────────────────────────

  /** Push a token onto the output array. */
  function emit(type, value, tokenLine, tokenColumn) {
    tokens.push(createToken(type, value, tokenLine, tokenColumn));
  }

  // ── Indentation Processing ───────────────────────────────────────────

  /**
   * Process indentation at the start of a logical line.
   * Counts leading spaces and emits INDENT / DEDENT tokens as needed.
   */
  function processIndentation() {
    let spaces = 0;

    // Count leading spaces (tabs count as-is, but we measure raw spaces)
    while (!isAtEnd() && peek() === ' ') {
      advance();
      spaces++;
    }

    // Handle tab characters — Bolt prefers spaces, but tabs are measured
    while (!isAtEnd() && peek() === '\t') {
      advance();
      spaces += 4; // Treat each tab as 4 spaces
    }

    // Skip blank lines — they produce no tokens and don't affect indentation
    if (isAtEnd() || peek() === '\n') {
      return;
    }

    // Skip comment-only lines — same treatment as blank lines
    if (peek() === '/' && peekAt(1) === '/') {
      skipComment();
      return;
    }

    const currentIndent = indentStack[indentStack.length - 1];

    if (spaces > currentIndent) {
      // Indentation increased → new block
      indentStack.push(spaces);
      emit(TokenType.INDENT, null, line, 1);
    } else if (spaces < currentIndent) {
      // Indentation decreased → one or more blocks ended
      while (indentStack.length > 1 && indentStack[indentStack.length - 1] > spaces) {
        indentStack.pop();
        emit(TokenType.DEDENT, null, line, 1);
      }
      // Verify we landed on a valid indentation level
      if (indentStack[indentStack.length - 1] !== spaces) {
        throw new LexerError(
          `Inconsistent indentation: found ${spaces} spaces, ` +
          `but no matching indentation level exists`,
          line, 1,
          'Make sure your indentation matches a previous block level. Bolt uses spaces for indentation.'
        );
      }
    }
    // If spaces === currentIndent, do nothing — same block continues
  }

  // ── Comment Handling ─────────────────────────────────────────────────

  /** Skip a // comment through to the end of the line (but not past \n). */
  function skipComment() {
    while (!isAtEnd() && peek() !== '\n') {
      advance();
    }
  }

  // ── Number Scanning ──────────────────────────────────────────────────

  /** Scan a numeric literal (integer or float). No leading-dot floats. */
  function scanNumber() {
    const startCol = column;
    let numStr = '';

    // Consume integer digits
    while (!isAtEnd() && isDigit(peek())) {
      numStr += advance();
    }

    // Check for decimal point followed by digits
    if (!isAtEnd() && peek() === '.' && peekAt(1) !== null && isDigit(peekAt(1))) {
      numStr += advance(); // consume '.'
      while (!isAtEnd() && isDigit(peek())) {
        numStr += advance();
      }
    }

    emit(TokenType.NUMBER, Number(numStr), line, startCol);
  }

  // ── String Scanning (with Interpolation) ─────────────────────────────

  /**
   * Scan a string literal, handling interpolation with {expr}.
   * - No interpolation → single STRING token
   * - With interpolation → STRING_START, ..expr tokens.., STRING_MIDDLE, ..., STRING_END
   */
  function scanString() {
    const startLine = line;
    const startCol = column;

    advance(); // consume opening "

    // First pass: scan the full string content to detect interpolation
    // We'll collect characters and track whether we encounter any `{`
    let hasInterpolation = false;
    let scanPos = pos;
    while (scanPos < source.length && source[scanPos] !== '"') {
      if (source[scanPos] === '\n') {
        // Unterminated string — hit newline
        throw new LexerError(
          'Unterminated string — missing closing "',
          startLine, startCol,
          'Add a closing " at the end of the string.'
        );
      }
      if (source[scanPos] === '{') {
        hasInterpolation = true;
        break; // No need to scan further
      }
      if (source[scanPos] === '\\') {
        scanPos++; // skip escaped character
      }
      scanPos++;
    }
    if (scanPos >= source.length && source[scanPos - 1] !== '"') {
      // Check if we reached EOF without closing
      // (We might have broken out of loop on '{', so only error if no '{' found)
      if (!hasInterpolation) {
        throw new LexerError(
          'Unterminated string — missing closing "',
          startLine, startCol,
          'Add a closing " at the end of the string.'
        );
      }
    }

    if (!hasInterpolation) {
      // ── Simple string with no interpolation ──
      let value = '';
      while (!isAtEnd() && peek() !== '"') {
        if (peek() === '\n') {
          throw new LexerError(
            'Unterminated string — missing closing "',
            startLine, startCol,
            'Add a closing " at the end of the string.'
          );
        }
        if (peek() === '\\') {
          advance(); // skip backslash
          value += scanEscapeChar();
        } else {
          value += advance();
        }
      }
      if (isAtEnd()) {
        throw new LexerError(
          'Unterminated string — missing closing "',
          startLine, startCol,
          'Add a closing " at the end of the string.'
        );
      }
      advance(); // consume closing "
      emit(TokenType.STRING, value, startLine, startCol);
    } else {
      // ── Interpolated string ──
      scanInterpolatedString(startLine, startCol);
    }
  }

  /**
   * Scan an interpolated string. We're positioned right after the opening ".
   * Emits STRING_START, expression tokens, STRING_MIDDLE (repeating), STRING_END.
   */
  function scanInterpolatedString(startLine, startCol) {
    let partCount = 0; // Track which part we're on

    while (true) {
      // Scan the next text segment (up to { or ")
      let textValue = '';
      const segLine = line;
      const segCol = column;

      while (!isAtEnd() && peek() !== '"' && peek() !== '{') {
        if (peek() === '\n') {
          throw new LexerError(
            'Unterminated string — missing closing "',
            startLine, startCol,
            'Add a closing " at the end of the string.'
          );
        }
        if (peek() === '\\') {
          advance(); // skip backslash
          textValue += scanEscapeChar();
        } else {
          textValue += advance();
        }
      }

      if (isAtEnd()) {
        throw new LexerError(
          'Unterminated string — missing closing "',
          startLine, startCol,
          'Add a closing " at the end of the string.'
        );
      }

      if (peek() === '"') {
        // End of string
        advance(); // consume closing "
        emit(TokenType.STRING_END, textValue, segLine, segCol);
        break;
      }

      // peek() === '{' → interpolation starts
      if (partCount === 0) {
        emit(TokenType.STRING_START, textValue, segLine, segCol);
      } else {
        emit(TokenType.STRING_MIDDLE, textValue, segLine, segCol);
      }
      partCount++;

      advance(); // consume '{'

      // Tokenize the expression inside { ... }
      scanInterpolationExpression(startLine, startCol);
    }
  }

  /**
   * Tokenize the expression inside a string interpolation { ... }.
   * We scan normal tokens until we hit the matching '}'.
   * Tracks brace nesting so expressions like {obj.method()} work.
   */
  function scanInterpolationExpression(stringStartLine, stringStartCol) {
    let braceDepth = 1;

    while (!isAtEnd() && braceDepth > 0) {
      skipHorizontalWhitespace();

      if (isAtEnd()) {
        throw new LexerError(
          'Unterminated interpolation — missing closing }',
          stringStartLine, stringStartCol,
          'Close the interpolation with } inside your string.'
        );
      }

      const ch = peek();

      if (ch === '}') {
        braceDepth--;
        if (braceDepth === 0) {
          advance(); // consume the closing }
          return;
        }
        emit(TokenType.RBRACE, '}', line, column);
        advance();
      } else if (ch === '{') {
        braceDepth++;
        emit(TokenType.LBRACE, '{', line, column);
        advance();
      } else if (ch === '\n') {
        throw new LexerError(
          'Unterminated interpolation — unexpected newline inside {…}',
          line, column,
          'String interpolation expressions must be on a single line.'
        );
      } else {
        // Scan a single token using the main scanning logic
        scanOneToken();
      }
    }

    if (braceDepth > 0) {
      throw new LexerError(
        'Unterminated interpolation — missing closing }',
        stringStartLine, stringStartCol,
        'Close the interpolation with } inside your string.'
      );
    }
  }

  // ── Escape Character Handling ────────────────────────────────────────

  /** Consume and return the character after a backslash. */
  function scanEscapeChar() {
    if (isAtEnd()) {
      throw new LexerError(
        'Unexpected end of file after backslash in string',
        line, column,
        'Add a character after the backslash, or remove it.'
      );
    }
    const ch = advance();
    switch (ch) {
      case 'n':  return '\n';
      case 't':  return '\t';
      case 'r':  return '\r';
      case '\\': return '\\';
      case '"':  return '"';
      case '{':  return '{';
      case '}':  return '}';
      default:   return '\\' + ch; // Unknown escape — keep as-is
    }
  }

  // ── Identifier / Keyword Scanning ────────────────────────────────────

  /**
   * Scan an identifier or keyword.
   * Handles multi-word keywords:
   *   "otherwise if" → OTHERWISE_IF
   *   "for every"    → FOR_EVERY
   */
  function scanIdentifierOrKeyword() {
    const startCol = column;
    const startLine = line;
    let word = '';

    while (!isAtEnd() && isAlphaNumeric(peek())) {
      word += advance();
    }

    // ── Multi-word keyword: "otherwise if" ──
    if (word === 'otherwise') {
      const saved = saveState();
      let spacesAfter = 0;
      while (!isAtEnd() && peek() === ' ') {
        advance();
        spacesAfter++;
      }
      if (spacesAfter > 0 && !isAtEnd()) {
        // Try to read the next word
        let nextWord = '';
        while (!isAtEnd() && isAlphaNumeric(peek())) {
          nextWord += advance();
        }
        if (nextWord === 'if' && isWordBoundary(pos)) {
          emit(TokenType.OTHERWISE_IF, 'otherwise if', startLine, startCol);
          return;
        }
      }
      // Not "otherwise if" — restore state and emit plain "otherwise"
      restoreState(saved);
    }

    // ── Multi-word keyword: "design system" ──
    if (word === 'design') {
      const saved = saveState();
      let spacesAfter = 0;
      while (!isAtEnd() && peek() === ' ') {
        advance();
        spacesAfter++;
      }
      let nextWord = '';
      while (!isAtEnd() && isAlphaNumeric(peek())) {
        nextWord += advance();
      }
      if (nextWord === 'system' && isWordBoundary(pos)) {
        emit(TokenType.DESIGN_SYSTEM, 'design system', startLine, startCol);
        return;
      }
      restoreState(saved);
    }

    // ── Multi-word keyword: "for every" ──
    if (word === 'for') {
      const saved = saveState();
      let spacesAfter = 0;
      while (!isAtEnd() && peek() === ' ') {
        advance();
        spacesAfter++;
      }
      if (spacesAfter > 0 && !isAtEnd()) {
        let nextWord = '';
        while (!isAtEnd() && isAlphaNumeric(peek())) {
          nextWord += advance();
        }
        if (nextWord === 'every' && isWordBoundary(pos)) {
          emit(TokenType.FOR_EVERY, 'for every', startLine, startCol);
          return;
        }
      }
      // Not "for every" — restore and emit "for" as identifier
      restoreState(saved);
    }

    // ── Multi-word keyword: "logged in" ──
    if (word === 'logged') {
      const saved = saveState();
      let spacesAfter = 0;
      while (!isAtEnd() && peek() === ' ') {
        advance();
        spacesAfter++;
      }
      if (spacesAfter > 0 && !isAtEnd()) {
        let nextWord = '';
        while (!isAtEnd() && isAlphaNumeric(peek())) {
          nextWord += advance();
        }
        if (nextWord === 'in' && isWordBoundary(pos)) {
          emit(TokenType.LOGGED_IN, 'logged in', startLine, startCol);
          return;
        }
      }
      restoreState(saved);
    }

    // ── Check single-word keywords ──
    const keywordType = KEYWORDS[word];
    if (keywordType) {
      // Special case: true/false carry boolean values
      if (keywordType === TokenType.TRUE) {
        emit(TokenType.TRUE, true, startLine, startCol);
      } else if (keywordType === TokenType.FALSE) {
        emit(TokenType.FALSE, false, startLine, startCol);
      } else {
        emit(keywordType, word, startLine, startCol);
      }
    } else {
      emit(TokenType.IDENTIFIER, word, startLine, startCol);
    }
  }

  // ── State Save / Restore (for lookahead) ─────────────────────────────

  /** Save the scanner state for backtracking. */
  function saveState() {
    return { pos, line, column };
  }

  /** Restore a previously saved scanner state. */
  function restoreState(state) {
    pos = state.pos;
    line = state.line;
    column = state.column;
  }

  // ── Whitespace Helpers ───────────────────────────────────────────────

  /** Skip spaces and tabs (not newlines). */
  function skipHorizontalWhitespace() {
    while (!isAtEnd() && isHorizontalWhitespace(peek())) {
      advance();
    }
  }

  // ── Single Token Scanner ─────────────────────────────────────────────

  /**
   * Scan exactly one token from the current position.
   * Used by the main loop and also by interpolation expression scanning.
   */
  function scanOneToken() {
    const ch = peek();

    // ── Numbers ──
    if (isDigit(ch)) {
      scanNumber();
      return;
    }

    // ── Strings ──
    if (ch === '"') {
      scanString();
      return;
    }

    // ── Identifiers / Keywords ──
    if (isAlpha(ch)) {
      scanIdentifierOrKeyword();
      return;
    }

    // ── Two-character operators ──
    const next = peekAt(1);
    if (ch === '=' && next === '=') {
      const col = column;
      advance(); advance();
      emit(TokenType.DOUBLE_EQUALS, '==', line, col);
      return;
    }
    if (ch === '!' && next === '=') {
      const col = column;
      advance(); advance();
      emit(TokenType.NOT_EQUALS, '!=', line, col);
      return;
    }
    if (ch === '>' && next === '=') {
      const col = column;
      advance(); advance();
      emit(TokenType.GTE, '>=', line, col);
      return;
    }
    if (ch === '<' && next === '=') {
      const col = column;
      advance(); advance();
      emit(TokenType.LTE, '<=', line, col);
      return;
    }

    // ── Single-character tokens ──
    const col = column;
    switch (ch) {
      case '=': advance(); emit(TokenType.ASSIGN,   '=', line, col); return;
      case '+': advance(); emit(TokenType.PLUS,     '+', line, col); return;
      case '-': advance(); emit(TokenType.MINUS,    '-', line, col); return;
      case '*': advance(); emit(TokenType.STAR,     '*', line, col); return;
      case '/': advance(); emit(TokenType.SLASH,    '/', line, col); return;
      case '%': advance(); emit(TokenType.MODULO,   '%', line, col); return;
      case '>': advance(); emit(TokenType.GT,       '>', line, col); return;
      case '<': advance(); emit(TokenType.LT,       '<', line, col); return;
      case ':': advance(); emit(TokenType.COLON,    ':', line, col); return;
      case ',': advance(); emit(TokenType.COMMA,    ',', line, col); return;
      case '.': advance(); emit(TokenType.DOT,      '.', line, col); return;
      case '(': advance(); emit(TokenType.LPAREN,   '(', line, col); return;
      case ')': advance(); emit(TokenType.RPAREN,   ')', line, col); return;
      case '[': advance(); emit(TokenType.LBRACKET, '[', line, col); return;
      case ']': advance(); emit(TokenType.RBRACKET, ']', line, col); return;
      case '{': advance(); emit(TokenType.LBRACE,   '{', line, col); return;
      case '}': advance(); emit(TokenType.RBRACE,   '}', line, col); return;
      default:
        throw new LexerError(
          `Unexpected character '${ch}'`,
          line, col,
          `Bolt doesn't recognize '${ch}'. Check for typos or unsupported symbols.`
        );
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  //  MAIN TOKENIZATION LOOP
  // ══════════════════════════════════════════════════════════════════════

  // Track whether we're at the start of a line (for indentation processing)
  let atLineStart = true;

  while (!isAtEnd()) {
    // ── At the start of a line, handle indentation ──
    if (atLineStart) {
      atLineStart = false;

      // Check if this line is blank or comment-only BEFORE processing indentation
      // We need to peek ahead without consuming characters
      const savedState = saveState();
      let peekSpaces = 0;
      while (!isAtEnd() && peek() === ' ') {
        advance();
        peekSpaces++;
      }
      while (!isAtEnd() && peek() === '\t') {
        advance();
        peekSpaces += 4;
      }

      if (isAtEnd() || peek() === '\n') {
        // Blank line — skip it entirely; don't process indentation or emit NEWLINE
        if (!isAtEnd()) {
          advance(); // consume the newline
          atLineStart = true;
        }
        continue;
      }

      if (peek() === '/' && peekAt(1) === '/') {
        // Comment-only line — skip it
        restoreState(savedState);
        // Advance past the leading whitespace
        while (!isAtEnd() && isHorizontalWhitespace(peek())) {
          advance();
        }
        skipComment();
        // Consume the trailing newline if present
        if (!isAtEnd() && peek() === '\n') {
          advance();
          atLineStart = true;
        }
        continue;
      }

      // This is a real line with content — restore and do indentation
      restoreState(savedState);
      processIndentation();
      continue;
    }

    const ch = peek();

    // ── Newlines ──
    if (ch === '\n') {
      advance();

      // Don't emit NEWLINE at the very start (before any real tokens)
      if (tokens.length === 0) {
        atLineStart = true;
        continue;
      }

      // Don't emit multiple NEWLINEs in a row
      const lastToken = tokens[tokens.length - 1];
      if (lastToken && lastToken.type !== TokenType.NEWLINE) {
        emit(TokenType.NEWLINE, '\\n', line - 1, column);
      }

      atLineStart = true;
      continue;
    }

    // ── Horizontal whitespace (mid-line) ──
    if (isHorizontalWhitespace(ch)) {
      advance();
      continue;
    }

    // ── Comments ──
    if (ch === '/' && peekAt(1) === '/') {
      skipComment();
      continue;
    }

    // ── Scan a real token ──
    scanOneToken();
  }

  // ── EOF Cleanup ──────────────────────────────────────────────────────

  // Remove trailing NEWLINE right before EOF (if present)
  if (tokens.length > 0 && tokens[tokens.length - 1].type === TokenType.NEWLINE) {
    tokens.pop();
  }

  // Emit DEDENT for each remaining indentation level above the base
  while (indentStack.length > 1) {
    indentStack.pop();
    emit(TokenType.DEDENT, null, line, 1);
  }

  // Emit the final EOF token
  emit(TokenType.EOF, null, line, column);

  return tokens;
}
