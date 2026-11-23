// ─── Bolt Language — Token Types ──────────────────────────────────────
// Every token the lexer can produce. These are the "atoms" of the language.
// The parser consumes these to build the AST.

export const TokenType = Object.freeze({
  // ── Literals ──────────────────────────────────────────────────────
  NUMBER:           'NUMBER',           // 42, 3.14
  STRING:           'STRING',           // "hello"
  BOOLEAN:          'BOOLEAN',          // true, false

  // ── String Interpolation ──────────────────────────────────────────
  STRING_START:     'STRING_START',     // "hello {     ← opening part
  STRING_MIDDLE:    'STRING_MIDDLE',    // } world {    ← middle part (between interpolations)
  STRING_END:       'STRING_END',       // } bye"       ← closing part
  // A string with no interpolation is just STRING.
  // "Hello {name}, you are {age}" → STRING_START("Hello ") EXPR STRING_MIDDLE(", you are ") EXPR STRING_END("")

  // ── Phase 4: Data Models ──────────────────────────────────────────
  MODEL:            'MODEL',            // model User
  TYPE:             'TYPE',             // string, number, boolean
  
  // ── Phase 9: Global Store ─────────────────────────────────────────
  GLOBAL:           'GLOBAL',           // global store cart = []
  CLEAR:            'CLEAR',            // clear cart
  PERSIST:          'PERSIST',          // global store cart = [] persist

  // ── Phase 14: Global Design System ──────────────────────────────
  DESIGN_SYSTEM:    'DESIGN_SYSTEM',

  // ── Keywords Map ──────────────────────────────────────────────────────
  FUNCTION:         'FUNCTION',         // function
  GIVE:             'GIVE',             // give (return)
  IF:               'IF',               // if
  OTHERWISE_IF:     'OTHERWISE_IF',     // otherwise if (else if)
  OTHERWISE:        'OTHERWISE',        // otherwise (else)
  REPEAT:           'REPEAT',           // repeat N times
  TIMES:            'TIMES',            // repeat N times
  FROM:             'FROM',             // repeat from X to Y
  TO:               'TO',               // repeat from X to Y
  UNTIL:            'UNTIL',            // repeat until condition
  FOR_EVERY:        'FOR_EVERY',        // for every item in collection
  IN:               'IN',               // for every item in collection
  AND:              'AND',              // add 5 and 10 (arg separator) / logical and
  OR:               'OR',              // logical or
  NOT:              'NOT',              // logical not
  PRINT:            'PRINT',            // print "hello"
  TRUE:             'TRUE',             // true
  FALSE:            'FALSE',            // false

  // ── Phase 2a: Collections ─────────────────────────────────────────
  ADD:              'ADD',              // add item to list
  REMOVE:           'REMOVE',           // remove item from list
  CHECK:            'CHECK',            // check if item in list
  COUNT:            'COUNT',            // count of list
  FIRST:            'FIRST',            // first of list
  LAST:             'LAST',             // last of list
  FILTERED:         'FILTERED',         // list filtered by condition
  SORTED:           'SORTED',           // list sorted by field
  BY:               'BY',              // filtered/sorted by
  OF:               'OF',              // count of, first of, last of

  // ── Phase 2b: UI Primitives ───────────────────────────────────────
  PAGE:             'PAGE',             // page home:
  SHOW:             'SHOW',             // show "text", show all items
  BUTTON:           'BUTTON',           // button "Click me":
  COMPONENT:        'COMPONENT',        // component Card for item:
  AS:               'AS',               // show x as title
  STYLED:           'STYLED',           // styled as
  TOAST:            'TOAST',            // show toast "msg"
  MODAL:            'MODAL',            // show modal "msg"
  FORM:             'FORM',             // form:
  SUBMIT:           'SUBMIT',           // submit "Login":
  REQUIRED:         'REQUIRED',         // required
  EMAIL:            'EMAIL',            // email
  MIN:              'MIN',              // min 8
  MAX:              'MAX',              // max 50
  MATCH:            'MATCH',            // match password
  WHEN:             'WHEN',             // when count changes:
  CHANGES:          'CHANGES',          // when count changes:
  GO:               'GO',               // go to home
  ROW:              'ROW',
  COLUMN:           'COLUMN',
  GRID:             'GRID',
  AUTO:             'AUTO',
  CARD:             'CARD',
  HERO:             'HERO',
  SECTION:          'SECTION',
  CONTAINER:        'CONTAINER',
  PRIMARY:          'PRIMARY',
  SECONDARY:        'SECONDARY',
  EACH:             'EACH',             // show X for each y in ys
  ALL:              'ALL',              // show all products
  FOR:              'FOR',              // component X for Y / show X for each
  TAKES:            'TAKES',            // component X takes Y, Z
  LINK:             'LINK',             // link "text" to "/path"
  INPUT:            'INPUT',            // input "placeholder" into var
  INTO:             'INTO',             // input "placeholder" into var
  IMAGE:            'IMAGE',            // image "url"
  VIDEO:            'VIDEO',            // video "url"
  FORM:             'FORM',             // form:
  FETCH:            'FETCH',            // fetch "url" into var
  SUBMIT:           'SUBMIT',           // submit "url" with x, y
  UPDATE_DATA:      'UPDATE_DATA',      // update "url" with x, y
  DELETE_DATA:      'DELETE_DATA',      // delete "url"
  WITH:             'WITH',             // submit "url" with x, y
  LOADING:          'LOADING',          // loading:
  ERROR:            'ERROR',            // error:
  SUCCESS:          'SUCCESS',          // success:
  EMPTY:            'EMPTY',            // empty:

  // ── Phase 2c: State ───────────────────────────────────────────────
  STORE:            'STORE',            // store count = 0
  REMEMBER:         'REMEMBER',         // remember username = ""
  FORGET:           'FORGET',           // forget username
  ACTION:           'ACTION',           // action name:
  RUN:              'RUN',              // run action

  // ── Phase 4: Auth ─────────────────────────────────────────────────
  LOGIN:            'LOGIN',            // login url with {data}
  LOGOUT:           'LOGOUT',           // logout
  LOGGED_IN:        'LOGGED_IN',        // if logged in

  // ── Operators ─────────────────────────────────────────────────────
  ASSIGN:           'ASSIGN',           // =
  PLUS:             'PLUS',             // +
  MINUS:            'MINUS',            // -
  STAR:             'STAR',             // *
  SLASH:            'SLASH',            // /
  MODULO:           'MODULO',           // %
  DOUBLE_EQUALS:    'DOUBLE_EQUALS',    // ==
  NOT_EQUALS:       'NOT_EQUALS',       // !=
  GT:               'GT',               // >
  LT:               'LT',               // <
  GTE:              'GTE',              // >=
  LTE:              'LTE',              // <=

  // ── Structural ────────────────────────────────────────────────────
  COLON:            'COLON',            // :
  COMMA:            'COMMA',            // ,
  DOT:              'DOT',              // .
  LBRACKET:         'LBRACKET',         // [
  RBRACKET:         'RBRACKET',         // ]
  LBRACE:           'LBRACE',           // {
  RBRACE:           'RBRACE',           // }
  LPAREN:           'LPAREN',           // (
  RPAREN:           'RPAREN',           // )

  // ── Indentation & Structure ───────────────────────────────────────
  NEWLINE:          'NEWLINE',          // end of a logical line
  INDENT:           'INDENT',           // indentation increased
  DEDENT:           'DEDENT',           // indentation decreased
  EOF:              'EOF',              // end of file
  
  IDENTIFIER:       'IDENTIFIER',       // variable names, etc.
  USE:              'USE',              // use statement
});

