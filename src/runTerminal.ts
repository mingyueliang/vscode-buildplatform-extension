import * as vscode from 'vscode';
import { StatusBarTermianl } from './StatusBarTerminal';
import { getPathHack } from './commons';
import { BuildPlatformItem } from './buildplatformTree';
import { stringify } from 'querystring';
import { type } from 'os';

let terminalCount = 0;
let terminals: StatusBarTermianl[] = [];
let terminalIndex: number;
let terminalMap = new  Map();


module.exports = function(context: vscode.ExtensionContext){
    context.subscriptions.push(vscode.commands.registerCommand('vscode-buildplatform-extension.run', async (item)=> {    
        var args = item.args[0];
        var name = args.name;
        var path = args.path;
        var commands = args.commands;
        var setCheckoutDir = args.setCheckoutDir;
        var shellPath = args.shellPath;
        if (terminalMap.has(getPathHack(path))) {
          // Close terminal
          onDidCloseTerminal(terminalMap.get(getPathHack(path))._terminal);
    
        }
        var envs= {};
        if (setCheckoutDir) {
          envs = {checkoutdir:getPathHack(path), checkoutDir:getPathHack(path)};
          // if (isLinuxOS()) {
          //   commands = `export checkoutDir=${getPathHack(path)};export checkoutdir=${getPathHack(path)};`+commands;
          // } else {
          //   commands = `set checkoutDir=${getPathHack(path)}&&set: checkoutdir=${getPathHack(path)}&&`+commands;
          // }
        }
        terminalMap.set(getPathHack(path), new StatusBarTermianl(terminalCount++, {
            terminalName: name,
            terminalShellpath: shellPath,
            terminalCwd: getPathHack(path),
            terminalText: commands,
            env: envs,
            terminalAutoInputText: true
          }));
        terminals.push(terminalMap.get(getPathHack(path)));
        // This happens when user closed terminal.
        // context.subscriptions.push(vscode.window.onDidCloseTerminal(onDidCloseTerminal));
      }));
    
};

/**
 * @description when user close terminal
 * @param terminal 
 */
 function onDidCloseTerminal(terminal: vscode.Terminal) {
    terminals.forEach((statusBarTerminal, index) => {
      if (statusBarTerminal.hasTerminal(terminal)) {
        terminalIndex = index;
      }
      });
      terminals[terminalIndex]?.dispose();
      terminals.splice(terminalIndex, 1);
      terminals.forEach((statusBarTerminal, i) => {
        terminals[i].setTerminalIndex(i);
    });
    terminalCount--;
  }
