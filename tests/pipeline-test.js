// ─── Bolt Pipeline Test ────────────────────────────────────────────────
// Quick smoke test: compile and run Bolt code through the full pipeline.

import { compile, run, compileToTokens, compileToAST } from '../src/index.js';

console.log('═══════════════════════════════════════════════');
console.log(' ⚡ Bolt Compiler — Pipeline Test');
console.log('═══════════════════════════════════════════════\n');

// ── Test 1: Simple variable + print ──────────────────────────────────
console.log('── Test 1: Variables + Print ──');
const test1 = `name = "Kartik"
age = 25
print "Hello!"
print name`;

try {
  const js1 = compile(test1);
  console.log('✅ Compiled successfully:');
  console.log(js1);
  console.log('');
} catch (e) {
  console.log('❌ Failed:', e.message);
  if (e.line) console.log(`   Line: ${e.line}, Col: ${e.column}`);
  if (e.hint) console.log(`   Hint: ${e.hint}`);
  console.log('');
}

// ── Test 2: String interpolation ─────────────────────────────────────
console.log('── Test 2: String Interpolation ──');
const test2 = `name = "World"
print "Hello, {name}!"`;

try {
  const js2 = compile(test2);
  console.log('✅ Compiled:');
  console.log(js2);
  console.log('');
} catch (e) {
  console.log('❌ Failed:', e.message);
  if (e.line) console.log(`   Line: ${e.line}, Col: ${e.column}`);
  if (e.hint) console.log(`   Hint: ${e.hint}`);
  console.log('');
}

// ── Test 3: Functions ────────────────────────────────────────────────
console.log('── Test 3: Functions ──');
const test3 = `function add a, b:
    give a + b

result = add 5 and 10
print result`;

try {
  const js3 = compile(test3);
  console.log('✅ Compiled:');
  console.log(js3);
  console.log('');
} catch (e) {
  console.log('❌ Failed:', e.message);
  if (e.line) console.log(`   Line: ${e.line}, Col: ${e.column}`);
  if (e.hint) console.log(`   Hint: ${e.hint}`);
  console.log('');
}

// ── Test 4: Conditionals ─────────────────────────────────────────────
console.log('── Test 4: Conditionals ──');
const test4 = `age = 25

if age >= 18:
    print "Adult"
otherwise if age >= 13:
    print "Teen"
otherwise:
    print "Kid"`;

try {
  const js4 = compile(test4);
  console.log('✅ Compiled:');
  console.log(js4);
  console.log('');
} catch (e) {
  console.log('❌ Failed:', e.message);
  if (e.line) console.log(`   Line: ${e.line}, Col: ${e.column}`);
  if (e.hint) console.log(`   Hint: ${e.hint}`);
  console.log('');
}

// ── Test 5: Loops ────────────────────────────────────────────────────
console.log('── Test 5: Loops ──');
const test5 = `repeat 3 times:
    print current

repeat from 1 to 5:
    print current

names = ["Alice", "Bob"]
for every n in names:
    print n`;

try {
  const js5 = compile(test5);
  console.log('✅ Compiled:');
  console.log(js5);
  console.log('');
} catch (e) {
  console.log('❌ Failed:', e.message);
  if (e.line) console.log(`   Line: ${e.line}, Col: ${e.column}`);
  if (e.hint) console.log(`   Hint: ${e.hint}`);
  console.log('');
}

// ── Test 6: Inline if ────────────────────────────────────────────────
console.log('── Test 6: Inline If ──');
const test6 = `active = true
if active: print "Online"`;

try {
  const js6 = compile(test6);
  console.log('✅ Compiled:');
  console.log(js6);
  console.log('');
} catch (e) {
  console.log('❌ Failed:', e.message);
  if (e.line) console.log(`   Line: ${e.line}, Col: ${e.column}`);
  if (e.hint) console.log(`   Hint: ${e.hint}`);
  console.log('');
}

// ── Test 7: Complex expression in interpolation ──────────────────────
console.log('── Test 7: Expression Interpolation ──');
const test7 = `price = 100
qty = 3
print "Total: {price * qty}"`;

try {
  const js7 = compile(test7);
  console.log('✅ Compiled:');
  console.log(js7);
  console.log('');
} catch (e) {
  console.log('❌ Failed:', e.message);
  if (e.line) console.log(`   Line: ${e.line}, Col: ${e.column}`);
  if (e.hint) console.log(`   Hint: ${e.hint}`);
  console.log('');
}

// ── Test 8: Objects + Member Access ──────────────────────────────────
console.log('── Test 8: Objects ──');
const test8 = `user = {name: "Kartik", age: 25}
print user.name`;

try {
  const js8 = compile(test8);
  console.log('✅ Compiled:');
  console.log(js8);
  console.log('');
} catch (e) {
  console.log('❌ Failed:', e.message);
  if (e.line) console.log(`   Line: ${e.line}, Col: ${e.column}`);
  if (e.hint) console.log(`   Hint: ${e.hint}`);
  console.log('');
}

console.log('═══════════════════════════════════════════════');
console.log(' Tests complete!');
console.log('═══════════════════════════════════════════════');
