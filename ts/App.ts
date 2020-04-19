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
import { execFileSync, spawn } from "child_process";
import { app, BrowserWindow, dialog, ipcMain, Menu, MenuItem, shell, webContents, nativeTheme, Rectangle, IpcMainEvent } from "electron";
import { existsSync, mkdirSync, readFile, readFileSync, writeFile, writeFileSync } from "fs";
import { ClientRequest, request, IncomingMessage } from "http";
import https = require('https');

app.allowRendererProcessReuse = true;

var mainWindow: BrowserWindow;
var settingsWindow: BrowserWindow;
var aboutWindow: BrowserWindow;
var licensesWindow: BrowserWindow;
var addMemoryWindow: BrowserWindow;
var addProjectWindow: BrowserWindow;

var contents: webContents;
var javapath: string = app.getAppPath() + '/bin/java';
var classpath: string = 'lib/h2-1.4.200.jar:lib/mariadb-java-client-2.4.3.jar';
var appHome: string = app.getPath('appData') + '/swordfish/';
var verticalPadding: number = 30;

var currentDefaults: Rectangle;
var currentPreferences: any;
var currentTheme: string;

var saved: boolean = true;
var stopping: boolean = false;

const SUCCESS: string = 'Success';
const LOADING: string = 'Loading';
const COMPLETED: string = 'Completed';
const ERROR: string = 'Error';
const SAVING: string = 'Saving';
const PROCESSING: string = 'Processing';

if (!app.requestSingleInstanceLock()) {
    app.quit();
} else {
    if (mainWindow) {
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow.isMinimized()) {
            mainWindow.restore();
        }
        mainWindow.focus();
    }
}

// TODO remove H@ and MariaDB driver or add their licenses 

if (process.platform == 'win32') {
    javapath = app.getAppPath() + '\\bin\\java.exe';
    classpath = 'lib\\h2-1.4.200.jar;lib\\mariadb-java-client-2.4.3.jar';
    appHome = app.getPath('appData') + '\\Swordfish\\';
    verticalPadding = 45;
}

if (!existsSync(appHome)) {
    mkdirSync(appHome, { recursive: true });
}

const ls = spawn(javapath, ['-cp', classpath, '--module-path', 'lib', '-m', 'swordfish/com.maxprograms.swordfish.TmsServer', '-port', '8070', '-debug'], { cwd: app.getAppPath() });

ls.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
});

ls.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
});

ls.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
});

var ck: Buffer = execFileSync('bin/java', ['--module-path', 'lib', '-m', 'openxliff/com.maxprograms.server.CheckURL', 'http://localhost:8070/TMSServer'], { cwd: app.getAppPath() });
console.log(ck.toString());

app.on('open-file', (event, filePath) => {
    event.preventDefault();
    openFile(filePath);
});

loadDefaults();
loadPreferences();

app.on('ready', () => {
    createWindow();
    mainWindow.loadURL('file://' + app.getAppPath() + '/index.html');
    mainWindow.on('resize', () => {
        saveDefaults();
    });
    mainWindow.on('move', () => {
        saveDefaults();
    });
    mainWindow.once('ready-to-show', () => {
        setTheme();
        if (currentDefaults) {
            mainWindow.setBounds(currentDefaults);
        }
        mainWindow.show();    
    });
    checkUpdates(true);
});

app.on('quit', () => {
    stopServer();
});

app.on('window-all-closed', () => {
    stopServer();
    app.quit();
});

if (process.platform === 'darwin') {
    app.on('open-file', (event, path) => {
        event.preventDefault();
        openFile(path);
    });
}

