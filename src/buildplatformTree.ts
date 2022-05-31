import * as vscode from 'vscode';
import * as fs from 'fs';
import * as xml2js from 'xml2js';
import * as syspath from 'path';


var terminalCount = 0;
var winEnvRe = /%[a-zA-Z0-9_]+%/g;
var unixEnvRe = /$[a-zA-Z0-9_]+/g;
var envMap = new Map();

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
    if (command.search('python') !== -1) {
      commandList[index] = 'py -3';
    } 
  });
  return commandList.join(" ");
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

export function getEnvBeSet(envs:any, name:string){
  envs = Array.from(new Set(envs));
  envs.forEach((env:string, index:number) => {
    if (env.search("%") !== -1) {
      envs[index] = env.replace(/%/g, '');
    } else if (env.search("$") !== -1) {
      envs[index] = env.replace(/$/g, '');
    }
  });
  return envs;
}

function parserXmlFile(element: BuildPlatformItem) {
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
              if (name.search('Linux') !== -1 || name.search('GCC') !== -1) {
                shellPath = bashPath;
                // Get all environment variables that need to be set
                // var envs = stepString.match(unixEnvRe);
              } else {
                shellPath = cmdPath;
                // var envs = stepString.match(winEnvRe);
                // var newEnvs = getEnvBeSet(envs, name);
              }
              item.command = {
                title: name,
                command: 'plugin-buildplatform.openChild',
                arguments: [name, shellPath, element.path, dealStepList.join(';')]
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
 * @description terminal
 * @terminalName platform name
 * @terminalIndex terminal index
 * @terminalPath create terminal shell path
 * @return create terminal
 */
 export class StatusBarTermianl {
  private _terminal: vscode.Terminal | undefined;
  public terminalName: string | undefined;
  public terminalIndex: number | undefined;
  public terminalPath: string | undefined;

  constructor(terminalIndex: number, terminalOptions: MyTerminalOptions, terminalCreate:boolean = true){
      this.terminalIndex = terminalIndex;
      this.terminalName = terminalOptions.terminalName;
      this.terminalPath = terminalOptions.terminalCwd;

      if (terminalCreate) {
          /* create ps terminal */
          this._terminal = vscode.window.createTerminal({
              name: this.terminalName,
              shellPath: terminalOptions.terminalShellpath,
              cwd: terminalOptions.terminalCwd
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
}


module.exports = function (context: vscode.ExtensionContext) {
    const folderList = getWorkSpaceFolders();
    if (folderList.length<=0) {
      console.log('current workspace not open project');
      vscode.window.showInformationMessage("Current workspace not open project");
      return;
    }

    const buildplatformProvider = new BuildPlatformProvider(folderList);
  
    // vscode.window.registerTreeDataProvider('Build-Command', buildplatformProvider);
    vscode.window.createTreeView('Build-Command',{treeDataProvider:buildplatformProvider});
  
    context.subscriptions.push(vscode.commands.registerCommand('plugin-buildplatform.openChild',async (name:string,shellPath:string,path:string,commands:string)=>{
        new StatusBarTermianl(terminalCount++, {
          terminalName: name,
          terminalShellpath: shellPath,
          terminalCwd: syspath.dirname(path),
          terminalText: commands,
          terminalAutoInputText: true
        });
    })
    
    );
  };
  