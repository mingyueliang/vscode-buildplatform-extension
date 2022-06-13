import * as vscode from 'vscode';
import * as os from 'os';

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
	terminalEnv?: string | null | undefined
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
			path: folder.uri.path
		});
	});
	return folders;
}

/**
 *@description Get the correct address and be compatible with the problems on the window.
 */
export function getPathHack(filePath: string) {
	if (isWinOS()) {
	  return filePath.slice(1);
	}
	return filePath;
  }
  
/**
 * @description get system platform
 */
export function isWinOS() {
	return os.platform() === 'win32';
}
  
export function isMacOS() {
	return os.platform() === 'darwin';
}

export function isLinuxOS() {
	return os.platform() === 'linux';
}
  