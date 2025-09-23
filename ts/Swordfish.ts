/*******************************************************************************
 * Copyright (c) 2007 - 2025 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/

import { ChildProcessWithoutNullStreams, execFileSync, spawn } from "child_process";
import { BrowserWindow, ClientRequest, IpcMainEvent, Menu, MenuItem, Notification, Rectangle, Size, app, clipboard, dialog, ipcMain, nativeTheme, net, screen, session, shell } from "electron";
import { IncomingMessage } from "electron/main";
import { appendFileSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, rmSync, unlinkSync, writeFileSync } from "fs";
import { MTUtils } from "mtengines/dist";
import { XMLElement } from "typesxml";
import { Locations, Point } from "./locations";
import { Rect, Sizes } from "./windowSizes";
import { MTManager } from "./mtManager";

export class Swordfish {

    static readonly path = require('path');
    static readonly os = require('os');

    static mainWindow: BrowserWindow;
    static preferencesWindow: BrowserWindow;
    static aboutWindow: BrowserWindow;
    static licensesWindow: BrowserWindow;
    static addMemoryWindow: BrowserWindow;
    static importTmxWindow: BrowserWindow;
    static importXliffWindow: BrowserWindow;
    static addProjectWindow: BrowserWindow;
    static editProjectWindow: BrowserWindow;
    static addFileWindow: BrowserWindow;
    static defaultLangsWindow: BrowserWindow;
    static spellingLangsWindow: BrowserWindow;
    static filterSegmentsWindow: BrowserWindow;
    static tagsWindow: BrowserWindow;
    static replaceTextWindow: BrowserWindow;
    static addGlossaryWindow: BrowserWindow;
    static importGlossaryWindow: BrowserWindow;
    static concordanceSearchWindow: BrowserWindow;
    static termSearchWindow: BrowserWindow;
    static iatePluginWindow: BrowserWindow;
    static addTermWindow: BrowserWindow;
    static goToWindow: BrowserWindow;
    static sortSegmentsWindow: BrowserWindow;
    static changeCaseWindow: BrowserWindow;
    static applyTmWindow: BrowserWindow;
    static notesWindow: BrowserWindow;
    static addNoteWindow: BrowserWindow;
    static reviewCommentsWindow: BrowserWindow;
    static addReplyWindow: BrowserWindow;
    static fileInfoWindow: BrowserWindow;
    static addCommentWindow: BrowserWindow;
    static updatesWindow: BrowserWindow;
    static gettingStartedWindow: BrowserWindow;
    static serverSettingsWindow: BrowserWindow;
    static browseDatabasesWindow: BrowserWindow;
    static addXmlConfigurationWindow: BrowserWindow;
    static editXmlFilterWindow: BrowserWindow;
    static configElementWindow: BrowserWindow;
    static tagsAnalysisWindow: BrowserWindow;
    static spaceAnalysisWindow: BrowserWindow;
    static systemInfoWindow: BrowserWindow;
    static promptWindow: BrowserWindow;

    javapath: string = Swordfish.path.join(app.getAppPath(), 'bin', 'java');

    static appHome: string = Swordfish.path.join(app.getPath('appData'), app.name);
    static iconPath: string = Swordfish.path.join(app.getAppPath(), 'images', 'icon.png');

    static latestVersion: string;
    static downloadLink: string;

    static currentDefaults: Rectangle;
    static currentPreferences: Preferences = {
        theme: 'system',
        zoomFactor: '1.0',
        srcLang: 'none',
        tgtLang: 'none',
        userName: Swordfish.os.userInfo().username,
        projectsFolder: Swordfish.path.join(app.getPath('appData'), app.name, 'projects'),
        memoriesFolder: Swordfish.path.join(app.getPath('appData'), app.name, 'memories'),
        glossariesFolder: Swordfish.path.join(app.getPath('appData'), app.name, 'glossaries'),
        catalog: Swordfish.path.join(app.getAppPath(), 'catalog', 'catalog.xml'),
        srx: Swordfish.path.join(app.getAppPath(), 'srx', 'default.srx'),
        reviewModel: Swordfish.path.join(app.getAppPath(), 'review', 'default.json'),
        paragraphSegmentation: false,
        acceptUnconfirmed: false,
        fuzzyTermSearches: false,
        caseSensitiveSearches: false,
        caseSensitiveMatches: true,
        autoConfirm: false,
        google: {
            enabled: false,
            apiKey: '',
            srcLang: 'none',
            tgtLang: 'none'
        },
        azure: {
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
        chatGpt: {
            enabled: false,
            apiKey: '',
            model: 'gpt-4o-mini',
            fixTags: false
        },
        anthropic: {
            enabled: false,
            apiKey: '',
            model: 'claude-3-7-sonnet-latest',
            fixTags: false
        },
        modernmt: {
            enabled: false,
            apiKey: '',
            srcLang: 'none',
            tgtLang: 'none'
        },
        spellchecker: {
            defaultEnglish: 'en-US',
            defaultPortuguese: 'pt-BR',
            defaultSpanish: 'es'
        },
        os: process.platform,
        showGuide: true,
        pageRows: 500
    }

    static currentCss: string;
    static currentStatus: any;

    static selectedFiles: string[];
    static sortParams: any;
    static filterParams: any;
    static memoryParam: string;
    static metadataEvent: IpcMainEvent;
    static concordanceMemories: string[];
    static selectedGlossary: string;
    static messageParam: any;
    static projectParam: string;
    static remoteTmParams: any;
    static typeParam: string;
    static xmlFilter: string;
    static filterElement: any;
    static editedProject: Project;
    static activeProject: string;

    static htmlContent: string;
    static htmlTitle: string;
    static htmlId: number;

    static SUCCESS: string = 'Success';
    static LOADING: string = 'Loading';
    static COMPLETED: string = 'Completed';
    static ERROR: string = 'Error';
    static SAVING: string = 'Saving';
    static PROCESSING: string = 'Processing';

    static spellCheckerLanguages: string[];
    static selectionRequest: IpcMainEvent;
    static addConfigurationEvent: IpcMainEvent;

    ls: ChildProcessWithoutNullStreams;

    static locations: Locations;
    static sizes: Sizes;

    constructor() {
        if (!app.requestSingleInstanceLock()) {
            app.quit();
        } else if (Swordfish.mainWindow) {
            // Someone tried to run a second instance, we should focus our window.
            if (Swordfish.mainWindow.isMinimized()) {
                Swordfish.mainWindow.restore();
            }
            Swordfish.mainWindow.focus();
        }
        if (process.platform === 'linux') {
            app.commandLine.appendSwitch('gtk-version', '3');
        }
        if (process.platform === 'win32') {
            this.javapath = Swordfish.path.join(app.getAppPath(), 'bin', 'java.exe');
        }

        if (!existsSync(Swordfish.appHome)) {
            mkdirSync(Swordfish.appHome, { recursive: true });
        }

        this.ls = spawn(this.javapath, ['--module-path', 'lib', '-m', 'swordfish/com.maxprograms.swordfish.TmsServer', '-port', '8070'], { cwd: app.getAppPath(), windowsHide: true });
        this.ls.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });
        this.ls.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });
        execFileSync(this.javapath, ['--module-path', 'lib', '-m', 'swordfish/com.maxprograms.swordfish.CheckURL', 'http://localhost:8070/TMSServer'], { cwd: app.getAppPath(), windowsHide: true });

        this.loadDefaults();
        Swordfish.locations = new Locations(Swordfish.path.join(app.getPath('appData'), app.name, 'locations.json'));
        Swordfish.sizes = new Sizes(Swordfish.path.join(app.getPath('appData'), app.name, 'sizes.json'));

        Swordfish.loadPreferences();

        app.on('ready', () => {
            Swordfish.createWindow();
            let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'index.html');
            let fileUrl: URL = new URL('file://' + filePath);
            Swordfish.mainWindow.loadURL(fileUrl.href);
            Swordfish.mainWindow.on('resize', () => {
                this.saveDefaults();
            });
            Swordfish.mainWindow.on('move', () => {
                this.saveDefaults();
            });
            Swordfish.mainWindow.once('ready-to-show', () => {
                Swordfish.mainWindow.setBounds(Swordfish.currentDefaults);
                Swordfish.mainWindow.show();
                Swordfish.startup();
            });
        });

        app.on('before-quit', (event: Electron.Event) => {
            if (!this.ls.killed) {
                event.preventDefault();
                this.stopServer();
            }
        });

        app.on('quit', () => {
            app.quit();
        });

        app.on('window-all-closed', () => {
            app.quit();
        });

        nativeTheme.on('updated', () => {
            let oldCss: string = Swordfish.currentCss;
            let dark: string = 'file://' + Swordfish.path.join(app.getAppPath(), 'css', 'dark.css');
            let light: string = 'file://' + Swordfish.path.join(app.getAppPath(), 'css', 'light.css');
            let highcontrast: string = 'file://' + Swordfish.path.join(app.getAppPath(), 'css', 'highcontrast.css');
            if (Swordfish.currentPreferences.theme === 'system') {
                if (nativeTheme.shouldUseDarkColors) {
                    Swordfish.currentCss = dark;
                } else {
                    Swordfish.currentCss = light;
                }
                if (nativeTheme.shouldUseHighContrastColors) {
                    Swordfish.currentCss = highcontrast;
                }
                let windows: BrowserWindow[] = BrowserWindow.getAllWindows();
                for (let window of windows) {
                    window.webContents.send('set-theme', Swordfish.currentCss);
                }
            }
            if ((oldCss === dark || oldCss === light) && Swordfish.currentCss === highcontrast) {
                Swordfish.deleteAllTags('#003e66;', '#ffffff');
            }
            if ((oldCss === highcontrast) && (Swordfish.currentCss === dark || Swordfish.currentCss === light)) {
                Swordfish.deleteAllTags('#009688', '#ffffff');
            }
        });
        ipcMain.on('get-rows-page', (event: IpcMainEvent) => {
            event.sender.send('set-rows-page', Swordfish.currentPreferences.pageRows);
        });
        ipcMain.on('get-projects', (event: IpcMainEvent) => {
            Swordfish.getProjects(event);
        });
        ipcMain.on('get-memories', (event: IpcMainEvent) => {
            Swordfish.getMemories(event);
        });
        ipcMain.on('show-add-file', () => {
            Swordfish.addFile();
        });
        ipcMain.on('show-add-project', () => {
            Swordfish.showAddProject();
        });
        ipcMain.on('show-edit-project', (event: IpcMainEvent, project: Project) => {
            Swordfish.showEditProject(project);
        });
        ipcMain.on('export-translations', (event: IpcMainEvent, arg: any) => {
            Swordfish.exportProjectTranslations(arg);
        });
        ipcMain.on('export-open-project', (event: IpcMainEvent, arg: any) => {
            Swordfish.exportOpenProject(arg);
        });
        ipcMain.on('get-theme', (event: IpcMainEvent) => {
            event.sender.send('set-theme', Swordfish.currentCss);
        });
        ipcMain.on('set-height', (event: IpcMainEvent, arg: { window: string, width: number, height: number }) => {
            Swordfish.setHeight(arg);
        });
        ipcMain.on('close-serverSettings', () => {
            Swordfish.serverSettingsWindow.close();
        });
        ipcMain.on('browse-server', (event: IpcMainEvent, arg: any) => {
            Swordfish.connectToServer(arg);
        });
        ipcMain.on('get-databases', (event: IpcMainEvent) => {
            event.sender.send('set-databases', Swordfish.remoteTmParams);
        });
        ipcMain.on('show-server-settings', (event: IpcMainEvent, arg: any) => {
            Swordfish.showServerSettings(arg.type);
        });
        ipcMain.on('close-browseServer', () => {
            Swordfish.browseDatabasesWindow.close();
        });
        ipcMain.on('add-databases', (event: IpcMainEvent, arg: any) => {
            Swordfish.addDatabases(arg);
        });
        ipcMain.on('close-licenses', () => {
            Swordfish.licensesWindow.close();
        });
        ipcMain.on('save-preferences', (event: IpcMainEvent, arg: Preferences) => {
            Swordfish.savePreferences(arg);
        });
        ipcMain.on('save-languages', (event: IpcMainEvent, arg: any) => {
            Swordfish.savelanguages(arg);
        });
        ipcMain.on('close-addProject', () => {
            Swordfish.addProjectWindow.close();
        });
        ipcMain.on('close-editProject', () => {
            Swordfish.editProjectWindow.close();
        });
        ipcMain.on('close-addFile', () => {
            Swordfish.addFileWindow.close();
        });
        ipcMain.on('close-go-to', () => {
            if (Swordfish.goToWindow && !Swordfish.goToWindow.isDestroyed()) {
                Swordfish.goToWindow.close();
            }
        });
        ipcMain.on('go-to-segment', (event: IpcMainEvent, seg: number) => {
            Swordfish.mainWindow.focus();
            Swordfish.mainWindow.webContents.send('open-segment', seg);
        });
        ipcMain.on('get-project-param', (event: IpcMainEvent) => {
            Swordfish.projectParam ? event.sender.send('set-project', Swordfish.projectParam) : event.preventDefault();
        });
        ipcMain.on('close-replaceText', () => {
            Swordfish.replaceTextWindow.close();
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
        ipcMain.on('get-svg', (event: IpcMainEvent, svgName: string) => {
            event.sender.send('set-svg', Swordfish.getSvgIcon(svgName));
        });
        ipcMain.on('get-projects-svg', (event: IpcMainEvent, svgName: string) => {
            event.sender.send('set-projects-svg', Swordfish.getSvgIcon(svgName));
        });
        ipcMain.on('get-memories-svg', (event: IpcMainEvent, svgName: string) => {
            event.sender.send('set-memories-svg', Swordfish.getSvgIcon(svgName));
        });
        ipcMain.on('get-glossaries-svg', (event: IpcMainEvent, svgName: string) => {
            event.sender.send('set-glossaries-svg', Swordfish.getSvgIcon(svgName));
        });
        ipcMain.on('select-source-files', (event: IpcMainEvent) => {
            this.selectSourceFiles(event);
        });
        ipcMain.on('close-about', () => {
            Swordfish.aboutWindow.close();
        });
        ipcMain.on('system-info-clicked', () => {
            Swordfish.showSystemInfo();
        });
        ipcMain.on('close-systemInfo', () => {
            Swordfish.systemInfoWindow.close();
        });
        ipcMain.on('get-system-info', (event: IpcMainEvent) => {
            Swordfish.getSystemInformation(event);
        });
        ipcMain.on('licenses-clicked', () => {
            Swordfish.showLicenses({ from: 'about' });
        });
        ipcMain.on('get-source-files', (event: IpcMainEvent) => {
            Swordfish.getSelectedFiles(event);
        });
        ipcMain.on('get-project-data', (event: IpcMainEvent) => {
            event.sender.send('project-data', Swordfish.editedProject);
        });
        ipcMain.on('update-project', (event: IpcMainEvent, arg: any) => {
            Swordfish.updateProject(arg);
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
        ipcMain.on('close-addMemory', () => {
            Swordfish.addMemoryWindow.close();
        });
        ipcMain.on('add-memory', (event: IpcMainEvent, arg: any) => {
            Swordfish.addMemory(arg);
        });
        ipcMain.on('show-add-glossary', () => {
            Swordfish.showAddGlossary();
        });
        ipcMain.on('add-glossary', (event: IpcMainEvent, arg: any) => {
            Swordfish.addGlossary(arg);
        });
        ipcMain.on('close-addGlossary', () => {
            Swordfish.addGlossaryWindow.close();
        });
        ipcMain.on('get-glossaries', (event: IpcMainEvent) => {
            Swordfish.getGlossaries(event);
        });
        ipcMain.on('remove-glossaries', (event: IpcMainEvent, arg: any) => {
            Swordfish.removeGlossaries(arg);
        });
        ipcMain.on('show-add-term', (event: IpcMainEvent, glossary: string) => {
            Swordfish.showAddTerm(glossary);
        });
        ipcMain.on('close-addTerm', () => {
            Swordfish.addTermWindow.close();
        });
        ipcMain.on('add-to-glossary', (event: IpcMainEvent, arg: { glossary: string, sourceTerm: string, targetTerm: string, srcLang: string, tgtLang: string }) => {
            Swordfish.addToGlossary(arg);
        });
        ipcMain.on('show-import-tmx', (event: IpcMainEvent, arg: any) => {
            Swordfish.showImportTMX(arg);
        });
        ipcMain.on('get-memory-param', (event: IpcMainEvent) => {
            Swordfish.memoryParam ? event.sender.send('set-memory', Swordfish.memoryParam) : event.preventDefault();
        });
        ipcMain.on('show-import-glossary', (event: IpcMainEvent, arg: any) => {
            Swordfish.showImportGlossary(arg);
        });
        ipcMain.on('get-glossary-param', (event: IpcMainEvent) => {
            event.sender.send('set-glossary', Swordfish.selectedGlossary);
        });
        ipcMain.on('get-glossary-file', (event: IpcMainEvent) => {
            Swordfish.getGlossaryFile(event);
        });
        ipcMain.on('import-glossary-file', (event: IpcMainEvent, arg: any) => {
            Swordfish.importGlossaryFile(arg);
        });
        ipcMain.on('export-glossaries', (event: IpcMainEvent, arg: any) => {
            Swordfish.exportGlossaries(arg);
        });
        ipcMain.on('close-importGlossary', () => {
            Swordfish.importGlossaryWindow.close();
        });
        ipcMain.on('close-importTmx', () => {
            Swordfish.importTmxWindow.close();
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
        ipcMain.on('concordance-search', (event: IpcMainEvent, memories: string[]) => {
            Swordfish.showConcordanceWindow(memories);
        });
        ipcMain.on('get-concordance-memories', (event: IpcMainEvent) => {
            event.sender.send('set-concordance-memories', Swordfish.concordanceMemories);
        });
        ipcMain.on('close-concordanceSearch', () => {
            Swordfish.concordanceSearchWindow.close();
        });
        ipcMain.on('get-concordance', (event: IpcMainEvent, arg: any) => {
            Swordfish.concordanceSearch(event, arg);
        });
        ipcMain.on('get-selection', (event: IpcMainEvent) => {
            Swordfish.selectionRequest = event;
            Swordfish.mainWindow.webContents.send('get-selected-text');
        });
        ipcMain.on('selected-text', (event: IpcMainEvent, arg: { selected: string, lang?: string, srcLang: string, tgtLang: string }) => {
            Swordfish.selectionRequest.sender.send('set-selected-text', arg);
        });
        ipcMain.on('get-html-content', (event: IpcMainEvent) => {
            event.sender.send('set-content', Swordfish.htmlContent);
        });
        ipcMain.on('get-html-title', (event: IpcMainEvent) => {
            event.sender.send('set-title', Swordfish.htmlTitle);
        });
        ipcMain.on('get-html-id', (event: IpcMainEvent) => {
            event.sender.send('set-id', Swordfish.htmlId);
        });
        ipcMain.on('close-htmlViewer', (event: IpcMainEvent, id: number) => {
            BrowserWindow.fromId(id)?.close();
        });
        ipcMain.on('get-clients', (event: IpcMainEvent) => {
            this.getClients(event);
        });
        ipcMain.on('show-term-search', (event: IpcMainEvent, arg: any) => {
            Swordfish.showTermSearch(arg);
        });
        ipcMain.on('search-iate', () => {
            Swordfish.showIatePlugin();
        });
        ipcMain.on('close-iatePlugin', () => {
            Swordfish.iatePluginWindow.close();
        });
        ipcMain.on('close-termSearch', () => {
            Swordfish.termSearchWindow.close();
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
        ipcMain.on('get-home', (event: IpcMainEvent) => {
            event.sender.send('set-home', app.getPath('home'));
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
        ipcMain.on('close-preferences', () => {
            Swordfish.preferencesWindow.close();
        });
        ipcMain.on('close-defaultLangs', () => {
            Swordfish.defaultLangsWindow.close();
        });
        ipcMain.on('get-preferences', (event: IpcMainEvent) => {
            event.sender.send('set-preferences', Swordfish.currentPreferences);
        });
        ipcMain.on('preferences-set', () => {
            Swordfish.preferencesWindow.show();
            Swordfish.mainWindow.webContents.send('end-waiting');
        });
        ipcMain.on('browse-projects', (event: IpcMainEvent) => {
            this.browseProjects(event);
        });
        ipcMain.on('browse-memories', (event: IpcMainEvent) => {
            this.browseMemories(event);
        });
        ipcMain.on('browse-glossaries', (event: IpcMainEvent) => {
            this.browseGlossaries(event);
        });
        ipcMain.on('browse-srx', (event: IpcMainEvent) => {
            this.browseSRX(event);
        });
        ipcMain.on('browse-catalog', (event: IpcMainEvent) => {
            this.browseCatalog(event);
        });
        ipcMain.on('browse-review-model', (event: IpcMainEvent) => {
            this.browseReviewModel(event);
        });
        ipcMain.on('get-mt-languages', (event: IpcMainEvent) => {
            this.getMtLanguages(event);
        });
        ipcMain.on('open-license', (event: IpcMainEvent, type: string) => {
            Swordfish.openLicense(type);
        });
        ipcMain.on('get-message-param', (event: IpcMainEvent) => {
            event.sender.send('set-message', Swordfish.messageParam);
        });
        ipcMain.on('show-message', (event: IpcMainEvent, arg: any) => {
            Swordfish.showMessage(arg);
        });
        ipcMain.on('show-notification', (event: IpcMainEvent, message: string) => {
            Swordfish.showNotification(message);
        });
        ipcMain.on('add-tab', (event: IpcMainEvent, arg: Project) => {
            Swordfish.mainWindow.webContents.send('add-tab', arg);
        });
        ipcMain.on('get-segments-count', (event: IpcMainEvent, arg: any) => {
            Swordfish.getSegmenstCount(event, arg);
        });
        ipcMain.on('get-segments', (event: IpcMainEvent, arg: any) => {
            Swordfish.getSegments(event, arg);
        });
        ipcMain.on('get-project-files', (event: IpcMainEvent, projectId: string) => {
            Swordfish.getProjectFiles(projectId);
        });
        ipcMain.on('goto-file', (event: IpcMainEvent, arg: { project: string, file: string }) => {
            Swordfish.goToFile(arg);
        });
        ipcMain.on('paste-text', (event: IpcMainEvent, text: string) => {
            clipboard.writeText(text);
            Swordfish.mainWindow.webContents.paste();
        });
        ipcMain.on('save-translation', (event: IpcMainEvent, arg: any) => {
            Swordfish.saveTranslation(arg);
        });
        ipcMain.on('save-source', (event: IpcMainEvent, arg: any) => {
            Swordfish.saveSource(arg);
        });
        ipcMain.on('fix-segment-tags', (event: IpcMainEvent, arg: any) => {
            Swordfish.fixTags(arg);
        });
        ipcMain.on('open-prompt', (event: IpcMainEvent, arg: any) => {
            Swordfish.openPrompt(arg);
        });
        ipcMain.on('generate-prompt', (event: IpcMainEvent, arg: any) => {
            Swordfish.generatePrompt(arg);
        });
        ipcMain.on('paste-response', () => {
            Swordfish.insertAiResponse();
        });
        ipcMain.on('insert-response', (event: IpcMainEvent, arg: any) => {
            Swordfish.insertResponse(arg);
        });
        ipcMain.on('close-promptDialog', () => {
            if (Swordfish.promptWindow) {
                Swordfish.promptWindow.close();
            }
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
        ipcMain.on('assemble-matches', (event: IpcMainEvent, arg: any) => {
            Swordfish.assembleMatches(arg);
        });
        ipcMain.on('assemble-matches-all', (event: IpcMainEvent, arg: any) => {
            Swordfish.assembleMatchesAll(arg);
        });
        ipcMain.on('remove-assembled-matches', (event: IpcMainEvent, arg: any) => {
            Swordfish.removeAssembledMatches(arg);
        });
        ipcMain.on('accept-match', (event: IpcMainEvent, match: Match) => {
            Swordfish.mainWindow.webContents.send('set-target', match);
        });
        ipcMain.on('fix-match', (event: IpcMainEvent, match: Match) => {
            Swordfish.fixMatch(match);
        });
        ipcMain.on('get-mt-matches', () => {
            Swordfish.mainWindow.webContents.send('get-mt-matches');
        });
        ipcMain.on('get-am-matches', () => {
            Swordfish.mainWindow.webContents.send('get-am-matches');
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
        ipcMain.on('show-apply-tm', (event: IpcMainEvent, arg: any) => {
            Swordfish.showApplyTm(arg);
        });
        ipcMain.on('close-apply-tm', () => {
            Swordfish.applyTmWindow.close();
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
        ipcMain.on('close-spellingLangs', () => {
            Swordfish.spellingLangsWindow.close();
        });
        ipcMain.on('show-sort-segments', (event: IpcMainEvent, arg: any) => {
            Swordfish.showSortSegments(arg);
        });
        ipcMain.on('get-sort-params', (event: IpcMainEvent) => {
            event.sender.send('set-params', Swordfish.sortParams);
        })
        ipcMain.on('sort-options', (event: IpcMainEvent, arg: any) => {
            Swordfish.sortOptions(arg);
        });
        ipcMain.on('show-filter-segments', (event: IpcMainEvent, arg: any) => {
            Swordfish.showFilterSegments(arg);
        });
        ipcMain.on('get-filter-params', (event: IpcMainEvent) => {
            event.sender.send('set-params', Swordfish.filterParams);
        })
        ipcMain.on('filter-options', (event: IpcMainEvent, arg: any) => {
            Swordfish.filterOptions(arg);
        });
        ipcMain.on('export-xliff-review', (event: IpcMainEvent, arg: any) => {
            Swordfish.exportXLIFF(arg);
        });
        ipcMain.on('export-xliff', (event: IpcMainEvent, arg: any) => {
            Swordfish.exportProject(arg);
        });
        ipcMain.on('export-tmx-file', (event: IpcMainEvent, arg: any) => {
            Swordfish.exportProjectTMX(arg);
        });
        ipcMain.on('export-tm-matches', (event: IpcMainEvent, arg: any) => {
            Swordfish.exportMatches(arg);
        });
        ipcMain.on('export-terms', (event: IpcMainEvent, arg: any) => {
            Swordfish.exportTerms(arg);
        });
        ipcMain.on('import-xliff-review', (event: IpcMainEvent, arg: any) => {
            Swordfish.importReviewedXLIFF();
        });
        ipcMain.on('import-xliff', () => {
            Swordfish.showImportXliff();
        });
        ipcMain.on('close-importXliff', () => {
            Swordfish.importXliffWindow.close();
        });
        ipcMain.on('browse-xliff-import', (event: IpcMainEvent) => {
            Swordfish.browseXLIFF(event);
        });
        ipcMain.on('import-xliff-file', (event: IpcMainEvent, arg: any) => {
            Swordfish.importXLIFF(arg);
        });
        ipcMain.on('files-dropped', (event: IpcMainEvent, files: string[]) => {
            Swordfish.filesDropped(files);
        });
        ipcMain.on('remove-translations', (event: IpcMainEvent, arg: any) => {
            Swordfish.removeTranslations(arg);
        });
        ipcMain.on('remove-all-matches', (event: IpcMainEvent, arg: any) => {
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
            Swordfish.mainWindow.focus();
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
        ipcMain.on('unlock-all', (event: IpcMainEvent, projectId: string) => {
            Swordfish.unlockAll(projectId);
        });
        ipcMain.on('get-zoom', () => {
            Swordfish.mainWindow.webContents.send('set-zoom', { zoom: Swordfish.currentPreferences.zoomFactor });
        });
        ipcMain.on('analyze-spaces', (event: IpcMainEvent, projectId: string) => {
            Swordfish.analyzeSpaces(projectId);
        });
        ipcMain.on('analyze-tags', (event: IpcMainEvent, projectId: string) => {
            Swordfish.analyzeTags(projectId);
        });
        ipcMain.on('export-project-html', (event: IpcMainEvent, arg: any) => {
            Swordfish.exportHTML(arg);
        });
        ipcMain.on('show-change-case', () => {
            Swordfish.showChangeCase();
        });
        ipcMain.on('close-change-case', () => {
            Swordfish.changeCaseWindow.close();
        });
        ipcMain.on('change-case-to', (event: IpcMainEvent, arg: any) => {
            Swordfish.changeCaseTo(arg);
        });
        ipcMain.on('split-at', (event: IpcMainEvent, arg: any) => {
            Swordfish.splitSegment(arg);
        });
        ipcMain.on('merge-at', (event: IpcMainEvent, arg: any) => {
            Swordfish.mergeSegment(arg);
        });
        ipcMain.on('show-notes', (event: IpcMainEvent, segment: FullId) => {
            Swordfish.showNotes(segment);
        });
        ipcMain.on('close-notes', () => {
            if (Swordfish.notesWindow && !Swordfish.notesWindow.isDestroyed()) {
                Swordfish.notesWindow.close();
            }
        });
        ipcMain.on('show-add-note', (event: IpcMainEvent, segmentId: FullId) => {
            Swordfish.showAddNote(segmentId);
        });
        ipcMain.on('show-edit-note', (event: IpcMainEvent, arg: { segmentId: FullId, noteId: string, noteText: string }) => {
            Swordfish.showEditNote(arg.segmentId, arg.noteId, arg.noteText);
        });
        ipcMain.on('close-add-note', () => {
            Swordfish.addNoteWindow.close();
        });
        ipcMain.on('add-note', (event: IpcMainEvent, arg: { segment: FullId, note: string }) => {
            Swordfish.addNote(arg.segment, arg.note);
        });
        ipcMain.on('update-note', (event: IpcMainEvent, arg: { segment: FullId, note: string, noteId: string }) => {
            Swordfish.updateNote(arg.segment, arg.note, arg.noteId);
        });
        ipcMain.on('remove-note', (event: IpcMainEvent, arg: { segmentId: FullId, noteId: string }) => {
            Swordfish.removeNote(arg.segmentId, arg.noteId);
        });
        ipcMain.on('show-file-info', (event: IpcMainEvent, fileInfo: any) => {
            Swordfish.showFileInfo(fileInfo);
        });
        ipcMain.on('close-file-info', () => {
            Swordfish.fileInfoWindow?.close();
        });
        ipcMain.on('show-metadata', (event: IpcMainEvent, metaId: MetaId) => {
            Swordfish.showReviewComments(metaId);
        });
        ipcMain.on('get-metadata', (event: IpcMainEvent, metaId: MetaId) => {
            Swordfish.getMetadata(metaId);
        });
        ipcMain.on('close-review-comments', () => {
            if (Swordfish.reviewCommentsWindow && !Swordfish.reviewCommentsWindow.isDestroyed()) {
                Swordfish.reviewCommentsWindow.close();
            }
        });
        ipcMain.on('show-add-comment', (event: IpcMainEvent, metaId: MetaId) => {
            Swordfish.showAddComment(metaId);
        });
        ipcMain.on('get-content-model', (event: IpcMainEvent, from: string) => {
            Swordfish.getContentModel(from);
        });
        ipcMain.on('save-comment', (event: IpcMainEvent, arg: { metaId: MetaId, comment: ReviewComment }) => {
            Swordfish.saveComment(arg.metaId, arg.comment);
        });
        ipcMain.on('get-username', (event: IpcMainEvent) => {
            event.sender.send('set-username', Swordfish.currentPreferences.userName);
        });
        ipcMain.on('close-add-comment', () => {
            Swordfish.addCommentWindow.close();
        });
        ipcMain.on('show-edit-comment', (event: IpcMainEvent, arg: { metaId: MetaId, comment: ReviewComment }) => {
            Swordfish.showEditComment(arg.metaId, arg.comment);
        });
        ipcMain.on('show-add-reply', (event: IpcMainEvent, arg: { metaId: MetaId, commentId: string }) => {
            Swordfish.showAddReply(arg.metaId, arg.commentId);
        });
        ipcMain.on('show-edit-reply', (event: IpcMainEvent, arg: { metaId: MetaId, reply: CommentReply }) => {
            Swordfish.showEditReply(arg.metaId, arg.reply);
        });
        ipcMain.on('close-add-reply', () => {
            Swordfish.addReplyWindow.close();
        });
        ipcMain.on('save-reply', (event: IpcMainEvent, arg: { metaId: MetaId, reply: CommentReply }) => {
            Swordfish.saveReply(arg.metaId, arg.reply);
        });
        ipcMain.on('save-metadata', (event: IpcMainEvent, arg: { metaId: MetaId, metadata: MetaData }) => {
            Swordfish.saveMetadata(arg.metaId, arg.metadata);
        });
        ipcMain.on('get-versions', (event: IpcMainEvent) => {
            event.sender.send('set-versions', { current: app.getVersion(), latest: Swordfish.latestVersion });
        });
        ipcMain.on('close-updates', () => {
            Swordfish.updatesWindow.close();
        });
        ipcMain.on('release-history', () => {
            Swordfish.showReleaseHistory();
        });
        ipcMain.on('download-latest', () => {
            Swordfish.downloadLatest();
        });
        ipcMain.on('close-getting-started', () => {
            Swordfish.gettingStartedWindow.close();
        });
        ipcMain.on('show-help', () => {
            Swordfish.showHelp();
        });
        ipcMain.on('show-support', () => {
            Swordfish.showSupportGroup();
        });
        ipcMain.on('show-getting-started', (event: IpcMainEvent, arg: any) => {
            Swordfish.currentPreferences.showGuide = arg.showGuide;
            Swordfish.savePreferences(Swordfish.currentPreferences);
        });
        ipcMain.on('get-show guide', (event: IpcMainEvent) => {
            event.sender.send('set-show guide', { showGuide: Swordfish.currentPreferences.showGuide });
        });
        ipcMain.on('get-xmlFilters', (event: IpcMainEvent) => {
            Swordfish.getXMLFilters(event);
        });
        ipcMain.on('edit-filterConfig', (event: IpcMainEvent, arg: any) => {
            Swordfish.editXmlFilter(arg);
        });
        ipcMain.on('close-filterConfig', () => {
            Swordfish.editXmlFilterWindow.close();
        });
        ipcMain.on('get-filterData', (event: IpcMainEvent) => {
            Swordfish.getXmlFilterData(event);
        });
        ipcMain.on('add-element', (event: IpcMainEvent, arg: any) => {
            Swordfish.addElement(arg);
        });
        ipcMain.on('close-elementConfig', () => {
            Swordfish.configElementWindow.close();
        });
        ipcMain.on('get-elementConfig', (event: IpcMainEvent) => {
            Swordfish.getElementConfig(event);
        });
        ipcMain.on('save-elementConfig', (event: IpcMainEvent, arg: any) => {
            Swordfish.saveElementConfig(arg);
        });
        ipcMain.on('remove-elements', (event: IpcMainEvent, arg: any) => {
            Swordfish.removeElements(arg);
        });
        ipcMain.on('import-xmlFilter', (event: IpcMainEvent) => {
            Swordfish.importXmlFilter(event);
        });
        ipcMain.on('remove-xmlFilters', (event: IpcMainEvent, arg: any) => {
            Swordfish.removeXmlFilters(event, arg);
        });
        ipcMain.on('export-xmlFilters', (event: IpcMainEvent, arg: any) => {
            Swordfish.exportXmlFilters(arg);
        });
        ipcMain.on('show-addXmlConfiguration', (event: IpcMainEvent) => {
            Swordfish.showAddXmlConfiguration(event);
        });
        ipcMain.on('close-addXmlConfiguration', () => {
            Swordfish.addXmlConfigurationWindow.close();
        });
        ipcMain.on('add-xmlConfigurationFile', (event: IpcMainEvent, arg: any) => {
            Swordfish.addXmlConfiguration(event, arg);
        });
        ipcMain.on('close-tagsAnalysis', () => {
            Swordfish.tagsAnalysisWindow.close();
        });
        ipcMain.on('get-tagsErrors', (event: IpcMainEvent) => {
            Swordfish.getTagErrors(event);
        });
        ipcMain.on('close-spaceAnalysis', () => {
            Swordfish.spaceAnalysisWindow.close();
        });
        ipcMain.on('get-spaceErrors', (event: IpcMainEvent) => {
            Swordfish.getSpaceErrors(event);
        });
        ipcMain.on('fix-spaceErrors', (event: IpcMainEvent) => {
            Swordfish.mainWindow.webContents.send('remember-segment');
            Swordfish.fixSpaceErrors(event);
        });
    } // end constructor

    static deleteAllTags(background: string, foreground: string): void {
        let tagsFolder: string = Swordfish.path.join(app.getPath('userData'), 'images');
        if (existsSync(tagsFolder)) {
            rmSync(tagsFolder, { recursive: true, force: true });
        }
        mkdirSync(tagsFolder);
        let colors: any = { background: background, foreground: foreground };
        writeFileSync(Swordfish.path.join(app.getPath('userData'), 'images', 'tagColors.json'), JSON.stringify(colors, null, 2));
        if (app.isReady()) {
            Swordfish.mainWindow.webContents.send('tags-deleted');
        }
    }

    static createWindow(): void {
        if (Swordfish.currentDefaults === undefined) {
            let size: Size = screen.getPrimaryDisplay().workAreaSize;
            Swordfish.currentDefaults = { width: Math.round(size.width * 0.95), height: Math.round(size.height * 0.95), x: 0, y: 0 };
        }
        this.mainWindow = new BrowserWindow({
            title: app.name,
            width: this.currentDefaults.width,
            height: this.currentDefaults.height,
            x: this.currentDefaults.x,
            y: this.currentDefaults.y,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            },
            show: false,
            icon: this.iconPath
        });
        this.mainWindow.webContents.on('context-menu', (event: Electron.Event, params: any) => {
            const menu: Menu = new Menu();
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
        let fileMenu: Menu = Menu.buildFromTemplate([
            { label: 'Open...', accelerator: 'CmdOrCtrl+O', click: () => { Swordfish.addFile(); } }
        ]);
        let tagsMenu: Menu = Menu.buildFromTemplate([
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
        let editMenu: Menu = Menu.buildFromTemplate([
            { label: 'Undo', accelerator: 'CmdOrCtrl+Z', click: () => { Swordfish.undo() } },
            new MenuItem({ type: 'separator' }),
            { label: 'Cut', accelerator: 'CmdOrCtrl+X', click: () => { Swordfish.cut() } },
            { label: 'Copy', accelerator: 'CmdOrCtrl+C', click: () => { Swordfish.copy(); } },
            { label: 'Paste', accelerator: 'CmdOrCtrl+V', click: () => { Swordfish.paste() } },
            { label: 'Select All', accelerator: 'CmdOrCtrl+A', click: () => { Swordfish.selectAll(); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Edit Previous Segment', accelerator: 'PageUp', click: () => { Swordfish.mainWindow.webContents.send('previous-segment'); } },
            { label: 'Edit Next Segment', accelerator: 'PageDown', click: () => { Swordfish.mainWindow.webContents.send('next-segment'); } },
            { label: 'Go To Segment...', accelerator: 'CmdOrCtrl+G', click: () => { Swordfish.mainWindow.webContents.send('go-to'); } },
            { label: 'Go To Next Segment With Same Source ', accelerator: 'CmdOrCtrl+Shift+G', click: () => { Swordfish.mainWindow.webContents.send('next-same-source'); } },//TODO
            new MenuItem({ type: 'separator' }),
            { label: 'Edit Source Text', accelerator: 'Alt+F2', click: () => { Swordfish.mainWindow.webContents.send('edit-source'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Edit Next Untranslated Segment', accelerator: 'CmdOrCtrl+U', click: () => { Swordfish.mainWindow.webContents.send('next-untranslated'); } },
            { label: 'Edit Next Unconfirmed Segment', accelerator: 'CmdOrCtrl+Shift+U', click: () => { Swordfish.mainWindow.webContents.send('next-unconfirmed'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Save Segment Changes', accelerator: 'Alt+Enter', click: () => { Swordfish.mainWindow.webContents.send('save-edit', { confirm: false, next: 'none' }); } },
            { label: 'Discard Segment Changes', accelerator: 'Esc', click: () => { Swordfish.mainWindow.webContents.send('cancel-edit'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Change Case', accelerator: 'CmdOrCtrl+Alt+C', click: () => { Swordfish.mainWindow.webContents.send('change-case'); } },
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
            { label: 'Remove All Tags', accelerator: 'CmdOrCtrl+Alt+Shift+R', click: () => { Swordfish.mainWindow.webContents.send('remove-tags'); } },
        ]);
        let nextMT: string = 'Alt+Right';
        let previousMT: string = 'Alt+Left';
        if (process.platform === 'darwin') {
            nextMT = 'Ctrl+Alt+Right';
            previousMT = 'Ctrl+Alt+Left';
        }
        let viewMenu: Menu = Menu.buildFromTemplate([
            { label: 'Projects', accelerator: 'F6', click: () => { Swordfish.viewProjects(); } },
            { label: 'Memories', accelerator: 'F7', click: () => { Swordfish.viewMemories(); } },
            { label: 'Glossaries', accelerator: 'F8', click: () => { Swordfish.viewGlossaries(); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Sort Segments', accelerator: 'F3', click: () => { Swordfish.mainWindow.webContents.send('sort-segments'); } },
            { label: 'Filter Segments', accelerator: 'CmdOrCtrl+F', click: () => { Swordfish.mainWindow.webContents.send('filter-segments'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Expand/Collapse Files Panel', accelerator: 'CmdOrCtrl+Shift+F', click: () => { Swordfish.toggleFilesPanel(); } },
            { label: 'Expand/Collapse Right Panels', accelerator: 'CmdOrCtrl+Shift+J', click: () => { Swordfish.toggleRightPanels(); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Show/Hide Notes', accelerator: 'F2', click: () => { Swordfish.toggleNotes(); } },
            { label: 'Show/Hide Review Comments', accelerator: 'Alt+F6', click: () => { Swordfish.toggleReviewComments(); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Close Selected Tab', accelerator: 'CmdOrCtrl+W', click: () => { Swordfish.closeSelectedTab(); } },
            new MenuItem({ type: 'separator' }),
            { label: 'First Page', accelerator: 'CmdOrCtrl+Shift+PageUp', click: () => { Swordfish.mainWindow.webContents.send('first-page'); } },
            { label: 'Previous Page', accelerator: 'CmdOrCtrl+PageUp', click: () => { Swordfish.mainWindow.webContents.send('previous-page'); } },
            { label: 'Next Page', accelerator: 'CmdOrCtrl+PageDown', click: () => { Swordfish.mainWindow.webContents.send('next-page'); } },
            { label: 'Last Page', accelerator: 'CmdOrCtrl+Shift+PageDown', click: () => { Swordfish.mainWindow.webContents.send('last-page'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Next Translation Memory Match', accelerator: 'CmdOrCtrl+Alt+Right', click: () => { Swordfish.mainWindow.webContents.send('next-match'); } },
            { label: 'Previous Translation Memory Match', accelerator: 'CmdOrCtrl+Alt+Left', click: () => { Swordfish.mainWindow.webContents.send('previous-match'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Next Machine Translation', accelerator: nextMT, click: () => { Swordfish.mainWindow.webContents.send('next-mt'); } },
            { label: 'Previous Machine Translation', accelerator: previousMT, click: () => { Swordfish.mainWindow.webContents.send('previous-mt'); } },
            new MenuItem({ type: 'separator' }),
            new MenuItem({ label: 'Toggle Full Screen', role: 'togglefullscreen' })
        ]);
        if (!app.isPackaged) {
            viewMenu.append(new MenuItem({ label: 'Open Development Tools', accelerator: 'F12', click: () => { BrowserWindow.getFocusedWindow()?.webContents.openDevTools() } }));
        }
        let projectsMenu: Menu = Menu.buildFromTemplate([
            { label: 'New Project', accelerator: 'CmdOrCtrl+N', click: () => { Swordfish.showAddProject(); } },
            { label: 'Edit Project', click: () => { Swordfish.editProject(); } },
            { label: 'Translate Projects', click: () => { Swordfish.translateProjects(); } },
            { label: 'Export Translations', accelerator: 'CmdOrCtrl+Alt+S', click: () => { Swordfish.mainWindow.webContents.send('export-translations'); } },
            { label: 'Export Translations as TMX File', click: () => { Swordfish.mainWindow.webContents.send('export-translations-tmx'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Export as XLIFF 2.0', click: () => { Swordfish.mainWindow.webContents.send('export-xliff-review'); } },
            { label: 'Update from XLIFF File', click: () => { Swordfish.importReviewedXLIFF() } },
            new MenuItem({ type: 'separator' }),
            { label: 'Export All Memory Matches as TMX', click: () => { Swordfish.mainWindow.webContents.send('export-matches'); } },
            { label: 'Export All Recognized Terms as TBX', click: () => { Swordfish.mainWindow.webContents.send('export-terminology-all'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Remove Projects', click: () => { Swordfish.mainWindow.webContents.send('remove-projects'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Project Statistics', click: () => { Swordfish.mainWindow.webContents.send('request-statistics'); } },
            { label: 'Export HTML', accelerator: 'F5', click: () => { Swordfish.mainWindow.webContents.send('export-html'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Import Project', click: () => { Swordfish.showImportXliff(); } },
            { label: 'Export Project', click: () => { Swordfish.mainWindow.webContents.send('export-project'); } }
        ]);
        let memoriesMenu: Menu = Menu.buildFromTemplate([
            { label: 'Add Memory', click: () => { Swordfish.showAddMemory(); } },
            { label: 'Remove Memory', click: () => { Swordfish.removeMemory(); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Add RemoteTM Memory', click: () => { Swordfish.showServerSettings('memory'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Concordance Search', accelerator: 'CmdOrCtrl+Y', click: () => { Swordfish.mainWindow.webContents.send('concordance-requested'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Import TMX File', click: () => { Swordfish.mainWindow.webContents.send('import-tmx'); } },
            { label: 'Export Memory as TMX File', click: () => { Swordfish.mainWindow.webContents.send('export-tmx'); } }
        ]);
        let glossariesMenu: Menu = Menu.buildFromTemplate([
            { label: 'Add Glossary', click: () => { Swordfish.showAddGlossary(); } },
            { label: 'Remove Glossary', click: () => { Swordfish.removeGlossary(); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Add RemoteTM Glossary', click: () => { Swordfish.showServerSettings('glossary'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Search Term in Glossary', accelerator: 'CmdOrCtrl+D', click: () => { Swordfish.mainWindow.webContents.send('term-search-requested'); } },
            { label: 'Add Term to Glossary', accelerator: 'CmdOrCtrl+B', click: () => { Swordfish.mainWindow.webContents.send('add-term-requested'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Search on IATE', accelerator: 'CmdOrCtrl+Alt+I', click: () => { Swordfish.showIatePlugin(); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Import Glossary', click: () => { Swordfish.mainWindow.webContents.send('import-glossary'); } },
            { label: 'Export Glossary', click: () => { Swordfish.mainWindow.webContents.send('export-glossary'); } }
        ]);
        let aiMenu: Menu = Menu.buildFromTemplate([
            { label: 'Fix Tags with AI', accelerator: 'CmdOrCtrl+Shift+Alt+T', click: () => { Swordfish.mainWindow.webContents.send('fix-tags'); } },
            { label: 'Fix TM Match with AI', accelerator: 'CmdOrCtrl+Shift+M', click: () => { Swordfish.mainWindow.webContents.send('fix-selected-match'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Open AI Prompt Dialog', accelerator: 'CmdOrCtrl+Shift+P', click: () => { Swordfish.mainWindow.webContents.send('open-ai-prompt'); } },
            { label: 'Copy AI Prompt to Clipboard', accelerator: 'CmdOrCtrl+Shift+C', click: () => { Swordfish.mainWindow.webContents.send('copy-ai-prompt'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Insert AI Response in Segment', accelerator: 'CmdOrCtrl+Shift+R', click: () => { Swordfish.insertAiResponse(); } }
        ]);
        let helpMenu: Menu = Menu.buildFromTemplate([
            { label: 'Swordfish User Guide', accelerator: 'F1', click: () => { this.showHelp(); } },
            { label: 'Getting Started Guide', click: () => { Swordfish.showGettingStarted(); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Check for Updates...', click: () => { this.checkUpdates(false); } },
            { label: 'View Licenses', click: () => { this.showLicenses({ from: 'menu' }); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Release History', click: () => { Swordfish.showReleaseHistory(); } },
            { label: 'Support Group', click: () => { this.showSupportGroup(); } }
        ]);
        let nextUntranslatedKey: string = 'Alt+Down';
        let nextUnconfirmedKey: string = 'Alt+Shift+Down';
        if (process.platform === 'darwin') {
            nextUntranslatedKey = 'Ctrl+Alt+Down';
            nextUnconfirmedKey = 'Ctrl+Shift+Down';
        }
        let termsMenu: Menu = Menu.buildFromTemplate([
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
        let tasksMenu: Menu = Menu.buildFromTemplate([
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
            { label: 'Get Auto-Translations', accelerator: 'CmdOrCtrl+R', click: () => { Swordfish.mainWindow.webContents.send('get-am-matches'); } },
            { label: 'Apply Auto-Translation to All Segments', click: () => { Swordfish.mainWindow.webContents.send('apply-am-all'); } },
            { label: 'Remove All Auto-Translations', click: () => { Swordfish.mainWindow.webContents.send('remove-am-all'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Get Glossary Terms', accelerator: 'CmdOrCtrl+K', click: () => { Swordfish.mainWindow.webContents.send('apply-terminology'); } },
            { label: 'Insert Selected Term', accelerator: 'CmdOrCtrl+Alt+K', click: () => { Swordfish.mainWindow.webContents.send('insert-tem', { selected: true }); } },
            { label: 'Select Previous Term', accelerator: 'CmdOrCtrl+Alt+Up', click: () => { Swordfish.mainWindow.webContents.send('select-previous-term'); } },
            { label: 'Select Next Term', accelerator: 'CmdOrCtrl+Alt+Down', click: () => { Swordfish.mainWindow.webContents.send('select-next-term'); } },
            new MenuItem({ label: 'Insert Term...', submenu: termsMenu }),
            { label: 'Get Terms for All Segments', click: () => { Swordfish.mainWindow.webContents.send('apply-terminology-all'); } }
        ]);
        let qaMenu: Menu = Menu.buildFromTemplate([
            { label: 'Check Inline Tags', accelerator: 'F9', click: () => { Swordfish.mainWindow.webContents.send('tags-analysis'); } },
            { label: 'Check Initial/Trailing Spaces', accelerator: 'F10', click: () => { Swordfish.mainWindow.webContents.send('spaces-analysis'); } }
        ]);
        let template: MenuItem[] = [
            new MenuItem({ label: '&File', role: 'fileMenu', submenu: fileMenu }),
            new MenuItem({ label: '&Edit', role: 'editMenu', submenu: editMenu }),
            new MenuItem({ label: '&View', role: 'viewMenu', submenu: viewMenu }),
            new MenuItem({ label: '&Projects', submenu: projectsMenu }),
            new MenuItem({ label: '&Memories', submenu: memoriesMenu }),
            new MenuItem({ label: '&Glossaries', submenu: glossariesMenu }),
            new MenuItem({ label: '&Tasks', submenu: tasksMenu }),
            new MenuItem({ label: '&QA', submenu: qaMenu }),
            new MenuItem({ label: '&AI', submenu: aiMenu }),
            new MenuItem({ label: '&Help', role: 'help', submenu: helpMenu })
        ];
        if (process.platform === 'darwin') {
            let appleMenu: Menu = Menu.buildFromTemplate([
                new MenuItem({ label: 'About...', click: () => { this.showAbout(); } }),
                new MenuItem({
                    label: 'Preferences...', submenu: [
                        { label: 'Settings', accelerator: 'Cmd+,', click: () => { this.showPreferences(); } }
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
            let help: MenuItem = template.pop() as MenuItem;
            template.push(new MenuItem({
                label: '&Settings', submenu: [
                    { label: 'Preferences', click: () => { this.showPreferences(); } }
                ]
            }));
            template.push(help);
        }
        if (process.platform === 'win32') {
            fileMenu.append(new MenuItem({ type: 'separator' }));
            fileMenu.append(new MenuItem({ label: 'Exit', accelerator: 'Alt+F4', role: 'quit', click: () => { app.quit(); } }));
            helpMenu.append(new MenuItem({ type: 'separator' }));
            helpMenu.append(new MenuItem({ label: 'About...', click: () => { this.showAbout(); } }));
        }
        if (process.platform === 'linux') {
            fileMenu.append(new MenuItem({ type: 'separator' }));
            fileMenu.append(new MenuItem({ label: 'Quit', accelerator: 'Ctrl+Q', role: 'quit', click: () => { app.quit(); } }));
            helpMenu.append(new MenuItem({ type: 'separator' }));
            helpMenu.append(new MenuItem({ label: 'About...', click: () => { this.showAbout(); } }));
        }
        Menu.setApplicationMenu(Menu.buildFromTemplate(template));
    }

    static undo(): void {
        let focusedWindow: BrowserWindow | null = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
            focusedWindow.webContents.undo();
        }
    }

    static cut(): void {
        let focusedWindow: BrowserWindow | null = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
            focusedWindow.webContents.cut();
        }
    }

    static copy(): void {
        let focusedWindow: BrowserWindow | null = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
            focusedWindow.webContents.copy();
        }
    }

    static paste(): void {
        let focusedWindow: BrowserWindow | null = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
            focusedWindow.webContents.paste();
        }
    }

    static selectAll(): void {
        let focusedWindow: BrowserWindow | null = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
            focusedWindow.webContents.selectAll();
        }
    }

    stopServer(): void {
        let instance: Swordfish = this;
        Swordfish.sendRequest('/', { command: 'stop' },
            (data: any) => {
                if (data.status === 'OK') {
                    instance.ls.kill();
                    app.quit();
                } else {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                }
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    loadDefaults(): void {
        let defaultsFile: string = Swordfish.path.join(app.getPath('appData'), app.name, 'defaults.json');
        if (existsSync(defaultsFile)) {
            try {
                let data: Buffer = readFileSync(defaultsFile);
                Swordfish.currentDefaults = JSON.parse(data.toString());
            } catch (err) {
                console.error(err);
            }
        }
    }

    saveDefaults(): void {
        let defaultsFile: string = Swordfish.path.join(app.getPath('appData'), app.name, 'defaults.json');
        writeFileSync(defaultsFile, JSON.stringify(Swordfish.mainWindow.getBounds(), null, 2));
    }

    static setHeight(arg: { window: string, width: number, height: number }): void {
        if ('about' === arg.window) {
            Swordfish.aboutWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('serverSettings' === arg.window) {
            Swordfish.serverSettingsWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('browseDatabases' === arg.window) {
            Swordfish.browseDatabasesWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('licenses' === arg.window) {
            Swordfish.licensesWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('addProject' === arg.window) {
            Swordfish.addProjectWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('editProject' === arg.window) {
            Swordfish.editProjectWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('addFile' === arg.window) {
            Swordfish.addFileWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('tags' === arg.window) {
            Swordfish.tagsWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('goTo' === arg.window) {
            Swordfish.goToWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('replaceText' === arg.window) {
            Swordfish.replaceTextWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('systemInfo' === arg.window) {
            Swordfish.systemInfoWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('addMemory' === arg.window) {
            Swordfish.addMemoryWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('addGlossary' === arg.window) {
            Swordfish.addGlossaryWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('addTerm' === arg.window) {
            Swordfish.addTermWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('importGlossary' === arg.window) {
            Swordfish.importGlossaryWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('importTmx' === arg.window) {
            Swordfish.importTmxWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('concordanceSearch' === arg.window) {
            Swordfish.concordanceSearchWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('termSearch' === arg.window) {
            Swordfish.termSearchWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('preferences' === arg.window) {
            Swordfish.preferencesWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('defaultLangs' === arg.window) {
            Swordfish.defaultLangsWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('applyTm' === arg.window) {
            Swordfish.applyTmWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('spellingLangs' === arg.window) {
            Swordfish.spellingLangsWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('sortSegments' === arg.window) {
            Swordfish.sortSegmentsWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('filterSegments' === arg.window) {
            Swordfish.filterSegmentsWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('importXliff' === arg.window) {
            Swordfish.importXliffWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('changeCase' === arg.window) {
            Swordfish.changeCaseWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('notes' === arg.window) {
            Swordfish.notesWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('addNote' === arg.window) {
            Swordfish.addNoteWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('updates' === arg.window) {
            Swordfish.updatesWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('gettingStarted' === arg.window) {
            Swordfish.gettingStartedWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('editXmlFilter' === arg.window) {
            Swordfish.editXmlFilterWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('configElement' === arg.window) {
            Swordfish.configElementWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('addXmlConfiguration' === arg.window) {
            Swordfish.addXmlConfigurationWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('tagsAnalysis' === arg.window) {
            Swordfish.tagsAnalysisWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('spaceAnalysis' === arg.window) {
            Swordfish.spaceAnalysisWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('promptDialog' === arg.window) {
            Swordfish.promptWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('iatePlugin' === arg.window) {
            Swordfish.iatePluginWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('reviewComments' === arg.window) {
            Swordfish.reviewCommentsWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('addComment' === arg.window) {
            Swordfish.addCommentWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('addReply' === arg.window) {
            Swordfish.addReplyWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('fileInfo' === arg.window) {
            Swordfish.fileInfoWindow.setContentSize(arg.width, arg.height, true);
        }
    }

    static loadPreferences(): void {
        let dark: string = 'file://' + Swordfish.path.join(app.getAppPath(), 'css', 'dark.css');
        let light: string = 'file://' + Swordfish.path.join(app.getAppPath(), 'css', 'light.css');
        let highContrast: string = 'file://' + Swordfish.path.join(app.getAppPath(), 'css', 'highcontrast.css');
        let preferencesFile: string = Swordfish.path.join(app.getPath('appData'), app.name, 'preferences.json');
        let oldCss: string = Swordfish.currentCss;
        if (existsSync(preferencesFile)) {
            try {
                let data: Buffer = readFileSync(preferencesFile);
                let json: Preferences = JSON.parse(data.toString());
                if (!json.hasOwnProperty('chatGpt')) {
                    json.chatGpt = { enabled: false, apiKey: '', model: 'o1-mini', fixTags: false };
                }
                if (!json.chatGpt.hasOwnProperty('fixTags')) {
                    json.chatGpt.fixTags = false;
                }
                if (!json.hasOwnProperty('anthropic')) {
                    json.anthropic = { enabled: false, apiKey: '', model: 'claude-3-5-sonnet-latest', fixTags: false };
                }
                if (!json.hasOwnProperty('caseSensitiveMatches')) {
                    json.caseSensitiveMatches = true;
                }
                if (!json.hasOwnProperty('modernmt')) {
                    json.modernmt = {
                        enabled: false,
                        apiKey: '',
                        srcLang: 'none',
                        tgtLang: 'none'
                    }
                }
                if (!json.hasOwnProperty('pageRows')) {
                    json.pageRows = 500;
                }
                if (!json.hasOwnProperty('autoConfirm')) {
                    json.autoConfirm = false;
                }
                if (!json.hasOwnProperty('userName')) {
                    json.userName = Swordfish.os.userInfo().username;
                }
                if (!json.hasOwnProperty('reviewModel')) {
                    json.reviewModel = Swordfish.path.join(app.getAppPath(), 'review', 'default.json');
                }
                Swordfish.currentPreferences = json;
                if (!Swordfish.currentPreferences.projectsFolder || !existsSync(Swordfish.currentPreferences.projectsFolder)) {
                    Swordfish.currentPreferences.projectsFolder = Swordfish.path.join(app.getPath('appData'), app.name, 'projects');
                    writeFileSync(Swordfish.path.join(app.getPath('appData'), app.name, 'preferences.json'), JSON.stringify(Swordfish.currentPreferences, null, 2));
                }
                if (!Swordfish.currentPreferences.memoriesFolder || !existsSync(Swordfish.currentPreferences.memoriesFolder)) {
                    Swordfish.currentPreferences.memoriesFolder = Swordfish.path.join(app.getPath('appData'), app.name, 'memories');
                    writeFileSync(Swordfish.path.join(app.getPath('appData'), app.name, 'preferences.json'), JSON.stringify(Swordfish.currentPreferences, null, 2));
                }
                if (!Swordfish.currentPreferences.glossariesFolder || !existsSync(Swordfish.currentPreferences.glossariesFolder)) {
                    Swordfish.currentPreferences.glossariesFolder = Swordfish.path.join(app.getPath('appData'), app.name, 'glossaries');
                    writeFileSync(Swordfish.path.join(app.getPath('appData'), app.name, 'preferences.json'), JSON.stringify(Swordfish.currentPreferences, null, 2));
                }
                if (!existsSync(Swordfish.currentPreferences.catalog)) {
                    Swordfish.currentPreferences.catalog = Swordfish.path.join(app.getAppPath(), 'catalog', 'catalog.xml');
                    writeFileSync(Swordfish.path.join(app.getPath('appData'), app.name, 'preferences.json'), JSON.stringify(Swordfish.currentPreferences, null, 2));
                }
                if (!existsSync(Swordfish.currentPreferences.srx)) {
                    Swordfish.currentPreferences.srx = Swordfish.path.join(app.getAppPath(), 'srx', 'default.srx');
                    writeFileSync(Swordfish.path.join(app.getPath('appData'), app.name, 'preferences.json'), JSON.stringify(Swordfish.currentPreferences, null, 2));
                }
                if (Swordfish.mainWindow) {
                    Swordfish.mainWindow.webContents.send('set-rows-page', Swordfish.currentPreferences.pageRows);
                }
            } catch (err) {
                console.error(err);
            }
        } else {
            writeFileSync(Swordfish.path.join(app.getPath('appData'), app.name, 'preferences.json'), JSON.stringify(Swordfish.currentPreferences, null, 2));
        }
        if (Swordfish.currentPreferences.theme === 'system') {
            if (nativeTheme.shouldUseDarkColors) {
                Swordfish.currentCss = dark;
            } else {
                Swordfish.currentCss = light;
            }
            if (nativeTheme.shouldUseHighContrastColors) {
                Swordfish.currentCss = highContrast;
            }
        }
        if (Swordfish.currentPreferences.theme === 'dark') {
            Swordfish.currentCss = dark;
        }
        if (Swordfish.currentPreferences.theme === 'light') {
            Swordfish.currentCss = light;
        }
        if (Swordfish.currentPreferences.theme === 'highcontrast') {
            Swordfish.currentCss = highContrast;
        }
        if ((oldCss === dark || oldCss === light) && Swordfish.currentCss === highContrast) {
            Swordfish.deleteAllTags('#C5E1A5', '#000000');
        }
        if (oldCss === highContrast && (Swordfish.currentCss === light || Swordfish.currentCss === dark)) {
            Swordfish.deleteAllTags('#009688', '#ffffff');
        }
        if (!Swordfish.currentPreferences.zoomFactor) {
            Swordfish.currentPreferences.zoomFactor = '1.0';
        }
        if (!Swordfish.currentPreferences.os) {
            Swordfish.currentPreferences.os = process.platform;
        }
    }

    static savePreferences(preferences: Preferences): void {
        if (Swordfish.preferencesWindow) {
            Swordfish.preferencesWindow.close();
        }
        let reloadProjects: boolean = this.currentPreferences.projectsFolder !== preferences.projectsFolder;
        let reloadMemories: boolean = this.currentPreferences.memoriesFolder !== preferences.memoriesFolder;
        let reloadGlossaries: boolean = this.currentPreferences.glossariesFolder !== preferences.glossariesFolder;
        writeFileSync(Swordfish.path.join(app.getPath('appData'), app.name, 'preferences.json'), JSON.stringify(preferences, null, 2));
        Swordfish.loadPreferences();
        Swordfish.setTheme();
        Swordfish.mainWindow.webContents.send('set-zoom', { zoom: Swordfish.currentPreferences.zoomFactor });
        if (reloadProjects) {
            Swordfish.mainWindow.webContents.send('request-projects', {});
        }
        if (reloadMemories) {
            Swordfish.mainWindow.webContents.send('request-memories');
        }
        if (reloadGlossaries) {
            Swordfish.mainWindow.webContents.send('request-glossaries');
        }
    }

    static showSortSegments(params: any): void {
        this.sortSegmentsWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: 420,
            height: 305,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        this.sortParams = params;
        this.sortSegmentsWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'sortSegments.html');
        let fileUrl: URL = new URL('file://' + filePath);
        this.sortSegmentsWindow.loadURL(fileUrl.href);
        this.sortSegmentsWindow.once('ready-to-show', () => {
            this.sortSegmentsWindow.show();
        });
        this.sortSegmentsWindow.on('close', () => {
            this.mainWindow.focus();
        });
        Swordfish.setLocation(this.sortSegmentsWindow, 'sortSegments.html');
    }

    static showFilterSegments(params: any): void {
        this.filterSegmentsWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: 480,
            height: 360,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        this.filterParams = params;
        this.filterSegmentsWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'filterSegments.html');
        let fileUrl: URL = new URL('file://' + filePath);
        this.filterSegmentsWindow.loadURL(fileUrl.href);
        this.filterSegmentsWindow.once('ready-to-show', () => {
            this.filterParams = params;
            this.filterSegmentsWindow.show();
        });
        this.filterSegmentsWindow.on('close', () => {
            this.mainWindow.focus();
        });
        Swordfish.setLocation(this.filterSegmentsWindow, 'filterSegments.html');
    }

    static viewProjects(): void {
        Swordfish.mainWindow.webContents.send('view-projects');
    }

    static closeSelectedTab(): void {
        Swordfish.mainWindow.webContents.send('close-tab');
    }

    static editProject(): void {
        Swordfish.mainWindow.webContents.send('edit-project');
    }

    static showAddProject(): void {
        this.addProjectWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: 980,
            height: 570,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        this.addProjectWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'addProject.html');
        let fileUrl: URL = new URL('file://' + filePath);
        this.addProjectWindow.loadURL(fileUrl.href);
        this.addProjectWindow.once('ready-to-show', () => {
            this.addProjectWindow.show();
        });
        this.addProjectWindow.on('close', () => {
            this.mainWindow.focus();
        });
        Swordfish.setLocation(this.addProjectWindow, 'addProject.html');
    }

    static showEditProject(project: Project): void {
        Swordfish.editedProject = project;
        this.editProjectWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: 920,
            height: 240,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        this.editProjectWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'editProject.html');
        let fileUrl: URL = new URL('file://' + filePath);
        this.editProjectWindow.loadURL(fileUrl.href);
        this.editProjectWindow.once('ready-to-show', () => {
            this.editProjectWindow.show();
        });
        this.editProjectWindow.on('close', () => {
            this.mainWindow.focus();
        });
        Swordfish.setLocation(this.editProjectWindow, 'editProject.html');
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
                console.error(error.message);
            });
        } else {
            dialog.showOpenDialog(Swordfish.mainWindow, {
                title: 'Select folder',
                properties: ['createDirectory', 'openDirectory']
            }).then((value: Electron.OpenDialogReturnValue) => {
                if (!value.canceled) {
                    Swordfish.sendRequest('/projects/translations', { project: project.id, output: value.filePaths[0] },
                        (data: any) => {
                            Swordfish.exportTranslations(data, value.filePaths[0], false);
                        }, (reason: string) => {
                            Swordfish.showMessage({ type: 'error', message: reason });
                        }
                    );
                }
            }).catch((error: Error) => {
                console.error(error.message);
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
        let intervalObject: NodeJS.Timeout = setInterval(() => {
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
                                shell.openExternal('file://' + output).catch(() => {
                                    shell.openPath(output).catch((reason: any) => {
                                        if (reason instanceof Error) {
                                            console.error(reason.message);
                                        }
                                        this.showMessage({ type: 'error', message: 'Unable to open translated file.' });
                                    });
                                });
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
                defaultPath: fileName.substring(0, fileName.lastIndexOf('.')) + '.sdlrpx',
                filters: [{ name: file.type, extensions: 'sdlrpx' }, { name: 'Any File', extensions: '*' }]
            }
        }
        let name: string = fileName.substring(0, fileName.lastIndexOf('.'));
        let extension: string = fileName.substring(fileName.lastIndexOf('.'));
        return {
            defaultPath: name + '_' + lang + extension,
            filters: [{ name: file.type, extensions: extension }, { name: 'Any File', extensions: '*' }]
        }
    }

    static addFile(): void {
        let extensions: string[] = ['inx', 'icml', 'idml', 'ditamap', 'dita', 'xml', 'html', 'htm', 'js', 'properties', 'json', 'mif', 'docx', 'xlsx', 'pptx',
            'sxw', 'sxc', 'sxi', 'sxd', 'odt', 'ods', 'odp', 'odg', 'txt', 'po', 'pot', 'rc', 'resx', 'sdlxliff', 'srt', 'svg', 'sdlppx', 'ts', 'txml', 'vsdx',
            'xlf', 'xliff', 'mqxliff', 'txlf'];
        let filters: any[] = [
            { name: 'Supported Files', extensions: extensions },
            { name: 'Any File', extensions: ['*'] }
        ];
        dialog.showOpenDialog(Swordfish.mainWindow, {
            properties: ['openFile'],
            filters: filters
        }).then((value: Electron.OpenDialogReturnValue) => {
            if (!value.canceled) {
                Swordfish.selectedFiles = value.filePaths;
                this.addFileWindow = new BrowserWindow({
                    parent: this.mainWindow,
                    width: 890,
                    height: 360,
                    minimizable: false,
                    maximizable: false,
                    resizable: false,
                    show: false,
                    icon: this.iconPath,
                    webPreferences: {
                        nodeIntegration: true,
                        contextIsolation: false
                    }
                });
                this.addFileWindow.setMenu(null);
                let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'addFile.html');
                let fileUrl: URL = new URL('file://' + filePath);
                this.addFileWindow.loadURL(fileUrl.href);
                this.addFileWindow.once('ready-to-show', () => {
                    this.addFileWindow.show();
                });
                this.addFileWindow.on('close', () => {
                    this.mainWindow.focus();
                });
                Swordfish.setLocation(this.addFileWindow, 'addFile.html');
            }
        }).catch((error: Error) => {
            console.error(error.message);
        });
    }

    static setSelectedFile(event: IpcMainEvent): void {
        if (Swordfish.selectedFiles.length > 0) {
            Swordfish.getFileType(event, Swordfish.selectedFiles);
            Swordfish.selectedFiles = [];
        } else {
            Swordfish.showMessage({ type: 'error', message: 'No file selected' });
        }
    }

    static translateProjects(): void {
        Swordfish.mainWindow.webContents.send('translate-projects');
    }

    static updateProject(data: any): void {
        Swordfish.sendRequest('/projects/update', data,
            (data: any) => {
                if (data.status === Swordfish.SUCCESS) {
                    Swordfish.mainWindow.webContents.send('request-projects', {});
                    Swordfish.editProjectWindow.close();
                } else {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                }
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static createProject(arg: any): void {
        if (arg.from === 'addProject') {
            Swordfish.addProjectWindow.close();
        }
        if (arg.from === 'addFile') {
            Swordfish.addFileWindow.close();
        }
        arg.xmlfilter = Swordfish.path.join(app.getAppPath(), 'xmlfilter');
        Swordfish.mainWindow.webContents.send('start-waiting');
        Swordfish.mainWindow.webContents.send('set-status', 'Creating project...');
        Swordfish.sendRequest('/projects/create', arg,
            (data: any) => {
                if (data.status !== Swordfish.SUCCESS) {
                    Swordfish.mainWindow.webContents.send('end-waiting');
                    Swordfish.mainWindow.webContents.send('set-status', '');
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                }
                Swordfish.currentStatus = data;
                let processId: string = data.process;
                let intervalObject: NodeJS.Timeout = setInterval(() => {
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
        let extensions: string[] = ['inx', 'icml', 'idml', 'ditamap', 'dita', 'xml', 'html', 'htm', 'js', 'properties', 'json', 'mif', 'docx', 'xlsx', 'pptx',
            'sxw', 'sxc', 'sxi', 'sxd', 'odt', 'ods', 'odp', 'odg', 'txt', 'po', 'pot', 'rc', 'resx', 'sdlxliff', 'srt', 'svg', 'sdlppx', 'ts', 'txml', 'vsdx',
            'xlf', 'xliff', 'mqxliff', 'txlf'];
        let filters: any[] = [
            { name: 'Supported Files', extensions: extensions },
            { name: 'Any File', extensions: ['*'] },
        ];
        dialog.showOpenDialog({
            properties: ['openFile', 'multiSelections'],
            filters: filters
        }).then((value: Electron.OpenDialogReturnValue) => {
            if (!value.canceled) {
                Swordfish.getFileType(event, value.filePaths);
            }
        }).catch((error: Error) => {
            console.error(error.message);
        });
    }

    static getSelectedFiles(event: IpcMainEvent): void {
        if (Swordfish.selectedFiles?.length > 0) {
            Swordfish.getFileType(event, Swordfish.selectedFiles);
            Swordfish.selectedFiles = [];
        }
    }

    static getFileType(event: IpcMainEvent, files: string[]): void {
        Swordfish.sendRequest('/services/getFileType', { files: files },
            (data: any) => {
                event.sender.send('add-source-files', data.files);
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
        let mtManager: MTManager = new MTManager(Swordfish.currentPreferences, '', '');
        event.sender.send('set-mt-languages', mtManager.getMTLanguages());
    }

    static viewMemories(): void {
        Swordfish.mainWindow.webContents.send('view-memories');
    }

    static showServerSettings(type: string): void {
        this.serverSettingsWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: 440,
            height: 240,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        this.typeParam = type;
        this.serverSettingsWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'serverSettings.html');
        let fileUrl: URL = new URL('file://' + filePath);
        this.serverSettingsWindow.loadURL(fileUrl.href);
        this.serverSettingsWindow.once('ready-to-show', () => {
            this.serverSettingsWindow.show();
        });
        this.serverSettingsWindow.on('close', () => {
            this.mainWindow.focus();
        });
        Swordfish.setLocation(this.serverSettingsWindow, 'serverSettings.html');
    }

    static showBrowseDatabases(): void {
        this.browseDatabasesWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: 635,
            height: 355,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        this.browseDatabasesWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'browseDatabases.html');
        let fileUrl: URL = new URL('file://' + filePath);
        this.browseDatabasesWindow.loadURL(fileUrl.href);
        this.browseDatabasesWindow.once('ready-to-show', () => {
            this.browseDatabasesWindow.show();
        });
        this.browseDatabasesWindow.on('close', () => {
            this.mainWindow.focus();
        });
        Swordfish.setLocation(this.browseDatabasesWindow, 'browseDatabases.html');
    }

    static connectToServer(args: any): void {
        Swordfish.sendRequest('/services/remoteDatabases', args,
            (data: any) => {
                if (data.status === Swordfish.SUCCESS) {
                    this.remoteTmParams = {};
                    this.remoteTmParams.server = args.server;
                    this.remoteTmParams.user = args.user;
                    this.remoteTmParams.password = args.password;
                    this.remoteTmParams.memories = data.memories;
                    this.remoteTmParams.type = this.typeParam;
                    this.showBrowseDatabases();
                } else {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                }
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static addDatabases(args: any): void {
        Swordfish.sendRequest('/services/addDatabases', args,
            (data: any) => {
                if (data.status === Swordfish.SUCCESS) {
                    if (args.type === 'memory') {
                        Swordfish.mainWindow.webContents.send('request-memories');
                        Swordfish.showMessage({ type: 'info', message: 'Memory added' });
                    } else {
                        Swordfish.mainWindow.webContents.send('request-glossaries');
                        Swordfish.showMessage({ type: 'info', message: 'Glossary added' });
                    }
                } else {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                }
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static showAddMemory(): void {
        this.addMemoryWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: 435,
            height: 290,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        this.addMemoryWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'addMemory.html');
        let fileUrl: URL = new URL('file://' + filePath);
        this.addMemoryWindow.loadURL(fileUrl.href);
        this.addMemoryWindow.once('ready-to-show', () => {
            this.addMemoryWindow.show();
        });
        this.addMemoryWindow.on('close', () => {
            this.mainWindow.focus();
        });
        Swordfish.setLocation(this.addMemoryWindow, 'addMemory.html');
    }

    static viewGlossaries(): void {
        Swordfish.mainWindow.webContents.send('view-glossaries');
    }

    static sendRequest(url: string, params: any, success: Function, error: Function): void {
        let options: any = {
            url: 'http://127.0.0.1:8070' + url,
            method: 'POST'
        }
        let request: ClientRequest = net.request(options);
        let responseData: string = '';
        request.setHeader('Content-Type', 'application/json');
        request.setHeader('Accept', 'application/json');
        request.on('response', (response: IncomingMessage) => {
            response.on('error', (e: Error) => {
                error(e.message);
            });
            response.on('aborted', () => {
                error('Request aborted');
            });
            response.on('end', () => {
                try {
                    let json = JSON.parse(responseData);
                    success(json);
                } catch (reason: any) {
                    error(JSON.stringify(reason));
                }
            });
            response.on('data', (chunk: Buffer) => {
                responseData += chunk.toString();
            });
        });
        request.write(JSON.stringify(params));
        request.end();
    }

    static showHelp(): void {
        shell.openExternal('file://' + this.path.join(app.getAppPath(), 'swordfish.pdf')).catch(() => {
            shell.openPath(this.path.join(app.getAppPath(), 'swordfish.pdf')).catch((reason: any) => {
                if (reason instanceof Error) {
                    console.error(reason.message);
                }
                this.showMessage({ type: 'error', message: 'Unable to open Swordfish User Guide.' });
            });
        });
    }

    static showAbout(): void {
        Swordfish.aboutWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: 360,
            height: 490,
            resizable: false,
            minimizable: false,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        Swordfish.aboutWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'about.html');
        let fileUrl: URL = new URL('file://' + filePath);
        Swordfish.aboutWindow.loadURL(fileUrl.href);
        Swordfish.aboutWindow.once('ready-to-show', () => {
            Swordfish.aboutWindow.show();
        });
        Swordfish.aboutWindow.on('close', () => {
            Swordfish.mainWindow.focus();
        });
    }

    static openLicense(type: string): void {
        let licenseFile = '';
        let title = '';
        switch (type) {
            case 'Swordfish':
            case "OpenXLIFF":
            case "XMLJava":
            case "BCP47J":
                licenseFile = 'EclipsePublicLicense1.0.html';
                title = 'Eclipse Public License 1.0';
                break;
            case "electron":
                licenseFile = 'electron.txt';
                title = 'MIT License';
                break;
            case "MapDB":
                licenseFile = 'Apache2.0.html';
                title = 'Apache 2.0';
                break;
            case "Java":
                licenseFile = 'java.html';
                title = 'GPL2 with Classpath Exception';
                break;
            case "jsoup":
                licenseFile = 'jsoup.txt';
                title = 'MIT License';
                break;
            default:
                Swordfish.showMessage({ type: 'error', message: 'Unknown license' });
                return;
        }
        let licenseWindow: BrowserWindow = new BrowserWindow({
            parent: this.licensesWindow,
            width: 680,
            height: 400,
            show: false,
            title: title,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        licenseWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'licenses', licenseFile);
        let fileUrl: URL = new URL('file://' + filePath);
        licenseWindow.loadURL(fileUrl.href);
        licenseWindow.once('ready-to-show', () => {
            licenseWindow.show();
        });
        licenseWindow.on('close', () => {
            this.licensesWindow.focus();
        });
        licenseWindow.webContents.on('did-finish-load', () => {
            let css: string = readFileSync(Swordfish.currentCss.substring('file://'.length), { encoding: 'utf8' });
            licenseWindow.webContents.insertCSS(css.toString());
        });
    }

    static showPreferences(): void {
        this.mainWindow.webContents.send('start-waiting');
        this.preferencesWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: 640,
            height: 340,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        this.preferencesWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'preferencesDialog.html');
        let fileUrl: URL = new URL('file://' + filePath);
        this.preferencesWindow.loadURL(fileUrl.href);
        this.preferencesWindow.once('ready-to-show', () => {
            let mtManager: MTManager = new MTManager(Swordfish.currentPreferences, '', '');
            this.preferencesWindow.webContents.send('set-mt-languages', mtManager.getMTLanguages());
            this.preferencesWindow.show();
        });
        this.preferencesWindow.on('close', () => {
            this.mainWindow.focus();
        });
        Swordfish.setLocation(this.preferencesWindow, 'preferencesDialog.html');
    }

    static showSystemInfo(): void {
        this.systemInfoWindow = new BrowserWindow({
            parent: Swordfish.aboutWindow,
            width: 430,
            height: 240,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        this.systemInfoWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'systemInfo.html');
        let fileUrl: URL = new URL('file://' + filePath);
        this.systemInfoWindow.loadURL(fileUrl.href);
        this.systemInfoWindow.once('ready-to-show', () => {
            this.systemInfoWindow.show();
        });
        this.systemInfoWindow.on('close', () => {
            Swordfish.aboutWindow.focus();
        });
        Swordfish.setLocation(this.systemInfoWindow, 'systemInfo.html');
    }

    static getSystemInformation(event: IpcMainEvent): void {
        this.sendRequest('/services/systemInfo', {},
            (data: any) => {
                if (data.status === Swordfish.SUCCESS) {
                    data.electron = process.versions.electron;
                    event.sender.send('set-system-info', data);
                } else {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                }
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static showLicenses(arg: any): void {
        let parent: BrowserWindow = Swordfish.mainWindow;
        if (arg.from === 'about' && Swordfish.aboutWindow) {
            parent = Swordfish.aboutWindow;
        }
        this.licensesWindow = new BrowserWindow({
            parent: parent,
            width: 425,
            height: 410,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        this.licensesWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'licenses.html');
        let fileUrl: URL = new URL('file://' + filePath);
        this.licensesWindow.loadURL(fileUrl.href);
        this.licensesWindow.once('ready-to-show', () => {
            this.licensesWindow.show();
        });
        this.licensesWindow.on('close', () => {
            parent.focus();
        });
        Swordfish.setLocation(this.licensesWindow, 'licenses.html');
    }

    static showReleaseHistory(): void {
        shell.openExternal('https://www.maxprograms.com/products/swfishlog.html').catch((reason: any) => {
            if (reason instanceof Error) {
                console.error(reason.message);
            }
            this.showMessage({ type: 'error', message: 'Unable to open release history.' });
        });
    }

    static showSupportGroup(): void {
        shell.openExternal('https://groups.io/g/maxprograms/').catch((reason: any) => {
            if (reason instanceof Error) {
                console.error(reason.message);
            }
            this.showMessage({ type: 'error', message: 'Unable to open support group page.' });
        });
    }

    static setTheme(): void {
        BrowserWindow.getAllWindows().forEach((win: BrowserWindow) => {
            win.webContents.send('set-theme', Swordfish.currentCss);
        });
    }

    static checkUpdates(silent: boolean): void {
        session.defaultSession.clearCache().then(() => {
            let request: Electron.ClientRequest = net.request({
                url: 'https://maxprograms.com/swordfish.json',
                session: session.defaultSession
            });
            request.on('response', (response: IncomingMessage) => {
                let responseData: string = '';
                if (response.statusCode !== 200) {
                    if (!silent) {
                        Swordfish.showMessage({
                            type: 'info',
                            message: 'Server status: ' + response.statusCode
                        });
                    }
                }
                response.on('data', (chunk: Buffer) => {
                    responseData += chunk;
                });
                response.on('end', () => {
                    try {
                        let parsedData: any = JSON.parse(responseData);
                        if (app.getVersion() !== parsedData.version) {
                            Swordfish.latestVersion = parsedData.version;
                            switch (process.platform) {
                                case 'darwin':
                                    Swordfish.downloadLink = process.arch === 'arm64' ? parsedData.arm64 : parsedData.darwin;
                                    break;
                                case 'win32':
                                    Swordfish.downloadLink = parsedData.win32;
                                    break;
                                case 'linux':
                                    Swordfish.downloadLink = parsedData.linux;
                                    break;
                            }
                            Swordfish.updatesWindow = new BrowserWindow({
                                parent: this.mainWindow,
                                width: 560,
                                height: 240,
                                minimizable: false,
                                maximizable: false,
                                resizable: false,
                                show: false,
                                icon: this.iconPath,
                                webPreferences: {
                                    nodeIntegration: true,
                                    contextIsolation: false
                                }
                            });
                            Swordfish.updatesWindow.setMenu(null);
                            let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'updates.html');
                            let fileUrl: URL = new URL('file://' + filePath);
                            Swordfish.updatesWindow.loadURL(fileUrl.href);
                            Swordfish.updatesWindow.once('ready-to-show', () => {
                                Swordfish.updatesWindow.show();
                            });
                            this.updatesWindow.on('close', () => {
                                this.mainWindow.focus();
                            });
                        } else if (!silent) {
                            Swordfish.showMessage({
                                type: 'info',
                                message: 'There are currently no updates available'
                            });
                        }
                    } catch (reason: any) {
                        if (!silent) {
                            Swordfish.showMessage({
                                type: 'error',
                                message: reason.message
                            });
                        }
                    }
                });
            });
            request.on('error', (error: Error) => {
                if (!silent) {
                    Swordfish.showMessage({
                        type: 'error',
                        message: error.message
                    });
                }
            });
            request.end();
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
            console.error(error.message);
        });
    }

    browseReviewModel(event: IpcMainEvent): void {
        dialog.showOpenDialog({
            title: 'Review Model',
            defaultPath: Swordfish.currentPreferences.reviewModel,
            properties: ['openFile'],
            filters: [
                { name: 'JSON File', extensions: ['json'] },
                { name: 'Any File', extensions: ['*'] }
            ]
        }).then((value: Electron.OpenDialogReturnValue) => {
            if (!value.canceled) {
                event.sender.send('set-review-model', value.filePaths[0]);
            }
        }).catch((error: Error) => {
            console.error(error.message);
        });
    }

    browseProjects(event: IpcMainEvent): void {
        dialog.showOpenDialog({
            title: 'Projects Folder',
            defaultPath: Swordfish.currentPreferences.projectsFolder,
            properties: ['openDirectory', 'createDirectory']
        }).then((value: Electron.OpenDialogReturnValue) => {
            if (!value.canceled) {
                event.sender.send('set-projects-folder', value.filePaths[0]);
            }
        }).catch((error: Error) => {
            console.error(error.message);
        });
    }

    browseMemories(event: IpcMainEvent): void {
        dialog.showOpenDialog({
            title: 'Memories Folder',
            defaultPath: Swordfish.currentPreferences.memoriesFolder,
            properties: ['openDirectory', 'createDirectory']
        }).then((value: Electron.OpenDialogReturnValue) => {
            if (!value.canceled) {
                event.sender.send('set-memories-folder', value.filePaths[0]);
            }
        }).catch((error: Error) => {
            console.error(error.message);
        });
    }

    browseGlossaries(event: IpcMainEvent): void {
        dialog.showOpenDialog({
            title: 'Glossaries Folder',
            defaultPath: Swordfish.currentPreferences.glossariesFolder,
            properties: ['openDirectory', 'createDirectory']
        }).then((value: Electron.OpenDialogReturnValue) => {
            if (!value.canceled) {
                event.sender.send('set-glossaries-folder', value.filePaths[0]);
            }
        }).catch((error: Error) => {
            console.error(error.message);
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
            console.error(error.message);
        });
    }

    static getDefaultLanguages(): void {
        this.defaultLangsWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: 600,
            height: 190,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        this.defaultLangsWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'defaultLangs.html');
        let fileUrl: URL = new URL('file://' + filePath);
        this.defaultLangsWindow.loadURL(fileUrl.href);
        this.defaultLangsWindow.once('ready-to-show', () => {
            this.defaultLangsWindow.show();
        });
        this.defaultLangsWindow.on('close', () => {
            this.mainWindow.focus();
        });
        Swordfish.setLocation(this.defaultLangsWindow, 'defaultLangs.html');
    }

    static savelanguages(arg: any): void {
        this.defaultLangsWindow.close();
        this.currentPreferences.srcLang = arg.srcLang;
        this.currentPreferences.tgtLang = arg.tgtLang;
        writeFileSync(Swordfish.path.join(app.getPath('appData'), app.name, 'preferences.json'), JSON.stringify(this.currentPreferences, null, 2));
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

    static getSegments(event: IpcMainEvent, arg: any): void {
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

    static getProjectFiles(projectId: string): void {
        Swordfish.sendRequest('/projects/getFiles', { project: projectId },
            (data: any) => {
                if (data.status === Swordfish.SUCCESS) {
                    Swordfish.mainWindow.webContents.send('set-project-files', data.files);
                } else {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                }
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static removeProjects(arg: any): void {
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
        Swordfish.addMemoryWindow.close();
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
        Swordfish.addGlossaryWindow.close();
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
            height: 290,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        this.memoryParam = memory;
        this.importTmxWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'importTmx.html');
        let fileUrl: URL = new URL('file://' + filePath);
        this.importTmxWindow.loadURL(fileUrl.href);
        this.importTmxWindow.once('ready-to-show', () => {
            this.importTmxWindow.show();
        });
        this.importTmxWindow.on('close', () => {
            this.mainWindow.focus();
        });
        Swordfish.setLocation(this.importTmxWindow, 'importTmx.html');
    }

    static showImportGlossary(glossary: string): void {
        this.importGlossaryWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: 600,
            height: 290,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        this.selectedGlossary = glossary;
        this.importGlossaryWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'importGlossary.html');
        let fileUrl: URL = new URL('file://' + filePath);
        this.importGlossaryWindow.loadURL(fileUrl.href);
        this.importGlossaryWindow.once('ready-to-show', () => {
            this.importGlossaryWindow.show();
        });
        this.importGlossaryWindow.on('close', () => {
            this.mainWindow.focus();
        });
        Swordfish.setLocation(this.importGlossaryWindow, 'importGlossary.html');
    }

    static importTmxFile(arg: any): void {
        Swordfish.importTmxWindow.close();
        Swordfish.mainWindow.webContents.send('start-waiting');
        Swordfish.mainWindow.webContents.send('set-status', 'Importing TMX File');
        Swordfish.sendRequest('/memories/import', arg,
            (data: any) => {
                if (data.status !== Swordfish.SUCCESS) {
                    Swordfish.mainWindow.webContents.send('end-waiting');
                    Swordfish.mainWindow.webContents.send('set-status', '');
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                }
                Swordfish.currentStatus = data;
                let processId: string = data.process;
                let intervalObject: NodeJS.Timeout = setInterval(() => {
                    if (Swordfish.currentStatus.imported) {
                        Swordfish.mainWindow.webContents.send('set-status', 'Imported ' + Swordfish.currentStatus.imported + ' units');
                    }
                    if (Swordfish.currentStatus.status === Swordfish.SUCCESS) {
                        if (Swordfish.currentStatus.progress === Swordfish.COMPLETED) {
                            Swordfish.mainWindow.webContents.send('end-waiting');
                            Swordfish.mainWindow.webContents.send('set-status', '');
                            clearInterval(intervalObject);
                            Swordfish.showMessage({ type: 'info', message: 'Imported ' + Swordfish.currentStatus.imported + ' segments.' });
                            return;
                        }
                    }
                    if (Swordfish.currentStatus.status === Swordfish.ERROR) {
                        Swordfish.mainWindow.webContents.send('end-waiting');
                        Swordfish.mainWindow.webContents.send('set-status', '');
                        clearInterval(intervalObject);
                        Swordfish.showMessage({ type: 'error', message: Swordfish.currentStatus.reason });
                        return;
                    }
                    Swordfish.getMemoriesProgress(processId);
                }, 2500);
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
        dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: 'TMX File', extensions: ['tmx'] },
                { name: 'Any File', extensions: ['*'] }
            ]
        }).then((value: Electron.OpenDialogReturnValue) => {
            if (!value.canceled) {
                event.sender.send('set-tmx-file', value.filePaths[0]);
            }
        });
    }

    static getGlossaryFile(event: IpcMainEvent): void {
        dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: 'TMX/TBX File', extensions: ['tmx', 'tbx'] },
                { name: 'Any File', extensions: ['*'] }
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

    static removeMemories(arg: string[]): void {
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
                        let intervalObject: NodeJS.Timeout = setInterval(() => {
                            if (Swordfish.currentStatus.status === Swordfish.SUCCESS) {
                                if (Swordfish.currentStatus.progress === Swordfish.COMPLETED) {
                                    Swordfish.mainWindow.webContents.send('end-waiting');
                                    Swordfish.mainWindow.webContents.send('set-status', '');
                                    clearInterval(intervalObject);
                                    Swordfish.mainWindow.webContents.send('request-memories');
                                    return;
                                }
                            }
                            if (Swordfish.currentStatus.status === Swordfish.ERROR) {
                                Swordfish.mainWindow.webContents.send('end-waiting');
                                Swordfish.mainWindow.webContents.send('set-status', '');
                                clearInterval(intervalObject);
                                Swordfish.showMessage({ type: 'error', message: Swordfish.currentStatus.reason });
                                return;
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

    static removeGlossaries(arg: string[]): void {
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
                        let intervalObject: NodeJS.Timeout = setInterval(() => {
                            if (Swordfish.currentStatus.status === Swordfish.SUCCESS) {
                                if (Swordfish.currentStatus.progress === Swordfish.COMPLETED) {
                                    Swordfish.mainWindow.webContents.send('end-waiting');
                                    Swordfish.mainWindow.webContents.send('set-status', '');
                                    clearInterval(intervalObject);
                                    Swordfish.mainWindow.webContents.send('request-glossaries');
                                    return;
                                }
                            }
                            if (Swordfish.currentStatus.status === Swordfish.ERROR) {
                                Swordfish.mainWindow.webContents.send('end-waiting');
                                Swordfish.mainWindow.webContents.send('set-status', '');
                                clearInterval(intervalObject);
                                Swordfish.showMessage({ type: 'error', message: Swordfish.currentStatus.reason });
                                return;
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
                            let intervalObject: NodeJS.Timeout = setInterval(() => {
                                if (Swordfish.currentStatus.status === Swordfish.SUCCESS) {
                                    if (Swordfish.currentStatus.progress === Swordfish.COMPLETED) {
                                        Swordfish.mainWindow.webContents.send('end-waiting');
                                        Swordfish.mainWindow.webContents.send('set-status', '');
                                        Swordfish.showMessage({ type: 'info', message: 'Memories exported' });
                                        clearInterval(intervalObject);
                                        return;
                                    }
                                }
                                if (Swordfish.currentStatus.status === Swordfish.ERROR) {
                                    Swordfish.mainWindow.webContents.send('end-waiting');
                                    Swordfish.mainWindow.webContents.send('set-status', '');
                                    clearInterval(intervalObject);
                                    Swordfish.showMessage({ type: 'error', message: Swordfish.currentStatus.reason });
                                    return;
                                }
                                Swordfish.getMemoriesProgress(processId);
                            }, 500);
                        }, (reason: string) => {
                            Swordfish.showMessage({ type: 'error', message: reason });
                        }
                    );
                }
            }).catch((error: Error) => {
                console.error(error.message);
            });
        } else {
            Swordfish.showMessage({ type: 'warning', message: 'Select one memory' });
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
                            let intervalObject: NodeJS.Timeout = setInterval(() => {
                                if (Swordfish.currentStatus.status === Swordfish.SUCCESS) {
                                    if (Swordfish.currentStatus.progress === Swordfish.COMPLETED) {
                                        Swordfish.mainWindow.webContents.send('end-waiting');
                                        Swordfish.mainWindow.webContents.send('set-status', '');
                                        clearInterval(intervalObject);
                                        Swordfish.showMessage({ type: 'info', message: 'Glossaries exported' });
                                        return;
                                    }
                                }
                                if (Swordfish.currentStatus.status === Swordfish.ERROR) {
                                    Swordfish.mainWindow.webContents.send('end-waiting');
                                    Swordfish.mainWindow.webContents.send('set-status', '');
                                    clearInterval(intervalObject);
                                    Swordfish.showMessage({ type: 'error', message: Swordfish.currentStatus.reason });
                                    return;
                                }
                                Swordfish.getGlossariesProgress(processId);
                            }, 500);
                        }, (reason: string) => {
                            Swordfish.showMessage({ type: 'error', message: reason });
                        }
                    );
                }
            }).catch((error: Error) => {
                console.error(error.message);
            });
        } else {
            Swordfish.showMessage({ type: 'warning', message: 'Select one glossary' });
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
                if (data.tagErrors || data.spaceErrors) {
                    Swordfish.mainWindow.webContents.send('set-errors', {
                        project: arg.project,
                        file: arg.file,
                        unit: arg.unit,
                        segment: arg.segment,
                        tagErrors: data.tagErrors,
                        spaceErrors: data.spaceErrors,
                        hasNotes: data.hasNotes,
                        hasMetadata: data.hasMetadata
                    });
                } else {
                    Swordfish.mainWindow.webContents.send('clear-errors', {
                        project: arg.project,
                        file: arg.file,
                        unit: arg.unit,
                        segment: arg.segment,
                        tagErrors: data.tagErrors,
                        spaceErrors: data.spaceErrors,
                        hasNotes: data.hasNotes,
                        hasMetadata: data.hasMetadata
                    });
                }
                Swordfish.mainWindow.webContents.send('set-statistics', { project: arg.project, statistics: data.statistics });
                if (arg.translation !== data.target) {
                    Swordfish.mainWindow.webContents.send('update-target', {
                        project: arg.project,
                        file: arg.file,
                        unit: arg.unit,
                        segment: arg.segment,
                        target: data.target
                    });
                }
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static saveSource(arg: any): void {
        Swordfish.sendRequest('/projects/saveSource', arg,
            (data: any) => {
                if (data.status !== Swordfish.SUCCESS) {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                    return;
                }
                if (data.tagErrors || data.spaceErrors) {
                    Swordfish.mainWindow.webContents.send('set-errors', {
                        project: arg.project,
                        file: arg.file,
                        unit: arg.unit,
                        segment: arg.segment,
                        tagErrors: data.tagErrors,
                        spaceErrors: data.spaceErrors
                    });
                } else {
                    Swordfish.mainWindow.webContents.send('clear-errors', {
                        project: arg.project,
                        file: arg.file,
                        unit: arg.unit,
                        segment: arg.segment,
                        tagErrors: data.tagErrors,
                        spaceErrors: data.spaceErrors
                    });
                }
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static getMatches(arg: any): void {
        Swordfish.mainWindow.webContents.send('start-waiting');
        Swordfish.sendRequest('/projects/matches', arg,
            (data: any) => {
                if (data.status !== Swordfish.SUCCESS) {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                    return;
                }
                if (data.matches.length > 0) {
                    Swordfish.mainWindow.webContents.send('set-matches', { project: arg.project, matches: data.matches });
                }
                Swordfish.mainWindow.webContents.send('end-waiting');
            },
            (reason: string) => {
                Swordfish.mainWindow.webContents.send('end-waiting');
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

    static fixMatches(arg: any, srcLang: string, tgtLang: string): void {
        let mtManager: MTManager = new MTManager(Swordfish.currentPreferences, srcLang, tgtLang);
        try {
            mtManager.fixMatch(arg.matchData);
        } catch (error: any) {
            Swordfish.mainWindow.webContents.send('end-waiting');
            Swordfish.mainWindow.webContents.send('set-status', '');
            if (error instanceof Error) {
                Swordfish.showMessage({ type: 'error', message: error.message });
            } else {
                console.error(JSON.stringify(error));
            }
        }
    }

    static machineTranslate(arg: any): void {
        let mtManager: MTManager = new MTManager(Swordfish.currentPreferences, arg.srcLang, arg.tgtLang);
        try {
            mtManager.translateSegment(arg);
        } catch (error: any) {
            if (error instanceof Error) {
                Swordfish.showMessage({ type: 'error', message: error.message });
            } else {
                console.error(JSON.stringify(error));
            }
        }
    }

    static assembleMatches(arg: any): void {
        Swordfish.mainWindow.webContents.send('start-waiting');
        Swordfish.mainWindow.webContents.send('set-status', 'Assembling Translations');
        Swordfish.sendRequest('/projects/assembleMatches', arg,
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

    static showApplyTm(arg: any): void {
        this.applyTmWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: 450,
            height: 190,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        if (arg.memory) {
            Swordfish.memoryParam = arg.memory;
        }
        Swordfish.projectParam = arg.project;
        this.applyTmWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'applyTm.html');
        let fileUrl: URL = new URL('file://' + filePath);
        this.applyTmWindow.loadURL(fileUrl.href);
        this.applyTmWindow.once('ready-to-show', () => {
            this.applyTmWindow.show();
        });
        this.applyTmWindow.on('close', () => {
            this.mainWindow.focus();
        });
        Swordfish.setLocation(this.applyTmWindow, 'applyTm.html');
    }

    static tmTranslateAll(arg: any): void {
        Swordfish.applyTmWindow.close();
        Swordfish.mainWindow.webContents.send('start-waiting');
        Swordfish.mainWindow.webContents.send('set-status', 'Translating Project \u00A0\u00A0\u00A0 0%');
        Swordfish.sendRequest('/projects/tmTranslateAll', arg,
            (data: any) => {
                if (data.status !== Swordfish.SUCCESS) {
                    Swordfish.mainWindow.webContents.send('end-waiting');
                    Swordfish.mainWindow.webContents.send('set-status', '');
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                }
                Swordfish.currentStatus = data;
                let processId: string = data.process;
                let percentage: number = 0;
                let intervalObject: NodeJS.Timeout = setInterval(() => {
                    if (Swordfish.currentStatus.progress) {
                        if (Swordfish.currentStatus.progress === Swordfish.COMPLETED) {
                            Swordfish.mainWindow.webContents.send('end-waiting');
                            Swordfish.mainWindow.webContents.send('set-status', '');
                            clearInterval(intervalObject);
                            Swordfish.mainWindow.webContents.send('reload-page', arg.project);
                            Swordfish.showMessage({ type: 'info', message: 'Added translations to ' + Swordfish.currentStatus.translated + ' segments' });
                            return;
                        } else if (Swordfish.currentStatus.progress === Swordfish.PROCESSING) {
                            // it's OK, keep waiting
                            if (percentage !== Swordfish.currentStatus.percentage) {
                                percentage = Swordfish.currentStatus.percentage;
                                Swordfish.mainWindow.webContents.send('set-status', 'Translating Project \u00A0\u00A0\u00A0' + percentage + '%');
                            }
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
                            Swordfish.showMessage({ type: 'error', message: 'Unknown error applying TM' });
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
                }
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static showSpellCheckerLangs(): void {
        Swordfish.spellingLangsWindow = new BrowserWindow({
            parent: this.preferencesWindow,
            width: 790,
            height: 530,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        Swordfish.spellingLangsWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'spellingLangs.html');
        let fileUrl: URL = new URL('file://' + filePath);
        Swordfish.spellingLangsWindow.loadURL(fileUrl.href);
        Swordfish.spellingLangsWindow.once('ready-to-show', () => {
            Swordfish.spellingLangsWindow.show();
        });
        this.spellingLangsWindow.on('close', () => {
            this.preferencesWindow.focus();
        });
        Swordfish.setLocation(this.spellingLangsWindow, 'spellingLangs.html');
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
        if (!Swordfish.spellCheckerLanguages) {
            Swordfish.spellCheckerLanguages = Swordfish.mainWindow.webContents.session.availableSpellCheckerLanguages;
        }
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
                case 'preferences': parent = Swordfish.preferencesWindow;
                    break;
                case 'replaceText': parent = Swordfish.replaceTextWindow;
                    break;
                case 'termSearch': parent = Swordfish.termSearchWindow;
                    break;
                case 'applyTm': parent = Swordfish.applyTmWindow;
                    break;
                case 'addNote': parent = Swordfish.addNoteWindow;
                    break;
                case 'serverSettings': parent = Swordfish.serverSettingsWindow;
                    break;
                case 'browseDatabases': parent = Swordfish.browseDatabasesWindow;
                    break;
                case 'addConfiguration': parent = Swordfish.addXmlConfigurationWindow;
                    break;
                case 'filterConfig': parent = Swordfish.editXmlFilterWindow;
                    break;
                case 'elementConfig': parent = Swordfish.configElementWindow;
                    break;
                case 'tagsAnalysis': parent = Swordfish.tagsAnalysisWindow;
                    break;
                case 'spaceAnalysis': parent = Swordfish.spaceAnalysisWindow;
                    break;
                case 'commentsDialog': parent = Swordfish.reviewCommentsWindow;
                    break;
                case 'addCommentDialog': parent = Swordfish.addCommentWindow;
                    break;
                case 'addReplyDialog': parent = Swordfish.addReplyWindow;
                    break;
                default: parent = Swordfish.mainWindow;
            }
        }
        dialog.showMessageBoxSync(parent, {
            icon: this.iconPath,
            type: arg.type,
            message: arg.message,
            buttons: ['OK']
        });
    }

    static showNotification(message: string): void {
        let notification: Notification = new Notification({
            title: message,
            silent: true,
            icon: this.iconPath
        });
        notification.show();
    }

    static importReviewedXLIFF(): void {
        dialog.showOpenDialog({
            title: 'Import XLIFF File',
            properties: ['openFile'],
            filters: [
                { name: 'XLIFF File', extensions: ['xlf'] },
                { name: 'Any File', extensions: ['*'] }
            ]
        }).then((value: Electron.OpenDialogReturnValue) => {
            if (!value.canceled) {
                this.sendRequest('/projects/importReview', { xliff: value.filePaths[0] },
                    (result: any) => {
                        if (result.status === Swordfish.SUCCESS) {
                            Swordfish.showMessage({ type: 'info', message: 'XLIFF imported' });
                            // TODO refresh project if it is open
                        } else {
                            Swordfish.showMessage({ type: 'error', message: result.reason });
                        }
                    }, (reason: string) => {
                        Swordfish.showMessage({ type: 'error', message: reason });
                    });
            }
        }).catch((error: Error) => {
            console.error(error.message);
        });
    }

    static exportXLIFF(arg: any): void {
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
                Swordfish.sendRequest('/projects/exportReview', { project: arg.projectId, output: value.filePath },
                    (data: any) => {
                        if (data.status === Swordfish.SUCCESS) {
                            Swordfish.exportProjectFile(data, 'Exporting XLIFF...', 'XLIFF exported');
                        } else {
                            Swordfish.mainWindow.webContents.send('set-status', '');
                            Swordfish.mainWindow.webContents.send('end-waiting');
                            Swordfish.showMessage({ type: 'error', message: data.reason });
                        }
                    }, (reason: string) => {
                        Swordfish.mainWindow.webContents.send('set-status', '');
                        Swordfish.mainWindow.webContents.send('end-waiting');
                        Swordfish.showMessage({ type: 'error', message: reason });
                    }
                );
            }
        }).catch((error: Error) => {
            console.error(error.message);
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
                        if (data.status === Swordfish.SUCCESS) {
                            Swordfish.exportProjectFile(data, 'Exporting project...', 'Project exported');
                        } else {
                            Swordfish.mainWindow.webContents.send('set-status', '');
                            Swordfish.mainWindow.webContents.send('end-waiting');
                            Swordfish.showMessage({ type: 'error', message: data.reason });
                        }
                    }, (reason: string) => {
                        Swordfish.showMessage({ type: 'error', message: reason });
                    }
                );
            }
        }).catch((error: Error) => {
            console.error(error.message);
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
                        Swordfish.exportProjectFile(data, 'Exporting TMX...', 'Translations exported');
                    }, (reason: string) => {
                        Swordfish.showMessage({ type: 'error', message: reason });
                    }
                );
            }
        }).catch((error: Error) => {
            console.error(error.message);
        });
    }

    static exportMatches(arg: any): void {
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
                Swordfish.sendRequest('/projects/exportMatches', { project: arg.projectId, output: value.filePath },
                    (data: any) => {
                        Swordfish.exportProjectFile(data, 'Exporting TM Matches...', 'TM matches exported');
                    }, (reason: string) => {
                        Swordfish.showMessage({ type: 'error', message: reason });
                    }
                );
            }
        }).catch((error: Error) => {
            console.error(error.message);
        });
    }

    static exportTerms(arg: any): void {
        let description = arg.description;
        if (description.lastIndexOf('/') !== -1) {
            description = description.substring(description.lastIndexOf('/'));
        }
        if (description.lastIndexOf('\\') !== -1) {
            description = description.substring(description.lastIndexOf('\\'));
        }
        dialog.showSaveDialog(Swordfish.mainWindow, {
            defaultPath: description + '.tbx',
            filters: [{ name: 'TBX Files', extensions: ['tbx'] }, { name: 'Any File', extensions: ['*'] }],
            properties: ['createDirectory', 'showOverwriteConfirmation']
        }).then((value: Electron.SaveDialogReturnValue) => {
            if (!value.canceled) {
                Swordfish.sendRequest('/projects/exportTerms', { project: arg.projectId, output: value.filePath },
                    (data: any) => {
                        Swordfish.exportProjectFile(data, 'Exporting Terms...', 'Terms exported');
                    }, (reason: string) => {
                        Swordfish.showMessage({ type: 'error', message: reason });
                    }
                );
            }
        }).catch((error: Error) => {
            console.error(error.message);
        });
    }

    static exportProjectFile(data: any, message: string, completed: string): void {
        if (data.status !== Swordfish.SUCCESS) {
            Swordfish.showMessage({ type: 'error', message: data.reason });
        }
        Swordfish.mainWindow.webContents.send('start-waiting');
        Swordfish.mainWindow.webContents.send('set-status', message);
        Swordfish.currentStatus = data;
        let processId: string = data.process;
        let intervalObject: NodeJS.Timeout = setInterval(() => {
            if (Swordfish.currentStatus.progress) {
                if (Swordfish.currentStatus.progress === Swordfish.COMPLETED) {
                    Swordfish.mainWindow.webContents.send('end-waiting');
                    Swordfish.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    Swordfish.showMessage({ type: 'info', message: completed });
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
            width: 435,
            height: 290,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        this.addGlossaryWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'addGlossary.html');
        let fileUrl: URL = new URL('file://' + filePath);
        this.addGlossaryWindow.loadURL(fileUrl.href);
        this.addGlossaryWindow.once('ready-to-show', () => {
            this.addGlossaryWindow.show();
        });
        this.addGlossaryWindow.on('close', () => {
            this.mainWindow.focus();
        });
        Swordfish.setLocation(this.addGlossaryWindow, 'addGlossary.html');
    }

    static removeGlossary(): void {
        Swordfish.mainWindow.webContents.send('remove-glossary');
    }

    static showImportXliff(): void {
        this.importXliffWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: 580,
            height: 360,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        this.importXliffWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'importXliff.html');
        let fileUrl: URL = new URL('file://' + filePath);
        this.importXliffWindow.loadURL(fileUrl.href);
        this.importXliffWindow.once('ready-to-show', () => {
            this.importXliffWindow.show();
        });
        this.importXliffWindow.on('close', () => {
            this.mainWindow.focus();
        });
        Swordfish.setLocation(this.importXliffWindow, 'importXliff.html');
    }

    static browseXLIFF(event: IpcMainEvent): void {
        dialog.showOpenDialog({
            title: 'Import Project File',
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
            console.error(error.message);
        });
    }

    static importXLIFF(arg: any): void {
        Swordfish.importXliffWindow.close();
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
                let intervalObject: NodeJS.Timeout = setInterval(() => {
                    if (Swordfish.currentStatus.progress) {
                        if (Swordfish.currentStatus.progress === Swordfish.COMPLETED) {
                            Swordfish.mainWindow.webContents.send('end-waiting');
                            Swordfish.mainWindow.webContents.send('set-status', '');
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

    static filesDropped(files: string[]): void {
        if (files.length === 1 && !(existsSync(files[0]) && lstatSync(files[0]).isDirectory())) {
            // single file
            Swordfish.selectedFiles = files;
            this.addFileWindow = new BrowserWindow({
                parent: this.mainWindow,
                width: 900,
                height: 355,
                minimizable: false,
                maximizable: false,
                resizable: false,
                show: false,
                icon: this.iconPath,
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false
                }
            });
            this.addFileWindow.setMenu(null);
            let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'addFile.html');
            let fileUrl: URL = new URL('file://' + filePath);
            this.addFileWindow.loadURL(fileUrl.href);
            this.addFileWindow.once('ready-to-show', () => {
                this.addFileWindow.show();
            });
            this.addFileWindow.on('close', () => {
                this.mainWindow.focus();
            });
            Swordfish.setLocation(this.addFileWindow, 'addFile.html');
        } else {
            let filesList: string[] = [];
            files.forEach((file: string) => {
                if (existsSync(file)) {
                    if (lstatSync(file).isDirectory()) {
                        let recursed: string[] = Swordfish.recurseFolder(file);
                        recursed.forEach((recursedFile: string) => {
                            filesList.push(recursedFile);
                        });
                    } else {
                        filesList.push(file);
                    }
                }
            });
            Swordfish.selectedFiles = filesList;
            Swordfish.showAddProject();
        }
    }

    static recurseFolder(file: string): string[] {
        let filesList: string[] = [];
        let dirFiles: string[] = readdirSync(file);
        dirFiles.forEach((dirFile: string) => {
            let child: string = this.path.join(file, dirFile)
            if (lstatSync(child).isDirectory()) {
                let recursed: string[] = Swordfish.recurseFolder(child);
                recursed.forEach((recursedFile: string) => {
                    filesList.push(recursedFile);
                });
            } else {
                filesList.push(child);
            }
        });
        return filesList;
    }

    static sortOptions(arg: any): void {
        Swordfish.mainWindow.webContents.send('set-sorting', arg);
        Swordfish.sortSegmentsWindow.close();
    }

    static filterOptions(arg: any): void {
        Swordfish.mainWindow.webContents.send('set-filters', arg);
        Swordfish.filterSegmentsWindow.close();
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
                        Swordfish.mainWindow.webContents.send('reload-page', arg.project);
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

    static removeAssembledMatches(arg: any): void {
        dialog.showMessageBox(Swordfish.mainWindow, {
            type: 'question',
            message: 'Remove all auto-translations?',
            buttons: ['Yes', 'No']
        }).then((selection: Electron.MessageBoxReturnValue) => {
            if (selection.response === 0) {
                Swordfish.mainWindow.webContents.send('start-waiting');
                Swordfish.mainWindow.webContents.send('set-status', 'Removing auto-translations');
                Swordfish.sendRequest('/projects/removeAssembledMatches', arg,
                    (data: any) => {
                        Swordfish.mainWindow.webContents.send('end-waiting');
                        Swordfish.mainWindow.webContents.send('set-status', '');
                        if (data.status !== Swordfish.SUCCESS) {
                            Swordfish.showMessage({ type: 'error', message: data.reason });
                            return;
                        }
                        Swordfish.mainWindow.webContents.send('reload-page', arg.project);
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
                        Swordfish.mainWindow.webContents.send('reload-page', arg.project);
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
                        Swordfish.mainWindow.webContents.send('reload-page', arg.project);
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
                        Swordfish.mainWindow.webContents.send('reload-page', arg.project);
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
                        Swordfish.mainWindow.webContents.send('reload-page', arg.project);
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
                        Swordfish.mainWindow.webContents.send('reload-page', arg.project);
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
                Swordfish.mainWindow.webContents.send('set-status', 'Confirming translations');
                Swordfish.sendRequest('/projects/confirmAllTranslations', arg,
                    (data: any) => {
                        if (data.status !== Swordfish.SUCCESS) {
                            Swordfish.mainWindow.webContents.send('end-waiting');
                            Swordfish.mainWindow.webContents.send('set-status', '');
                            Swordfish.showMessage({ type: 'error', message: data.reason });
                        }
                        Swordfish.currentStatus = data;
                        let processId: string = data.process;
                        let intervalObject: NodeJS.Timeout = setInterval(() => {
                            if (Swordfish.currentStatus.progress) {
                                if (Swordfish.currentStatus.progress === Swordfish.COMPLETED) {
                                    Swordfish.mainWindow.webContents.send('end-waiting');
                                    Swordfish.mainWindow.webContents.send('set-status', '');
                                    clearInterval(intervalObject);
                                    Swordfish.mainWindow.webContents.send('reload-page', arg.project);
                                    Swordfish.mainWindow.webContents.send('set-statistics', { project: arg.project, statistics: data.statistics });
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
                                    Swordfish.showMessage({ type: 'error', message: 'Unknown error confirming translations' });
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
                        Swordfish.mainWindow.webContents.send('reload-page', arg.project);
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

    static generateStatistics(arg: any): void {
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
                shell.openExternal('file://' + data.analysis).catch(() => {
                    shell.openPath(data.analysis).catch((reason: any) => {
                        if (reason instanceof Error) {
                            console.error(reason.message);
                        }
                        this.showMessage({ type: 'error', message: 'Unable to open statistics.' });
                    });
                });
            },
            (reason: string) => {
                Swordfish.mainWindow.webContents.send('end-waiting');
                Swordfish.mainWindow.webContents.send('set-status', '');
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static showTagsWindow(): void {
        if (Swordfish.tagsWindow && !Swordfish.tagsWindow.isDestroyed()) {
            Swordfish.tagsWindow.focus();
            return;
        }
        this.tagsWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: 190,
            height: 150,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        this.tagsWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'tags.html');
        let fileUrl: URL = new URL('file://' + filePath);
        this.tagsWindow.loadURL(fileUrl.href);
        this.tagsWindow.once('ready-to-show', () => {
            this.tagsWindow.show();
        });
        this.tagsWindow.on('close', () => {
            this.mainWindow.focus();
        });
        Swordfish.setLocation(this.tagsWindow, 'tags.html');
    }

    static goToFile({ project, file }: { project: string, file: string }): void {
        Swordfish.sendRequest('/projects/getFileStart', { project: project, file: file }, (data: any) => {
            if (data.status === Swordfish.SUCCESS) {
                Swordfish.mainWindow.webContents.send('open-segment', data.start);
            } else {
                Swordfish.showMessage({ type: 'error', message: data.reason });
            }
        }, (reason: string) => {
            Swordfish.showMessage({ type: 'error', message: reason });
        });
    }

    static showGoToWindow(): void {
        this.goToWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: 250,
            height: 150,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        this.goToWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'goTo.html');
        let fileUrl: URL = new URL('file://' + filePath);
        this.goToWindow.loadURL(fileUrl.href);
        this.goToWindow.once('ready-to-show', () => {
            this.goToWindow.show();
        });
        this.goToWindow.on('close', () => {
            this.mainWindow.focus();
        });
        Swordfish.setLocation(this.goToWindow, 'goTo.html');
    }

    static closeTagsWindow(): void {
        if (this.tagsWindow?.isVisible()) {
            Swordfish.tagsWindow.close();
        }
    }

    static showReplaceText(arg: any): void {
        this.replaceTextWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: 450,
            height: 265,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        this.projectParam = arg.project;
        this.replaceTextWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'replaceText.html');
        let fileUrl: URL = new URL('file://' + filePath);
        this.replaceTextWindow.loadURL(fileUrl.href);
        this.replaceTextWindow.once('ready-to-show', () => {
            this.replaceTextWindow.show();
        });
        this.replaceTextWindow.on('close', () => {
            this.mainWindow.focus();
        });
        Swordfish.setLocation(this.replaceTextWindow, 'replaceText.html');
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
                Swordfish.replaceTextWindow.close();
                Swordfish.mainWindow.webContents.send('reload-page', arg.project);
                Swordfish.mainWindow.webContents.send('set-statistics', { project: arg.project, statistics: data.statistics });
            },
            (reason: string) => {
                Swordfish.mainWindow.webContents.send('end-waiting');
                Swordfish.mainWindow.webContents.send('set-status', '');
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static assembleMatchesAll(arg: any): void {
        dialog.showMessageBox(Swordfish.mainWindow, {
            type: 'question',
            message: 'Apply Auto-Translation to all segments?',
            buttons: ['Yes', 'No']
        }).then((selection: Electron.MessageBoxReturnValue) => {
            if (selection.response === 0) {
                Swordfish.mainWindow.webContents.send('start-waiting');
                Swordfish.mainWindow.webContents.send('set-status', 'Assembling Matches');
                Swordfish.sendRequest('/projects/applyAmAll', arg,
                    (data: any) => {
                        if (data.status !== Swordfish.SUCCESS) {
                            Swordfish.mainWindow.webContents.send('end-waiting');
                            Swordfish.mainWindow.webContents.send('set-status', '');
                            Swordfish.showMessage({ type: 'error', message: data.reason });
                        }
                        Swordfish.currentStatus = data;
                        let processId: string = data.process;
                        let intervalObject: NodeJS.Timeout = setInterval(() => {
                            if (Swordfish.currentStatus.progress) {
                                if (Swordfish.currentStatus.progress === Swordfish.COMPLETED) {
                                    Swordfish.mainWindow.webContents.send('end-waiting');
                                    Swordfish.mainWindow.webContents.send('set-status', '');
                                    clearInterval(intervalObject);
                                    Swordfish.mainWindow.webContents.send('reload-page', arg.project);
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
                                    Swordfish.showMessage({ type: 'error', message: 'Unknown error auto-translating' });
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

    static applyMachineTranslationsAll(arg: any): void {
        dialog.showMessageBox(Swordfish.mainWindow, {
            type: 'question',
            message: 'Apply Machine Translation to all segments?',
            buttons: ['Yes', 'No']
        }).then((selection: Electron.MessageBoxReturnValue) => {
            if (selection.response === 0) {
                Swordfish.mainWindow.webContents.send('start-waiting');
                Swordfish.mainWindow.webContents.send('set-status', 'Selecting segments...');
                Swordfish.sendRequest('/projects/applyMtAll', arg,
                    (data: any) => {
                        if (data.status !== Swordfish.SUCCESS) {
                            Swordfish.mainWindow.webContents.send('end-waiting');
                            Swordfish.mainWindow.webContents.send('set-status', '');
                            Swordfish.showMessage({ type: 'error', message: data.reason });
                        }
                        Swordfish.currentStatus = data;
                        let processId: string = data.process;
                        let intervalObject: NodeJS.Timeout = setInterval(() => {
                            if (Swordfish.currentStatus.progress) {
                                if (Swordfish.currentStatus.progress === Swordfish.COMPLETED) {
                                    clearInterval(intervalObject);
                                    Swordfish.mainWindow.webContents.send('set-status', 'Translating...');
                                    let exportedFile: string = Swordfish.path.join(Swordfish.currentPreferences.projectsFolder, arg.project, 'applymt.xlf');
                                    if (!existsSync(exportedFile)) {
                                        Swordfish.mainWindow.webContents.send('end-waiting');
                                        Swordfish.mainWindow.webContents.send('set-status', '');
                                        Swordfish.showMessage({ type: 'error', message: 'Unable to find exported file' });
                                        return;
                                    }
                                    try {
                                        let mtManager: MTManager = new MTManager(this.currentPreferences, arg.srcLang, arg.tgtLang);
                                        mtManager.translateProject(arg.project, exportedFile, arg.currentSegment);
                                        unlinkSync(exportedFile);
                                        Swordfish.mainWindow.webContents.send('end-waiting');
                                        Swordfish.mainWindow.webContents.send('set-status', '');
                                        Swordfish.mainWindow.webContents.send('reload-page', arg.project);
                                    } catch (e) {
                                        Swordfish.mainWindow.webContents.send('end-waiting');
                                        Swordfish.mainWindow.webContents.send('set-status', '');
                                        if (e instanceof Error) {
                                            Swordfish.showMessage({ type: 'error', message: e.message });
                                        } else {
                                            Swordfish.showMessage({ type: 'error', message: 'Unknown error applying MT' });
                                            console.error(e);
                                        }
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

    static acceptAllMachineTranslations(arg: any): void {
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
                        Swordfish.mainWindow.webContents.send('reload-page', arg.project);
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
        Swordfish.importGlossaryWindow.close();
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
                let intervalObject: NodeJS.Timeout = setInterval(() => {
                    if (Swordfish.currentStatus.status === Swordfish.SUCCESS) {
                        if (Swordfish.currentStatus.progress === Swordfish.COMPLETED) {
                            Swordfish.mainWindow.webContents.send('end-waiting');
                            Swordfish.mainWindow.webContents.send('set-status', '');
                            clearInterval(intervalObject);
                            Swordfish.showMessage({ type: 'info', message: 'Imported ' + Swordfish.currentStatus.imported + ' terms.' });
                            return;
                        }
                    }
                    if (Swordfish.currentStatus.status === Swordfish.ERROR) {
                        Swordfish.mainWindow.webContents.send('end-waiting');
                        Swordfish.mainWindow.webContents.send('set-status', '');
                        clearInterval(intervalObject);
                        Swordfish.showMessage({ type: 'error', message: Swordfish.currentStatus.reason });
                        return;
                    }
                    Swordfish.getGlossariesProgress(processId);
                }, 500);
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static showConcordanceWindow(memories: string[]): void {
        this.concordanceSearchWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: 470,
            height: 300,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        Swordfish.concordanceMemories = memories;
        this.concordanceSearchWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'concordanceSearch.html');
        let fileUrl: URL = new URL('file://' + filePath);
        this.concordanceSearchWindow.loadURL(fileUrl.href);
        this.concordanceSearchWindow.once('ready-to-show', () => {
            this.concordanceSearchWindow.show();
        });
        this.concordanceSearchWindow.on('close', () => {
            this.mainWindow.focus();
        });
        Swordfish.setLocation(this.concordanceSearchWindow, 'concordanceSearch.html');
    }

    static concordanceSearch(event: IpcMainEvent, arg: any): void {
        event.sender.send('start-waiting');
        Swordfish.sendRequest('/memories/concordance', arg,
            (data: any) => {
                if (data.status !== Swordfish.SUCCESS) {
                    event.sender.send('end-waiting');
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                    return;
                }
                Swordfish.currentStatus = data;
                let processId: string = data.process;
                let intervalObject: NodeJS.Timeout = setInterval(() => {
                    if (Swordfish.currentStatus.status === Swordfish.SUCCESS) {
                        if (Swordfish.currentStatus.progress === Swordfish.COMPLETED) {
                            clearInterval(intervalObject);
                            Swordfish.concordanceResults(Swordfish.currentStatus);
                            event.sender.send('end-waiting');
                            return;
                        }
                    }
                    if (Swordfish.currentStatus.status === Swordfish.ERROR) {
                        event.sender.send('end-waiting');
                        clearInterval(intervalObject);
                        Swordfish.showMessage({ type: 'error', message: Swordfish.currentStatus.reason });
                        return;
                    }
                    Swordfish.getMemoriesProgress(processId);
                }, 500);
            },
            (reason: string) => {
                event.sender.send('end-waiting');
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static concordanceResults(data: any): void {
        if (data.count === 0) {
            Swordfish.showMessage({ type: 'info', message: 'Text not found' });
            return;
        }
        let size: Rectangle = Swordfish.mainWindow.getBounds();
        let htmlViewerWindow: BrowserWindow = new BrowserWindow({
            parent: Swordfish.concordanceSearchWindow,
            width: size.width * 0.6,
            height: size.height * 0.4,
            minimizable: false,
            maximizable: false,
            resizable: true,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        Swordfish.htmlContent = data.html;
        Swordfish.htmlTitle = 'Concordance Search';
        Swordfish.htmlId = htmlViewerWindow.id;
        htmlViewerWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'htmlViewer.html');
        let fileUrl: URL = new URL('file://' + filePath);
        htmlViewerWindow.loadURL(fileUrl.href);
        htmlViewerWindow.once('ready-to-show', () => {
            htmlViewerWindow.show();
        });
        htmlViewerWindow.on('close', () => {
            this.concordanceSearchWindow.focus();
        });
    }

    static showIatePlugin(): void {
        this.iatePluginWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: 600,
            height: 510,
            minimizable: true,
            maximizable: false,
            resizable: true,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        this.iatePluginWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'iatePlugin.html');
        let fileUrl: URL = new URL('file://' + filePath);
        this.iatePluginWindow.loadURL(fileUrl.href);
        this.iatePluginWindow.once('ready-to-show', () => {
            this.iatePluginWindow.show();
        });
        this.iatePluginWindow.on('close', () => {
            this.mainWindow.focus();
        });
        Swordfish.setLocation(this.iatePluginWindow, 'iatePlugin.html');
    }

    static showTermSearch(glossary: string): any {
        this.termSearchWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: 500,
            height: 280,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        this.selectedGlossary = glossary;
        this.termSearchWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'termSearch.html');
        let fileUrl: URL = new URL('file://' + filePath);
        this.termSearchWindow.loadURL(fileUrl.href);
        this.termSearchWindow.once('ready-to-show', () => {
            this.termSearchWindow.show();
        });
        this.termSearchWindow.on('close', () => {
            this.mainWindow.focus();
        });
        Swordfish.setLocation(this.termSearchWindow, 'termSearch.html');
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
                    parent: Swordfish.termSearchWindow,
                    width: size.width * 0.6,
                    height: size.height * 0.4,
                    minimizable: false,
                    maximizable: false,
                    resizable: true,
                    show: false,
                    icon: this.iconPath,
                    webPreferences: {
                        nodeIntegration: true,
                        contextIsolation: false
                    }
                });
                Swordfish.htmlTitle = 'Term Search';
                Swordfish.htmlContent = data.html;
                Swordfish.htmlId = htmlViewerWindow.id;
                htmlViewerWindow.setMenu(null);
                let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'htmlViewer.html');
                let fileUrl: URL = new URL('file://' + filePath);
                htmlViewerWindow.loadURL(fileUrl.href);
                htmlViewerWindow.once('ready-to-show', () => {
                    htmlViewerWindow.show();
                });
                htmlViewerWindow.on('close', () => {
                    this.termSearchWindow.focus();
                });

            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static showAddTerm(glossary: string): void {
        this.addTermWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: 680,
            height: 190,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        this.selectedGlossary = glossary;
        this.addTermWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'addTerm.html');
        let fileUrl: URL = new URL('file://' + filePath);
        this.addTermWindow.loadURL(fileUrl.href);
        this.addTermWindow.once('ready-to-show', () => {
            this.addTermWindow.show();
        });
        this.addTermWindow.on('close', () => {
            this.mainWindow.focus();
        });
        Swordfish.setLocation(this.addTermWindow, 'addTerm.html');
    }

    static addToGlossary(arg: { glossary: string, sourceTerm: string, targetTerm: string, srcLang: string, tgtLang: string }): void {
        this.addTermWindow.close();
        Swordfish.sendRequest('/glossaries/addTerm', arg,
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

    static getSegmentTerms(arg: any): void {
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

    static getProjectTerms(arg: any): void {
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
                        let intervalObject: NodeJS.Timeout = setInterval(() => {
                            if (Swordfish.currentStatus.progress) {
                                if (Swordfish.currentStatus.progress === Swordfish.COMPLETED) {
                                    Swordfish.mainWindow.webContents.send('end-waiting');
                                    Swordfish.mainWindow.webContents.send('set-status', '');
                                    clearInterval(intervalObject);
                                    if (Swordfish.currentStatus.segments > 0) {
                                        Swordfish.mainWindow.webContents.send('reload-page', arg.project);
                                        Swordfish.showMessage({ type: 'info', message: 'Added terms to ' + Swordfish.currentStatus.segments + ' segments' });
                                        return;
                                    }
                                    Swordfish.showMessage({ type: 'info', message: 'Terms not found' });
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

    static lockSegment(arg: any): void {
        Swordfish.sendRequest('/projects/lockSegment', arg,
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

    static lockDuplicates(arg: any): void {
        Swordfish.sendRequest('/projects/lockDuplicates', arg,
            (data: any) => {
                if (data.status !== Swordfish.SUCCESS) {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                    return;
                }
                Swordfish.mainWindow.webContents.send('reload-page', arg.project);
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static unlockAll(projectId: string): void {
        Swordfish.sendRequest('/projects/unlockAll', { project: projectId },
            (data: any) => {
                if (data.status !== Swordfish.SUCCESS) {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                    return;
                }
                Swordfish.mainWindow.webContents.send('reload-page', projectId);
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static analyzeSpaces(projectId: string): void {
        Swordfish.activeProject = projectId;
        Swordfish.spaceAnalysisWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: 540,
            height: 350,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        Swordfish.spaceAnalysisWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'spaceAnalysis.html');
        let fileUrl: URL = new URL('file://' + filePath);
        Swordfish.spaceAnalysisWindow.loadURL(fileUrl.href);
        Swordfish.spaceAnalysisWindow.once('ready-to-show', () => {
            Swordfish.spaceAnalysisWindow.show();
        });
        Swordfish.spaceAnalysisWindow.on('close', () => {
            this.mainWindow.focus();
        });
        Swordfish.setLocation(Swordfish.spaceAnalysisWindow, 'spaceAnalysis.html');
    }

    static analyzeTags(projectId: string): void {
        Swordfish.activeProject = projectId;
        Swordfish.tagsAnalysisWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: 400,
            height: 350,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        Swordfish.tagsAnalysisWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'tagsAnalysis.html');
        let fileUrl: URL = new URL('file://' + filePath);
        Swordfish.tagsAnalysisWindow.loadURL(fileUrl.href);
        Swordfish.tagsAnalysisWindow.once('ready-to-show', () => {
            Swordfish.tagsAnalysisWindow.show();
        });
        Swordfish.tagsAnalysisWindow.on('close', () => {
            this.mainWindow.focus();
        });
        Swordfish.setLocation(Swordfish.tagsAnalysisWindow, 'tagsAnalysis.html');
    }

    static getTagErrors(event: IpcMainEvent): void {
        Swordfish.sendRequest('/projects/analyzeTags', { project: Swordfish.activeProject },
            (data: any) => {
                if (data.status !== Swordfish.SUCCESS) {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                    return;
                }
                event.sender.send('set-tagsErrors', data);
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static getSpaceErrors(event: IpcMainEvent): void {
        Swordfish.sendRequest('/projects/analyzeSpaces', { project: Swordfish.activeProject },
            (data: any) => {
                if (data.status !== Swordfish.SUCCESS) {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                    return;
                }
                event.sender.send('set-spaceErrors', data);
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static fixSpaceErrors(event: IpcMainEvent): void {
        Swordfish.mainWindow.webContents.send('start-waiting');
        Swordfish.mainWindow.webContents.send('set-status', 'Fixing spaces');
        Swordfish.sendRequest('/projects/fixSpaces', { project: Swordfish.activeProject },
            (data: any) => {
                Swordfish.mainWindow.webContents.send('end-waiting');
                Swordfish.mainWindow.webContents.send('set-status', '');
                if (data.status !== Swordfish.SUCCESS) {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                    return;
                }
                event.sender.send('set-spaceErrors', data);
                Swordfish.mainWindow.webContents.send('reload-page', Swordfish.activeProject);
            },
            (reason: string) => {
                Swordfish.mainWindow.webContents.send('end-waiting');
                Swordfish.mainWindow.webContents.send('set-status', '');
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static openPrompt(args: any): void {
        Swordfish.mainWindow.webContents.send('start-waiting');
        Swordfish.mainWindow.webContents.send('set-status', 'Generating Prompt');
        Swordfish.sendRequest('/projects/getSegment', args,
            (data: any) => {
                Swordfish.mainWindow.webContents.send('end-waiting');
                Swordfish.mainWindow.webContents.send('set-status', '');
                try {
                    if (data.status !== Swordfish.SUCCESS) {
                        console.error('Swordfish.generatePrompt', data);
                    } else {
                        let source: XMLElement = MTUtils.toXMLElement(data.source);
                        let prompt: string = MTUtils.getRole(data.srcLang, data.tgtLang) + ' ' + MTUtils.generatePrompt(source, data.srcLang, data.tgtLang, data.terms);
                        Swordfish.showPromptDialog(prompt);
                    }
                } catch (e) {
                    if (e instanceof Error) {
                        Swordfish.showMessage({ type: 'error', message: e.message });
                    }
                }
            },
            (reason: string) => {
                Swordfish.mainWindow.webContents.send('end-waiting');
                Swordfish.mainWindow.webContents.send('set-status', '');
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static generatePrompt(args: any): void {
        Swordfish.mainWindow.webContents.send('start-waiting');
        Swordfish.mainWindow.webContents.send('set-status', 'Generating Prompt');
        Swordfish.sendRequest('/projects/getSegment', args,
            (data: any) => {
                Swordfish.mainWindow.webContents.send('end-waiting');
                Swordfish.mainWindow.webContents.send('set-status', '');
                try {
                    if (data.status !== Swordfish.SUCCESS) {
                        console.error('Swordfish.generatePrompt', data);
                    } else {
                        let source: XMLElement = MTUtils.toXMLElement(data.source);
                        let prompt: string = MTUtils.getRole(data.srcLang, data.tgtLang) + ' ' + MTUtils.generatePrompt(source, data.srcLang, data.tgtLang, data.terms);
                        clipboard.writeText(prompt);
                        Swordfish.showNotification('Prompt copied to clipboard');
                    }
                } catch (e) {
                    if (e instanceof Error) {
                        Swordfish.showMessage({ type: 'error', message: e.message });
                    }
                }
            },
            (reason: string) => {
                Swordfish.mainWindow.webContents.send('end-waiting');
                Swordfish.mainWindow.webContents.send('set-status', '');
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static showPromptDialog(prompt: string): void {
        if (this.promptWindow && !this.promptWindow.isDestroyed()) {
            this.promptWindow.webContents.send('set-prompt', prompt);
            this.promptWindow.focus();
        } else {
            this.promptWindow = new BrowserWindow({
                parent: this.mainWindow,
                width: 680,
                height: 560,
                minimizable: false,
                maximizable: false,
                resizable: true,
                show: false,
                icon: this.iconPath,
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false
                }
            });
            this.promptWindow.setMenu(null);
            let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'promptDialog.html');
            let fileUrl: URL = new URL('file://' + filePath);
            this.promptWindow.loadURL(fileUrl.href);
        }
        this.promptWindow.once('ready-to-show', () => {
            this.promptWindow.webContents.send('set-prompt', prompt);
            this.promptWindow.show();
        });
        this.promptWindow.on('close', () => {
            this.mainWindow.focus();
        });
        Swordfish.setLocation(this.promptWindow, 'promptDialog.html');
    }

    static insertAiResponse(): void {
        let clipboardText: string = clipboard.readText();
        try {
            let target: XMLElement = MTUtils.toXMLElement(clipboardText);
            if (target.getName() === 'target') {
                this.mainWindow.webContents.send('insert-ai-response', target.toString());
            } else {
                Swordfish.showMessage({ type: 'error', message: 'Invalid AI response: ' + clipboardText });
                return;
            }
        } catch (e) {
            if (e instanceof Error) {
                Swordfish.showMessage({ type: 'error', message: 'Invalid AI response: ' + clipboardText });
                return;
            }
        }
    }

    static insertResponse(aiResponse: any): void {
        Swordfish.sendRequest('/projects/setTarget', aiResponse,
            (data: any) => {
                if (data.status === Swordfish.SUCCESS) {
                    Swordfish.mainWindow.webContents.send('set-target', data);
                } else {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                }
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static fixTags(args: any): void {
        if (!(Swordfish.currentPreferences.chatGpt.enabled || Swordfish.currentPreferences.anthropic.enabled)) {
            Swordfish.showMessage({ type: 'error', message: 'No AI engine is currently enabled' });
            return;
        }
        Swordfish.mainWindow.webContents.send('start-waiting');
        Swordfish.mainWindow.webContents.send('set-status', 'Fixing tags');
        Swordfish.sendRequest('/projects/getSegment', args,
            (data: any) => {
                try {
                    if (data.status !== Swordfish.SUCCESS) {
                        console.error('Swordfish.fixTags', data);
                    } else {
                        let mtManager = new MTManager(Swordfish.currentPreferences, args.srcLang, args.tgtLang);
                        data.project = args.project;
                        data.file = args.file;
                        data.unit = args.unit;
                        data.segment = args.segment;
                        mtManager.fixTags(data);
                    }
                } catch (e) {
                    Swordfish.mainWindow.webContents.send('end-waiting');
                    Swordfish.mainWindow.webContents.send('set-status', '');
                    if (e instanceof Error) {
                        Swordfish.showMessage({ type: 'error', message: e.message });
                    }
                }
            },
            (reason: string) => {
                Swordfish.mainWindow.webContents.send('end-waiting');
                Swordfish.mainWindow.webContents.send('set-status', '');
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static updateTarget(params: any): void {
        Swordfish.mainWindow.webContents.send('update-target-cell', params);
        Swordfish.mainWindow.webContents.send('end-waiting');
        Swordfish.mainWindow.webContents.send('set-status', '');
    }
    static fixMatch(match: Match): void {
        if (!(Swordfish.currentPreferences.chatGpt.enabled || Swordfish.currentPreferences.anthropic.enabled)) {
            Swordfish.showMessage({ type: 'error', message: 'No AI engine is currently enabled' });
            return;
        }
        Swordfish.mainWindow.webContents.send('start-waiting');
        Swordfish.mainWindow.webContents.send('set-status', 'Fixing match');
        Swordfish.sendRequest('/projects/getMatchData', match,
            (data: any) => {
                Swordfish.mainWindow.webContents.send('end-waiting');
                Swordfish.mainWindow.webContents.send('set-status', '');
                if (data.status !== Swordfish.SUCCESS) {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                    return;
                }
                Swordfish.fixMatches(data, match.srcLang, match.tgtLang);
            },
            (reason: string) => {
                Swordfish.mainWindow.webContents.send('end-waiting');
                Swordfish.mainWindow.webContents.send('set-status', '');
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static exportHTML(arg: any): void {
        Swordfish.mainWindow.webContents.send('start-waiting');
        Swordfish.mainWindow.webContents.send('set-status', 'Exporting HTML');
        Swordfish.sendRequest('/projects/exportHtml', arg,
            (data: any) => {
                Swordfish.mainWindow.webContents.send('end-waiting');
                Swordfish.mainWindow.webContents.send('set-status', '');
                if (data.status !== Swordfish.SUCCESS) {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                    return;
                }
                shell.openExternal('file://' + data.export).catch(() => {
                    shell.openPath(data.export).catch((reason: any) => {
                        if (reason instanceof Error) {
                            console.error(reason.message);
                        }
                        this.showMessage({ type: 'error', message: 'Unable to open HTML.' });
                    });
                });
            },
            (reason: string) => {
                Swordfish.mainWindow.webContents.send('end-waiting');
                Swordfish.mainWindow.webContents.send('set-status', '');
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static showChangeCase(): void {
        this.changeCaseWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: 250,
            height: 350,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        this.changeCaseWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'changeCase.html');
        let fileUrl: URL = new URL('file://' + filePath);
        this.changeCaseWindow.loadURL(fileUrl.href);
        this.changeCaseWindow.once('ready-to-show', () => {
            let bounds: Rectangle = Swordfish.mainWindow.getBounds();
            if (!Swordfish.locations.hasLocation('changeCase.html')) {
                this.changeCaseWindow.setPosition(bounds.x + Number.parseInt('' + (bounds.width / 5)), bounds.y + Number.parseInt('' + (bounds.height / 4)));
            }
            this.changeCaseWindow.show();
        });
        this.changeCaseWindow.on('close', () => {
            this.mainWindow.focus();
        });
        Swordfish.setLocation(this.changeCaseWindow, 'changeCase.html');
    }

    static changeCaseTo(arg: any): void {
        Swordfish.mainWindow.webContents.send('case-changed', arg);
        this.changeCaseWindow.close();
    }

    static splitSegment(arg: any): void {
        Swordfish.sendRequest('/projects/splitSegment', arg,
            (data: any) => {
                if (data.status !== Swordfish.SUCCESS) {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                    return;
                }
                Swordfish.mainWindow.webContents.send('count-changed', { project: arg.project });
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static mergeSegment(arg: any): void {
        Swordfish.sendRequest('/projects/mergeSegment', arg,
            (data: any) => {
                if (data.status !== Swordfish.SUCCESS) {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                    return;
                }
                Swordfish.mainWindow.webContents.send('count-changed', { project: arg.project });
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static toggleFilesPanel(): void {
        Swordfish.mainWindow.webContents.send('toggle-files-panel');
    }

    static toggleRightPanels(): void {
        Swordfish.mainWindow.webContents.send('toggle-right-panels');
    }

    static toggleReviewComments(): void {
        if (Swordfish.reviewCommentsWindow && !Swordfish.reviewCommentsWindow.isDestroyed() && Swordfish.reviewCommentsWindow.isVisible()) {
            Swordfish.reviewCommentsWindow.close();
            Swordfish.mainWindow?.webContents.send('review-comments-closed');
            return;
        }
        Swordfish.mainWindow.webContents.send('show-metadata');
    }

    static toggleNotes(): void {
        if (Swordfish.notesWindow && !Swordfish.notesWindow.isDestroyed() && Swordfish.notesWindow.isVisible()) {
            Swordfish.notesWindow.close();
            Swordfish.mainWindow?.webContents.send('notes-closed');
            return;
        }
        Swordfish.mainWindow.webContents.send('notes-requested');
    }

    static showNotes(segment: FullId): void {
        if (Swordfish.notesWindow && !Swordfish.notesWindow.isDestroyed() && Swordfish.notesWindow.isVisible()) {
            Swordfish.notesWindow.webContents.send('note-params', segment);
            Swordfish.getNotes(segment);
            return;
        }
        Swordfish.notesWindow = new BrowserWindow({
            parent: Swordfish.mainWindow,
            width: 450,
            height: 300,
            minimizable: false,
            maximizable: false,
            resizable: true,
            show: false,
            alwaysOnTop: true,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        Swordfish.notesWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'notes.html');
        let fileUrl: URL = new URL('file://' + filePath);
        Swordfish.notesWindow.loadURL(fileUrl.href);
        Swordfish.notesWindow.addListener('closed', () => {
            try {
                Swordfish.mainWindow?.focus();
                Swordfish.mainWindow?.webContents.send('notes-closed');
            } catch (e) {
                // ignore
            }
        });
        Swordfish.notesWindow.once('ready-to-show', () => {
            Swordfish.notesWindow.show();
            Swordfish.notesWindow.webContents.send('note-params', segment);
            Swordfish.getNotes(segment);
            Swordfish.mainWindow.webContents.send('notes-requested');
        });
        Swordfish.setLocation(this.notesWindow, 'notes.html');
        Swordfish.monitorSize(this.notesWindow, 'notes.html');
    }

    static getNotes(segment: FullId): void {
        Swordfish.sendRequest('/projects/getNotes', segment,
            (data: any) => {
                if (data.status === 'Success') {
                    Swordfish.notesWindow.webContents.send('set-notes', data.notes);
                } else {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                }
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static showAddNote(segmentId: FullId): void {
        if (Swordfish.addNoteWindow && !Swordfish.addNoteWindow.isDestroyed()) {
            Swordfish.addNoteWindow.focus();
            Swordfish.addNoteWindow.webContents.send('note-params', segmentId);
            return;
        }
        Swordfish.addNoteWindow = new BrowserWindow({
            parent: Swordfish.notesWindow,
            width: 350,
            height: 220,
            minimizable: false,
            maximizable: false,
            resizable: true,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        Swordfish.addNoteWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'addNote.html');
        let fileUrl: URL = new URL('file://' + filePath);
        Swordfish.addNoteWindow.loadURL(fileUrl.href);
        Swordfish.addNoteWindow.once('ready-to-show', () => {
            Swordfish.addNoteWindow.show();
            Swordfish.addNoteWindow.webContents.send('note-params', segmentId);
        });
        this.addNoteWindow.on('close', () => {
            let parent: BrowserWindow | null = this.addNoteWindow?.getParentWindow();
            if (parent) {
                parent.focus();
            }
        });
        Swordfish.setLocation(this.addNoteWindow, 'addNote.html');
    }

    static showEditNote(segmentId: FullId, noteId: string, noteText: string): void {
        if (Swordfish.addNoteWindow && !Swordfish.addNoteWindow.isDestroyed()) {
            Swordfish.addNoteWindow.focus();
            Swordfish.addNoteWindow.webContents.send('note-params', segmentId);
            Swordfish.addNoteWindow.webContents.send('set-note', noteText);
            Swordfish.addNoteWindow.webContents.send('set-note-id', noteId);
            return;
        }
        Swordfish.addNoteWindow = new BrowserWindow({
            parent: Swordfish.notesWindow,
            width: 350,
            height: 220,
            minimizable: false,
            maximizable: false,
            resizable: true,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        Swordfish.addNoteWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'addNote.html');
        let fileUrl: URL = new URL('file://' + filePath);
        Swordfish.addNoteWindow.loadURL(fileUrl.href);
        Swordfish.addNoteWindow.once('ready-to-show', () => {
            Swordfish.addNoteWindow.show();
            Swordfish.addNoteWindow.webContents.send('note-params', segmentId);
            Swordfish.addNoteWindow.webContents.send('set-note', noteText);
            Swordfish.addNoteWindow.webContents.send('set-note-id', noteId);
        });
        this.addNoteWindow.on('close', () => {
            let parent: BrowserWindow | null = this.addNoteWindow?.getParentWindow();
            if (parent) {
                parent.focus();
            }
        });
        Swordfish.setLocation(this.addNoteWindow, 'addNote.html');
    }

    static addNote(segmentId: FullId, note: string): void {
        Swordfish.addNoteWindow.close();
        let params: any = segmentId;
        params.noteText = note;
        Swordfish.sendRequest('/projects/addNote', params,
            (data: any) => {
                if (data.status === 'Success') {
                    Swordfish.notesWindow.webContents.send('set-notes', data.notes);
                    Swordfish.mainWindow.webContents.send('notes-added', segmentId);
                } else {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                }
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static updateNote(segment: FullId, note: string, noteId: string): void {
        Swordfish.addNoteWindow.close();
        let params: any = segment;
        params.noteText = note;
        params.noteId = noteId;
        Swordfish.sendRequest('/projects/addNote', params,
            (data: any) => {
                if (data.status === 'Success') {
                    Swordfish.notesWindow.webContents.send('set-notes', data.notes);
                } else {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                }
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static removeNote(segmentId: FullId, noteId: string): void {
        let params: any = segmentId;
        params.noteId = noteId;
        Swordfish.sendRequest('/projects/removeNote', params,
            (data: any) => {
                if (data.status === 'Success') {
                    Swordfish.notesWindow.webContents.send('set-notes', data.notes);
                    if (data.notes.length === 0) {
                        Swordfish.mainWindow.webContents.send('notes-removed', segmentId);
                    }
                } else {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                }
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static showFileInfo(fileInfo: any): void {
        if (Swordfish.fileInfoWindow && !Swordfish.fileInfoWindow.isDestroyed() && Swordfish.fileInfoWindow.isVisible()) {
            // focus the existing window
            Swordfish.fileInfoWindow.focus();
            Swordfish.fileInfoWindow.webContents.send('set-file-info', fileInfo);
            return;
        }
        Swordfish.fileInfoWindow = new BrowserWindow({
            parent: Swordfish.mainWindow,
            width: 600,
            height: 440,
            minimizable: false,
            maximizable: false,
            resizable: true,
            show: false,
            alwaysOnTop: true,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        Swordfish.fileInfoWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'fileInfo.html');
        let fileUrl: URL = new URL('file://' + filePath);
        Swordfish.fileInfoWindow.loadURL(fileUrl.href);
        Swordfish.fileInfoWindow.once('ready-to-show', () => {
            Swordfish.fileInfoWindow.show();
            Swordfish.fileInfoWindow.webContents.send('set-file-info', fileInfo);
        });
        Swordfish.fileInfoWindow.addListener('closed', () => {
            Swordfish.mainWindow?.focus();
        });
        Swordfish.setLocation(this.fileInfoWindow, 'fileInfo.html');
    }

    static showReviewComments(metaId: MetaId): void {
        if (Swordfish.reviewCommentsWindow && !Swordfish.reviewCommentsWindow.isDestroyed() && Swordfish.reviewCommentsWindow.isVisible()) {
            // update the existing window
            Swordfish.reviewCommentsWindow.webContents.send('set-data', metaId);
            return;
        }
        Swordfish.reviewCommentsWindow = new BrowserWindow({
            parent: Swordfish.mainWindow,
            width: 500,
            height: 440,
            minWidth: 480,
            minHeight: 380,
            minimizable: false,
            maximizable: false,
            resizable: true,
            show: false,
            alwaysOnTop: true,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        Swordfish.reviewCommentsWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'commentsDialog.html');
        let fileUrl: URL = new URL('file://' + filePath);
        Swordfish.reviewCommentsWindow.loadURL(fileUrl.href);
        Swordfish.reviewCommentsWindow.addListener('closed', () => {
            try {
                Swordfish.mainWindow?.focus();
                Swordfish.mainWindow?.webContents.send('review-comments-closed');
            } catch (e) {
                // ignore
            }
        });
        Swordfish.reviewCommentsWindow.once('ready-to-show', () => {
            Swordfish.reviewCommentsWindow.show();
            Swordfish.reviewCommentsWindow.webContents.send('set-data', metaId);
            Swordfish.mainWindow.webContents.send('metadata-requested', metaId);
        });
        Swordfish.setLocation(this.reviewCommentsWindow, 'commentsDialog.html');
        Swordfish.monitorSize(this.reviewCommentsWindow, 'commentsDialog.html');
    }

    static getMetadata(arg: MetaId): void {
        Swordfish.sendRequest('/projects/getCustomMetadata', arg,
            (data: any) => {
                if (data.status === 'Success') {
                    // remove status field from. data
                    delete data.status;
                    Swordfish.reviewCommentsWindow.webContents.send('set-metadata', data);
                } else {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                }
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static saveMetadata(metaId: MetaId, metadata: MetaData): void {
        let params: any = metaId;
        params.metadata = metadata;
        Swordfish.sendRequest('/projects/saveMetadata', params,
            (data: any) => {
                if (data.status === 'Success') {
                    if (Swordfish.reviewCommentsWindow && !Swordfish.reviewCommentsWindow.isDestroyed() && Swordfish.reviewCommentsWindow.isVisible()) {
                        Swordfish.reviewCommentsWindow.webContents.send('set-metadata', metadata);
                    }
                } else {
                    Swordfish.showMessage({ type: 'error', message: data.reason });
                }
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason });
            }
        );
    }

    static showAddComment(metaId: MetaId): void {
        if (Swordfish.addCommentWindow && !Swordfish.addCommentWindow.isDestroyed() && Swordfish.addCommentWindow.isVisible()) {
            // focus the existing window
            Swordfish.addCommentWindow.focus();
            Swordfish.addCommentWindow.webContents.send('set-metaId', metaId);
            return;
        }
        Swordfish.addCommentWindow = new BrowserWindow({
            parent: Swordfish.reviewCommentsWindow,
            width: 500,
            height: 420,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        Swordfish.addCommentWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'addComment.html');
        let fileUrl: URL = new URL('file://' + filePath);
        Swordfish.addCommentWindow.loadURL(fileUrl.href);
        Swordfish.addCommentWindow.once('ready-to-show', () => {
            Swordfish.addCommentWindow.show();
            Swordfish.addCommentWindow.webContents.send('set-metaId', metaId);
        });
        this.addCommentWindow.on('close', () => {
            let parent: BrowserWindow | null = this.addCommentWindow?.getParentWindow();
            parent?.focus();
        });
        Swordfish.setLocation(this.addCommentWindow, 'addComment.html');
        Swordfish.monitorSize(this.addCommentWindow, 'addComment.html');
    }

    static getContentModel(from: string): void {
        if (existsSync(Swordfish.currentPreferences.reviewModel)) {
            let contentModel: any = JSON.parse(readFileSync(Swordfish.currentPreferences.reviewModel, 'utf8'));
            if (from === 'commentsDialog') {
                this.addCommentWindow.webContents.send('set-content-model', contentModel);
            }
            if (from === 'addReply') {
                this.addReplyWindow.webContents.send('set-content-model', contentModel);
            }
        } else {
            Swordfish.showMessage({ type: 'error', message: 'Content model file not found: ' + Swordfish.currentPreferences.reviewModel });
        }
    }

    static saveComment(metaId: MetaId, comment: ReviewComment): void {
        Swordfish.addCommentWindow.close();
        Swordfish.reviewCommentsWindow.webContents.send('add-comment', comment);
    }

    static saveReply(metaId: MetaId, reply: CommentReply): void {
        Swordfish.addReplyWindow.close();
        Swordfish.reviewCommentsWindow.webContents.send('add-reply', reply);
    }

    static showEditComment(metaId: MetaId, comment: ReviewComment): void {
        if (Swordfish.addCommentWindow && !Swordfish.addCommentWindow.isDestroyed() && Swordfish.addCommentWindow.isVisible()) {
            // focus the existing window
            Swordfish.addCommentWindow.focus();
            Swordfish.addCommentWindow.webContents.send('set-metaId', metaId);
            Swordfish.addCommentWindow.webContents.send('set-comment', comment);
            return;
        }
        Swordfish.addCommentWindow = new BrowserWindow({
            parent: Swordfish.reviewCommentsWindow,
            width: 500,
            height: 420,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        Swordfish.addCommentWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'addComment.html');
        let fileUrl: URL = new URL('file://' + filePath);
        Swordfish.addCommentWindow.loadURL(fileUrl.href);
        Swordfish.addCommentWindow.once('ready-to-show', () => {
            Swordfish.addCommentWindow.show();
            Swordfish.addCommentWindow.webContents.send('set-metaId', metaId);
            Swordfish.addCommentWindow.webContents.send('set-comment', comment);
        });
        this.addCommentWindow.on('close', () => {
            let parent: BrowserWindow | null = this.addCommentWindow?.getParentWindow();
            parent?.focus();
        });
        Swordfish.setLocation(this.addCommentWindow, 'addComment.html');
        Swordfish.monitorSize(this.addCommentWindow, 'addComment.html');
    }

    static showAddReply(metaId: MetaId, commentId: string): void {
        if (Swordfish.addReplyWindow && !Swordfish.addReplyWindow.isDestroyed() && Swordfish.addReplyWindow.isVisible()) {
            Swordfish.addReplyWindow.close();
        }
        Swordfish.addReplyWindow = new BrowserWindow({
            parent: Swordfish.reviewCommentsWindow,
            width: 500,
            height: 320,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        Swordfish.addReplyWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'addReply.html');
        let fileUrl: URL = new URL('file://' + filePath);
        Swordfish.addReplyWindow.loadURL(fileUrl.href);
        Swordfish.addReplyWindow.once('ready-to-show', () => {
            Swordfish.addReplyWindow.show();
            Swordfish.addReplyWindow.webContents.send('set-metaId', metaId);
            Swordfish.addReplyWindow.webContents.send('set-commentId', commentId);
        });
        this.addReplyWindow.on('close', () => {
            let parent: BrowserWindow | null = this.addReplyWindow?.getParentWindow();
            parent?.focus();
        });
        Swordfish.setLocation(this.addReplyWindow, 'addReply.html');
        Swordfish.monitorSize(this.addReplyWindow, 'addReply.html');
    }

    static showEditReply(metaId: MetaId, reply: CommentReply): void {
        if (Swordfish.addReplyWindow && !Swordfish.addReplyWindow.isDestroyed() && Swordfish.addReplyWindow.isVisible()) {
            Swordfish.addReplyWindow.close();
        }
        Swordfish.addReplyWindow = new BrowserWindow({
            parent: Swordfish.reviewCommentsWindow,
            width: 500,
            height: 320,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        Swordfish.addReplyWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'addReply.html');
        let fileUrl: URL = new URL('file://' + filePath);
        Swordfish.addReplyWindow.loadURL(fileUrl.href);
        Swordfish.addReplyWindow.once('ready-to-show', () => {
            Swordfish.addReplyWindow.show();
            Swordfish.addReplyWindow.webContents.send('set-metaId', metaId);
            Swordfish.addReplyWindow.webContents.send('set-reply', reply);
        });
        this.addReplyWindow.on('close', () => {
            let parent: BrowserWindow | null = this.addReplyWindow?.getParentWindow();
            parent?.focus();
        });
        Swordfish.setLocation(this.addReplyWindow, 'addReply.html');
        Swordfish.monitorSize(this.addReplyWindow, 'addReply.html');
    }

    static downloadLatest(): void {
        let downloadsFolder: string = app.getPath('downloads');
        let url: URL = new URL(Swordfish.downloadLink);
        let path: string = url.pathname;
        path = path.substring(path.lastIndexOf('/') + 1);
        let file: string = downloadsFolder + (process.platform === 'win32' ? '\\' : '/') + path;
        if (existsSync(file)) {
            unlinkSync(file);
        }
        let request: Electron.ClientRequest = net.request({
            url: Swordfish.downloadLink,
            session: session.defaultSession
        });
        Swordfish.mainWindow.webContents.send('set-status', 'Downloading...');
        Swordfish.updatesWindow.close();
        request.on('response', (response: IncomingMessage) => {
            let fileSize: number = Number.parseInt(response.headers['content-length'] as string);
            let received: number = 0;
            response.on('data', (chunk: Buffer) => {
                received += chunk.length;
                if (process.platform === 'win32' || process.platform === 'darwin') {
                    Swordfish.mainWindow.setProgressBar(received / fileSize);
                }
                Swordfish.mainWindow.webContents.send('set-status', 'Downloaded: ' + Math.trunc(received * 100 / fileSize) + '%');
                appendFileSync(file, chunk);
            });
            response.on('end', () => {
                Swordfish.mainWindow.webContents.send('set-status', '');
                dialog.showMessageBox({
                    type: 'info',
                    message: 'Update downloaded'
                });
                if (process.platform === 'win32' || process.platform === 'darwin') {
                    Swordfish.mainWindow.setProgressBar(0);
                    shell.openPath(file).then(() => {
                        app.quit();
                    }).catch((reason: string) => {
                        dialog.showErrorBox('Error', reason);
                    });
                }
                if (process.platform === 'linux') {
                    shell.showItemInFolder(file);
                }
            });
            response.on('error', (error: Error) => {
                Swordfish.mainWindow.webContents.send('set-status', '');
                dialog.showErrorBox('Error', error.message);
                if (process.platform === 'win32' || process.platform === 'darwin') {
                    Swordfish.mainWindow.setProgressBar(0);
                }
            });
        });
        request.end();
    }

    static showGettingStarted(): void {
        Swordfish.gettingStartedWindow = new BrowserWindow({
            parent: Swordfish.mainWindow,
            width: 740,
            height: 540,
            minimizable: false,
            maximizable: false,
            resizable: false,
            modal: false,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        Swordfish.gettingStartedWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'gettingStarted.html');
        let fileUrl: URL = new URL('file://' + filePath);
        Swordfish.gettingStartedWindow.loadURL(fileUrl.href);
        Swordfish.gettingStartedWindow.once('ready-to-show', () => {
            Swordfish.gettingStartedWindow.show();
        });
        this.gettingStartedWindow.on('close', () => {
            this.mainWindow.focus();
        });
        Swordfish.setLocation(this.gettingStartedWindow, 'gettingStarted.html');
    }

    static getXMLFilters(event: IpcMainEvent): void {
        this.sendRequest('/services/xmlFilters', { path: app.getAppPath() },
            (data: any) => {
                if (data.status === 'Success') {
                    event.sender.send('xmlFilters', data);
                } else {
                    Swordfish.showMessage({ type: 'error', message: data.reason, parent: 'preferences' });
                }
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason, parent: 'preferences' });
            }
        );
    }

    static editXmlFilter(arg: any): void {
        Swordfish.xmlFilter = arg.file;
        Swordfish.editXmlFilterWindow = new BrowserWindow({
            parent: Swordfish.preferencesWindow,
            width: 800,
            height: 405,
            minimizable: false,
            maximizable: false,
            resizable: true,
            modal: false,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        Swordfish.editXmlFilterWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'filterConfig.html');
        let fileUrl: URL = new URL('file://' + filePath);
        Swordfish.editXmlFilterWindow.loadURL(fileUrl.href);
        Swordfish.editXmlFilterWindow.once('ready-to-show', () => {
            Swordfish.editXmlFilterWindow.show();
        });
        this.editXmlFilterWindow.on('close', () => {
            this.preferencesWindow.focus();
        });
        Swordfish.setLocation(this.editXmlFilterWindow, 'filterConfig.html');
    }

    static getXmlFilterData(event: IpcMainEvent): void {
        this.sendRequest('/services/filterData', { path: app.getAppPath(), file: Swordfish.xmlFilter },
            (data: any) => {
                if (data.status === 'Success') {
                    data.filter = Swordfish.xmlFilter;
                    event.sender.send('set-filterData', data);
                } else {
                    Swordfish.showMessage({ type: 'error', message: data.reason, parent: 'filterConfig' });
                }
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason, parent: 'filterConfig' });
            }
        );
    }

    static getElementConfig(event: IpcMainEvent): void {
        event.sender.send('set-elementConfig', Swordfish.filterElement);
    }

    static saveElementConfig(arg: any): void {
        arg.path = app.getAppPath();
        this.sendRequest('/services/saveElement', arg,
            (data: any) => {
                if (data.status === 'Success') {
                    Swordfish.configElementWindow.close();
                    Swordfish.editXmlFilterWindow.webContents.send('refresh');
                } else {
                    Swordfish.showMessage({ type: 'error', message: data.reason, parent: 'elementConfig' });
                }
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason, parent: 'elementConfig' });
            }
        );
    }

    static removeElements(arg: any): void {
        arg.path = app.getAppPath();
        dialog.showMessageBox(Swordfish.mainWindow, {
            type: 'question',
            message: 'Remove selected elements?',
            buttons: ['Yes', 'No']
        }).then((selection: Electron.MessageBoxReturnValue) => {
            if (selection.response === 0) {
                this.sendRequest('/services/removeElements', arg,
                    (data: any) => {
                        if (data.status === 'Success') {
                            Swordfish.editXmlFilterWindow.webContents.send('refresh');
                        } else {
                            Swordfish.showMessage({ type: 'error', message: data.reason, parent: 'filterConfig' });
                        }
                    },
                    (reason: string) => {
                        Swordfish.showMessage({ type: 'error', message: reason, parent: 'filterConfig' });
                    }
                );
            }
        });
    }

    static addElement(arg: any): void {
        Swordfish.filterElement = arg;
        Swordfish.configElementWindow = new BrowserWindow({
            parent: Swordfish.editXmlFilterWindow,
            width: 390,
            height: 310,
            minimizable: false,
            maximizable: false,
            resizable: false,
            modal: false,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        Swordfish.configElementWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'elementConfig.html');
        let fileUrl: URL = new URL('file://' + filePath);
        Swordfish.configElementWindow.loadURL(fileUrl.href);
        Swordfish.configElementWindow.once('ready-to-show', () => {
            Swordfish.configElementWindow.show();
        });
        this.configElementWindow.on('close', () => {
            this.editXmlFilterWindow.focus();
        });
        Swordfish.setLocation(this.configElementWindow, 'elementConfig.html');
    }

    static importXmlFilter(event: IpcMainEvent): void {
        dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: 'XML Document', extensions: ['xml'] }
            ]
        }).then((value: Electron.OpenDialogReturnValue) => {
            if (!value.canceled) {
                let selectedFile: string = value.filePaths[0];
                this.sendRequest('/services/importFilter', { path: app.getAppPath(), file: selectedFile },
                    (data: any) => {
                        if (data.status === 'Success') {
                            Swordfish.getXMLFilters(event);
                            this.showMessage({ type: 'info', message: 'Configuration file imported', parent: 'preferences' });
                        } else {
                            Swordfish.showMessage({ type: 'error', message: data.reason, parent: 'preferences' });
                        }
                    },
                    (reason: string) => {
                        Swordfish.showMessage({ type: 'error', message: reason, parent: 'preferences' });
                    }
                );
            } else {
                Swordfish.preferencesWindow.focus();
            }
        }).catch((error: Error) => {
            console.error(error.message);
        });
    }

    static removeXmlFilters(event: IpcMainEvent, arg: any): void {
        dialog.showMessageBox(Swordfish.mainWindow, {
            type: 'question',
            message: 'Remove selected configuration files?',
            buttons: ['Yes', 'No']
        }).then((selection: Electron.MessageBoxReturnValue) => {
            if (selection.response === 0) {
                this.sendRequest('/services/removeFilters', { path: app.getAppPath(), files: arg.files },
                    (data: any) => {
                        if (data.status === 'Success') {
                            Swordfish.getXMLFilters(event);
                        } else {
                            Swordfish.showMessage({ type: 'error', message: data.reason, parent: 'preferences' });
                        }
                    },
                    (reason: string) => {
                        Swordfish.showMessage({ type: 'error', message: reason, parent: 'preferences' });
                    }
                );
            }
        });
    }

    static exportXmlFilters(arg: any): void {
        dialog.showOpenDialog(Swordfish.mainWindow, {
            title: 'Export XML Filter Configurations',
            properties: ['createDirectory', 'openDirectory']
        }).then((value: Electron.OpenDialogReturnValue) => {
            if (!value.canceled) {
                Swordfish.sendRequest('/services/exportFilters', { path: app.getAppPath(), files: arg.files, folder: value.filePaths[0] },
                    (data: any) => {
                        if (data.status === 'Success') {
                            this.showMessage({ type: 'info', message: 'Configuration files exported', parent: 'preferences' });
                        } else {
                            Swordfish.showMessage({ type: 'error', message: data.reason, parent: 'preferences' });
                        }
                    },
                    (reason: string) => {
                        Swordfish.showMessage({ type: 'error', message: reason });
                    }
                );
            } else {
                Swordfish.preferencesWindow.focus();
            }
        }).catch((error: Error) => {
            console.error(error.message);
        });
    }

    static showAddXmlConfiguration(event: IpcMainEvent): void {
        Swordfish.addConfigurationEvent = event;
        Swordfish.addXmlConfigurationWindow = new BrowserWindow({
            parent: Swordfish.preferencesWindow,
            width: 450,
            height: 150,
            minimizable: false,
            maximizable: false,
            resizable: false,
            modal: false,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        Swordfish.addXmlConfigurationWindow.setMenu(null);
        let filePath: string = Swordfish.path.join(app.getAppPath(), 'html', 'addXmlConfiguration.html');
        let fileUrl: URL = new URL('file://' + filePath);
        Swordfish.addXmlConfigurationWindow.loadURL(fileUrl.href);
        Swordfish.addXmlConfigurationWindow.once('ready-to-show', () => {
            Swordfish.addXmlConfigurationWindow.show();
        });
        this.addXmlConfigurationWindow.on('close', () => {
            this.preferencesWindow.focus();
        });
        Swordfish.setLocation(this.addXmlConfigurationWindow, 'addXmlConfiguration.html');
    }

    static addXmlConfiguration(event: IpcMainEvent, arg: any): void {
        arg.path = app.getAppPath();
        Swordfish.sendRequest('/services/addFilter', arg,
            (data: any) => {
                if (data.status === 'Success') {
                    Swordfish.showMessage({ type: 'info', message: 'Configuration added' });
                    Swordfish.getXMLFilters(Swordfish.addConfigurationEvent);
                    Swordfish.addXmlConfigurationWindow.close();
                    Swordfish.preferencesWindow.focus();
                } else {
                    Swordfish.showMessage({ type: 'error', message: data.reason, parent: 'addConfiguration' });
                }
            },
            (reason: string) => {
                Swordfish.showMessage({ type: 'error', message: reason, parent: 'addConfiguration' });
            }
        );
    }

    static getSvgIcon(svgName: string): string {
        let svgPath: string = Swordfish.path.join(app.getAppPath(), 'images', svgName);
        let svg: string = '';
        if (existsSync(svgPath)) {
            svg = readFileSync(svgPath, 'utf8');
        }
        return svg;
    }


    static setLocation(window: BrowserWindow, key: string): void {
        if (Swordfish.locations.hasLocation(key)) {
            let position: Point | undefined = Swordfish.locations.getLocation(key);
            if (position) {
                window.setPosition(position.x, position.y, true);
            }
        }
        window.addListener('moved', () => {
            let bounds: Rectangle = window.getBounds();
            Swordfish.locations.setLocation(key, bounds.x, bounds.y);
        });
    }

    static monitorSize(window: BrowserWindow, key: string): void {
        if (Swordfish.sizes.hasSize(key)) {
            let size: Rect | undefined = Swordfish.sizes.getSize(key);
            if (size) {
                window.setContentSize(size.width, size.height, true);
            }
        }
        window.addListener('resized', () => {
            let bounds: number[] = window.getContentSize();
            Swordfish.sizes.setSize(key, bounds[0], bounds[1]);
        });
    }

    static startup(): void {
        Swordfish.spellCheckerLanguages = Swordfish.mainWindow.webContents.session.availableSpellCheckerLanguages;
        if (Swordfish.currentPreferences.srcLang === 'none') {
            Swordfish.getDefaultLanguages();
        }
        if (Swordfish.currentPreferences.showGuide === undefined) {
            Swordfish.currentPreferences.showGuide = true;
        }
        if (Swordfish.currentPreferences.showGuide) {
            Swordfish.showGettingStarted();
        }
        if (process.platform === 'darwin' && app.runningUnderARM64Translation) {
            Swordfish.showMessage({
                type: 'warning',
                message: 'You are running a version for Macs with Intel processors on a Mac with Apple chipset.'
            });
        }
        setTimeout(() => {
            Swordfish.checkUpdates(true);
        }, 2000);
    }
}

try {
    new Swordfish();
} catch (e) {
    console.error("Unable to instantiate Swordfish();");
}
