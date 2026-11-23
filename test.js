import { tokenize } from './src/lexer/lexer.js';
import { parse } from './src/parser/parser.js';
import { generateNode } from './src/generator/generator.js';

const code = `page home:
    store showTestModal = false
    button "Test":
        showTestModal = true
    show "end"
`;

const tokens = tokenize(code);
const ast = parse(tokens);
console.log("AST Node:", JSON.stringify(ast.body[0].body[1].body[0], null, 2));

const reactCode = generateNode(ast.body[0], { globalStoresList: [], componentRegistry: {} });
console.log("CODE:", reactCode);
