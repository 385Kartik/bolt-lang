import fs from 'fs';
import path from 'path';
import { tokenize } from '../lexer/lexer.js';
import { parse } from '../parser/parser.js';
import { generateNode } from '../generator/generator.js';
import { SourceMapGenerator } from 'source-map';
import { resolveUses, importLinesFor } from './resolve.js';

function processMarkersAndSourceMaps(fileName, rawCode, prefixCode, rawSource = '') {
  const sourceMap = new SourceMapGenerator({ file: fileName });
  const lines = rawCode.split('\n');
  const prefixLines = prefixCode.split('\n').length;
  
  let cleanedLines = [];
  const lineMap = {};

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const match = line.match(/\/\*__L:(\d+)\*\//);
    if (match) {
      const origLine = parseInt(match[1], 10);
      const generatedLine = prefixLines + i;
      
      sourceMap.addMapping({
        generated: { line: generatedLine, column: 0 },
        original: { line: origLine, column: 0 },
        source: 'app.bolt'
      });
      
      lineMap[generatedLine] = origLine;
      line = line.replace(match[0], '');
    }
    cleanedLines.push(line);
  }

  if (rawSource) {
    sourceMap.setSourceContent('app.bolt', rawSource);
  }

  const mapCode = `\nwindow.__BOLT_MAPS = window.__BOLT_MAPS || {};\nwindow.__BOLT_MAPS['${fileName}'] = ${JSON.stringify(lineMap)};`;
  const finalCode = prefixCode + '\n' + cleanedLines.join('\n') + mapCode + `\n//# sourceMappingURL=${fileName}.map`;
  const mapContent = sourceMap.toString();
  
  return { finalCode, mapContent };
}

