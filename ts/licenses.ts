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

class Licenses {

    electron = require('electron');

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
        });
        document.getElementById('Swordfish').addEventListener('click', () => {
            this.openLicense('Swordfish');
        });
        document.getElementById('electron').addEventListener('click', () => {
            this.openLicense('electron');
        });
        document.getElementById('TypeScript').addEventListener('click', () => {
            this.openLicense('TypeScript');
        });
        document.getElementById('Java').addEventListener('click', () => {
            this.openLicense('Java');
        });
        document.getElementById('OpenXLIFF').addEventListener('click', () => {
            this.openLicense('OpenXLIFF');
        });
        document.getElementById('H2').addEventListener('click', () => {
            this.openLicense('H2');
        });
        document.getElementById('JSON').addEventListener('click', () => {
            this.openLicense('JSON');
        });
        document.getElementById('MapDB').addEventListener('click', () => {
            this.openLicense('MapDB');
        });
        document.getElementById('jsoup').addEventListener('click', () => {
            this.openLicense('jsoup');
        });
        document.getElementById('DTDParser').addEventListener('click', () => {
            this.openLicense('DTDParser');
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-licenses');
            }
        });
        this.electron.ipcRenderer.send('licenses-height', { width: document.body.clientWidth, height: document.body.clientHeight });
    }

    openLicense(type: string) {
        this.electron.ipcRenderer.send('open-license', { type: type });
    }
}

new Licenses();