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
import { app, BrowserWindow, dialog, ipcMain, Menu, MenuItem, shell, webContents, nativeTheme } from "electron";
import { existsSync, mkdirSync, readFile, readFileSync, writeFile, writeFileSync } from "fs";
import { ClientRequest, request, IncomingMessage } from "http";
const https = require('https');

app.allowRendererProcessReuse = true;

var mainWindow: BrowserWindow;
var contents: webContents;
var javapath: string = app.getAppPath() + '/bin/java';
var classpath = 'lib/h2-1.4.200.jar:lib/mariadb-java-client-2.4.3.jar';
var appHome: string = app.getPath('appData') + '/swordfish/';

var currentDefaults: any;

var saved: boolean = true;
var stopping: boolean = false;

var currentTheme: string;


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

if (process.platform == 'win32') {
    javapath = app.getAppPath() + '\\bin\\java.exe';
    classpath = 'lib\h2-1.4.200.jar;lib\mariadb-java-client-2.4.3.jar';
    appHome = app.getPath('appData') + '\\swordfish\\';
}

if (!existsSync(appHome)) {
    mkdirSync(appHome, { recursive: true });
}

const ls = spawn(javapath, ['-cp', classpath, '--module-path', 'lib', '-m', 'swordfish/com.maxprograms.swordfish.TmsServer', '-port', '8070'], { cwd: app.getAppPath() });

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

app.on('open-file', function (event, filePath) {
    event.preventDefault();
    openFile(filePath);
});

loadDefaults();
loadPreferences();

app.on('ready', function () {
    createWindow();
    mainWindow.loadURL('file://' + app.getAppPath() + '/index.html');
    mainWindow.on('resize', function () {
        saveDefaults();
    });
    mainWindow.on('move', function () {
        saveDefaults();
    });
    mainWindow.show();
    // contents.openDevTools();
    setTheme();
    checkUpdates(true);
});

app.on('quit', function () {
    stopServer();
});

app.on('window-all-closed', function () {
    stopServer();
    app.quit();
});

if (process.platform === 'darwin') {
    app.on('open-file', function (event, path) {
        event.preventDefault();
        openFile(path);
    });
}

function createWindow(): void {
    mainWindow = new BrowserWindow({
        title: 'Swordfish',
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
}

function stopServer() {
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
    var defaults = mainWindow.getBounds();
    if (!currentDefaults) {
        return;
    }
    if (defaults.width === currentDefaults.width && defaults.height === currentDefaults.height && defaults.x === currentDefaults.x) {
        return;
    }
    if (defaults.width === 800 && defaults.height === 600) {
        return;
    }
    writeFileSync(appHome + 'defaults.json', JSON.stringify(defaults));
}

function loadPreferences(): void {
    // TODO
}

function openFile(file: string) {
    // TODO
}

function saveFile() {
    // TODO
}

function setTheme(): void {
    contents.send('set-theme', currentTheme);
}

nativeTheme.on('updated', () => {
    loadPreferences();
    setTheme();
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