/*****************************************************************************
Copyright (c) 2007-2020 - Maxprograms,  http://www.maxprograms.com/

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to compile,
modify and use the Software in its executable form without restrictions.

Redistribution of this Software or parts of it in any form (source code or
executable binaries) requires prior written permission from Maxprograms.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*****************************************************************************/

import { Buffer } from "buffer";
import { execFileSync, spawn, ChildProcessWithoutNullStreams } from "child_process";
import { app, BrowserWindow, dialog, ipcMain, Menu, MenuItem, shell, webContents, nativeTheme, Rectangle, IpcMainEvent } from "electron";
import { existsSync, mkdirSync, readFile, readFileSync, writeFile, writeFileSync } from "fs";
import { ClientRequest, request, IncomingMessage } from "http";

class Swordfish {

    static path = require('path');
    static https = require('https');

    static mainWindow: BrowserWindow;
    static settingsWindow: BrowserWindow;
    static aboutWindow: BrowserWindow;
    static licensesWindow: BrowserWindow;
    static addMemoryWindow: BrowserWindow;
    static addProjectWindow: BrowserWindow;

    static contents: webContents;
    javapath: string = Swordfish.path.join(app.getAppPath(), 'bin', 'java');
    classpath: string = Swordfish.path.join('lib', 'h2-1.4.200.jar')
        + Swordfish.path.separator
        + Swordfish.path.join('lib', 'mariadb-java-client-2.4.3.jar');
    static appHome: string = Swordfish.path.join(app.getPath('appData'), app.getName());
    static iconPath: string = Swordfish.path.join(app.getAppPath(), 'icons', 'icon.png');
    verticalPadding: number = 46;

    static currentDefaults: Rectangle;
    static currentPreferences = {
        theme: 'system',
        srcLang: 'none',
        tgtLang: 'none',
        catalog: Swordfish.path.join(app.getAppPath(), 'catalog', 'catalog.xml'),
        srx: Swordfish.path.join(app.getAppPath(), 'srx', 'default.srx')
    }
    static currentCss: string;
    static currentStatus: any;

    saved: boolean = true;
    stopping: boolean = false;

    static SUCCESS: string = 'Success';
    static LOADING: string = 'Loading';
    static COMPLETED: string = 'Completed';
    static ERROR: string = 'Error';
    static SAVING: string = 'Saving';
    static PROCESSING: string = 'Processing';

    ls: ChildProcessWithoutNullStreams;

    constructor() {

        console.log('javapath:  ' + this.javapath);
        console.log('classpath: ' + this.classpath);
        console.log('appHome:   ' + Swordfish.appHome);

        app.allowRendererProcessReuse = true;
        if (!app.requestSingleInstanceLock()) {
            app.quit();
        } else {
            if (Swordfish.mainWindow) {
                // Someone tried to run a second instance, we should focus our window.
                if (Swordfish.mainWindow.isMinimized()) {
                    Swordfish.mainWindow.restore();
                }
                Swordfish.mainWindow.focus();
            }
        }

        // TODO remove H2 and MariaDB driver or add their licenses 

        if (process.platform == 'win32') {
            this.javapath = Swordfish.path.join(app.getAppPath(), 'bin', 'java.exe');
        }

        if (!existsSync(Swordfish.appHome)) {
            mkdirSync(Swordfish.appHome, { recursive: true });
        }

        this.ls = spawn(this.javapath, ['-cp', this.classpath, '--module-path', 'lib', '-m', 'swordfish/com.maxprograms.swordfish.TmsServer', '-port', '8070'], { cwd: app.getAppPath() });

        this.ls.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        this.ls.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        this.ls.on('close', (code: number) => {
            if (code === 0) {
                let data: string = JSON.stringify({ command: 'stop' });
                var options = {
                    hostname: '127.0.0.1',
                    port: 8070,
                    path: '/',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(data)
                    }
                };
                var req: ClientRequest = request(options);
                req.write(data);
                req.end();
                console.log('Restarting server');
                this.ls = spawn(this.javapath, ['-cp', this.classpath, '--module-path', 'lib', '-m', 'swordfish/com.maxprograms.swordfish.TmsServer', '-port', '8070'], { cwd: app.getAppPath() });
            }
        });

