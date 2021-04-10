/*****************************************************************************
Copyright (c) 2007-2021 - Maxprograms,  http://www.maxprograms.com/

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

class ServerSettings {

    electron = require('electron');

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => { KeyboardHandler.keyListener(event); });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.browseServer();
            }
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-serverSettings');
            }
        });
        document.getElementById('browseButton').addEventListener('click', () => { this.browseServer(); });
        let body: HTMLBodyElement = document.getElementById('body') as HTMLBodyElement;
        this.electron.ipcRenderer.send('serverSettings-height', { width: body.clientWidth, height: body.clientHeight });
    }

    browseServer(): void {
        let server: string = (document.getElementById('serverURL') as HTMLInputElement).value;
        if (server === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Enter server URL', parent: 'serverSettings' });
            return;
        }
        if (!server.startsWith('https:')) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Server URL must start with "https"', parent: 'serverSettings' });
            return;
        }
        let user: string = (document.getElementById('userInput') as HTMLInputElement).value;
        if (user === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Enter username', parent: 'serverSettings' });
            return;
        }
        let password: string = (document.getElementById('passwordInput') as HTMLInputElement).value;
        if (password === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Enter password', parent: 'serverSettings' });
            return;
        }
        this.electron.ipcRenderer.send('browse-server', { server: server, user: user, password: password });
    }
}

new ServerSettings();