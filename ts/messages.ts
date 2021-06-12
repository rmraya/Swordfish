/*******************************************************************************
 * Copyright (c) 2007-2021 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/

class Messages {

    electron = require('electron');

    static SVG_ALERT: string = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24"  stroke-linecap="round" stroke-linejoin="round" ><path fill="none" stroke-width="2" d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13" stroke-width="2"/><line x1="12" y1="17" x2="12.01" y2="17" stroke-width="2"></svg>';
    static SVG_INFO: string = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24"   stroke-linecap="round" stroke-linejoin="round" ><circle cx="12" cy="12" r="10" fill="none" stroke-width="2"/><line x1="12" y1="16" x2="12" y2="12" stroke-width="2"/><line x1="12" y1="8" x2="12.01" y2="8" stroke-width="2"/></svg>';
    static SVG_ERROR: string = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24"  stroke-linecap="round" stroke-linejoin="round" ><polygon fill="none" stroke-width="2" points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12" stroke-width="2"/><line x1="12" y1="16" x2="12.01" y2="16" stroke-width="2"/></svg>';

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
        });
        this.electron.ipcRenderer.send('get-message-param');
        this.electron.ipcRenderer.on('set-message', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setMessage(arg);
        });
        document.getElementById('closeButton').addEventListener('click', () => {
            this.electron.ipcRenderer.send('close-messages');
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape' || event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.electron.ipcRenderer.send('close-messages');
            }
        });
        let body: HTMLBodyElement = document.getElementById('body') as HTMLBodyElement;
        this.electron.ipcRenderer.send('messages-height', { width: body.clientWidth, height: body.clientHeight });
    }

    setMessage(arg: any): void {
        if (arg.type === 'warning') {
            document.getElementById('icon').innerHTML = Messages.SVG_ALERT;
            document.getElementById('title').innerText = 'Warning';
        } else if (arg.type === 'error') {
            document.getElementById('icon').innerHTML = Messages.SVG_ERROR;
            document.getElementById('title').innerText = 'Error';
        } else {
            document.getElementById('icon').innerHTML = Messages.SVG_INFO;
            document.getElementById('title').innerText = 'Information';
        }
        if (arg.title) {
            document.getElementById('title').innerText = arg.title;
        }
        document.getElementById('message').innerHTML = arg.message;
        let body: HTMLBodyElement = document.getElementById('body') as HTMLBodyElement;
        this.electron.ipcRenderer.send('messages-height', { width: body.clientWidth, height: body.clientHeight });
    }
}

new Messages();