function createWindow(): void {
    mainWindow = new BrowserWindow({
        title: app.name,
        width: currentDefaults.width,
        height: currentDefaults.height,
        x: currentDefaults.x,
        y: currentDefaults.y,
        useContentSize: true,
        webPreferences: {
            nodeIntegration: true
        },
        show: false,
        icon: 'icons/icon.png'
    });
    contents = mainWindow.webContents;
    var fileMenu: Menu = Menu.buildFromTemplate([
    ]);
    var editMenu: Menu = Menu.buildFromTemplate([
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', click: function () { contents.undo(); } },
        new MenuItem({ type: 'separator' }),
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', click: function () { contents.cut(); } },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', click: function () { contents.copy(); } },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', click: function () { contents.paste(); } },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', click: function () { contents.selectAll(); } },
        new MenuItem({ type: 'separator' }),
        { label: 'Confirm Edit', accelerator: 'Alt+Enter', click: function () { saveEdits(); } },
        { label: 'Cancel Edit', accelerator: 'Esc', click: function () { cancelEdit(); } },
        new MenuItem({ type: 'separator' }),
        { label: 'Replace Text...', accelerator: 'CmdOrCtrl+F', click: function () { replaceText(); } }
    ]);
    var viewMenu: Menu = Menu.buildFromTemplate([
        { label: 'Projects', accelerator: 'CmdOrCtrl+Alt+1', click: function () { viewProjects(); } },
        { label: 'Memories', accelerator: 'CmdOrCtrl+Alt+2', click: function () { viewMemories(); } },
        { label: 'Glossaries', accelerator: 'CmdOrCtrl+Alt+3', click: function () { viewGlossaries(); } },
        new MenuItem({ type: 'separator' }),
        new MenuItem({ label: 'Toggle Full Screen', role: 'togglefullscreen' }),
        new MenuItem({ label: 'Toggle Development Tools', accelerator: 'F12', role: 'toggleDevTools' }),
    ]);
    var projectsMenu: Menu = Menu.buildFromTemplate([
        { label: 'Add Project', click: function () { addProject(); } }
    ]);
    var memoriesMenu: Menu = Menu.buildFromTemplate([
        { label: 'Add Memory', click: function () { addMemory(); } }
    ]);
    var glossariesMenu: Menu = Menu.buildFromTemplate([]);
    var helpMenu: Menu = Menu.buildFromTemplate([
        { label: 'Swordfish User Guide', accelerator: 'F1', click: function () { showHelp(); } },
        new MenuItem({ type: 'separator' }),
        { label: 'Check for Updates...', click: function () { checkUpdates(false); } },
        { label: 'View Licenses', click: function () { showLicenses(); } },
        new MenuItem({ type: 'separator' }),
        { label: 'Release History', click: function () { showReleaseHistory(); } },
        { label: 'Support Group', click: function () { showSupportGroup(); } }
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
            new MenuItem({ label: 'About...', click: function () { showAbout(); } }),
            new MenuItem({
                label: 'Preferences...', submenu: [
                    { label: 'Settings', accelerator: 'Cmd+,', click: function () { showSettings(); } }
                ]
            }),
            new MenuItem({ type: 'separator' }),
            new MenuItem({
                label: 'Services', role: 'services', submenu: [
                    { label: 'No Services Apply', enabled: false }
                ]
            }),
            new MenuItem({ type: 'separator' }),
            new MenuItem({ label: 'Quit Swordfish', accelerator: 'Cmd+Q', role: 'quit', click: function () { app.quit(); } })
        ]);
        template.unshift(new MenuItem({ label: 'Swordfish', role: 'appMenu', submenu: appleMenu }));
    } else {
        var help: MenuItem = template.pop();
        template.push(new MenuItem({
            label: '&Settings', submenu: [
                { label: 'Preferences', click: function () { showSettings(); } }
            ]
        }));
        template.push(help);
    }
    if (process.platform == 'win32') {
        template[0].submenu.append(new MenuItem({ type: 'separator' }));
        template[0].submenu.append(new MenuItem({ label: 'Exit', accelerator: 'Alt+F4', role: 'quit', click: function () { app.quit(); } }));
        template[7].submenu.append(new MenuItem({ type: 'separator' }));
        template[7].submenu.append(new MenuItem({ label: 'About...', click: function () { showAbout(); } }));
    }
    if (process.platform === 'linux') {
        template[0].submenu.append(new MenuItem({ type: 'separator' }));
        template[0].submenu.append(new MenuItem({ label: 'Quit', accelerator: 'Ctrl+Q', role: 'quit', click: function () { app.quit(); } }));
        template[7].submenu.append(new MenuItem({ type: 'separator' }));
        template[7].submenu.append(new MenuItem({ label: 'About...', click: function () { showAbout(); } }));
    }
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function stopServer(): void {
    if (!stopping) {
        stopping = true;
        if (!saved) {
            let response = dialog.showMessageBoxSync(mainWindow, { type: 'question', message: 'Save changes?', buttons: ['Yes', 'No'] });
            if (response === 0) {
                saveFile();
            }
        }
        ls.kill();
    }
}

function loadDefaults(): void {
    currentDefaults = { width: 900, height: 700, x: 0, y: 0 };
    if (existsSync(appHome + 'defaults.json')) {
        try {
            var data: Buffer = readFileSync(appHome + 'defaults.json');
            currentDefaults = JSON.parse(data.toString());
        } catch (err) {
            console.log(err);
        }
    }
}

