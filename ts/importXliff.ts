/*******************************************************************************
 * Copyright (c) 2007-2026 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/

import { ipcRenderer, IpcRendererEvent } from "electron";

export class ImportXLIFF {

    memSelect: HTMLSelectElement;
    glossSelect: HTMLSelectElement;

    constructor() {
        this.memSelect = document.getElementById('memorySelect') as HTMLSelectElement;
        this.glossSelect = document.getElementById('glossarySelect') as HTMLSelectElement;

        ipcRenderer.send('get-theme');
        ipcRenderer.on('set-theme', (event: IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        ipcRenderer.send('get-clients');
        ipcRenderer.on('set-clients', (event: IpcRendererEvent, clients: string[]) => {
            this.setClients(clients);
        });
        ipcRenderer.send('get-subjects');
        ipcRenderer.on('set-subjects', (event: IpcRendererEvent, subjects: string[]) => {
            this.setSubjects(subjects);
        });
        ipcRenderer.send('get-memories');
        ipcRenderer.on('set-memories', (event: IpcRendererEvent, arg: any) => {
            this.setMemories(arg);
        });
        ipcRenderer.send('get-glossaries');
        ipcRenderer.on('set-glossaries', (event: IpcRendererEvent, arg: any) => {
            this.setGlossaries(arg);
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                ipcRenderer.send('close-importXliff');
            }
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.importXLIFF();
            }
        });
        (document.getElementById('browse') as HTMLButtonElement).addEventListener('click', () => {
            ipcRenderer.send('browse-xliff-import');
            (document.getElementById('browse') as HTMLButtonElement).blur();
        });
        ipcRenderer.on('set-xliff', (event: IpcRendererEvent, arg: any) => {
            (document.getElementById('xliff') as HTMLInputElement).value = arg;
        });
        (document.getElementById('importXliff') as HTMLButtonElement).addEventListener('click', () => {
            this.importXLIFF();
        });
        (document.getElementById('projectInput') as HTMLInputElement).focus();
        setTimeout(() => {
            ipcRenderer.send('set-height', { window: 'importXliff', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    setClients(clients: string[]): void {
        let options: string = '';
        let length: number = clients.length;
        for (let i = 0; i < length; i++) {
            options = options + '<option value="' + clients[i] + '">' + clients[i] + '</option>';
        }
        (document.getElementById('clients') as HTMLDataListElement).innerHTML = options;
    }

    setSubjects(subjects: string[]): void {
        let options: string = '';
        let length: number = subjects.length;
        for (let i = 0; i < length; i++) {
            options = options + '<option value="' + subjects[i] + '">' + subjects[i] + '</option>';
        }
        (document.getElementById('subjects') as HTMLDataListElement).innerHTML = options;
    }

    importXLIFF(): void {
        let project: string = (document.getElementById('projectInput') as HTMLInputElement).value;
        if (project === '') {
            ipcRenderer.send('show-message', { type: 'warning', message: 'Enter project name', parent: 'importXliff' });
            return;
        }
        let xliff: string = (document.getElementById('xliff') as HTMLInputElement).value;
        if (xliff === '') {
            ipcRenderer.send('show-message', { type: 'warning', message: 'Select XLIFF file', parent: 'importXliff' });
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
        ipcRenderer.send('import-xliff-file', params);
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
