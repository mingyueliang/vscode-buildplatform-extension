import * as vscode from 'vscode';
import { provider } from './buildplatformTree';

module.exports = function (context: vscode.ExtensionContext) {
    let reloadExtensionCommand = vscode.commands.registerCommand('vscode-buildplatform-extension.refresh', () => {
          vscode.commands.executeCommand('workbench.action.reloadWindow');
        });
    
      context.subscriptions.push(reloadExtensionCommand);
  
  };
  