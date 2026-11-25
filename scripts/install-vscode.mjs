// Installs the Bolt VS Code extension for you:  npm run install:vscode
// It copies extensions/bolt-language-support into your VS Code extensions folder.
// Restart VS Code afterwards (or run "Developer: Reload Window").

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = path.resolve(here, '..', 'extensions', 'bolt-language-support');
const pkg = JSON.parse(fs.readFileSync(path.join(source, 'package.json'), 'utf-8'));
const target = path.join(os.homedir(), '.vscode', 'extensions', `${pkg.publisher}.${pkg.name}-${pkg.version}`);

// Remove older copies of this extension so VS Code does not load two versions.
const extensionsDir = path.dirname(target);
fs.mkdirSync(extensionsDir, { recursive: true });
for (const name of fs.readdirSync(extensionsDir)) {
  if (name.startsWith(`${pkg.publisher}.${pkg.name}-`) || name === pkg.name) {
    fs.rmSync(path.join(extensionsDir, name), { recursive: true, force: true });
  }
}

fs.cpSync(source, target, { recursive: true, filter: src => !src.endsWith('.vsix') });
console.log(`\n  ⚡ Bolt extension ${pkg.version} installed in:\n     ${target}\n`);
console.log('  Restart VS Code (or run "Developer: Reload Window") to start using it.\n');
