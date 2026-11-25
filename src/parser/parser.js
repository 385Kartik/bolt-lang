// ─── Bolt Language — Parser ────────────────────────────────────────────
// Hand-written recursive descent parser.
// Takes an array of tokens (from the lexer) and returns an AST.Program.
//
// Grammar overview (see spec for full details):
//   Program      → Statement* EOF
//   Statement    → FunctionDef | IfStatement | RepeatStatement
//                | ForEveryStatement | GiveStatement | PrintStatement
//                | Assignment | ExpressionStatement
//   Expression   → LogicalOr (precedence climbing)

import { TokenType } from '../lexer/tokens.js';
import * as AST from './ast.js';
import { ParseError } from '../errors/errors.js';

// ── Token types that can start a value expression ────────────────────
// Used to decide whether an IDENTIFIER is a function call or a variable.
// Note: MINUS and NOT are intentionally excluded. Otherwise `a - b` gets
// misparsed as function call `a(-b)`. Use parens for negative args: `f(-5)`.
const VALUE_STARTERS = new Set([
  TokenType.NUMBER,
  TokenType.STRING,
  TokenType.STRING_START,
  TokenType.TRUE,
  TokenType.FALSE,
  TokenType.IDENTIFIER,
  TokenType.LBRACKET,
  TokenType.LBRACE,
  TokenType.LPAREN,
]);

