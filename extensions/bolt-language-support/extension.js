// Bolt Language Support for VS Code
//   - colors for every Bolt keyword (see syntaxes/bolt.tmLanguage.json)
//   - snippets (type "page", "resource", "styles" ... and press Tab)
//   - suggestions for component, page, style and file names
//   - problems shown in the editor, from the real compiler (`bolt check`)

'use strict';

const vscode = require('vscode');
const path = require('path');
const { scanSource, mergeScans, contextAt } = require('./lib/scan.js');
const { runBolt, groupErrors } = require('./lib/cli.js');

let diagnostics;
let statusItem;
let checkTimer;
let warnedMissingCli = false;

const KEYWORDS = [
  'page', 'component', 'action', 'resource', 'layout', 'styles', 'slot', 'use',
  'show', 'button', 'link', 'input', 'form', 'submit', 'image', 'video', 'toast', 'modal',
  'row', 'column', 'grid', 'card', 'hero', 'section', 'container',
  'store', 'remember', 'global store', 'persist', 'clear', 'forget',
  'fetch', 'update', 'delete', 'loading', 'error', 'success', 'empty',
  'if', 'otherwise', 'for every', 'repeat', 'when', 'give', 'print', 'run', 'go to',
  'add', 'remove', 'login', 'logout', 'if logged in'
];

const WORKSPACE_GLOB = '**/*.bolt';
const EXCLUDE_GLOB = '**/{node_modules,.bolt-generated,dist}/**';

function config() {
  return vscode.workspace.getConfiguration('bolt');
}

// ── Project knowledge for suggestions ─────────────────────────────────

async function scanWorkspace() {
  const files = await vscode.workspace.findFiles(WORKSPACE_GLOB, EXCLUDE_GLOB, 500);
  const scans = [];
  const names = [];
  for (const uri of files) {
    names.push(path.basename(uri.fsPath, '.bolt'));
    try {
      const doc = await vscode.workspace.openTextDocument(uri);
      scans.push(scanSource(doc.getText()));
    } catch { /* unreadable file: skip */ }
  }
  // files you can `use` by name: .bolt, .js, .ts, .json, .css anywhere in the project
  const others = await vscode.workspace.findFiles('**/*.{js,mjs,ts,json,css}', EXCLUDE_GLOB, 500);
  const useNames = new Set(names);
  for (const uri of others) {
    const base = path.basename(uri.fsPath);
    if (/^(package(-lock)?|tsconfig|vite\.config|tailwind\.config|postcss\.config)\b/.test(base)) continue;
    useNames.add(path.basename(uri.fsPath, path.extname(uri.fsPath)));
  }
  return { ...mergeScans(scans), useNames: [...useNames].sort() };
}

function item(label, kind, detail, extra = {}) {
  const it = new vscode.CompletionItem(label, kind);
  it.detail = detail;
  return Object.assign(it, extra);
}

const completionProvider = {
  async provideCompletionItems(document, position) {
    const prefix = document.lineAt(position).text.slice(0, position.character);
    const ctx = contextAt(prefix);
    const K = vscode.CompletionItemKind;
    const known = await scanWorkspace();
    const out = [];

    if (ctx === 'file') {
      for (const n of known.useNames) out.push(item(n, K.File, 'file in your project (no path needed)'));
      return out;
    }
    if (ctx === 'style') {
      for (const s of known.styles) out.push(item(s.name, K.Color, s.classes, { sortText: '0' + s.name, documentation: `Expands to: ${s.classes}` }));
      return out;
    }
    if (ctx === 'page') {
      for (const p of known.pages) {
        const sig = p.params.length ? `${p.name}(${p.params.join(', ')})` : p.name;
        out.push(item(p.name, K.Reference, 'page', { insertText: sig }));
      }
      return out;
    }
    if (ctx === 'component') {
      for (const c of known.components) {
        const needs = c.props.length ? ` with ${c.props.map(p => `${p}=`).join(', ')}` : '';
        out.push(item(c.name, K.Class, c.props.length ? `component (takes ${c.props.join(', ')})` : 'component', { insertText: c.name + needs }));
      }
      return out;
    }

    // start of a statement: keywords + components (as wrappers)
    for (const k of KEYWORDS) out.push(item(k, K.Keyword, 'Bolt'));
    for (const c of known.components) out.push(item(c.name, K.Class, 'component'));
    return out;
  }
};

