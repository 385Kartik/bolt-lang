// ─── Bolt E2E Test — Compile and Execute ──────────────────────────────
// Compiles Bolt code to JS, then executes the JS and verifies output.

import { compile } from '../src/index.js';

let passed = 0;
let failed = 0;

function test(name, boltCode, expectedLines) {
  try {
    const js = compile(boltCode);
    
    // Capture console.log output
    const logs = [];
    const origLog = console.log;
    console.log = (...args) => logs.push(args.join(' '));
    
    // Execute the generated JS
    const fn = new Function(js);
    fn();
    
    console.log = origLog;
    
    // Verify output
    const actual = logs.join('\n');
    const expected = expectedLines.join('\n');
    
    if (actual === expected) {
      origLog(`  ✅ ${name}`);
      passed++;
    } else {
      origLog(`  ❌ ${name}`);
      origLog(`     Expected: ${JSON.stringify(expected)}`);
      origLog(`     Got:      ${JSON.stringify(actual)}`);
      failed++;
    }
  } catch (e) {
    const origLog = console.log;
    if (typeof console.log !== 'function') console.log = origLog;
    console.log = origLog;
    console.log(`  ❌ ${name} — ERROR: ${e.message}`);
    if (e.line) console.log(`     Line ${e.line}, Col ${e.column}`);
    if (e.hint) console.log(`     Hint: ${e.hint}`);
  }
}

function testOutput(name, boltCode, expectedJsContains) {
  try {
    const js = compile(boltCode);
    let allFound = true;
    for (const expected of expectedJsContains) {
      if (!js.includes(expected)) {
        allFound = false;
        console.log(`  ❌ ${name}`);
        console.log(`     Expected to find: ${JSON.stringify(expected)}`);
        console.log(`     In generated JS:\\n${js}`);
        failed++;
        return;
      }
    }
    
    if (allFound) {
      console.log(`  ✅ ${name}`);
      passed++;
    }
  } catch (e) {
    console.log(`  ❌ ${name} — ERROR: ${e.message}`);
    if (e.line) console.log(`     Line ${e.line}, Col ${e.column}`);
    failed++;
  }
}


console.log('');
console.log('═══════════════════════════════════════════════');
console.log(' ⚡ Bolt E2E Tests — Compile + Execute');
console.log('═══════════════════════════════════════════════');
console.log('');

// ── Variables ────────────────────────────────────────────────────────
test('Variables — basic assignment', 
  `name = "Kartik"
age = 25
print name
print age`,
  ['Kartik', '25']
);

test('Variables — reassignment', 
  `x = 10
print x
x = 20
print x`,
  ['10', '20']
);

// ── Functions ────────────────────────────────────────────────────────
test('Functions — single arg',
  `function greet name:
    print name

greet "Hello"`,
  ['Hello']
);

test('Functions — two args with AND',
  `function add a, b:
    give a + b

result = add 5 and 10
print result`,
  ['15']
);

test('Functions — three args with commas',
  `function clamp val, min, max:
    if val < min: give min
    if val > max: give max
    give val

print clamp 150, 0, 100
print clamp (-5), 0, 100
print clamp 50, 0, 100`,
  ['100', '0', '50']
);

// ── Conditionals ─────────────────────────────────────────────────────
test('Conditionals — if/otherwise if/otherwise',
  `age = 25

if age >= 18:
    print "Adult"
otherwise if age >= 13:
    print "Teen"
otherwise:
    print "Kid"`,
  ['Adult']
);

test('Conditionals — inline if',
  `active = true
if active: print "Online"`,
  ['Online']
);

// ── Loops ────────────────────────────────────────────────────────────
test('Loops — repeat N times',
  `repeat 3 times:
    print current`,
  ['0', '1', '2']
);

test('Loops — repeat from/to',
  `repeat from 1 to 3:
    print current`,
  ['1', '2', '3']
);

test('Loops — for every',
  `names = ["Alice", "Bob", "Charlie"]
for every name in names:
    print name`,
  ['Alice', 'Bob', 'Charlie']
);

