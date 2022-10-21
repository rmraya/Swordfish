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

class SystemInformation {

    electron = require('electron');

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.send('get-version');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
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
        this.electron.ipcRenderer.send('systemInfo-height', { width: document.body.clientWidth, height: (document.body.clientHeight + 20) });
    }

    setInfo(info: any) {
        document.getElementById('swordfish').innerText = info.swordfish;
        document.getElementById('openxliff').innerText = info.openxliff;
        document.getElementById('java').innerText = info.java;
        document.getElementById('electron').innerText = info.electron;
    }
}
