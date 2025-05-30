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

class SystemInformation {

    electron = require('electron');

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.send('get-version');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        this.electron.ipcRenderer.send('get-system-info');
        this.electron.ipcRenderer.on('set-system-info', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setInfo(arg);
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-systemInfo');
            }
        });
        setTimeout(() => {
            this.electron.ipcRenderer.send('set-height', { window: 'systemInfo', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    setInfo(info: any) {
        (document.getElementById('swordfish') as HTMLTableCellElement).innerText = info.swordfish;
        (document.getElementById('openxliff') as HTMLTableCellElement).innerText = info.openxliff;
        (document.getElementById('xmljava') as HTMLTableCellElement).innerText = info.xmljava;
        (document.getElementById('java') as HTMLTableCellElement).innerText = info.java;
        (document.getElementById('electron') as HTMLTableCellElement).innerText = info.electron;
    }
}