// ─────────────────────────────────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────────────────────────────────
export function parse(tokens) {
  let pos = 0;

  // ── Core helpers ──────────────────────────────────────────────────

  /** Return the current token without consuming it. */
  function peek() {
    return tokens[pos];
  }

  /** Return the current token and advance to the next one. */
  function advance() {
    const token = tokens[pos];
    pos++;
    return token;
  }

  /**
   * Consume a token of the expected type, or throw a ParseError.
   * `friendlyName` is used in the error message for readability.
   */
  function expect(type, friendlyName) {
    if (check(type)) {
      return advance();
    }
    const t = peek();
    const isWord = type === TokenType.IDENTIFIER && t && t.type !== TokenType.IDENTIFIER && /^[a-z]+$/.test(String(t.value));
    throw new ParseError(
      `Expected ${friendlyName} but found '${t ? (t.value !== null ? t.value : t.type) : 'EOF'}'`,
      t ? t.line : (tokens.length > 0 ? tokens[tokens.length - 1].line : 1),
      t ? t.column : 1,
      isWord ? `'${t.value}' is a word Bolt already uses. Pick another name (for example 'entry' or '${t.value}Item').` : `Check the syntax around here.`
    );
  }

  /**
   * If the current token matches any of the given types, consume and
   * return it. Otherwise return null.
   */
  function match(...types) {
    const token = peek();
    if (types.includes(token.type)) {
      return advance();
    }
    return null;
  }

  /** Returns true if the current token matches any of the given types. */
  function check(...types) {
    return types.includes(peek().type);
  }

  /** Skip past any NEWLINE tokens. */
  function skipNewlines() {
    while (check(TokenType.NEWLINE)) {
      advance();
    }
  }

  function skipWhitespaceTokens() {
    while (check(TokenType.NEWLINE) || check(TokenType.INDENT) || check(TokenType.DEDENT)) {
      advance();
    }
  }

  // ── Identifier-or-keyword helper ─────────────────────────────────
  // Some keywords (like 'add', 'count', 'show') can also be used as
  // function names or variable names. This helper accepts either an
  // IDENTIFIER or any keyword token that has a string value, treating
  // it as a name.
  const KEYWORD_TYPES_USABLE_AS_NAMES = new Set([
    TokenType.ADD, TokenType.REMOVE, TokenType.CHECK, TokenType.COUNT,
    TokenType.FIRST, TokenType.LAST, TokenType.FILTERED, TokenType.SORTED,
    TokenType.BY, TokenType.OF, TokenType.PAGE, TokenType.SHOW,
    TokenType.BUTTON, TokenType.COMPONENT, TokenType.AS, TokenType.WHEN,
    TokenType.CHANGES, TokenType.GO, TokenType.EACH, TokenType.ALL,
    TokenType.FOR, TokenType.LINK, TokenType.INPUT, TokenType.INTO,
    TokenType.STORE, TokenType.REMEMBER, TokenType.FORGET,
    TokenType.IMAGE, TokenType.VIDEO, TokenType.FORM, TokenType.FETCH,
    TokenType.SUBMIT, TokenType.UPDATE_DATA, TokenType.DELETE_DATA, TokenType.WITH,
    TokenType.LOADING, TokenType.ERROR, TokenType.SUCCESS, TokenType.EMPTY,
    TokenType.TRUE, TokenType.FALSE,
    TokenType.IN, TokenType.TO, TokenType.FROM,
    TokenType.AND, TokenType.OR, TokenType.NOT,
    TokenType.STYLED,
    TokenType.LOGIN, TokenType.LOGOUT,
    TokenType.REQUIRED, TokenType.EMAIL,
    TokenType.MIN, TokenType.MAX, TokenType.MATCH,
    TokenType.GLOBAL, TokenType.CLEAR, TokenType.PERSIST
  ]);

  function isIdentifierLike() {
    const t = peek();
    return t.type === TokenType.IDENTIFIER || KEYWORD_TYPES_USABLE_AS_NAMES.has(t.type);
  }

  function expectIdentifierLike(context) {
    const t = peek();
    if (t.type === TokenType.IDENTIFIER || KEYWORD_TYPES_USABLE_AS_NAMES.has(t.type)) {
      return advance();
    }
    const isWord = t.type !== TokenType.IDENTIFIER && /^[a-z]+$/.test(String(t.value));
    throw new ParseError(
      `Expected ${context} but found '${t.value}'`,
      t.line, t.column,
      isWord ? `'${t.value}' is a word Bolt already uses. Pick another name (for example 'entry' or '${t.value}Item').` : undefined,
    );
  }

  // ── Program ───────────────────────────────────────────────────────

  function parseProgram() {
    const body = [];
    skipNewlines();

    while (peek().type !== TokenType.EOF) {
      body.push(parseStatement());
      skipNewlines();
    }

    return AST.Program(body);
  }

  // ── Statement dispatch ────────────────────────────────────────────

  function parseStatement() {
    const token = peek();

    // Component with children, no `show` needed:   Card:   /   Card with title="Hi":
    if (token.type === TokenType.IDENTIFIER && /^[A-Z]/.test(String(token.value)) && tokens[pos + 1] &&
        tokens[pos + 1].line === token.line &&
        (tokens[pos + 1].type === TokenType.WITH ||
         (tokens[pos + 1].type === TokenType.COLON && tokens[pos + 2] && tokens[pos + 2].type === TokenType.NEWLINE))) {
      return parseShowStatement(true);
    }

    // Custom API route:  endpoint get "/api/search":
    if (token.type === TokenType.IDENTIFIER && token.value === 'endpoint' &&
        tokens[pos + 1] && tokens[pos + 1].line === token.line &&
        ['get', 'post', 'put', 'patch', 'delete'].includes(String(tokens[pos + 1].value)) &&
        tokens[pos + 2] && tokens[pos + 2].type === TokenType.STRING) {
      advance(); // 'endpoint'
      const method = String(advance().value);
      const routePath = advance().value;
      expect(TokenType.COLON, "':' after the endpoint address");
      return AST.EndpointDef(method, routePath, parseBlock(), token.line);
    }

    // Resource block:  resource products at "/api/products":
    if (token.type === TokenType.IDENTIFIER && token.value === 'resource' &&
        tokens[pos + 1] && tokens[pos + 1].line === token.line &&
        tokens[pos + 2] && tokens[pos + 2].value === 'at') {
      return parseResourceDef();
    }

    // Layout block:  layout:   /   page opt-out:  layout none
    if (token.type === TokenType.IDENTIFIER && token.value === 'layout' && tokens[pos + 1]) {
      const nxt = tokens[pos + 1];
      if (nxt.type === TokenType.COLON && tokens[pos + 2] && tokens[pos + 2].type === TokenType.NEWLINE) {
        advance(); // 'layout'
        advance(); // ':'
        return AST.LayoutDef(parseBlock(), token.line);
      }
      if (nxt.type === TokenType.IDENTIFIER && nxt.value === 'none' && nxt.line === token.line) {
        advance(); advance();
        match(TokenType.NEWLINE);
        return AST.NoLayout(token.line);
      }
    }

    // Named styles block:  styles:  (contextual keyword, 'styles' stays a valid variable name elsewhere)
    if (token.type === TokenType.IDENTIFIER && token.value === 'styles' &&
        tokens[pos + 1] && tokens[pos + 1].type === TokenType.COLON &&
        tokens[pos + 2] && tokens[pos + 2].type === TokenType.NEWLINE) {
      return parseStylesDef();
    }

    switch (token.type) {
      case TokenType.FUNCTION:    return parseFunctionDef();
      case TokenType.IF:          return parseIfStatement();
      case TokenType.REPEAT:      return parseRepeatStatement();
      case TokenType.FOR_EVERY:   return parseForEveryStatement();
      case TokenType.GIVE:        return parseGiveStatement();
      case TokenType.PRINT:       return parsePrintStatement();

      // Phase 2a: Collection operations
      case TokenType.ADD:         return parseAddTo();
      case TokenType.REMOVE:      return parseRemoveFrom();
      case TokenType.CHECK:       return parseCheckIn();
      
      // Phase 2b: UI
      case TokenType.PAGE:        return parsePageDef();
      case TokenType.SHOW:        return parseShowStatement();
      case TokenType.BUTTON:      return parseButtonStatement();
      case TokenType.COMPONENT:   return parseComponentDef();
      case TokenType.LINK:        return parseLinkStatement();
      case TokenType.INPUT:       return parseInputStatement();
      case TokenType.USE:         return parseUseStatement();
      
      // Layout primitives
      case TokenType.ROW:         return parseLayoutBlock('row');
      case TokenType.COLUMN:      return parseLayoutBlock('column');
      case TokenType.GRID:        return parseLayoutBlock('grid');
      case TokenType.CARD:        return parseLayoutBlock('card');
      case TokenType.HERO:        return parseLayoutBlock('hero');
      case TokenType.SECTION:     return parseLayoutBlock('section');
      case TokenType.CONTAINER:   return parseLayoutBlock('container');
      case TokenType.FORM:        return parseFormBlock();

      case TokenType.IMAGE:       return parseImageStatement();
      case TokenType.VIDEO:       return parseVideoStatement();
      case TokenType.FETCH:       return parseFetchStatement();
      case TokenType.SUBMIT:      return parseSubmitStatement();
      case TokenType.UPDATE_DATA: return parseUpdateDataStatement();
      case TokenType.DELETE_DATA: return parseDeleteDataStatement();
      
      // Phase 5: Styling
      case TokenType.STYLED:      return parseStyleStatement();

      // Phase 2c: State
      case TokenType.STORE:       return parseStoreDeclaration();
      case TokenType.GLOBAL:      return parseGlobalStoreDeclaration();
      case TokenType.CLEAR:       return parseClearStatement();
      case TokenType.REMEMBER:    return parseRememberDeclaration();
      case TokenType.FORGET:      return parseForgetStatement();

      // Phase 14: Global Design System
      case TokenType.DESIGN_SYSTEM: return parseDesignSystemDef();

      // Control flow
      case TokenType.WHEN:        return parseWhenChanges();
      case TokenType.GO:          return parseGoTo();
      
      // Phase 3: Actions
      case TokenType.ACTION:      return parseActionDef();
      // Phase 4: Auth
      case TokenType.LOGIN:       return parseLoginStatement();
      case TokenType.LOGOUT:      return parseLogoutStatement();

      default:                    return parseAssignmentOrExpression();
    }
  }

  // ── Phase 5: Styling ──────────────────────────────────────────────

  function parseStyleClause() {
    let line = peek().line;
    if (match(TokenType.STYLED)) {
      expect(TokenType.AS, "'as' after 'styled'");
    } else if (match(TokenType.AS)) {
      // Just 'as'
    } else {
      throw new ParseError("Expected 'styled as' or 'as'", line, peek().column);
    }
    
    // For 'styled as:', we expect a colon. For 'as', we optionally consume it.
    if (check(TokenType.COLON) && tokens[pos+1] && tokens[pos+1].type === TokenType.STRING) {
      match(TokenType.COLON);
    } else if (tokens[pos-2] && tokens[pos-2].type === TokenType.STYLED) {
       expect(TokenType.COLON, "':' after 'styled as'");
    }

    if (check(TokenType.STRING)) {
      const strToken = advance();
      return AST.RawStyle(strToken.value, line);
    }

    // Capture everything until NEWLINE (or COLON followed by NEWLINE for buttons)
    const segmentTokens = [];
    while (!check(TokenType.NEWLINE) && !check(TokenType.DEDENT) && !check(TokenType.EOF)) {
      // Stop if we see a colon that is immediately followed by a newline (the button/component block start)
      if (check(TokenType.COLON)) {
        const nextToken = pos + 1 < tokens.length ? tokens[pos + 1] : tokens[tokens.length - 1];
        if (nextToken.type === TokenType.NEWLINE) {
          break;
        }
      }
      segmentTokens.push(advance());
    }

    let str = "";
    for (let i = 0; i < segmentTokens.length; i++) {
      const t = segmentTokens[i];
      if (i > 0) {
        const prev = segmentTokens[i - 1];
        const spaces = t.column - (prev.column + String(prev.value).length);
        if (spaces > 0) str += " ".repeat(spaces);
      }
      str += String(t.value);
    }

    return AST.RawStyle(str.trim(), line);
  }

  function parseStyleStatement() {
    const styleNode = parseStyleClause();
    match(TokenType.NEWLINE);
    return { type: 'StyleStatement', style: styleNode, line: styleNode.line };
  }


  // ── FunctionDef ───────────────────────────────────────────────────
  // function greet name, age:
  //     ...

  function parseFunctionDef() {
    const funcToken = advance(); // consume FUNCTION
    const line = funcToken.line;

    const nameToken = expectIdentifierLike("a function name after 'function'");
    const name = nameToken.value;

    // Parse optional parameter list (zero or more IDENTIFIER separated by COMMA)
    const params = [];
    if (isIdentifierLike() && !check(TokenType.COLON)) {
      params.push(expectIdentifierLike('a parameter name').value);
      while (match(TokenType.COMMA)) {
        params.push(expectIdentifierLike('a parameter name').value);
      }
    }

    expect(TokenType.COLON, "':' after function parameters");
    const body = parseBlock();

    return AST.FunctionDef(name, params, body, line);
  }

  // ── IfStatement ───────────────────────────────────────────────────
  // if active:
  //     print "yes"
  // otherwise if age > 18:
  //     print "adult"
  // otherwise:
  //     print "no"

  function parseIfStatement() {
    const ifToken = advance(); // consume IF
    const line = ifToken.line;

    const condition = parseExpression();
    expect(TokenType.COLON, "':' after if condition");
    const body = parseBody();

    // Collect otherwise-if clauses
    const elseIfs = [];
    while (check(TokenType.OTHERWISE_IF)) {
      advance(); // consume OTHERWISE_IF
      const elifCondition = parseExpression();
      expect(TokenType.COLON, "':' after otherwise-if condition");
      const elifBody = parseBody();
      elseIfs.push({ condition: elifCondition, body: elifBody });
    }

    // Optional otherwise clause
    let elseBody = null;
    if (check(TokenType.OTHERWISE)) {
      advance(); // consume OTHERWISE
      expect(TokenType.COLON, "':' after otherwise");
      elseBody = parseBody();
    }

    return AST.IfStatement(condition, body, elseIfs, elseBody, line);
  }

  // ── RepeatStatement ───────────────────────────────────────────────
  // repeat 5 times:        → RepeatTimes
  // repeat from 1 to 10:   → RepeatFromTo
  // repeat until done:     → RepeatUntil

  function parseRepeatStatement() {
    const repeatToken = advance(); // consume REPEAT
    const line = repeatToken.line;

    // Decide which repeat variant based on what follows
    if (check(TokenType.FROM)) {
      // repeat from X to Y:
      advance(); // consume FROM
      const from = parseExpression();
      expect(TokenType.TO, "'to' in repeat-from-to");
      const to = parseExpression();
      expect(TokenType.COLON, "':' after repeat range");
      const body = parseBlock();
      return AST.RepeatFromTo(from, to, body, line);
    }

    if (check(TokenType.UNTIL)) {
      // repeat until condition:
      advance(); // consume UNTIL
      const condition = parseExpression();
      expect(TokenType.COLON, "':' after repeat-until condition");
      const body = parseBlock();
      return AST.RepeatUntil(condition, body, line);
    }

    // repeat N times:
    const count = parseExpression();
    expect(TokenType.TIMES, "'times' after repeat count");
    expect(TokenType.COLON, "':' after repeat-times");
    const body = parseBlock();
    return AST.RepeatTimes(count, body, line);
  }

  // ── ForEveryStatement ─────────────────────────────────────────────
  // for every item in list:
  //     print item

  function parseForEveryStatement() {
    const forToken = advance(); // consume FOR_EVERY
    const line = forToken.line;

    const variable = expect(TokenType.IDENTIFIER, "a variable name after 'for every'").value;
    expect(TokenType.IN, "'in' after for-every variable");
    const iterable = parseExpression();
    expect(TokenType.COLON, "':' after for-every iterable");
    const body = parseBlock();

    return AST.ForEvery(variable, iterable, body, line);
  }

  // ── GiveStatement ─────────────────────────────────────────────────
  // give result

  function parseGiveStatement() {
    const giveToken = advance(); // consume GIVE
    const line = giveToken.line;

    const value = parseExpression();
    match(TokenType.NEWLINE); // consume trailing newline if present
    return AST.GiveStatement(value, line);
  }

  // ── PrintStatement ────────────────────────────────────────────────
  // print "Hello, world!"

  function parsePrintStatement() {
    const printToken = advance(); // consume PRINT
    const line = printToken.line;

    const value = parseExpression();
    match(TokenType.NEWLINE); // consume trailing newline if present
    return AST.PrintStatement(value, line);
  }

  // ── Assignment / ExpressionStatement ──────────────────────────────
  // name = "Kartik"              → Assignment
  // person.name = "Kartik"       → Assignment (to member expression)
  // greet "World"                → ExpressionStatement (function call)

  function parseAssignmentOrExpression() {
    const line = peek().line;

    // Try to parse a full left-hand-side expression first
    const expr = parseExpression();

    // Check for assignment: IDENTIFIER = value  or  member.prop = value
    if (check(TokenType.ASSIGN)) {
      advance(); // consume ASSIGN
      const value = parseExpression();
      match(TokenType.NEWLINE);

      // Simple variable assignment
      if (expr.type === 'Identifier') {
        return AST.Assignment(expr.name, value, line);
      }
      // Member assignment: obj.prop = value
      if (expr.type === 'MemberExpression') {
        return AST.Assignment(expr, value, line);
      }

      throw new ParseError(
        'Invalid assignment target',
        line,
        peek().column,
        'You can only assign to variables or object properties.',
      );
    }

    // Not an assignment — it's an expression statement (e.g., bare function call)
    match(TokenType.NEWLINE);
    return AST.ExpressionStatement(expr, line);
  }

  // ── Block / InlineBody ────────────────────────────────────────────
  // A "body" is either an inline single statement or a full indented block.

  /**
   * Parse either an inline body or a block body after a colon.
   * Inline: `if true: print "yes"`  (same line)
   * Block:  newline followed by INDENT ... DEDENT
   */
  function parseBody() {
    // Inline body: next token is NOT a newline → single statement on same line
    if (!check(TokenType.NEWLINE)) {
      return [parseStatement()];
    }
    // Block body
    return parseBlock();
  }

  function parseAsyncHandlers() {
    let handlers = {
      loading: null,
      error: null,
      empty: null,
      success: null,
      successVar: null,
      errorVar: null
    };

    if (match(TokenType.NEWLINE)) {
      expect(TokenType.INDENT, 'indentation for async block');
      while (!check(TokenType.DEDENT) && !check(TokenType.EOF)) {
        skipNewlines();
        if (match(TokenType.LOADING)) {
          expect(TokenType.COLON, "':' after loading");
          handlers.loading = parseBody();
        } else if (match(TokenType.ERROR)) {
          if (check(TokenType.IDENTIFIER)) {
            handlers.errorVar = advance().value;
          }
          expect(TokenType.COLON, "':' after error");
          handlers.error = parseBody();
        } else if (match(TokenType.EMPTY)) {
          expect(TokenType.COLON, "':' after empty");
          handlers.empty = parseBody();
        } else if (match(TokenType.SUCCESS)) {
          if (check(TokenType.IDENTIFIER)) {
            handlers.successVar = advance().value;
          }
          expect(TokenType.COLON, "':' after success");
          handlers.success = parseBody();
        } else {
          throw new ParseError("Expected 'loading:', 'error:', 'empty:', or 'success:' inside async block", peek().line, peek().column);
        }
      }
      expect(TokenType.DEDENT, 'dedent to end async block');
    }
    return handlers;
  }

  /**
   * Parse a full indented block: NEWLINE INDENT Statement+ DEDENT
   */
  function parseBlock() {
    expect(TokenType.NEWLINE, 'a new line before indented block');
    expect(TokenType.INDENT, 'an indented block after ":"');

    const statements = [];
    skipNewlines();

    while (!check(TokenType.DEDENT) && !check(TokenType.EOF)) {
      statements.push(parseStatement());
      skipNewlines();
    }

    if (statements.length === 0) {
      throw new ParseError(
        'Expected at least one statement in block',
        peek().line,
        peek().column,
        'A block after ":" must contain at least one indented statement.',
      );
    }

    expect(TokenType.DEDENT, 'end of indented block');
    return statements;
  }

  // ── Phase 2a: Collection Operations ──────────────────────────────

  // add "Dave" to names
  function parseAddTo() {
    const addToken = advance(); // consume ADD
    const line = addToken.line;
    const value = parseExpression();
    expect(TokenType.TO, "'to' after value in 'add ... to'");
    const target = parseExpression();
    match(TokenType.NEWLINE);
    return AST.AddTo(value, target, line);
  }

  // remove "Bob" from names
  function parseRemoveFrom() {
    const removeToken = advance(); // consume REMOVE
    const line = removeToken.line;
    const value = parseExpression();
    expect(TokenType.FROM, "'from' after value in 'remove ... from'");
    const target = parseExpression();
    match(TokenType.NEWLINE);
    return AST.RemoveFrom(value, target, line);
  }

  // check if "Alice" in names
  function parseCheckIn() {
    const checkToken = advance(); // consume CHECK
    const line = checkToken.line;
    expect(TokenType.IF, "'if' after 'check'");
    const value = parseExpression();
    expect(TokenType.IN, "'in' after value in 'check if ... in'");
    const collection = parseExpression();
    match(TokenType.NEWLINE);
    return AST.CheckIn(value, collection, line);
  }

  // ── Phase 2b: UI Parsing ────────────────────────────────────────
  
  function parseLayoutBlock(layoutType) {
    const token = advance(); // consume layout keyword
    const line = token.line;
    let gridCount = null;

    if (layoutType === 'grid') {
      if (check(TokenType.AUTO)) {
        advance();
        gridCount = 'auto';
      } else {
        const countToken = expect(TokenType.NUMBER, 'number of columns or "auto" for grid');
        gridCount = parseInt(countToken.value, 10);
      }
    }

    let style = null;
    if (check(TokenType.STYLED)) {
      style = parseStyleClause();
    }

    expect(TokenType.COLON, `':' after ${layoutType} declaration`);
    const body = parseBlock();

    return AST.LayoutBlock(layoutType, gridCount, style, body, line);
  }

  // page home:
  //     show "Welcome"
  function parseFormBlock() {
    const token = advance(); // consume FORM
    const line = token.line;
    let style = null;
    if (check(TokenType.AS) || check(TokenType.STYLED)) {
      style = parseStyleClause();
    }
    expect(TokenType.COLON, "':' after 'form'");
    const body = parseBlock();
    let node = AST.FormBlock(body, line);
    node.style = style;
    return node;
  }

  function parsePageDef() {
    const pageToken = advance(); // consume PAGE
    const line = pageToken.line;
    const nameToken = expectIdentifierLike("a page name after 'page'");
    
    const params = [];
    if (match(TokenType.LPAREN)) {
      if (!check(TokenType.RPAREN)) {
        do {
          const paramName = expectIdentifierLike("a parameter name").value;
          params.push({ name: paramName });
        } while (match(TokenType.COMMA));
      }
      expect(TokenType.RPAREN, "')' after page parameters");
    }
    
    expect(TokenType.COLON, "':' after page name");
    const body = parseBlock();
    return AST.PageDef(nameToken.value, body, line, params);
  }

  // show "text"
  // show variable
  // show variable as title
  // show all products
  // show all products as list
  // show ComponentName for each item in items
  function parseShowStatement(implicit = false) {
    // `implicit` = shorthand without the word `show`:  Card:  /  Card with title="Hi":
    const showToken = implicit ? peek() : advance(); // consume SHOW
    const line = showToken.line;

    if (match(TokenType.TOAST)) {
      const msg = parseExpression();
      let variant = 'default';
      if (match(TokenType.AS)) {
        const variantToken = expectIdentifierLike("a variant name after 'as'");
        variant = variantToken.value;
      }
      return AST.ShowToastStatement(msg, variant, line);
    }

    if (match(TokenType.MODAL)) {
      const msg = parseExpression();
      return AST.ShowModalStatement(msg, line);
    }

    // show all products [as list/grid/table]
    if (check(TokenType.ALL)) {
      advance(); // consume ALL
      const collection = parseExpression();
      let layoutHint = null;
      if (check(TokenType.AS)) {
        advance(); // consume AS
        layoutHint = expectIdentifierLike("a layout hint after 'as' (list, grid, table)").value;
      }
      match(TokenType.NEWLINE);
      return AST.ShowAll(collection, null, layoutHint, line);
    }

    // show ComponentName for each item in collection
    // Check: IDENTIFIER IDENTIFIER(for) IDENTIFIER(each) IDENTIFIER IN IDENTIFIER
    // We need to peek carefully
    if (check(TokenType.IDENTIFIER) || KEYWORD_TYPES_USABLE_AS_NAMES.has(peek().type)) {
      const savedPos = pos;
      const nameToken = advance();
      if (check(TokenType.FOR)) {
        advance(); // consume FOR
        if (check(TokenType.EACH)) {
          advance(); // consume EACH
          const variable = expectIdentifierLike("a variable name after 'each'").value;
          expect(TokenType.IN, "'in' after variable in 'show X for each Y in Z'");
          const collection = parseExpression();
          match(TokenType.NEWLINE);
          return AST.ShowForEach(nameToken.value, variable, collection, line);
        }
        // Not "for each" — backtrack
        pos = savedPos;
      } else {
        pos = savedPos;
      }
    }

    // show value [as hint]
    const value = parseExpression();
    
    // Phase 11b: Props parsing
    let props = [];
    if (match(TokenType.WITH)) {
      do {
        const propNameToken = expectIdentifierLike("a prop name after 'with' or ','");
        expect(TokenType.ASSIGN, "'=' after prop name");
        const propValue = parseExpression();
        
        if (props.find(p => p.name === propNameToken.value)) {
            throw new ParseError(`Duplicate prop '${propNameToken.value}' passed to component`, propNameToken.line, propNameToken.column);
        }
        
        props.push({ name: propNameToken.value, value: propValue });
      } while (match(TokenType.COMMA));
    }
    
    let hint = null;
    if (check(TokenType.AS)) {
      advance(); // consume AS
      hint = expectIdentifierLike("a display hint after 'as' (title, subtitle, text, image, label, badge)").value;
    }
    
    let style = null;
    if (check(TokenType.STYLED)) {
      style = parseStyleClause();
    }
    
    let body = null;
    if (match(TokenType.COLON)) {
      body = parseBlock();
    } else {
      match(TokenType.NEWLINE);
    }
    
    const node = AST.ShowStatement(value, hint, body, line, props);
    node.style = style;
    return node;
  }

  // button "Click me":
  //     do something
  function parseButtonStatement() {
    const btnToken = advance(); // consume BUTTON
    const line = btnToken.line;
    const label = parseExpression();
    
    let variant = null;
    if (check(TokenType.AS)) {
      advance(); // consume AS
      const token = advance();
      variant = token.value !== undefined && token.value !== null ? token.value : token.type.toLowerCase();
    }
    
    let style = null;
    if (check(TokenType.STYLED)) {
      style = parseStyleClause();
    }
    
    let body = [];
    if (match(TokenType.COLON)) {
      body = parseBody();
    } else {
      match(TokenType.NEWLINE);
    }
    const node = AST.ButtonStatement(label, body, line);
    node.style = style;
    node.variant = variant;
    return node;
  }

  // component ProductCard for product:
  //     show product.name
  function parseComponentDef() {
    const compToken = advance(); // consume COMPONENT
    const line = compToken.line;
    const nameToken = expectIdentifierLike("a component name after 'component'");
    
    let forVars = [];
    if (check(TokenType.FOR)) {
      advance(); // consume FOR
      do {
        const forVarToken = expectIdentifierLike("a variable name after 'for' or ','");
        forVars.push(forVarToken.value);
      } while (match(TokenType.COMMA));
    }

    let takes = [];
    if (check(TokenType.TAKES)) {
      advance(); // consume TAKES
      do {
        const takeVarToken = expectIdentifierLike("a prop name after 'takes' or ','");
        if (takeVarToken.value === 'children') {
            throw new ParseError(`'children' is a reserved prop name`, takeVarToken.line, takeVarToken.column);
        }
        if (forVars.includes(takeVarToken.value)) {
            throw new ParseError(`Duplicate prop name '${takeVarToken.value}' (already defined in 'for')`, takeVarToken.line, takeVarToken.column);
        }
        if (takes.includes(takeVarToken.value)) {
            throw new ParseError(`Duplicate prop name '${takeVarToken.value}' in 'takes'`, takeVarToken.line, takeVarToken.column);
        }
        takes.push(takeVarToken.value);
      } while (match(TokenType.COMMA));
    }

    expect(TokenType.COLON, "':' after component definition");
    const body = parseBlock();
    return AST.ComponentDef(nameToken.value, forVars.length > 0 ? forVars : null, takes.length > 0 ? takes : null, body, line);
  }

  function parseValidationRule() {
    const token = advance();
    let type = null;
    let value = null;
    
    if (token.type === TokenType.REQUIRED) type = 'required';
    else if (token.type === TokenType.EMAIL) type = 'email';
    else if (token.type === TokenType.MIN) {
      type = 'min';
      value = parseExpression();
    } else if (token.type === TokenType.MAX) {
      type = 'max';
      value = parseExpression();
    } else if (token.type === TokenType.MATCH) {
      type = 'match';
      value = parseExpression();
    } else {
      throw new ParseError(`Unknown validation rule '${token.value}'`, token.line, token.column);
    }
    match(TokenType.NEWLINE);
    return AST.ValidationRule(type, value, token.line);
  }

  function parseInputStatement() {
    const inputToken = advance(); // consume INPUT
    const placeholder = parseExpression(); // "Enter name"
    
    expect(TokenType.INTO, "'into' after input placeholder");
    
    const variableToken = expectIdentifierLike("a variable name after 'into'");
    const variable = variableToken.value;
    
    let style = null;
    if (check(TokenType.AS) || check(TokenType.STYLED)) {
      style = parseStyleClause();
    }

    let validations = [];
    if (match(TokenType.COLON)) {
      match(TokenType.NEWLINE);
      expect(TokenType.INDENT, "indentation after ':' in input");
      while (!check(TokenType.EOF) && !check(TokenType.DEDENT)) {
        if (match(TokenType.NEWLINE)) continue;
        validations.push(parseValidationRule());
      }
      expect(TokenType.DEDENT, "dedent after input validations block");
    } else {
      match(TokenType.NEWLINE);
    }

    let stmt = AST.InputStatement(placeholder, variable, validations, inputToken.line);
    stmt.style = style;
    return stmt;
  }

  // when count changes:
  //     print "Count changed!"
  function parseWhenChanges() {
    const whenToken = advance(); // consume WHEN
    const line = whenToken.line;
    const varToken = expectIdentifierLike("a variable name after 'when'");
    expect(TokenType.CHANGES, "'changes' after variable in 'when X changes'");
    expect(TokenType.COLON, "':' after 'when X changes'");
    const body = parseBlock();
    return AST.WhenChanges(varToken.value, body, line);
  }

  // go to home
  // go to product(product.id)
  // go to store(store.id, product.id)
  function parseGoTo() {
    const goToken = advance(); // consume GO
    const line = goToken.line;
    expect(TokenType.TO, "'to' after 'go'");
    const targetToken = expectIdentifierLike("a page name after 'go to'");
    
    const args = [];
    if (match(TokenType.LPAREN)) {
      if (!check(TokenType.RPAREN)) {
        do {
          args.push(parseExpression());
        } while (match(TokenType.COMMA));
      }
      expect(TokenType.RPAREN, "')' after route arguments");
    }
    
    match(TokenType.NEWLINE);
    return AST.GoTo(targetToken.value, args, line);
  }

  // link "Home" to home
  // link "View" to product(123)
  // link "Store" to store(store.id, product.id)
  function parseLinkStatement() {
    const linkToken = advance(); // consume LINK
    const line = linkToken.line;
    const label = parseExpression();
    expect(TokenType.TO, "'to' after link label");
    let target = '';
    if (check(TokenType.STRING)) {
      target = advance().value;
    } else {
      const targetToken = expectIdentifierLike("a page name after 'to'");
      target = targetToken.value;
    }
    
    const args = [];
    if (match(TokenType.LPAREN)) {
      if (!check(TokenType.RPAREN)) {
        do {
          args.push(parseExpression());
        } while (match(TokenType.COMMA));
      }
      expect(TokenType.RPAREN, "')' after route arguments");
    }
    
    let style = null;
    if (check(TokenType.STYLED)) {
      style = parseStyleClause();
    }
    
    if (!check(TokenType.EOF)) match(TokenType.NEWLINE);
    const node = AST.LinkStatement(label, target, args, line);
    node.style = style;
    return node;
  }

  function parseImageStatement() {
    const token = advance(); // consume IMAGE
    const line = token.line;
    const urlExpr = parseExpression();
    
    let style = null;
    if (check(TokenType.STYLED)) {
      style = parseStyleClause();
    }
    
    match(TokenType.NEWLINE);
    const node = AST.ImageStatement(urlExpr, line);
    node.style = style;
    return node;
  }

  function parseVideoStatement() {
    const token = advance(); // consume VIDEO
    const line = token.line;
    const urlExpr = parseExpression();
    
    let style = null;
    if (check(TokenType.STYLED)) {
      style = parseStyleClause();
    }
    
    match(TokenType.NEWLINE);
    const node = AST.VideoStatement(urlExpr, line);
    node.style = style;
    return node;
  }

  function parseFetchStatement() {
    const token = advance(); // consume FETCH
    const line = token.line;
    const urlExpr = parseExpression();
    expect(TokenType.INTO, "'into' after fetch URL");
    const varToken = expectIdentifierLike("a variable name after 'into'");
    let handlers = { loading: null, error: null, empty: null, success: null };
    if (match(TokenType.COLON)) {
      handlers = parseAsyncHandlers();
    } else {
      match(TokenType.NEWLINE);
    }
    return AST.FetchStatement(urlExpr, varToken.value, handlers.loading, handlers.errorVar, handlers.error, handlers.empty, handlers.successVar, handlers.success, line);
  }

  function parseSubmitStatement() {
    const token = advance(); // consume SUBMIT
    const line = token.line;
    const firstExpr = parseExpression();
    
    let style = null;
    if (check(TokenType.AS) || check(TokenType.STYLED)) {
      style = parseStyleClause();
    }

    let isFormSubmit = false;
    if (check(TokenType.COLON)) {
      // Peek ahead to see if the block contains `success:` or `error:`
      let ptr = pos;
      if (tokens[ptr].type === TokenType.COLON) ptr++;
      while (ptr < tokens.length && tokens[ptr].type === TokenType.NEWLINE) ptr++;
      if (ptr < tokens.length && tokens[ptr].type === TokenType.INDENT) ptr++;
      
      if (ptr < tokens.length && tokens[ptr].type === TokenType.IDENTIFIER) {
        const val = tokens[ptr].value;
        if (val !== 'success' && val !== 'error') {
          isFormSubmit = true; // Block starts with normal statements
        }
      } else {
        isFormSubmit = true; // Block starts with something else
      }
    }

    if (isFormSubmit) {
      expect(TokenType.COLON, "':' after submit label");
      const body = parseBlock();
      let stmt = AST.FormSubmit(firstExpr, body, line);
      stmt.style = style;
      return stmt;
    }

    let payload = null;
    if (check(TokenType.WITH)) {
      advance();
      payload = parseExpression();
    }
    let handlers = { successVar: null, success: null, errorVar: null, error: null };
    if (match(TokenType.COLON)) {
      handlers = parseAsyncHandlers();
    } else {
      match(TokenType.NEWLINE);
    }
    return AST.SubmitStatement(firstExpr, payload, handlers.successVar, handlers.success, handlers.errorVar, handlers.error, line);
  }

  function parseUpdateDataStatement() {
    const token = advance(); // consume UPDATE_DATA
    const line = token.line;
    const urlExpr = parseExpression();
    let payload = null;
    if (check(TokenType.WITH)) {
      advance();
      payload = parseExpression();
    }
    let handlers = { successVar: null, success: null, errorVar: null, error: null };
    if (match(TokenType.COLON)) {
      handlers = parseAsyncHandlers();
    } else {
      match(TokenType.NEWLINE);
    }
    return AST.UpdateDataStatement(urlExpr, payload, handlers.successVar, handlers.success, handlers.errorVar, handlers.error, line);
  }

  function parseDeleteDataStatement() {
    const token = advance(); // consume DELETE_DATA
    const line = token.line;
    const urlExpr = parseExpression();
    let handlers = { successVar: null, success: null, errorVar: null, error: null };
    if (match(TokenType.COLON)) {
      handlers = parseAsyncHandlers();
    } else {
      match(TokenType.NEWLINE);
    }
    return AST.DeleteDataStatement(urlExpr, handlers.successVar, handlers.success, handlers.errorVar, handlers.error, line);
  }

  function parseUseStatement() {
    const useToken = advance(); // consume USE
    const line = useToken.line;
    // The target could be a glob like pages/* or an identifier like ProductCard
    // Because '*' and '/' are operators, we might need to capture until NEWLINE
    // Actually, `pages/*` would be parsed as identifiers and stars.
    // Let's just capture all text until NEWLINE to be safe.
    const segmentTokens = [];
    while (!check(TokenType.NEWLINE) && !check(TokenType.EOF)) {
      segmentTokens.push(advance());
    }
    
    let target = "";
    for (let i = 0; i < segmentTokens.length; i++) {
      const t = segmentTokens[i];
      if (i > 0) {
        const prev = segmentTokens[i - 1];
        const spaces = t.column - (prev.column + String(prev.value).length);
        if (spaces > 0) target += " ".repeat(spaces);
      }
      target += String(t.value);
    }
    
    if (!check(TokenType.EOF)) match(TokenType.NEWLINE);
    return AST.UseStatement(target.trim(), line);
  }

  // ── Phase 2c: State Parsing ──────────────────────────────────────

  // store count = 0
  function parseStoreDeclaration() {
    const storeToken = advance(); // consume STORE
    const line = storeToken.line;
    const nameToken = expectIdentifierLike("a variable name after 'store'");
    expect(TokenType.ASSIGN, "'=' after store variable name");
    const value = parseExpression();
    match(TokenType.NEWLINE);
    return AST.StoreDeclaration(nameToken.value, value, line);
  }

  // global store cart = [] persist
  function parseGlobalStoreDeclaration() {
    const globalToken = advance(); // consume GLOBAL
    const line = globalToken.line;
    expect(TokenType.STORE, "'store' after 'global'");
    const nameToken = expectIdentifierLike("a variable name after 'global store'");
    expect(TokenType.ASSIGN, "'=' after global store variable name");
    const value = parseExpression();
    let persist = false;
    if (match(TokenType.PERSIST)) {
      persist = true;
    }
    match(TokenType.NEWLINE);
    return AST.GlobalStoreDeclaration(nameToken.value, value, persist, line);
  }

  // clear cart
  function parseClearStatement() {
    const clearToken = advance(); // consume CLEAR
    const line = clearToken.line;
    const nameToken = expectIdentifierLike("a variable name after 'clear'");
    match(TokenType.NEWLINE);
    return AST.ClearStatement(nameToken.value, line);
  }

  // remember username = ""
  function parseRememberDeclaration() {
    const rememberToken = advance(); // consume REMEMBER
    const line = rememberToken.line;
    const nameToken = expectIdentifierLike("a variable name after 'remember'");
    expect(TokenType.ASSIGN, "'=' after remember variable name");
    const value = parseExpression();
    match(TokenType.NEWLINE);
    return AST.RememberDeclaration(nameToken.value, value, line);
  }

  // forget username
  function parseForgetStatement() {
    const forgetToken = advance(); // consume FORGET
    const line = forgetToken.line;
    const nameToken = expectIdentifierLike("a variable name after 'forget'");
    match(TokenType.NEWLINE);
    return AST.ForgetStatement(nameToken.value, line);
  }

  // ── Phase 3: Actions ─────────────────────────────────────────────

  // action createProduct(productId, name):
  function parseActionDef() {
    const actionToken = advance(); // ACTION
    const nameToken = expectIdentifierLike("an action name");
    
    const params = [];
    if (check(TokenType.LPAREN)) {
      advance(); // consume (
      if (!check(TokenType.RPAREN)) {
        params.push(expectIdentifierLike("parameter name").value);
        while (check(TokenType.COMMA)) {
          advance();
          params.push(expectIdentifierLike("parameter name").value);
        }
      }
      expect(TokenType.RPAREN, "closing ')' after parameters");
    } else {
      // Allow space separated parameters until colon
      while (!check(TokenType.COLON) && !check(TokenType.EOF) && !check(TokenType.NEWLINE)) {
        params.push(expectIdentifierLike("parameter name").value);
      }
    }

    expect(TokenType.COLON, "':' after action definition");
    const body = parseBody();
    return AST.ActionDef(nameToken.value, params, body, actionToken.line);
  }

  // run createProduct(id, name)
  function parseRunExpression(runToken) {
    const nameToken = expectIdentifierLike("an action name");
    
    const args = [];
    if (check(TokenType.LPAREN)) {
      advance(); // consume (
      if (!check(TokenType.RPAREN)) {
        args.push(parseExpression());
        while (check(TokenType.COMMA)) {
          advance();
          args.push(parseExpression());
        }
      }
      expect(TokenType.RPAREN, "closing ')' after arguments");
    }
    
    return AST.RunExpression(nameToken.value, args, runToken.line);
  }
  // ── Phase 4: Auth ────────────────────────────────────────────────
  function parseLoginStatement() {
    const loginToken = advance(); // LOGIN
    const url = parseExpression();
    
    // Skip newlines if the user put `with` on the next line
    skipNewlines();
    expect(TokenType.WITH, "'with' after login url");
    const data = parseExpression();
    match(TokenType.NEWLINE);
    return AST.LoginStatement(url, data, loginToken.line);
  }

  function parseLogoutStatement() {
    const logoutToken = advance(); // LOGOUT
    match(TokenType.NEWLINE);
    return AST.LogoutStatement(logoutToken.line);
  }

  // ─────────────────────────────────────────────────────────────────
  // EXPRESSION PARSING — Precedence climbing
  // ─────────────────────────────────────────────────────────────────

  /** Top-level expression: starts with LogicalOr. */
  function parseExpression() {
    return parseLogicalOr();
  }

  /** LogicalOr → LogicalAnd (OR LogicalAnd)* */
  function parseLogicalOr() {
    let left = parseLogicalAnd();

    while (check(TokenType.OR)) {
      const op = advance();
      const right = parseLogicalAnd();
      left = AST.BinaryExpression('or', left, right, op.line);
    }

    return left;
  }

  /** LogicalAnd → Equality (AND Equality)* */
  function parseLogicalAnd() {
    let left = parseEquality();

    while (check(TokenType.AND)) {
      const op = advance();
      const right = parseEquality();
      left = AST.BinaryExpression('and', left, right, op.line);
    }

    return left;
  }

  /** Equality → Comparison ((DOUBLE_EQUALS | NOT_EQUALS) Comparison)? */
  function parseEquality() {
    let left = parseComparison();

    if (check(TokenType.DOUBLE_EQUALS, TokenType.NOT_EQUALS)) {
      const op = advance();
      const right = parseComparison();
      left = AST.BinaryExpression(op.value, left, right, op.line);
    }

    return left;
  }

  /** Comparison → Addition ((GT | LT | GTE | LTE) Addition)? */
  function parseComparison() {
    let left = parseAddition();

    if (check(TokenType.GT, TokenType.LT, TokenType.GTE, TokenType.LTE)) {
      const op = advance();
      const right = parseAddition();
      left = AST.BinaryExpression(op.value, left, right, op.line);
    }

    return left;
  }

  /** Addition → Multiplication ((PLUS | MINUS) Multiplication)* */
  function parseAddition() {
    let left = parseMultiplication();

    while (check(TokenType.PLUS, TokenType.MINUS)) {
      const op = advance();
      const right = parseMultiplication();
      left = AST.BinaryExpression(op.value, left, right, op.line);
    }

    return left;
  }

  /** Multiplication → Unary ((STAR | SLASH | MODULO) Unary)* */
  function parseMultiplication() {
    let left = parseUnary();

    while (check(TokenType.STAR, TokenType.SLASH, TokenType.MODULO)) {
      const op = advance();
      const right = parseUnary();
      left = AST.BinaryExpression(op.value, left, right, op.line);
    }

    return left;
  }

  /** Unary → (NOT | MINUS) Unary | MemberOrCall */
  function parseUnary() {
    if (check(TokenType.NOT)) {
      const op = advance();
      const operand = parseUnary();
      return AST.UnaryExpression('not', operand, op.line);
    }
    if (check(TokenType.MINUS)) {
      const op = advance();
      const operand = parseUnary();
      return AST.UnaryExpression('-', operand, op.line);
    }
    return parseMemberOrCall();
  }

  /** MemberOrCall → Primary (DOT IDENTIFIER)* */
  function parseMemberOrCall() {
    let object = parsePrimary();

    const touching = () => {
      const prev = tokens[pos - 1];
      return prev && peek().line === prev.line && peek().column === prev.column + String(prev.value).length;
    };

    while (check(TokenType.DOT) || (check(TokenType.LBRACKET) && touching())) {
      if (check(TokenType.LBRACKET)) {
        const bracket = advance(); // consume [
        const index = parseExpression();
        expect(TokenType.RBRACKET, "']' to close the position");
        object = AST.IndexExpression(object, index, bracket.line);
        continue;
      }
      advance(); // consume DOT
      const prop = expectIdentifierLike('a property name after "."');
      object = AST.MemberExpression(object, prop.value, prop.line);

      // Call on a member with parentheses, no space:  helpers.money(5, 2)
      const open = peek();
      const closeEnough = tokens[pos - 1] && open.line === tokens[pos - 1].line &&
        open.column === tokens[pos - 1].column + String(tokens[pos - 1].value).length;
      if (check(TokenType.LPAREN) && closeEnough) {
        advance(); // consume (
        const args = [];
        if (!check(TokenType.RPAREN)) {
          args.push(parseExpression());
          while (match(TokenType.COMMA)) args.push(parseExpression());
        }
        expect(TokenType.RPAREN, "')' to close the call");
        object = AST.CallExpression(object, args, prop.line);
      }
    }

    // Check for postfix collection operations: X filtered by ..., X sorted by ...
    while (check(TokenType.FILTERED, TokenType.SORTED)) {
      if (check(TokenType.FILTERED)) {
        advance(); // consume FILTERED
        expect(TokenType.BY, "'by' after 'filtered'");
        // filtered by needs an iterator variable and condition
        // Simple form: items filtered by name == "X"  → items.filter(item => item.name === "X")
        // For now, parse the condition as a full expression
        // The variable is auto-named based on the collection (singular form)
        // optional name for each item:  users filtered by user: user.age >= 18
        let itemName = null;
        if (isIdentifierLike() && tokens[pos + 1] && tokens[pos + 1].type === TokenType.COLON) {
          itemName = advance().value;
          advance(); // ':'
        }
        const condition = parseExpression();
        object = AST.FilteredBy(object, itemName, condition, peek().line);
      } else if (check(TokenType.SORTED)) {
        advance(); // consume SORTED
        expect(TokenType.BY, "'by' after 'sorted'");
        const field = expectIdentifierLike("a field name after 'sorted by'").value;
        object = AST.SortedBy(object, field, peek().line);
      }
    }

    return object;
  }

  // ── Primary ───────────────────────────────────────────────────────

  function parsePrimary() {
    const token = peek();

    if (match(TokenType.RUN)) {
      return parseRunExpression(tokens[pos - 1]);
    }

    // Number literal
    if (token.type === TokenType.NUMBER) {
      advance();
      return AST.NumberLiteral(token.value, token.line);
    }

    // Plain string literal
    if (token.type === TokenType.STRING) {
      advance();
      return AST.StringLiteral(token.value, token.line);
    }

    // Boolean literals
    if (token.type === TokenType.TRUE) {
      advance();
      return AST.BooleanLiteral(true, token.line);
    }
    if (token.type === TokenType.FALSE) {
      advance();
      return AST.BooleanLiteral(false, token.line);
    }

    // Phase 4: Auth
    if (token.type === TokenType.LOGGED_IN) {
      advance();
      return AST.LoggedInExpression(token.line);
    }

    // Interpolated string: STRING_START expr (STRING_MIDDLE expr)* STRING_END
    if (token.type === TokenType.STRING_START) {
      return parseInterpolatedString();
    }

    // Array literal: [expr, expr, ...]
    if (token.type === TokenType.LBRACKET) {
      return parseArrayLiteral();
    }

    // Object literal: {key: value, key: value}
    if (token.type === TokenType.LBRACE) {
      return parseObjectLiteral();
    }

    // Parenthesized expression: (expr)
    if (token.type === TokenType.LPAREN) {
      advance(); // consume LPAREN
      const expr = parseExpression();
      expect(TokenType.RPAREN, "closing ')'");
      return expr;
    }

    if (token.type === TokenType.RUN) {
      return parseRunStatement();
    }

    // count of list → CountOf expression
    if (token.type === TokenType.COUNT) {
      const savedPos = pos;
      advance();
      if (check(TokenType.OF)) {
        advance();
        const collection = parseMemberOrCall();
        return AST.CountOf(collection, token.line);
      }
      pos = savedPos;
    }

    // first of list → FirstOf expression
    if (token.type === TokenType.FIRST) {
      const savedPos = pos;
      advance();
      if (check(TokenType.OF)) {
        advance();
        const collection = parseMemberOrCall();
        return AST.FirstOf(collection, token.line);
      }
      pos = savedPos;
    }

    // last of list → LastOf expression
    if (token.type === TokenType.LAST) {
      const savedPos = pos;
      advance();
      if (check(TokenType.OF)) {
        advance();
        const collection = parseMemberOrCall();
        return AST.LastOf(collection, token.line);
      }
      pos = savedPos;
    }

    // check if X in Y → CheckIn expression
    if (token.type === TokenType.CHECK) {
      const savedPos = pos;
      advance();
      if (check(TokenType.IF)) {
        advance();
        const value = parseComparison();
        expect(TokenType.IN, "'in' after 'check if ...'");
        const collection = parseExpression();
        return AST.CheckIn(value, collection, token.line);
      }
      pos = savedPos;
    }

    // Identifier — could be a variable reference or a function call
    if (token.type === TokenType.IDENTIFIER || KEYWORD_TYPES_USABLE_AS_NAMES.has(token.type)) {
      return parseIdentifierOrFunctionCall();
    }

    // Nothing matched — unexpected token
    throw new ParseError(
      `Unexpected token '${token.value}'`,
      token.line,
      token.column,
      'Expected an expression (number, string, variable, etc.).',
    );
  }

  // ── Interpolated String ───────────────────────────────────────────
  // STRING_START expr (STRING_MIDDLE expr)* STRING_END

  function parseInterpolatedString() {
    const startToken = advance(); // consume STRING_START
    const line = startToken.line;
    const parts = [];

    // Add the leading string part (may be empty string "")
    parts.push(AST.StringLiteral(startToken.value, line));

    // Parse the first interpolated expression
    parts.push(parseExpression());

    // Parse middle segments: STRING_MIDDLE + expression
    while (check(TokenType.STRING_MIDDLE)) {
      const mid = advance();
      parts.push(AST.StringLiteral(mid.value, mid.line));
      parts.push(parseExpression());
    }

    // Closing segment
    const endToken = expect(TokenType.STRING_END, 'closing string interpolation');
    parts.push(AST.StringLiteral(endToken.value, endToken.line));

    return AST.InterpolatedString(parts, line);
  }

  // ── Array Literal ─────────────────────────────────────────────────
  // [1, 2, 3]

  function parseArrayLiteral() {
    const bracketToken = advance(); // consume LBRACKET
    const line = bracketToken.line;
    const elements = [];

    skipWhitespaceTokens();
    if (!check(TokenType.RBRACKET)) {
      elements.push(parseExpression());
      skipWhitespaceTokens();
      while (match(TokenType.COMMA)) {
        skipWhitespaceTokens();
        elements.push(parseExpression());
        skipWhitespaceTokens();
      }
    }

    expect(TokenType.RBRACKET, "closing ']'");
    return AST.ArrayLiteral(elements, line);
  }

  // ── Object Literal ────────────────────────────────────────────────
  // {name: "Kartik", age: 22}

  function parseObjectLiteral() {
    const braceToken = advance(); // consume LBRACE
    const line = braceToken.line;
    const properties = [];

    skipWhitespaceTokens();
    if (!check(TokenType.RBRACE)) {
      // Parse first property
      const key = expectIdentifierLike('a property name').value;
      expect(TokenType.COLON, "':' after property name");
      skipWhitespaceTokens();
      const value = parseExpression();
      properties.push({ key, value });
      skipWhitespaceTokens();

      while (match(TokenType.COMMA)) {
        skipWhitespaceTokens();
        const nextKey = expectIdentifierLike('a property name').value;
        expect(TokenType.COLON, "':' after property name");
        skipWhitespaceTokens();
        const nextValue = parseExpression();
        properties.push({ key: nextKey, value: nextValue });
        skipWhitespaceTokens();
      }
    }

    expect(TokenType.RBRACE, "closing '}'");
    return AST.ObjectLiteral(properties, line);
  }

  // ── Identifier or Function Call ───────────────────────────────────
  // Determines whether a bare IDENTIFIER is a variable reference or a
  // function call by peeking at the next token.
  //
  // Function call:  `greet "World"`  — IDENTIFIER followed by a value
  //                 `add 5 and 10`   — two args separated by AND
  //                 `clamp 1, 0, 10` — three+ args separated by commas
  //
  // Variable ref:   `name`           — followed by NEWLINE, operator, etc.

  function parseIdentifierOrFunctionCall() {
    const nameToken = advance(); // consume IDENTIFIER
    const name = nameToken.value;
    const line = nameToken.line;

    const next = peek();

    // To be a function call, the next token must:
    //   1. Be a value-starting token
    //   2. Be on the SAME LINE as the identifier
    const isSameLine = next.line === line;
    // `items[0]`: a bracket right after the name means "item at", not a call with a list argument
    const bracketIndex = next.type === TokenType.LBRACKET && isSameLine &&
      next.column === nameToken.column + String(name).length;
    const isCallable = VALUE_STARTERS.has(next.type) && isSameLine && !bracketIndex;

    if (!isCallable) {
      // It's just a variable reference
      return AST.Identifier(name, line);
    }

    // ── Parse function call arguments ─────────────────────────────
    const args = [];

    // Parse the first argument at the Comparison level so we don't
    // accidentally consume AND (which separates 2-arg calls) or
    // logical operators that belong to an outer expression.
    args.push(parseComparison());

    if (check(TokenType.AND) && peek().line === line) {
      // Two-arg call: `add 5 and 10`
      advance(); // consume AND
      args.push(parseComparison());
    } else {
      // Multi-arg call: `clamp 150, 0, 100`
      while (check(TokenType.COMMA) && peek().line === line) {
        advance(); // consume COMMA
        args.push(parseComparison());
      }
    }

    return AST.FunctionCall(name, args, line);
  }

  // ── Phase 14: Global Design System ──────────────────────────────
  function parseDesignSystemDef() {
    const dsToken = advance(); // consume DESIGN_SYSTEM
    const line = dsToken.line;
    expect(TokenType.COLON, "':' after 'design system'");
    expect(TokenType.NEWLINE, "a new line before design system block");
    const config = parseThemeConfig();
    
    // Validation
    const allowedTopLevel = ['colors', 'typography', 'components', 'themes'];
    for (const key of Object.keys(config)) {
      if (!allowedTopLevel.includes(key)) {
        throw new ParseError(
          `Unknown design system key '${key}'`,
          line, null,
          `Did you mean one of: ${allowedTopLevel.join(', ')}?`
        );
      }
    }
    
    return AST.DesignSystemDef(config, line);
  }

  function parseThemeConfig() {
    if (!match(TokenType.INDENT)) {
      throw new ParseError("Expected indentation for design system block", tokens[pos - 1].line);
    }
    const config = {};
    
    while (!check(TokenType.DEDENT) && !check(TokenType.EOF)) {
      if (match(TokenType.NEWLINE)) continue;
      
      let key = advance().value;
      while (!check(TokenType.COLON) && !check(TokenType.NEWLINE) && !check(TokenType.EOF)) {
        const t = advance();
        key += " " + (t.value !== undefined ? t.value : t.type);
      }
      key = key.trim();
      expect(TokenType.COLON, "':' after configuration key");
      
      if (check(TokenType.NEWLINE)) {
        match(TokenType.NEWLINE);
        config[key] = parseThemeConfig();
      } else {
        if (check(TokenType.STRING) || check(TokenType.NUMBER)) {
          config[key] = advance().value;
          match(TokenType.NEWLINE);
        } else {
          throw new ParseError("Design system values must be wrapped in quotes (e.g. \\\"bg-primary\\\")", tokens[pos - 1].line);
        }
      }
    }
    
    expect(TokenType.DEDENT, "dedentation to end design system configuration");
    return config;
  }

  // ── Named Styles ──────────────────────────────────────────────────
  //   styles:
  //       card: flex flex-col rounded-2xl border
  //       product-card: card hover:shadow-xl      (styles can use other styles)

  function joinTokensByColumn(list) {
    let out = '';
    for (let i = 0; i < list.length; i++) {
      const t = list[i];
      if (i > 0) {
        const prev = list[i - 1];
        const spaces = t.column - (prev.column + String(prev.value).length);
        if (spaces > 0) out += ' '.repeat(spaces);
      }
      out += String(t.value);
    }
    return out.trim();
  }

  function parseStylesDef() {
    const startToken = advance(); // 'styles'
    const line = startToken.line;
    expect(TokenType.COLON, "':' after 'styles'");
    expect(TokenType.NEWLINE, "a new line after 'styles:'");
    if (!match(TokenType.INDENT)) {
      throw new ParseError("Expected indented style definitions under 'styles:'", line, null,
        "Example:\n    styles:\n        card: flex flex-col rounded-2xl");
    }

    const styles = {};
    while (!check(TokenType.DEDENT) && !check(TokenType.EOF)) {
      if (match(TokenType.NEWLINE)) continue;

      const nameTokens = [];
      const nameLine = peek().line;
      while (!check(TokenType.COLON) && !check(TokenType.NEWLINE) && !check(TokenType.EOF)) {
        nameTokens.push(advance());
      }
      const name = joinTokensByColumn(nameTokens);
      if (!/^[A-Za-z_][A-Za-z0-9_-]*$/.test(name)) {
        throw new ParseError(`Invalid style name '${name}'`, nameLine, null,
          "Style names use letters, numbers, '-' or '_' (example: product-card).");
      }
      expect(TokenType.COLON, `':' after style name '${name}'`);

      let value;
      if (check(TokenType.STRING)) {
        value = advance().value;
      } else {
        const valueTokens = [];
        while (!check(TokenType.NEWLINE) && !check(TokenType.DEDENT) && !check(TokenType.EOF)) {
          valueTokens.push(advance());
        }
        value = joinTokensByColumn(valueTokens);
      }
      if (!value) {
        throw new ParseError(`Style '${name}' has no classes`, nameLine, null,
          `Example: ${name}: flex gap-2 p-4`);
      }
      if (Object.prototype.hasOwnProperty.call(styles, name)) {
        throw new ParseError(`Style '${name}' is defined twice`, nameLine);
      }
      styles[name] = value;
      match(TokenType.NEWLINE);
    }

    expect(TokenType.DEDENT, "dedentation to end 'styles:' block");
    return AST.StylesDef(styles, line);
  }

  // ── Resource ──────────────────────────────────────────────────────
  //   resource products at "/api/products":
  //       title text required
  //       price number
  //       email email

  function parseResourceDef() {
    const startToken = advance(); // 'resource'
    const line = startToken.line;
    const name = advance().value;
    advance(); // 'at'
    if (!check(TokenType.STRING)) {
      throw new ParseError("Expected the API address in quotes after 'at'", line, null,
        'Example: resource products at "/api/products":');
    }
    const url = advance().value;
    expect(TokenType.COLON, "':' after the resource address");
    expect(TokenType.NEWLINE, "a new line after the resource header");
    if (!match(TokenType.INDENT)) {
      throw new ParseError(`Resource '${name}' needs at least one field`, line, null,
        'Example:\n    resource products at "/api/products":\n        title text required\n        price number');
    }

    const fields = [];
    while (!check(TokenType.DEDENT) && !check(TokenType.EOF)) {
      if (match(TokenType.NEWLINE)) continue;
      const fieldLine = peek().line;
      const words = [];
      while (!check(TokenType.NEWLINE) && !check(TokenType.DEDENT) && !check(TokenType.EOF)) {
        words.push(String(advance().value));
      }
      match(TokenType.NEWLINE);
      const [fieldName, type = 'text', ...flags] = words;
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(fieldName)) {
        throw new ParseError(`Invalid field name '${fieldName}'`, fieldLine, null,
          'Field names use letters, numbers and _ (example: title text required).');
      }
      if (!['text', 'number', 'email'].includes(type)) {
        throw new ParseError(`Unknown field type '${type}' for '${fieldName}'`, fieldLine, null,
          'Field types are: text, number, email.');
      }
      for (const f of flags) {
        if (f !== 'required' && f !== 'hidden') {
          throw new ParseError(`Unknown field option '${f}' for '${fieldName}'`, fieldLine, null,
            "The options are 'required' and 'hidden' (hidden = saved but never sent to the browser, for passwords).");
        }
      }
      fields.push({ name: fieldName, type, required: flags.includes('required'), hidden: flags.includes('hidden') });
    }
    expect(TokenType.DEDENT, "dedentation to end the resource block");
    if (fields.length === 0) {
      throw new ParseError(`Resource '${name}' needs at least one field`, line);
    }
    return AST.ResourceDef(name, url, fields, line);
  }

  // ── Run the parser ────────────────────────────────────────────────
  return parseProgram();
}
