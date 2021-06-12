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

class ImportGlossary {

    electron = require('electron');

    glossary: string;

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
                this.electron.ipcRenderer.send('close-importGlossary');
            }
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.importGlossary();
            }
        });
        this.electron.ipcRenderer.send('get-glossary-param');
        this.electron.ipcRenderer.on('set-glossary', (event: Electron.IpcRendererEvent, arg: any) => {
            this.glossary = arg;
        });
        document.getElementById('browse').addEventListener('click', () => {
            this.electron.ipcRenderer.send('get-glossary-file');
            document.getElementById('browse').blur();
        });
        this.electron.ipcRenderer.on('set-glossary-file', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('file') as HTMLInputElement).value = arg;
        });
        document.getElementById('importGlossary').addEventListener('click', () => {
            this.importGlossary();
        });
        (document.getElementById('file') as HTMLInputElement).focus();
        let body: HTMLBodyElement = document.getElementById('body') as HTMLBodyElement;
            this.electron.ipcRenderer.send('import-glossary-height', { width: body.clientWidth, height: body.clientHeight });
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

    importGlossary(): void {
        let file: string = (document.getElementById('file') as HTMLInputElement).value;
        if (file === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select glossary file', parent: 'importGlossary' });
            return;
        }
        let params = {
            glossary: this.glossary,
            file: file,
            project: (document.getElementById('projectInput') as HTMLInputElement).value,
            subject: (document.getElementById('subjectInput') as HTMLInputElement).value,
            client: (document.getElementById('clientInput') as HTMLInputElement).value
        }
        this.electron.ipcRenderer.send('import-glossary-file', params);
    }
}

new ImportGlossary();