// ── String Interpolation ─────────────────────────────────────────────
test('Strings — basic interpolation',
  `name = "World"
print "Hello, {name}!"`,
  ['Hello, World!']
);

test('Strings — expression interpolation',
  `price = 100
qty = 3
print "Total: {price * qty}"`,
  ['Total: 300']
);

test('Strings — multiple interpolations',
  `name = "Kartik"
age = 25
print "{name} is {age} years old"`,
  ['Kartik is 25 years old']
);

// ── Objects + Arrays ─────────────────────────────────────────────────
test('Objects — member access',
  `user = {name: "Kartik", age: 25}
print user.name
print user.age`,
  ['Kartik', '25']
);

test('Arrays — basic',
  `nums = [1, 2, 3]
for every n in nums:
    print n`,
  ['1', '2', '3']
);

// ── Expressions ──────────────────────────────────────────────────────
test('Expressions — arithmetic',
  `a = 10
b = 3
print a + b
print a - b
print a * b`,
  ['13', '7', '30']
);

test('Expressions — boolean logic',
  `x = true
y = false
if x and not y:
    print "yes"`,
  ['yes']
);

// ── Combined ─────────────────────────────────────────────────────────
test('Combined — function + loop + interpolation',
  `function double n:
    give n * 2

repeat from 1 to 3:
    result = double current
    print "double({current}) = {result}"`,
  ['double(1) = 2', 'double(2) = 4', 'double(3) = 6']
);

// ── Phase 2a: Collections ────────────────────────────────────────────
test('Collections — basic operations',
  `names = ["Alice", "Bob"]
add "Charlie" to names
print count of names
print first of names
print last of names
remove "Bob" from names
if check if "Charlie" in names:
    print "Charlie is here"`,
  ['3', 'Alice', 'Charlie', 'Charlie is here']
);

test('Collections — filtered by',
  `nums = [1, 2, 3, 4]
evens = nums filtered by item % 2 == 0
for every n in evens:
    print n`,
  ['2', '4']
);

test('Collections — sorted by',
  `users = [{name: "Zoe", age: 30}, {name: "Alice", age: 25}]
sorted = users sorted by name
print first of sorted.name`,
  ['Alice']
);

// ── Phase 2b: UI Primitives ──────────────────────────────────────────
testOutput('UI — page and basic show',
  `page home:
    show "Welcome" as title
    show "Subtitle" as subtitle`,
  [
    'export default function HomePage() {',
    '<h1>Welcome</h1>',
    '<h2>Subtitle</h2>'
  ]
);

testOutput('UI — components and button',
  `component Card for user:
    show user.name as title
    button "Click Me":
        print "Clicked"`,
  [
    'function Card({ user, children }) {',
    '<h1>{user.name}</h1>',
    'onClick={async () => { console.log("Clicked"); }}>Click Me</button>'
  ]
);

testOutput('UI — show all inference',
  `component UserRow for user:
    show user.email as text

page UsersPage:
    store users = [{email: "a@b.com"}]
    show all users`,
  [
    '{users.map((user, i) => <UserRow key={i} user={user} />)}'
  ]
);

testOutput('UI — inputs and links',
  `page login:
    input "Enter name" into name
    link "Go back" to "/home"`,
  [
    'export default function LoginPage() {',
    '<input placeholder={"Enter name"} value={name} onChange={(e) => setName(e.target.value)} />',
    '<Link to="/">Go back</Link>'
  ]
);

// ── Phase 2c: State ──────────────────────────────────────────────────
testOutput('State — store and remember',
  `page home:
    store count = 0
    remember username = "Guest"
    when count changes:
        print "Count is {count}"`,
  [
    'const [count, setCount] = useState(0);',
    'const [username, setUsername] = useState(() => {',
    'localStorage.getItem(\'bolt_username\');',
    'useEffect(() => {',
    'localStorage.setItem(\'bolt_username\', JSON.stringify(username));',
    'console.log(`Count is ${count}`);'
  ]
);

// ── Summary ──────────────────────────────────────────────────────────
console.log('');
console.log('───────────────────────────────────────────────');
console.log(`  Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log('───────────────────────────────────────────────');
console.log('');

if (failed > 0) {
  process.exit(1);
}
