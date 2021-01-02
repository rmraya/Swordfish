/*****************************************************************************
Copyright (c) 2007-2021 - Maxprograms,  http://www.maxprograms.com/

Permission is hereby granted, free of charge, to any person obtaining a copy of 
this software and associated documentation files (the "Software"), to compile, 
modify and use the Software in its executable form without restrictions.

Redistribution of this Software or parts of it in any form (source code or 
executable binaries) requires prior written permission from Maxprograms.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE 
SOFTWARE.
*****************************************************************************/

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
        let body: HTMLBodyElement = document.getElementById('body') as HTMLBodyElement;
        this.electron.ipcRenderer.send('sort-segments-height', { width: body.clientWidth, height: body.clientHeight });
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

new SortSegments();