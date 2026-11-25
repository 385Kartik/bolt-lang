# Contributing to Bolt

Thank you for your interest in contributing to Bolt! Bolt is a compiler and language built with JavaScript/Node.js.

## Architecture
Before diving into the code, please read the [Architecture Guide](ARCHITECTURE.md) to understand how the Lexer, Parser, AST, and Generator interact.

## How to Contribute
1. **Parser & Lexer Improvements:** Check `src/lexer/tokens.js` and `src/parser/parser.js`. If adding new syntax, make sure to update the [Language Specification](LANGUAGE_SPEC.md) grammar section.
2. **Generator Improvements:** Check `src/generator/generator.js` to tweak the React/Tailwind output.
3. **Resolver & Builder:** Check `src/builder/builder.js` and `src/builder/resolve.js` (`use <name>` file lookup, named styles merging).
4. **Bug Fixes:** Check the issues tab and submit pull requests targeting the `main` branch.

## Setting up locally
```bash
git clone https://github.com/yourusername/bolt.git
cd bolt
npm install
node cli/bolt.js build store-app
npm test
```

We welcome discussions and PRs for adding new language primitives or improving the AST optimizations!

## VS Code extension
- Add new keywords to `extensions/bolt-language-support/syntaxes/bolt.tmLanguage.json` and a snippet to `snippets/bolt.json` when you add syntax (a test checks every snippet compiles)
- Try it with `npm run install:vscode`, then reload VS Code
- Build the package with `npm run package:vscode`; publishing steps are in `extensions/bolt-language-support/PUBLISHING.md`

## Before you open a PR
- Run `node cli/bolt.js check store-app` (must report no problems) and `node cli/bolt.js fmt store-app --check`
- If you change syntax, update `llms.txt` (the AI cheat-sheet) too

## Tests
- `npm test` runs everything (`tests/e2e.test.js`, `tests/features.test.js`, `tests/api.test.js`, `tests/tailwind.test.js`, `tests/extension.test.js`, `tests/format.test.js`)
- Add a test for every new syntax or compiler behavior, and update the docs (README, LANGUAGE_SPEC, ARCHITECTURE, BOLT_HISTORY, ROADMAP) in the same change