function saveDefaults(): void {
    var defaults: Rectangle = mainWindow.getBounds();
    if (!currentDefaults) {
        return;
    }
    if (defaults.width === currentDefaults.width
        && defaults.height === currentDefaults.height
        && defaults.x === currentDefaults.x
        && defaults.y === currentDefaults.y) {
        return;
    }
    writeFileSync(appHome + 'defaults.json', JSON.stringify(defaults));
}

function loadPreferences(): void {
    currentPreferences = { theme: 'system' };
    if (existsSync(appHome + 'preferences.json')) {
        try {
            var data: Buffer = readFileSync(appHome + 'preferences.json');
            currentPreferences = JSON.parse(data.toString());
        } catch (err) {
            console.log(err);
        }
    }
    if (currentPreferences.theme === 'system') {
        if (nativeTheme.shouldUseDarkColors) {
            currentTheme = app.getAppPath() + '/css/dark.css';
            nativeTheme.themeSource = 'dark';
        } else {
            currentTheme = app.getAppPath() + '/css/light.css';
            nativeTheme.themeSource = 'light';
        }
    }
    if (currentPreferences.theme === 'dark') {
        currentTheme = app.getAppPath() + '/css/dark.css';
        nativeTheme.themeSource = 'dark';
    }
    if (currentPreferences.theme === 'light') {
        currentTheme = app.getAppPath() + '/css/light.css';
        nativeTheme.themeSource = 'light';
    }
}

function savePreferences(): void {
    writeFileSync(appHome + 'preferences.json', JSON.stringify(currentPreferences));
    nativeTheme.themeSource = currentPreferences.theme;
}

ipcMain.on('save-preferences', (event, arg) => {
    settingsWindow.close();
    currentPreferences.theme = arg.theme;
    savePreferences();
});

function openFile(file: string): void {
    // TODO
}

function saveFile(): void {
    // TODO
}

function saveEdits(): void {
    // TODO
}

function cancelEdit(): void {
    // TODO
}

function replaceText(): void {
    // TODO
}

function viewProjects(): void {
    contents.send('view-projects');
}

ipcMain.on('get-projects', (event, arg) => {
    contents.send('start-waiting');
    contents.send('set-status', 'Loading projects');
    sendRequest('/projects/list', {},
        function success(json: any) {
            contents.send('set-status', '');
            contents.send('end-waiting');
            if (json.status === SUCCESS) {
                event.sender.send('set-projects', json.projects);
            } else {
                dialog.showMessageBox({ type: 'error', message: json.reason });
            }
        },
        function error(data: string) {
            contents.send('set-status', '');
            dialog.showMessageBox({ type: 'error', message: data });
        }
    );
});

ipcMain.on('show-add-project', () => {
    addProject();
});