// ── Keyword Map ────────────────────────────────────────────────────
// Maps keyword strings to their token types.
// Multi-word keywords (like "otherwise if", "for every") are handled
// specially in the lexer via lookahead — they are NOT in this map.
export const KEYWORDS = Object.freeze({
  'function':   TokenType.FUNCTION,
  'give':       TokenType.GIVE,
  'if':         TokenType.IF,
  'otherwise':  TokenType.OTHERWISE,   // lexer peeks for "if" after this
  'repeat':     TokenType.REPEAT,      // lexer peeks for "from"/"until"/"times"
  'times':      TokenType.TIMES,
  'from':       TokenType.FROM,
  'to':         TokenType.TO,
  'until':      TokenType.UNTIL,
  'in':         TokenType.IN,
  'and':        TokenType.AND,
  'or':         TokenType.OR,
  'not':        TokenType.NOT,
  'print':      TokenType.PRINT,
  'true':       TokenType.TRUE,
  'false':      TokenType.FALSE,

  // Phase 2a: Collections
  'add':        TokenType.ADD,
  'remove':     TokenType.REMOVE,
  'check':      TokenType.CHECK,
  'count':      TokenType.COUNT,
  'first':      TokenType.FIRST,
  'last':       TokenType.LAST,
  'filtered':   TokenType.FILTERED,
  'sorted':     TokenType.SORTED,
  'by':         TokenType.BY,
  'of':         TokenType.OF,

  // Phase 2b: UI
  'page':       TokenType.PAGE,
  'show':       TokenType.SHOW,
  'button':     TokenType.BUTTON,
  'component':  TokenType.COMPONENT,
  'as':         TokenType.AS,
  'styled':     TokenType.STYLED,
  'toast':      TokenType.TOAST,
  'modal':      TokenType.MODAL,
  'form':       TokenType.FORM,
  'submit':     TokenType.SUBMIT,
  'required':   TokenType.REQUIRED,
  'email':      TokenType.EMAIL,
  'min':        TokenType.MIN,
  'max':        TokenType.MAX,
  'match':      TokenType.MATCH,
  'when':       TokenType.WHEN,
  'changes':    TokenType.CHANGES,
  'go':         TokenType.GO,
  'row':        TokenType.ROW,
  'column':     TokenType.COLUMN,
  'grid':       TokenType.GRID,
  'auto':       TokenType.AUTO,
  'card':       TokenType.CARD,
  'hero':       TokenType.HERO,
  'section':    TokenType.SECTION,
  'container':  TokenType.CONTAINER,
  'primary':    TokenType.PRIMARY,
  'secondary':  TokenType.SECONDARY,
  'each':       TokenType.EACH,
  'all':        TokenType.ALL,
  'for':        TokenType.FOR,        // lexer peeks for "every" → FOR_EVERY
  'takes':      TokenType.TAKES,
  'link':       TokenType.LINK,
  'input':      TokenType.INPUT,
  'into':       TokenType.INTO,
  'use':        TokenType.USE,
  'image':      TokenType.IMAGE,
  'video':      TokenType.VIDEO,
  'form':       TokenType.FORM,
  'fetch':      TokenType.FETCH,
  'submit':     TokenType.SUBMIT,
  'update':     TokenType.UPDATE_DATA,
  'delete':     TokenType.DELETE_DATA,
  'with':       TokenType.WITH,
  'loading':    TokenType.LOADING,
  'error':      TokenType.ERROR,
  'success':    TokenType.SUCCESS,
  'empty':      TokenType.EMPTY,

  // Phase 2c: State
  'store':      TokenType.STORE,
  'remember':   TokenType.REMEMBER,
  'forget':     TokenType.FORGET,
  'action':     TokenType.ACTION,
  'run':        TokenType.RUN,
  
  // Phase 9: Global Store
  'global':     TokenType.GLOBAL,
  'clear':      TokenType.CLEAR,
  'persist':    TokenType.PERSIST,

  // Phase 4: Auth
  'login':      TokenType.LOGIN,
  'logout':     TokenType.LOGOUT,
});

// ── Token Constructor ──────────────────────────────────────────────
// Creates a token object with type, value, and source location.
export function createToken(type, value, line, column) {
  return { type, value, line, column };
}
