"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const molecularViewer_1 = require("./webview/molecularViewer");
function activate(context) {
    const provider = new molecularViewer_1.MolecularViewerProvider(context);
    context.subscriptions.push(vscode.window.registerCustomEditorProvider('molecularViewer.editor', provider, {
        webviewOptions: { retainContextWhenHidden: true },
        supportsMultipleEditorsPerDocument: false,
    }));
    context.subscriptions.push(vscode.commands.registerCommand('molecularViewer.openViewer', async (uri) => {
        let fileUri;
        if (uri) {
            fileUri = uri;
        }
        else {
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                fileUri = activeEditor.document.uri;
            }
            else {
                const result = await vscode.window.showOpenDialog({
                    canSelectMany: false,
                    openLabel: 'Select Molecular File',
                    filters: {
                        'Molecular Files': ['gjf', 'xyz', 'mol', 'sdf', 'gjf03', 'gjf09', 'gjf16', 'com'],
                        'All Files': ['*']
                    }
                });
                if (!result || result.length === 0) {
                    return;
                }
                fileUri = result[0];
            }
        }
        await vscode.commands.executeCommand('vscode.openWith', fileUri, 'molecularViewer.editor');
    }));
}
function deactivate() {}