function addProject() {
    addProjectWindow = new BrowserWindow({
        parent: mainWindow,
        width: getWidth('addProjectWindow'),
        // height: getHeight('addProjectWindow'),
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
    addProjectWindow.setMenu(null);
    addProjectWindow.loadURL('file://' + app.getAppPath() + '/html/addProject.html');
    addProjectWindow.once('ready-to-show', (event: IpcMainEvent) => {
        event.sender.send('get-height');
        addProjectWindow.show();
    });
 
}

ipcMain.on('add-project-height', (event, arg) => {
    let rect: Rectangle = addProjectWindow.getBounds();
    rect.height = arg.height + verticalPadding;
    addProjectWindow.setBounds(rect);
});

function viewMemories(): void {
    contents.send('view-memories');
}

ipcMain.on('show-add-memory', () => {
    addMemory();
});

function addMemory() {
    addMemoryWindow = new BrowserWindow({
        parent: mainWindow,
        width: getWidth('addMemoryWindow'),
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
    addMemoryWindow.setMenu(null);
    addMemoryWindow.loadURL('file://' + app.getAppPath() + '/html/addMemory.html');
    addMemoryWindow.once('ready-to-show', (event: IpcMainEvent) => {
        event.sender.send('get-height');
        addMemoryWindow.show();
    });    
}

ipcMain.on('add-memory-height', (event, arg) => {
    let rect: Rectangle = addMemoryWindow.getBounds();
    rect.height = arg.height + verticalPadding;
    addMemoryWindow.setBounds(rect);
});

ipcMain.on('get-clients', (event, arg) => {
    // TODO
});

ipcMain.on('get-subjects', (event, arg) => {
    // TODO
});

function viewGlossaries(): void {
    contents.send('view-glossaries');
}

function sendRequest(url: string, json: any, success: any, error: any) {
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
            res.on('end', function () {
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

function showHelp() {
    shell.openExternal('file://' + app.getAppPath() + '/swordfish.pdf',
        { activate: true, workingDirectory: app.getAppPath() }
    ).catch((error: Error) => {
        dialog.showErrorBox('Error', error.message);
    });
}

ipcMain.on('get-version', (event, arg) => {
    event.sender.send('set-version', app.name + ' ' + app.getVersion());
});

function showAbout() {
    aboutWindow = new BrowserWindow({
        parent: mainWindow,
        width: getWidth('aboutWindow'),
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
    aboutWindow.setMenu(null);
    aboutWindow.loadURL('file://' + app.getAppPath() + '/html/about.html');
    aboutWindow.once('ready-to-show', (event: IpcMainEvent) => {
        event.sender.send('get-height');
        aboutWindow.show();
    });
    
}

ipcMain.on('about-height', (event, arg) => {
    let rect: Rectangle = aboutWindow.getBounds();
    rect.height = arg.height + verticalPadding;
    aboutWindow.setBounds(rect);
});

function showSettings(): void {
    settingsWindow = new BrowserWindow({
        parent: mainWindow,
        width: getWidth('settingsWindow'),
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
    settingsWindow.setMenu(null);
    settingsWindow.loadURL('file://' + app.getAppPath() + '/html/preferences.html');
    settingsWindow.once('ready-to-show', (event: IpcMainEvent) => {
        event.sender.send('get-height');
        settingsWindow.show();
    });
}

ipcMain.on('settings-height', (event, arg) => {
    let rect: Rectangle = settingsWindow.getBounds();
    rect.height = arg.height + verticalPadding;
    settingsWindow.setBounds(rect);
});

ipcMain.on('get-preferences', (event, arg) => {
    event.sender.send('set-preferences', currentPreferences);
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
        parent: mainWindow,
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

function showLicenses() {
    licensesWindow = new BrowserWindow({
        parent: mainWindow,
        width: getWidth('licensesWindow'),
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
    licensesWindow.setMenu(null);
    licensesWindow.loadURL('file://' + app.getAppPath() + '/html/licenses.html');
    licensesWindow.once('ready-to-show', (event: IpcMainEvent) => {
        event.sender.send('get-height');
        licensesWindow.show();
    });    
}

ipcMain.on('licenses-height', (event, arg) => {
    let rect: Rectangle = licensesWindow.getBounds();
    rect.height = arg.height + verticalPadding + 30; 
    licensesWindow.setBounds(rect);
});

ipcMain.on('licenses-clicked', () => {
    showLicenses();
});

function showReleaseHistory(): void {
    shell.openExternal('https://www.maxprograms.com/products/swfishlog.html');
}

function showSupportGroup(): void {
    shell.openExternal('https://groups.io/g/maxprograms/');
}

function setTheme(): void {
    contents.send('set-theme', currentTheme);
}

nativeTheme.on('updated', () => {
    loadPreferences();
    setTheme();
});

ipcMain.on('get-theme', (event, arg) => {
    event.sender.send('set-theme', currentTheme);
});

function checkUpdates(silent: boolean): void {
    https.get('https://raw.githubusercontent.com/rmraya/Swordfish/master/package.json', (res: IncomingMessage) => {
        if (res.statusCode === 200) {
            let rawData = '';
            res.on('data', (chunk: string) => {
                rawData += chunk;
            });
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(rawData);
                    if (app.getVersion() !== parsedData.version) {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'Updates Available',
                            message: 'Version ' + parsedData.version + ' is available'
                        });
                    } else {
                        if (!silent) {
                            dialog.showMessageBox(mainWindow, {
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

function getWidth(window: string): number {
    switch (process.platform) {
        case 'win32': {
            switch (window) {
                case 'aboutWindow': { return 495; }
                case 'licensesWindow': { return 430; }
                case 'settingsWindow': { return 400; }
                case 'addMemoryWindow': { return 450; }
                case 'addProjectWindow': { return 750; }
            }
            break;
        }
        case 'darwin': {
            switch (window) {
                case 'aboutWindow': { return 495; }
                case 'licensesWindow': { return 430; }
                case 'settingsWindow': { return 400; }
                case 'addMemoryWindow': { return 450; }
                case 'addProjectWindow': { return 750; }
            }
            break;
        }
        case 'linux': {
            switch (window) {
                case 'aboutWindow': { return 495; }
                case 'licensesWindow': { return 430; }
                case 'settingsWindow': { return 400; }
                case 'addMemoryWindow': { return 450; }
                case 'addProjectWindow': { return 750; }
            }
            break;
        }
    }
}