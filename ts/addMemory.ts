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

class AddMemory {

    electron = require('electron');

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
        });
        this.electron.ipcRenderer.send('get-project-names');
        this.electron.ipcRenderer.on('set-project-names', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setProjectNames(arg);
        });
        this.electron.ipcRenderer.send('get-clients');
        this.electron.ipcRenderer.on('set-clients', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setClients(arg);
        });
        this.electron.ipcRenderer.send('get-subjects');
        this.electron.ipcRenderer.on('set-subjects', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setSubjects(arg);
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                window.close();
            }
            if (event.key === 'Enter') {
                this.addMemory();
            }
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => { KeyboardHandler.keyListener(event); });
        document.getElementById('typeSelect').addEventListener("change", () => {
            this.typeChanged();
        });
        this.electron.ipcRenderer.on('get-height', () => {
            let body: HTMLBodyElement = document.getElementById('body') as HTMLBodyElement;
            this.electron.ipcRenderer.send('add-memory-height', { width: body.clientWidth, height: body.clientHeight });
        });
        document.getElementById('addMemoryButton').addEventListener('click', () => {
            this.addMemory();
        });
    }

    addMemory(): void {
        let name: string = (document.getElementById('nameInput') as HTMLInputElement).value;
        if (name === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Enter name' });
            return;
        }
        let type: string = (document.getElementById('typeSelect') as HTMLSelectElement).value;
        let server: string = '';
        if (type !== 'Local') {
            server = (document.getElementById('urlInput') as HTMLInputElement).value;
            if (server === '') {
                this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Enter server URL' });
                return;
            }
        }
        let params: any = {
            name: name,
            project: (document.getElementById('projectInput') as HTMLInputElement).value,
            subject: (document.getElementById('subjectInput') as HTMLInputElement).value,
            client: (document.getElementById('clientInput') as HTMLInputElement).value,
            type: type,
            server: server,
            user: (document.getElementById('userInput') as HTMLInputElement).value,
            password: (document.getElementById('passInput') as HTMLInputElement).value
        }
        this.electron.ipcRenderer.send('add-memory', params);
    }

    setProjectNames(projects: string[]): void {
        let options: string = '';
        let length: number = projects.length;
        for (let i = 0; i < length; i++) {
            options = options + '<option value="' + projects[i] + '">'
        }
        document.getElementById('projects').innerHTML = options;
    }

    setClients(clients: string[]): void {
        let options: string = '';
        let length: number = clients.length;
        for (let i = 0; i < length; i++) {
            options = options + '<option value="' + clients[i] + '">'
        }
        document.getElementById('clients').innerHTML = options;
    }

    setSubjects(subjects: string[]): void {
        let options: string = '';
        let length: number = subjects.length;
        for (let i = 0; i < length; i++) {
            options = options + '<option value="' + subjects[i] + '">'
        }
        document.getElementById('subjects').innerHTML = options;
    }

    typeChanged(): void {
        let type: string = (document.getElementById('typeSelect') as HTMLSelectElement).value;
        (document.getElementById('urlInput') as HTMLInputElement).disabled = (type === 'Local');
        (document.getElementById('userInput') as HTMLInputElement).disabled = (type === 'Local');
        (document.getElementById('passInput') as HTMLInputElement).disabled = (type === 'Local');
    }
}

new AddMemory();