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

class SortSegments {

    electron = require('electron');

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
        });
        this.electron.ipcRenderer.send('get-sort-params');
        this.electron.ipcRenderer.on('set-params', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setParams(arg);
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => { KeyboardHandler.keyListener(event); });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.sortSegments();
            }
            if (event.code === 'Escape') {
                this.clearSorting();
            }
        });
        (document.getElementById('sort') as HTMLButtonElement).addEventListener('click', () => {
            this.sortSegments();
        });
        document.getElementById('clearSort').addEventListener('click', () => {
            this.clearSorting();
        });
        document.getElementById('language').addEventListener('click', () => {
            (document.getElementById('source') as HTMLInputElement).disabled = false;
            (document.getElementById('target') as HTMLInputElement).disabled = false;
        });
        document.getElementById('status').addEventListener('click', () => {
            (document.getElementById('source') as HTMLInputElement).disabled = true;
            (document.getElementById('target') as HTMLInputElement).disabled = true;
        });
        this.electron.ipcRenderer.send('sort-segments-height', { width: document.body.clientWidth, height: document.body.clientHeight });
    }

    setParams(arg: any): void {
        if (arg.sortOption === 'source') {
            (document.getElementById('language') as HTMLInputElement).checked = true;
            (document.getElementById('source') as HTMLInputElement).checked = true;
        }
        if (arg.sortOption === 'target') {
            (document.getElementById('language') as HTMLInputElement).checked = true;
            (document.getElementById('target') as HTMLInputElement).checked = true;
        }
        if (arg.sortOption === 'status') {
            (document.getElementById('status') as HTMLInputElement).checked = true;
            (document.getElementById('source') as HTMLInputElement).disabled = true;
            (document.getElementById('target') as HTMLInputElement).disabled = true;
        }
        (document.getElementById('descending') as HTMLInputElement).checked = arg.sortDesc;
    }

    sortSegments(): void {
        let sortOption: string = 'status';
        if ((document.getElementById('language') as HTMLInputElement).checked) {
            sortOption = (document.getElementById('source') as HTMLInputElement).checked ? 'source' : 'target';
        }
        let sortDesc: boolean = (document.getElementById('descending') as HTMLInputElement).checked;
        this.electron.ipcRenderer.send('sort-options', { sortOption: sortOption, sortDesc: sortDesc });
    }

    clearSorting(): void {
        this.electron.ipcRenderer.send('sort-options', { sortOption: 'none', sortDesc: false });
    }
}
