const vscode = require('vscode');

let diagnosticCollection;

async function activate(context) {
    console.log('Bolt Language Support is now active!');
    
    diagnosticCollection = vscode.languages.createDiagnosticCollection('bolt');
    context.subscriptions.push(diagnosticCollection);

    // Initial lint
    if (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.languageId === 'bolt') {
        lintDocument(vscode.window.activeTextEditor.document);
    }

    // Lint on change
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.languageId === 'bolt') {
                lintDocument(e.document);
            }
        })
    );
    
    // Lint on open
    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(doc => {
            if (doc.languageId === 'bolt') {
                lintDocument(doc);
            }
        })
    );
}

async function lintDocument(document) {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    if (!workspaceFolder) {
        diagnosticCollection.clear();
        return;
    }

    try {
        // Dynamically import the user's WORKSPACE compiler!
        // This ensures the extension always uses the latest language features the user is building.
        const url = require('url');
        
        const lexerPath = vscode.Uri.joinPath(workspaceFolder.uri, 'src', 'lexer', 'lexer.js').fsPath;
        const parserPath = vscode.Uri.joinPath(workspaceFolder.uri, 'src', 'parser', 'parser.js').fsPath;
        
        const lexerUri = url.pathToFileURL(lexerPath).href;
        const parserUri = url.pathToFileURL(parserPath).href;

        const { tokenize } = await import(lexerUri + '?cachebust=' + Date.now()); // cachebust for hot-reload
        const { parse } = await import(parserUri + '?cachebust=' + Date.now());

        const text = document.getText();
        
        try {
            const tokens = tokenize(text);
            parse(tokens);
            // If it succeeded, clear diagnostics
            diagnosticCollection.set(document.uri, []);
        } catch (err) {
            // Check if it's a compiler error (LexerError or ParseError)
            if (err.name === 'LexerError' || err.name === 'ParseError') {
                // Determine line and column (our compiler throws 1-indexed)
                let rawLine = (err.line || 1) - 1;
                let lineIndex = Math.max(0, Math.min(document.lineCount - 1, rawLine));
                
                let lineText = document.lineAt(lineIndex).text;
                
                // If the error falls on an empty line (e.g. EOF), shift it to the previous line
                if (lineText.trim() === '' && lineIndex > 0) {
                    lineIndex--;
                    lineText = document.lineAt(lineIndex).text;
                }
                
                // Highlight the entire line for simplicity, or starting from column
                // To make it "bolder" and more visible, we highlight the entire text on that line
                // instead of just one character!
                const startCol = lineText.length - lineText.trimStart().length; // start at first non-whitespace
                const endCol = Math.max(startCol + 1, lineText.length);

                const range = new vscode.Range(
                    new vscode.Position(lineIndex, startCol),
                    new vscode.Position(lineIndex, endCol)
                );

                const diagnostic = new vscode.Diagnostic(
                    range,
                    err.message,
                    vscode.DiagnosticSeverity.Error
                );
                
                diagnosticCollection.set(document.uri, [diagnostic]);
            } else {
                // Internal compiler crash (e.g. TypeError during AST generation)
                // We could show this too, but it might be noisy. Let's show it on line 0.
                const range = new vscode.Range(0, 0, 0, 10);
                const diagnostic = new vscode.Diagnostic(
                    range,
                    "Internal Compiler Crash: " + err.message,
                    vscode.DiagnosticSeverity.Warning
                );
                diagnosticCollection.set(document.uri, [diagnostic]);
            }
        }
    } catch (e) {
        // Failed to load compiler from workspace (maybe they are in a different project)
        // Silently fail or clear
        vscode.window.showErrorMessage('Failed to load Bolt compiler: ' + e.message);
        diagnosticCollection.clear();
    }
}

function deactivate() {
    if (diagnosticCollection) {
        diagnosticCollection.clear();
    }
}

module.exports = {
    activate,
    deactivate
};
