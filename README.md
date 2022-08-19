# vscode-buildplatform-extension

## Vscode version
    vscode engines: 1.64.0 version above.

## Run extension on location

* github link: <https://github.com/mingyueliang/vscode-buildplatform-extension.git>
* git clone https://github.com/mingyueliang/vscode-buildplatform-extension.git
* npm install
* run F5

## Goal
    By parsing the manifest XML file, generate treeview to view, edit and execute this command.
    
## Usage
* The following items are open in the current workspace.
![workspace](/markdown/project.png)
* Click the icon indicated by the arrow at the bottom right of the left to view the items in the tree view.
![worksapce](/markdown/project-1.png)
* Directly click the item under each item to see a WebView in the editing area on the right.
![workspace](/markdown/project-2.png)
* Click the run button of each item to open the vscode terminal and execute the command.
![workspace](/markdown/project-3.png)

## Not available?
* There are no projects open in the current workspace.
* There is no repo directory or no manifest under the project opened in the current workspace XML file.
* There is no command to execute in the XML file, and no item can be seen under the item in the tree view.
* There are no commands in the XML file that need to be executed under the current system, and no item can be seen under the item in the tree view.