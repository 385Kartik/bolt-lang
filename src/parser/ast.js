// ─── Bolt Language — AST Node Constructors ────────────────────────────
// Every node the parser can produce. These form the Abstract Syntax Tree.
// The generator walks this tree to produce JavaScript output.
//
// Each function creates a plain object with a `type` discriminator.
// This makes the AST serializable (JSON.stringify) for testing/debugging.

// ── Program (root node) ─────────────────────────────────────────────
export function Program(body, line = 1) {
  return { type: 'Program', body, line };
}

export function UseStatement(path, line) {
  // use components/*
  return { type: 'UseStatement', path, line };
}

// ── Statements ──────────────────────────────────────────────────────

export function Assignment(name, value, line) {
  return { type: 'Assignment', name, value, line };
}

export function FunctionDef(name, params, body, line) {
  return { type: 'FunctionDef', name, params, body, line };
}

export function IfStatement(condition, body, elseIfs, elseBody, line) {
  // elseIfs: [{ condition, body }]
  // elseBody: [Statement] | null
  return { type: 'IfStatement', condition, body, elseIfs, elseBody, line };
}

export function RepeatTimes(count, body, line) {
  return { type: 'RepeatTimes', count, body, line };
}

export function RepeatFromTo(from, to, body, line) {
  return { type: 'RepeatFromTo', from, to, body, line };
}

export function RepeatUntil(condition, body, line) {
  return { type: 'RepeatUntil', condition, body, line };
}

export function ForEvery(variable, iterable, body, line) {
  return { type: 'ForEvery', variable, iterable, body, line };
}

export function GiveStatement(value, line) {
  return { type: 'GiveStatement', value, line };
}

export function PrintStatement(value, line) {
  return { type: 'PrintStatement', value, line };
}

export function ExpressionStatement(expression, line) {
  return { type: 'ExpressionStatement', expression, line };
}

// ── Expressions ─────────────────────────────────────────────────────

export function FunctionCall(name, args, line) {
  return { type: 'FunctionCall', name, args, line };
}

export function BinaryExpression(operator, left, right, line) {
  return { type: 'BinaryExpression', operator, left, right, line };
}

export function UnaryExpression(operator, operand, line) {
  return { type: 'UnaryExpression', operator, operand, line };
}

export function NumberLiteral(value, line) {
  return { type: 'NumberLiteral', value, line };
}

export function StringLiteral(value, line) {
  return { type: 'StringLiteral', value, line };
}

export function InterpolatedString(parts, line) {
  // parts: Array of StringLiteral and Expression nodes alternating.
  // "Hello {name}, age {age}" → [StringLiteral("Hello "), Identifier("name"), StringLiteral(", age "), Identifier("age")]
  return { type: 'InterpolatedString', parts, line };
}

export function BooleanLiteral(value, line) {
  return { type: 'BooleanLiteral', value, line };
}

export function Identifier(name, line) {
  return { type: 'Identifier', name, line };
}

export function ArrayLiteral(elements, line) {
  return { type: 'ArrayLiteral', elements, line };
}

export function ObjectLiteral(properties, line) {
  // properties: [{ key: string, value: Expression }]
  return { type: 'ObjectLiteral', properties, line };
}

export function MemberExpression(object, property, line) {
  return { type: 'MemberExpression', object, property, line };
}

// ── Phase 2a: Collection Operations ─────────────────────────────────

export function AddTo(value, target, line) {
  // add "Dave" to names → names.push("Dave")
  return { type: 'AddTo', value, target, line };
}

export function RemoveFrom(value, target, line) {
  // remove "Bob" from names → names.splice(names.indexOf("Bob"), 1)
  return { type: 'RemoveFrom', value, target, line };
}

export function CheckIn(value, collection, line) {
  // check if "Alice" in names → names.includes("Alice")
  return { type: 'CheckIn', value, collection, line };
}

export function CountOf(collection, line) {
  // count of names → names.length
  return { type: 'CountOf', collection, line };
}

export function FirstOf(collection, line) {
  // first of names → names[0]
  return { type: 'FirstOf', collection, line };
}

export function LastOf(collection, line) {
  // last of names → names[names.length - 1]
  return { type: 'LastOf', collection, line };
}

export function FilteredBy(collection, variable, condition, line) {
  // users filtered by user: user.age > 18
  //   → users.filter(user => user.age > 18)
  // variable is the iterator name, condition is the filter expression
  return { type: 'FilteredBy', collection, variable, condition, line };
}

export function SortedBy(collection, field, line) {
  // users sorted by name → [...users].sort((a,b) => a.name > b.name ? 1 : -1)
  return { type: 'SortedBy', collection, field, line };
}

// ── Phase 2b: UI Primitives ─────────────────────────────────────────


export function RunExpression(actionName, args, line) {
  return { type: 'RunExpression', actionName, args, line };
}

export function ActionDef(name, params, body, line) {
  return { type: 'ActionDef', name, params, body, line };
}

export function LoginStatement(url, data, line) {
  return { type: 'LoginStatement', url, data, line };
}

export function GoTo(target, args, line) {
  // go to home
  // go to product(product.id)
  // go to store(store.id, product.id)
  return { type: 'GoTo', target, args, line };
}

export function LogoutStatement(line) {
  return { type: 'LogoutStatement', line };
}

