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
Instructions: 

1, Please read the last section of this article before using it.
[Not available?](#NotAvailable)

2, Only if the repo/manifest.xml file exists in the first level directory of the project in the current workspace, the plug-in will display the correct effect.

![workspace](/markdown/display.png)

As can be seen in the above figure, the repo/manifest.xml file exists only under the birchstreamRP project in the three projects. At this time, the results are as follows through the plugin:

![workspace](/markdown/display1.png)

3, The specific operation is as follows:

* The following items are open in the current workspace.
![workspace](/markdown/project.png)
* Click the icon indicated by the arrow at the bottom right of the left to view the items in the tree view.
![worksapce](/markdown/project-1.png)
* Directly click the item under each item to see a WebView in the editing area on the right.
![workspace](/markdown/project-2.png)
* Click the run button of each item to open the vscode terminal and execute the command.
![workspace](/markdown/project-3.png)

<h2 id="NotAvailable">Not available?</h2>

* There are no projects open in the current workspace.
* There is no repo directory under the open project in the current workspace, or there is no manifest.xml file under the repo directory.
* There is no command to execute in the XML file, and no item can be seen under the item in the tree view.
* There are no commands in the XML file that need to be executed under the current system, and no item can be seen under the item in the tree view.