        var ck: Buffer = execFileSync(this.javapath, ['--module-path', 'lib', '-m', 'openxliff/com.maxprograms.server.CheckURL', 'http://localhost:8070/TMSServer'], { cwd: app.getAppPath() });
        console.log(ck.toString());

        app.on('open-file', (event, filePath) => {
            event.preventDefault();
            this.openFile(filePath);
        });

        this.loadDefaults();
        Swordfish.loadPreferences();

        app.on('ready', () => {
            Swordfish.createWindow();
            Swordfish.mainWindow.loadURL(Swordfish.path.join('file://', app.getAppPath(), 'index.html'));
            Swordfish.mainWindow.on('resize', () => {
                this.saveDefaults();
            });
            Swordfish.mainWindow.on('move', () => {
                this.saveDefaults();
            });
            Swordfish.mainWindow.once('ready-to-show', () => {
                Swordfish.mainWindow.setBounds(Swordfish.currentDefaults);
                Swordfish.mainWindow.show();
            });
            Swordfish.checkUpdates(true);
        });

        app.on('quit', () => {
            this.stopServer();
        });

        app.on('window-all-closed', () => {
            this.stopServer();
            app.quit();
        });

        if (process.platform === 'darwin') {
            app.on('open-file', (event, path) => {
                event.preventDefault();
                this.openFile(path);
            });
        }

