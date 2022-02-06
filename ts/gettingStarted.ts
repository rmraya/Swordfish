/*******************************************************************************
 * Copyright (c) 2007-2022 Maxprograms.
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
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => { KeyboardHandler.keyListener(event); });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-getting-started');
            }
        });
        document.getElementById('supportGroup').addEventListener('click', () => { this.electron.ipcRenderer.send('show-support'); });
        document.getElementById('userGuide').addEventListener('click', () => { this.electron.ipcRenderer.send('show-help'); });

        let showWindow: HTMLInputElement = document.getElementById('showWindow') as HTMLInputElement;
        showWindow.addEventListener('click', () => {
            this.electron.ipcRenderer.send('show-getting-started', { showGuide: showWindow.checked });
        });
        this.electron.ipcRenderer.send('get-show guide');
        this.electron.ipcRenderer.on('set-show guide', (event: Electron.IpcRendererEvent, arg: any) => {
            showWindow.checked = arg.showGuide;
        });
        this.electron.ipcRenderer.send('getting-started-height', { width: document.body.clientWidth, height: document.body.clientHeight });
        document.getElementById('container').focus();
    }
}

new GettingStarted();