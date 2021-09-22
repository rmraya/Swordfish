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

class ImportTMX {

    electron = require('electron');

    memory: string;

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
        document.addEventListener('keydown', (event: KeyboardEvent) => { KeyboardHandler.keyListener(event); });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-importTmx');
            }
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.importTMX();
            }
        });
        this.electron.ipcRenderer.send('get-memory-param');
        this.electron.ipcRenderer.on('set-memory', (event: Electron.IpcRendererEvent, arg: any) => {
            this.memory = arg;
        });
        document.getElementById('browse').addEventListener('click', () => {
            this.electron.ipcRenderer.send('get-tmx-file');
            document.getElementById('browse').blur();
        });
        this.electron.ipcRenderer.on('set-tmx-file', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('tmx') as HTMLInputElement).value = arg;
        });
        document.getElementById('importTmx').addEventListener('click', () => {
            this.importTMX();
        });
        (document.getElementById('tmx') as HTMLInputElement).focus();
        this.electron.ipcRenderer.send('import-tmx-height', { width: document.body.clientWidth, height: document.body.clientHeight });
    }

    setProjectNames(projects: string[]): void {
        let options: string = '';
        let length: number = projects.length;
        for (let i = 0; i < length; i++) {
            options = options + '<option value="' + projects[i] + '">' + projects[i] + '</option>';
        }
        document.getElementById('projects').innerHTML = options;
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

    importTMX(): void {
        let tmx: string = (document.getElementById('tmx') as HTMLInputElement).value;
        if (tmx === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select TMX file', parent: 'importTmx' });
            return;
        }
        let params = {
            memory: this.memory,
            tmx: tmx,
            project: (document.getElementById('projectInput') as HTMLInputElement).value,
            subject: (document.getElementById('subjectInput') as HTMLInputElement).value,
            client: (document.getElementById('clientInput') as HTMLInputElement).value
        }
        this.electron.ipcRenderer.send('import-tmx-file', params);
    }
}

new ImportTMX();