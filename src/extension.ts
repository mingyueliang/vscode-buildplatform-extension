// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	require('./buildplatformTree')(context);
	require('./refreshWorkspace')(context);	
	require('./runTerminal')(context);
	require('./webview')(context);
}

// this method is called when your extension is deactivated
export function deactivate() {}


