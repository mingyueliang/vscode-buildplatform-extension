import * as vscode from 'vscode';
import { MyTerminalOptions } from './commons';

/**
 * @description terminal
 * @terminalName platform name
 * @terminalIndex terminal index
 * @terminalPath create terminal shell path
 * @return create terminal
 */
 export class StatusBarTermianl {
    private _item: vscode.StatusBarItem;
    private _terminal: vscode.Terminal | undefined;
    public terminalName: string | undefined;
    public terminalIndex: number | undefined;
    public terminalPath: string | undefined;
  
    constructor(terminalIndex: number, terminalOptions: MyTerminalOptions, terminalCreate:boolean = true){
        this.terminalIndex = terminalIndex;
        this.terminalName = terminalOptions.terminalName;
        this.terminalPath = terminalOptions.terminalCwd;
        this._item = vscode.window.createStatusBarItem();
        this.setTerminalIndex(terminalIndex);
        this._item.show();
  
        if (terminalCreate) {
            /* create terminal */
            this._terminal = vscode.window.createTerminal({
                name: this.terminalName,
                shellPath: terminalOptions.terminalShellpath,
                cwd: terminalOptions.terminalCwd,
                env: terminalOptions.env,
            });
  
            if (terminalOptions.terminalAutoInputText) {
                if (terminalOptions.terminalText) {
                    this._terminal.sendText(
                        terminalOptions.terminalText,
                        terminalOptions.terminalAutoRun
                    );
                }
            }
            this._terminal.show();
        }
    }
  
    public show():void {
      this._terminal?.show();
    }

    public setTerminalIndex(index: number) {
        this._item.text = `$(terminal)${index+1}`;
    }

    public hasTerminal(terminal: vscode.Terminal): boolean {
        return this._terminal === terminal;
    }

    public dispose(): void {
        this._item.dispose();
        this._terminal?.dispose();
    }
  }
  