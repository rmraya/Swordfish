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
import { app, clipboard, BrowserWindow, dialog, ipcMain, Menu, MenuItem, shell, webContents, nativeTheme, Rectangle, IpcMainEvent, screen, Size } from "electron";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { ClientRequest, request, IncomingMessage } from "http";

class Swordfish {

    static path = require('path');
    static https = require('https');

    static mainWindow: BrowserWindow;
    static settingsWindow: BrowserWindow;
    static aboutWindow: BrowserWindow;
    static licensesWindow: BrowserWindow;
    static addMemoryWindow: BrowserWindow;
    static importTmxWindow: BrowserWindow;
    static addProjectWindow: BrowserWindow;
    static addFileWindow: BrowserWindow;
    static defaultLangsWindow: BrowserWindow;
    static spellingLangsWindow: BrowserWindow;
    static findTextWindow: BrowserWindow;
    static messagesWindow: BrowserWindow;

    javapath: string = Swordfish.path.join(app.getAppPath(), 'bin', 'java');

    static appHome: string = Swordfish.path.join(app.getPath('appData'), app.name);
    static iconPath: string = Swordfish.path.join(app.getAppPath(), 'icons', 'icon.png');
    verticalPadding: number = 46;

    static currentDefaults: Rectangle;
    static currentPreferences = {
        theme: 'system',
        srcLang: 'none',
        tgtLang: 'none',
        catalog: Swordfish.path.join(app.getAppPath(), 'catalog', 'catalog.xml'),
        srx: Swordfish.path.join(app.getAppPath(), 'srx', 'default.srx'),
        paragraphSegmentation: false,
        acceptUnconfirmed: false,
        google: {
            enabled: false,
            apiKey: '',
            srcLang: 'none',
            tgtLang: 'none',
            neural: false
        },
        azure: {
            enabled: false,
            apiKey: '',
            srcLang: 'none',
            tgtLang: 'none'
        },
        yandex: {
            enabled: false,
            apiKey: '',
            srcLang: 'none',
            tgtLang: 'none'
        },
        deepl: {
            enabled: false,
            apiKey: '',
            srcLang: 'none',
            tgtLang: 'none'
        },
        myMemory: {
            enabled: false,
            apiKey: '',
            srcLang: 'none',
            tgtLang: 'none'
        },
        spellchecker: {
            defaultEnglish: 'en-US',
            defaultPortuguese: 'pt-BR',
            defaultSpanish: 'es'
        }
    }
    static currentCss: string;
    static currentStatus: any;

    stopping: boolean = false;

    static SUCCESS: string = 'Success';
    static LOADING: string = 'Loading';
    static COMPLETED: string = 'Completed';
    static ERROR: string = 'Error';
    static SAVING: string = 'Saving';
    static PROCESSING: string = 'Processing';

    static spellCheckerLanguages: string[];

    ls: ChildProcessWithoutNullStreams;

