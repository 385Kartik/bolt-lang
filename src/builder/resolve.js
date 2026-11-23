// ─── Bolt — Import-by-name resolver ────────────────────────────────────
// `use helpers` finds helpers.js (or .bolt/.json/.css ...) ANYWHERE in the
// project. No paths, no "../../". The compiler works out the relative path.

import fs from 'fs';
import path from 'path';

const IMPORTABLE_EXTS = ['.bolt', '.js', '.mjs', '.jsx', '.ts', '.tsx', '.json', '.css'];
const SKIP_DIRS = new Set(['node_modules', '.bolt-generated', 'dist', 'build', 'coverage']);

function walk(dir, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name) || e.name.startsWith('.')) continue;
      walk(path.join(dir, e.name), out);
    } else if (IMPORTABLE_EXTS.includes(path.extname(e.name).toLowerCase())) {
      out.push(path.join(dir, e.name));
    }
  }
}

export function editDistance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[a.length][b.length];
}

// "my-utils" → "myUtils", "2fa" → "_2fa"
export function toBinding(stem) {
  let id = stem.replace(/[^A-Za-z0-9_$]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''));
  if (/^[0-9]/.test(id)) id = '_' + id;
  return id;
}

function fail(message, hint, use) {
  const where = use && use.fileName ? ` (in ${use.fileName}.bolt, line ${use.line})` : '';
  return new Error(`\n  ⚡ Compiler Error${where}:\n     ${message}\n${hint ? `\n  💡 Hint: ${hint}\n` : ''}`);
}

// Is this a legacy path/glob style use ("components/*")? Those are no-ops:
// every .bolt file in the project is already merged automatically.
function isLegacy(target) {
  return target.includes('/') || target.includes('*') || target.includes('\\');
}

// Returns [{ fileName, line, abs, ext, binding }] for every `use <name>` statement.
export function resolveUses(useNodes, projectRoot) {
  const wanted = useNodes.filter(u => u.path && !isLegacy(u.path));
  if (wanted.length === 0) return [];

  const files = [];
  walk(projectRoot, files);
  const rel = f => path.relative(projectRoot, f).split(path.sep).join('/');

  const resolved = [];
  for (const use of wanted) {
    const target = use.path.trim();
    const hasExt = IMPORTABLE_EXTS.includes(path.extname(target).toLowerCase());

    const matches = files.filter(f => {
      const base = path.basename(f);
      return hasExt ? base === target : path.basename(f, path.extname(f)) === target;
    });

    if (matches.length === 0) {
      const stems = [...new Set(files.map(f => path.basename(f, path.extname(f))))];
      const near = stems
        .filter(s => editDistance(s.toLowerCase(), target.toLowerCase()) <= 2 || s.toLowerCase().includes(target.toLowerCase()))
        .slice(0, 3);
      throw fail(
        `Cannot find a file named '${target}' anywhere in the project.`,
        near.length ? `Did you mean: ${near.join(', ')}?` : `Create '${target}.bolt' (or .js/.json/.css) anywhere in your project.`,
        use
      );
    }
    if (matches.length > 1) {
      throw fail(
        `'${target}' matches ${matches.length} files:\n       ${matches.map(rel).join('\n       ')}`,
        (hasExt || new Set(matches.map(m => path.basename(m))).size === 1)
          ? 'Rename one of them so every file name in the project is unique.'
          : `Use the full file name (for example 'use ${path.basename(matches[0])}') or rename one of the files.`,
        use
      );
    }

    const abs = matches[0];
    const ext = path.extname(abs).toLowerCase();
    resolved.push({
      fileName: use.fileName,
      line: use.line,
      abs,
      ext,
      binding: toBinding(path.basename(abs, path.extname(abs)))
    });
  }
  return resolved;
}

// Builds the import lines a generated file needs, with computed relative paths.
// `generatedDir` is the folder the generated file lives in.
export function importLinesFor(uses, nodeFileName, generatedDir) {
  const lines = [];
  const seen = new Set();
  for (const u of uses) {
    if (u.ext === '.bolt') continue; // already merged globally
    if (u.fileName && nodeFileName && u.fileName !== nodeFileName) continue;
    if (seen.has(u.abs)) continue;
    seen.add(u.abs);

    let rel = path.relative(generatedDir, u.abs).split(path.sep).join('/');
    if (!rel.startsWith('.')) rel = './' + rel;

    if (u.ext === '.css') lines.push(`import '${rel}';`);
    else if (u.ext === '.json') lines.push(`import ${u.binding} from '${rel}';`);
    else lines.push(`import * as ${u.binding} from '${rel}';`);
  }
  return lines.length ? lines.join('\n') + '\n' : '';
}
