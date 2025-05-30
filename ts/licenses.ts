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

class Licenses {

    electron = require('electron');

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        (document.getElementById('Swordfish') as HTMLAnchorElement).addEventListener('click', () => {
            this.openLicense('Swordfish');
        });
        (document.getElementById('electron') as HTMLAnchorElement).addEventListener('click', () => {
            this.openLicense('electron');
        });
        (document.getElementById('XMLJava') as HTMLAnchorElement).addEventListener('click', () => {
            this.openLicense('XMLJava');
        });
        (document.getElementById('Java') as HTMLAnchorElement).addEventListener('click', () => {
            this.openLicense('Java');
        });
        (document.getElementById('OpenXLIFF') as HTMLAnchorElement).addEventListener('click', () => {
            this.openLicense('OpenXLIFF');
        });
        (document.getElementById('BCP47J') as HTMLAnchorElement).addEventListener('click', () => {
            this.openLicense('BCP47J');
        });
        (document.getElementById('MapDB') as HTMLAnchorElement).addEventListener('click', () => {
            this.openLicense('MapDB');
        });
        (document.getElementById('jsoup') as HTMLAnchorElement).addEventListener('click', () => {
            this.openLicense('jsoup');
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-licenses');
            }
        });
        setTimeout(() => {
            this.electron.ipcRenderer.send('set-height', { window: 'licenses', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    openLicense(type: string) {
        this.electron.ipcRenderer.send('open-license', { type: type });
    }
}
