import { compile } from '../src/index.js';

const test = `function clamp val, min, max:
    if val < min: give min
    if val > max: give max
    give val

result = clamp 150, 0, 100
print result`;

try {
  const js = compile(test);
  console.log('=== JS ===');
  console.log(js);
  console.log('=== Run ===');
  new Function(js)();
} catch(e) {
  console.log('ERR:', e.message, 'L:', e.line, 'C:', e.column);
  if (e.hint) console.log('Hint:', e.hint);
}
