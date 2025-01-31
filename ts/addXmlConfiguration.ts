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

class AddXmlFilterConfiguration {

    electron = require('electron');

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-addXmlConfiguration');
            }
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.addConfiguration();
            }
        });
        document.getElementById('add').addEventListener('click', () => { this.addConfiguration(); });
        (document.getElementById('rootName') as HTMLInputElement).focus();
        setTimeout(() => {
            this.electron.ipcRenderer.send('set-height', { window: 'addXmlConfiguration', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    addConfiguration(): void {
        let rootName: string = (document.getElementById('rootName') as HTMLInputElement).value;
        if (rootName === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Enter root element name', parent: 'addConfiguration' });
            return;
        }
        this.electron.ipcRenderer.send('add-xmlConfigurationFile', { root: rootName });
    }
}

