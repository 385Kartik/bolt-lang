// ─── Bolt Language — Code Generator ───────────────────────────────────
// Transforms a Bolt AST (from the parser) into valid JavaScript code.
//
// The generator walks the AST recursively, dispatching on node.type.
// It tracks variable declarations with scoping, manages indentation,
// and maps Bolt operators/constructs to their JavaScript equivalents.

import { GeneratorError } from '../errors/errors.js';

// ── Operator mappings ───────────────────────────────────────────────

/** Maps Bolt binary operators to their JavaScript equivalents. */
const BINARY_OP_MAP = {
  '+':   '+',
  '-':   '-',
  '*':   '*',
  '/':   '/',
  '%':   '%',
  '==':  '===',   // Bolt uses strict equality
  '!=':  '!==',   // Bolt uses strict inequality
  '<':   '<',
  '>':   '>',
  '<=':  '<=',
  '>=':  '>=',
  'and': '&&',
  'or':  '||',
};

/** Maps Bolt unary operators to their JavaScript equivalents. */
const UNARY_OP_MAP = {
  '-':   '-',
  'not': '!',
};

// ── String escaping ─────────────────────────────────────────────────

/**
 * Escapes special characters in a string for safe embedding in a
 * double-quoted JavaScript string literal.
 */
function escapeString(str) {
  return str
    .replace(/\\/g, '\\\\')   // backslash → \\
    .replace(/"/g, '\\"')     // double quote → \"
    .replace(/\n/g, '\\n')    // newline → \n
    .replace(/\t/g, '\\t');   // tab → \t
}

/**
 * Escapes special characters for use inside a JS template literal.
 * Backticks and ${} sequences must be escaped.
 */
function escapeTemplateLiteral(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
}

// ── Scope management ────────────────────────────────────────────────

/**
 * A scope stack for tracking which variables have been declared.
 * Each scope is a Set<string> of variable names.
 *
 * When entering a function, we push a new scope (pre-seeded with
 * the function's parameters). When leaving, we pop it.
 * This prevents local variables from leaking into the outer scope.
 */
class ScopeStack {
  constructor() {
    // Start with a single global scope
    this.stack = [new Set()];
  }

  /** Push a new scope, optionally pre-declaring a list of variable names. */
  push(initialVars = []) {
    const scope = new Set(initialVars);
    this.stack.push(scope);
  }

  /** Pop the current scope, restoring the previous one. */
  pop() {
    if (this.stack.length <= 1) {
      throw new Error('Cannot pop the global scope');
    }
    this.stack.pop();
  }

  /** Check if a variable has been declared in any active scope. */
  isDeclared(name) {
    // Search from innermost scope outward
    for (let i = this.stack.length - 1; i >= 0; i--) {
      if (this.stack[i].has(name)) {
        return true;
      }
    }
    return false;
  }

  /** Declare a variable in the current (innermost) scope. */
  declare(name) {
    this.stack[this.stack.length - 1].add(name);
  }
}

// ── Main generator ──────────────────────────────────────────────────

/**
 * Generates JavaScript source code from a Bolt AST.
 *
 * @param {object} ast - The root Program node from the parser.
 * @returns {string} The generated JavaScript code.
 */
export function generate(ast, existingRegistry = null, globalStoresList = [], designSystemConfig = null) {
  const scopes = new ScopeStack();
  let indentLevel = 0;

  // ── Phase 4a: Component Registry Mapping ────────────────────────
  const isOptionsObject = existingRegistry && !existingRegistry.__props && typeof existingRegistry === 'object' && existingRegistry.componentRegistry;
  const opts = isOptionsObject ? existingRegistry : { componentRegistry: existingRegistry, globalStoresList, designSystem: designSystemConfig };
  
  const componentRegistry = opts.componentRegistry || {};
  const componentPropsRegistry = opts.componentRegistry ? opts.componentRegistry.__props : {};
  const globalStoresListOpt = opts.globalStoresList || [];
  const designSystem = opts.designSystem || { colors: {}, typography: {}, components: {} };
  
  if (!opts.componentRegistry && ast && ast.type === 'Program') {
    for (const node of ast.body) {
      if (node.type === 'ComponentDef' && node.forVars && node.forVars.length > 0) {
        componentRegistry[node.forVars[0]] = node.name;
        componentPropsRegistry[node.name] = node.forVars;
      }
    }
  }

  // ── Phase 14: Global Stores List ───────────────
  const globalStoreNames = globalStoresListOpt.map(s => s.name);
  
  // Phase 15: theme is a built-in global store
  if (!globalStoreNames.includes('theme')) {
    globalStoreNames.push('theme');
  }

  function isGlobalStore(name) {
    return globalStoreNames.includes(name) && !scopes.isDeclared(name);
  }

  // ── Phase 9: Dynamic Routing — Page Param Tracking ─────────────
  let currentPageParams = [];

  // ── Indentation helper ──────────────────────────────────────────

  /** Returns the current indentation string (2 spaces per level). */
  function indent() {
    return '  '.repeat(indentLevel);
  }

  // ── Core recursive generator ────────────────────────────────────

  /**
   * Generates JavaScript code for a single AST node.
   * Dispatches based on node.type to the appropriate handler.
   *
   * @param {object} node - An AST node.
   * @returns {string} The generated JavaScript fragment.
   */
  function gen(node) {
    switch (node.type) {

      // ── Program ───────────────────────────────────────────────
      case 'Program':
        return genProgram(node);

      // ── Statements ────────────────────────────────────────────
      case 'Assignment':
        return genAssignment(node);
      case 'FunctionDef':
        return genFunctionDef(node);
      case 'IfStatement':
        return genIfStatement(node);
      case 'RepeatTimes':
        return genRepeatTimes(node);
      case 'RepeatFromTo':
        return genRepeatFromTo(node);
      case 'RepeatUntil':
        return genRepeatUntil(node);
      case 'ForEvery':
        return genForEvery(node);
      case 'GiveStatement':
        return genGiveStatement(node);
      case 'PrintStatement':
        return genPrintStatement(node);
      case 'ExpressionStatement':
        return genExpressionStatement(node);

      // ── Expressions ───────────────────────────────────────────
      case 'FunctionCall':
        return genFunctionCall(node);
      case 'BinaryExpression':
        return genBinaryExpression(node);
      case 'UnaryExpression':
        return genUnaryExpression(node);
      case 'NumberLiteral':
        return genNumberLiteral(node);
      case 'StringLiteral':
        return genStringLiteral(node);
      case 'InterpolatedString':
        return genInterpolatedString(node);
      case 'BooleanLiteral':
        return genBooleanLiteral(node);
      case 'Identifier':
        return genIdentifier(node);
      case 'ArrayLiteral':
        return genArrayLiteral(node);
      case 'ObjectLiteral':
        return genObjectLiteral(node);
      case 'MemberExpression':
        return genMemberExpression(node);

      // ── Phase 2a: Collections ─────────────────────────────────
      case 'AddTo':
        return genAddTo(node);
      case 'RemoveFrom':
        return genRemoveFrom(node);
      case 'CheckIn':
        return genCheckIn(node);
      case 'CountOf':
        return genCountOf(node);
      case 'FirstOf':
        return genFirstOf(node);
      case 'LastOf':
        return genLastOf(node);
      case 'FilteredBy':
        return genFilteredBy(node);
      case 'SortedBy':
        return genSortedBy(node);

      // ── Phase 2b: UI Primitives ───────────────────────────────
      case 'PageDef':
        return genPageDef(node);
      case 'LayoutBlock':
        return genLayoutBlock(node);
      case 'ShowStatement':
        return genShowStatement(node);
      case 'ShowToastStatement':
        return genShowToastStatement(node);
      case 'ShowModalStatement':
        return genShowModalStatement(node);
      case 'ShowAll':
        return genShowAll(node);
      case 'ShowForEach':
        return genShowForEach(node);
      case 'ButtonStatement':
        return genButtonStatement(node);
      case 'FormBlock':
        return genFormBlock(node);
      case 'ComponentDef':
        return genComponentDef(node);
      case 'LinkStatement':
        return genLinkStatement(node);
      case 'UseStatement':
        return ''; // Handled purely by builder.js or ignored
      case 'InputStatement':
        return genInputStatement(node);
      case 'ImageStatement':
        return genImageStatement(node);
      case 'VideoStatement':
        return genVideoStatement(node);
      case 'FetchStatement':
        return genFetchStatement(node);
      case 'SubmitStatement':
        return genSubmitStatement(node);
      case 'UpdateDataStatement':
        return genUpdateDataStatement(node);
      case 'DeleteDataStatement':
        return genDeleteDataStatement(node);
      case 'WhenChanges':
        return genWhenChanges(node);
      case 'GoTo':
        return genGoTo(node);

      // ── Phase 2c: State ───────────────────────────────────────
      case 'StoreDeclaration':
        return genStoreDeclaration(node);
      case 'RememberDeclaration':
        return genRememberDeclaration(node);
      case 'ForgetStatement':
        return genForgetStatement(node);

      // ── Phase 3: Actions ──────────────────────────────────────
      case 'GlobalStoreDeclaration':
        return ''; // Handled by builder.js
      case 'ClearStatement':
        return genClearStatement(node);
      case 'ActionDef':
        return genActionDef(node);
      case 'RunExpression':
        return genRunExpression(node);

      // ── Phase 4: Auth ─────────────────────────────────────────
      case 'LoginStatement':
        return genLoginStatement(node);
      case 'LogoutStatement':
        return genLogoutStatement(node);
      case 'LoggedInExpression':
        return genLoggedInExpression(node);

      default:
        throw new GeneratorError(
          `Unknown AST node type: "${node.type}"`,
          node.line || 0,
          null,
          'This is an internal compiler error. Please report it.'
        );
    }
  }

  // ── Statement generators ────────────────────────────────────────

  /** Generate the full program: each top-level statement on its own line. */
  function genProgram(node) {
    return node.body.map(stmt => gen(stmt)).join('\n');
  }

  /**
   * Generate a variable assignment.
   * First occurrence → `let name = value;`
   * Subsequent      → `name = value;`
   */
  function genAssignment(node) {
    const value = gen(node.value);
    
    // Phase 9: Global Store Mutation
    if (isGlobalStore(node.name)) {
      return `${indent()}updateStore(s => { s.${node.name} = ${value}; });`;
    }

    // Phase 2c: Setter detection
    const setterName = 'set' + capitalize(node.name);
    if (scopes.isDeclared(setterName)) {
      return `${indent()}${setterName}(${value});`;
    }

    if (!scopes.isDeclared(node.name)) {
      scopes.declare(node.name);
      return `${indent()}let ${node.name} = ${value};`;
    }

    return `${indent()}${node.name} = ${value};`;
  }

  function genFetchConditional(node) {
    let defaultSuccess = 'null';
    if (node.successBody && node.successBody.length > 0) {
      defaultSuccess = `<>${node.successBody.map(s => genUIStatement(s)).join('\n')}</>`;
    }
    
    let currentExpr = defaultSuccess;
    
    if (node.emptyBody && node.emptyBody.length > 0) {
      const emptyCond = `(!${node.variable} || (Array.isArray(${node.variable}) && ${node.variable}.length === 0))`;
      const emptyJsx = `<>${node.emptyBody.map(s => genUIStatement(s)).join('\n')}</>`;
      currentExpr = `${emptyCond} ? (${emptyJsx}) : (${currentExpr})`;
    }
    
    if (node.errorBody && node.errorBody.length > 0) {
      const errorVar = `${node.variable}Error`;
      let errorJsx = `<>${node.errorBody.map(s => genUIStatement(s)).join('\n')}</>`;
      if (node.errorVar) {
        errorJsx = `(() => { const ${node.errorVar} = ${errorVar}; return ${errorJsx}; })()`;
      }
      currentExpr = `${errorVar} ? (${errorJsx}) : (${currentExpr})`;
    }
    
    if (node.loadingBody && node.loadingBody.length > 0) {
      const loadingVar = `${node.variable}Loading`;
      const loadingJsx = `<>${node.loadingBody.map(s => genUIStatement(s)).join('\n')}</>`;
      currentExpr = `${loadingVar} ? (${loadingJsx}) : (${currentExpr})`;
    }
    
    if (!node.loadingBody && !node.errorBody && !node.emptyBody && !node.successBody) {
       return 'null';
    }
    
    return currentExpr;
  }

  /**
   * Generate a function definition.
   * Creates a new scope with parameters pre-declared so they
   * won't get redundant `let` declarations inside the body.
   */
  function genFunctionDef(node) {
    const params = node.params.join(', ');
    let output = `${indent()}function ${node.name}(${params}) {\n`;

    // Push a new scope with params already declared
    scopes.push(node.params);
    indentLevel++;

    output += genBody(node.body);

    indentLevel--;
    scopes.pop();

    output += `${indent()}}`;
    return output;
  }

  /**
   * Generate an if/else-if/else chain.
   */
  function genIfStatement(node) {
    let output = `${indent()}if (${gen(node.condition)}) {\n`;

    indentLevel++;
    output += genBody(node.body);
    indentLevel--;

    // else-if branches
    for (const branch of node.elseIfs) {
      output += `${indent()}} else if (${gen(branch.condition)}) {\n`;
      indentLevel++;
      output += genBody(branch.body);
      indentLevel--;
    }

    // else branch
    if (node.elseBody) {
      output += `${indent()}} else {\n`;
      indentLevel++;
      output += genBody(node.elseBody);
      indentLevel--;
    }

    output += `${indent()}}`;
    return output;
  }

  /**
   * Generate `repeat N times` → `for (let current = 0; current < N; current++)`
   * The loop variable `current` is declared in the for-init, not tracked in scope.
   */
  function genRepeatTimes(node) {
    const count = gen(node.count);
    let output = `${indent()}for (let current = 0; current < ${count}; current++) {\n`;

    // Mark 'current' as declared inside the loop body scope
    scopes.push(['current']);
    indentLevel++;

    output += genBody(node.body);

    indentLevel--;
    scopes.pop();

    output += `${indent()}}`;
    return output;
  }

  /**
   * Generate `repeat from A to B` → `for (let current = A; current <= B; current++)`
   */
  function genRepeatFromTo(node) {
    const from = gen(node.from);
    const to = gen(node.to);
    let output = `${indent()}for (let current = ${from}; current <= ${to}; current++) {\n`;

    // Mark 'current' as declared inside the loop body scope
    scopes.push(['current']);
    indentLevel++;

    output += genBody(node.body);

    indentLevel--;
    scopes.pop();

    output += `${indent()}}`;
    return output;
  }

  /**
   * Generate `repeat until condition` → `while (!(condition))`
   */
  function genRepeatUntil(node) {
    const condition = gen(node.condition);
    let output = `${indent()}while (!(${condition})) {\n`;

    indentLevel++;
    output += genBody(node.body);
    indentLevel--;

    output += `${indent()}}`;
    return output;
  }

  /**
   * Generate `for every item in collection` → `for (const item of collection)`
   */
  function genForEvery(node) {
    const iterable = gen(node.iterable);
    let output = `${indent()}for (const ${node.variable} of ${iterable}) {\n`;

    // Mark the loop variable as declared inside the loop scope
    scopes.push([node.variable]);
    indentLevel++;

    output += genBody(node.body);

    indentLevel--;
    scopes.pop();

    output += `${indent()}}`;
    return output;
  }

  /** Generate `give value` → `return value;` */
  function genGiveStatement(node) {
    return `${indent()}return ${gen(node.value)};`;
  }

  /** Generate `print value` → `console.log(value);` */
  function genPrintStatement(node) {
    return `${indent()}console.log(${gen(node.value)});`;
  }

  /** Generate an expression used as a statement. */
  function genExpressionStatement(node) {
    return `${indent()}${gen(node.expression)};`;
  }

  // ── Expression generators ──────────────────────────────────────

  /** Generate a function call: `name(arg1, arg2, ...)` */
  function genFunctionCall(node) {
    const args = node.args.map(arg => gen(arg)).join(', ');
    return `${node.name}(${args})`;
  }

  /**
   * Generate a binary expression with parentheses for safety.
   * Maps Bolt operators to their JS equivalents.
   */
  function genBinaryExpression(node) {
    const left = gen(node.left);
    const right = gen(node.right);
    const jsOp = BINARY_OP_MAP[node.operator];

    if (!jsOp) {
      throw new GeneratorError(
        `Unknown binary operator: "${node.operator}"`,
        node.line,
        null,
        `Valid operators are: ${Object.keys(BINARY_OP_MAP).join(', ')}`
      );
    }

    return `(${left} ${jsOp} ${right})`;
  }

  /**
   * Generate a unary expression.
   * Maps 'not' → '!', '-' stays as '-'.
   */
  function genUnaryExpression(node) {
    const operand = gen(node.operand);
    const jsOp = UNARY_OP_MAP[node.operator];

    if (!jsOp) {
      throw new GeneratorError(
        `Unknown unary operator: "${node.operator}"`,
        node.line,
        null,
        `Valid unary operators are: ${Object.keys(UNARY_OP_MAP).join(', ')}`
      );
    }

    return `${jsOp}${operand}`;
  }

  /** Generate a number literal: just the raw value. */
  function genNumberLiteral(node) {
    return String(node.value);
  }

  /** Generate a string literal: double-quoted with escaping. */
  function genStringLiteral(node) {
    return `"${escapeString(node.value)}"`;
  }

  /**
   * Generate an interpolated string as a JS template literal.
   * StringLiteral parts become literal text; expression parts
   * become ${expression} interpolations.
   */
  function genInterpolatedString(node) {
    let result = '`';

    for (const part of node.parts) {
      if (part.type === 'StringLiteral') {
        // Raw text segment — escape for template literal context
        result += escapeTemplateLiteral(part.value);
      } else {
        // Expression segment — wrap in ${...}
        result += '${' + gen(part) + '}';
      }
    }

    result += '`';
    return result;
  }

  /** Generate a boolean literal: `true` or `false`. */
  function genBooleanLiteral(node) {
    return String(node.value);
  }

  /** Generate an identifier: just the variable/function name. */
  function genIdentifier(node) {
    return node.name;
  }

  /** Generate an array literal: `[elem1, elem2, elem3]` */
  function genArrayLiteral(node) {
    const elements = node.elements.map(el => gen(el)).join(', ');
    return `[${elements}]`;
  }

  /** Generate an object literal: `{ key1: value1, key2: value2 }` */
  function genObjectLiteral(node) {
    if (node.properties.length === 0) {
      return '{}';
    }
    const props = node.properties.map(
      prop => `${prop.key}: ${gen(prop.value)}`
    ).join(', ');
    return `{ ${props} }`;
  }

  /** Generate a member expression: `object.property` */
  function genMemberExpression(node) {
    if (node.object.type === 'Identifier' && node.object.name === 'env') {
      return `import.meta.env.VITE_${node.property}`;
    }
    return `${gen(node.object)}.${node.property}`;
  }

  // ── Body helper ─────────────────────────────────────────────────

  /**
   * Generate a list of statements (a block body).
   * Each statement is on its own line.
   */
  function genBody(statements) {
    return statements.map(stmt => gen(stmt)).join('\n') + '\n';
  }

  // ── Entry point ─────────────────────────────────────────────────

  // ── Phase 2a: Collections ─────────────────────────────────
  function genAddTo(node) {
    const targetCode = gen(node.target);
    const valueCode = gen(node.value);
    
    const setterName = 'set' + capitalize(targetCode);
    if (scopes.isDeclared(setterName)) {
      return `${indent()}${setterName}(prev => [...prev, ${valueCode}]);`;
    }

    if (isGlobalStore(targetCode)) {
      return `${indent()}updateStore(s => { s.${targetCode}.push(${valueCode}); });`;
    }

    return `${indent()}${targetCode}.push(${valueCode});`;
  }

  function genRemoveFrom(node) {
    const target = gen(node.target);
    const value = gen(node.value);
    
    const setterName = 'set' + capitalize(target);
    if (scopes.isDeclared(setterName)) {
      return `${indent()}${setterName}(prev => prev.filter(item => item !== ${value}));`;
    }

    if (isGlobalStore(target)) {
      return `${indent()}updateStore(s => { s.${target} = s.${target}.filter(item => item !== ${value}); });`;
    }

    return `${indent()}${target}.splice(${target}.indexOf(${value}), 1);`;
  }

  function genCheckIn(node) {
    return `${gen(node.collection)}.includes(${gen(node.value)})`;
  }

  function genCountOf(node) {
    return `${gen(node.collection)}.length`;
  }

  function genFirstOf(node) {
    return `${gen(node.collection)}[0]`;
  }

  function genLastOf(node) {
    const col = gen(node.collection);
    return `${col}[${col}.length - 1]`;
  }

  function genFilteredBy(node) {
    const col = gen(node.collection);
    const iterVar = node.variable || 'item';
    const condition = gen(node.condition);
    return `${col}.filter(${iterVar} => ${condition})`;
  }

  function genSortedBy(node) {
    const col = gen(node.collection);
    const field = node.field;
    return `[...${col}].sort((a, b) => a.${field} > b.${field} ? 1 : -1)`;
  }

  // ── Helpers for React Generation ────────────────────────────
  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function singularize(word) {
    if (word.endsWith('ies')) return word.slice(0, -3) + 'y';
    if (word.endsWith('es') && (word.endsWith('ches') || word.endsWith('shes') || word.endsWith('xes'))) return word.slice(0, -2);
    if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
    return word;
  }

  function genJSXContent(node) {
    if (node.type === 'StringLiteral') {
      return escapeString(node.value).replace(/\\"/g, '"');
    }
    if (node.type === 'InterpolatedString') {
      let result = '';
      for (const part of node.parts) {
        if (part.type === 'StringLiteral') {
          result += part.value;
        } else {
          result += '{' + gen(part) + '}';
        }
      }
      return result;
    }
    return '{' + gen(node) + '}';
  }

  function genUIList(stmts) {
    if (!stmts || stmts.length === 0) return '';
    let output = '';
    for (let i = 0; i < stmts.length; i++) {
      const stmt = stmts[i];
      if (stmt.type === 'FetchStatement') {
        const remaining = stmts.slice(i + 1);
        if (!stmt.successBody) {
          stmt.successBody = remaining;
        } else {
          stmt.successBody.push(...remaining);
        }
        output += genUIStatement(stmt) + '\n';
        break; // Consumed the rest
      } else {
        output += genUIStatement(stmt) + '\n';
      }
    }
    return output;
  }

  function genUIStatement(stmt) {
    const marker = stmt.line ? `/*__L:${stmt.line}*/` : '';

    // Special handling for IfStatement inside JSX — render as conditional expression
    if (stmt.type === 'IfStatement') {
      return `${indent()}${marker}{${genJSXConditional(stmt)}}`;
    }

    if (stmt.type === 'FetchStatement') {
      return `${indent()}${marker}{${genFetchConditional(stmt)}}`;
    }

    const inner = gen(stmt).trim();
    if (stmt.line) {
      return `${indent()}${marker}{(() => {
${indent()}  try {
${indent()}    return <>${inner}</>;
${indent()}  } catch (e) {
${indent()}    if (!e.__boltLine) { e.__boltLine = ${stmt.line}; }
${indent()}    throw e;
${indent()}  }
${indent()}})()}`;
    }
    const uiTypes = new Set(['ShowStatement', 'ShowAll', 'ShowForEach', 'ButtonStatement', 'LinkStatement', 'InputStatement', 'ImageStatement', 'VideoStatement', 'IfStatement']);
    if (uiTypes.has(stmt.type)) {
      return marker + inner;
    }
    return `${indent()}${marker}{(() => { ${inner} })()}`;
  }

  function genJSXConditional(node) {
    const cond = gen(node.condition);
    const body = genUIList(node.body);

    if (node.elseBody && node.elseBody.length > 0) {
      const elseBody = genUIList(node.elseBody);
      return `(${cond}) ? (\n${indent()}  <>\n${body}\n${indent()}  </>\n${indent()}) : (\n${indent()}  <>\n${elseBody}\n${indent()}  </>\n${indent()})`;
    }

    // No else: use && short circuit
    return `(${cond}) && (\n${indent()}  <>\n${body}\n${indent()}  </>\n${indent()})`;
  }

  function genStyleProp(styleNode) {
    if (!styleNode) return '';
    let str = '';
    if (styleNode.type === 'RawStyle') {
      str = styleNode.value;
    }
    return str;
  }

  function mergeClass(attrs, styleNode) {
    let finalClass = '';
    if (attrs.includes('className="')) {
      finalClass = attrs.split('className="')[1].split('"')[0];
    }
    const inlineClass = genStyleProp(styleNode);
    
    // ── Phase 14 & 15: Token Validation ──
    if (inlineClass && designSystem) {
      const customColors = Object.keys(designSystem.colors || {});
      if (designSystem.themes && designSystem.themes.light) {
        customColors.push(...Object.keys(designSystem.themes.light));
      }
      const tokens = inlineClass.split(/\s+/);
      for (const token of tokens) {
        const match = token.match(/^(?:hover:|focus:|active:|sm:|md:|lg:|xl:)?(?:bg|text)-([a-z0-9-]+)$/);
        if (match) {
          const colorName = match[1];
          const nonColors = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl', 'left', 'center', 'right', 'justify', 'start', 'end', 'transparent', 'auto', 'cover', 'contain', 'bottom', 'top', 'repeat', 'none', 'fixed', 'local', 'scroll', 'clip', 'current', 'inherit'];
          if (nonColors.includes(colorName) || !isNaN(colorName) || colorName.startsWith('opacity-')) continue;
          
          if (!customColors.includes(colorName)) {
            const isStandardNoHyphen = ['white', 'black'].includes(colorName);
            if (!colorName.includes('-') && !isStandardNoHyphen) {
               throw new GeneratorError(
                  `Unknown color token in style: '${token}'`,
                  styleNode.line, null,
                  `'${colorName}' is not defined in your design system colors.`
               );
            }
          }
        }
      }
    }
    
    if (finalClass && inlineClass) {
      finalClass += ' ' + inlineClass;
    } else if (inlineClass) {
      finalClass = inlineClass;
    }
    
    return finalClass ? ` className="${finalClass}"` : '';
  }

  // ── Phase 2b: UI Primitives ───────────────────────────────

  function genLayoutBlock(node) {
    let baseClass = '';
    const dsClass = designSystem && designSystem.components && designSystem.components[node.layoutType];
    
    if (dsClass) {
      baseClass = dsClass;
      if (node.layoutType === 'grid') {
        const n = node.gridCount || 1;
        if (n !== 'auto') {
           if (n > 1) baseClass += ` sm:grid-cols-${Math.min(2, n)}`;
           if (n > 2) baseClass += ` lg:grid-cols-${n}`;
        }
      }
    } else {
      if (node.layoutType === 'row') {
        baseClass = 'flex flex-row flex-wrap';
      } else if (node.layoutType === 'column') {
        baseClass = 'flex flex-col';
      } else if (node.layoutType === 'grid') {
        if (node.gridCount === 'auto') {
          baseClass = 'grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))]';
        } else {
          const n = node.gridCount || 1;
          baseClass = 'grid grid-cols-1';
          if (n > 1) {
            baseClass += ` sm:grid-cols-${Math.min(2, n)}`;
          }
          if (n > 2) {
            baseClass += ` lg:grid-cols-${n}`;
          }
        }
      } else if (node.layoutType === 'card') {
        baseClass = 'bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200';
      } else if (node.layoutType === 'hero') {
        baseClass = 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20 px-6 md:px-12 text-center rounded-3xl shadow-xl my-8';
      } else if (node.layoutType === 'section') {
        baseClass = 'py-12 md:py-16 w-full';
      } else if (node.layoutType === 'container') {
        baseClass = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full';
      } else if (node.layoutType === 'form') {
        baseClass = 'flex flex-col gap-4 w-full';
      }
    }
    
    // We construct a fake node that has the base layout classes to merge with user style
    let finalClass = baseClass;
    if (node.style) {
      const userStyle = genStyleProp(node.style);
      if (userStyle) {
        finalClass += ' ' + userStyle;
      }
    }
    
    const tag = node.layoutType === 'form' ? 'form' : 'div';
    const extraAttrs = node.layoutType === 'form' ? ' onSubmit={(e) => e.preventDefault()}' : '';
    
    let output = `${indent()}<${tag} className="${finalClass}"${extraAttrs}>\n`;
    indentLevel++;
    output += genUIList(node.body) + '\n';
    indentLevel--;
    output += `${indent()}</${tag}>`;
    return output;
  }

  function traverseAST(node, callback) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const item of node) traverseAST(item, callback);
      return;
    }
    if (node.type) {
      callback(node);
    }
    for (const key of Object.keys(node)) {
      if (key !== 'line' && key !== 'type' && typeof node[key] === 'object') {
        traverseAST(node[key], callback);
      }
    }
  }

  function hasNodeType(nodes, type) {
    let found = false;
    traverseAST(nodes, (node) => {
      if (node.type === type) found = true;
    });
    return found;
  }

  function collectNodes(nodes, type, results = new Set()) {
    traverseAST(nodes, (node) => {
      if (node.type === type) results.add(node);
    });
    return Array.from(results);
  }

  function genPageDef(node) {
    const pascalName = node.name.charAt(0).toUpperCase() + node.name.slice(1) + 'Page';
    let output = `${indent()}export default function ${pascalName}() {\n`;
    indentLevel++;
    
    // ── Phase 9: Dynamic Routing — useParams injection ──────────
    const pageParams = node.params || [];
    currentPageParams = pageParams.map(p => p.name);
    
    if (pageParams.length > 0) {
      const paramNames = pageParams.map(p => p.name).join(', ');
      output += `${indent()}const { ${paramNames} } = useParams();\n`;
    }
    
    // ── Reserved param protection: check for store/remember conflicts ──
    const paramNameSet = new Set(currentPageParams);
    const storeNodes = collectNodes(node.body, 'StoreDeclaration');
    const rememberNodes = collectNodes(node.body, 'RememberDeclaration');
    for (const s of storeNodes) {
      if (paramNameSet.has(s.name)) {
        throw new GeneratorError(
          `'${s.name}' is already defined as a route parameter on page '${node.name}'. Cannot redeclare it with 'store'.`,
          s.line, null,
          `Rename your store variable to avoid conflicting with the URL parameter '${s.name}'.`
        );
      }
    }
    for (const s of rememberNodes) {
      if (paramNameSet.has(s.name)) {
        throw new GeneratorError(
          `'${s.name}' is already defined as a route parameter on page '${node.name}'. Cannot redeclare it with 'remember'.`,
          s.line, null,
          `Rename your remember variable to avoid conflicting with the URL parameter '${s.name}'.`
        );
      }
    }
    
    // Find local declarations to handle shadowing
    const localDecls = new Set();
    collectNodes(node.body, 'StoreDeclaration').forEach(s => localDecls.add(s.name));
    collectNodes(node.body, 'RememberDeclaration').forEach(s => localDecls.add(s.name));
    collectNodes(node.body, 'InputStatement').forEach(s => localDecls.add(s.variable));
    
    // Inject global stores if used
    const usedIds = collectNodes(node.body, 'Identifier');
    const usedGlobals = new Set();
    usedIds.forEach(id => {
      if (globalStoreNames.includes(id.name) && !localDecls.has(id.name)) {
        usedGlobals.add(id.name);
      }
    });
    
    if (usedGlobals.size > 0) {
      output += `${indent()}const { ${Array.from(usedGlobals).join(', ')} } = useStore(s => s);\n`;
    }

    scopes.push(); 
    if (hasNodeType(node.body, 'GoTo')) {
      output += `${indent()}const navigate = useNavigate();\n`;
    }

    const inputs = collectNodes(node.body, 'InputStatement').filter(n => n.validations && n.validations.length > 0);
    for (const inp of inputs) {
      output += `${indent()}const [${inp.variable}Error, set${capitalize(inp.variable)}Error] = useState('');\n`;
    }

    const strBody = JSON.stringify(node.body);
    const usesAuth = strBody.includes('"LoginStatement"') || 
                     strBody.includes('"LogoutStatement"') || 
                     strBody.includes('"LoggedInExpression"') || 
                     strBody.match(/"name":"user"/);

    if (usesAuth) {
      output += `${indent()}const { user, isLoggedIn, loginUser, logoutUser } = useAuth();\n`;
    }

    if (strBody.includes('"ShowToastStatement"')) {
      output += `${indent()}const { addToast } = useToast();\n`;
    }

    if (strBody.includes('"ShowModalStatement"')) {
      output += `${indent()}const { showModal } = useModal();\n`;
    }
    
    const styleStmt = node.body.find(s => s.type === 'StyleStatement');
    const rootStyle = styleStmt ? mergeClass('', styleStmt.style) : '';

    const stateStmts = node.body.filter(s => ['StoreDeclaration', 'RememberDeclaration', 'WhenChanges', 'Assignment', 'FetchStatement'].includes(s.type));
    const uiStmts = node.body.filter(s => !['StoreDeclaration', 'RememberDeclaration', 'WhenChanges', 'StyleStatement', 'Assignment'].includes(s.type));
    
    if (stateStmts.length > 0) {
      output += stateStmts.map(stmt => `/*__L:${stmt.line || 0}*/ ` + gen(stmt)).join('\n') + '\n\n';
    }
    
    output += `${indent()}return (\n`;
    indentLevel++;
    output += `${indent()}<main${rootStyle}>\n`;
    indentLevel++;
    output += `${indent()}<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">\n`;
    indentLevel++;
    output += genUIList(uiStmts) + '\n';
    indentLevel--;
    output += `${indent()}</div>\n`;
    indentLevel--;
    output += `${indent()}</main>\n`;
    indentLevel--;
    output += `${indent()});\n`;
    indentLevel--;
    output += `${indent()}}`;
    return output;
  }

  function genShowToastStatement(node) {
    const msg = gen(node.message);
    return `${indent()}addToast(${msg}, "${node.variant}");`;
  }

  function genShowModalStatement(node) {
    const msg = gen(node.message);
    return `${indent()}if (!(await showModal(${msg}))) return;`;
  }

  function genShowStatement(node) {
    if (node.value.type === 'Identifier') {
      const varName = node.value.name;

      if (varName === 'children') {
        const cls = node.style ? mergeClass('', node.style) : '';
        if (cls) {
          return `${indent()}<div${cls}>{children}</div>`;
        }
        return `${indent()}{children}`;
      }

      // Wrapper component: `show Modal: \n show children`
      if (node.body) {
        const cls = node.style ? mergeClass('', node.style) : '';
        let propsStr = '';
        if (node.props && node.props.length > 0) {
           propsStr = ' ' + node.props.map(p => `${p.name}={${gen(p.value)}}`).join(' ');
        }
        let out = `${indent()}<${varName}${propsStr}${cls}>\n`;
        indentLevel++;
        out += genUIList(node.body) + '\n';
        indentLevel--;
        out += `${indent()}</${varName}>`;
        return out;
      }

      // Exact match (e.g. `show Navbar` or `show Modal with title="Hi"`)
      if (componentRegistry[varName] === varName && !node.hint) {
        const cls = node.style ? mergeClass('', node.style) : '';
        let propsStr = '';
        if (node.props && node.props.length > 0) {
           propsStr = ' ' + node.props.map(p => `${p.name}={${gen(p.value)}}`).join(' ');
        }
        return `${indent()}<${varName}${propsStr}${cls} />`;
      }

      // Variable mapping match (e.g. `show product`)
      const matchedKey = Object.keys(componentRegistry).find(key => 
        key !== componentRegistry[key] && // Skip the exact name mappings we just added
        (varName.toLowerCase() === key.toLowerCase() || 
         varName.toLowerCase().endsWith(key.toLowerCase()))
      );
      if (matchedKey && !node.hint) {
        const compName = componentRegistry[matchedKey];
        return `${indent()}<${compName} ${matchedKey}={${varName}} />`;
      }
    }

    const hintMap = {
      'title': 'h1',
      'subtitle': 'h2',
      'text': 'p',
      'label': 'label',
      'badge': ['span', ' className="badge"'],
    };

    if (node.hint === 'image') {
      const cls = mergeClass('', node.style);
      return `${indent()}<img src={${gen(node.value)}} alt=""${cls} />`;
    }

    const entry = hintMap[node.hint] || 'p';
    const tag = Array.isArray(entry) ? entry[0] : entry;
    let attrs = Array.isArray(entry) ? entry[1] : '';

    if (node.style) {
      attrs = mergeClass(attrs, node.style);
    }

    const content = genJSXContent(node.value);
    return `${indent()}<${tag}${attrs}>${content}</${tag}>`;
  }

  function genShowAll(node) {
    const col = gen(node.collection);
    
    // Phase 4a: Component Binding Inference
    if (node.collection.type === 'Identifier') {
      const singularName = singularize(node.collection.name);
      if (componentRegistry[singularName]) {
        const compName = componentRegistry[singularName];
        let extraProps = '';
        if (componentPropsRegistry && componentPropsRegistry[compName]) {
          const props = componentPropsRegistry[compName];
          if (props.length > 1) {
            extraProps = ' ' + props.slice(1).map(p => `${p}={${p}}`).join(' ');
          }
        }
        return `${indent()}{${col}.map((${singularName}, i) => <${compName} key={i} ${singularName}={${singularName}}${extraProps} />)}`;
      }
    }

    if (node.layoutHint === 'table') {
      return `${indent()}<table>\n${indent()}  <tbody>\n${indent()}    {${col}.map((item, i) => <tr key={i}><td>{JSON.stringify(item)}</td></tr>)}\n${indent()}  </tbody>\n${indent()}</table>`;
    }
    const wrapper = node.layoutHint === 'grid' ? 'div className="grid"' : 'div';
    return `${indent()}<${wrapper}>\n${indent()}  {${col}.map((item, i) => <div key={i}>{JSON.stringify(item)}</div>)}\n${indent()}</${wrapper.split(' ')[0]}>`;
  }

  function genShowForEach(node) {
    const col = gen(node.collection);
    let extraProps = '';
    if (componentPropsRegistry && componentPropsRegistry[node.componentName]) {
      const props = componentPropsRegistry[node.componentName];
      if (props.length > 1) {
        extraProps = ' ' + props.filter(p => p !== node.variable).map(p => `${p}={${p}}`).join(' ');
      }
    }
    return `${indent()}{${col}.map((${node.variable}, i) => <${node.componentName} key={i} ${node.variable}={${node.variable}}${extraProps} />)}`;
  }

  function genButtonStatement(node) {
    const label = genJSXContent(node.label);
    let baseClass = '';
    
    // ── Phase 14: Component Tokens ──
    const variantName = node.varName || 'primary'; // button uses varName as variant if not provided
    const dsButton = designSystem && designSystem.components && designSystem.components[`button ${variantName}`];
    
    if (dsButton) {
      baseClass = dsButton;
    } else {
      baseClass = 'px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
      if (variantName === 'primary') {
        baseClass += ' bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm';
      } else if (variantName === 'secondary') {
        baseClass += ' bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500';
      } else if (variantName === 'danger') {
        baseClass += ' bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm';
      } else {
        baseClass += ' bg-blue-500 text-white hover:bg-blue-600'; // default fallback
      }
    }

    // create a fake node to merge styles
    const fakeStyleNode = { type: 'RawStyle', value: baseClass };
    let cls = mergeClass('', fakeStyleNode);
    if (node.style) {
      const userCls = mergeClass('', node.style).replace(' className="', '');
      if (userCls) cls = ` className="${baseClass} ${userCls.replace('"', '')}"`;
    }

    if (node.body.length === 1) {
      const innerCode = gen(node.body[0]).trim().replace(/;$/, '');
      return `${indent()}<button${cls} onClick={async () => { ${innerCode}; }}>${label}</button>`;
    }
    let output = `${indent()}<button${cls} onClick={async () => {\n`;
    indentLevel++;
    output += node.body.map(stmt => gen(stmt)).join('\n') + '\n';
    indentLevel--;
    output += `${indent()}}}>${label}</button>`;
    return output;
  }

  function genComponentDef(node) {
    const propsList = node.forVars ? [...node.forVars] : [];
    if (node.takes) {
      node.takes.forEach(t => {
        if (!propsList.includes(t)) propsList.push(t);
      });
    }
    propsList.push('children');
    const props = `{ ${propsList.join(', ')} }`;
    let output = `${indent()}export default function ${node.name}(${props}) {\n`;
    indentLevel++;
    
    // Find local declarations to handle shadowing
    const localDecls = new Set();
    if (node.forVars) node.forVars.forEach(v => localDecls.add(v));
    if (node.takes) node.takes.forEach(v => localDecls.add(v));
    collectNodes(node.body, 'StoreDeclaration').forEach(s => localDecls.add(s.name));
    collectNodes(node.body, 'RememberDeclaration').forEach(s => localDecls.add(s.name));
    collectNodes(node.body, 'InputStatement').forEach(s => localDecls.add(s.variable));
    
    // Inject global stores if used
    const usedIds = collectNodes(node.body, 'Identifier');
    const usedGlobals = new Set();
    usedIds.forEach(id => {
      if (globalStoreNames.includes(id.name) && !localDecls.has(id.name)) {
        usedGlobals.add(id.name);
      }
    });
    
    if (usedGlobals.size > 0) {
      output += `${indent()}const { ${Array.from(usedGlobals).join(', ')} } = useStore(s => s);\n`;
    }

    scopes.push(node.forVars || []);

    const inputs = collectNodes(node.body, 'InputStatement').filter(n => n.validations && n.validations.length > 0);
    for (const inp of inputs) {
      output += `${indent()}const [${inp.variable}Error, set${capitalize(inp.variable)}Error] = useState('');\n`;
    }
    
    if (hasNodeType(node.body, 'GoTo')) {
      output += `${indent()}const navigate = useNavigate();\n`;
    }

    const strBody = JSON.stringify(node.body);
    const usesAuth = strBody.includes('"LoginStatement"') || 
                     strBody.includes('"LogoutStatement"') || 
                     strBody.includes('"LoggedInExpression"') || 
                     strBody.match(/"name":"user"/);

    if (usesAuth) {
      output += `${indent()}const { user, isLoggedIn, loginUser, logoutUser } = useAuth();\n`;
    }

    if (strBody.includes('"ShowToastStatement"')) {
      output += `${indent()}const { addToast } = useToast();\n`;
    }

    if (strBody.includes('"ShowModalStatement"')) {
      output += `${indent()}const { showModal } = useModal();\n`;
    }
    
    const styleStmt = node.body.find(s => s.type === 'StyleStatement');
    const rootStyle = styleStmt ? mergeClass('', styleStmt.style) : '';

    const stateStmts = node.body.filter(s => ['StoreDeclaration', 'RememberDeclaration', 'WhenChanges', 'Assignment', 'FetchStatement'].includes(s.type));
    const uiStmts = node.body.filter(s => !['StoreDeclaration', 'RememberDeclaration', 'WhenChanges', 'StyleStatement', 'Assignment'].includes(s.type));
    
    if (stateStmts.length > 0) {
      output += stateStmts.map(stmt => `/*__L:${stmt.line || 0}*/ ` + gen(stmt)).join('\n') + '\n\n';
    }
    
    output += `${indent()}return (\n`;
    indentLevel++;
    output += `${indent()}<div${rootStyle}>\n`;
    indentLevel++;
    output += genUIList(uiStmts) + '\n';
    indentLevel--;
    output += `${indent()}</div>\n`;
    indentLevel--;
    output += `${indent()});\n`;
    indentLevel--;
    scopes.pop();
    currentPageParams = [];
    output += `${indent()}}`;
    return output;
  }

  function genLinkStatement(node) {
    const label = genJSXContent(node.label);
    const cls = mergeClass('', node.style);
    const basePath = node.target.toLowerCase() === 'home' ? '/' : `/${node.target.toLowerCase()}`;
    
    if (node.args && node.args.length > 0) {
      const argParts = node.args.map(a => '${' + gen(a) + '}').join('/');
      return `${indent()}<Link to={\`${basePath}/${argParts}\`}${cls}>${label}</Link>`;
    }
    
    return `${indent()}<Link to="${basePath}"${cls}>${label}</Link>`;
  }

  function genImageStatement(node) {
    const cls = mergeClass('', node.style);
    return `${indent()}<img src={${gen(node.url)}} alt="Image"${cls} />`;
  }

  function genVideoStatement(node) {
    const cls = mergeClass('', node.style);
    return `${indent()}<video src={${gen(node.url)}} controls playsInline${cls} />`;
  }

  function genFetchStatement(node) {
    const setterName = 'set' + capitalize(node.variable);
    scopes.declare(node.variable);
    scopes.declare(setterName);
    const urlCode = gen(node.url);
    let output = `${indent()}const [${node.variable}, ${setterName}] = useState(null);\n`;
    output += `${indent()}const [${node.variable}Loading, set${capitalize(node.variable)}Loading] = useState(true);\n`;
    output += `${indent()}const [${node.variable}Error, set${capitalize(node.variable)}Error] = useState(null);\n`;
    output += `${indent()}useEffect(() => {\n`;
    indentLevel++;
    output += `${indent()}boltFetch(${urlCode})\n`;
    output += `${indent()}  .then(res => res.json())\n`;
    output += `${indent()}  .then(data => { ${setterName}(data); set${capitalize(node.variable)}Loading(false); })\n`;
    output += `${indent()}  .catch(err => { set${capitalize(node.variable)}Error(err.message); set${capitalize(node.variable)}Loading(false); });\n`;
    indentLevel--;
    // ── Phase 9: Fetch Reactivity — detect page params in URL expression ──
    const deps = [];
    if (currentPageParams.length > 0) {
      const urlString = JSON.stringify(node.url);
      for (const param of currentPageParams) {
        if (urlString.includes(`"name":"${param}"`)) {
          deps.push(param);
        }
      }
    }
    output += `${indent()}}, [${deps.join(', ')}]);`;
    return output;
  }

  function genSubmitStatement(node) {
    const urlCode = gen(node.url);
    const bodyCode = node.payload ? `, body: JSON.stringify(${gen(node.payload)})` : '';
    let output = `${indent()}return boltFetch(${urlCode}, { method: 'POST', headers: { 'Content-Type': 'application/json' }${bodyCode} })`;
    if (node.successBody) {
      const resVar = node.successVar || 'res';
      output += `\n${indent()}  .then(res => res.json()).then(async ${resVar} => {\n${node.successBody.map(s => gen(s)).join('\n')}\n${indent()}  })`;
    }
    if (node.errorBody) {
      const errVar = node.errorVar || 'err';
      output += `\n${indent()}  .catch(async ${errVar} => {\n${node.errorBody.map(s => gen(s)).join('\n')}\n${indent()}  })`;
    }
    return output + ';';
  }

  function genUpdateDataStatement(node) {
    const urlCode = gen(node.url);
    const bodyCode = node.payload ? `, body: JSON.stringify(${gen(node.payload)})` : '';
    let output = `${indent()}return boltFetch(${urlCode}, { method: 'PUT', headers: { 'Content-Type': 'application/json' }${bodyCode} })`;
    if (node.successBody) {
      const resVar = node.successVar || 'res';
      output += `\n${indent()}  .then(res => res.json()).then(async ${resVar} => {\n${node.successBody.map(s => gen(s)).join('\n')}\n${indent()}  })`;
    }
    if (node.errorBody) {
      const errVar = node.errorVar || 'err';
      output += `\n${indent()}  .catch(async ${errVar} => {\n${node.errorBody.map(s => gen(s)).join('\n')}\n${indent()}  })`;
    }
    return output + ';';
  }

  function genDeleteDataStatement(node) {
    const urlCode = gen(node.url);
    let output = `${indent()}return boltFetch(${urlCode}, { method: 'DELETE' })`;
    if (node.successBody) {
      const resVar = node.successVar || 'res';
      output += `\n${indent()}  .then(res => res.json()).then(async ${resVar} => {\n${node.successBody.map(s => gen(s)).join('\n')}\n${indent()}  })`;
    }
    if (node.errorBody) {
      const errVar = node.errorVar || 'err';
      output += `\n${indent()}  .catch(async ${errVar} => {\n${node.errorBody.map(s => gen(s)).join('\n')}\n${indent()}  })`;
    }
    return output + ';';
  }

  function genInputStatement(node) {
    const cls = mergeClass('', node.style);
    let output = `${indent()}<div className="flex flex-col gap-1">\n`;
    output += `${indent()}  <input placeholder={${gen(node.placeholder)}} value={${node.variable}} onChange={(e) => set${capitalize(node.variable)}(e.target.value)}${cls} />\n`;
    if (node.validations && node.validations.length > 0) {
      output += `${indent()}  {${node.variable}Error && <span className="text-red-500 text-sm">{${node.variable}Error}</span>}\n`;
    }
    output += `${indent()}</div>`;
    return output;
  }

  function genFormBlock(node) {
    const inputs = collectNodes(node.body, 'InputStatement').filter(n => n.validations && n.validations.length > 0);
    
    let valFunc = `${indent()}  const validateForm = () => {\n`;
    valFunc += `${indent()}    let isValid = true;\n`;
    for (const inp of inputs) {
      valFunc += `${indent()}    let _${inp.variable}Err = '';\n`;
      for (const rule of inp.validations) {
        if (rule.ruleType === 'required') {
          valFunc += `${indent()}    if (!${inp.variable} || ${inp.variable}.trim() === '') _${inp.variable}Err = _${inp.variable}Err || '${capitalize(inp.variable)} is required';\n`;
        } else if (rule.ruleType === 'email') {
          valFunc += `${indent()}    if (${inp.variable} && !/^\\S+@\\S+\\.\\S+$/.test(${inp.variable})) _${inp.variable}Err = _${inp.variable}Err || 'Invalid email format';\n`;
        } else if (rule.ruleType === 'min') {
          valFunc += `${indent()}    if (${inp.variable} && ${inp.variable}.length < ${gen(rule.value)}) _${inp.variable}Err = _${inp.variable}Err || 'Minimum length is ' + ${gen(rule.value)};\n`;
        } else if (rule.ruleType === 'max') {
          valFunc += `${indent()}    if (${inp.variable} && ${inp.variable}.length > ${gen(rule.value)}) _${inp.variable}Err = _${inp.variable}Err || 'Maximum length is ' + ${gen(rule.value)};\n`;
        } else if (rule.ruleType === 'match') {
          valFunc += `${indent()}    if (${inp.variable} !== ${gen(rule.value)}) _${inp.variable}Err = _${inp.variable}Err || 'Must match ${gen(rule.value).replace(/"/g, '')}';\n`;
        }
      }
      valFunc += `${indent()}    set${capitalize(inp.variable)}Error(_${inp.variable}Err);\n`;
      valFunc += `${indent()}    if (_${inp.variable}Err) isValid = false;\n`;
    }
    valFunc += `${indent()}    return isValid;\n`;
    valFunc += `${indent()}  };\n`;

    let submitBlock = null;
    let otherStmts = [];
    for (const stmt of node.body) {
      if (stmt.type === 'FormSubmit') submitBlock = stmt;
      else otherStmts.push(stmt);
    }

    let onSubmit = '';
    if (submitBlock) {
      let submitBody = submitBlock.body.map(s => gen(s)).join('\n');
      onSubmit = `async (e) => { e.preventDefault(); if (validateForm()) { ${submitBody.trim()} } }`;
    } else {
      onSubmit = `(e) => { e.preventDefault(); validateForm(); }`;
    }

    let output = `${indent()}{(() => {\n`;
    output += valFunc;
    const baseCls = mergeClass('space-y-4', node.style);
    output += `${indent()}  return <form${baseCls} onSubmit={${onSubmit}}>\n`;
    indentLevel++;
    output += genBody(otherStmts);
    if (submitBlock) {
      const btnCls = mergeClass("px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-blue-600 text-white hover:bg-blue-700", submitBlock.style);
      output += `${indent()}<button type="submit"${btnCls}>${gen(submitBlock.label).replace(/"/g, '')}</button>\n`;
    }
    indentLevel--;
    output += `${indent()}  </form>;\n`;
    output += `${indent()}})()}`;
    return output;
  }

  function genWhenChanges(node) {
    let output = `${indent()}useEffect(() => {\n`;
    indentLevel++;
    output += genBody(node.body);
    indentLevel--;
    output += `${indent()}}, [${node.variable}]);`;
    return output;
  }

  function genGoTo(node) {
    const basePath = node.target.toLowerCase() === 'home' ? '/' : `/${node.target.toLowerCase()}`;
    
    if (node.args && node.args.length > 0) {
      const argParts = node.args.map(a => '${' + gen(a) + '}').join('/');
      return `${indent()}navigate(\`${basePath}/${argParts}\`);`;
    }
    
    return `${indent()}navigate('${basePath}');`;
  }

  // ── Phase 4: Auth ─────────────────────────────────────────
  function genLoginStatement(node) {
    const url = gen(node.url);
    const data = gen(node.data);
    let output = `${indent()}await boltFetch(${url}, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(${data}) })\n`;
    output += `${indent()}  .then(res => res.json()).then(data => {\n`;
    output += `${indent()}    if (data.token || data.user) loginUser(data);\n`;
    output += `${indent()}  })\n`;
    output += `${indent()}  .catch(err => console.error(err));`;
    return output;
  }

  function genLogoutStatement(node) {
    return `${indent()}logoutUser();`;
  }

  function genLoggedInExpression(node) {
    return `isLoggedIn`;
  }

  // ── Phase 2c: State ───────────────────────────────────────
  function genStoreDeclaration(node) {
    const setterName = 'set' + capitalize(node.name);
    scopes.declare(node.name);
    scopes.declare(setterName);
    return `${indent()}const [${node.name}, ${setterName}] = useState(${gen(node.value)});`;
  }

  function genRememberDeclaration(node) {
    const setterName = 'set' + capitalize(node.name);
    const key = 'bolt_' + node.name;
    const defaultVal = gen(node.value);
    scopes.declare(node.name);
    scopes.declare(setterName);
    let output = `${indent()}const [${node.name}, ${setterName}] = useState(() => {\n`;
    indentLevel++;
    output += `${indent()}try {\n`;
    indentLevel++;
    output += `${indent()}const stored = localStorage.getItem('${key}');\n`;
    output += `${indent()}return stored !== null ? JSON.parse(stored) : ${defaultVal};\n`;
    indentLevel--;
    output += `${indent()}} catch { return ${defaultVal}; }\n`;
    indentLevel--;
    output += `${indent()}});\n`;
    output += `${indent()}useEffect(() => {\n`;
    indentLevel++;
    output += `${indent()}localStorage.setItem('${key}', JSON.stringify(${node.name}));\n`;
    indentLevel--;
    output += `${indent()}}, [${node.name}]);`;
    return output;
  }

  function genForgetStatement(node) {
    const setterName = 'set' + capitalize(node.name);
    const key = 'bolt_' + node.name;
    return `${indent()}localStorage.removeItem('${key}');\n${indent()}${setterName}(undefined);`;
  }

  function genClearStatement(node) {
    const setterName = 'set' + capitalize(node.name);
    if (scopes.isDeclared(setterName)) {
      return `${indent()}${setterName}([]);`;
    }
    if (isGlobalStore(node.name)) {
      return `${indent()}updateStore(s => { s.${node.name} = []; });`;
    }
    return `${indent()}${node.name} = [];`;
  }

  // ── Phase 3: Actions ──────────────────────────────────────
  function genActionDef(node) {
    const params = node.params.join(', ');
    const body = genBody(node.body);
    return `export async function ${node.name}(${params}) {\n${body}}`;
  }

  function genRunExpression(node) {
    const args = node.args.map(a => gen(a)).join(', ');
    return `await actions.${node.actionName}(${args})`;
  }

  return gen(ast);
}

// ── Generate with runtime header ────────────────────────────────────

/**
 * Generates JavaScript code from a Bolt AST, prepended with a
 * compiler header comment. (Phase 1 — no runtime import needed
 * since we use console.log directly.)
 *
 * @param {object} ast - The root Program node from the parser.
 * @returns {string} The generated JavaScript code with header.
 */
export function generateWithRuntime(ast) {
  const header = '// Generated by Bolt Compiler v0.1';
  const code = generate(ast);
  return `${header}\n${code}`;
}

export function generateNode(node, registryOrOptions = null, globalStoresList = []) {
  const dummyProgram = { type: 'Program', body: [node], line: node.line };
  return generate(dummyProgram, registryOrOptions, globalStoresList).trim();
}
