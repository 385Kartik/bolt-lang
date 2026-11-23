# Contributing to Bolt

Thank you for your interest in contributing to Bolt! Bolt is a compiler and language built with JavaScript/Node.js.

## Architecture
Before diving into the code, please read the [Architecture Guide](ARCHITECTURE.md) to understand how the Lexer, Parser, AST, and Generator interact.

## How to Contribute
1. **Parser & Lexer Improvements:** Check `src/lexer/tokens.js` and `src/parser/parser.js`. If adding new syntax, make sure to update the [Language Specification](LANGUAGE_SPEC.md) grammar section.
2. **Generator Improvements:** Check `src/generator/generator.js` to tweak the React/Tailwind output.
3. **Bug Fixes:** Check the issues tab and submit pull requests targeting the `main` branch.

## Setting up locally
```bash
git clone https://github.com/yourusername/bolt.git
cd bolt
npm install
node cli/bolt.js build examples/test_app
```

We welcome discussions and PRs for adding new language primitives or improving the AST optimizations!