        if (process.platform === 'win32') {
            nativeTheme.on('updated', () => {
                Swordfish.setTheme();
            });
        }
        ipcMain.on('get-projects', (event: IpcMainEvent, arg: any) => {
            Swordfish.getProjects(event);
        });
        ipcMain.on('show-add-project', () => {
            Swordfish.addProject();
        });
        ipcMain.on('get-theme', (event: IpcMainEvent, arg: any) => {
            event.sender.send('set-theme', Swordfish.currentCss);
        });
        ipcMain.on('licenses-height', (event: IpcMainEvent, arg: any) => {
            let rect: Rectangle = Swordfish.licensesWindow.getBounds();
            rect.height = arg.height + this.verticalPadding;
            Swordfish.licensesWindow.setBounds(rect);
        });
        ipcMain.on('save-preferences', (event: IpcMainEvent, arg: any) => {
            Swordfish.savePreferences(arg);
        });
        ipcMain.on('add-project-height', (event: IpcMainEvent, arg: any) => {
            let rect: Rectangle = Swordfish.addProjectWindow.getBounds();
            rect.height = arg.height + this.verticalPadding;
            Swordfish.addProjectWindow.setBounds(rect);
        });
        ipcMain.on('get-languages', (event) => {
            this.getLanguages(event);
        });
        ipcMain.on('select-source-files', (event) => {
            this.selectSourceFiles(event);
        });
        ipcMain.on('about-height', (event: IpcMainEvent, arg: any) => {
            let rect: Rectangle = Swordfish.aboutWindow.getBounds();
            rect.height = arg.height + this.verticalPadding;
            Swordfish.aboutWindow.setBounds(rect);
        });
        ipcMain.on('licenses-clicked', () => {
            Swordfish.showLicenses();
        });
        ipcMain.on('create-project', (event: IpcMainEvent, arg: any) => {
            this.createProject(arg);
        });
        ipcMain.on('show-add-memory', () => {
            Swordfish.addMemory();
        });
        ipcMain.on('add-memory-height', (event: IpcMainEvent, arg: any) => {
            let rect: Rectangle = Swordfish.addMemoryWindow.getBounds();
            rect.height = arg.height + this.verticalPadding;
            Swordfish.addMemoryWindow.setBounds(rect);
        });
        ipcMain.on('get-clients', (event: IpcMainEvent, arg: any) => {
            // TODO
        });
        ipcMain.on('get-subjects', (event: IpcMainEvent, arg: any) => {
            // TODO
        });
        ipcMain.on('get-types', (event: IpcMainEvent, arg: any) => {
            this.getTypes(event);
        });
        ipcMain.on('get-charsets', (event: IpcMainEvent, arg: any) => {
            this.getCharset(event);
        });
        ipcMain.on('get-version', (event: IpcMainEvent, arg: any) => {
            event.sender.send('set-version', app.getName() + ' ' + app.getVersion());
        });
        ipcMain.on('settings-height', (event: IpcMainEvent, arg: any) => {
            let rect: Rectangle = Swordfish.settingsWindow.getBounds();
            rect.height = arg.height + this.verticalPadding;
            Swordfish.settingsWindow.setBounds(rect);
        });
        ipcMain.on('get-preferences', (event: IpcMainEvent, arg: any) => {
            event.sender.send('set-preferences', Swordfish.currentPreferences);
        });
        ipcMain.on('browse-srx', (event, arg) => {
            this.browseSRX(event);
        });
        ipcMain.on('browse-catalog', (event, arg) => {
            this.browseCatalog(event);
        });
        ipcMain.on('open-license', (event: IpcMainEvent, arg: any) => {
            Swordfish.openLicense(arg.type);
        });

    } // end constructor

    static createWindow(): void {
        this.mainWindow = new BrowserWindow({
            title: app.getName(),
            width: this.currentDefaults.width,
            height: this.currentDefaults.height,
            x: this.currentDefaults.x,
            y: this.currentDefaults.y,
            useContentSize: true,
            webPreferences: {
                nodeIntegration: true
            },
            show: false,
            icon: 'icons/icon.png'
        });
        this.contents = this.mainWindow.webContents;
        var fileMenu: Menu = Menu.buildFromTemplate([
        ]);
        var editMenu: Menu = Menu.buildFromTemplate([
            { label: 'Undo', accelerator: 'CmdOrCtrl+Z', click: () => { this.contents.undo(); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Cut', accelerator: 'CmdOrCtrl+X', click: () => { this.contents.cut(); } },
            { label: 'Copy', accelerator: 'CmdOrCtrl+C', click: () => { this.contents.copy(); } },
            { label: 'Paste', accelerator: 'CmdOrCtrl+V', click: () => { this.contents.paste(); } },
            { label: 'Select All', accelerator: 'CmdOrCtrl+A', click: () => { this.contents.selectAll(); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Confirm Edit', accelerator: 'Alt+Enter', click: () => { this.saveEdits(); } },
            { label: 'Cancel Edit', accelerator: 'Esc', click: () => { this.cancelEdit(); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Replace Text...', accelerator: 'CmdOrCtrl+F', click: () => { this.replaceText(); } }
        ]);
        var viewMenu: Menu = Menu.buildFromTemplate([
            { label: 'Projects', accelerator: 'CmdOrCtrl+Alt+1', click: () => { this.viewProjects(); } },
            { label: 'Memories', accelerator: 'CmdOrCtrl+Alt+2', click: () => { this.viewMemories(); } },
            { label: 'Glossaries', accelerator: 'CmdOrCtrl+Alt+3', click: () => { this.viewGlossaries(); } },
            new MenuItem({ type: 'separator' }),
            new MenuItem({ label: 'Toggle Full Screen', role: 'togglefullscreen' }),
            new MenuItem({ label: 'Toggle Development Tools', accelerator: 'F12', role: 'toggleDevTools' }),
        ]);
        var projectsMenu: Menu = Menu.buildFromTemplate([
            { label: 'Add Project', click: () => { this.addProject(); } }
        ]);
        var memoriesMenu: Menu = Menu.buildFromTemplate([
            { label: 'Add Memory', click: () => { this.addMemory(); } }
        ]);
        var glossariesMenu: Menu = Menu.buildFromTemplate([]);
        var helpMenu: Menu = Menu.buildFromTemplate([
            { label: 'Swordfish User Guide', accelerator: 'F1', click: () => { this.showHelp(); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Check for Updates...', click: () => { this.checkUpdates(false); } },
            { label: 'View Licenses', click: () => { this.showLicenses(); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Release History', click: () => { this.showReleaseHistory(); } },
            { label: 'Support Group', click: () => { this.showSupportGroup(); } }
        ]);
        var template: MenuItem[] = [
            new MenuItem({ label: '&File', role: 'fileMenu', submenu: fileMenu }),
            new MenuItem({ label: '&Edit', role: 'editMenu', submenu: editMenu }),
            new MenuItem({ label: '&View', role: 'viewMenu', submenu: viewMenu }),
            new MenuItem({ label: '&Projects', submenu: projectsMenu }),
            new MenuItem({ label: '&Memories', submenu: memoriesMenu }),
            new MenuItem({ label: '&Glossaries', submenu: glossariesMenu }),
            new MenuItem({ label: '&Help', role: 'help', submenu: helpMenu })
        ];
        if (process.platform === 'darwin') {
            var appleMenu: Menu = Menu.buildFromTemplate([
                new MenuItem({ label: 'About...', click: () => { this.showAbout(); } }),
                new MenuItem({
                    label: 'Preferences...', submenu: [
                        { label: 'Settings', accelerator: 'Cmd+,', click: () => { this.showSettings(); } }
                    ]
                }),
                new MenuItem({ type: 'separator' }),
                new MenuItem({
                    label: 'Services', role: 'services', submenu: [
                        { label: 'No Services Apply', enabled: false }
                    ]
                }),
                new MenuItem({ type: 'separator' }),
                new MenuItem({ label: 'Quit Swordfish', accelerator: 'Cmd+Q', role: 'quit', click: () => { app.quit(); } })
            ]);
            template.unshift(new MenuItem({ label: 'Swordfish', role: 'appMenu', submenu: appleMenu }));
        } else {
            var help: MenuItem = template.pop();
            template.push(new MenuItem({
                label: '&Settings', submenu: [
                    { label: 'Preferences', click: () => { this.showSettings(); } }
                ]
            }));
            template.push(help);
        }
        if (process.platform == 'win32') {
            template[0].submenu.append(new MenuItem({ type: 'separator' }));
            template[0].submenu.append(new MenuItem({ label: 'Exit', accelerator: 'Alt+F4', role: 'quit', click: () => { app.quit(); } }));
            template[7].submenu.append(new MenuItem({ type: 'separator' }));
            template[7].submenu.append(new MenuItem({ label: 'About...', click: () => { this.showAbout(); } }));
        }
        if (process.platform === 'linux') {
            template[0].submenu.append(new MenuItem({ type: 'separator' }));
            template[0].submenu.append(new MenuItem({ label: 'Quit', accelerator: 'Ctrl+Q', role: 'quit', click: () => { app.quit(); } }));
            template[7].submenu.append(new MenuItem({ type: 'separator' }));
            template[7].submenu.append(new MenuItem({ label: 'About...', click: () => { this.showAbout(); } }));
        }
        Menu.setApplicationMenu(Menu.buildFromTemplate(template));
    }

    stopServer(): void {
        if (!this.stopping) {
            this.stopping = true;
            if (!this.saved) {
                let response = dialog.showMessageBoxSync(Swordfish.mainWindow, { type: 'question', message: 'Save changes?', buttons: ['Yes', 'No'] });
                if (response === 0) {
                    this.saveFile();
                }
            }
            this.ls.kill();
        }
    }

    loadDefaults(): void {
        let defaultsFile: string = Swordfish.path.join(app.getPath('appData'), app.getName(), 'defaults.json');
        Swordfish.currentDefaults = { width: 900, height: 700, x: 0, y: 0 };
        if (existsSync(defaultsFile)) {
            try {
                var data: Buffer = readFileSync(defaultsFile);
                Swordfish.currentDefaults = JSON.parse(data.toString());
            } catch (err) {
                console.log(err);
            }
        }
    }

    saveDefaults(): void {
        let defaultsFile: string = Swordfish.path.join(app.getPath('appData'), app.getName(), 'defaults.json');
        writeFileSync(defaultsFile, JSON.stringify(Swordfish.mainWindow.getBounds()));
    }

    static loadPreferences(): void {
        let dark: string = 'file://' + Swordfish.path.join(app.getAppPath(), 'css', 'dark.css');
        let light: string = 'file://' + Swordfish.path.join(app.getAppPath(), 'css', 'light.css');
        let teal: string = 'file://' + Swordfish.path.join(app.getAppPath(), 'css', 'teal.css');
        let preferencesFile = Swordfish.path.join(app.getPath('appData'), app.getName(), 'preferences.json');
        if (existsSync(preferencesFile)) {
            try {
                var data: Buffer = readFileSync(preferencesFile);
                Swordfish.currentPreferences = JSON.parse(data.toString());
            } catch (err) {
                console.log(err);
            }
        } else {
            writeFileSync(Swordfish.path.join(app.getPath('appData'), app.getName(), 'preferences.json'), JSON.stringify(Swordfish.currentPreferences));
        }
        if (Swordfish.currentPreferences.theme === 'system') {
            if (nativeTheme.shouldUseDarkColors) {
                Swordfish.currentCss = dark;
                nativeTheme.themeSource = 'dark';
            } else {
                Swordfish.currentCss = light;
                nativeTheme.themeSource = 'light';
            }
        }
        if (Swordfish.currentPreferences.theme === 'dark') {
            Swordfish.currentCss = dark;
            nativeTheme.themeSource = 'dark';
        }
        if (Swordfish.currentPreferences.theme === 'light') {
            Swordfish.currentCss = light;
            nativeTheme.themeSource = 'light';
        }
        if (Swordfish.currentPreferences.theme === 'teal') {
            Swordfish.currentCss = teal;
            nativeTheme.themeSource = 'dark';
        }
    }

    static savePreferences(arg: any): void {
        Swordfish.settingsWindow.close();
        Swordfish.mainWindow.focus();
        writeFileSync(Swordfish.path.join(app.getPath('appData'), app.getName(), 'preferences.json'), JSON.stringify(arg));
        Swordfish.loadPreferences();
        Swordfish.setTheme();
    }

    openFile(file: string): void {
        // TODO
    }

    saveFile(): void {
        // TODO
    }

    static saveEdits(): void {
        // TODO
    }

    static cancelEdit(): void {
        // TODO
    }

    static replaceText(): void {
        // TODO
    }

    static viewProjects(): void {
        Swordfish.contents.send('view-projects');
    }

    static addProject() {
        this.addProjectWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: this.getWidth('addProjectWindow'),
            minimizable: false,
            maximizable: false,
            resizable: false,
            useContentSize: true,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true
            }
        });
        this.addProjectWindow.setMenu(null);
        this.addProjectWindow.loadURL(this.path.join('file://', app.getAppPath(), 'html', 'addProject.html'));
        this.addProjectWindow.once('ready-to-show', (event: IpcMainEvent) => {
            event.sender.send('get-height');
            this.addProjectWindow.show();
        });
    }

    createProject(arg: any): void {
        Swordfish.addProjectWindow.close();
        Swordfish.mainWindow.focus();
        Swordfish.contents.send('start-waiting');
        Swordfish.contents.send('set-status', 'Creating project');
        Swordfish.sendRequest('/projects/create', arg,
            function success(data: any) {
                if (data.status !== Swordfish.SUCCESS) {
                    Swordfish.contents.send('end-waiting');
                    Swordfish.contents.send('set-status', '');
                    dialog.showErrorBox('Error', data.reason);
                }
                Swordfish.currentStatus = data;
                let processId: string = data.process;
                var intervalObject = setInterval(() => {
                    if (Swordfish.currentStatus.progress) {
                        if (Swordfish.currentStatus.progress === Swordfish.COMPLETED) {
                            Swordfish.contents.send('end-waiting');
                            clearInterval(intervalObject);
                            Swordfish.contents.send('request-projects');
                            return;
                        } else if (Swordfish.currentStatus.progress === Swordfish.PROCESSING) {
                            // it's OK, keep waiting
                        } else if (Swordfish.currentStatus.progress === Swordfish.ERROR) {
                            Swordfish.contents.send('end-waiting');
                            Swordfish.contents.send('set-status', '');
                            clearInterval(intervalObject);
                            dialog.showErrorBox('Error', Swordfish.currentStatus.reason);
                            return;
                        } else {
                            Swordfish.contents.send('end-waiting');
                            Swordfish.contents.send('set-status', '');
                            clearInterval(intervalObject);
                            dialog.showErrorBox('Error', 'Unknown error processing files');
                            return;
                        }
                    }
                    Swordfish.getCreationProgress(processId);
                }, 500);

            },
            function error(reason: string) {
                dialog.showErrorBox('Error', reason);
            }
        );
    }

    static getCreationProgress(process: string): void {
        this.sendRequest('/projects/status', { process: process },
            function success(data: any) {
                Swordfish.currentStatus = data;
            },
            function error(reason: string) {
                dialog.showErrorBox('Error', reason);
            }
        );
    }

    static getProjects(event: IpcMainEvent): void {
        Swordfish.contents.send('start-waiting');
        Swordfish.contents.send('set-status', 'Loading projects');
        Swordfish.sendRequest('/projects/list', {},
            function success(data: any) {
                Swordfish.contents.send('set-status', '');
                Swordfish.contents.send('end-waiting');
                if (data.status === Swordfish.SUCCESS) {
                    event.sender.send('set-projects', data.projects);
                } else {
                    dialog.showMessageBox({ type: 'error', message: data.reason });
                }
            },
            function error(reason: string) {
                Swordfish.contents.send('set-status', '');
                dialog.showMessageBox({ type: 'error', message: reason });
            }
        );
    }

    selectSourceFiles(event: IpcMainEvent): void {
        dialog.showOpenDialog({
            properties: ['openFile', 'multiSelections'],
            filters: [
                { name: 'Any File', extensions: ['*'] },
                { name: 'Adobe InDesign Interchange', extensions: ['inx'] },
                { name: 'Adobe InDesign IDML', extensions: ['idml'] },
                { name: 'DITA Map', extensions: ['ditamap', 'dita', 'xml'] },
                { name: 'HTML Page', extensions: ['html', 'htm'] },
                { name: 'JavaScript', extensions: ['js'] },
                { name: 'Java Properties', extensions: ['properties'] },
                { name: 'MIF (Maker Interchange Format)', extensions: ['mif'] },
                { name: 'Microsoft Office 2007 Document', extensions: ['docx', 'xlsx', 'pptx'] },
                { name: 'OpenOffice 1.x Document', extensions: ['sxw', 'sxc', 'sxi', 'sxd'] },
                { name: 'OpenOffice 2.x Document', extensions: ['odt', 'ods', 'odp', 'odg'] },
                { name: 'Plain Text', extensions: ['txt'] },
                { name: 'PO (Portable Objects)', extensions: ['po', 'pot'] },
                { name: 'RC (Windows C/C++ Resources)', extensions: ['rc'] },
                { name: 'ResX (Windows .NET Resources)', extensions: ['resx'] },
                { name: 'SDLXLIFF Document', extensions: ['sdlxliff'] },
                { name: 'SVG (Scalable Vector Graphics)', extensions: ['svg'] },
                { name: 'Trados Studio Package', extensions: ['sdlppx'] },
                { name: 'TS (Qt Linguist translation source)', extensions: ['ts'] },
                { name: 'TXML Document', extensions: ['txml'] },
                { name: 'Visio XML Drawing', extensions: ['vsdx'] },
                { name: 'WPML XLIFF', extensions: ['xliff'] },
                { name: 'XML Document', extensions: ['xml'] }
            ]
        }).then((value) => {
            if (!value.canceled) {
                this.getFileType(event, value.filePaths);
            }
        }).catch((error) => {
            console.log(error);
        });
    }

    getFileType(event: IpcMainEvent, files: string[]): void {
        Swordfish.sendRequest('/services/getFileType', { files: files },
            function success(data: any) {
                event.sender.send('add-source-files', data);
            },
            function error(reason: string) {
                dialog.showErrorBox('Error', reason);
            }
        );
    }

    getLanguages(event: IpcMainEvent): void {
        Swordfish.sendRequest('/services/getLanguages', {},
            function success(data: any) {
                data.srcLang = Swordfish.currentPreferences.srcLang;
                data.tgtLang = Swordfish.currentPreferences.tgtLang;
                event.sender.send('set-languages', data);
            },
            function error(reason: string) {
                dialog.showErrorBox('Error', reason);
            }
        );
    }

    getCreationProgress(processId: string): void {
        Swordfish.sendRequest('/projects/status', { process: processId },
            function success(data: any) {
                this.currentStatus = data;
            },
            function error(reason: string) {
                this.currentStatus = this.ERROR;
                dialog.showErrorBox('Error', reason);
            }
        );
    }

    static viewMemories(): void {
        this.contents.send('view-memories');
    }

    static addMemory() {
        this.addMemoryWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: this.getWidth('addMemoryWindow'),
            minimizable: false,
            maximizable: false,
            resizable: false,
            useContentSize: true,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true
            }
        });
        this.addMemoryWindow.setMenu(null);
        this.addMemoryWindow.loadURL(this.path.join('file://', app.getAppPath(), 'html', 'addMemory.html'));
        this.addMemoryWindow.once('ready-to-show', (event: IpcMainEvent) => {
            event.sender.send('get-height');
            this.addMemoryWindow.show();
        });
    }

    static viewGlossaries(): void {
        this.contents.send('view-glossaries');
    }

    static sendRequest(url: string, json: any, success: any, error: any) {
        var postData: string = JSON.stringify(json);
        var options = {
            hostname: '127.0.0.1',
            port: 8070,
            path: url,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        // Make a request
        var req: ClientRequest = request(options);
        req.on('response',
            function (res: any) {
                res.setEncoding('utf-8');
                if (res.statusCode != 200) {
                    error('sendRequest() error: ' + res.statusMessage);
                }
                var rawData: string = '';
                res.on('data', function (chunk: string) {
                    rawData += chunk;
                });
                res.on('end', () => {
                    try {
                        success(JSON.parse(rawData));
                    } catch (e) {
                        error(e.message);
                    }
                });
            }
        );
        req.write(postData);
        req.end();
    }

    static showHelp(): void {
        shell.openExternal(this.path.join('file://', app.getAppPath(), 'swordfish.pdf'));
    }

    static showAbout(): void {
        this.aboutWindow = new BrowserWindow({
            parent: Swordfish.mainWindow,
            width: Swordfish.getWidth('aboutWindow'),
            minimizable: false,
            maximizable: false,
            resizable: false,
            useContentSize: true,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true
            }
        });
        this.aboutWindow.setMenu(null);
        this.aboutWindow.loadURL(this.path.join('file://', app.getAppPath(), 'html', 'about.html'));
        this.aboutWindow.once('ready-to-show', (event: IpcMainEvent) => {
            event.sender.send('get-height');
            this.aboutWindow.show();
        });
    }

    static openLicense(type: string) {
        var licenseFile = '';
        var title = '';
        switch (type) {
            case 'Swordfish':
                licenseFile = this.path.join('file://', app.getAppPath(), 'html', 'licenses', 'license.txt');
                title = 'Swordfish License';
                break;
            case "electron":
                licenseFile = this.path.join('file://', app.getAppPath(), 'html', 'licenses', 'electron.txt');
                title = 'MIT License';
                break;
            case "TypeScript":
            case "MapDB":
                licenseFile = this.path.join('file://', app.getAppPath(), 'html', 'licenses', 'Apache2.0.html');
                title = 'Apache 2.0';
                break;
            case "Java":
                licenseFile = this.path.join('file://', app.getAppPath(), 'html', 'licenses', 'java.html');
                title = 'GPL2 with Classpath Exception';
                break;
            case "OpenXLIFF":
            case "TMEngine":
                licenseFile = this.path.join('file://', app.getAppPath(), 'html', 'licenses', 'EclipsePublicLicense1.0.html');
                title = 'Eclipse Public License 1.0';
                break;
            case "JSON":
                licenseFile = this.path.join('file://', app.getAppPath(), 'html', 'licenses', 'json.txt');
                title = 'JSON.org License';
                break;
            case "jsoup":
                licenseFile = this.path.join('file://', app.getAppPath(), 'html', 'licenses', 'jsoup.txt');
                title = 'MIT License';
                break;
            case "DTDParser":
                licenseFile = this.path.join('file://', app.getAppPath(), 'html', 'licenses', 'LGPL2.1.txt');
                title = 'LGPL 2.1';
                break;
            default:
                dialog.showErrorBox('Error', 'Unknow license');
                return;
        }
        var licenseWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: 680,
            height: 400,
            show: false,
            title: title,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true
            }
        });
        licenseWindow.setMenu(null);
        licenseWindow.loadURL(licenseFile);
        licenseWindow.on('ready-to-show', () => {
            licenseWindow.show();
        });

    }

    static showSettings(): void {
        this.settingsWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: this.getWidth('settingsWindow'),
            useContentSize: true,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true
            }
        });
        this.settingsWindow.setMenu(null);
        this.settingsWindow.loadURL(this.path.join('file://', app.getAppPath(), 'html', 'preferences.html'));
        this.settingsWindow.once('ready-to-show', (event: IpcMainEvent) => {
            event.sender.send('get-height');
            this.settingsWindow.show();
        });
    }

    static showLicenses(): void {
        this.licensesWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: this.getWidth('licensesWindow'),
            useContentSize: true,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true
            }
        });
        this.licensesWindow.setMenu(null);
        this.licensesWindow.loadURL(this.path.join('file://', app.getAppPath(), 'html', 'licenses.html'));
        this.licensesWindow.once('ready-to-show', (event: IpcMainEvent) => {
            event.sender.send('get-height');
            this.licensesWindow.show();
        });
    }

    static showReleaseHistory(): void {
        shell.openExternal('https://www.maxprograms.com/products/swfishlog.html');
    }

    static showSupportGroup(): void {
        shell.openExternal('https://groups.io/g/maxprograms/');
    }

    static setTheme(): void {
        Swordfish.contents.send('request-theme');
    }

    static checkUpdates(silent: boolean): void {
        this.https.get('https://raw.githubusercontent.com/rmraya/Swordfish/master/package.json', (res: IncomingMessage) => {
            if (res.statusCode === 200) {
                let rawData = '';
                res.on('data', (chunk: string) => {
                    rawData += chunk;
                });
                res.on('end', () => {
                    try {
                        const parsedData = JSON.parse(rawData);
                        if (app.getVersion() !== parsedData.version) {
                            dialog.showMessageBox(this.mainWindow, {
                                type: 'info',
                                title: 'Updates Available',
                                message: 'Version ' + parsedData.version + ' is available'
                            });
                        } else {
                            if (!silent) {
                                dialog.showMessageBox(this.mainWindow, {
                                    type: 'info',
                                    message: 'There are currently no updates available'
                                });
                            }
                        }
                    } catch (e) {
                        dialog.showErrorBox('Error', e.message);
                    }
                });
            } else {
                if (!silent) {
                    dialog.showErrorBox('Error', 'Updates Request Failed.\nStatus code: ' + res.statusCode);
                }
            }
        }).on('error', (e: any) => {
            if (!silent) {
                dialog.showErrorBox('Error', e.message);
            }
        });
    }

    getTypes(event: IpcMainEvent): void {
        Swordfish.sendRequest('/services/getFileTypes', {},
            function success(data: any) {
                if (data.status === Swordfish.SUCCESS) {
                    event.sender.send('set-types', data);
                } else {
                    dialog.showErrorBox('Error', data.reason);
                }
            },
            function error(reason: string) {
                dialog.showErrorBox('Error', reason);
            }
        );
    }

    getCharset(event: IpcMainEvent): void {
        Swordfish.sendRequest('/services/getCharsets', {},
            function success(data: any) {
                if (data.status === Swordfish.SUCCESS) {
                    event.sender.send('set-charsets', data);
                } else {
                    dialog.showErrorBox('Error', data.reason);
                }
            },
            function error(reason: string) {
                dialog.showErrorBox('Error', reason);
            }
        );
    }

    browseSRX(event: IpcMainEvent): void {
        dialog.showOpenDialog({
            title: 'Default SRX File',
            defaultPath: Swordfish.currentPreferences.srx,
            properties: ['openFile'],
            filters: [
                { name: 'SRX File', extensions: ['srx'] },
                { name: 'Any File', extensions: ['*'] }
            ]
        }).then((value) => {
            if (!value.canceled) {
                event.sender.send('set-srx', value.filePaths[0]);
            }
        }).catch((error) => {
            console.log(error);
        });
    }

    browseCatalog(event: IpcMainEvent): void {
        dialog.showOpenDialog({
            title: 'Default Catalog',
            defaultPath: Swordfish.currentPreferences.catalog,
            properties: ['openFile'],
            filters: [
                { name: 'XML File', extensions: ['xml'] },
                { name: 'Any File', extensions: ['*'] }
            ]
        }).then((value) => {
            if (!value.canceled) {
                event.sender.send('set-catalog', value.filePaths[0]);
            }
        }).catch((error) => {
            console.log(error);
        });
    }

    static getWidth(window: string): number {
        switch (process.platform) {
            case 'win32': {
                switch (window) {
                    case 'aboutWindow': { return 360; }
                    case 'licensesWindow': { return 430; }
                    case 'settingsWindow': { return 600; }
                    case 'addMemoryWindow': { return 450; }
                    case 'addProjectWindow': { return 900; }
                }
                break;
            }
            case 'darwin': {
                switch (window) {
                    case 'aboutWindow': { return 360; }
                    case 'licensesWindow': { return 430; }
                    case 'settingsWindow': { return 600; }
                    case 'addMemoryWindow': { return 450; }
                    case 'addProjectWindow': { return 900; }
                }
                break;
            }
            case 'linux': {
                switch (window) {
                    case 'aboutWindow': { return 360; }
                    case 'licensesWindow': { return 430; }
                    case 'settingsWindow': { return 600; }
                    case 'addMemoryWindow': { return 450; }
                    case 'addProjectWindow': { return 900; }
                }
                break;
            }
        }
    }
}

new Swordfish();