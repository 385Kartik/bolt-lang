// Finds and runs the Bolt command line (`bolt check --json`) for the editor.
// No VS Code needed here, so it can be tested.

'use strict';

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

// Where is the `bolt` command? In order:
//   1. the "bolt.cliPath" setting
//   2. <project>/cli/bolt.js              (a clone of the Bolt repo)
//   3. <project>/node_modules/bolt-lang/cli/bolt.js
//   4. `bolt` on the PATH
function findCli(projectRoot, configured) {
  if (configured && String(configured).trim()) return { command: String(configured).trim(), viaNode: /\.m?js$/.test(configured) };
  const candidates = [
    path.join(projectRoot, 'cli', 'bolt.js'),
    path.join(projectRoot, 'node_modules', 'bolt-lang', 'cli', 'bolt.js')
  ];
  for (const c of candidates) if (fs.existsSync(c)) return { command: c, viaNode: true };
  return { command: process.platform === 'win32' ? 'bolt.cmd' : 'bolt', viaNode: false };
}

// Runs `bolt <sub> <projectRoot> --json` and resolves with the parsed JSON.
function runBolt(projectRoot, sub, configured, timeoutMs = 30000) {
  const cli = findCli(projectRoot, configured);
  const file = cli.viaNode ? process.execPath : cli.command;
  const args = cli.viaNode ? [cli.command, sub, projectRoot, '--json'] : [sub, projectRoot, '--json'];
  return new Promise(resolve => {
    execFile(file, args, { cwd: projectRoot, timeout: timeoutMs, maxBuffer: 4 * 1024 * 1024, shell: !cli.viaNode && process.platform === 'win32' },
      (err, stdout) => {
        // `bolt check` exits with 1 when it finds problems, but still prints JSON.
        try {
          resolve({ ok: true, data: JSON.parse(String(stdout)) });
        } catch {
          resolve({ ok: false, error: err ? err.message : 'Bolt printed no result', missing: !!(err && err.code === 'ENOENT') });
        }
      });
  });
}

// Groups errors by file (relative to the project root). Errors with no file go under "".
function groupErrors(errors) {
  const byFile = new Map();
  for (const e of errors || []) {
    const key = e.file ? e.file.split(path.sep).join('/') : '';
    if (!byFile.has(key)) byFile.set(key, []);
    byFile.get(key).push({
      line: Math.max(0, (e.line || 1) - 1),
      column: e.column ? Math.max(0, e.column - 1) : null,
      message: e.hint ? `${e.message}\n💡 ${e.hint}` : e.message
    });
  }
  return byFile;
}

module.exports = { findCli, runBolt, groupErrors };
