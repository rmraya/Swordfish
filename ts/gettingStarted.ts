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

class GettingStarted {

    electron = require('electron');

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-getting-started');
            }
        });
        (document.getElementById('supportGroup') as HTMLButtonElement).addEventListener('click', () => {
            this.electron.ipcRenderer.send('show-support');
        });
        (document.getElementById('userGuide') as HTMLButtonElement).addEventListener('click', () => {
            this.electron.ipcRenderer.send('show-help');
        });

        let showWindow: HTMLInputElement = document.getElementById('showWindow') as HTMLInputElement;
        showWindow.addEventListener('click', () => {
            this.electron.ipcRenderer.send('show-getting-started', { showGuide: showWindow.checked });
        });
        this.electron.ipcRenderer.send('get-show guide');
        this.electron.ipcRenderer.on('set-show guide', (event: Electron.IpcRendererEvent, arg: any) => {
            showWindow.checked = arg.showGuide;
        });
        (document.getElementById('container') as HTMLDivElement).focus();
        setTimeout(() => {
            this.electron.ipcRenderer.send('set-height', { window: 'gettingStarted', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }
}
