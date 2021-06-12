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

class AddFile {

    electron = require('electron');

    selectedFile: string;
    charsetOptions: string;
    typesOption: string;

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
        this.electron.ipcRenderer.send('get-languages');
        this.electron.ipcRenderer.on('set-languages', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setLanguages(arg);
        });
        this.electron.ipcRenderer.send('get-types');
        this.electron.ipcRenderer.on('set-types', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setTypes(arg);
        });
        this.electron.ipcRenderer.on('set-charsets', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setCharsets(arg);
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
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.addProject();
            }
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-addFile');
            }
        });
        this.electron.ipcRenderer.on('add-source-files', (event: Electron.IpcRendererEvent, arg: any) => {
            this.addFile(arg);
        });
        document.getElementById('addProjectButton').addEventListener('click', () => {
            this.addProject();
        });
        let body: HTMLBodyElement = document.getElementById('body') as HTMLBodyElement;
        this.electron.ipcRenderer.send('add-file-height', { width: body.clientWidth, height: body.clientHeight + 10 });
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

    setLanguages(arg: any): void {
        let array = arg.languages;
        let languageOptions = '<option value="none">Select Language</option>';
        for (let i = 0; i < array.length; i++) {
            let lang = array[i];
            languageOptions = languageOptions + '<option value="' + lang.code + '">' + lang.description + '</option>';
        }
        document.getElementById('srcLangSelect').innerHTML = languageOptions;
        (document.getElementById('srcLangSelect') as HTMLSelectElement).value = arg.srcLang;
        document.getElementById('tgtLangSelect').innerHTML = languageOptions;
        (document.getElementById('tgtLangSelect') as HTMLSelectElement).value = arg.tgtLang;
    }

    setTypes(arg: any): void {
        this.typesOption = '<option value="none" class="error">Select Type</option>';
        let length: number = arg.formats.length;
        for (let i = 0; i < length; i++) {
            this.typesOption = this.typesOption + '<option value="' + arg.formats[i].code + '">' + arg.formats[i].description + '</option>';
        }
        document.getElementById('typeSelect').innerHTML = this.typesOption;
        this.electron.ipcRenderer.send('get-charsets');
    }

    setCharsets(arg: any): void {
        this.electron.ipcRenderer.send('get-selected-file');
        this.charsetOptions = '<option value="none" class="error">Select Charset</option>';
        let length: number = arg.charsets.length;
        for (let i = 0; i < length; i++) {
            this.charsetOptions = this.charsetOptions + '<option value="' + arg.charsets[i].code + '">' + arg.charsets[i].description + '</option>';
        }
        document.getElementById('charsetSelect').innerHTML = this.charsetOptions;
    }

    addFile(arg: any): void {
        let file: any = arg.files[0];
        this.selectedFile = file.file;
        (document.getElementById('nameSpan') as HTMLLabelElement).innerText = file.file;
        let typeSelect = document.getElementById('typeSelect') as HTMLSelectElement;
        if (file.type !== 'Unknown') {
            typeSelect.value = file.type;
        } else {
            typeSelect.value = 'none';
        }
        let charsetSelect = document.getElementById('charsetSelect') as HTMLSelectElement;
        if (file.encoding !== 'Unknown') {
            charsetSelect.value = file.encoding;
        } else {
            charsetSelect.value = 'none';
        }
    }

    addProject(): void {
        let subject: string = (document.getElementById('subjectInput') as HTMLInputElement).value;
        let client: string = (document.getElementById('clientInput') as HTMLInputElement).value;
        let srcLang: string = (document.getElementById('srcLangSelect') as HTMLSelectElement).value;
        if (srcLang === 'none') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select source language', parent: 'addFile' });
            return;
        }
        let tgtLang: string = (document.getElementById('tgtLangSelect') as HTMLSelectElement).value;
        if (tgtLang === 'none') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select target language', parent: 'addFile' });
            return;
        }
        let type: string = (document.getElementById('typeSelect') as HTMLSelectElement).value;
        if (type === 'none') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select file type', parent: 'addFile' });
            return;
        }
        let charset: string = (document.getElementById('charsetSelect') as HTMLSelectElement).value;
        if (charset === 'none') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select character set', parent: 'addFile' });
            return;
        }

        let memory: string = this.memSelect.value;
        let applyTM: boolean = (document.getElementById('applyTM') as HTMLInputElement).checked;
        if (applyTM && memory === 'none') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select memory' });
            return;
        }
        let glossary: string = this.glossSelect.value;
        let searchTerms: boolean = (document.getElementById('searchTerms') as HTMLInputElement).checked;
        if (searchTerms && glossary === 'none') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select glossary' });
            return;
        }

        let array: any[] = [{ file: this.selectedFile, type: type, encoding: charset }];
        let params: any = {
            description: this.selectedFile,
            files: array,
            subject: subject,
            client: client,
            srcLang: srcLang,
            tgtLang: tgtLang,
            memory: memory,
            applyTM: applyTM,
            glossary: glossary,
            searchTerms: searchTerms,
            from: 'addFile'
        }
        this.electron.ipcRenderer.send('create-project', params);
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

new AddFile();