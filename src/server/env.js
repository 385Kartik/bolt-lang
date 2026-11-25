// Reads a `.env` file (KEY=value lines) into process.env, so secrets such as API keys
// stay out of your code and out of git. Values already set in the real environment win.
//
//   # comments and blank lines are ignored
//   STRIPE_KEY=sk_test_123
//   GREETING="hello world"
//
// In an endpoint you read them as  env.STRIPE_KEY

import fs from 'fs';
import path from 'path';

export function parseEnv(text) {
  const out = {};
  for (const rawLine of String(text).replace(/\r\n?/g, '\n').split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    const quote = value[0];
    if ((quote === '"' || quote === "'") && value.endsWith(quote) && value.length >= 2) {
      value = value.slice(1, -1);
      if (quote === '"') value = value.replace(/\\n/g, '\n');
    } else {
      value = value.replace(/\s+#.*$/, '');   // a trailing comment
    }
    out[m[1]] = value;
  }
  return out;
}

// Returns the names that were loaded.
export function loadEnvFile(root) {
  const file = path.join(root, '.env');
  let text;
  try {
    text = fs.readFileSync(file, 'utf-8');
  } catch {
    return [];
  }
  const loaded = [];
  for (const [key, value] of Object.entries(parseEnv(text))) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
      loaded.push(key);
    }
  }
  return loaded;
}