export function buildProject(ast, outDir = 'dist', rawSource = '', options = {}) {
  // Project root = where .bolt files live. Used to find `use <name>` files anywhere.
  const projectRoot = options.projectRoot || path.resolve(outDir, '..', '..');
  console.log(`  ⚡ Building Bolt framework app in ./${outDir}...`);
  
  // 1. AST is already parsed and provided
  
  // 2. Separate AST nodes
  const pages = [];
  const components = [];
  const actions = [];
  const states = [];
  const globalStores = [];
  const others = [];
  const designSystems = [];
  const stylesDefs = [];
  const layoutDefs = [];
  const useNodes = [];

  for (const node of ast.body) {
    if (node.type === 'PageDef') {
      pages.push(node);
    } else if (node.type === 'ComponentDef') {
      components.push(node);
    } else if (node.type === 'ActionDef') {
      actions.push(node);
    } else if (node.type === 'StoreDeclaration' || node.type === 'RememberDeclaration') {
      states.push(node);
    } else if (node.type === 'GlobalStoreDeclaration') {
      globalStores.push(node);
    } else if (node.type === 'DesignSystemDef') {
      designSystems.push(node);
    } else if (node.type === 'StylesDef') {
      stylesDefs.push(node);
    } else if (node.type === 'LayoutDef') {
      layoutDefs.push(node);
    } else if (node.type === 'UseStatement') {
      useNodes.push(node);
    } else {
      others.push(node);
    }
  }

  // ── Phase 14: Global Design System Validation ──────────
  if (designSystems.length > 1) {
    throw new Error(`\n  ⚡ Compiler Error:\n     Only one 'design system' may exist per project.\n`);
  }
  let designSystemConfig = { colors: {}, typography: {}, components: {}, themes: {} };
  if (designSystems.length === 1) {
    const ds = designSystems[0];
    if (ds.fileName && ds.fileName !== 'app' && ds.fileName !== 'design') {
      throw new Error(`\n  ⚡ Compiler Error:\n     Design system can only be defined in 'app.bolt' or 'design.bolt'. Found in '${ds.fileName}.bolt'.\n`);
    }
    designSystemConfig = ds.config;
    // Normalize properties
    designSystemConfig.colors = designSystemConfig.colors || {};
    designSystemConfig.typography = designSystemConfig.typography || {};
    designSystemConfig.components = designSystemConfig.components || {};
    designSystemConfig.themes = designSystemConfig.themes || {};
  }
  
  // ── Named styles: merge every `styles:` block in the project ──────
  const styleMap = {};
  const styleOrigin = {};
  for (const sd of stylesDefs) {
    for (const [name, classes] of Object.entries(sd.styles)) {
      if (Object.prototype.hasOwnProperty.call(styleMap, name)) {
        throw new Error(`\n  ⚡ Compiler Error:\n     Style '${name}' is defined twice: in '${styleOrigin[name]}.bolt' and '${sd.fileName || 'unknown'}.bolt'.\n`);
      }
      styleMap[name] = classes;
      styleOrigin[name] = sd.fileName || 'unknown';
    }
  }

  // ── layout: wrap every page in the project layout ─────────────────
  if (layoutDefs.length > 1) {
    throw new Error(`
  ⚡ Compiler Error:
     Only one 'layout:' may exist per project. Found ${layoutDefs.length}.
`);
  }
  if (layoutDefs.length === 1) {
    const isSlot = n => n && n.type === 'ExpressionStatement' && n.expression &&
      n.expression.type === 'Identifier' && n.expression.name === 'slot';
    const countSlots = nodes => nodes.reduce((c, n) => {
      if (isSlot(n)) return c + 1;
      let inner = 0;
      for (const v of Object.values(n)) if (Array.isArray(v)) inner += countSlots(v.filter(x => x && typeof x === 'object'));
      return c + inner;
    }, 0);
    const slots = countSlots(layoutDefs[0].body);
    if (slots !== 1) {
      throw new Error(`
  ⚡ Compiler Error (line ${layoutDefs[0].line}):
     'layout:' must contain exactly one 'slot' line (where each page goes). Found ${slots}.
`);
    }
    const inject = (nodes, pageBody) => {
      const out = [];
      for (const n of nodes) {
        if (isSlot(n)) { out.push(...pageBody); continue; }
        const copy = { ...n };
        for (const [k, v] of Object.entries(copy)) {
          if (Array.isArray(v) && v.every(x => x && typeof x === 'object')) copy[k] = inject(v, pageBody);
        }
        out.push(copy);
      }
      return out;
    };
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      if (page.body.some(n => n.type === 'NoLayout')) continue;
      pages[i] = { ...page, body: inject(JSON.parse(JSON.stringify(layoutDefs[0].body)), page.body) };
    }
  }
  for (let i = 0; i < pages.length; i++) {
    pages[i] = { ...pages[i], body: pages[i].body.filter(n => n.type !== 'NoLayout') };
  }

  // ── `use <name>`: find files by name anywhere in the project ──────
  const resolvedUses = resolveUses(useNodes, projectRoot);
  
  // ── Phase 15: Global Theme (Light/Dark Mode) ──────────
  let cssVariables = '';
  const twColors = { ...designSystemConfig.colors };
  
  if (designSystemConfig.themes.light || designSystemConfig.themes.dark) {
    const light = designSystemConfig.themes.light || {};
    const dark = designSystemConfig.themes.dark || {};
    
    // Add all keys from light/dark to Tailwind theme extending CSS variables
    const themeKeys = new Set([...Object.keys(light), ...Object.keys(dark)]);
    for (const key of themeKeys) {
      twColors[key] = `var(--color-${key})`;
    }
    
    // Generate CSS Variable string
    if (Object.keys(light).length > 0) {
      cssVariables += `:root {\n`;
      for (const [k, v] of Object.entries(light)) {
        cssVariables += `  --color-${k}: ${v};\n`;
      }
      cssVariables += `}\n\n`;
    }
    
    if (Object.keys(dark).length > 0) {
      cssVariables += `.dark {\n`;
      for (const [k, v] of Object.entries(dark)) {
        cssVariables += `  --color-${k}: ${v};\n`;
      }
      cssVariables += `}\n`;
    }
  }

  // Write to tailwind.theme.js
  const themeExport = `export const theme = {\n  colors: ${JSON.stringify(twColors, null, 2)}\n};\n`;
  const themePath = outDir;
  if (!fs.existsSync(themePath)) fs.mkdirSync(themePath, { recursive: true });
  fs.writeFileSync(path.join(themePath, 'tailwind.theme.js'), themeExport);
  fs.writeFileSync(path.join(themePath, 'theme.css'), cssVariables);

  // ── Phase 15: Missing Token Validation ──────────
  const validColors = [...Object.keys(designSystemConfig.colors)];
  if (designSystemConfig.themes.light) validColors.push(...Object.keys(designSystemConfig.themes.light));
  
  for (const [compName, cls] of Object.entries(designSystemConfig.components)) {
    const tokens = cls.split(/\s+/);
    for (const token of tokens) {
      if (token.startsWith('bg-') || token.startsWith('text-') || token.startsWith('border-') || token.startsWith('ring-')) {
        const colorName = token.replace(/^(bg|text|border|ring)-/, '');
        // We only check if it is explicitly mapping to a token that doesn't exist and isn't a known tailwind color base.
        // We do a basic check: if the user defined themes, and the colorName matches a semantic name but it's missing.
        // Tailwind default colors are complex, so we just check if it's not a generic name.
        if (['white','black','transparent','current','gray','red','blue','green','yellow','indigo','purple','pink','slate'].some(c => colorName.startsWith(c))) continue;
        
        // If it's a bracket arbitrary value like bg-[#fff] skip
        if (colorName.startsWith('[')) continue;
        
        // If the colorName is completely unknown to our designSystem Config
        if (!validColors.includes(colorName) && validColors.length > 0) {
           throw new Error(
             `\n  ⚡ Theme Error in design system:\n` +
             `     Component '${compName}' uses color token '${token}' which is not defined in 'themes.light' or 'colors'.\n`
           );
        }
      }
    }
  }

  // ── Phase 9: Dynamic Routing — Build pageRegistry & Validate ──────
  const pageRegistry = {};
  for (const page of pages) {
    const paramCount = (page.params || []).length;
    if (pageRegistry[page.name]) {
      throw new Error(
        `\n  ⚡ Route Collision Error:\n` +
        `     Duplicate page definition: '${page.name}'\n` +
        `     Page '${page.name}' is defined on line ${pageRegistry[page.name].line} and again on line ${page.line}.\n` +
        `     Each page name must be unique.\n`
      );
    }
    pageRegistry[page.name] = { params: page.params || [], paramCount, line: page.line };
  }

  // Validate all GoTo and LinkStatement nodes across the entire AST
  function validateRouteTargets(nodes) {
    if (!nodes || typeof nodes !== 'object') return;
    if (Array.isArray(nodes)) {
      for (const n of nodes) validateRouteTargets(n);
      return;
    }
    if (nodes.type === 'GoTo' && pageRegistry[nodes.target]) {
      const expected = pageRegistry[nodes.target].paramCount;
      const received = (nodes.args || []).length;
      if (expected !== received) {
        throw new Error(
          `\n  ⚡ Route Parameter Error on line ${nodes.line}:\n` +
          `     Route '${nodes.target}' expects ${expected} parameter(s).\n` +
          `     Received ${received}.\n` +
          `\n  💡 Hint: Use 'go to ${nodes.target}(${pageRegistry[nodes.target].params.map(p => p.name).join(', ')})'\n`
        );
      }
    }
    if (nodes.type === 'LinkStatement' && pageRegistry[nodes.target]) {
      const expected = pageRegistry[nodes.target].paramCount;
      const received = (nodes.args || []).length;
      if (expected !== received) {
        throw new Error(
          `\n  ⚡ Route Parameter Error on line ${nodes.line}:\n` +
          `     Route '${nodes.target}' expects ${expected} parameter(s).\n` +
          `     Received ${received}.\n` +
          `\n  💡 Hint: Use 'link "..." to ${nodes.target}(${pageRegistry[nodes.target].params.map(p => p.name).join(', ')})'\n`
        );
      }
    }
    for (const key of Object.keys(nodes)) {
      if (key !== 'line' && key !== 'type' && typeof nodes[key] === 'object') {
        validateRouteTargets(nodes[key]);
      }
    }
  }
  validateRouteTargets(ast.body);

  // 3. Ensure directories exist
  const dirs = [
    outDir,
    path.join(outDir, 'pages'),
    path.join(outDir, 'components')
  ];

  for (const d of dirs) {
    if (!fs.existsSync(d)) {
      fs.mkdirSync(d, { recursive: true });
    }
  }

  // 8.5 Generate Registry
  const componentNames = [];
  const registry = {};
  registry.__props = {};
  registry.__takes = {};
  for (const comp of components) {
    if (comp.forVars && comp.forVars.length > 0) {
      registry[comp.forVars[0]] = comp.name;
      registry.__props[comp.name] = comp.forVars;
    }
    if (comp.takes && comp.takes.length > 0) {
      registry.__takes[comp.name] = comp.takes;
    }
    registry[comp.name] = comp.name;
  }

  // Phase 15: Validate Theme Assignments
  function validateThemeAssignments(nodes) {
    if (!nodes || typeof nodes !== 'object') return;
    if (Array.isArray(nodes)) {
      for (const n of nodes) validateThemeAssignments(n);
      return;
    }
    if (nodes.type === 'Assignment' && nodes.name === 'theme') {
      const allowed = ['light', 'dark', 'system'];
      if (nodes.value && nodes.value.type === 'StringLiteral') {
        if (!allowed.includes(nodes.value.value)) {
          throw new Error(
            `\n  ⚡ Theme Assignment Error on line ${nodes.line}:\n` +
            `     Invalid theme value: '${nodes.value.value}'.\n` +
            `     Expected: light, dark, system\n`
          );
        }
      } else {
        // Just enforce string literals for theme
        throw new Error(
          `\n  ⚡ Theme Assignment Error on line ${nodes.line}:\n` +
          `     Theme must be assigned to a string literal ("light", "dark", or "system").\n`
        );
      }
    }
    for (const key of Object.keys(nodes)) {
      if (key !== 'line' && key !== 'type' && typeof nodes[key] === 'object') {
        validateThemeAssignments(nodes[key]);
      }
    }
  }
  validateThemeAssignments(ast.body);

  // Phase 11b: Validate Component Props usage
  function validateComponentProps(nodes) {
    if (!nodes || typeof nodes !== 'object') return;
    if (Array.isArray(nodes)) {
      for (const n of nodes) validateComponentProps(n);
      return;
    }
    if (nodes.type === 'ShowStatement' && nodes.value && nodes.value.type === 'Identifier') {
      const compName = nodes.value.name;
      // We only validate if it's a known component. Wait, if it's a variable named Modal, how do we know?
      // Capitalized names are generally components.
      if (registry[compName] === compName) {
        const expectedTakes = registry.__takes[compName] || [];
        const providedProps = (nodes.props || []).map(p => p.name);
        
        for (const reqProp of expectedTakes) {
          if (!providedProps.includes(reqProp)) {
            throw new Error(
              `\n  ⚡ Prop Error on line ${nodes.line}:\n` +
              `     Component '${compName}' requires prop '${reqProp}'.\n` +
              `\n  💡 Hint: Use 'show ${compName} with ${reqProp}=...'\n`
            );
          }
        }
        
        for (const prop of providedProps) {
          if (!expectedTakes.includes(prop)) {
             throw new Error(
              `\n  ⚡ Prop Error on line ${nodes.line}:\n` +
              `     Unknown prop '${prop}' passed to component '${compName}'.\n` +
              `\n  💡 Hint: '${compName}' only takes: ${expectedTakes.join(', ') || 'nothing'}.\n`
            );
          }
        }
      } else if (nodes.props && nodes.props.length > 0) {
         throw new Error(
            `\n  ⚡ Prop Error on line ${nodes.line}:\n` +
            `     Cannot pass props to '${compName}' because it is not a defined component.\n`
         );
      }
    }
    for (const key of Object.keys(nodes)) {
      if (key !== 'line' && key !== 'type' && typeof nodes[key] === 'object') {
        validateComponentProps(nodes[key]);
      }
    }
  }
  validateComponentProps(ast.body);

  // 8.75 Generate api.js
  const apiJsCode = `
export async function boltFetch(url, options = {}) {
  const saved = localStorage.getItem('bolt_user');
  const user = saved ? JSON.parse(saved) : null;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (user && (user.token || user.jwt || user.access_token)) {
    headers.Authorization = \`Bearer \${user.token || user.jwt || user.access_token}\`;
  }

  return fetch(url, { ...options, headers });
}
  `.trim();
  fs.writeFileSync(path.join(outDir, 'api.js'), apiJsCode);
  // 8.8 Generate store.js
  let storeInitObj = '{\n';
  for (const store of globalStores) {
    storeInitObj += `  ${store.name}: ${generateNode(store.value, registry)},\n`;
  }
  
  // Phase 15: Always inject built-in global 'theme' store
  storeInitObj += `  theme: (typeof window !== 'undefined' && localStorage.getItem('bolt_theme')) || 'system',\n`;
  storeInitObj += '}';
  
  const storeJsCode = `
import { useState, useEffect } from 'react';

const storeState = ${storeInitObj};
const listeners = new Set();

export function updateStore(recipe) {
  recipe(storeState);
  listeners.forEach(l => l());
}

export function useStore(selector) {
  const [_, forceRender] = useState(0);
  useEffect(() => {
    const listener = () => forceRender(v => v + 1);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);
  return selector(storeState);
}

export function ThemeManager() {
  const theme = useStore(s => s.theme);
  
  useEffect(() => {
    let effectiveTheme = theme;
    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    if (effectiveTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    localStorage.setItem('bolt_theme', theme);
  }, [theme]);
  
  // Listen for system preference changes
  useEffect(() => {
    if (theme !== 'system') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);
  
  return null;
}
`.trim();
  fs.writeFileSync(path.join(outDir, 'store.js'), storeJsCode);

  // 9. Generate Actions
  if (actions.length > 0) {
    let actionsCode = `import { boltFetch } from './api.js';\n`;
    actionsCode += importLinesFor(resolvedUses, undefined, outDir) + '\n';
    for (const action of actions) {
      actionsCode += generateNode(action, registry, globalStores) + '\n\n';
    }
    fs.writeFileSync(path.join(outDir, 'actions.js'), actionsCode.trim());
  }

  // 10. Generate Components
  fs.mkdirSync(path.join(outDir, 'components'), { recursive: true });
  fs.mkdirSync(path.join(outDir, 'pages'), { recursive: true });

  for (const comp of components) {
    const reactCode = generateNode(comp, { 
      componentRegistry: registry, 
      isReact: true, 
      globalStoresList: globalStores,
      designSystem: designSystemConfig,
      styles: styleMap
    });
    let prefixCode = `import React, { useState, useEffect } from 'react';\nimport { Link, useNavigate } from 'react-router-dom';\n`;
    if (reactCode.includes('boltFetch')) {
      prefixCode += `import { boltFetch } from '../api.js';\n`;
    }
    if (reactCode.includes('useAuth()')) {
      prefixCode += `import { useAuth } from './AuthContext.jsx';\n`;
    }
    if (reactCode.includes('useToast()')) {
      prefixCode += `import { useToast } from './ToastContext.jsx';\n`;
    }
    if (reactCode.includes('useModal()')) {
      prefixCode += `import { useModal } from './ModalContext.jsx';\n`;
    }
    if (reactCode.includes('useStore(') || reactCode.includes('updateStore(')) {
      prefixCode += `import { useStore, updateStore } from '../store.js';\n`;
    }
    if (actions.length > 0) prefixCode += `import * as actions from '../actions.js';\n`;
    prefixCode += importLinesFor(resolvedUses, comp.fileName, path.join(outDir, 'components'));
    const { finalCode, mapContent } = processMarkersAndSourceMaps(`${comp.name}.jsx`, reactCode, prefixCode, rawSource);

    fs.writeFileSync(path.join(outDir, 'components', `${comp.name}.jsx`), finalCode);
    fs.writeFileSync(path.join(outDir, 'components', `${comp.name}.jsx.map`), mapContent);
    componentNames.push(comp.name);
  }

  // 11. Generate Pages
  const pageNames = [];
  for (const page of pages) {
    const reactCode = generateNode(page, { 
      componentRegistry: registry, 
      isReact: true, 
      globalStoresList: globalStores,
      designSystem: designSystemConfig,
      styles: styleMap
    });
    const pascalName = page.name.charAt(0).toUpperCase() + page.name.slice(1) + 'Page';
    
    // Build import statements for any components this page might use
    const pageHasParams = (page.params || []).length > 0;
    let imports = `import React, { useState, useEffect } from 'react';\nimport { Link, useNavigate${pageHasParams ? ', useParams' : ''} } from 'react-router-dom';\n`;
    if (reactCode.includes('boltFetch')) {
      imports += `import { boltFetch } from '../api.js';\n`;
    }
    if (reactCode.includes('useAuth()')) {
      imports += `import { useAuth } from '../components/AuthContext.jsx';\n`;
    }
    if (reactCode.includes('useToast()')) {
      imports += `import { useToast } from '../components/ToastContext.jsx';\n`;
    }
    if (reactCode.includes('useModal()')) {
      imports += `import { useModal } from '../components/ModalContext.jsx';\n`;
    }
    if (reactCode.includes('useStore(') || reactCode.includes('updateStore(')) {
      imports += `import { useStore, updateStore } from '../store.js';\n`;
    }
    if (actions.length > 0) imports += `import * as actions from '../actions.js';\n`;
    imports += importLinesFor(resolvedUses, page.fileName, path.join(outDir, 'pages'));
    for (const compName of componentNames) {
      if (reactCode.includes(`<${compName}`)) {
        imports += `import ${compName} from '../components/${compName}.jsx';\n`;
      }
    }

    const { finalCode, mapContent } = processMarkersAndSourceMaps(`${pascalName}.jsx`, reactCode, imports.trim(), rawSource);

    fs.writeFileSync(path.join(outDir, 'pages', `${pascalName}.jsx`), finalCode);
    fs.writeFileSync(path.join(outDir, 'pages', `${pascalName}.jsx.map`), mapContent);
    pageNames.push(pascalName);
  }

  // 11.5 Generate AuthContext.jsx
  const authContextCode = `
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('bolt_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('bolt_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('bolt_user');
    }
  }, [user]);

  const loginUser = (data) => setUser(data.user || data);
  const logoutUser = () => setUser(null);
  const isLoggedIn = !!user;

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
  `.trim();
  fs.writeFileSync(path.join(outDir, 'components', 'AuthContext.jsx'), authContextCode);

  // 11.7 Generate ToastContext.jsx
  const toastContextCode = `
import React, { createContext, useState, useContext, useCallback } from 'react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, variant = 'default') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
        {toasts.map(t => (
          <div key={t.id} className={\`px-4 py-3 rounded-lg shadow-lg text-white font-medium \${
            t.variant === 'success' ? 'bg-green-600' :
            t.variant === 'error' ? 'bg-red-600' :
            'bg-gray-800'
          }\`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
  `.trim();
  fs.writeFileSync(path.join(outDir, 'components', 'ToastContext.jsx'), toastContextCode);

  // 11.8 Generate ModalContext.jsx
  const modalContextCode = `
import React, { createContext, useState, useContext, useCallback } from 'react';

const ModalContext = createContext();

export function ModalProvider({ children }) {
  const [modal, setModal] = useState(null);

  const showModal = useCallback((message) => {
    return new Promise((resolve) => {
      setModal({
        message,
        onConfirm: () => {
          setModal(null);
          resolve(true);
        },
        onCancel: () => {
          setModal(null);
          resolve(false);
        }
      });
    });
  }, []);

  return (
    <ModalContext.Provider value={{ showModal }}>
      {children}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <p className="text-gray-800 text-lg mb-6">{modal.message}</p>
            <div className="flex justify-end gap-3">
              <button onClick={modal.onCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancel</button>
              <button onClick={modal.onConfirm} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  return useContext(ModalContext);
}
  `.trim();
  fs.writeFileSync(path.join(outDir, 'components', 'ModalContext.jsx'), modalContextCode);

  // 12. Generate App.jsx
  let appJsx = '';
  const uniquePageNames = Array.from(new Set(pageNames));
  if (uniquePageNames.length > 0) {
    const imports = uniquePageNames.map(name => `import ${name} from './pages/${name}.jsx';`).join('\n');
    // ── Phase 9: Dynamic Routing — generate route paths with params ──
    const routeEntries = uniquePageNames.map(name => {
      const routeName = name.replace(/Page$/, '').toLowerCase();
      let pathRoute = routeName === 'home' ? '/' : `/${routeName}`;
      
      // Check if this page has dynamic params
      const pageInfo = pageRegistry[routeName];
      if (pageInfo && pageInfo.params.length > 0) {
        const paramSegments = pageInfo.params.map(p => `:${p.name}`).join('/');
        pathRoute += `/${paramSegments}`;
      }
      
      return { pathRoute, name, isDynamic: !!(pageInfo && pageInfo.params.length > 0) };
    });
    
    // Sort: static routes first, dynamic routes after
    routeEntries.sort((a, b) => {
      if (a.isDynamic === b.isDynamic) return 0;
      return a.isDynamic ? 1 : -1;
    });
    
    const routes = routeEntries.map(({ pathRoute, name }) => {
      return `        <Route path="${pathRoute}" element={<${name} />} />`;
    }).join('\n');

    appJsx = `
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext.jsx';
import { ToastProvider } from './components/ToastContext.jsx';
import { ModalProvider } from './components/ModalContext.jsx';
import { ThemeManager } from './store.js';
${imports}

export default function App() {
  return (
    <ModalProvider>
      <ToastProvider>
        <AuthProvider>
          <ThemeManager />
          <BrowserRouter>
            <Routes>
${routes}
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ModalProvider>
  );
}
`.trim();
  } else {
    // No pages defined, generate default App
    appJsx = `
import React, { useState, useEffect } from 'react';

export default function App() {
  return (
    <>
      <h1>Bolt App</h1>
      <p>Add a "page home:" to your .bolt file to get started!</p>
    </>
  );
}
`.trim();
  }
  fs.writeFileSync(path.join(outDir, 'App.jsx'), appJsx);

  // 15. Generate BoltErrorBoundary.jsx
  const escapedSource = rawSource ? rawSource.replace(/`/g, '\\`').replace(/\$/g, '\\$') : '';
  const errorBoundaryJsx = `
import React from 'react';

const BOLT_SOURCE = \`${escapedSource}\`.split('\\n');

function getHint(errorMsg) {
  if (!errorMsg) return "Check your variables.";
  if (errorMsg.includes("reading 'name'")) return "Check if the object is null before reading its 'name' property. Example: if item:";
  if (errorMsg.includes("reading")) return "You are trying to read a property from a null or undefined value. Ensure the variable is initialized.";
  if (errorMsg.includes("is not a function")) return "You are calling something that isn't a function. Check your component names.";
  return "Check your variables and data flow.";
}

export default class BoltErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      const e = this.state.error;
      const lineNum = e.__boltLine;
      const codeSnippet = lineNum ? BOLT_SOURCE[lineNum - 1] : '';

      return (
        <div style={{ padding: '40px', background: '#111', color: '#ff5555', fontFamily: 'monospace', height: '100vh', width: '100vw', boxSizing: 'border-box', position: 'fixed', top: 0, left: 0, zIndex: 9999 }}>
          <h1 style={{ fontSize: '24px', marginBottom: '20px', borderBottom: '1px solid #ff5555', paddingBottom: '10px' }}>
            ⚡ Bolt Runtime Error
          </h1>
          
          <h2 style={{ fontSize: '18px', color: '#fff', marginBottom: '30px' }}>
            {e ? e.toString() : 'Unknown Error'}
          </h2>

          {lineNum && (
            <div style={{ background: '#222', borderRadius: '8px', padding: '20px', marginBottom: '30px' }}>
              <div style={{ color: '#aaa', fontSize: '14px', marginBottom: '10px' }}>
                <strong>File:</strong> app.bolt<br/>
                <strong>Line:</strong> {lineNum}
              </div>
              
              <div style={{ background: '#000', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #ff5555', color: '#ffd700', fontSize: '16px' }}>
                {codeSnippet}
              </div>
            </div>
          )}

          <div style={{ background: '#222', borderRadius: '8px', padding: '20px', marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '16px' }}>Hint:</h3>
            <p style={{ margin: 0, color: '#aaa', fontSize: '14px' }}>
              {getHint(e ? e.message : '')}
            </p>
          </div>

          <details style={{ whiteSpace: 'pre-wrap', marginTop: '30px', color: '#888', fontSize: '12px' }}>
            <summary style={{ cursor: 'pointer', outline: 'none' }}>View raw stack trace (React internals)</summary>
            <div style={{ marginTop: '10px' }}>
              {this.state.errorInfo ? this.state.errorInfo.componentStack : null}
              <br /><br />
              {e && e.stack}
            </div>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}
`.trim();
  fs.writeFileSync(path.join(outDir, 'components', 'BoltErrorBoundary.jsx'), errorBoundaryJsx);


  console.log(`  ✓ Successfully compiled to ${outDir}`);
}

