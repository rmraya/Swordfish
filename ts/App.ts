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
import { app, clipboard, BrowserWindow, dialog, ipcMain, Menu, MenuItem, shell, nativeTheme, Rectangle, IpcMainEvent, screen, Size } from "electron";
import { existsSync, mkdirSync, readFile, readFileSync, writeFileSync, lstatSync } from "fs";
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
    static importXliffWindow: BrowserWindow;
    static addProjectWindow: BrowserWindow;
    static addFileWindow: BrowserWindow;
    static defaultLangsWindow: BrowserWindow;
    static spellingLangsWindow: BrowserWindow;
    static filterSegmentsWindow: BrowserWindow;
    static messagesWindow: BrowserWindow;
    static tagsWindow: BrowserWindow;
    static replaceTextWindow: BrowserWindow;
    static addGlossaryWindow: BrowserWindow;
    static importGlossaryWindow: BrowserWindow;
    static concordanceSearchWindow: BrowserWindow;
    static termSearchWindow: BrowserWindow;
    static addTermWindow: BrowserWindow;
    static goToWindow: BrowserWindow;
    static sortSegmentsWindow: BrowserWindow;

    javapath: string = Swordfish.path.join(app.getAppPath(), 'bin', 'java');

    static appHome: string = Swordfish.path.join(app.getPath('appData'), app.name);
    static iconPath: string = Swordfish.path.join(app.getAppPath(), 'icons', 'icon.png');
    static verticalPadding: number = 46;

    static currentDefaults: Rectangle;
    static currentPreferences = {
        theme: 'system',
        zoomFactor: '1.0',
        srcLang: 'none',
        tgtLang: 'none',
        catalog: Swordfish.path.join(app.getAppPath(), 'catalog', 'catalog.xml'),
        srx: Swordfish.path.join(app.getAppPath(), 'srx', 'default.srx'),
        paragraphSegmentation: false,
        acceptUnconfirmed: false,
        fuzzyTermSearches: false,
        caseSensitiveSearches: false,
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

    static selectedFile: string;

    stopping: boolean = false;

    static SUCCESS: string = 'Success';
    static LOADING: string = 'Loading';
    static COMPLETED: string = 'Completed';
    static ERROR: string = 'Error';
    static SAVING: string = 'Saving';
    static PROCESSING: string = 'Processing';

    static spellCheckerLanguages: string[];
    static selectionRequest: IpcMainEvent;

    ls: ChildProcessWithoutNullStreams;

    constructor() {

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
            Swordfish.exportProjectTranslations(arg);
        });
        ipcMain.on('export-open-project', (event: IpcMainEvent, arg: any) => {
            Swordfish.exportOpenProject(arg);
        });
        ipcMain.on('get-theme', (event: IpcMainEvent, arg: any) => {
            event.sender.send('set-theme', Swordfish.currentCss);
        });
        ipcMain.on('licenses-height', (event: IpcMainEvent, arg: any) => {
            Swordfish.setHeight(Swordfish.licensesWindow, arg);
        });
        ipcMain.on('close-licenses', () => {
            Swordfish.destroyWindow(Swordfish.licensesWindow);
        });
        ipcMain.on('save-preferences', (event: IpcMainEvent, arg: any) => {
            Swordfish.savePreferences(arg);
        });
        ipcMain.on('save-languages', (event: IpcMainEvent, arg: any) => {
            Swordfish.savelanguages(arg);
        });
        ipcMain.on('add-project-height', (event: IpcMainEvent, arg: any) => {
            Swordfish.setHeight(Swordfish.addProjectWindow, arg);
        });
        ipcMain.on('close-addProject', () => {
            Swordfish.destroyWindow(Swordfish.addProjectWindow);
        });
        ipcMain.on('add-file-height', (event: IpcMainEvent, arg: any) => {
            Swordfish.setHeight(Swordfish.addFileWindow, arg);
        });
        ipcMain.on('close-addFile', () => {
            Swordfish.destroyWindow(Swordfish.addFileWindow);
        });
        ipcMain.on('tags-height', (event: IpcMainEvent, arg: any) => {
            Swordfish.setHeight(Swordfish.tagsWindow, arg);
        });
        ipcMain.on('go-to-height', (event: IpcMainEvent, arg: any) => {
            Swordfish.setHeight(Swordfish.goToWindow, arg);
        });
        ipcMain.on('close-go-to', () => {
            Swordfish.destroyWindow(Swordfish.goToWindow);
        });
        ipcMain.on('go-to-segment', (event: IpcMainEvent, arg: any) => {
            Swordfish.mainWindow.webContents.send('open-segment', arg);
        });
        ipcMain.on('replaceText-height', (event: IpcMainEvent, arg: any) => {
            Swordfish.setHeight(Swordfish.replaceTextWindow, arg);
        });
        ipcMain.on('close-replaceText', () => {
            Swordfish.destroyWindow(Swordfish.replaceTextWindow);
        });
        ipcMain.on('close-tags', () => {
            Swordfish.closeTagsWindow();
        });
        ipcMain.on('get-selected-file', (event: IpcMainEvent) => {
            Swordfish.setSelectedFile(event);
        });
        ipcMain.on('get-languages', (event: IpcMainEvent) => {
            this.getLanguages(event);
        });
        ipcMain.on('select-source-files', (event: IpcMainEvent) => {
            this.selectSourceFiles(event);
        });
        ipcMain.on('about-height', (event: IpcMainEvent, arg: any) => {
            Swordfish.setHeight(Swordfish.aboutWindow, arg);
        });
        ipcMain.on('close-about', () => {
            Swordfish.destroyWindow(Swordfish.aboutWindow);
        });
        ipcMain.on('licenses-clicked', () => {
            Swordfish.showLicenses();
        });
        ipcMain.on('create-project', (event: IpcMainEvent, arg: any) => {
            Swordfish.createProject(arg);
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
            Swordfish.setHeight(Swordfish.addMemoryWindow, arg);
        });
        ipcMain.on('close-addMemory', () => {
            Swordfish.destroyWindow(Swordfish.addMemoryWindow);
        });
        ipcMain.on('add-memory', (event: IpcMainEvent, arg: any) => {
            Swordfish.addMemory(arg);
        });
        ipcMain.on('show-add-glossary', () => {
            Swordfish.showAddGlossary();
        });
        ipcMain.on('add-glossary-height', (event: IpcMainEvent, arg: any) => {
            Swordfish.setHeight(Swordfish.addGlossaryWindow, arg);
        });
        ipcMain.on('add-glossary', (event: IpcMainEvent, arg: any) => {
            Swordfish.addGlossary(arg);
        });
        ipcMain.on('close-addGlossary', () => {
            Swordfish.destroyWindow(Swordfish.addGlossaryWindow);
        });
        ipcMain.on('get-glossaries', (event: IpcMainEvent, arg: any) => {
            Swordfish.getGlossaries(event);
        });
        ipcMain.on('remove-glossaries', (event: IpcMainEvent, arg: any) => {
            Swordfish.removeGlossaries(arg);
        });
        ipcMain.on('show-add-term', (event: IpcMainEvent, arg: any) => {
            Swordfish.showAddTerm(arg);
        });
        ipcMain.on('add-term-height', (event: IpcMainEvent, arg: any) => {
            Swordfish.setHeight(Swordfish.addTermWindow, arg);
        });
        ipcMain.on('close-addTerm', () => {
            Swordfish.destroyWindow(Swordfish.addTermWindow);
        });
        ipcMain.on('add-to-glossary', (event: IpcMainEvent, arg: any) => {
            Swordfish.addToGlossary(arg);
        });
        ipcMain.on('show-import-tmx', (event: IpcMainEvent, arg: any) => {
            Swordfish.showImportTMX(arg);
        });
        ipcMain.on('show-import-glossary', (event: IpcMainEvent, arg: any) => {
            Swordfish.showImportGlossary(arg);
        });
        ipcMain.on('import-glossary-height', (event: IpcMainEvent, arg: any) => {
            Swordfish.setHeight(Swordfish.importGlossaryWindow, arg);
        });
        ipcMain.on('get-glossary-file', (event: IpcMainEvent, arg: any) => {
            Swordfish.getGlossaryFile(event);
        });
        ipcMain.on('import-glossary-file', (event: IpcMainEvent, arg: any) => {
            Swordfish.importGlossaryFile(arg);
        });
        ipcMain.on('export-glossaries', (event: IpcMainEvent, arg: any) => {
            Swordfish.exportGlossaries(arg);
        });
        ipcMain.on('close-importGlossary', () => {
            Swordfish.destroyWindow(Swordfish.importGlossaryWindow);
        });
        ipcMain.on('import-tmx-height', (event: IpcMainEvent, arg: any) => {
            Swordfish.setHeight(Swordfish.importTmxWindow, arg);
        });
        ipcMain.on('close-importTmx', () => {
            Swordfish.destroyWindow(Swordfish.importTmxWindow);
        });
        ipcMain.on('import-tmx-file', (event: IpcMainEvent, arg: any) => {
            Swordfish.importTmxFile(arg);
        });
        ipcMain.on('remove-memories', (event: IpcMainEvent, arg: any) => {
            Swordfish.removeMemories(arg);
        });
        ipcMain.on('export-memories', (event: IpcMainEvent, arg: any) => {
            Swordfish.exportMemories(arg);
        });
        ipcMain.on('get-tmx-file', (event: IpcMainEvent) => {
            this.getTmxFile(event);
        });
        ipcMain.on('concordance-search', (event: IpcMainEvent, arg: any) => {
            Swordfish.showConcordanceWindow(arg);
        });
        ipcMain.on('concordance-search-height', (event: IpcMainEvent, arg: any) => {
            Swordfish.setHeight(Swordfish.concordanceSearchWindow, arg);
        });
        ipcMain.on('close-concordanceSearch', () => {
            Swordfish.destroyWindow(Swordfish.concordanceSearchWindow);
        });
        ipcMain.on('get-concordance', (event: IpcMainEvent, arg: any) => {
            Swordfish.concordanceSearch(arg);
        });
        ipcMain.on('get-selection', (event: IpcMainEvent) => {
            Swordfish.selectionRequest = event;
            Swordfish.mainWindow.webContents.send('get-selected-text');
        });
        ipcMain.on('selected-text', (event: IpcMainEvent, arg: any) => {
            Swordfish.selectionRequest.sender.send('set-selected-text', arg);
        });
        ipcMain.on('close-htmlViewer', (event: IpcMainEvent, arg: any) => {
            Swordfish.destroyWindow(BrowserWindow.fromId(arg.id));
        });
        ipcMain.on('get-clients', (event: IpcMainEvent) => {
            this.getClients(event);
        });
        ipcMain.on('show-term-search', (event: IpcMainEvent, arg: any) => {
            Swordfish.showTermSearch(arg);
        });
        ipcMain.on('close-termSearch', () => {
            Swordfish.destroyWindow(Swordfish.termSearchWindow);
        });
        ipcMain.on('term-search-height', (event: IpcMainEvent, arg: any) => {
            Swordfish.setHeight(Swordfish.termSearchWindow, arg);
        });
        ipcMain.on('search-terms', (event: IpcMainEvent, arg: any) => {
            Swordfish.termSearch(arg);
        });
        ipcMain.on('get-project-names', (event: IpcMainEvent) => {
            this.getProjectNames(event);
        });
        ipcMain.on('get-subjects', (event: IpcMainEvent) => {
            this.getSubjects(event);
        });
        ipcMain.on('get-types', (event: IpcMainEvent) => {
            this.getTypes(event);
        });
        ipcMain.on('get-charsets', (event: IpcMainEvent) => {
            this.getCharset(event);
        });
        ipcMain.on('get-version', (event: IpcMainEvent) => {
            event.sender.send('set-version', app.name + ' ' + app.getVersion());
        });
        ipcMain.on('settings-height', (event: IpcMainEvent, arg: any) => {
            Swordfish.setHeight(Swordfish.settingsWindow, arg);
        });
        ipcMain.on('close-preferences', () => {
            Swordfish.destroyWindow(Swordfish.settingsWindow);
        });
        ipcMain.on('languages-height', (event: IpcMainEvent, arg: any) => {
            Swordfish.setHeight(Swordfish.defaultLangsWindow, arg);
        });
        ipcMain.on('close-defaultLangs', () => {
            Swordfish.destroyWindow(Swordfish.defaultLangsWindow);
        });
        ipcMain.on('get-preferences', (event: IpcMainEvent) => {
            event.sender.send('set-preferences', Swordfish.currentPreferences);
        });
        ipcMain.on('browse-srx', (event: IpcMainEvent) => {
            this.browseSRX(event);
        });
        ipcMain.on('browse-catalog', (event: IpcMainEvent) => {
            this.browseCatalog(event);
        });
        ipcMain.on('get-mt-languages', (event: IpcMainEvent) => {
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
        ipcMain.on('paste-text', (event: IpcMainEvent, arg: any) => {
            clipboard.writeText(arg);
            Swordfish.mainWindow.webContents.paste();
        });
        ipcMain.on('save-translation', (event: IpcMainEvent, arg: any) => {
            Swordfish.saveTranslation(arg);
        });
        ipcMain.on('get-matches', (event: IpcMainEvent, arg: any) => {
            Swordfish.getMatches(arg);
        });
        ipcMain.on('get-terms', (event: IpcMainEvent, arg: any) => {
            Swordfish.getTerms(arg);
        });
        ipcMain.on('get-segment-terms', (event: IpcMainEvent, arg: any) => {
            Swordfish.getSegmentTerms(arg);
        });
        ipcMain.on('get-project-terms', (event: IpcMainEvent, arg: any) => {
            Swordfish.getProjectTerms(arg);
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
        ipcMain.on('apply-mt-all', (event: IpcMainEvent, arg: any) => {
            Swordfish.applyMachineTranslationsAll(arg);
        });
        ipcMain.on('accept-mt-all', (event: IpcMainEvent, arg: any) => {
            Swordfish.acceptAllMachineTranslations(arg);
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
        ipcMain.on('get-project-glossaries', (event: IpcMainEvent, arg: any) => {
            Swordfish.getProjectGlossaries(arg);
        });
        ipcMain.on('set-project-glossary', (event: IpcMainEvent, arg: any) => {
            Swordfish.setProjectGlossary(arg);
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
            Swordfish.setHeight(Swordfish.spellingLangsWindow, arg);
        });
        ipcMain.on('close-spellingLangs', () => {
            Swordfish.destroyWindow(Swordfish.spellingLangsWindow);
        });
        ipcMain.on('show-sort-segments', (event: IpcMainEvent, arg: any) => {
            Swordfish.showSortSegments(arg);
        });
        ipcMain.on('sort-segments-height', (event: IpcMainEvent, arg: any) => {
            Swordfish.setHeight(Swordfish.sortSegmentsWindow, arg);
        });
        ipcMain.on('sort-options', (event: IpcMainEvent, arg: any) => {
            Swordfish.sortOptions(arg);
        });
        ipcMain.on('show-filter-segments', (event: IpcMainEvent, arg: any) => {
            Swordfish.showFilterSegments(arg);
        });
        ipcMain.on('filter-options', (event: IpcMainEvent, arg: any) => {
            Swordfish.filterOptions(arg);
        });
        ipcMain.on('find-text-height', (event: IpcMainEvent, arg: any) => {
            Swordfish.setHeight(Swordfish.filterSegmentsWindow, arg);
        });
        ipcMain.on('messages-height', (event: IpcMainEvent, arg: any) => {
            Swordfish.setHeight(Swordfish.messagesWindow, arg);
        });
        ipcMain.on('close-messages', () => {
            Swordfish.destroyWindow(Swordfish.messagesWindow);
        });
        ipcMain.on('export-xliff', (event: IpcMainEvent, arg: any) => {
            Swordfish.exportProject(arg);
        });
        ipcMain.on('export-tmx-file', (event: IpcMainEvent, arg: any) => {
            Swordfish.exportProjectTMX(arg);
        });
        ipcMain.on('import-xliff', () => {
            Swordfish.showImportXliff();
        });
        ipcMain.on('import-xliff-height', (event: IpcMainEvent, arg: any) => {
            Swordfish.setHeight(Swordfish.importXliffWindow, arg);
        });
        ipcMain.on('close-importXliff', () => {
            Swordfish.destroyWindow(Swordfish.importXliffWindow);
        });
        ipcMain.on('browse-xliff-import', (event: IpcMainEvent) => {
            Swordfish.browseXLIFF(event);
        });
        ipcMain.on('import-xliff-file', (event: IpcMainEvent, arg: any) => {
            Swordfish.importXLIFF(arg);
        });
        ipcMain.on('files-dropped', (event: IpcMainEvent, arg: any) => {
            Swordfish.filesDropped(arg);
        });
        ipcMain.on('remove-translations', (event: IpcMainEvent, arg: any) => {
            Swordfish.removeTranslations(arg);
        });
        ipcMain.on('remove-matches', (event: IpcMainEvent, arg: any) => {
            Swordfish.removeMatches(arg);
        });
        ipcMain.on('remove-machine-translations', (event: IpcMainEvent, arg: any) => {
            Swordfish.removeMachineTranslations(arg);
        });
        ipcMain.on('unconfirm-translations', (event: IpcMainEvent, arg: any) => {
            Swordfish.unconfirmTranslations(arg);
        });
        ipcMain.on('pseudo-translate', (event: IpcMainEvent, arg: any) => {
            Swordfish.pseudoTranslate(arg);
        });
        ipcMain.on('copy-sources', (event: IpcMainEvent, arg: any) => {
            Swordfish.copyAllSources(arg);
        });
        ipcMain.on('confirm-translations', (event: IpcMainEvent, arg: any) => {
            Swordfish.confirmAllTranslations(arg);
        });
        ipcMain.on('accept-100-matches', (event: IpcMainEvent, arg: any) => {
            Swordfish.acceptAll100Matches(arg);
        });
        ipcMain.on('generate-statistics', (event: IpcMainEvent, arg: any) => {
            Swordfish.generateStatistics(arg);
        });
        ipcMain.on('show-tag-window', () => {
            Swordfish.showTagsWindow();
        });
        ipcMain.on('show-go-to-window', () => {
            Swordfish.showGoToWindow();
        });
        ipcMain.on('forward-tag', (event: IpcMainEvent, arg: any) => {
            Swordfish.mainWindow.webContents.send('insert-tag', arg);
        });
        ipcMain.on('show-replaceText', (event: IpcMainEvent, arg: any) => {
            Swordfish.showReplaceText(arg);
        });
        ipcMain.on('search-replace', (event: IpcMainEvent, arg: any) => {
            Swordfish.replaceText(arg);
        });
        ipcMain.on('request-apply-terminology', () => {
            Swordfish.mainWindow.webContents.send('apply-terminology');
        });
        ipcMain.on('lock-segment', (event: IpcMainEvent, arg: any) => {
            Swordfish.lockSegment(arg);
        });
        ipcMain.on('lock-duplicates', (event: IpcMainEvent, arg: any) => {
            Swordfish.lockDuplicates(arg);
        });
        ipcMain.on('unlock-all', (event: IpcMainEvent, arg: any) => {
            Swordfish.unlockAll(arg);
        });
        ipcMain.on('get-zoom', () => {
            Swordfish.mainWindow.webContents.send('set-zoom', { zoom: Swordfish.currentPreferences.zoomFactor });
        });
        ipcMain.on('analyze-spaces', (event: IpcMainEvent, arg: any) => {
            Swordfish.analyzeSpaces(arg);
        });
        ipcMain.on('analyze-tags', (event: IpcMainEvent, arg: any) => {
            Swordfish.analyzeTags(arg);
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
                    click: () => { this.mainWindow.webContents.replaceMisspelling(suggestion); }
                }));
            }
            // Allow users to add the misspelled word to the dictionary
            if (params.misspelledWord) {
                menu.append(new MenuItem({ type: 'separator' }));
                menu.append(
                    new MenuItem({
                        label: 'Add to dictionary',
                        click: () => { this.mainWindow.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord); }
                    })
                );
            }
            menu.popup();
        });
        var fileMenu: Menu = Menu.buildFromTemplate([
            { label: 'Open...', accelerator: 'CmdOrCtrl+O', click: () => { Swordfish.addFile(); } }
        ]);
        var tagsMenu: Menu = Menu.buildFromTemplate([
            { label: 'Insert Tag "1"', accelerator: 'CmdOrCtrl+1', click: () => { Swordfish.mainWindow.webContents.send('insert-tag', { tag: 1 }); } },
            { label: 'Insert Tag "2"', accelerator: 'CmdOrCtrl+2', click: () => { Swordfish.mainWindow.webContents.send('insert-tag', { tag: 2 }); } },
            { label: 'Insert Tag "3"', accelerator: 'CmdOrCtrl+3', click: () => { Swordfish.mainWindow.webContents.send('insert-tag', { tag: 3 }); } },
            { label: 'Insert Tag "4"', accelerator: 'CmdOrCtrl+4', click: () => { Swordfish.mainWindow.webContents.send('insert-tag', { tag: 4 }); } },
            { label: 'Insert Tag "5"', accelerator: 'CmdOrCtrl+5', click: () => { Swordfish.mainWindow.webContents.send('insert-tag', { tag: 5 }); } },
            { label: 'Insert Tag "6"', accelerator: 'CmdOrCtrl+6', click: () => { Swordfish.mainWindow.webContents.send('insert-tag', { tag: 6 }); } },
            { label: 'Insert Tag "7"', accelerator: 'CmdOrCtrl+7', click: () => { Swordfish.mainWindow.webContents.send('insert-tag', { tag: 7 }); } },
            { label: 'Insert Tag "8"', accelerator: 'CmdOrCtrl+8', click: () => { Swordfish.mainWindow.webContents.send('insert-tag', { tag: 8 }); } },
            { label: 'Insert Tag "8"', accelerator: 'CmdOrCtrl+9', click: () => { Swordfish.mainWindow.webContents.send('insert-tag', { tag: 9 }); } },
            { label: 'Insert Tag "10"', accelerator: 'CmdOrCtrl+0', click: () => { Swordfish.mainWindow.webContents.send('insert-tag', { tag: 10 }); } }
        ]);
        var editMenu: Menu = Menu.buildFromTemplate([
            { label: 'Undo', accelerator: 'CmdOrCtrl+Z', click: () => { Swordfish.mainWindow.webContents.undo(); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Cut', accelerator: 'CmdOrCtrl+X', click: () => { Swordfish.mainWindow.webContents.cut(); } },
            { label: 'Copy', accelerator: 'CmdOrCtrl+C', click: () => { Swordfish.mainWindow.webContents.copy(); } },
            { label: 'Paste', accelerator: 'CmdOrCtrl+V', click: () => { Swordfish.mainWindow.webContents.paste(); } },
            { label: 'Select All', accelerator: 'CmdOrCtrl+A', click: () => { Swordfish.mainWindow.webContents.selectAll(); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Edit previous Segment', accelerator: 'PageUp', click: () => { Swordfish.mainWindow.webContents.send('previous-segment'); } },
            { label: 'Edit Next Segment', accelerator: 'PageDown', click: () => { Swordfish.mainWindow.webContents.send('next-segment'); } },
            { label: 'Go To Segment...', accelerator: 'CmdOrCtrl+G', click: () => { Swordfish.mainWindow.webContents.send('go-to'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Edit Next Untranslated Segment', accelerator: 'F5', click: () => { Swordfish.mainWindow.webContents.send('next-untranslated'); } },
            { label: 'Edit Next Unconfirmed Segment', accelerator: 'F6', click: () => { Swordfish.mainWindow.webContents.send('next-unconfirmed'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Save Segment Changes', accelerator: 'Alt+Enter', click: () => { Swordfish.mainWindow.webContents.send('save-edit', { confirm: false, next: 'none' }); } },
            { label: 'Discard Segment Changes', accelerator: 'Esc', click: () => { Swordfish.mainWindow.webContents.send('cancel-edit'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Split Segment', accelerator: 'CmdOrCtrl+H', click: () => { Swordfish.mainWindow.webContents.send('split-segment'); } },
            { label: 'Merge With Next Segment', accelerator: 'CmdOrCtrl+J', click: () => { Swordfish.mainWindow.webContents.send('merge-next'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Replace Text', accelerator: 'CmdOrCtrl+Alt+F', click: () => { Swordfish.mainWindow.webContents.send('replace-text'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Insert Tag', accelerator: 'CmdOrCtrl+T', click: () => { Swordfish.mainWindow.webContents.send('insert-tag', {}); } },
            new MenuItem({ label: 'Insert Tags...', submenu: tagsMenu }),
            { label: 'Insert Next Tag', accelerator: 'CmdOrCtrl+Shift+T', click: () => { Swordfish.mainWindow.webContents.send('insert-next-tag'); } },
            { label: 'Insert Remaining Tags', accelerator: 'CmdOrCtrl+Alt+T', click: () => { Swordfish.mainWindow.webContents.send('insert-remaining-tags'); } },
            { label: 'Remove All Tags', accelerator: 'CmdOrCtrl+Shift+R', click: () => { Swordfish.mainWindow.webContents.send('remove-tags'); } },
        ]);
        let nextMT: string = 'Alt+Right';
        let previousMT: string = 'Alt+Left';
        if (process.platform === 'darwin') {
            nextMT = 'Ctrl+Alt+Right';
            previousMT = 'Ctrl+Alt+Left';
        }
        var viewMenu: Menu = Menu.buildFromTemplate([
            { label: 'Projects', accelerator: 'CmdOrCtrl+Alt+1', click: () => { Swordfish.viewProjects(); } },
            { label: 'Memories', accelerator: 'CmdOrCtrl+Alt+2', click: () => { Swordfish.viewMemories(); } },
            { label: 'Glossaries', accelerator: 'CmdOrCtrl+Alt+3', click: () => { Swordfish.viewGlossaries(); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Sort Segments', accelerator: 'F3', click: () => { Swordfish.mainWindow.webContents.send('sort-segments'); } },
            { label: 'Filter Segments', accelerator: 'CmdOrCtrl+F', click: () => { Swordfish.mainWindow.webContents.send('filter-segments'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Close Selected Tab', accelerator: 'CmdOrCtrl+W', click: () => { Swordfish.closeSelectedTab(); } },
            new MenuItem({ type: 'separator' }),
            { label: 'First Page', accelerator: 'CmdOrCtrl+Shift+Home', click: () => { Swordfish.mainWindow.webContents.send('first-page'); } },
            { label: 'Previous Page', accelerator: 'CmdOrCtrl+Home', click: () => { Swordfish.mainWindow.webContents.send('previous-page'); } },
            { label: 'Next Page', accelerator: 'CmdOrCtrl+End', click: () => { Swordfish.mainWindow.webContents.send('next-page'); } },
            { label: 'Last Page', accelerator: 'CmdOrCtrl+Shift+End', click: () => { Swordfish.mainWindow.webContents.send('last-page'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Next Translation Memory Match', accelerator: 'CmdOrCtrl+Alt+Right', click: () => { Swordfish.mainWindow.webContents.send('next-match'); } },
            { label: 'Previous Translation Memory Match', accelerator: 'CmdOrCtrl+Alt+Left', click: () => { Swordfish.mainWindow.webContents.send('previous-match'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Next Machine Translation', accelerator: nextMT, click: () => { Swordfish.mainWindow.webContents.send('next-mt'); } },
            { label: 'Previous Machine Translation', accelerator: previousMT, click: () => { Swordfish.mainWindow.webContents.send('previous-mt'); } },
            new MenuItem({ type: 'separator' }),
            new MenuItem({ label: 'Toggle Full Screen', role: 'togglefullscreen' }),
            new MenuItem({ label: 'Toggle Development Tools', accelerator: 'F12', role: 'toggleDevTools' }),
        ]);
        var projectsMenu: Menu = Menu.buildFromTemplate([
            { label: 'New Project', accelerator: 'CmdOrCtrl+N', click: () => { Swordfish.addProject(); } },
            { label: 'Translate Projects', click: () => { Swordfish.translateProjects(); } },
            { label: 'Export Translations', accelerator: 'CmdOrCtrl+S', click: () => { Swordfish.mainWindow.webContents.send('export-translations'); } },
            { label: 'Export Translations as TMX File', click: () => { Swordfish.mainWindow.webContents.send('export-translations-tmx'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Remove Projects', click: () => { Swordfish.mainWindow.webContents.send('remove-projects'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Project Statistics', click: () => { Swordfish.mainWindow.webContents.send('request-statistics'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Import XLIFF File as Project', click: () => { Swordfish.showImportXliff(); } },
            { label: 'Export Project as XLIFF File', click: () => { Swordfish.mainWindow.webContents.send('export-project'); } }
        ]);
        var memoriesMenu: Menu = Menu.buildFromTemplate([
            { label: 'Add Memory', click: () => { Swordfish.showAddMemory(); } },
            { label: 'Remove Memory', click: () => { Swordfish.removeMemory(); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Concordance Search', accelerator: 'CmdOrCtrl+Y', click: () => { Swordfish.mainWindow.webContents.send('concordance-requested'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Import TMX File', click: () => { Swordfish.mainWindow.webContents.send('import-tmx'); } },
            { label: 'Export Memory as TMX File', click: () => { Swordfish.mainWindow.webContents.send('export-tmx'); } }
        ]);
        var glossariesMenu: Menu = Menu.buildFromTemplate([
            { label: 'Add Glossary', click: () => { Swordfish.showAddGlossary(); } },
            { label: 'Remove Glossary', click: () => { Swordfish.removeGlossary(); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Search Term in Glossary', accelerator: 'CmdOrCtrl+D', click: () => { Swordfish.mainWindow.webContents.send('term-search-requested'); } },
            { label: 'Add Term to Glossary', accelerator: 'CmdOrCtrl+B', click: () => { Swordfish.mainWindow.webContents.send('add-term-requested'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Import Glossary', click: () => { Swordfish.mainWindow.webContents.send('import-glossary'); } },
            { label: 'Export Glossary', click: () => { Swordfish.mainWindow.webContents.send('export-glossary'); } }
        ]);
        var helpMenu: Menu = Menu.buildFromTemplate([
            { label: 'Swordfish User Guide', accelerator: 'F1', click: () => { this.showHelp(); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Check for Updates...', click: () => { this.checkUpdates(false); } },
            { label: 'View Licenses', click: () => { this.showLicenses(); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Release History', click: () => { this.showReleaseHistory(); } },
            { label: 'Support Group', click: () => { this.showSupportGroup(); } }
        ]);
        let nextUntranslatedKey = 'Alt+Down';
        let nextUnconfirmedKey = 'Alt+Shift+Down';
        if (process.platform === 'darwin') {
            nextUntranslatedKey = 'Ctrl+Alt+Down';
            nextUnconfirmedKey = 'Ctrl+Shift+Down';
        }
        var termsMenu: Menu = Menu.buildFromTemplate([
            { label: 'Insert  Term "1"', accelerator: 'CmdOrCtrl+Alt+1', click: () => { Swordfish.mainWindow.webContents.send('insert-tem', { term: 1 }); } },
            { label: 'Insert  Term "2"', accelerator: 'CmdOrCtrl+Alt+2', click: () => { Swordfish.mainWindow.webContents.send('insert-tem', { term: 2 }); } },
            { label: 'Insert  Term "3"', accelerator: 'CmdOrCtrl+Alt+3', click: () => { Swordfish.mainWindow.webContents.send('insert-tem', { term: 3 }); } },
            { label: 'Insert  Term "4"', accelerator: 'CmdOrCtrl+Alt+4', click: () => { Swordfish.mainWindow.webContents.send('insert-tem', { term: 4 }); } },
            { label: 'Insert  Term "5"', accelerator: 'CmdOrCtrl+Alt+5', click: () => { Swordfish.mainWindow.webContents.send('insert-tem', { term: 5 }); } },
            { label: 'Insert  Term "6"', accelerator: 'CmdOrCtrl+Alt+6', click: () => { Swordfish.mainWindow.webContents.send('insert-tem', { term: 6 }); } },
            { label: 'Insert  Term "7"', accelerator: 'CmdOrCtrl+Alt+7', click: () => { Swordfish.mainWindow.webContents.send('insert-tem', { term: 7 }); } },
            { label: 'Insert  Term "8"', accelerator: 'CmdOrCtrl+Alt+8', click: () => { Swordfish.mainWindow.webContents.send('insert-tem', { term: 8 }); } },
            { label: 'Insert  Term "8"', accelerator: 'CmdOrCtrl+Alt+9', click: () => { Swordfish.mainWindow.webContents.send('insert-tem', { term: 9 }); } },
            { label: 'Insert  Term "10"', accelerator: 'CmdOrCtrl+Alt+0', click: () => { Swordfish.mainWindow.webContents.send('insert-tem', { term: 10 }); } }
        ]);
        var tasksMenu: Menu = Menu.buildFromTemplate([
            { label: 'Confirm Translation', accelerator: 'CmdOrCtrl+E', click: () => { Swordfish.mainWindow.webContents.send('save-edit', { confirm: true, next: 'none' }); } },
            { label: 'Unconfirm Translation', accelerator: 'CmdOrCtrl+Shift+E', click: () => { Swordfish.mainWindow.webContents.send('save-edit', { confirm: false, next: 'none', unconfirm: true }); } },
            { label: 'Confirm and go to Next Untranslated', accelerator: nextUntranslatedKey, click: () => { Swordfish.mainWindow.webContents.send('save-edit', { confirm: true, next: 'untranslated' }); } },
            { label: 'Confirm and go to Next Unconfirmed', accelerator: nextUnconfirmedKey, click: () => { Swordfish.mainWindow.webContents.send('save-edit', { confirm: true, next: 'unconfirmed' }); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Confirm All Translations', click: () => { Swordfish.mainWindow.webContents.send('confirm-all'); } },
            { label: 'Unconfirm All Translations', click: () => { Swordfish.mainWindow.webContents.send('unconfirm-all'); } },
            { label: 'Remove All Translations', click: () => { Swordfish.mainWindow.webContents.send('remove-all'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Lock/Unlock Segment', accelerator: 'F4', click: () => { Swordfish.mainWindow.webContents.send('toggle-lock'); } },
            { label: 'Lock Repeated Segments', click: () => { Swordfish.mainWindow.webContents.send('lock-repeated'); } },
            { label: 'Unlock All Segments', click: () => { Swordfish.mainWindow.webContents.send('unlock-segments'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Copy Source to Target', accelerator: 'CmdOrCtrl+P', click: () => { Swordfish.mainWindow.webContents.send('copy-source'); } },
            { label: 'Copy Sources to All Empty Targets', accelerator: 'CmdOrCtrl+Shift+P', click: () => { Swordfish.mainWindow.webContents.send('copy-all-sources'); } },
            { label: 'Pseudo-translate Untranslated Segments', click: () => { Swordfish.mainWindow.webContents.send('pseudo-translate'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Get Translations from Memory', accelerator: 'CmdOrCtrl+M', click: () => { Swordfish.mainWindow.webContents.send('get-tm-matches'); } },
            { label: 'Accept Translation Memory Match', accelerator: 'CmdOrCtrl+Alt+M', click: () => { Swordfish.mainWindow.webContents.send('accept-tm-match'); } },
            { label: 'Apply Translation Memory to All Segments', click: () => { Swordfish.mainWindow.webContents.send('apply-tm-all'); } },
            { label: 'Accept All 100% Matches', click: () => { Swordfish.mainWindow.webContents.send('accept-all-matches'); } },
            { label: 'Remove All Translation Memory Matches', click: () => { Swordfish.mainWindow.webContents.send('remove-matches'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Get Machine Translations', accelerator: 'CmdOrCtrl+L', click: () => { Swordfish.mainWindow.webContents.send('get-mt-matches'); } },
            { label: 'Accept Machine Translation', accelerator: 'CmdOrCtrl+Alt+L', click: () => { Swordfish.mainWindow.webContents.send('accept-mt-match'); } },
            { label: 'Apply Machine Translation to All Segments', click: () => { Swordfish.mainWindow.webContents.send('apply-mt-all'); } },
            { label: 'Accept All Machine Translations', click: () => { Swordfish.mainWindow.webContents.send('accept-all-mt'); } },
            { label: 'Remove All Machine Translations', click: () => { Swordfish.mainWindow.webContents.send('remove-mt-all'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Get Glossary Terms', accelerator: 'CmdOrCtrl+K', click: () => { Swordfish.mainWindow.webContents.send('apply-terminology'); } },
            { label: 'Insert Selected Term', accelerator: 'CmdOrCtrl+Alt+K', click: () => { Swordfish.mainWindow.webContents.send('insert-tem', { selected: true }); } },
            new MenuItem({ label: 'Insert Term...', submenu: termsMenu }),
            { label: 'Get Terms for All Segments', click: () => { Swordfish.mainWindow.webContents.send('apply-terminology-all'); } }
        ]);
        var qaMenu: Menu = Menu.buildFromTemplate([
            { label: 'Check Inline Tags', click: () => { Swordfish.mainWindow.webContents.send('tags-analysis'); } },
            { label: 'Check Initial/Trailing Spaces', click: () => { Swordfish.mainWindow.webContents.send('spaces-analysis'); } }
        ]);
        var template: MenuItem[] = [
            new MenuItem({ label: '&File', role: 'fileMenu', submenu: fileMenu }),
            new MenuItem({ label: '&Edit', role: 'editMenu', submenu: editMenu }),
            new MenuItem({ label: '&View', role: 'viewMenu', submenu: viewMenu }),
            new MenuItem({ label: '&Projects', submenu: projectsMenu }),
            new MenuItem({ label: '&Memories', submenu: memoriesMenu }),
            new MenuItem({ label: '&Glossaries', submenu: glossariesMenu }),
            new MenuItem({ label: '&Tasks', submenu: tasksMenu }),
            new MenuItem({ label: '&QA', submenu: qaMenu }),
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
            template[9].submenu.append(new MenuItem({ type: 'separator' }));
            template[9].submenu.append(new MenuItem({ label: 'About...', click: () => { this.showAbout(); } }));
        }
        if (process.platform === 'linux') {
            template[0].submenu.append(new MenuItem({ type: 'separator' }));
            template[0].submenu.append(new MenuItem({ label: 'Quit', accelerator: 'Ctrl+Q', role: 'quit', click: () => { app.quit(); } }));
            template[9].submenu.append(new MenuItem({ type: 'separator' }));
            template[9].submenu.append(new MenuItem({ label: 'About...', click: () => { this.showAbout(); } }));
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

    static setHeight(window: BrowserWindow, arg: any) {
        let rect: Rectangle = window.getBounds();
        rect.height = arg.height + Swordfish.verticalPadding;
        window.setBounds(rect);
        window.show();
    }

    static loadPreferences(): void {
        let dark: string = 'file://' + Swordfish.path.join(app.getAppPath(), 'css', 'dark.css');
        let light: string = 'file://' + Swordfish.path.join(app.getAppPath(), 'css', 'light.css');
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
        if (!Swordfish.currentPreferences.zoomFactor) {
            Swordfish.currentPreferences.zoomFactor = '1.0';
        }
    }

    static savePreferences(arg: any): void {
        Swordfish.destroyWindow(Swordfish.settingsWindow);
        writeFileSync(Swordfish.path.join(app.getPath('appData'), app.name, 'preferences.json'), JSON.stringify(arg));
        Swordfish.loadPreferences();
        Swordfish.setTheme();
        Swordfish.mainWindow.webContents.send('set-zoom', { zoom: Swordfish.currentPreferences.zoomFactor });
    }

    static showSortSegments(params: any): void {
        this.sortSegmentsWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: 400,
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
        this.sortSegmentsWindow.setMenu(null);
        this.sortSegmentsWindow.loadURL('file://' + this.path.join(app.getAppPath(), 'html', 'sortSegments.html'));
        this.sortSegmentsWindow.once('ready-to-show', (event: IpcMainEvent) => {
            event.sender.send('get-height');
            event.sender.send('set-params', params);
        });
    }

    static showFilterSegments(params: any): void {
        this.filterSegmentsWindow = new BrowserWindow({
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
        this.filterSegmentsWindow.setMenu(null);
        this.filterSegmentsWindow.loadURL('file://' + this.path.join(app.getAppPath(), 'html', 'filterSegments.html'));
        this.filterSegmentsWindow.once('ready-to-show', (event: IpcMainEvent) => {
            event.sender.send('get-height');
            event.sender.send('set-params', params);
        });
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
        });
    }

    static exportOpenProject(arg: any): void {
        Swordfish.sendRequest('/projects/get', arg,
            (data: any) => {
                Swordfish.exportProjectTranslations(data);
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static exportProjectTranslations(project: any): void {
        if (project.files.length === 1 && project.files[0].type !== 'DITA Map') {
            let parsed: any = Swordfish.getSaveName(project.files[0], project.targetLang);
            dialog.showSaveDialog(Swordfish.mainWindow, {
                defaultPath: parsed.defaultPath,
                filters: parsed.filters,
                properties: ['createDirectory', 'showOverwriteConfirmation']
            }).then((value: Electron.SaveDialogReturnValue) => {
                if (!value.canceled) {
                    Swordfish.sendRequest('/projects/translations', { project: project.id, output: value.filePath },
                        (data: any) => {
                            Swordfish.exportTranslations(data, value.filePath, true);
                        }, (reason: string) => {
                            Swordfish.showMessage({ type: 'error', message: reason });
                        }
                    );
                }
            }).catch((error: Error) => {
                console.log(error);
            });
        } else {
            dialog.showSaveDialog(Swordfish.mainWindow, {
                properties: ['createDirectory']
            }).then((value: Electron.SaveDialogReturnValue) => {
                if (!value.canceled) {
                    Swordfish.sendRequest('/projects/translations', { project: project.id, output: value.filePath },
                        (data: any) => {
                            Swordfish.exportTranslations(data, value.filePath, false);
                        }, (reason: string) => {
                            Swordfish.showMessage({ type: 'error', message: reason });
                        }
                    );
                }
            }).catch((error: Error) => {
                console.log(error);
            });
        }
    }

    static exportTranslations(data: any, output: string, isFile: boolean): void {
        if (data.status !== Swordfish.SUCCESS) {
            Swordfish.showMessage({ type: 'error', message: data.reason });
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
                        Swordfish.showMessage({ type: 'info', message: 'Translations exported.' });
                    }
                    return;
                } else if (Swordfish.currentStatus.progress === Swordfish.PROCESSING) {
                    // it's OK, keep waiting
                } else if (Swordfish.currentStatus.progress === Swordfish.ERROR) {
                    Swordfish.mainWindow.webContents.send('end-waiting');
                    Swordfish.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    Swordfish.showMessage({ type: 'error', message: Swordfish.currentStatus.reason });
                    return;
                } else {
                    Swordfish.mainWindow.webContents.send('end-waiting');
                    Swordfish.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    Swordfish.showMessage({ type: 'error', message: 'Unknown error exporting translations' });
                    return;
                }
            }
            Swordfish.getProjectsProgress(processId);
        }, 500);
    }

    static getSaveName(file: any, lang: string): any {
        let fileName: string = file.file;
        if (fileName.endsWith('.sdlppx')) {
            return {
                defaultPath: fileName.substr(0, fileName.lastIndexOf('.')) + '.sdlrpx',
                filters: [{ name: file.type, extensions: 'sdlrpx' }, { name: 'Any File', extensions: '*' }]
            }
        }
        let name = fileName.substr(0, fileName.lastIndexOf('.'));
        let extension = fileName.substr(fileName.lastIndexOf('.'));
        return {
            defaultPath: name + '_' + lang + extension,
            filters: [{ name: file.type, extensions: extension }, { name: 'Any File', extensions: '*' }]
        }
    }

    static addFile() {
        let anyFile: string[] = [];
        if (process.platform === 'linux') {
            anyFile = ['*'];
        }
        dialog.showOpenDialog({
            properties: ['openFile'],

            filters: [
                { name: 'Any File', extensions: anyFile },
                { name: 'Adobe InDesign Interchange', extensions: ['inx'] },
                { name: 'Adobe InDesign IDML', extensions: ['idml'] },
                { name: 'DITA Map', extensions: ['ditamap', 'dita', 'xml'] },
                { name: 'HTML Page', extensions: ['html', 'htm'] },
                { name: 'JavaScript', extensions: ['js'] },
                { name: 'Java Properties', extensions: ['properties'] },
                { name: 'JSON', extensions: ['json'] },
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
                { name: 'XLIFF', extensions: ['xlf', 'xliff', 'mqxliff', 'txlf'] },
                { name: 'XML Document', extensions: ['xml'] }
            ]
        }).then((value: Electron.OpenDialogReturnValue) => {
            if (!value.canceled) {
                Swordfish.selectedFile = value.filePaths[0];
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
                });
            }
        }).catch((error: Error) => {
            console.log(error);
        });
    }

    static setSelectedFile(event: IpcMainEvent): void {
        if (Swordfish.selectedFile) {
            Swordfish.getFileType(event, [Swordfish.selectedFile]);
            Swordfish.selectedFile = undefined;
        }
    }

    static translateProjects(): void {
        Swordfish.mainWindow.webContents.send('translate-projects');
    }

    static createProject(arg: any): void {
        if (arg.from === 'addProject') {
            Swordfish.destroyWindow(Swordfish.addProjectWindow);
        }
        if (arg.from === 'addFile') {
            Swordfish.destroyWindow(Swordfish.addFileWindow);
        }
        Swordfish.mainWindow.webContents.send('start-waiting');
        Swordfish.mainWindow.webContents.send('set-status', 'Creating project');
        Swordfish.sendRequest('/projects/create', arg,
            (data: any) => {
                if (data.status !== Swordfish.SUCCESS) {
                    Swordfish.mainWindow.webContents.send('end-waiting');
                    Swordfish.mainWindow.webContents.send('set-status', '');
                    Swordfish.showMessage({ type: 'error', message: data.reason });
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
                            Swordfish.showMessage({ type: 'error', message: Swordfish.currentStatus.reason });
                            return;
                        } else {
                            Swordfish.mainWindow.webContents.send('end-waiting');
                            Swordfish.mainWindow.webContents.send('set-status', '');
                            clearInterval(intervalObject);
                            Swordfish.showMessage({ type: 'error', message: 'Unknown error processing files' });
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
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                    return;
                }
                event.sender.send('set-projects', data.projects);
            },
            (reason: string) => {
                Swordfish.mainWindow.webContents.send('set-status', '');
                Swordfish.showMessage({ type: 'error', message: reason });
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

    static getGlossaries(event: IpcMainEvent): void {
        Swordfish.mainWindow.webContents.send('start-waiting');
        Swordfish.mainWindow.webContents.send('set-status', 'Loading glossaries');
        Swordfish.sendRequest('/glossaries/list', {},
            (data: any) => {
                Swordfish.mainWindow.webContents.send('set-status', '');
                Swordfish.mainWindow.webContents.send('end-waiting');
                if (data.status === Swordfish.SUCCESS) {
                    event.sender.send('set-glossaries', data.glossaries);
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
                { name: 'JSON', extensions: ['json'] },
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
                { name: 'XLIFF', extensions: ['xlf', 'xliff', 'mqxliff', 'txlf'] },
                { name: 'XML Document', extensions: ['xml'] }
            ]
        }).then((value: Electron.OpenDialogReturnValue) => {
            if (!value.canceled) {
                Swordfish.getFileType(event, value.filePaths);
            }
        }).catch((error: Error) => {
            console.log(error);
        });
    }

    static getFileType(event: IpcMainEvent, files: string[]): void {
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
            case "H2":
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
                Swordfish.showMessage({ type: 'error', message: 'Unknown license' });
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
        licenseWindow.once('ready-to-show', () => {
            licenseWindow.show();
        });
        licenseWindow.webContents.on('did-finish-load', () => {
            readFile(Swordfish.currentCss.substring('file://'.length), (error: Error, data: Buffer) => {
                if (!error) {
                    licenseWindow.webContents.insertCSS(data.toString());
                } else {
                    Swordfish.showMessage({ type: 'error', message: error.message });
                }
            });
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
                    Swordfish.showMessage({ type: 'error', message: 'Updates Request Failed.\nStatus code: ' + res.statusCode });
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
                    Swordfish.showMessage({ type: 'error', message: data.reason });
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
                    Swordfish.showMessage({ type: 'error', message: data.reason });
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
                    Swordfish.showMessage({ type: 'error', message: data.reason });
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
                    Swordfish.showMessage({ type: 'error', message: data.reason });
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
                    Swordfish.showMessage({ type: 'error', message: data.reason });
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
        }).then((value: Electron.OpenDialogReturnValue) => {
            if (!value.canceled) {
                event.sender.send('set-srx', value.filePaths[0]);
            }
        }).catch((error: Error) => {
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
        }).then((value: Electron.OpenDialogReturnValue) => {
            if (!value.canceled) {
                event.sender.send('set-catalog', value.filePaths[0]);
            }
        }).catch((error: Error) => {
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
        });
    }

    static savelanguages(arg: any) {
        Swordfish.destroyWindow(this.defaultLangsWindow);
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
                    Swordfish.showMessage({ type: 'error', message: data.reason });
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
                    Swordfish.showMessage({ type: 'error', message: data.reason });
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
                            Swordfish.showMessage({ type: 'error', message: data.reason });
                        }
                    },
                    (reason: string) => {
                        Swordfish.showMessage({ type: 'error', message: reason });
                    }
                );
            }
        });
    }

    static addMemory(arg: any): void {
        Swordfish.destroyWindow(Swordfish.addMemoryWindow);
        Swordfish.mainWindow.webContents.send('start-waiting');
        Swordfish.mainWindow.webContents.send('set-status', 'Creating memory');
        Swordfish.sendRequest('/memories/create', arg,
            (data: any) => {
                Swordfish.mainWindow.webContents.send('end-waiting');
                Swordfish.mainWindow.webContents.send('set-status', '');
                if (data.status !== Swordfish.SUCCESS) {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                    return;
                }
                Swordfish.mainWindow.webContents.send('request-memories');
            },
            (reason: string) => {
                Swordfish.mainWindow.webContents.send('end-waiting');
                Swordfish.mainWindow.webContents.send('set-status', '');
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static addGlossary(arg: any): void {
        Swordfish.destroyWindow(Swordfish.addGlossaryWindow);
        Swordfish.mainWindow.webContents.send('start-waiting');
        Swordfish.mainWindow.webContents.send('set-status', 'Creating glossary');
        Swordfish.sendRequest('/glossaries/create', arg,
            (data: any) => {
                Swordfish.mainWindow.webContents.send('end-waiting');
                Swordfish.mainWindow.webContents.send('set-status', '');
                if (data.status !== Swordfish.SUCCESS) {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                    return;
                }
                Swordfish.mainWindow.webContents.send('request-glossaries');
            },
            (reason: string) => {
                Swordfish.mainWindow.webContents.send('end-waiting');
                Swordfish.mainWindow.webContents.send('set-status', '');
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
        });
    }

    static showImportGlossary(glossary: string): void {
        this.importGlossaryWindow = new BrowserWindow({
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
        this.importGlossaryWindow.setMenu(null);
        this.importGlossaryWindow.loadURL('file://' + this.path.join(app.getAppPath(), 'html', 'importGlossary.html'));
        this.importGlossaryWindow.once('ready-to-show', (event: IpcMainEvent) => {
            event.sender.send('get-height');
            event.sender.send('set-glossary', glossary);
        });
    }

    static importTmxFile(arg: any): void {
        Swordfish.destroyWindow(Swordfish.importTmxWindow);
        Swordfish.mainWindow.webContents.send('start-waiting');
        Swordfish.mainWindow.webContents.send('set-status', 'Importing TMX');
        Swordfish.sendRequest('/memories/import', arg,
            (data: any) => {
                if (data.status !== Swordfish.SUCCESS) {
                    Swordfish.mainWindow.webContents.send('end-waiting');
                    Swordfish.mainWindow.webContents.send('set-status', '');
                    Swordfish.showMessage({ type: 'error', message: data.reason });
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
                            Swordfish.showMessage({ type: 'error', message: Swordfish.currentStatus.reason });
                            return;
                        } else {
                            Swordfish.mainWindow.webContents.send('end-waiting');
                            Swordfish.mainWindow.webContents.send('set-status', '');
                            clearInterval(intervalObject);
                            Swordfish.showMessage({ type: 'error', message: 'Unknown error importing file' });
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

    static getGlossariesProgress(process: string): void {
        this.sendRequest('/glossaries/status', { process: process },
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
        }).then((value: Electron.OpenDialogReturnValue) => {
            if (!value.canceled) {
                event.sender.send('set-tmx-file', value.filePaths[0]);
            }
        });
    }

    static getGlossaryFile(event: IpcMainEvent): void {
        let anyFile: string[] = [];
        if (process.platform === 'linux') {
            anyFile = ['*'];
        }
        dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: 'TMX/TBX File', extensions: ['tmx', 'tbx'] },
                { name: 'Any File', extensions: anyFile }
            ]
        }).then((value: Electron.OpenDialogReturnValue) => {
            if (!value.canceled) {
                event.sender.send('set-glossary-file', value.filePaths[0]);
            }
        });
    }

    static removeMemory(): void {
        Swordfish.mainWindow.webContents.send('remove-memory');
    }

    static removeMemories(arg: string[]) {
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
                            Swordfish.showMessage({ type: 'error', message: data.reason });
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
                                    Swordfish.showMessage({ type: 'error', message: Swordfish.currentStatus.reason });
                                    return;
                                } else {
                                    Swordfish.mainWindow.webContents.send('end-waiting');
                                    Swordfish.mainWindow.webContents.send('set-status', '');
                                    clearInterval(intervalObject);
                                    Swordfish.showMessage({ type: 'error', message: 'Unknown error removing memories' });
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

    static removeGlossaries(arg: string[]) {
        dialog.showMessageBox(Swordfish.mainWindow, { type: "question", message: "Delete selected glossaries?", buttons: ["Yes", "No"], defaultId: 1 }
        ).then((result: any) => {
            if (result.response === 0) {
                Swordfish.mainWindow.webContents.send('start-waiting');
                Swordfish.mainWindow.webContents.send('set-status', 'Removing glossaries');
                Swordfish.sendRequest('/glossaries/delete', { glossaries: arg },
                    (data: any) => {
                        if (data.status !== Swordfish.SUCCESS) {
                            Swordfish.mainWindow.webContents.send('end-waiting');
                            Swordfish.mainWindow.webContents.send('set-status', '');
                            Swordfish.showMessage({ type: 'error', message: data.reason });
                        }
                        Swordfish.currentStatus = data;
                        let processId: string = data.process;
                        var intervalObject = setInterval(() => {
                            if (Swordfish.currentStatus.result) {
                                if (Swordfish.currentStatus.result === Swordfish.COMPLETED) {
                                    Swordfish.mainWindow.webContents.send('end-waiting');
                                    Swordfish.mainWindow.webContents.send('set-status', '');
                                    clearInterval(intervalObject);
                                    Swordfish.mainWindow.webContents.send('request-glossaries');
                                    return;
                                } else if (Swordfish.currentStatus.result === Swordfish.PROCESSING) {
                                    // it's OK, keep waiting
                                } else if (Swordfish.currentStatus.result === Swordfish.ERROR) {
                                    Swordfish.mainWindow.webContents.send('end-waiting');
                                    Swordfish.mainWindow.webContents.send('set-status', '');
                                    clearInterval(intervalObject);
                                    Swordfish.showMessage({ type: 'error', message: Swordfish.currentStatus.reason });
                                    return;
                                } else {
                                    Swordfish.mainWindow.webContents.send('end-waiting');
                                    Swordfish.mainWindow.webContents.send('set-status', '');
                                    clearInterval(intervalObject);
                                    Swordfish.showMessage({ type: 'error', message: 'Unknown error removing glossaries' });
                                    return;
                                }
                            }
                            Swordfish.getGlossariesProgress(processId);
                        }, 500);
                    },
                    (reason: string) => {
                        Swordfish.showMessage({ type: 'error', message: reason });
                    }
                );
            }
        });
    }

    static exportMemories(memories: any[]): void {
        if (memories.length === 1) {
            dialog.showSaveDialog(Swordfish.mainWindow, {
                defaultPath: memories[0].name + '.tmx',
                filters: [{ name: 'TMX Files', extensions: ['tmx'] }, { name: 'Any File', extensions: ['*'] }],
                properties: ['createDirectory', 'showOverwriteConfirmation']
            }).then((value: Electron.SaveDialogReturnValue) => {
                if (!value.canceled) {
                    Swordfish.mainWindow.webContents.send('start-waiting');
                    Swordfish.mainWindow.webContents.send('set-status', 'Exporting memories');
                    Swordfish.sendRequest('/memories/export', { memory: memories[0].memory, tmx: value.filePath },
                        (data: any) => {
                            if (data.status !== Swordfish.SUCCESS) {
                                Swordfish.mainWindow.webContents.send('end-waiting');
                                Swordfish.mainWindow.webContents.send('set-status', '');
                                Swordfish.showMessage({ type: 'error', message: data.reason });
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
                                        Swordfish.showMessage({ type: 'error', message: Swordfish.currentStatus.reason });
                                        return;
                                    } else {
                                        Swordfish.mainWindow.webContents.send('end-waiting');
                                        Swordfish.mainWindow.webContents.send('set-status', '');
                                        clearInterval(intervalObject);
                                        Swordfish.showMessage({ type: 'error', message: 'Unknown error exporting memories' });
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
            }).catch((error: Error) => {
                console.log(error);
            });
        } else {
            // TODO
            for (let i = 0; i < memories.length; i++) {
                console.log(JSON.stringify(memories[i]));
            }
        }
    }

    static exportGlossaries(glossaries: any[]): void {
        if (glossaries.length === 1) {
            dialog.showSaveDialog(Swordfish.mainWindow, {
                defaultPath: glossaries[0].name + '.tmx',
                filters: [{ name: 'TMX Files', extensions: ['tmx'] }, { name: 'Any File', extensions: ['*'] }],
                properties: ['createDirectory', 'showOverwriteConfirmation']
            }).then((value: Electron.SaveDialogReturnValue) => {
                if (!value.canceled) {
                    Swordfish.mainWindow.webContents.send('start-waiting');
                    Swordfish.mainWindow.webContents.send('set-status', 'Exporting glossaries');
                    Swordfish.sendRequest('/glossaries/export', { glossary: glossaries[0].glossary, file: value.filePath },
                        (data: any) => {
                            if (data.status !== Swordfish.SUCCESS) {
                                Swordfish.mainWindow.webContents.send('end-waiting');
                                Swordfish.mainWindow.webContents.send('set-status', '');
                                Swordfish.showMessage({ type: 'error', message: data.reason });
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
                                        Swordfish.showMessage({ type: 'error', message: Swordfish.currentStatus.reason });
                                        return;
                                    } else {
                                        Swordfish.mainWindow.webContents.send('end-waiting');
                                        Swordfish.mainWindow.webContents.send('set-status', '');
                                        clearInterval(intervalObject);
                                        Swordfish.showMessage({ type: 'error', message: 'Unknown error exporting glossaries' });
                                        return;
                                    }
                                }
                                Swordfish.getGlossariesProgress(processId);
                            }, 500);
                        }, (reason: string) => {
                            Swordfish.showMessage({ type: 'error', message: reason });
                        }
                    );
                }
            }).catch((error: Error) => {
                console.log(error);
            });
        } else {
            // TODO
            for (let i = 0; i < glossaries.length; i++) {
                console.log(JSON.stringify(glossaries[i]));
            }
        }
    }

    static closeProject(arg: any): void {
        Swordfish.sendRequest('/projects/close', arg,
            (data: any) => {
                if (data.status !== Swordfish.SUCCESS) {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
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
                    Swordfish.showMessage({ type: 'error', message: data.reason });
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
                    Swordfish.showMessage({ type: 'error', message: data.reason });
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

    static getTerms(arg: any): void {
        Swordfish.sendRequest('/projects/terms', arg,
            (data: any) => {
                if (data.status !== Swordfish.SUCCESS) {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                    return;
                }
                if (data.terms.length > 0) {
                    Swordfish.mainWindow.webContents.send('set-terms', { project: arg.project, terms: data.terms });
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
                    Swordfish.showMessage({ type: 'error', message: data.reason });
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
                    Swordfish.showMessage({ type: 'error', message: data.reason });
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
                    Swordfish.showMessage({ type: 'error', message: data.reason });
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
                    Swordfish.showMessage({ type: 'error', message: data.reason });
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

    static getProjectGlossaries(arg: any): void {
        Swordfish.sendRequest('/projects/projectGlossaries', arg,
            (data: any) => {
                if (data.status !== Swordfish.SUCCESS) {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                    return;
                }
                data.project = arg.project;
                Swordfish.mainWindow.webContents.send('set-project-glossaries', data);
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
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                    return;
                }
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static setProjectGlossary(arg: any): void {
        Swordfish.sendRequest('/projects/setGlossary', arg,
            (data: any) => {
                if (data.status !== Swordfish.SUCCESS) {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
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
        let parent: BrowserWindow = Swordfish.mainWindow;
        if (arg.parent) {
            switch (arg.parent) {
                case 'goTo': parent = Swordfish.goToWindow;
                    break;
                case 'addFile': parent = Swordfish.addFileWindow;
                    break;
                case 'addGlossary': parent = Swordfish.addGlossaryWindow;
                    break;
                case 'addMemory': parent = Swordfish.addMemoryWindow;
                    break;
                case 'addProject': parent = Swordfish.addProjectWindow;
                    break;
                case 'addTerm': parent = Swordfish.addTermWindow;
                    break;
                case 'concordanceSearch': parent = Swordfish.concordanceSearchWindow;
                    break;
                case 'filterSegments': parent = Swordfish.filterSegmentsWindow;
                    break;
                case 'importGlossary': parent = Swordfish.importGlossaryWindow;
                    break;
                case 'importTmx': parent = Swordfish.importTmxWindow;
                    break;
                case 'importXliff': parent = Swordfish.importXliffWindow;
                    break;
                case 'preferences': parent = Swordfish.settingsWindow;
                    break;
                case 'replaceText': parent = Swordfish.replaceTextWindow;
                    break;
                case 'termSearch': parent = Swordfish.termSearchWindow;
                    break;
                default: parent = Swordfish.mainWindow;
            }
        }
        Swordfish.messagesWindow = new BrowserWindow({
            parent: parent,
            width: 600,
            useContentSize: true,
            minimizable: false,
            maximizable: false,
            resizable: false,
            modal: true,
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
        });
    }

    static exportProject(arg: any): void {
        let description = arg.description;
        if (description.lastIndexOf('/') !== -1) {
            description = description.substring(description.lastIndexOf('/'));
        }
        if (description.lastIndexOf('\\') !== -1) {
            description = description.substring(description.lastIndexOf('\\'));
        }
        dialog.showSaveDialog(Swordfish.mainWindow, {
            defaultPath: description + '.xlf',
            filters: [{ name: 'XLIFF Files', extensions: ['xlf'] }, { name: 'Any File', extensions: ['*'] }],
            properties: ['createDirectory', 'showOverwriteConfirmation']
        }).then((value: Electron.SaveDialogReturnValue) => {
            if (!value.canceled) {
                Swordfish.sendRequest('/projects/export', { project: arg.projectId, output: value.filePath },
                    (data: any) => {
                        Swordfish.exportProjectFile(data);
                    }, (reason: string) => {
                        Swordfish.showMessage({ type: 'error', message: reason });
                    }
                );
            }
        }).catch((error: Error) => {
            console.log(error);
        });
    }

    static exportProjectTMX(arg: any): void {
        let description = arg.description;
        if (description.lastIndexOf('/') !== -1) {
            description = description.substring(description.lastIndexOf('/'));
        }
        if (description.lastIndexOf('\\') !== -1) {
            description = description.substring(description.lastIndexOf('\\'));
        }
        dialog.showSaveDialog(Swordfish.mainWindow, {
            defaultPath: description + '.tmx',
            filters: [{ name: 'TMX Files', extensions: ['tmx'] }, { name: 'Any File', extensions: ['*'] }],
            properties: ['createDirectory', 'showOverwriteConfirmation']
        }).then((value: Electron.SaveDialogReturnValue) => {
            if (!value.canceled) {
                Swordfish.sendRequest('/projects/exportTmx', { project: arg.projectId, output: value.filePath },
                    (data: any) => {
                        Swordfish.exportProjectFile(data);
                    }, (reason: string) => {
                        Swordfish.showMessage({ type: 'error', message: reason });
                    }
                );
            }
        }).catch((error: Error) => {
            console.log(error);
        });
    }

    static exportProjectFile(data: any): void {
        if (data.status !== Swordfish.SUCCESS) {
            Swordfish.showMessage({ type: 'error', message: data.reason });
        }
        Swordfish.mainWindow.webContents.send('start-waiting');
        Swordfish.mainWindow.webContents.send('set-status', 'Exporting project');
        Swordfish.currentStatus = data;
        let processId: string = data.process;
        var intervalObject = setInterval(() => {
            if (Swordfish.currentStatus.progress) {
                if (Swordfish.currentStatus.progress === Swordfish.COMPLETED) {
                    Swordfish.mainWindow.webContents.send('end-waiting');
                    Swordfish.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    Swordfish.showMessage({ type: 'info', message: 'Project exported' });
                    return;
                } else if (Swordfish.currentStatus.progress === Swordfish.PROCESSING) {
                    // it's OK, keep waiting
                } else if (Swordfish.currentStatus.progress === Swordfish.ERROR) {
                    Swordfish.mainWindow.webContents.send('end-waiting');
                    Swordfish.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    Swordfish.showMessage({ type: 'error', message: Swordfish.currentStatus.reason });
                    return;
                } else {
                    Swordfish.mainWindow.webContents.send('end-waiting');
                    Swordfish.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    Swordfish.showMessage({ type: 'error', message: 'Unknown error exporting project' });
                    return;
                }
            }
            Swordfish.getProjectsProgress(processId);
        }, 500);
    }

    static showAddGlossary(): void {
        this.addGlossaryWindow = new BrowserWindow({
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
        this.addGlossaryWindow.setMenu(null);
        this.addGlossaryWindow.loadURL('file://' + this.path.join(app.getAppPath(), 'html', 'addGlossary.html'));
        this.addGlossaryWindow.once('ready-to-show', (event: IpcMainEvent) => {
            event.sender.send('get-height');
        });
    }

    static removeGlossary(): void {
        Swordfish.mainWindow.webContents.send('remove-glossary');
    }

    static showImportXliff(): void {
        this.importXliffWindow = new BrowserWindow({
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
        this.importXliffWindow.setMenu(null);
        this.importXliffWindow.loadURL('file://' + this.path.join(app.getAppPath(), 'html', 'importXliff.html'));
        this.importXliffWindow.once('ready-to-show', (event: IpcMainEvent) => {
            event.sender.send('get-height');
        });
    }

    static browseXLIFF(event: IpcMainEvent): void {
        dialog.showOpenDialog({
            title: 'Import XLIFF File',
            properties: ['openFile'],
            filters: [
                { name: 'XLIFF File', extensions: ['xlf'] },
                { name: 'Any File', extensions: ['*'] }
            ]
        }).then((value: Electron.OpenDialogReturnValue) => {
            if (!value.canceled) {
                event.sender.send('set-xliff', value.filePaths[0]);
            }
        }).catch((error: Error) => {
            console.log(error);
        });
    }

    static importXLIFF(arg: any): void {
        Swordfish.destroyWindow(Swordfish.importXliffWindow);
        Swordfish.mainWindow.webContents.send('start-waiting');
        Swordfish.mainWindow.webContents.send('set-status', 'Importing XLIFF');
        Swordfish.sendRequest('/projects/import', arg,
            (data: any) => {
                if (data.status !== Swordfish.SUCCESS) {
                    Swordfish.mainWindow.webContents.send('end-waiting');
                    Swordfish.mainWindow.webContents.send('set-status', '');
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                }
                Swordfish.currentStatus = data;
                let processId: string = data.process;
                var intervalObject = setInterval(() => {
                    if (Swordfish.currentStatus.progress) {
                        if (Swordfish.currentStatus.progress === Swordfish.COMPLETED) {
                            Swordfish.mainWindow.webContents.send('end-waiting');
                            Swordfish.mainWindow.webContents.send('set-status', '');
                            clearInterval(intervalObject);
                            Swordfish.mainWindow.webContents.send('request-projects');
                            return;
                        } else if (Swordfish.currentStatus.progress === Swordfish.PROCESSING) {
                            // it's OK, keep waiting
                        } else if (Swordfish.currentStatus.progress === Swordfish.ERROR) {
                            Swordfish.mainWindow.webContents.send('end-waiting');
                            Swordfish.mainWindow.webContents.send('set-status', '');
                            clearInterval(intervalObject);
                            Swordfish.showMessage({ type: 'error', message: Swordfish.currentStatus.reason });
                            return;
                        } else {
                            Swordfish.mainWindow.webContents.send('end-waiting');
                            Swordfish.mainWindow.webContents.send('set-status', '');
                            clearInterval(intervalObject);
                            Swordfish.showMessage({ type: 'error', message: 'Unknown error importing file' });
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

    static filesDropped(arg: any): void {
        let files: string[] = arg.files;
        if (files.length === 1 && !(existsSync(files[0]) && lstatSync(files[0]).isDirectory())) {
            // single file
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
                Swordfish.selectedFile = files[0];
            });
        } else {
            // TODO multiple files/folders
            console.log(JSON.stringify(arg));
        }
    }

    static sortOptions(arg: any): void {
        Swordfish.mainWindow.webContents.send('set-sorting', arg);
        Swordfish.destroyWindow(Swordfish.sortSegmentsWindow);
    }
    
    static filterOptions(arg: any): void {
        Swordfish.mainWindow.webContents.send('set-filters', arg);
        Swordfish.destroyWindow(Swordfish.filterSegmentsWindow);
    }

    static removeTranslations(arg: any): void {
        dialog.showMessageBox(Swordfish.mainWindow, {
            type: 'question',
            message: 'Remove all translations?',
            buttons: ['Yes', 'No']
        }).then((selection: Electron.MessageBoxReturnValue) => {
            if (selection.response === 0) {
                Swordfish.mainWindow.webContents.send('start-waiting');
                Swordfish.mainWindow.webContents.send('set-status', 'Removing translations');
                Swordfish.sendRequest('/projects/removeTranslations', arg,
                    (data: any) => {
                        Swordfish.mainWindow.webContents.send('end-waiting');
                        Swordfish.mainWindow.webContents.send('set-status', '');
                        if (data.status !== Swordfish.SUCCESS) {
                            Swordfish.showMessage({ type: 'error', message: data.reason });
                            return;
                        }
                        Swordfish.mainWindow.webContents.send('reload-page', { project: arg.project });
                        Swordfish.mainWindow.webContents.send('set-statistics', { project: arg.project, statistics: data.statistics });
                    },
                    (reason: string) => {
                        Swordfish.mainWindow.webContents.send('end-waiting');
                        Swordfish.mainWindow.webContents.send('set-status', '');
                        Swordfish.showMessage({ type: 'error', message: reason });
                    }
                );
            }
        });
    }

    static removeMatches(arg: any): void {
        dialog.showMessageBox(Swordfish.mainWindow, {
            type: 'question',
            message: 'Remove all translation memory matches?',
            buttons: ['Yes', 'No']
        }).then((selection: Electron.MessageBoxReturnValue) => {
            if (selection.response === 0) {
                Swordfish.mainWindow.webContents.send('start-waiting');
                Swordfish.mainWindow.webContents.send('set-status', 'Removing matches');
                Swordfish.sendRequest('/projects/removeMatches', arg,
                    (data: any) => {
                        Swordfish.mainWindow.webContents.send('end-waiting');
                        Swordfish.mainWindow.webContents.send('set-status', '');
                        if (data.status !== Swordfish.SUCCESS) {
                            Swordfish.showMessage({ type: 'error', message: data.reason });
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
        });
    }

    static removeMachineTranslations(arg: any): void {
        dialog.showMessageBox(Swordfish.mainWindow, {
            type: 'question',
            message: 'Remove all machine translations?',
            buttons: ['Yes', 'No']
        }).then((selection: Electron.MessageBoxReturnValue) => {
            if (selection.response === 0) {
                Swordfish.mainWindow.webContents.send('start-waiting');
                Swordfish.mainWindow.webContents.send('set-status', 'Removing translations');
                Swordfish.sendRequest('/projects/removeMT', arg,
                    (data: any) => {
                        Swordfish.mainWindow.webContents.send('end-waiting');
                        Swordfish.mainWindow.webContents.send('set-status', '');
                        if (data.status !== Swordfish.SUCCESS) {
                            Swordfish.showMessage({ type: 'error', message: data.reason });
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
        });
    }

    static unconfirmTranslations(arg: any): void {
        dialog.showMessageBox(Swordfish.mainWindow, {
            type: 'question',
            message: 'Unconfirm all translations?',
            buttons: ['Yes', 'No']
        }).then((selection: Electron.MessageBoxReturnValue) => {
            if (selection.response === 0) {
                Swordfish.mainWindow.webContents.send('start-waiting');
                Swordfish.mainWindow.webContents.send('set-status', 'Updating status');
                Swordfish.sendRequest('/projects/unconfirmTranslations', arg,
                    (data: any) => {
                        Swordfish.mainWindow.webContents.send('end-waiting');
                        Swordfish.mainWindow.webContents.send('set-status', '');
                        if (data.status !== Swordfish.SUCCESS) {
                            Swordfish.showMessage({ type: 'error', message: data.reason });
                            return;
                        }
                        Swordfish.mainWindow.webContents.send('reload-page', { project: arg.project });
                        Swordfish.mainWindow.webContents.send('set-statistics', { project: arg.project, statistics: data.statistics });
                    },
                    (reason: string) => {
                        Swordfish.mainWindow.webContents.send('end-waiting');
                        Swordfish.mainWindow.webContents.send('set-status', '');
                        Swordfish.showMessage({ type: 'error', message: reason });
                    }
                );
            }
        });
    }

    static pseudoTranslate(arg: any): void {
        dialog.showMessageBox(Swordfish.mainWindow, {
            type: 'question',
            message: 'Pseudo-translate untranslated segments?',
            buttons: ['Yes', 'No']
        }).then((selection: Electron.MessageBoxReturnValue) => {
            if (selection.response === 0) {
                Swordfish.mainWindow.webContents.send('start-waiting');
                Swordfish.mainWindow.webContents.send('set-status', 'Pseudo-translating');
                Swordfish.sendRequest('/projects/pseudoTranslate', arg,
                    (data: any) => {
                        Swordfish.mainWindow.webContents.send('end-waiting');
                        Swordfish.mainWindow.webContents.send('set-status', '');
                        if (data.status !== Swordfish.SUCCESS) {
                            Swordfish.showMessage({ type: 'error', message: data.reason });
                            return;
                        }
                        Swordfish.mainWindow.webContents.send('reload-page', { project: arg.project });
                        Swordfish.mainWindow.webContents.send('set-statistics', { project: arg.project, statistics: data.statistics });
                    },
                    (reason: string) => {
                        Swordfish.mainWindow.webContents.send('end-waiting');
                        Swordfish.mainWindow.webContents.send('set-status', '');
                        Swordfish.showMessage({ type: 'error', message: reason });
                    }
                );
            }
        });
    }

    static copyAllSources(arg: any): void {
        dialog.showMessageBox(Swordfish.mainWindow, {
            type: 'question',
            message: 'Copy source to all empty targets?',
            buttons: ['Yes', 'No']
        }).then((selection: Electron.MessageBoxReturnValue) => {
            if (selection.response === 0) {
                Swordfish.mainWindow.webContents.send('start-waiting');
                Swordfish.mainWindow.webContents.send('set-status', 'Copying sources');
                Swordfish.sendRequest('/projects/copyAllSources', arg,
                    (data: any) => {
                        Swordfish.mainWindow.webContents.send('end-waiting');
                        Swordfish.mainWindow.webContents.send('set-status', '');
                        if (data.status !== Swordfish.SUCCESS) {
                            Swordfish.showMessage({ type: 'error', message: data.reason });
                            return;
                        }
                        Swordfish.mainWindow.webContents.send('reload-page', { project: arg.project });
                        Swordfish.mainWindow.webContents.send('set-statistics', { project: arg.project, statistics: data.statistics });
                    },
                    (reason: string) => {
                        Swordfish.mainWindow.webContents.send('end-waiting');
                        Swordfish.mainWindow.webContents.send('set-status', '');
                        Swordfish.showMessage({ type: 'error', message: reason });
                    }
                );
            }
        });
    }

    static confirmAllTranslations(arg: any): void {
        dialog.showMessageBox(Swordfish.mainWindow, {
            type: 'question',
            message: 'Confirm all translations?',
            buttons: ['Yes', 'No']
        }).then((selection: Electron.MessageBoxReturnValue) => {
            if (selection.response === 0) {
                Swordfish.mainWindow.webContents.send('start-waiting');
                Swordfish.mainWindow.webContents.send('set-status', 'Updating status');
                Swordfish.sendRequest('/projects/confirmAllTranslations', arg,
                    (data: any) => {
                        Swordfish.mainWindow.webContents.send('end-waiting');
                        Swordfish.mainWindow.webContents.send('set-status', '');
                        if (data.status !== Swordfish.SUCCESS) {
                            Swordfish.showMessage({ type: 'error', message: data.reason });
                            return;
                        }
                        Swordfish.mainWindow.webContents.send('reload-page', { project: arg.project });
                        Swordfish.mainWindow.webContents.send('set-statistics', { project: arg.project, statistics: data.statistics });
                    },
                    (reason: string) => {
                        Swordfish.mainWindow.webContents.send('end-waiting');
                        Swordfish.mainWindow.webContents.send('set-status', '');
                        Swordfish.showMessage({ type: 'error', message: reason });
                    }
                );
            }
        });
    }

    static acceptAll100Matches(arg: any): void {
        dialog.showMessageBox(Swordfish.mainWindow, {
            type: 'question',
            message: 'Accept all 100% matches?',
            buttons: ['Yes', 'No']
        }).then((selection: Electron.MessageBoxReturnValue) => {
            if (selection.response === 0) {
                Swordfish.mainWindow.webContents.send('start-waiting');
                Swordfish.mainWindow.webContents.send('set-status', 'Accepting matches');
                Swordfish.sendRequest('/projects/acceptAll100Matches', arg,
                    (data: any) => {
                        Swordfish.mainWindow.webContents.send('end-waiting');
                        Swordfish.mainWindow.webContents.send('set-status', '');
                        if (data.status !== Swordfish.SUCCESS) {
                            Swordfish.showMessage({ type: 'error', message: data.reason });
                            return;
                        }
                        Swordfish.mainWindow.webContents.send('reload-page', { project: arg.project });
                        Swordfish.mainWindow.webContents.send('set-statistics', { project: arg.project, statistics: data.statistics });
                    },
                    (reason: string) => {
                        Swordfish.mainWindow.webContents.send('end-waiting');
                        Swordfish.mainWindow.webContents.send('set-status', '');
                        Swordfish.showMessage({ type: 'error', message: reason });
                    }
                );
            }
        });
    }

    static generateStatistics(arg: any) {
        Swordfish.mainWindow.webContents.send('start-waiting');
        Swordfish.mainWindow.webContents.send('set-status', 'Generating statistics');
        Swordfish.sendRequest('/projects/generateStatistics', arg,
            (data: any) => {
                Swordfish.mainWindow.webContents.send('end-waiting');
                Swordfish.mainWindow.webContents.send('set-status', '');
                if (data.status !== Swordfish.SUCCESS) {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                    return;
                }
                shell.openExternal('file://' + data.analysis);
            },
            (reason: string) => {
                Swordfish.mainWindow.webContents.send('end-waiting');
                Swordfish.mainWindow.webContents.send('set-status', '');
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static showTagsWindow(): void {
        this.tagsWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: 200,
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
        this.tagsWindow.setMenu(null);
        this.tagsWindow.loadURL('file://' + this.path.join(app.getAppPath(), 'html', 'tags.html'));
        this.tagsWindow.once('ready-to-show', (event: IpcMainEvent) => {
            event.sender.send('get-height');
        });
    }

    static showGoToWindow(): void {
        this.goToWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: 260,
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
        this.goToWindow.setMenu(null);
        this.goToWindow.loadURL('file://' + this.path.join(app.getAppPath(), 'html', 'goTo.html'));
        this.goToWindow.once('ready-to-show', (event: IpcMainEvent) => {
            event.sender.send('get-height');
        });
    }

    static closeTagsWindow(): void {
        if (this.tagsWindow && this.tagsWindow.isVisible()) {
            Swordfish.destroyWindow(Swordfish.tagsWindow);
        }
    }

    static showReplaceText(arg: any): void {
        this.replaceTextWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: 450,
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
        this.replaceTextWindow.setMenu(null);
        this.replaceTextWindow.loadURL('file://' + this.path.join(app.getAppPath(), 'html', 'replaceText.html'));
        this.replaceTextWindow.once('ready-to-show', (event: IpcMainEvent) => {
            event.sender.send('get-height');
            event.sender.send('set-project', arg);
        });
    }

    static replaceText(arg: any): void {
        Swordfish.mainWindow.webContents.send('start-waiting');
        Swordfish.mainWindow.webContents.send('set-status', 'Replacing text');
        Swordfish.sendRequest('/projects/replaceText', arg,
            (data: any) => {
                Swordfish.mainWindow.webContents.send('end-waiting');
                Swordfish.mainWindow.webContents.send('set-status', '');
                if (data.status !== Swordfish.SUCCESS) {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                    return;
                }
                Swordfish.destroyWindow(Swordfish.replaceTextWindow);
                Swordfish.mainWindow.webContents.send('reload-page', { project: arg.project });
                Swordfish.mainWindow.webContents.send('set-statistics', { project: arg.project, statistics: data.statistics });
            },
            (reason: string) => {
                Swordfish.mainWindow.webContents.send('end-waiting');
                Swordfish.mainWindow.webContents.send('set-status', '');
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static applyMachineTranslationsAll(arg: any): void {
        dialog.showMessageBox(Swordfish.mainWindow, {
            type: 'question',
            message: 'Aply Machine Translation to all segments?',
            buttons: ['Yes', 'No']
        }).then((selection: Electron.MessageBoxReturnValue) => {
            if (selection.response === 0) {
                Swordfish.mainWindow.webContents.send('start-waiting');
                Swordfish.mainWindow.webContents.send('set-status', 'Applying MT');
                Swordfish.sendRequest('/projects/applyMtAll', arg,
                    (data: any) => {
                        if (data.status !== Swordfish.SUCCESS) {
                            Swordfish.mainWindow.webContents.send('end-waiting');
                            Swordfish.mainWindow.webContents.send('set-status', '');
                            Swordfish.showMessage({ type: 'error', message: data.reason });
                        }
                        Swordfish.currentStatus = data;
                        let processId: string = data.process;
                        var intervalObject = setInterval(() => {
                            if (Swordfish.currentStatus.progress) {
                                if (Swordfish.currentStatus.progress === Swordfish.COMPLETED) {
                                    Swordfish.mainWindow.webContents.send('end-waiting');
                                    Swordfish.mainWindow.webContents.send('set-status', '');
                                    clearInterval(intervalObject);
                                    Swordfish.mainWindow.webContents.send('reload-page', { project: arg.project });
                                    return;
                                } else if (Swordfish.currentStatus.progress === Swordfish.PROCESSING) {
                                    // it's OK, keep waiting
                                } else if (Swordfish.currentStatus.progress === Swordfish.ERROR) {
                                    Swordfish.mainWindow.webContents.send('end-waiting');
                                    Swordfish.mainWindow.webContents.send('set-status', '');
                                    clearInterval(intervalObject);
                                    Swordfish.showMessage({ type: 'error', message: Swordfish.currentStatus.reason });
                                    return;
                                } else {
                                    Swordfish.mainWindow.webContents.send('end-waiting');
                                    Swordfish.mainWindow.webContents.send('set-status', '');
                                    clearInterval(intervalObject);
                                    Swordfish.showMessage({ type: 'error', message: 'Unknown error applying MT' });
                                    return;
                                }
                            }
                            Swordfish.getProjectsProgress(processId);
                        }, 500);
                    },
                    (reason: string) => {
                        Swordfish.mainWindow.webContents.send('end-waiting');
                        Swordfish.mainWindow.webContents.send('set-status', '');
                        Swordfish.showMessage({ type: 'error', message: reason });
                    }
                );
            }
        });
    }

    static destroyWindow(window: BrowserWindow): void {
        if (window) {
            try {
                let parent: BrowserWindow = window.getParentWindow();
                window.destroy();
                window = undefined;
                parent.focus();
            } catch (e) {
                console.log(e);
            }
        }
    }

    static acceptAllMachineTranslations(arg: any) {
        dialog.showMessageBox(Swordfish.mainWindow, {
            type: 'question',
            message: 'Accept all machine translations?',
            buttons: ['Yes', 'No']
        }).then((selection: Electron.MessageBoxReturnValue) => {
            if (selection.response === 0) {
                Swordfish.mainWindow.webContents.send('start-waiting');
                Swordfish.mainWindow.webContents.send('set-status', 'Accepting matches');
                Swordfish.sendRequest('/projects/acceptAllMT', arg,
                    (data: any) => {
                        Swordfish.mainWindow.webContents.send('end-waiting');
                        Swordfish.mainWindow.webContents.send('set-status', '');
                        if (data.status !== Swordfish.SUCCESS) {
                            Swordfish.showMessage({ type: 'error', message: data.reason });
                            return;
                        }
                        Swordfish.mainWindow.webContents.send('reload-page', { project: arg.project });
                        Swordfish.mainWindow.webContents.send('set-statistics', { project: arg.project, statistics: data.statistics });
                    },
                    (reason: string) => {
                        Swordfish.mainWindow.webContents.send('end-waiting');
                        Swordfish.mainWindow.webContents.send('set-status', '');
                        Swordfish.showMessage({ type: 'error', message: reason });
                    }
                );
            }
        });
    }

    static importGlossaryFile(arg: any): void {
        Swordfish.destroyWindow(Swordfish.importGlossaryWindow);
        Swordfish.mainWindow.webContents.send('start-waiting');
        Swordfish.mainWindow.webContents.send('set-status', 'Importing glossary');
        Swordfish.sendRequest('/glossaries/import', arg,
            (data: any) => {
                if (data.status !== Swordfish.SUCCESS) {
                    Swordfish.mainWindow.webContents.send('end-waiting');
                    Swordfish.mainWindow.webContents.send('set-status', '');
                    Swordfish.showMessage({ type: 'error', message: data.reason });
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
                            Swordfish.showMessage({ type: 'error', message: Swordfish.currentStatus.reason });
                            return;
                        } else {
                            Swordfish.mainWindow.webContents.send('end-waiting');
                            Swordfish.mainWindow.webContents.send('set-status', '');
                            clearInterval(intervalObject);
                            Swordfish.showMessage({ type: 'error', message: 'Unknown error importing glossary' });
                            return;
                        }
                    }
                    Swordfish.getGlossariesProgress(processId);
                }, 500);
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static showConcordanceWindow(arg: any): void {
        this.concordanceSearchWindow = new BrowserWindow({
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
        this.concordanceSearchWindow.setMenu(null);
        this.concordanceSearchWindow.loadURL('file://' + this.path.join(app.getAppPath(), 'html', 'concordanceSearch.html'));
        this.concordanceSearchWindow.once('ready-to-show', (event: IpcMainEvent) => {
            event.sender.send('get-height');
            event.sender.send('set-memories', arg.memories);
        });
    }

    static concordanceSearch(arg: any): void {
        Swordfish.sendRequest('/memories/concordance', arg,
            (data: any) => {
                if (data.status !== Swordfish.SUCCESS) {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                    return;
                }
                if (data.count === 0) {
                    Swordfish.showMessage({ type: 'info', message: 'Text not found' });
                    return;
                }
                let size: Rectangle = Swordfish.mainWindow.getBounds();
                let htmlViewerWindow: BrowserWindow = new BrowserWindow({
                    parent: this.mainWindow,
                    width: size.width * 0.6,
                    height: size.height * 0.4,
                    minimizable: false,
                    maximizable: false,
                    resizable: true,
                    useContentSize: true,
                    show: false,
                    icon: this.iconPath,
                    webPreferences: {
                        nodeIntegration: true
                    }
                });
                htmlViewerWindow.setMenu(null);
                htmlViewerWindow.loadURL('file://' + this.path.join(app.getAppPath(), 'html', 'htmlViewer.html'));
                htmlViewerWindow.once('ready-to-show', (event: IpcMainEvent) => {
                    event.sender.send('get-height');
                    event.sender.send('set-title', 'Concordance Search');
                    event.sender.send('set-content', data.html);
                    event.sender.send('set-id', { id: htmlViewerWindow.id });
                    htmlViewerWindow.show();
                });
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static showTermSearch(arg: any): any {
        this.termSearchWindow = new BrowserWindow({
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
        this.termSearchWindow.setMenu(null);
        this.termSearchWindow.loadURL('file://' + this.path.join(app.getAppPath(), 'html', 'termSearch.html'));
        this.termSearchWindow.once('ready-to-show', (event: IpcMainEvent) => {
            event.sender.send('get-height');
            event.sender.send('set-glossary', arg.glossary);
        });
    }

    static termSearch(arg: any): void {
        Swordfish.sendRequest('/glossaries/search', arg,
            (data: any) => {
                if (data.status !== Swordfish.SUCCESS) {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                    return;
                }
                if (data.count === 0) {
                    Swordfish.showMessage({ type: 'info', message: 'Term not found' });
                    return;
                }
                let size: Rectangle = Swordfish.mainWindow.getBounds();
                let htmlViewerWindow: BrowserWindow = new BrowserWindow({
                    parent: this.mainWindow,
                    width: size.width * 0.6,
                    height: size.height * 0.4,
                    minimizable: false,
                    maximizable: false,
                    resizable: true,
                    useContentSize: true,
                    show: false,
                    icon: this.iconPath,
                    webPreferences: {
                        nodeIntegration: true
                    }
                });
                htmlViewerWindow.setMenu(null);
                htmlViewerWindow.loadURL('file://' + this.path.join(app.getAppPath(), 'html', 'htmlViewer.html'));
                htmlViewerWindow.once('ready-to-show', (event: IpcMainEvent) => {
                    event.sender.send('get-height');
                    event.sender.send('set-title', 'Term Search');
                    event.sender.send('set-content', data.html);
                    event.sender.send('set-id', { id: htmlViewerWindow.id });
                    htmlViewerWindow.show();
                });
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static showAddTerm(arg: any) {
        this.addTermWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: 700,
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
        this.addTermWindow.setMenu(null);
        this.addTermWindow.loadURL('file://' + this.path.join(app.getAppPath(), 'html', 'addTerm.html'));
        this.addTermWindow.once('ready-to-show', (event: IpcMainEvent) => {
            event.sender.send('get-height');
            event.sender.send('set-glossary', arg);
        });
    }

    static addToGlossary(arg: any): void {
        Swordfish.destroyWindow(this.addTermWindow);
        Swordfish.sendRequest('/glossaries/addTerm', arg,
            (data: any) => {
                if (data.status !== Swordfish.SUCCESS) {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                    return;
                }
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static getSegmentTerms(arg: any) {
        Swordfish.sendRequest('/projects/getSegmentTerms', arg,
            (data: any) => {
                if (data.status !== Swordfish.SUCCESS) {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                    return;
                }
                if (data.terms.length > 0) {
                    Swordfish.mainWindow.webContents.send('set-terms', { project: arg.project, terms: data.terms });
                }
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static getProjectTerms(arg: any) {
        dialog.showMessageBox(Swordfish.mainWindow, {
            type: 'question',
            message: 'Get terms for all segments?',
            buttons: ['Yes', 'No']
        }).then((selection: Electron.MessageBoxReturnValue) => {
            if (selection.response === 0) {
                Swordfish.mainWindow.webContents.send('start-waiting');
                Swordfish.mainWindow.webContents.send('set-status', 'Getting terms');
                Swordfish.sendRequest('/projects/getProjectTerms', arg,
                    (data: any) => {
                        if (data.status !== Swordfish.SUCCESS) {
                            Swordfish.mainWindow.webContents.send('end-waiting');
                            Swordfish.mainWindow.webContents.send('set-status', '');
                            Swordfish.showMessage({ type: 'error', message: data.reason });
                        }
                        Swordfish.currentStatus = data;
                        let processId: string = data.process;
                        var intervalObject = setInterval(() => {
                            if (Swordfish.currentStatus.progress) {
                                if (Swordfish.currentStatus.progress === Swordfish.COMPLETED) {
                                    Swordfish.mainWindow.webContents.send('end-waiting');
                                    Swordfish.mainWindow.webContents.send('set-status', '');
                                    clearInterval(intervalObject);
                                    return;
                                } else if (Swordfish.currentStatus.progress === Swordfish.PROCESSING) {
                                    // it's OK, keep waiting
                                } else if (Swordfish.currentStatus.progress === Swordfish.ERROR) {
                                    Swordfish.mainWindow.webContents.send('end-waiting');
                                    Swordfish.mainWindow.webContents.send('set-status', '');
                                    clearInterval(intervalObject);
                                    Swordfish.showMessage({ type: 'error', message: Swordfish.currentStatus.reason });
                                    return;
                                } else {
                                    Swordfish.mainWindow.webContents.send('end-waiting');
                                    Swordfish.mainWindow.webContents.send('set-status', '');
                                    clearInterval(intervalObject);
                                    Swordfish.showMessage({ type: 'error', message: 'Unknown error getting terms' });
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
        });
    }

    static lockSegment(arg: any) {
        Swordfish.sendRequest('/projects/lockSegment', arg,
            (data: any) => {
                if (data.status !== Swordfish.SUCCESS) {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                    return;
                }
                Swordfish.mainWindow.webContents.send('reload-page', { project: arg.project });
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static lockDuplicates(arg: any) {
        Swordfish.sendRequest('/projects/lockDuplicates', arg,
            (data: any) => {
                if (data.status !== Swordfish.SUCCESS) {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                    return;
                }
                Swordfish.mainWindow.webContents.send('reload-page', { project: arg.project });
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static unlockAll(arg: any) {
        Swordfish.sendRequest('/projects/unlockAll', arg,
            (data: any) => {
                if (data.status !== Swordfish.SUCCESS) {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                    return;
                }
                Swordfish.mainWindow.webContents.send('reload-page', { project: arg.project });
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static analyzeSpaces(arg: any): void {
        Swordfish.sendRequest('/projects/analyzeSpaces', arg,
            (data: any) => {
                if (data.status !== Swordfish.SUCCESS) {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                    return;
                }
                if (data.errors.length === 0) {
                    Swordfish.showMessage({ type: 'info', message: 'There are no errors in initial/trailing spaces' });
                    return;
                }
                let table: string = '<div class="divContainer"><table class="stripes fill_width">';
                let length = data.errors.length;
                for (let i = 0; i < length; i++) {
                    let line: any = data.errors[i];
                    table = table + '<tr><td class="center initial">' + line.index + '</td><td class="center fill_width">' + line.type + '</td></tr>';
                }
                table = table + '</table></div>';
                let htmlViewerWindow: BrowserWindow = new BrowserWindow({
                    parent: this.mainWindow,
                    width: 250,
                    height: 350,
                    minimizable: false,
                    maximizable: false,
                    resizable: true,
                    useContentSize: true,
                    show: false,
                    icon: this.iconPath,
                    webPreferences: {
                        nodeIntegration: true
                    }
                });
                htmlViewerWindow.setMenu(null);
                htmlViewerWindow.loadURL('file://' + this.path.join(app.getAppPath(), 'html', 'htmlViewer.html'));
                htmlViewerWindow.once('ready-to-show', (event: IpcMainEvent) => {
                    event.sender.send('get-height');
                    event.sender.send('set-title', 'Space Analysis');
                    event.sender.send('set-content', table);
                    event.sender.send('set-id', { id: htmlViewerWindow.id });
                    htmlViewerWindow.show();
                });
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static analyzeTags(arg: any): void {
        Swordfish.sendRequest('/projects/analyzeTags', arg,
            (data: any) => {
                if (data.status !== Swordfish.SUCCESS) {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                    return;
                }
                if (data.errors.length === 0) {
                    Swordfish.showMessage({ type: 'info', message: 'There are no tag errors' });
                    return;
                }
                let table: string = '<div class="divContainer"><table class="stripes fill_width">';
                let length = data.errors.length;
                for (let i = 0; i < length; i++) {
                    let line: any = data.errors[i];
                    table = table + '<tr><td class="center initial">' + line.index + '</td><td class="center fill_width">' + line.type + '</td></tr>';
                }
                table = table + '</table></div>';
                let htmlViewerWindow: BrowserWindow = new BrowserWindow({
                    parent: this.mainWindow,
                    width: 250,
                    height: 350,
                    minimizable: false,
                    maximizable: false,
                    resizable: true,
                    useContentSize: true,
                    show: false,
                    icon: this.iconPath,
                    webPreferences: {
                        nodeIntegration: true
                    }
                });
                htmlViewerWindow.setMenu(null);
                htmlViewerWindow.loadURL('file://' + this.path.join(app.getAppPath(), 'html', 'htmlViewer.html'));
                htmlViewerWindow.once('ready-to-show', (event: IpcMainEvent) => {
                    event.sender.send('get-height');
                    event.sender.send('set-title', 'Tags Analysis');
                    event.sender.send('set-content', table);
                    event.sender.send('set-id', { id: htmlViewerWindow.id });
                    htmlViewerWindow.show();
                });
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }
}

new Swordfish();