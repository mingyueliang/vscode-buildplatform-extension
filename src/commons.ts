import * as vscode from 'vscode';

export interface FolderType {
    name: string,
    path: string
}

export interface MyTerminalOptions extends vscode.TerminalOptions {
	terminalName?: string
  terminalShellpath?: string 
	terminalCwd?: string 
	terminalText?: string 
	terminalAutoInputText?: boolean 
	terminalAutoRun?: boolean
}

/**
 * @description 
 * @summary
 */
 export function getWorkSpaceFolders(){
	const folders: FolderType[] = [];
	vscode?.workspace?.workspaceFolders?.forEach((folder:any) => {
		folders.push({
			name: folder.name,
			path: folder.uri.path.substring(1)
		});
	});
	return folders;
}