// ── Default style vocabulary shipped with `bolt init` ──────────────────
// Short, readable names so new pages (and AI) never repeat raw Tailwind.
export const DEFAULT_STYLES_BOLT = `
styles:
    // Layout
    page-wrap: max-w-5xl mx-auto px-6 py-12
    stack: flex flex-col gap-4
    cluster: flex flex-row flex-wrap items-center gap-3
    center: flex items-center justify-center

    // Surfaces
    card: bg-white border border-gray-100 rounded-2xl shadow-sm p-6
    panel: bg-gray-50 rounded-2xl p-6

    // Text
    heading: text-4xl font-extrabold tracking-tight text-gray-900
    subheading: text-xl font-bold text-gray-900
    body: text-base text-gray-600 leading-relaxed
    muted: text-sm text-gray-400
    link: text-blue-600 hover:text-blue-700 transition-colors

    // Controls
    button-primary: px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors
    button-secondary: px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold transition-colors
    field: w-full px-4 py-2 border border-gray-200 rounded-lg
    badge: inline-block px-3 py-1 text-xs font-bold uppercase tracking-wide bg-blue-50 text-blue-600 rounded-full
`.trimStart();

export function scaffoldProject(outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(path.join(outDir, 'src'), { recursive: true });
  fs.mkdirSync(path.join(outDir, 'src', '.bolt-generated'), { recursive: true });

  // 1. Generate package.json
  const pkg = {
    name: "bolt-app",
    private: true,
    version: "0.0.0",
    type: "module",
    scripts: {
      dev: "bolt dev .",
      "dev:vite": "vite",
      build: "bolt build . && vite build",
      preview: "vite preview"
    },
    dependencies: {
      react: "^18.2.0",
      "react-dom": "^18.2.0",
      "react-router-dom": "^6.22.3"
    },
    devDependencies: {
      "@vitejs/plugin-react": "^4.2.1",
      vite: "^5.0.0",
      "tailwindcss": "^3.4.1",
      "postcss": "^8.4.35",
      "autoprefixer": "^10.4.17"
    }
  };
  fs.writeFileSync(path.join(outDir, 'package.json'), JSON.stringify(pkg, null, 2));

  // 2. Generate Tailwind config
  const tailwindTheme = `export const theme = {};\n`;
  fs.writeFileSync(path.join(outDir, 'src', '.bolt-generated', 'tailwind.theme.js'), tailwindTheme);

  const tailwindConfig = `
import { theme } from './src/.bolt-generated/tailwind.theme.js';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/.bolt-generated/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: theme,
  },
  plugins: [],
}
`.trim();
  fs.writeFileSync(path.join(outDir, 'tailwind.config.js'), tailwindConfig);

  const postcssConfig = `
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`.trim();
  fs.writeFileSync(path.join(outDir, 'postcss.config.js'), postcssConfig);

  // 3. Generate vite.config.js
  const viteConfig = `
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
`.trim();
  fs.writeFileSync(path.join(outDir, 'vite.config.js'), viteConfig);

  // 4. Generate index.html
  const indexHtml = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Bolt App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`.trim();
  fs.writeFileSync(path.join(outDir, 'index.html'), indexHtml);

  // 5. Generate src/main.jsx (Imports App from .bolt-generated)
  const mainJsx = `
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './.bolt-generated/App.jsx'
import BoltErrorBoundary from './.bolt-generated/components/BoltErrorBoundary.jsx'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BoltErrorBoundary>
      <App />
    </BoltErrorBoundary>
  </React.StrictMode>,
)
`.trim();
  fs.writeFileSync(path.join(outDir, 'src', 'main.jsx'), mainJsx);

  // 6. Generate src/styles/global.css
  fs.mkdirSync(path.join(outDir, 'src', 'styles'), { recursive: true });
  const globalCss = `
@import '../.bolt-generated/theme.css';
@tailwind base;
@tailwind components;
@tailwind utilities;
`.trim();
  fs.writeFileSync(path.join(outDir, 'src', 'styles', 'global.css'), globalCss);

  // 7. Starter files: default style vocabulary + a home page that uses it
  fs.mkdirSync(path.join(outDir, 'src', 'pages'), { recursive: true });
  fs.writeFileSync(path.join(outDir, 'src', 'styles.bolt'), DEFAULT_STYLES_BOLT);

  const homeBolt = `
page home:
    column styled as: page-wrap gap-4:
        show "Welcome to Bolt!" as title styled as: heading
        show "Edit src/pages/home.bolt and save to see changes instantly." as subtitle styled as: body

        button "Get started" styled as: button-primary:
            show toast "Hello from Bolt!" as success
`.trim();
  fs.writeFileSync(path.join(outDir, 'src', 'pages', 'home.bolt'), homeBolt);

  console.log(`  ✓ Successfully scaffolded Bolt project in ./${outDir}`);
  console.log(`\n  Next steps:`);
  console.log(`  cd ${outDir}`);
  console.log(`  npm install`);
  console.log(`  npm run dev`);
}