    constructor() {

        console.log('javapath:  ' + this.javapath);
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

        if (process.platform === 'win32') {
            this.javapath = Swordfish.path.join(app.getAppPath(), 'bin', 'java.exe');
        }

        if (!existsSync(Swordfish.appHome)) {
            mkdirSync(Swordfish.appHome, { recursive: true });
        }

        this.ls = spawn(this.javapath, ['-cp', 'lib/h2-1.4.200.jar', '--module-path', 'lib', '-m', 'swordfish/com.maxprograms.swordfish.TmsServer', '-port', '8070'], { cwd: app.getAppPath() });

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
                this.ls = spawn(this.javapath, ['--module-path', 'lib', '-m', 'swordfish/com.maxprograms.swordfish.TmsServer', '-port', '8070'], { cwd: app.getAppPath() });
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
            Swordfish.mainWindow.loadURL('file://' + Swordfish.path.join(app.getAppPath(), 'html', 'index.html'));
            Swordfish.mainWindow.on('resize', () => {
                this.saveDefaults();
            });
            Swordfish.mainWindow.on('move', () => {
                this.saveDefaults();
            });
            Swordfish.mainWindow.once('ready-to-show', () => {
                Swordfish.mainWindow.setBounds(Swordfish.currentDefaults);
                Swordfish.mainWindow.show();
                if (Swordfish.currentPreferences.srcLang === 'none') {
                    Swordfish.getDefaultLanguages();
                }
                Swordfish.spellCheckerLanguages = Swordfish.mainWindow.webContents.session.availableSpellCheckerLanguages;
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
            if (Swordfish.currentPreferences.theme === 'system') {
                if (nativeTheme.shouldUseDarkColors) {
                    Swordfish.currentCss = 'file://' + Swordfish.path.join(app.getAppPath(), 'css', 'dark.css');
                } else {
                    Swordfish.currentCss = 'file://' + Swordfish.path.join(app.getAppPath(), 'css', 'light.css');
                }
                Swordfish.mainWindow.webContents.send('set-theme', Swordfish.currentCss);
            }
        });
        ipcMain.on('get-projects', (event: IpcMainEvent, arg: any) => {
            Swordfish.getProjects(event);
        });
        ipcMain.on('get-memories', (event: IpcMainEvent, arg: any) => {
            Swordfish.getMemories(event);
        });
        ipcMain.on('show-add-file', () => {
            Swordfish.addFile();
        });
        ipcMain.on('show-add-project', () => {
            Swordfish.addProject();
        });
        ipcMain.on('export-translations', (event: IpcMainEvent, arg: any) => {
            Swordfish.exportTranslations(arg);
        });
        ipcMain.on('export-open-project', (event: IpcMainEvent, arg: any) => {
            Swordfish.exportOpenProject(arg);
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
        ipcMain.on('save-languages', (event: IpcMainEvent, arg: any) => {
            Swordfish.savelanguages(arg);
        });
        ipcMain.on('add-project-height', (event: IpcMainEvent, arg: any) => {
            let rect: Rectangle = Swordfish.addProjectWindow.getBounds();
            rect.height = arg.height + this.verticalPadding;
            Swordfish.addProjectWindow.setBounds(rect);
        });
        ipcMain.on('add-file-height', (event: IpcMainEvent, arg: any) => {
            let rect: Rectangle = Swordfish.addFileWindow.getBounds();
            rect.height = arg.height + this.verticalPadding;
            Swordfish.addFileWindow.setBounds(rect);
        });
        ipcMain.on('get-languages', (event: IpcMainEvent) => {
            this.getLanguages(event);
        });
        ipcMain.on('select-source-files', (event: IpcMainEvent) => {
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
        ipcMain.on('remove-projects', (event: IpcMainEvent, arg: any) => {
            Swordfish.removeProjects(arg);
        });
        ipcMain.on('close-project', (event: IpcMainEvent, arg: any) => {
            Swordfish.closeProject(arg);
        });
        ipcMain.on('show-add-memory', () => {
            Swordfish.showAddMemory();
        });
        ipcMain.on('add-memory-height', (event: IpcMainEvent, arg: any) => {
            let rect: Rectangle = Swordfish.addMemoryWindow.getBounds();
            rect.height = arg.height + this.verticalPadding;
            Swordfish.addMemoryWindow.setBounds(rect);
        });
        ipcMain.on('add-memory', (event: IpcMainEvent, arg: any) => {
            this.addMemory(arg);
        });
        ipcMain.on('show-import-tmx', (event: IpcMainEvent, arg: any) => {
            Swordfish.showImportTMX(arg);
        });
        ipcMain.on('import-tmx-height', (event: IpcMainEvent, arg: any) => {
            let rect: Rectangle = Swordfish.importTmxWindow.getBounds();
            rect.height = arg.height + this.verticalPadding;
            Swordfish.importTmxWindow.setBounds(rect);
        });
        ipcMain.on('import-tmx-file', (event: IpcMainEvent, arg: any) => {
            Swordfish.importTmxFile(arg);
        });
        ipcMain.on('remove-memories', (event: IpcMainEvent, arg: any) => {
            this.removeMemories(arg);
        });
        ipcMain.on('export-memories', (event: IpcMainEvent, arg: any) => {
            this.exportMemories(arg);
        });
        ipcMain.on('get-tmx-file', (event: IpcMainEvent, arg: any) => {
            this.getTmxFile(event);
        });
        ipcMain.on('get-clients', (event: IpcMainEvent, arg: any) => {
            this.getClients(event);
        });
        ipcMain.on('get-project-names', (event: IpcMainEvent, arg: any) => {
            this.getProjectNames(event);
        });
        ipcMain.on('get-subjects', (event: IpcMainEvent, arg: any) => {
            this.getSubjects(event);
        });
        ipcMain.on('get-types', (event: IpcMainEvent, arg: any) => {
            this.getTypes(event);
        });
        ipcMain.on('get-charsets', (event: IpcMainEvent, arg: any) => {
            this.getCharset(event);
        });
        ipcMain.on('get-version', (event: IpcMainEvent, arg: any) => {
            event.sender.send('set-version', app.name + ' ' + app.getVersion());
        });
        ipcMain.on('settings-height', (event: IpcMainEvent, arg: any) => {
            let rect: Rectangle = Swordfish.settingsWindow.getBounds();
            rect.height = arg.height + this.verticalPadding;
            Swordfish.settingsWindow.setBounds(rect);
        });
        ipcMain.on('languages-height', (event: IpcMainEvent, arg: any) => {
            let rect: Rectangle = Swordfish.defaultLangsWindow.getBounds();
            rect.height = arg.height + this.verticalPadding;
            Swordfish.defaultLangsWindow.setBounds(rect);
        });
        ipcMain.on('get-preferences', (event: IpcMainEvent, arg: any) => {
            event.sender.send('set-preferences', Swordfish.currentPreferences);
        });
        ipcMain.on('browse-srx', (event: IpcMainEvent, arg: any) => {
            this.browseSRX(event);
        });
        ipcMain.on('browse-catalog', (event: IpcMainEvent, arg: any) => {
            this.browseCatalog(event);
        });
        ipcMain.on('get-mt-languages', (event: IpcMainEvent, arg: any) => {
            this.getMtLanguages(event);
        });
        ipcMain.on('open-license', (event: IpcMainEvent, arg: any) => {
            Swordfish.openLicense(arg.type);
        });
        ipcMain.on('show-message', (event: IpcMainEvent, arg: any) => {
            Swordfish.showMessage(arg);
        });
        ipcMain.on('add-tab', (event: IpcMainEvent, arg: any) => {
            Swordfish.mainWindow.webContents.send('add-tab', arg);
        });
        ipcMain.on('get-segments-count', (event: IpcMainEvent, arg: any) => {
            Swordfish.getSegmenstCount(event, arg);
        });
        ipcMain.on('get-segments', (event: IpcMainEvent, arg: any) => {
            Swordfish.getSegmenst(event, arg);
        });
        ipcMain.on('paste-tag', (event: IpcMainEvent, arg: any) => {
            clipboard.writeHTML(arg);
            Swordfish.mainWindow.webContents.paste();
        });
        ipcMain.on('save-translation', (event: IpcMainEvent, arg: any) => {
            Swordfish.saveTranslation(arg);
        });
        ipcMain.on('get-matches', (event: IpcMainEvent, arg: any) => {
            Swordfish.getMatches(arg);
        });
        ipcMain.on('machine-translate', (event: IpcMainEvent, arg: any) => {
            Swordfish.machineTranslate(arg);
        });
        ipcMain.on('accept-match', (event: IpcMainEvent, arg: any) => {
            Swordfish.mainWindow.webContents.send('set-target', arg);
        });
        ipcMain.on('get-mt-matches', () => {
            Swordfish.mainWindow.webContents.send('get-mt-matches');
        });
        ipcMain.on('search-memory', () => {
            Swordfish.mainWindow.webContents.send('get-tm-matches');
        });
        ipcMain.on('search-memory-all', (event: IpcMainEvent, arg: any) => {
            Swordfish.tmTranslateAll(arg);
        });
        ipcMain.on('tm-translate', (event: IpcMainEvent, arg: any) => {
            Swordfish.tmTranslate(arg);
        });
        ipcMain.on('get-project-memories', (event: IpcMainEvent, arg: any) => {
            Swordfish.getProjectMemories(arg);
        });
        ipcMain.on('set-project-memory', (event: IpcMainEvent, arg: any) => {
            Swordfish.setProjectMemory(arg);
        });
        ipcMain.on('spell-language', (event: IpcMainEvent, arg: any) => {
            Swordfish.setSpellcheckerLanguage(arg);
        });
        ipcMain.on('show-spellchecker-langs', () => {
            Swordfish.showSpellCheckerLangs();
        });
        ipcMain.on('get-spellchecker-langs', (event: IpcMainEvent) => {
            Swordfish.getSpellCheckerLangs(event);
        });
        ipcMain.on('set-spellchecker-height', (event: IpcMainEvent, arg: any) => {
            let rect: Rectangle = Swordfish.spellingLangsWindow.getBounds();
            rect.height = arg.height + this.verticalPadding;
            Swordfish.spellingLangsWindow.setBounds(rect);
        });
        ipcMain.on('show-find-text', (event: IpcMainEvent, arg: any) => {
            Swordfish.showFindText(arg);
        });
        ipcMain.on('find-text-height', (event: IpcMainEvent, arg: any) => {
            let rect: Rectangle = Swordfish.findTextWindow.getBounds();
            rect.height = arg.height + this.verticalPadding;
            Swordfish.findTextWindow.setBounds(rect);
        });
        ipcMain.on('messages-height', (event: IpcMainEvent, arg: any) => {
            let rect: Rectangle = Swordfish.messagesWindow.getBounds();
            rect.height = arg.height + this.verticalPadding;
            Swordfish.messagesWindow.setBounds(rect);
        });
    } // end constructor

    static createWindow(): void {

        if (Swordfish.currentDefaults === undefined) {
            let size: Size = screen.getPrimaryDisplay().workAreaSize;
            Swordfish.currentDefaults = { width: Math.round(size.width * 0.9), height: Math.round(size.height * 0.9), x: 0, y: 0 };
        }

        this.mainWindow = new BrowserWindow({
            title: app.name,
            width: this.currentDefaults.width,
            height: this.currentDefaults.height,
            x: this.currentDefaults.x,
            y: this.currentDefaults.y,
            useContentSize: true,
            webPreferences: {
                nodeIntegration: true
            },
            show: false,
            icon: this.iconPath
        });

        this.mainWindow.webContents.on('context-menu', (event: Electron.Event, params: any) => {
            const menu = new Menu();
            // Add each spelling suggestion
            for (const suggestion of params.dictionarySuggestions) {
                menu.append(new MenuItem({
                    label: suggestion,
                    click: () => this.mainWindow.webContents.replaceMisspelling(suggestion)
                }));
            }
            // Allow users to add the misspelled word to the dictionary
            if (params.misspelledWord) {
                menu.append(new MenuItem({ type: 'separator' }));
                menu.append(
                    new MenuItem({
                        label: 'Add to dictionary',
                        click: () => this.mainWindow.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord)
                    })
                );
            }
            menu.popup();
        });
        var fileMenu: Menu = Menu.buildFromTemplate([
            { label: 'Translate Single File', accelerator: 'CmdOrCtrl+N', click: () => { Swordfish.addFile(); } }
        ]);
        var tagsMenu: Menu = Menu.buildFromTemplate([
            { label: 'Insert Tag "1"', accelerator: 'CmdOrCtrl+1', click: () => { Swordfish.mainWindow.webContents.send('insert tag', { tag: 1 }); } },
            { label: 'Insert Tag "2"', accelerator: 'CmdOrCtrl+2', click: () => { Swordfish.mainWindow.webContents.send('insert tag', { tag: 2 }); } },
            { label: 'Insert Tag "3"', accelerator: 'CmdOrCtrl+3', click: () => { Swordfish.mainWindow.webContents.send('insert tag', { tag: 3 }); } },
            { label: 'Insert Tag "4"', accelerator: 'CmdOrCtrl+4', click: () => { Swordfish.mainWindow.webContents.send('insert tag', { tag: 4 }); } },
            { label: 'Insert Tag "5"', accelerator: 'CmdOrCtrl+5', click: () => { Swordfish.mainWindow.webContents.send('insert tag', { tag: 5 }); } },
            { label: 'Insert Tag "6"', accelerator: 'CmdOrCtrl+6', click: () => { Swordfish.mainWindow.webContents.send('insert tag', { tag: 6 }); } },
            { label: 'Insert Tag "7"', accelerator: 'CmdOrCtrl+7', click: () => { Swordfish.mainWindow.webContents.send('insert tag', { tag: 7 }); } },
            { label: 'Insert Tag "8"', accelerator: 'CmdOrCtrl+8', click: () => { Swordfish.mainWindow.webContents.send('insert tag', { tag: 8 }); } },
            { label: 'Insert Tag "8"', accelerator: 'CmdOrCtrl+9', click: () => { Swordfish.mainWindow.webContents.send('insert tag', { tag: 9 }); } },
            { label: 'Insert Tag "10"', accelerator: 'CmdOrCtrl+0', click: () => { Swordfish.mainWindow.webContents.send('insert tag', { tag: 10 }); } }
        ]);
        var editMenu: Menu = Menu.buildFromTemplate([
            { label: 'Undo', accelerator: 'CmdOrCtrl+Z', click: () => { Swordfish.mainWindow.webContents.undo(); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Cut', accelerator: 'CmdOrCtrl+X', click: () => { Swordfish.mainWindow.webContents.cut() } },
            { label: 'Copy', accelerator: 'CmdOrCtrl+C', click: () => { Swordfish.mainWindow.webContents.copy() } },
            { label: 'Paste', accelerator: 'CmdOrCtrl+V', click: () => { Swordfish.mainWindow.webContents.paste() } },
            { label: 'Select All', accelerator: 'CmdOrCtrl+A', click: () => { Swordfish.mainWindow.webContents.selectAll() } },
            new MenuItem({ type: 'separator' }),
            { label: 'Save Changes', accelerator: 'Alt+Enter', click: () => { Swordfish.mainWindow.webContents.send('save-edit', { confirm: false, next: 'none' }); } },
            { label: 'Discard Changes', accelerator: 'Esc', click: () => { Swordfish.mainWindow.webContents.send('cancel-edit'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Insert Tag', accelerator: 'CmdOrCtrl+T', click: () => { Swordfish.mainWindow.webContents.send('insert-tag'); } },
            new MenuItem({ label: 'Quick Tags', submenu: tagsMenu }),
            { label: 'Insert Next Tag', accelerator: 'CmdOrCtrl+Shift+T', click: () => { Swordfish.mainWindow.webContents.send('insert-next-tag'); } },
            { label: 'Insert Remaining Tags', accelerator: 'CmdOrCtrl+Alt+T', click: () => { Swordfish.mainWindow.webContents.send('insert-remaining-tags'); } },
            { label: 'Remove all Tags', accelerator: 'CmdOrCtrl+Shift+R', click: () => { Swordfish.mainWindow.webContents.send('remove-tags'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Find Text', accelerator: 'CmdOrCtrl+F', click: () => { this.findText(); } },
            { label: 'Replace Text', accelerator: 'CmdOrCtrl+Alt+F', click: () => { this.replaceText(); } },
        ]);
        var viewMenu: Menu = Menu.buildFromTemplate([
            { label: 'Projects', accelerator: 'CmdOrCtrl+Alt+1', click: () => { Swordfish.viewProjects(); } },
            { label: 'Memories', accelerator: 'CmdOrCtrl+Alt+2', click: () => { Swordfish.viewMemories(); } },
            { label: 'Glossaries', accelerator: 'CmdOrCtrl+Alt+3', click: () => { Swordfish.viewGlossaries(); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Close Selected Tab', accelerator: 'CmdOrCtrl+W', click: () => { Swordfish.closeSelectedTab(); } },
            new MenuItem({ type: 'separator' }),
            { label: 'First Page', accelerator: 'CmdOrCtrl+Shift+Home', click: () => { Swordfish.mainWindow.webContents.send('first-page'); } },
            { label: 'Previous Page', accelerator: 'CmdOrCtrl+Home', click: () => { Swordfish.mainWindow.webContents.send('previous-page'); } },
            { label: 'Next Page', accelerator: 'CmdOrCtrl+End', click: () => { Swordfish.mainWindow.webContents.send('next-page'); } },
            { label: 'Last Page', accelerator: 'CmdOrCtrl+Shift+End', click: () => { Swordfish.mainWindow.webContents.send('last-page'); } },
            new MenuItem({ type: 'separator' }),
            new MenuItem({ label: 'Toggle Full Screen', role: 'togglefullscreen' }),
            new MenuItem({ label: 'Toggle Development Tools', accelerator: 'F12', role: 'toggleDevTools' }),
        ]);
        var projectsMenu: Menu = Menu.buildFromTemplate([
            { label: 'New Project', accelerator: 'CmdOrCtrl+Shift+N', click: () => { Swordfish.addProject(); } },
            { label: 'Translate Projects', accelerator: 'CmdOrCtrl+O', click: () => { Swordfish.translateProjects(); } },
            { label: 'Export Translations', click: () => { Swordfish.mainWindow.webContents.send('export-translations'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Remove Projects', click: () => { Swordfish.mainWindow.webContents.send('remove-projects'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Import Project', click: () => { Swordfish.mainWindow.webContents.send('import-project'); } },
            { label: 'Export Project', click: () => { Swordfish.mainWindow.webContents.send('export-project'); } }
        ]);
        var memoriesMenu: Menu = Menu.buildFromTemplate([
            { label: 'Add Memory', click: () => { Swordfish.showAddMemory(); } },
            { label: 'Remove Memory', click: () => { Swordfish.removeMemory(); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Import TMX File', click: () => { Swordfish.importTMX(); } },
            { label: 'Export as TMX File', click: () => { Swordfish.exportTMX(); } }
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
        let nextUntranslatedKey = 'Ctrl+Alt+Down';
        let nextUnconfirmedKey = 'Ctrl+Shift+Down';
        if (process.platform === 'win32') { // TODO check on Linux
            nextUntranslatedKey = 'Alt+Down';
            nextUnconfirmedKey = 'Alt+Shift+Down';
        }
        var tasksMenu: Menu = Menu.buildFromTemplate([
            { label: 'Confirm Translation', accelerator: 'CmdOrCtrl+E', click: () => { Swordfish.mainWindow.webContents.send('save-edit', { confirm: true, next: 'none' }); } },
            { label: 'Confirm and go to Next Untranslated', accelerator: nextUntranslatedKey, click: () => { Swordfish.mainWindow.webContents.send('save-edit', { confirm: true, next: 'untranslated' }); } },
            { label: 'Confirm and go to Next Unconfirmed', accelerator: nextUnconfirmedKey, click: () => { Swordfish.mainWindow.webContents.send('save-edit', { confirm: true, next: 'unconfirmed' }); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Copy Source to Target', accelerator: 'CmdOrCtrl+P', click: () => { Swordfish.mainWindow.webContents.send('copy-source'); } },
            { label: 'Accept TM Match', accelerator: 'CmdOrCtrl+Alt+A', click: () => { Swordfish.mainWindow.webContents.send('accept-tm-match'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Accept Machine Translation', click: () => { Swordfish.mainWindow.webContents.send('accept-mt-match'); } },
            { label: 'Get Machine Translations', accelerator: 'CmdOrCtrl+L', click: () => { Swordfish.mainWindow.webContents.send('get-mt-matches'); } },
            { label: 'Apply MT to all Segments', click: () => { Swordfish.mainWindow.webContents.send('apply-mt-all'); } }
        ]);
        var template: MenuItem[] = [
            new MenuItem({ label: '&File', role: 'fileMenu', submenu: fileMenu }),
            new MenuItem({ label: '&Edit', role: 'editMenu', submenu: editMenu }),
            new MenuItem({ label: '&View', role: 'viewMenu', submenu: viewMenu }),
            new MenuItem({ label: '&Projects', submenu: projectsMenu }),
            new MenuItem({ label: '&Memories', submenu: memoriesMenu }),
            new MenuItem({ label: '&Glossaries', submenu: glossariesMenu }),
            new MenuItem({ label: '&Tasks', submenu: tasksMenu }),
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
        if (process.platform === 'win32') {
            template[0].submenu.append(new MenuItem({ type: 'separator' }));
            template[0].submenu.append(new MenuItem({ label: 'Exit', accelerator: 'Alt+F4', role: 'quit', click: () => { app.quit(); } }));
            template[8].submenu.append(new MenuItem({ type: 'separator' }));
            template[8].submenu.append(new MenuItem({ label: 'About...', click: () => { this.showAbout(); } }));
        }
        if (process.platform === 'linux') {
            template[0].submenu.append(new MenuItem({ type: 'separator' }));
            template[0].submenu.append(new MenuItem({ label: 'Quit', accelerator: 'Ctrl+Q', role: 'quit', click: () => { app.quit(); } }));
            template[8].submenu.append(new MenuItem({ type: 'separator' }));
            template[8].submenu.append(new MenuItem({ label: 'About...', click: () => { this.showAbout(); } }));
        }
        Menu.setApplicationMenu(Menu.buildFromTemplate(template));
    }

    stopServer(): void {
        if (!this.stopping) {
            this.stopping = true;
            this.ls.kill();
        }
    }

    loadDefaults(): void {
        let defaultsFile: string = Swordfish.path.join(app.getPath('appData'), app.name, 'defaults.json');
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

    static loadPreferences(): void {
        let dark: string = 'file://' + Swordfish.path.join(app.getAppPath(), 'css', 'dark.css');
        let light: string = 'file://' + Swordfish.path.join(app.getAppPath(), 'css', 'light.css');
        let teal: string = 'file://' + Swordfish.path.join(app.getAppPath(), 'css', 'teal.css');
        let preferencesFile = Swordfish.path.join(app.getPath('appData'), app.name, 'preferences.json');
        if (existsSync(preferencesFile)) {
            try {
                var data: Buffer = readFileSync(preferencesFile);
                Swordfish.currentPreferences = JSON.parse(data.toString());
            } catch (err) {
                console.log(err);
            }
        } else {
            writeFileSync(Swordfish.path.join(app.getPath('appData'), app.name, 'preferences.json'), JSON.stringify(Swordfish.currentPreferences));
        }
        if (Swordfish.currentPreferences.theme === 'system') {
            if (nativeTheme.shouldUseDarkColors) {
                Swordfish.currentCss = dark;
            } else {
                Swordfish.currentCss = light;
            }
        }
        if (Swordfish.currentPreferences.theme === 'dark') {
            Swordfish.currentCss = dark;
        }
        if (Swordfish.currentPreferences.theme === 'light') {
            Swordfish.currentCss = light;
        }
        if (Swordfish.currentPreferences.theme === 'teal') {
            Swordfish.currentCss = teal;
        }
    }

    static savePreferences(arg: any): void {
        Swordfish.settingsWindow.close();
        Swordfish.mainWindow.focus();
        writeFileSync(Swordfish.path.join(app.getPath('appData'), app.name, 'preferences.json'), JSON.stringify(arg));
        Swordfish.loadPreferences();
        Swordfish.setTheme();
    }

    openFile(file: string): void {
        // TODO
    }

    static findText(): void {
        Swordfish.mainWindow.webContents.send('find-text');
    }

    static showFindText(project: string): void {
        this.findTextWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: 500,
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
        this.findTextWindow.setMenu(null);
        this.findTextWindow.loadURL('file://' + this.path.join(app.getAppPath(), 'html', 'findText.html'));
        this.findTextWindow.once('ready-to-show', (event: IpcMainEvent) => {
            event.sender.send('get-height');
            event.sender.send('set-project', project)
            this.findTextWindow.show();
        });
    }

    static replaceText(): void {
        // TODO
    }

    static viewProjects(): void {
        Swordfish.mainWindow.webContents.send('view-projects');
    }

    static closeSelectedTab(): void {
        Swordfish.mainWindow.webContents.send('close-tab');
    }

    static addProject() {
        this.addProjectWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: 900,
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
        this.addProjectWindow.loadURL('file://' + this.path.join(app.getAppPath(), 'html', 'addProject.html'));
        this.addProjectWindow.once('ready-to-show', (event: IpcMainEvent) => {
            event.sender.send('get-height');
            this.addProjectWindow.show();
        });
    }

    static exportOpenProject(arg: any): void {
        Swordfish.sendRequest('/projects/get', arg,
            (data: any) => {
                Swordfish.exportTranslations(data);
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static exportTranslations(project: any): void {
        if (project.files.length === 1 && project.files[0].type !== 'DITA Map') {
            let parsed: any = Swordfish.getSaveName(project.files[0], project.targetLang);
            dialog.showSaveDialog(Swordfish.mainWindow, {
                defaultPath: parsed.defaultPath,
                filters: parsed.filters,
                properties: ['createDirectory', 'showOverwriteConfirmation']
            }).then((value) => {
                if (!value.canceled) {
                    Swordfish.sendRequest('/projects/export', { project: project.id, output: value.filePath },
                        (data: any) => {
                            Swordfish.exportProject(data, value.filePath, true);
                        }, (reason: string) => {
                            Swordfish.showMessage({ type: 'error', message: reason });
                        }
                    );
                }
            }).catch((error) => {
                console.log(error);
            });
        } else {
            dialog.showSaveDialog(Swordfish.mainWindow, { properties: ['createDirectory'] }).then((value) => {
                if (!value.canceled) {
                    Swordfish.sendRequest('/projects/export', { project: project.id, output: value.filePath },
                        (data: any) => {
                            Swordfish.exportProject(data, value.filePath, false);
                        }, (reason: string) => {
                            Swordfish.showMessage({ type: 'error', message: reason });
                        }
                    );
                }
            }).catch((error) => {
                console.log(error);
            });
        }
    }

    static exportProject(data: any, output: string, isFile: boolean): void {
        if (data.status !== Swordfish.SUCCESS) {
            dialog.showErrorBox('Error', data.reason);
        }
        Swordfish.mainWindow.webContents.send('start-waiting');
        Swordfish.mainWindow.webContents.send('set-status', 'Exporting translations');
        Swordfish.currentStatus = data;
        let processId: string = data.process;
        var intervalObject = setInterval(() => {
            if (Swordfish.currentStatus.progress) {
                if (Swordfish.currentStatus.progress === Swordfish.COMPLETED) {
                    Swordfish.mainWindow.webContents.send('end-waiting');
                    Swordfish.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    if (isFile) {
                        dialog.showMessageBox(Swordfish.mainWindow, {
                            type: 'question',
                            message: 'Translations exported.\n\nOpen translated file?',
                            buttons: ['Yes', 'No']
                        }).then((selection: Electron.MessageBoxReturnValue) => {
                            if (selection.response === 0) {
                                shell.openExternal('file://' + output);
                            }
                        });
                    } else {
                        dialog.showMessageBox(Swordfish.mainWindow, { type: 'info', message: 'Translations exported.' });
                    }
                    let message = 'Open translated file?';
                    if (!isFile) {
                        message = 'Open folder?';
                    }

                    return;
                } else if (Swordfish.currentStatus.progress === Swordfish.PROCESSING) {
                    // it's OK, keep waiting
                } else if (Swordfish.currentStatus.progress === Swordfish.ERROR) {
                    Swordfish.mainWindow.webContents.send('end-waiting');
                    Swordfish.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    dialog.showErrorBox('Error', Swordfish.currentStatus.reason);
                    return;
                } else {
                    Swordfish.mainWindow.webContents.send('end-waiting');
                    Swordfish.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    dialog.showErrorBox('Error', 'Unknown error exporting translations');
                    return;
                }
            }
            Swordfish.getProjectsProgress(processId);
        }, 500);
    }

    static getSaveName(file: any, lang: string): any {
        let name = file.file.substr(0, file.file.lastIndexOf('.'));
        let extension = file.file.substr(file.file.lastIndexOf('.'));
        return {
            defaultPath: name + '_' + lang + extension,
            filters: [{ name: file.type, extensions: extension }, { name: 'Any File', extensions: '*' }]
        }
    }

    static addFile() {
        this.addFileWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: 900,
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
        this.addFileWindow.setMenu(null);
        this.addFileWindow.loadURL('file://' + this.path.join(app.getAppPath(), 'html', 'addFile.html'));
        this.addFileWindow.once('ready-to-show', (event: IpcMainEvent) => {
            event.sender.send('get-height');
            this.addFileWindow.show();
        });
    }

    static translateProjects(): void {
        Swordfish.mainWindow.webContents.send('translate-projects');
    }

    createProject(arg: any): void {
        if (Swordfish.addProjectWindow) {
            Swordfish.addProjectWindow.close();
        }
        if (Swordfish.addFileWindow) {
            Swordfish.addFileWindow.close();
        }
        Swordfish.mainWindow.focus();
        Swordfish.mainWindow.webContents.send('start-waiting');
        Swordfish.mainWindow.webContents.send('set-status', 'Creating project');
        Swordfish.sendRequest('/projects/create', arg,
            (data: any) => {
                if (data.status !== Swordfish.SUCCESS) {
                    Swordfish.mainWindow.webContents.send('end-waiting');
                    Swordfish.mainWindow.webContents.send('set-status', '');
                    dialog.showErrorBox('Error', data.reason);
                }
                Swordfish.currentStatus = data;
                let processId: string = data.process;
                var intervalObject = setInterval(() => {
                    if (Swordfish.currentStatus.progress) {
                        if (Swordfish.currentStatus.progress === Swordfish.COMPLETED) {
                            Swordfish.mainWindow.webContents.send('end-waiting');
                            clearInterval(intervalObject);
                            Swordfish.mainWindow.webContents.send('request-projects', { open: processId });
                            return;
                        } else if (Swordfish.currentStatus.progress === Swordfish.PROCESSING) {
                            // it's OK, keep waiting
                        } else if (Swordfish.currentStatus.progress === Swordfish.ERROR) {
                            Swordfish.mainWindow.webContents.send('end-waiting');
                            Swordfish.mainWindow.webContents.send('set-status', '');
                            clearInterval(intervalObject);
                            dialog.showErrorBox('Error', Swordfish.currentStatus.reason);
                            return;
                        } else {
                            Swordfish.mainWindow.webContents.send('end-waiting');
                            Swordfish.mainWindow.webContents.send('set-status', '');
                            clearInterval(intervalObject);
                            dialog.showErrorBox('Error', 'Unknown error processing files');
                            return;
                        }
                    }
                    Swordfish.getProjectsProgress(processId);
                }, 500);
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static getProjectsProgress(process: string): void {
        this.sendRequest('/projects/status', { process: process },
            (data: any) => {
                Swordfish.currentStatus = data;
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static getProjects(event: IpcMainEvent): void {
        Swordfish.mainWindow.webContents.send('start-waiting');
        Swordfish.mainWindow.webContents.send('set-status', 'Loading projects');
        Swordfish.sendRequest('/projects/list', {},
            (data: any) => {
                Swordfish.mainWindow.webContents.send('set-status', '');
                Swordfish.mainWindow.webContents.send('end-waiting');
                if (data.status !== Swordfish.SUCCESS) {
                    dialog.showMessageBox({ type: 'error', message: data.reason });
                    return;
                }
                event.sender.send('set-projects', data.projects);
            },
            (reason: string) => {
                Swordfish.mainWindow.webContents.send('set-status', '');
                dialog.showMessageBox({ type: 'error', message: reason });
            }
        );
    }

    static getMemories(event: IpcMainEvent): void {
        Swordfish.mainWindow.webContents.send('start-waiting');
        Swordfish.mainWindow.webContents.send('set-status', 'Loading memories');
        Swordfish.sendRequest('/memories/list', {},
            (data: any) => {
                Swordfish.mainWindow.webContents.send('set-status', '');
                Swordfish.mainWindow.webContents.send('end-waiting');
                if (data.status === Swordfish.SUCCESS) {
                    event.sender.send('set-memories', data.memories);
                } else {
                    dialog.showMessageBox({ type: 'error', message: data.reason });
                }
            },
            (reason: string) => {
                Swordfish.mainWindow.webContents.send('set-status', '');
                dialog.showMessageBox({ type: 'error', message: reason });
            }
        );
    }

    selectSourceFiles(event: IpcMainEvent): void {
        let anyFile: string[] = [];
        if (process.platform === 'linux') {
            anyFile = ['*'];
        }
        dialog.showOpenDialog({
            properties: ['openFile', 'multiSelections'],

            filters: [
                { name: 'Any File', extensions: anyFile },
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
            (data: any) => {
                event.sender.send('add-source-files', data);
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    getLanguages(event: IpcMainEvent): void {
        Swordfish.sendRequest('/services/getLanguages', {},
            (data: any) => {
                data.srcLang = Swordfish.currentPreferences.srcLang;
                data.tgtLang = Swordfish.currentPreferences.tgtLang;
                event.sender.send('set-languages', data);
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    getMtLanguages(event: IpcMainEvent): void {
        Swordfish.sendRequest('/services/getMTLanguages', {},
            (data: any) => {
                event.sender.send('set-mt-languages', data);
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static viewMemories(): void {
        Swordfish.mainWindow.webContents.send('view-memories');
    }

    static showAddMemory() {
        this.addMemoryWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: 450,
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
        this.addMemoryWindow.loadURL('file://' + this.path.join(app.getAppPath(), 'html', 'addMemory.html'));
        this.addMemoryWindow.once('ready-to-show', (event: IpcMainEvent) => {
            event.sender.send('get-height');
            this.addMemoryWindow.show();
        });
    }

    static viewGlossaries(): void {
        Swordfish.mainWindow.webContents.send('view-glossaries');
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
            (res: any) => {
                res.setEncoding('utf-8');
                if (res.statusCode != 200) {
                    error('sendRequest() error: ' + res.statusMessage);
                }
                var rawData: string = '';
                res.on('data', (chunk: string) => {
                    rawData += chunk;
                });
                res.on('end', () => {
                    try {
                        success(JSON.parse(rawData));
                    } catch (e) {
                        console.log('Received data: ' + rawData);
                        error(e.message);
                    }
                });
            }
        );
        req.write(postData);
        req.end();
    }

    static showHelp(): void {
        shell.openExternal('file://' + this.path.join(app.getAppPath(), 'swordfish.pdf'));
    }

    static showAbout(): void {
        this.aboutWindow = new BrowserWindow({
            parent: Swordfish.mainWindow,
            width: 360,
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
        this.aboutWindow.loadURL('file://' + this.path.join(app.getAppPath(), 'html', 'about.html'));
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
                licenseFile = 'file://' + this.path.join(app.getAppPath(), 'html', 'licenses', 'license.txt');
                title = 'Swordfish License';
                break;
            case "electron":
                licenseFile = 'file://' + this.path.join(app.getAppPath(), 'html', 'licenses', 'electron.txt');
                title = 'MIT License';
                break;
            case "TypeScript":
            case "MapDB":
                licenseFile = 'file://' + this.path.join(app.getAppPath(), 'html', 'licenses', 'Apache2.0.html');
                title = 'Apache 2.0';
                break;
            case "Java":
                licenseFile = 'file://' + this.path.join(app.getAppPath(), 'html', 'licenses', 'java.html');
                title = 'GPL2 with Classpath Exception';
                break;
            case "OpenXLIFF":
            case "TMEngine":
                licenseFile = 'file://' + this.path.join(app.getAppPath(), 'html', 'licenses', 'EclipsePublicLicense1.0.html');
                title = 'Eclipse Public License 1.0';
                break;
            case "JSON":
                licenseFile = 'file://' + this.path.join(app.getAppPath(), 'html', 'licenses', 'json.txt');
                title = 'JSON.org License';
                break;
            case "jsoup":
                licenseFile = 'file://' + this.path.join(app.getAppPath(), 'html', 'licenses', 'jsoup.txt');
                title = 'MIT License';
                break;
            case "DTDParser":
                licenseFile = 'file://' + this.path.join(app.getAppPath(), 'html', 'licenses', 'LGPL2.1.txt');
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
            width: 600,
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
        this.settingsWindow.loadURL('file://' + this.path.join(app.getAppPath(), 'html', 'preferences.html'));
        this.settingsWindow.once('ready-to-show', (event: IpcMainEvent) => {
            event.sender.send('get-height');
            this.settingsWindow.show();
        });
    }

    static showLicenses(): void {
        this.licensesWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: 430,
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
        this.licensesWindow.loadURL('file://' + this.path.join(app.getAppPath(), 'html', 'licenses.html'));
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
        Swordfish.mainWindow.webContents.send('request-theme');
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
                            Swordfish.showMessage({
                                type: 'info',
                                title: 'Updates Available',
                                message: 'Version ' + parsedData.version + ' is available'
                            });
                        } else {
                            if (!silent) {
                                Swordfish.showMessage({
                                    type: 'info',
                                    message: 'There are currently no updates available'
                                });
                            }
                        }
                    } catch (e) {
                        Swordfish.showMessage({ type: 'error', message: e.message });
                    }
                });
            } else {
                if (!silent) {
                    dialog.showErrorBox('Error', 'Updates Request Failed.\nStatus code: ' + res.statusCode);
                }
            }
        }).on('error', (e: any) => {
            if (!silent) {
                Swordfish.showMessage({ type: 'error', message: e.message });
            }
        });
    }

    getTypes(event: IpcMainEvent): void {
        Swordfish.sendRequest('/services/getFileTypes', {},
            (data: any) => {
                if (data.status === Swordfish.SUCCESS) {
                    event.sender.send('set-types', data);
                } else {
                    dialog.showErrorBox('Error', data.reason);
                }
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    getCharset(event: IpcMainEvent): void {
        Swordfish.sendRequest('/services/getCharsets', {},
            (data: any) => {
                if (data.status === Swordfish.SUCCESS) {
                    event.sender.send('set-charsets', data);
                } else {
                    dialog.showErrorBox('Error', data.reason);
                }
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    getClients(event: IpcMainEvent): void {
        Swordfish.sendRequest('/services/getClients', {},
            (data: any) => {
                if (data.status === Swordfish.SUCCESS) {
                    event.sender.send('set-clients', data.clients);
                } else {
                    dialog.showErrorBox('Error', data.reason);
                }
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    getProjectNames(event: IpcMainEvent): void {
        Swordfish.sendRequest('/services/getProjects', {},
            (data: any) => {
                if (data.status === Swordfish.SUCCESS) {
                    event.sender.send('set-project-names', data.projects);
                } else {
                    dialog.showErrorBox('Error', data.reason);
                }
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    getSubjects(event: IpcMainEvent): void {
        Swordfish.sendRequest('/services/getSubjects', {},
            (data: any) => {
                if (data.status === Swordfish.SUCCESS) {
                    event.sender.send('set-subjects', data.subjects);
                } else {
                    dialog.showErrorBox('Error', data.reason);
                }
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
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

    static getDefaultLanguages() {
        this.defaultLangsWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: 600,
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
        this.defaultLangsWindow.setMenu(null);
        this.defaultLangsWindow.loadURL('file://' + this.path.join(app.getAppPath(), 'html', 'defaultLangs.html'));
        this.defaultLangsWindow.once('ready-to-show', (event: IpcMainEvent) => {
            event.sender.send('get-height');
            this.defaultLangsWindow.show();
        });
    }

    static savelanguages(arg: any) {
        this.defaultLangsWindow.close();
        this.currentPreferences.srcLang = arg.srcLang;
        this.currentPreferences.tgtLang = arg.tgtLang;
        writeFileSync(Swordfish.path.join(app.getPath('appData'), app.name, 'preferences.json'), JSON.stringify(this.currentPreferences));
    }

    static getSegmenstCount(event: IpcMainEvent, arg: any): void {
        Swordfish.sendRequest('/projects/count', arg,
            (data: any) => {
                if (data.status === Swordfish.SUCCESS) {
                    data.project = arg.project;
                    event.sender.send('set-segments-count', data);
                    Swordfish.mainWindow.webContents.send('set-statistics', { project: arg.project, statistics: data.statistics });
                } else {
                    dialog.showErrorBox('Error', data.reason);
                }
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static getSegmenst(event: IpcMainEvent, arg: any): void {
        Swordfish.sendRequest('/projects/segments', arg,
            (data: any) => {
                if (data.status === Swordfish.SUCCESS) {
                    data.project = arg.project;
                    event.sender.send('set-segments', data);
                } else {
                    dialog.showErrorBox('Error', data.reason);
                }
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static removeProjects(arg: any) {
        dialog.showMessageBox(Swordfish.mainWindow, { type: "question", message: "Delete selected projects?", buttons: ["Yes", "No"], defaultId: 1 }
        ).then((result: any) => {
            if (result.response === 0) {
                Swordfish.sendRequest('/projects/delete', arg,
                    (data: any) => {
                        if (data.status === Swordfish.SUCCESS) {
                            Swordfish.mainWindow.webContents.send('request-projects', {});
                        } else {
                            dialog.showErrorBox('Error', data.reason);
                        }
                    },
                    (reason: string) => {
                        Swordfish.showMessage({ type: 'error', message: reason });
                    }
                );
            }
        });
    }

    addMemory(arg: any): void {
        Swordfish.sendRequest('/memories/create', arg,
            (data: any) => {
                if (data.status !== Swordfish.SUCCESS) {
                    dialog.showErrorBox('Error', data.reason);
                    return;
                }
                Swordfish.addMemoryWindow.close();
                Swordfish.mainWindow.webContents.send('request-memories');
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static showImportTMX(memory: string): void {
        this.importTmxWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: 600,
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
        this.importTmxWindow.setMenu(null);
        this.importTmxWindow.loadURL('file://' + this.path.join(app.getAppPath(), 'html', 'importTmx.html'));
        this.importTmxWindow.once('ready-to-show', (event: IpcMainEvent) => {
            event.sender.send('get-height');
            event.sender.send('set-memory', memory);
            this.importTmxWindow.show();
        });
    }

    static importTMX(): void {
        Swordfish.mainWindow.webContents.send('import-tmx');
    }

    static importTmxFile(arg: any): void {
        Swordfish.importTmxWindow.close();
        Swordfish.mainWindow.focus();
        Swordfish.mainWindow.webContents.send('start-waiting');
        Swordfish.mainWindow.webContents.send('set-status', 'Importing TMX');
        Swordfish.sendRequest('/memories/import', arg,
            (data: any) => {
                if (data.status !== Swordfish.SUCCESS) {
                    Swordfish.mainWindow.webContents.send('end-waiting');
                    Swordfish.mainWindow.webContents.send('set-status', '');
                    dialog.showErrorBox('Error', data.reason);
                }
                Swordfish.currentStatus = data;
                let processId: string = data.process;
                var intervalObject = setInterval(() => {
                    if (Swordfish.currentStatus.result) {
                        if (Swordfish.currentStatus.result === Swordfish.COMPLETED) {
                            Swordfish.mainWindow.webContents.send('end-waiting');
                            Swordfish.mainWindow.webContents.send('set-status', '');
                            clearInterval(intervalObject);
                            return;
                        } else if (Swordfish.currentStatus.result === Swordfish.PROCESSING) {
                            // it's OK, keep waiting
                        } else if (Swordfish.currentStatus.result === Swordfish.ERROR) {
                            Swordfish.mainWindow.webContents.send('end-waiting');
                            Swordfish.mainWindow.webContents.send('set-status', '');
                            clearInterval(intervalObject);
                            dialog.showErrorBox('Error', Swordfish.currentStatus.reason);
                            return;
                        } else {
                            Swordfish.mainWindow.webContents.send('end-waiting');
                            Swordfish.mainWindow.webContents.send('set-status', '');
                            clearInterval(intervalObject);
                            dialog.showErrorBox('Error', 'Unknown error importing file');
                            return;
                        }
                    }
                    Swordfish.getMemoriesProgress(processId);
                }, 500);
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );

    }

    static getMemoriesProgress(process: string): void {
        this.sendRequest('/memories/status', { process: process },
            (data: any) => {
                Swordfish.currentStatus = data;
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    getTmxFile(event: IpcMainEvent): void {
        let anyFile: string[] = [];
        if (process.platform === 'linux') {
            anyFile = ['*'];
        }
        dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: 'TMX File', extensions: ['tmx'] },
                { name: 'Any File', extensions: anyFile }
            ]
        }).then((value) => {
            if (!value.canceled) {
                event.sender.send('set-tmx-file', value.filePaths[0]);
            }
        });
    }

    static exportTMX(): void {
        Swordfish.mainWindow.webContents.send('export-tmx');
    }

    static removeMemory(): void {
        Swordfish.mainWindow.webContents.send('remove-memory');
    }

    removeMemories(arg: string[]) {
        dialog.showMessageBox(Swordfish.mainWindow, { type: "question", message: "Delete selected memories?", buttons: ["Yes", "No"], defaultId: 1 }
        ).then((result: any) => {
            if (result.response === 0) {
                Swordfish.mainWindow.webContents.send('start-waiting');
                Swordfish.mainWindow.webContents.send('set-status', 'Removing memories');
                Swordfish.sendRequest('/memories/delete', { memories: arg },
                    (data: any) => {
                        if (data.status !== Swordfish.SUCCESS) {
                            Swordfish.mainWindow.webContents.send('end-waiting');
                            Swordfish.mainWindow.webContents.send('set-status', '');
                            dialog.showErrorBox('Error', data.reason);
                        }
                        Swordfish.currentStatus = data;
                        let processId: string = data.process;
                        var intervalObject = setInterval(() => {
                            if (Swordfish.currentStatus.result) {
                                if (Swordfish.currentStatus.result === Swordfish.COMPLETED) {
                                    Swordfish.mainWindow.webContents.send('end-waiting');
                                    Swordfish.mainWindow.webContents.send('set-status', '');
                                    clearInterval(intervalObject);
                                    Swordfish.mainWindow.webContents.send('request-memories');
                                    return;
                                } else if (Swordfish.currentStatus.result === Swordfish.PROCESSING) {
                                    // it's OK, keep waiting
                                } else if (Swordfish.currentStatus.result === Swordfish.ERROR) {
                                    Swordfish.mainWindow.webContents.send('end-waiting');
                                    Swordfish.mainWindow.webContents.send('set-status', '');
                                    clearInterval(intervalObject);
                                    dialog.showErrorBox('Error', Swordfish.currentStatus.reason);
                                    return;
                                } else {
                                    Swordfish.mainWindow.webContents.send('end-waiting');
                                    Swordfish.mainWindow.webContents.send('set-status', '');
                                    clearInterval(intervalObject);
                                    dialog.showErrorBox('Error', 'Unknown error removing memories');
                                    return;
                                }
                            }
                            Swordfish.getMemoriesProgress(processId);
                        }, 500);
                    },
                    (reason: string) => {
                        Swordfish.showMessage({ type: 'error', message: reason });
                    }
                );
            }
        });
    }

    exportMemories(memories: any[]): void {
        // TODO
        if (memories.length === 1) {
            dialog.showSaveDialog(Swordfish.mainWindow, {
                defaultPath: memories[0].name + '.tmx',
                filters: [{ name: 'TMX Files', extensions: ['tmx'] }, { name: 'Any File', extensions: ['*'] }],
                properties: ['createDirectory', 'showOverwriteConfirmation']
            }).then((value) => {
                if (!value.canceled) {
                    Swordfish.mainWindow.webContents.send('start-waiting');
                    Swordfish.mainWindow.webContents.send('set-status', 'Exporting memories');
                    Swordfish.sendRequest('/memories/export', { memory: memories[0].memory, tmx: value.filePath },
                        (data: any) => {
                            if (data.status !== Swordfish.SUCCESS) {
                                Swordfish.mainWindow.webContents.send('end-waiting');
                                Swordfish.mainWindow.webContents.send('set-status', '');
                                dialog.showErrorBox('Error', data.reason);
                            }
                            Swordfish.currentStatus = data;
                            let processId: string = data.process;
                            var intervalObject = setInterval(() => {
                                if (Swordfish.currentStatus.result) {
                                    if (Swordfish.currentStatus.result === Swordfish.COMPLETED) {
                                        Swordfish.mainWindow.webContents.send('end-waiting');
                                        Swordfish.mainWindow.webContents.send('set-status', '');
                                        clearInterval(intervalObject);
                                        return;
                                    } else if (Swordfish.currentStatus.result === Swordfish.PROCESSING) {
                                        // it's OK, keep waiting
                                    } else if (Swordfish.currentStatus.result === Swordfish.ERROR) {
                                        Swordfish.mainWindow.webContents.send('end-waiting');
                                        Swordfish.mainWindow.webContents.send('set-status', '');
                                        clearInterval(intervalObject);
                                        dialog.showErrorBox('Error', Swordfish.currentStatus.reason);
                                        return;
                                    } else {
                                        Swordfish.mainWindow.webContents.send('end-waiting');
                                        Swordfish.mainWindow.webContents.send('set-status', '');
                                        clearInterval(intervalObject);
                                        dialog.showErrorBox('Error', 'Unknown error exporting memories');
                                        return;
                                    }
                                }
                                Swordfish.getMemoriesProgress(processId);
                            }, 500);
                        }, (reason: string) => {
                            Swordfish.showMessage({ type: 'error', message: reason });
                        }
                    );
                }
            }).catch((error) => {
                console.log(error);
            });
        } else {
            for (let i = 0; i < memories.length; i++) {
                console.log(JSON.stringify(memories[i]));
            }
        }
    }

    static closeProject(arg: any): void {
        Swordfish.sendRequest('/projects/close', arg,
            (data: any) => {
                if (data.status !== Swordfish.SUCCESS) {
                    dialog.showErrorBox('Error', data.reason);
                }
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static saveTranslation(arg: any): void {
        Swordfish.sendRequest('/projects/save', arg,
            (data: any) => {
                if (data.status !== Swordfish.SUCCESS) {
                    dialog.showErrorBox('Error', data.reason);
                    return;
                }
                if (data.propagated.length > 0) {
                    Swordfish.mainWindow.webContents.send('auto-propagate', { project: arg.project, rows: data.propagated });
                }
                Swordfish.mainWindow.webContents.send('set-statistics', { project: arg.project, statistics: data.statistics });
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static getMatches(arg: any): void {
        Swordfish.sendRequest('/projects/matches', arg,
            (data: any) => {
                if (data.status !== Swordfish.SUCCESS) {
                    dialog.showErrorBox('Error', data.reason);
                    return;
                }
                if (data.matches.length > 0) {
                    Swordfish.mainWindow.webContents.send('set-matches', { project: arg.project, matches: data.matches });
                }
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static machineTranslate(arg: any): void {
        Swordfish.mainWindow.webContents.send('start-waiting');
        Swordfish.mainWindow.webContents.send('set-status', 'Getting Translations');
        Swordfish.sendRequest('/projects/machineTranslate', arg,
            (data: any) => {
                Swordfish.mainWindow.webContents.send('end-waiting');
                Swordfish.mainWindow.webContents.send('set-status', '');
                if (data.status !== Swordfish.SUCCESS) {
                    dialog.showErrorBox('Error', data.reason);
                    return;
                }
                if (data.matches.length > 0) {
                    Swordfish.mainWindow.webContents.send('set-matches', { project: arg.project, matches: data.matches });
                }
            },
            (reason: string) => {
                Swordfish.mainWindow.webContents.send('end-waiting');
                Swordfish.mainWindow.webContents.send('set-status', '');
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static tmTranslate(arg: any): void {
        Swordfish.mainWindow.webContents.send('start-waiting');
        Swordfish.mainWindow.webContents.send('set-status', 'Searching Memory');
        Swordfish.sendRequest('/projects/tmTranslate', arg,
            (data: any) => {
                Swordfish.mainWindow.webContents.send('end-waiting');
                Swordfish.mainWindow.webContents.send('set-status', '');
                if (data.status !== Swordfish.SUCCESS) {
                    dialog.showErrorBox('Error', data.reason);
                    return;
                }
                if (data.matches.length > 0) {
                    Swordfish.mainWindow.webContents.send('set-matches', { project: arg.project, matches: data.matches });
                }
            },
            (reason: string) => {
                Swordfish.mainWindow.webContents.send('end-waiting');
                Swordfish.mainWindow.webContents.send('set-status', '');
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static tmTranslateAll(arg: any): void {
        Swordfish.mainWindow.webContents.send('start-waiting');
        Swordfish.mainWindow.webContents.send('set-status', 'Translating Project');
        Swordfish.sendRequest('/projects/tmTranslateAll', arg,
            (data: any) => {
                Swordfish.mainWindow.webContents.send('end-waiting');
                Swordfish.mainWindow.webContents.send('set-status', '');
                if (data.status !== Swordfish.SUCCESS) {
                    dialog.showErrorBox('Error', data.reason);
                    return;
                }
                Swordfish.mainWindow.webContents.send('reload-page', { project: arg.project });
            },
            (reason: string) => {
                Swordfish.mainWindow.webContents.send('end-waiting');
                Swordfish.mainWindow.webContents.send('set-status', '');
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static getProjectMemories(arg: any): void {
        Swordfish.sendRequest('/projects/projectMemories', arg,
            (data: any) => {
                if (data.status !== Swordfish.SUCCESS) {
                    dialog.showErrorBox('Error', data.reason);
                    return;
                }
                data.project = arg.project;
                Swordfish.mainWindow.webContents.send('set-project-memories', data);
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static setProjectMemory(arg: any): void {
        Swordfish.sendRequest('/projects/setMemory', arg,
            (data: any) => {
                if (data.status !== Swordfish.SUCCESS) {
                    dialog.showErrorBox('Error', data.reason);
                    return;
                }
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static showSpellCheckerLangs(): void {
        Swordfish.spellingLangsWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: 600,
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
        Swordfish.spellingLangsWindow.setMenu(null);
        Swordfish.spellingLangsWindow.loadURL('file://' + this.path.join(app.getAppPath(), 'html', 'spellingLangs.html'));
        Swordfish.spellingLangsWindow.once('ready-to-show', (event: IpcMainEvent) => {
            event.sender.send('get-height');
            Swordfish.spellingLangsWindow.show();
        });
    }

    static getSpellCheckerLangs(event: IpcMainEvent): void {
        Swordfish.sendRequest('/services/getSpellingLanguages', { languages: Swordfish.spellCheckerLanguages },
            (data: any) => {
                event.sender.send('set-spellchecker-langs', data);
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static setSpellcheckerLanguage(lang: string): void {
        if (Swordfish.spellCheckerLanguages.includes(lang)) {
            Swordfish.mainWindow.webContents.session.setSpellCheckerLanguages([lang]);
            return;
        }
        if (lang.startsWith('en')) {
            Swordfish.mainWindow.webContents.session.setSpellCheckerLanguages([Swordfish.currentPreferences.spellchecker.defaultEnglish]);
            return;
        }
        if (lang.startsWith('pt')) {
            Swordfish.mainWindow.webContents.session.setSpellCheckerLanguages([Swordfish.currentPreferences.spellchecker.defaultPortuguese]);
            return;
        }
        if (lang.startsWith('es')) {
            Swordfish.mainWindow.webContents.session.setSpellCheckerLanguages([Swordfish.currentPreferences.spellchecker.defaultSpanish]);
            return;
        }
        if (lang.length > 2) {
            lang = lang.substring(0, 2);
            if (Swordfish.spellCheckerLanguages.includes(lang)) {
                Swordfish.mainWindow.webContents.session.setSpellCheckerLanguages([lang]);
            }
        }
    }

    static showMessage(arg: any): void {
        Swordfish.messagesWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: 400,
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
        Swordfish.messagesWindow.setMenu(null);
        Swordfish.messagesWindow.loadURL('file://' + this.path.join(app.getAppPath(), 'html', 'messages.html'));
        Swordfish.messagesWindow.once('ready-to-show', (event: IpcMainEvent) => {
            event.sender.send('set-message', arg);
            event.sender.send('get-height');
            Swordfish.messagesWindow.show();
            Swordfish.messagesWindow.focus();
        });
    }
}

new Swordfish();