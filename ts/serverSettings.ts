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

class ServerSettings {

    electron = require('electron');

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.browseServer();
            }
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-serverSettings');
            }
        });
        (document.getElementById('browseButton') as HTMLButtonElement).addEventListener('click', () => { this.browseServer(); });
        setTimeout(() => {
            this.electron.ipcRenderer.send('set-height', { window: 'serverSettings', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
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