// ── Problems (from the real compiler) ─────────────────────────────────

function setStatus(text, tooltip) {
  if (!statusItem) return;
  statusItem.text = text;
  statusItem.tooltip = tooltip || '';
  statusItem.show();
}

async function checkProject(folder, triggerDoc) {
  setStatus('$(sync~spin) Bolt', 'Checking project...');
  const result = await runBolt(folder.uri.fsPath, 'check', config().get('cliPath'));

  diagnostics.clear();
  if (!result.ok) {
    setStatus('$(circle-slash) Bolt', 'Bolt command not found. Set "bolt.cliPath" or install Bolt.');
    if (result.missing && !warnedMissingCli) {
      warnedMissingCli = true;
      vscode.window.showInformationMessage(
        'Bolt: could not run the "bolt" command, so problems are not shown. ' +
        'Open your Bolt project folder, or set "bolt.cliPath" in settings.');
    }
    return;
  }

  const data = result.data;
  if (data.ok) {
    setStatus('$(check) Bolt', `No problems (${data.files} files checked)`);
    return;
  }

  const grouped = groupErrors(data.errors);
  for (const [rel, list] of grouped) {
    // errors without a file are shown on the file being edited
    let uri = rel ? vscode.Uri.joinPath(folder.uri, rel) : (triggerDoc && triggerDoc.uri);
    if (!uri) continue;
    const diags = list.map(e => {
      const line = e.line;
      const start = e.column == null ? 0 : e.column;
      const range = new vscode.Range(line, start, line, e.column == null ? Number.MAX_SAFE_INTEGER : start + 1);
      return new vscode.Diagnostic(range, e.message, vscode.DiagnosticSeverity.Error);
    });
    diags.forEach(d => { d.source = 'bolt'; });
    diagnostics.set(uri, diags);
  }
  setStatus(`$(error) Bolt ${data.errors.length}`, `${data.errors.length} problem(s) found`);
}

function scheduleCheck(document) {
  if (!config().get('checkOnSave')) return;
  const folder = vscode.workspace.getWorkspaceFolder(document.uri);
  if (!folder) return;
  clearTimeout(checkTimer);
  checkTimer = setTimeout(() => checkProject(folder, document), 300);
}

// ── Commands ──────────────────────────────────────────────────────────

async function showStats() {
  const folder = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0];
  if (!folder) return vscode.window.showWarningMessage('Open a Bolt project folder first.');
  const result = await runBolt(folder.uri.fsPath, 'stats', config().get('cliPath'));
  if (!result.ok) return vscode.window.showErrorMessage('Could not run bolt stats: ' + result.error);
  const s = result.data;
  if (!s.ok) return vscode.window.showWarningMessage('Fix the problems first (Bolt: Check Project).');
  vscode.window.showInformationMessage(
    `Bolt ${s.bolt.tokens} tokens → React ${s.react.tokens} tokens (${s.ratio}x bigger). Token counts are estimates.`);
}

async function checkNow() {
  const editor = vscode.window.activeTextEditor;
  const folder = (editor && vscode.workspace.getWorkspaceFolder(editor.document.uri)) ||
    (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0]);
  if (!folder) return vscode.window.showWarningMessage('Open a Bolt project folder first.');
  await checkProject(folder, editor && editor.document);
}

// ── Activate ──────────────────────────────────────────────────────────

function activate(context) {
  diagnostics = vscode.languages.createDiagnosticCollection('bolt');
  statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
  statusItem.command = 'bolt.check';
  context.subscriptions.push(diagnostics, statusItem);

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider({ language: 'bolt' }, completionProvider, ' ', ':', '/'),
    vscode.commands.registerCommand('bolt.check', checkNow),
    vscode.commands.registerCommand('bolt.stats', showStats),
    vscode.workspace.onDidSaveTextDocument(doc => { if (doc.languageId === 'bolt') scheduleCheck(doc); }),
    vscode.workspace.onDidOpenTextDocument(doc => { if (doc.languageId === 'bolt') scheduleCheck(doc); })
  );

  const active = vscode.window.activeTextEditor;
  if (active && active.document.languageId === 'bolt') scheduleCheck(active.document);
}

function deactivate() {
  clearTimeout(checkTimer);
  if (diagnostics) diagnostics.clear();
}

module.exports = { activate, deactivate };
