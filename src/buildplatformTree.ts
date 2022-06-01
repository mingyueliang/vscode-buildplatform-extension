import * as vscode from 'vscode';
import * as fs from 'fs';
import * as xml2js from 'xml2js';
import { StatusBarTermianl } from './StatusBarTerminal';
import { FolderType, getWorkSpaceFolders } from './commons';


let terminalCount = 0;
let MAX_TERMINALS = null;
let terminals: StatusBarTermianl[] = [];
let terminalIndex: number; 
let terminalMap = new  Map();
let pythonRe = /python$/gi;


module.exports = function (context: vscode.ExtensionContext) {
  const folderList = getWorkSpaceFolders();
  if (folderList.length<=0) {
    console.log('current workspace not open project');
    vscode.window.showInformationMessage("Current workspace not open project");
    return;
  }
  // Set the maximum number of terminals that can be opened at the same time
  MAX_TERMINALS = folderList.length;

  const buildplatformProvider = new BuildPlatformProvider(folderList);

  // vscode.window.registerTreeDataProvider('Build-Command', buildplatformProvider);
  vscode.window.createTreeView('Build-Command',{treeDataProvider:buildplatformProvider});

  context.subscriptions.push(vscode.commands.registerCommand('plugin-buildplatform.openChild',async (name:string,shellPath:string,path:string,commands:string)=>{
    if (terminalMap.has(path)) {
      vscode.window.showInformationMessage('Current project does not support more than 1 terminal.');
      context.subscriptions.push(vscode.window.onDidCloseTerminal(onDidCloseTerminal(terminalMap.get(path)._terminal, path)));
    }
    terminalMap.set(path, new StatusBarTermianl(terminalCount++, {
        terminalName: name,
        terminalShellpath: shellPath,
        terminalCwd: path,
        terminalText: commands,
        terminalAutoInputText: true
      }));
  })
  );
};

// create node
export class BuildPlatformItem extends vscode.TreeItem {
    constructor(
        public label: string,
        public collapsibleState: vscode.TreeItemCollapsibleState,
        public projectName?: string,
        public description?: string,
        public path?: string,
        public args?: { [key: string]: any}
    ){
        super(label, collapsibleState);
        this.label = label;
        this.path = `${this.path}`;
        this.tooltip = `${this.label}`;
        this.projectName = `${this.projectName}`;
        this.description = `${this.description}`;
    }
}

export class BuildPlatformProvider implements vscode.TreeDataProvider<BuildPlatformItem> {
    constructor(private folderPathList?: FolderType[]){}

    getTreeItem(element: BuildPlatformItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: BuildPlatformItem): vscode.ProviderResult<BuildPlatformItem[]> {
        if (element) {
          // vscode.window.showInformationMessage("这是子节点");
          return parserXmlFile(element);
        } else {
            const folderNode = this.folderPathList?.map((folder: FolderType) => {
                return new BuildPlatformItem(
                  folder.name,
                  vscode.TreeItemCollapsibleState.Collapsed,
                  folder.name,
                  "",
                  folder.path
                );
            });
            return folderNode;
        }
    }
}

export function dealCommand(command: string) {
  var commandList = command.split(" ");
  commandList.forEach((command:string, index:number)=> {
    if (command.search(pythonRe) !== -1) {
      commandList[index] = 'py -3';
    } 
  });
  return commandList.join(" ");
}


export function parserXmlFile(element: BuildPlatformItem) {
    // get xml file path
    var xmlFilePath = `${element.path}/repo/Manifest.xml`;
    // Parser xml file
    var data = '';
    try {
    data = fs.readFileSync(`${xmlFilePath}`, 'utf-8');
    } catch (error) {
      vscode.window.showInformationMessage(`Not xml file in ${element.path} project`);
      console.log(`Not xml file in ${element.path} project`);
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
              var name = builtargets[tarindex].$.name;
              var description = builtargets[tarindex].$.description;
              var item = new BuildPlatformItem(
                `Build: ${name}`,
                vscode.TreeItemCollapsibleState.None,
                '',
                description,
                ''
              );
              // get all step and deal.
              var stepList = builtargets[tarindex].StepList[0].Step;
              // var setEnv:boolean = false;
              // var stepString = stepList.join(" ");
              if (stepList){
                var dealStepList = stepList.map(dealCommand);
              } else {
                continue;
              }
              
              // Use different shell according to the command.
              var bashPath = vscode.workspace.getConfiguration().get('bashPath');
              var cmdPath = vscode.workspace.getConfiguration().get('cmdPath');
              var shellPath = null;
              var commandSeparator = '';
              if (name.search('Linux') !== -1 || name.search('GCC') !== -1) {
                shellPath = bashPath;
                commandSeparator = ';';
              } else {
                shellPath = cmdPath;
                commandSeparator = '&&';
              }
              item.command = {
                title: name,
                command: 'plugin-buildplatform.openChild',
                arguments: [name, shellPath, element.path, dealStepList.join(commandSeparator)]
              };
              childList[tarindex] = item;
            }
          }
        }
      });
      return childList;
    }
  }

/**
 * @description Close terminal
 * @param terminal 
 */
function onDidCloseTerminal(terminal: vscode.Terminal, projectName:string): any {
  // Close terminal
  terminal.dispose();
  var statusBarTerminal = terminalMap.get(projectName);
  statusBarTerminal._item.dispose();
  terminalMap.delete(projectName);
  terminalCount--;
}