export function LoggedInExpression(line) {
  return { type: 'LoggedInExpression', line };
}

export function PageDef(name, body, line, params = []) {
  // page home:
  // page product(id, slug):
  return { type: 'PageDef', name, body, line, params, style: null };
}

export function ShowStatement(value, hint, body, line, props = []) {
  // `hint` could be "as title", "as subtitle", etc.
  // `body` contains child statements for wrapper components
  // `props` is an array of {name: "propName", value: expression}
  return { type: 'ShowStatement', value, hint, body, line, props, style: null };
}

export function ShowToastStatement(message, variant, line) {
  return { type: 'ShowToastStatement', message, variant, line };
}

export function ShowModalStatement(message, line) {
  return { type: 'ShowModalStatement', message, line };
}

export function ShowAll(collection, componentName, layoutHint, line) {
  // show all products
  return { type: 'ShowAll', collection, componentName, layoutHint, line, style: null };
}

export function ShowForEach(componentName, variable, collection, line) {
  // show ProductCard for each product in products
  return { type: 'ShowForEach', componentName, variable, collection, line, style: null };
}

export function ButtonStatement(label, body, line) {
  // button "Click me":
  return { type: 'ButtonStatement', label, body, line, style: null };
}

export function ComponentDef(name, forVars, takes, body, line) {
  // component ProductCard for product takes isAdmin:
  return { type: 'ComponentDef', name, forVars, takes, body, line, style: null };
}

export function LinkStatement(label, target, args, line) {
  // link "Home" to home
  // link "View" to product(123)
  // link "Store" to store(store.id, product.id)
  return { type: 'LinkStatement', label, target, args, line, style: null };
}

export function InputStatement(placeholder, variable, validations, line) {
  // e.g. input "Enter name" into name
  return { type: 'InputStatement', placeholder, variable, validations, line, style: null };
}

export function ImageStatement(url, line) {
  return { type: 'ImageStatement', url, line, style: null };
}

export function VideoStatement(url, line) {
  return { type: 'VideoStatement', url, line, style: null };
}

export function FetchStatement(url, variable, loadingBody, errorVar, errorBody, emptyBody, successVar, successBody, line) {
  return { type: 'FetchStatement', url, variable, loadingBody, errorVar, errorBody, emptyBody, successVar, successBody, line };
}

export function SubmitStatement(url, payload, successVar, successBody, errorVar, errorBody, line) {
  return { type: 'SubmitStatement', url, payload, successVar, successBody, errorVar, errorBody, line };
}

export function UpdateDataStatement(url, payload, successVar, successBody, errorVar, errorBody, line) {
  return { type: 'UpdateDataStatement', url, payload, successVar, successBody, errorVar, errorBody, line };
}

export function DeleteDataStatement(url, successVar, successBody, errorVar, errorBody, line) {
  return { type: 'DeleteDataStatement', url, successVar, successBody, errorVar, errorBody, line };
}

export function WhenChanges(variable, body, line) {
  // when count changes:
  return { type: 'WhenChanges', variable, body, line };
}


// ── Phase 8: Forms & Validation ──────────────────────────────────────

export function FormBlock(body, line) {
  return { type: 'FormBlock', body, line, style: null };
}

export function ValidationRule(ruleType, value, line) {
  return { type: 'ValidationRule', ruleType, value, line };
}

export function FormSubmit(label, body, line) {
  return { type: 'FormSubmit', label, body, line, style: null };
}

// ── Layout ─────────────────────────────────────────────────────────

export const LayoutBlock = (layoutType, gridCount, style, body, line) => ({
  type: 'LayoutBlock',
  layoutType,  // 'row', 'column', or 'grid'
  gridCount,   // integer if type is 'grid', otherwise null
  style,       // RawStyle node or null
  body,        // Array of statements
  line
});

// ── Phase 5: Styling ────────────────────────────────────────────────────────

export function RawStyle(value, line) {
  // styled as: "bg-red-500 p-4"
  return { type: 'RawStyle', value, line };
}

export function NaturalStyle(properties, line) {
  // properties: [{ key: string, value: string }]
  return { type: 'NaturalStyle', properties, line };
}

// ── Phase 2c: State ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function StoreDeclaration(name, value, line) {
  // store count = 0 → const [count, setCount] = useState(0)
  return { type: 'StoreDeclaration', name, value, line };
}

export function RememberDeclaration(name, value, line) {
  // remember username = "" → useState with localStorage sync
  return { type: 'RememberDeclaration', name, value, line };
}

export function ForgetStatement(name, line) {
  // forget username → localStorage.removeItem + reset state
  return { type: 'ForgetStatement', name, line };
}

// ── Phase 9: Global Store ────────────────────────────────────────────────────────────────────────────────────────────────────

export function GlobalStoreDeclaration(name, value, persist, line) {
  return { type: 'GlobalStoreDeclaration', name, value, persist, line };
}

export function ClearStatement(name, line) {
  // clear cart → updateStore(s => { s.cart = []; }) or setLocal([])
  return { type: 'ClearStatement', name, line };
}

// ── Phase 14: Global Design System ──────────────────────────────────────────

export function DesignSystemDef(config, line) {
  return { type: 'DesignSystemDef', config, line };
}
