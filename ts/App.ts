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
    classpath: string = Swordfish.path.join('lib', 'h2-1.4.200.jar') + Swordfish.path.separator + Swordfish.path.join('lib', 'mariadb-java-client-2.4.3.jar');
    appHome: string = Swordfish.path.join(app.getPath('appData'), app.name);
    verticalPadding: number = 40;

    static currentDefaults: Rectangle;
    currentPreferences: any;
    currentTheme: string;
    currentStatus: any;

    defaultSrcLang: string;
    defaultTgtLang: string;

    saved: boolean = true;
    stopping: boolean = false;

    SUCCESS: string = 'Success';
    LOADING: string = 'Loading';
    COMPLETED: string = 'Completed';
    ERROR: string = 'Error';
    SAVING: string = 'Saving';
    PROCESSING: string = 'Processing';

    ls: ChildProcessWithoutNullStreams;

    constructor() {

        console.log('javapath:  ' + this.javapath);
        console.log('classpath: ' + this.classpath);
        console.log('appHome:   ' + this.appHome);

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

        // TODO remove H@ and MariaDB driver or add their licenses 

        if (process.platform == 'win32') {
            this.javapath = Swordfish.path.join(app.getAppPath(), 'bin', 'java.exe');
            this.verticalPadding = 50;
        }

        if (!existsSync(this.appHome)) {
            mkdirSync(this.appHome, { recursive: true });
        }

        this.ls = spawn(this.javapath, ['-cp', this.classpath, '--module-path', 'lib', '-m', 'swordfish/com.maxprograms.swordfish.TmsServer', '-port', '8070', '-debug'], { cwd: app.getAppPath() });

        this.ls.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        this.ls.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        this.ls.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
        });

        var ck: Buffer = execFileSync(this.javapath, ['--module-path', 'lib', '-m', 'openxliff/com.maxprograms.server.CheckURL', 'http://localhost:8070/TMSServer'], { cwd: app.getAppPath() });
        console.log(ck.toString());

        app.on('open-file', (event, filePath) => {
            event.preventDefault();
            this.openFile(filePath);
        });

        this.loadDefaults();
        this.loadPreferences();

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
                this.setTheme();
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

        nativeTheme.on('updated', () => {
            this.loadPreferences();
            this.setTheme();
        });

        ipcMain.on('get-projects', (event, arg) => {
            Swordfish.contents.send('start-waiting');
            Swordfish.contents.send('set-status', 'Loading projects');
            this.sendRequest('/projects/list', {},
                function success(json: any) {
                    Swordfish.contents.send('set-status', '');
                    Swordfish.contents.send('end-waiting');
                    if (json.status === this.SUCCESS) {
                        event.sender.send('set-projects', json.projects);
                    } else {
                        dialog.showMessageBox({ type: 'error', message: json.reason });
                    }
                },
                function error(data: string) {
                    Swordfish.contents.send('set-status', '');
                    dialog.showMessageBox({ type: 'error', message: data });
                }
            );
        });

        ipcMain.on('show-add-project', () => {
            Swordfish.addProject();
        });


        ipcMain.on('get-theme', (event, arg) => {
            event.sender.send('set-theme', this.currentTheme);
        });

        ipcMain.on('licenses-height', (event, arg) => {
            let rect: Rectangle = Swordfish.licensesWindow.getBounds();
            rect.height = arg.height + this.verticalPadding;
            Swordfish.licensesWindow.setBounds(rect);
        });

        ipcMain.on('save-preferences', (event, arg) => {
            Swordfish.settingsWindow.close();
            this.currentPreferences = arg;
            if (this.currentPreferences.srcLang) {
                this.defaultSrcLang = this.currentPreferences.srcLang;
            }
            if (this.currentPreferences.tgtLang) {
                this.defaultTgtLang = this.currentPreferences.tgtLang;
            }
            this.savePreferences();
        });

        ipcMain.on('add-project-height', (event, arg) => {
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

        ipcMain.on('about-height', (event, arg) => {
            let rect: Rectangle = Swordfish.aboutWindow.getBounds();
            rect.height = arg.height + this.verticalPadding;
            Swordfish.aboutWindow.setBounds(rect);
        });

        ipcMain.on('licenses-clicked', () => {
            Swordfish.showLicenses();
        });

        ipcMain.on('create-project', (event, arg) => {
            console.log(JSON.stringify(arg));
            Swordfish.addProjectWindow.close();
            Swordfish.contents.send('start-waiting');
            Swordfish.contents.send('set-status', 'Creating project');
            this.sendRequest('/projects/create', arg,
                function success(data: any) {
                    if (data.status !== this.SUCCESS) {
                        dialog.showErrorBox('Error', data.reason);
                    }
                    this.currentStatus = data;
                    Swordfish.contents.send('end-waiting');
                    Swordfish.contents.send('set-status', '');
                    /*
                    let processId: string = data.process;
                    var intervalObject = setInterval(() => {
                        if (currentStatus.status === COMPLETED) {
                            contents.send('end-waiting');
                            clearInterval(intervalObject);
                            // TODO
                            return;
                        } else if (currentStatus.status === PROCESSING) {
                            // it's OK, keep waiting
                        } else if (currentStatus.status === ERROR) {
                            contents.send('end-waiting');
                            contents.send('set-status', '');
                            clearInterval(intervalObject);
                            dialog.showErrorBox('Error', currentStatus.reason);
                            return;
                        } else if (currentStatus.status === SUCCESS) {
                            // ignore status from 'openFile'
                        } else {
                            contents.send('end-waiting');
                            clearInterval(intervalObject);
                            dialog.showErrorBox('Error', 'Unknown error processing files');
                            return;
                        }
                        getCreationProgress(processId);
                    }, 500);
                    */
                },
                function error(reason: string) {
                    dialog.showErrorBox('Error', reason);
                }
            );
        });

        ipcMain.on('show-add-memory', () => {
            Swordfish.addMemory();
        });

        ipcMain.on('add-memory-height', (event, arg) => {
            let rect: Rectangle = Swordfish.addMemoryWindow.getBounds();
            rect.height = arg.height + this.verticalPadding;
            Swordfish.addMemoryWindow.setBounds(rect);
        });

        ipcMain.on('get-clients', (event, arg) => {
            // TODO
        });

        ipcMain.on('get-subjects', (event, arg) => {
            // TODO
        });

        ipcMain.on('get-version', (event, arg) => {
            event.sender.send('set-version', app.name + ' ' + app.getVersion());
        });

        ipcMain.on('settings-height', (event, arg) => {
            let rect: Rectangle = Swordfish.settingsWindow.getBounds();
            rect.height = arg.height + this.verticalPadding;
            Swordfish.settingsWindow.setBounds(rect);
        });

        ipcMain.on('get-preferences', (event, arg) => {
            event.sender.send('set-preferences', this.currentPreferences);
        });

        ipcMain.on('open-license', function (event, arg: any) {
            var licenseFile = '';
            var title = '';
            switch (arg.type) {
                case 'Swordfish':
                    licenseFile = 'file://' + app.getAppPath() + '/html/licenses/license.txt'
                    title = 'Swordfish License';
                    break;
                case "electron":
                    licenseFile = 'file://' + app.getAppPath() + '/html/licenses/electron.txt'
                    title = 'MIT License';
                    break;
                case "TypeScript":
                case "MapDB":
                    licenseFile = 'file://' + app.getAppPath() + '/html/licenses/Apache2.0.html'
                    title = 'Apache 2.0';
                    break;
                case "Java":
                    licenseFile = 'file://' + app.getAppPath() + '/html/licenses/java.html'
                    title = 'GPL2 with Classpath Exception';
                    break;
                case "OpenXLIFF":
                case "TMEngine":
                    licenseFile = 'file://' + app.getAppPath() + '/html/licenses/EclipsePublicLicense1.0.html';
                    title = 'Eclipse Public License 1.0';
                    break;
                case "JSON":
                    licenseFile = 'file://' + app.getAppPath() + '/html/licenses/json.txt'
                    title = 'JSON.org License';
                    break;
                case "jsoup":
                    licenseFile = 'file://' + app.getAppPath() + '/html/licenses/jsoup.txt'
                    title = 'MIT License';
                    break;
                case "DTDParser":
                    licenseFile = 'file://' + app.getAppPath() + '/html/licenses/LGPL2.1.txt'
                    title = 'LGPL 2.1';
                    break;
                default:
                    dialog.showErrorBox('Error', 'Unknow license');
                    return;
            }
            var licenseWindow = new BrowserWindow({
                parent: Swordfish.mainWindow,
                width: 680,
                height: 400,
                show: false,
                title: title,
                icon: './icons/icon.png',
                webPreferences: {
                    nodeIntegration: true
                }
            });
            licenseWindow.setMenu(null);
            licenseWindow.loadURL(licenseFile);
            licenseWindow.show();
        });

    }

    static createWindow(): void {
        Swordfish.mainWindow = new BrowserWindow({
            title: app.name,
            width: Swordfish.currentDefaults.width,
            height: Swordfish.currentDefaults.height,
            x: Swordfish.currentDefaults.x,
            y: Swordfish.currentDefaults.y,
            useContentSize: true,
            webPreferences: {
                nodeIntegration: true
            },
            show: false,
            icon: 'icons/icon.png'
        });
        Swordfish.contents = Swordfish.mainWindow.webContents;
        var fileMenu: Menu = Menu.buildFromTemplate([
        ]);
        var editMenu: Menu = Menu.buildFromTemplate([
            { label: 'Undo', accelerator: 'CmdOrCtrl+Z', click: () => { Swordfish.contents.undo(); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Cut', accelerator: 'CmdOrCtrl+X', click: () => { Swordfish.contents.cut(); } },
            { label: 'Copy', accelerator: 'CmdOrCtrl+C', click: () => { Swordfish.contents.copy(); } },
            { label: 'Paste', accelerator: 'CmdOrCtrl+V', click: () => { Swordfish.contents.paste(); } },
            { label: 'Select All', accelerator: 'CmdOrCtrl+A', click: () => { Swordfish.contents.selectAll(); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Confirm Edit', accelerator: 'Alt+Enter', click: () => { Swordfish.saveEdits(); } },
            { label: 'Cancel Edit', accelerator: 'Esc', click: () => { Swordfish.cancelEdit(); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Replace Text...', accelerator: 'CmdOrCtrl+F', click: () => { Swordfish.replaceText(); } }
        ]);
        var viewMenu: Menu = Menu.buildFromTemplate([
            { label: 'Projects', accelerator: 'CmdOrCtrl+Alt+1', click: () => { Swordfish.viewProjects(); } },
            { label: 'Memories', accelerator: 'CmdOrCtrl+Alt+2', click: () => { Swordfish.viewMemories(); } },
            { label: 'Glossaries', accelerator: 'CmdOrCtrl+Alt+3', click: () => { Swordfish.viewGlossaries(); } },
            new MenuItem({ type: 'separator' }),
            new MenuItem({ label: 'Toggle Full Screen', role: 'togglefullscreen' }),
            new MenuItem({ label: 'Toggle Development Tools', accelerator: 'F12', role: 'toggleDevTools' }),
        ]);
        var projectsMenu: Menu = Menu.buildFromTemplate([
            { label: 'Add Project', click: () => { Swordfish.addProject(); } }
        ]);
        var memoriesMenu: Menu = Menu.buildFromTemplate([
            { label: 'Add Memory', click: () => { Swordfish.addMemory(); } }
        ]);
        var glossariesMenu: Menu = Menu.buildFromTemplate([]);
        var helpMenu: Menu = Menu.buildFromTemplate([
            { label: 'Swordfish User Guide', accelerator: 'F1', click: () => { Swordfish.showHelp(); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Check for Updates...', click: () => { Swordfish.checkUpdates(false); } },
            { label: 'View Licenses', click: () => { Swordfish.showLicenses(); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Release History', click: () => { Swordfish.showReleaseHistory(); } },
            { label: 'Support Group', click: () => { Swordfish.showSupportGroup(); } }
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
                new MenuItem({ label: 'About...', click: () => { Swordfish.showAbout(); } }),
                new MenuItem({
                    label: 'Preferences...', submenu: [
                        { label: 'Settings', accelerator: 'Cmd+,', click: () => { Swordfish.showSettings(); } }
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
                    { label: 'Preferences', click: () => { Swordfish.showSettings(); } }
                ]
            }));
            template.push(help);
        }
        if (process.platform == 'win32') {
            template[0].submenu.append(new MenuItem({ type: 'separator' }));
            template[0].submenu.append(new MenuItem({ label: 'Exit', accelerator: 'Alt+F4', role: 'quit', click: () => { app.quit(); } }));
            template[7].submenu.append(new MenuItem({ type: 'separator' }));
            template[7].submenu.append(new MenuItem({ label: 'About...', click: () => { Swordfish.showAbout(); } }));
        }
        if (process.platform === 'linux') {
            template[0].submenu.append(new MenuItem({ type: 'separator' }));
            template[0].submenu.append(new MenuItem({ label: 'Quit', accelerator: 'Ctrl+Q', role: 'quit', click: () => { app.quit(); } }));
            template[7].submenu.append(new MenuItem({ type: 'separator' }));
            template[7].submenu.append(new MenuItem({ label: 'About...', click: () => { Swordfish.showAbout(); } }));
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
        let defaultsFile: string = Swordfish.path.join(app.getPath('appData'), app.name, 'defaults.json');
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
        let defaultsFile: string = Swordfish.path.join(app.getPath('appData'), app.name, 'defaults.json');
        writeFileSync(defaultsFile, JSON.stringify(Swordfish.mainWindow.getBounds()));
    }

    loadPreferences(): void {
        this.currentPreferences = { theme: 'system', srcLang: 'none', tgtLang: 'none' };
        this.defaultSrcLang = 'none';
        this.defaultTgtLang = 'none';
        if (existsSync(this.appHome + 'preferences.json')) {
            try {
                var data: Buffer = readFileSync(this.appHome + 'preferences.json');
                this.currentPreferences = JSON.parse(data.toString());
            } catch (err) {
                console.log(err);
            }
        }
        if (this.currentPreferences.theme === 'system') {
            if (nativeTheme.shouldUseDarkColors) {
                this.currentTheme = app.getAppPath() + '/css/dark.css';
                nativeTheme.themeSource = 'dark';
            } else {
                this.currentTheme = app.getAppPath() + '/css/light.css';
                nativeTheme.themeSource = 'light';
            }
        }
        if (this.currentPreferences.theme === 'dark') {
            this.currentTheme = app.getAppPath() + '/css/dark.css';
            nativeTheme.themeSource = 'dark';
        }
        if (this.currentPreferences.theme === 'light') {
            this.currentTheme = app.getAppPath() + '/css/light.css';
            nativeTheme.themeSource = 'light';
        }
        if (this.currentPreferences.srcLang) {
            this.defaultSrcLang = this.currentPreferences.srcLang;
        }
        if (this.currentPreferences.tgtLang) {
            this.defaultTgtLang = this.currentPreferences.tgtLang;
        }
    }

    savePreferences(): void {
        writeFileSync(this.appHome + 'preferences.json', JSON.stringify(this.currentPreferences));
        nativeTheme.themeSource = this.currentPreferences.theme;
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
        Swordfish.addProjectWindow = new BrowserWindow({
            parent: Swordfish.mainWindow,
            width: this.getWidth('addProjectWindow'),
            minimizable: false,
            maximizable: false,
            // resizable: false,
            useContentSize: true,
            show: false,
            icon: './icons/icon.png',
            webPreferences: {
                nodeIntegration: true
            }
        });
        Swordfish.addProjectWindow.setMenu(null);
        Swordfish.addProjectWindow.loadURL('file://' + app.getAppPath() + '/html/addProject.html');
        Swordfish.addProjectWindow.once('ready-to-show', (event: IpcMainEvent) => {
            event.sender.send('get-height');
            Swordfish.addProjectWindow.show();
            Swordfish.addProjectWindow.webContents.openDevTools();
        });

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
        this.sendRequest('/services/getFileTypes', { files: files },
            function success(data: any) {
                event.sender.send('add-source-files', data);
            },
            function error(reason: string) {
                dialog.showErrorBox('Error', reason);
            }
        );
    }

    getLanguages(event: IpcMainEvent): void {
        this.sendRequest('/services/getLanguages', {},
            function success(data: any) {
                data.srcLang = this.defaultSrcLang;
                data.tgtLang = this.defaultTgtLang;
                event.sender.send('set-languages', data);
            },
            function error(reason: string) {
                dialog.showErrorBox('Error', reason);
            }
        );
    }

    getCreationProgress(processId: string): void {
        this.sendRequest('/projects/status', { process: processId },
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
        Swordfish.contents.send('view-memories');
    }

    static addMemory() {
        Swordfish.addMemoryWindow = new BrowserWindow({
            parent: Swordfish.mainWindow,
            width: Swordfish.getWidth('addMemoryWindow'),
            // height: getHeight('addMemoryWindow'),
            minimizable: false,
            maximizable: false,
            resizable: false,
            useContentSize: true,
            show: false,
            icon: './icons/icon.png',
            webPreferences: {
                nodeIntegration: true
            }
        });
        Swordfish.addMemoryWindow.setMenu(null);
        Swordfish.addMemoryWindow.loadURL('file://' + app.getAppPath() + '/html/addMemory.html');
        Swordfish.addMemoryWindow.once('ready-to-show', (event: IpcMainEvent) => {
            event.sender.send('get-height');
            Swordfish.addMemoryWindow.show();
        });
    }

    static viewGlossaries(): void {
        Swordfish.contents.send('view-glossaries');
    }

    sendRequest(url: string, json: any, success: any, error: any) {
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
        shell.openExternal('file://' + app.getAppPath() + '/swordfish.pdf',
            { activate: true, workingDirectory: app.getAppPath() }
        ).catch((error: Error) => {
            dialog.showErrorBox('Error', error.message);
        });
    }

    static showAbout(): void {
        Swordfish.aboutWindow = new BrowserWindow({
            parent: Swordfish.mainWindow,
            width: Swordfish.getWidth('aboutWindow'),
            minimizable: false,
            maximizable: false,
            resizable: false,
            useContentSize: true,
            show: false,
            icon: './icons/icon.png',
            webPreferences: {
                nodeIntegration: true
            }
        });
        Swordfish.aboutWindow.setMenu(null);
        Swordfish.aboutWindow.loadURL('file://' + app.getAppPath() + '/html/about.html');
        Swordfish.aboutWindow.once('ready-to-show', (event: IpcMainEvent) => {
            event.sender.send('get-height');
            Swordfish.aboutWindow.show();
        });
    }

    static showSettings(): void {
        Swordfish.settingsWindow = new BrowserWindow({
            parent: Swordfish.mainWindow,
            width: Swordfish.getWidth('settingsWindow'),
            useContentSize: true,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: './icons/icon.png',
            webPreferences: {
                nodeIntegration: true
            }
        });
        Swordfish.settingsWindow.setMenu(null);
        Swordfish.settingsWindow.loadURL('file://' + app.getAppPath() + '/html/preferences.html');
        Swordfish.settingsWindow.once('ready-to-show', (event: IpcMainEvent) => {
            event.sender.send('get-height');
            Swordfish.settingsWindow.show();
        });
    }

    static showLicenses(): void {
        Swordfish.licensesWindow = new BrowserWindow({
            parent: Swordfish.mainWindow,
            width: Swordfish.getWidth('licensesWindow'),
            useContentSize: true,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: './icons/icon.png',
            webPreferences: {
                nodeIntegration: true
            }
        });
        Swordfish.licensesWindow.setMenu(null);
        Swordfish.licensesWindow.loadURL('file://' + app.getAppPath() + '/html/licenses.html');
        Swordfish.licensesWindow.once('ready-to-show', (event: IpcMainEvent) => {
            event.sender.send('get-height');
            Swordfish.licensesWindow.show();
        });
    }



    static showReleaseHistory(): void {
        shell.openExternal('https://www.maxprograms.com/products/swfishlog.html');
    }

    static showSupportGroup(): void {
        shell.openExternal('https://groups.io/g/maxprograms/');
    }

    setTheme(): void {
        Swordfish.contents.send('set-theme', this.currentTheme);
    }



    static checkUpdates(silent: boolean): void {
        Swordfish.https.get('https://raw.githubusercontent.com/rmraya/Swordfish/master/package.json', (res: IncomingMessage) => {
            if (res.statusCode === 200) {
                let rawData = '';
                res.on('data', (chunk: string) => {
                    rawData += chunk;
                });
                res.on('end', () => {
                    try {
                        const parsedData = JSON.parse(rawData);
                        if (app.getVersion() !== parsedData.version) {
                            dialog.showMessageBox(Swordfish.mainWindow, {
                                type: 'info',
                                title: 'Updates Available',
                                message: 'Version ' + parsedData.version + ' is available'
                            });
                        } else {
                            if (!silent) {
                                dialog.showMessageBox(Swordfish.mainWindow, {
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

    static getWidth(window: string): number {
        switch (process.platform) {
            case 'win32': {
                switch (window) {
                    case 'aboutWindow': { return 495; }
                    case 'licensesWindow': { return 430; }
                    case 'settingsWindow': { return 600; }
                    case 'addMemoryWindow': { return 450; }
                    case 'addProjectWindow': { return 800; }
                }
                break;
            }
            case 'darwin': {
                switch (window) {
                    case 'aboutWindow': { return 495; }
                    case 'licensesWindow': { return 430; }
                    case 'settingsWindow': { return 600; }
                    case 'addMemoryWindow': { return 450; }
                    case 'addProjectWindow': { return 800; }
                }
                break;
            }
            case 'linux': {
                switch (window) {
                    case 'aboutWindow': { return 495; }
                    case 'licensesWindow': { return 430; }
                    case 'settingsWindow': { return 600; }
                    case 'addMemoryWindow': { return 450; }
                    case 'addProjectWindow': { return 800; }
                }
                break;
            }
        }
    }
}

new Swordfish();