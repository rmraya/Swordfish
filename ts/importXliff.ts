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

class ImportXLIFF {

    electron = require('electron');

    memSelect: HTMLSelectElement;
    glossSelect: HTMLSelectElement;

    constructor() {
        this.memSelect = document.getElementById('memorySelect') as HTMLSelectElement;
        this.glossSelect = document.getElementById('glossarySelect') as HTMLSelectElement;

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
        this.electron.ipcRenderer.send('get-memories');
        this.electron.ipcRenderer.on('set-memories', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setMemories(arg);
        });
        this.electron.ipcRenderer.send('get-glossaries');
        this.electron.ipcRenderer.on('set-glossaries', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setGlossaries(arg);
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
        this.electron.ipcRenderer.send('import-xliff-height', { width: document.body.clientWidth, height: document.body.clientHeight });
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
        let memory: string = this.memSelect.value;
        let glossary: string = this.glossSelect.value;
        let params = {
            xliff: xliff,
            project: project,
            subject: (document.getElementById('subjectInput') as HTMLInputElement).value,
            client: (document.getElementById('clientInput') as HTMLInputElement).value,
            memory: memory,
            glossary: glossary
        }
        this.electron.ipcRenderer.send('import-xliff-file', params);
    }

    setMemories(memories: any[]): void {
        if (memories.length === 0) {
            this.memSelect.innerHTML = '<option value="none" class="error">-- No Memory --</option>';
            return;
        }
        let options = '<option value="none" class="error">-- Select Memory --</option>';
        let length = memories.length;
        for (let i = 0; i < length; i++) {
            options = options + '<option value="' + memories[i].id + '">' + memories[i].name + '</option>';
        }
        this.memSelect.innerHTML = options;
    }

    setGlossaries(glossaries: any[]): void {
        if (glossaries.length === 0) {
            this.glossSelect.innerHTML = '<option value="none" class="error">-- No Glossary --</option>';
            return;
        }
        let options = '<option value="none" class="error">-- Select Glossary --</option>';
        let length = glossaries.length;
        for (let i = 0; i < length; i++) {
            options = options + '<option value="' + glossaries[i].id + '">' + glossaries[i].name + '</option>';
        }
        this.glossSelect.innerHTML = options;
    }
}

new ImportXLIFF();