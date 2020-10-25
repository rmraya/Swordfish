/*****************************************************************************
Copyright (c) 2007-2020 - Maxprograms,  http://www.maxprograms.com/

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

class ImportXLIFF {

    electron = require('electron');

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
        });
        this.electron.ipcRenderer.send('get-clients');
        this.electron.ipcRenderer.on('set-clients', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setClients(arg);
        });
        this.electron.ipcRenderer.send('get-subjects');
        this.electron.ipcRenderer.on('set-subjects', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setSubjects(arg);
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => { KeyboardHandler.keyListener(event); });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-importXliff');
            }
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.importXLIFF();
            }
        });
        document.getElementById('browse').addEventListener('click', () => {
            this.electron.ipcRenderer.send('browse-xliff-import');
            document.getElementById('browse').blur();
        });
        this.electron.ipcRenderer.on('set-xliff', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('xliff') as HTMLInputElement).value = arg;
        });
        document.getElementById('importXliff').addEventListener('click', () => {
            this.importXLIFF();
        });
        (document.getElementById('projectInput') as HTMLInputElement).focus();
        let body: HTMLBodyElement = document.getElementById('body') as HTMLBodyElement;
        this.electron.ipcRenderer.send('import-xliff-height', { width: body.clientWidth, height: body.clientHeight });
    }

    setClients(clients: string[]): void {
        let options: string = '';
        let length: number = clients.length;
        for (let i = 0; i < length; i++) {
            options = options + '<option value="' + clients[i] + '">' + clients[i] + '</option>';
        }
        document.getElementById('clients').innerHTML = options;
    }

    setSubjects(subjects: string[]): void {
        let options: string = '';
        let length: number = subjects.length;
        for (let i = 0; i < length; i++) {
            options = options + '<option value="' + subjects[i] + '">' + subjects[i] + '</option>';
        }
        document.getElementById('subjects').innerHTML = options;
    }

    importXLIFF(): void {
        let project: string = (document.getElementById('projectInput') as HTMLInputElement).value;
        if (project === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Enter project name', parent: 'importXliff' });
            return;
        }
        let xliff: string = (document.getElementById('xliff') as HTMLInputElement).value;
        if (xliff === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select XLIFF file', parent: 'importXliff' });
            return;
        }
        let params = {
            xliff: xliff,
            project: project,
            subject: (document.getElementById('subjectInput') as HTMLInputElement).value,
            client: (document.getElementById('clientInput') as HTMLInputElement).value
        }
        this.electron.ipcRenderer.send('import-xliff-file', params);
    }
}

new ImportXLIFF();