import * as vscode from 'vscode';
import * as fs from 'fs';
import * as syspath from 'path';
import * as xml2js from 'xml2js';
import { StatusBarTermianl } from './StatusBarTerminal';
import { FolderType, getWorkSpaceFolders, isMacOS, isWinOS, isLinuxOS, getPathHack } from './commons';


let terminalCount = 0;
let terminals: StatusBarTermianl[] = [];
let terminalIndex: number;
let terminalMap = new  Map();
let webviewPanel = new Map();
let pythonRe = /python$|python.exe$/gi;
let zip7zRe = /7z.exe$/gi;
let checkoutDirRe = /\$checkoutDir\/|\$checkoutDir|%checkoutDir%\\|%checkoutDir%/gi;
let ipcleanRe = /ipclean.py$/gi;


 module.exports = function (context: vscode.ExtensionContext, uri?: string) {
  const folderList = getWorkSpaceFolders();
  if (folderList.length<=0) {
    console.log('current workspace not open project');
    vscode.window.showInformationMessage("Current workspace not open project");
    return;
  }

  const buildplatformProvider = new BuildPlatformProvider(folderList, uri);

  // vscode.window.registerTreeDataProvider('Build-Command', buildplatformProvider);
  vscode.window.createTreeView('Build-Command',{treeDataProvider:buildplatformProvider});

  context.subscriptions.push(vscode.commands.registerCommand('vscode-buildplatform-extension.run', async (Item:BuildPlatformItem)=> {
    // var [name, path, commands, setCheckoutDir] = Item.command?.arguments;

    var shellPath = Item.command?.arguments?.pop();
    var setCheckoutDir = Item.command?.arguments?.pop();
    var commands = Item.command?.arguments?.pop();
    var path = Item.command?.arguments?.pop();
    var name = Item.command?.arguments?.pop();
    if (terminalMap.has(getPathHack(path))) {
      vscode.window.showInformationMessage('Current project does not support more than 1 terminal.');
      // Close terminal
      // closeTerminal(terminalMap.get(getPathHack(path))._terminal);
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
    context.subscriptions.push(vscode.window.onDidCloseTerminal(onDidCloseTerminal));
  }));

  // context.subscriptions.push(vscode.commands.registerCommand('vscode-buildplatform-extension.edit',async (Item:BuildPlatformItem)=>{
  //   vscode.window.showInformationMessage('Edit command');
  //   var column = vscode.window.activeTextEditor?vscode.window.activeTextEditor.viewColumn:undefined;
  //   var shellPath = Item.command?.arguments?.pop();
  //   var setCheckoutDir = Item.command?.arguments?.pop();
  //   var commands = Item.command?.arguments?.pop();
  //   var path = Item.command?.arguments?.pop();
  //   var name = Item.command?.arguments?.pop();

  //   // If we already have a panel, show it.
  //   if (webviewPanel.get(name)) {
  //     webviewPanel.get(name).reveal(column);
  //     // return;
  //   } else {
  //     // Create webview panel.
  //     const panel = vscode.window.createWebviewPanel(
  //       'commands',
  //       name,
  //       vscode.ViewColumn.One,
  //       {enableScripts: true, retainContextWhenHidden:true}
  //     );
  //     webviewPanel.set(name, panel);

      // Get webview html
  //     var templatePath = 'src/webview.html';
  //     panel.webview.html = getWebviewContent(context, templatePath);
      
  //     // Post messsage(data) to webview
  //     var sep = ';';
  //     if (isWinOS()){ 
  //       sep = '&&';
  //     }
  //     var cmdList = commands.split(sep);
  //     panel.webview.postMessage(cmdList);

  //     // Listen for when the panel disposed
  //     // This happens when the user closes the panel or when the panel is closed programmatically
  //     panel.onDidDispose(() => dispose(panel, name), null, []);

  //   }
  // }));

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
        {enableScripts: true, retainContextWhenHidden:true}
      );
      webviewPanel.set(name, panel);

      // Get webview html
      var templatePath = 'src/webview.html';
      panel.webview.html = getWebviewContent(context, templatePath);
      
      // Post messsage(data) to webview
      var sep = ';';
      if (isWinOS()){ 
        sep = '&&';
      }
      var cmdList = commands.split(sep);
      panel.webview.postMessage(cmdList);

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
export function getWebviewContent(context: vscode.ExtensionContext, templatePath: string, commands?: Array<string>){
  const resourcePath = syspath.join(context.extensionPath, templatePath);
  let html = fs.readFileSync(resourcePath, 'utf-8');
  return html;
}

// create node
export class BuildPlatformItem extends vscode.TreeItem {
    constructor(
        public label: string,
        public collapsibleState: vscode.TreeItemCollapsibleState,
        public projectName?: string,
        public description?: string,
        public path?: string,
        public args?: { [key: string]: any},
        public commands?: string|undefined,
        public xmlFilePath?: string|undefined
    ){
        super(label, collapsibleState);
        this.label = label;
        this.path = `${this.path}`;
        this.tooltip = `${this.commands}`;
        this.projectName = `${this.projectName}`;
        this.description = `${this.description}`;
    }
}

/**
 * @description Provider data for view.
 */
export class BuildPlatformProvider implements vscode.TreeDataProvider<BuildPlatformItem> {
    constructor(private folderPathList?: FolderType[], private xmlFilePath?: string|undefined){}

    getTreeItem(element: BuildPlatformItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: BuildPlatformItem): vscode.ProviderResult<BuildPlatformItem[]> {
        if (element) {
          return parserXmlFile(element);
        } else {
            const folderNode = this.folderPathList?.map((folder: FolderType) => {
                  return new BuildPlatformItem(
                    folder.name,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    folder.name,
                    "",
                    folder.path,
                    [],
                    '',
                    ''
                  );
            });
            // const project = [];
            // var folderPath = '';
            // var folderName = '';

            // this.folderPathList?.forEach((folder) => {
            //   if (this.xmlFilePath?.search(folder.name) !== -1) {
            //     folderPath = folder.path;
            //     folderName = folder.name;
            //   }
            // });
            // project.push(new BuildPlatformItem(
            //   folderName,
            //   vscode.TreeItemCollapsibleState.Collapsed,
            //   folderName,
            //   '',
            //   folderPath,
            //   [],
            //   '',
            //   this.xmlFilePath
            // ));
            // return project;
            return folderNode;
        }
    }
}

/**
 * @description deal command
 * @param command all commands
 * @returns dealed commands
 */
export function dealCommand(command: string) {
  var commandList = command.split(" ");
  if (commandList.length >= 1) {
    commandList.forEach((command:string, index:number)=> {
      if (command.search(pythonRe) !== -1) {
        if (isLinuxOS()) {
          commandList[index] = 'python3';
        } else {
          commandList[index] = 'py -3';
        }
      } 
      if (command.search(zip7zRe) !== -1) {
        commandList[index] = '7z';
      }
  
      if (command.search(ipcleanRe) !== -1) {
        commandList[index] = 'ipclean';
        commandList = commandList.slice(1,undefined);
      }
    });
    return commandList.join(" ");
  
  }
}

/**
 * @description parser xml file 
 * @param element 
 * @returns 
 */
export function parserXmlFile(element: BuildPlatformItem) {
    // get xml file path
    var xmlFilePath = getPathHack(syspath.join(`${element.path}`, 'repo', 'Manifest.xml'));
    // Parser xml file
    var data = '';
    try {
    // data = fs.readFileSync(getPathHack(`${element.xmlFilePath}`), 'utf-8');
    data = fs.readFileSync(xmlFilePath, 'utf-8');
    } catch (error) {
      vscode.window.showInformationMessage(`Not xml file in ${element.path} project`);
      return;
    }
    if (data) {
      var childList: BuildPlatformItem[] = [];
      xml2js.parseString(data, function(err, result){
        if (err) {
          console.error('parser error......');
        } else {
          var buildTargetList = result.Manifest.BuildTargetList;
          for (let index = 0; index < buildTargetList.length; index++) {
            var builtargets = buildTargetList[index].BuildTarget;
            for (let tarindex = 0; tarindex <builtargets.length; tarindex++) {
              // get all step and deal.
              var stepList = builtargets[tarindex].StepList[0].Step;
              if (stepList){
                var dealStepList = stepList.map(dealCommand);
              } else {
                continue;
              }
              
              var name = builtargets[tarindex].$.name;
              var description = builtargets[tarindex].$.description;
              var commandSeparator = '';
              var shellPath = '';
              if (name.search('Linux') !== -1 || name.search('GCC') !== -1) {
                commandSeparator = ';';
                if (isLinuxOS() !== true) {
                  continue;
                }
              } else {
                commandSeparator = '&&';
                shellPath = 'C:/Windows/System32/cmd.exe';
                if (isWinOS() !== true) {
                  continue;
                }
              }

              var commands = dealStepList.join(commandSeparator);
              var setCheckoutDir = false;
              if (commands.search(checkoutDirRe) !== -1) {
                setCheckoutDir = true;
              }

              var item = new BuildPlatformItem(
                `Build: ${name}`,
                vscode.TreeItemCollapsibleState.None,
                '',
                description,
                '',
                [],
                commands
              );

              
              item.command = {
                title: name,
                command: 'plugin-buildplatform.openChild',
                arguments: [name, element.path, dealStepList.join(commandSeparator), setCheckoutDir, shellPath]
              };
              childList[tarindex] = item;
            }
          }
        }
      });
      if (childList.length<1){
        vscode.window.showInformationMessage("There is no command in the XML file suitable for the current system");
      }
      return childList;
    }
  }

/**
 * @description Close terminal
 * @param terminal 
 */
function closeTerminal(terminal: vscode.Terminal): any {
  // Close terminal
  onDidCloseTerminal(terminal);
}

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

/**
 * @description Close webview panel
 * @param panel webview panel
 * @param name webview name
 */
function dispose(panel: vscode.WebviewPanel, name: string){
  panel.dispose();
  webviewPanel.delete(name);
}