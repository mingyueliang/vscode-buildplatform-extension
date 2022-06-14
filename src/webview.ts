import * as vscode from 'vscode';
import * as fs from 'fs';
import * as syspath from 'path';
import { isWinOS} from './commons';

let webviewPanel = new Map();

module.exports = function (context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('plugin-buildplatform.openChild',async (name:string,path:string,commands:string,setCheckoutDir:boolean)=>{
        var column = vscode.window.activeTextEditor?vscode.window.activeTextEditor.viewColumn:undefined;
        // If we already have a panel, show it.
        if (webviewPanel.get(name)) {
          webviewPanel.get(name).reveal(column);
        } else {
          // Create webview panel.
            const panel = vscode.window.createWebviewPanel(
            'commands',
            name,
            vscode.ViewColumn.One,
            {   
                // Allow JS script execution
                enableScripts: true, 
                // Switching WebView is not visible, and the page content can still be saved.
                retainContextWhenHidden:true, 
                // Allow load local resource
                localResourceRoots: [vscode.Uri.file(syspath.join(context.extensionPath, 'src'))]
            }
            );
            webviewPanel.set(name, panel);

            // Post messsage(data) to webview
            var sep = ';';
            if (isWinOS()){ 
                sep = '&&';
            }
            var cmdList = commands.split(sep);
            panel.webview.postMessage(cmdList);
            
            // Get webview html
            const htmlSrc = 'source/webview.html';
            panel.webview.html = getWebviewContent(context, htmlSrc);
            
            // Listen for when the panel disposed
            // This happens when the user closes the panel or when the panel is closed programmatically
            panel.onDidDispose(() => dispose(panel, name), null, []);
        }
      })
    );
};
    
/**
 * @description read template html file
 * @param context vscode Extension context
 * @param templatePath html file path
 * @param commands 
 * @returns html
 */
export function getWebviewContent(context: vscode.ExtensionContext, templatePath: string){
    const resourcePath = syspath.join(context.extensionPath, templatePath);
    let html = fs.readFileSync(resourcePath, 'utf-8');
    return html;
}

/**
 * @description Close webview panel
 * @param panel webview panel
 * @param name webview name
 */
 function dispose(panel: vscode.WebviewPanel, name: string){
    panel.dispose();
    webviewPanel.delete(name);
  }