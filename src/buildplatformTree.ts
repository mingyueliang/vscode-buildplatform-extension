import * as vscode from 'vscode';
import * as fs from 'fs';
import * as syspath from 'path';
import * as xml2js from 'xml2js';
import { StatusBarTermianl } from './StatusBarTerminal';
import { FolderType, getWorkSpaceFolders, isMacOS, isWinOS, isLinuxOS, getPathHack } from './commons';


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
};

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
    // refresh child node
    private _onDidChangeTreeData: vscode.EventEmitter<BuildPlatformItem | undefined | void> = new vscode.EventEmitter<BuildPlatformItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<BuildPlatformItem | undefined | void> = this._onDidChangeTreeData.event;
    constructor(private folderPathList?: FolderType[], private xmlFilePath?: string|undefined){}

    refresh(): void {
      this._onDidChangeTreeData.fire();
    }

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
                name,
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
              item.args = [{name:name, path: element.path, commands: dealStepList.join(commandSeparator), setCheckoutDir: setCheckoutDir, shellPath:shellPath}];
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