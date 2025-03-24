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

class AddProject {

    electron = require('electron');
    addedFiles: Map<number, FileInfo>;

    charsetOptions: string;
    typesOption: string;

    memSelect: HTMLSelectElement;
    glossSelect: HTMLSelectElement;

    homeFolder: string;

    constructor() {
        this.memSelect = document.getElementById('memorySelect') as HTMLSelectElement;
        this.glossSelect = document.getElementById('glossarySelect') as HTMLSelectElement;

        this.addedFiles = new Map<number, FileInfo>();
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
        this.electron.ipcRenderer.send('get-source-files');
        this.electron.ipcRenderer.on('add-source-files', (event: Electron.IpcRendererEvent, files: FileInfo[]) => {
            this.addFiles(files);
        });
        this.electron.ipcRenderer.send('get-types');
        this.electron.ipcRenderer.on('set-types', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setTypes(arg);
        });
        this.electron.ipcRenderer.send('get-charsets');
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
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.addProject();
            }
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-addProject');
            }
        });
        document.getElementById('addFilesButton').addEventListener('click', () => {
            this.electron.ipcRenderer.send('select-source-files');
            document.getElementById('addFilesButton').blur();
        });
        document.getElementById('addProjectButton').addEventListener('click', () => {
            this.addProject();
        });
        (document.getElementById('nameInput') as HTMLInputElement).focus();
        this.electron.ipcRenderer.send('get-home');
        this.electron.ipcRenderer.on('set-home', (event: Electron.IpcRendererEvent, arg: any) => {
            this.homeFolder = arg;
        });
        setTimeout(() => {
            this.electron.ipcRenderer.send('set-height', { window: 'addProject', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    addProject(): void {
        let name: string = (document.getElementById('nameInput') as HTMLInputElement).value;
        if (name === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Enter name', parent: 'addProject' });
            return;
        }
        let length = this.addedFiles.size;
        if (length === 0) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Add files', parent: 'addProject' });
            return;
        }
        let error = '';
        this.addedFiles.forEach((a) => {
            if (a.type === 'none' || a.type === 'Unknown') {
                error = 'Select file types';
            }
            if (a.encoding === 'none' || a.encoding === 'Unknown') {
                error = 'Select character sets';
            }
        });
        if (error !== '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: error, parent: 'addProject' });
            return;
        }
        let subject: string = (document.getElementById('subjectInput') as HTMLInputElement).value;
        let client: string = (document.getElementById('clientInput') as HTMLInputElement).value;
        let srcLang = (document.getElementById('srcLangSelect') as HTMLSelectElement).value;
        if (srcLang === 'none') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select source language', parent: 'addProject' });
            return;
        }
        let tgtLang = (document.getElementById('tgtLangSelect') as HTMLSelectElement).value;
        if (tgtLang === 'none') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select target language', parent: 'addProject' });
            return;
        }
        let memory: string = this.memSelect.value;
        let applyTM: boolean = (document.getElementById('applyTM') as HTMLInputElement).checked;
        if (applyTM && memory === 'none') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select memory', parent: 'addProject' });
            return;
        }
        let glossary: string = this.glossSelect.value;
        let searchTerms: boolean = (document.getElementById('searchTerms') as HTMLInputElement).checked;
        if (searchTerms && glossary === 'none') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select glossary', parent: 'addProject' });
            return;
        }

        let array: FileInfo[] = [];
        this.addedFiles.forEach((a) => {
            array.push(a)
        });

        let params: any = {
            description: name,
            files: array,
            subject: subject,
            client: client,
            srcLang: srcLang,
            tgtLang: tgtLang,
            memory: memory,
            applyTM: applyTM,
            glossary: glossary,
            searchTerms: searchTerms,
            from: 'addProject'
        }
        this.electron.ipcRenderer.send('create-project', params);
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
        for (let subject of subjects) {
            options = options + '<option value="' + subject + '">' + subject + '</option>';
        }
        document.getElementById('subjects').innerHTML = options;
    }

    setLanguages(arg: any): void {
        let array = arg.languages;
        let languageOptions = '<option value="none">Select Language</option>';
        for (let lang of array) {
            languageOptions = languageOptions + '<option value="' + lang.code + '">' + lang.description + '</option>';
        }
        document.getElementById('srcLangSelect').innerHTML = languageOptions;
        (document.getElementById('srcLangSelect') as HTMLSelectElement).value = arg.srcLang;
        document.getElementById('tgtLangSelect').innerHTML = languageOptions;
        (document.getElementById('tgtLangSelect') as HTMLSelectElement).value = arg.tgtLang;
    }

    addFiles(files: FileInfo[]): void {
        let length = files.length;
        for (let i = 0; i < length; i++) {
            let file: FileInfo = files[i];
            let hash = this.hashCode(file.file);
            if (!this.addedFiles.has(hash)) {
                this.addedFiles.set(hash, file);
            }
        }
        let tableBody: HTMLElement = document.getElementById('tableBody');
        tableBody.innerHTML = '';
        let commonStart: string = this.commonPrefix();
        let loadedFiles = [];
        for (let value of this.addedFiles.values()) {
            loadedFiles.push(value);
        }
        loadedFiles.sort((a, b) => {
            if (a.file < b.file) {
                return -1;
            }
            if (a.file > b.file) {
                return 1;
            }
            return 0;
        });
        for (let i = 0; i < loadedFiles.length; i++) {
            let file: FileInfo = loadedFiles[i];
            let hash: number = this.hashCode(file.file);
            let tr = document.createElement('tr');
            tr.id = '' + hash;

            let td = document.createElement('td');
            let remove: HTMLAnchorElement = document.createElement('a');
            remove.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px"><path d="m400-325 80-80 80 80 51-51-80-80 80-80-51-51-80 80-80-80-51 51 80 80-80 80 51 51Zm-88 181q-29.7 0-50.85-21.15Q240-186.3 240-216v-480h-48v-72h192v-48h192v48h192v72h-48v479.57Q720-186 698.85-165T648-144H312Zm336-552H312v480h336v-480Zm-336 0v480-480Z"/></svg>' +
                '<span class="tooltiptext bottomTooltip">Remove File</span>';
            remove.className = 'tooltip';
            remove.addEventListener('click', () => {
                this.deleteFiles('' + hash);
            });
            remove.setAttribute('data', '' + hash);
            td.appendChild(remove);
            tr.appendChild(td);

            td = document.createElement('td');
            td.className = 'noWrap';
            td.style.overflowX = 'hidden';

            let fileName: string = file.file;
            if (fileName.length > commonStart.length) {
                fileName = fileName.substring(commonStart.length - 1);
            }
            if (fileName.length > 50 && (file.file.indexOf('/') != -1 || fileName.indexOf('\\') != -1)) {
                let f = fileName.replace(this.homeFolder, '~');
                td.innerText = f.substring(0, 5) + ' ... ' + f.substring(f.length - 35);
            } else {
                td.innerText = fileName;
            }
            td.title = file.file;
            tr.appendChild(td);

            td = document.createElement('td');
            let typeSelect: HTMLSelectElement = document.createElement('select');
            typeSelect.innerHTML = this.typesOption;
            if (file.type !== 'Unknown') {
                typeSelect.value = file.type;
            } else {
                typeSelect.value = 'none';
            }
            typeSelect.addEventListener('change', (event: InputEvent) => {
                this.addedFiles.get(hash).type = (event.currentTarget as HTMLSelectElement).value;
            });
            td.appendChild(typeSelect);
            tr.appendChild(td);

            td = document.createElement('td');
            let charsetSelect: HTMLSelectElement = document.createElement('select');
            charsetSelect.innerHTML = this.charsetOptions;
            if (file.encoding !== 'Unknown') {
                charsetSelect.value = file.encoding;
            } else {
                charsetSelect.value = 'none';
            }
            charsetSelect.addEventListener('change', (event: InputEvent) => {
                this.addedFiles.get(hash).encoding = (event.currentTarget as HTMLSelectElement).value;
            });
            td.appendChild(charsetSelect);
            tr.appendChild(td);

            tableBody.appendChild(tr);
        }
    }

    commonPrefix(): string {
        let filesList: FileInfo[] = [];
        for (let value of this.addedFiles.values()) {
            filesList.push(value);
        }
        let commonStart: string = filesList[0].file;
        for (let i = 1; i < filesList.length; i++) {
            let file: string = filesList[i].file;
            let j = 0;
            while (j < commonStart.length && j < file.length && commonStart.charAt(j) === file.charAt(j)) {
                j++;
            }
            commonStart = commonStart.substring(0, j);
        }
        return commonStart;
    }

    deleteFiles(data: string): void {
        let tableBody: HTMLElement = document.getElementById('tableBody');
        this.addedFiles.delete(Number.parseInt(data, 10));
        tableBody.removeChild(document.getElementById(data));
    }

    hashCode(str: string): number {
        return str.split('').reduce((prevHash, currVal) =>
            (((prevHash << 5) - prevHash) + currVal.charCodeAt(0)) | 0, 0);
    }

    pad(value: number): string {
        if (value < 10) {
            return '0' + value;
        }
        return '' + value;
    }

    setTypes(arg: any): void {
        this.typesOption = '<option value="none" class="error">Select Type</option>';
        let length: number = arg.formats.length;
        for (let i = 0; i < length; i++) {
            this.typesOption = this.typesOption + '<option value="' + arg.formats[i].code + '">' + arg.formats[i].description + '</option>';
        }
    }

    setCharsets(arg: any): void {
        this.charsetOptions = '<option value="none" class="error">Select Charset</option>';
        let length: number = arg.charsets.length;
        for (let i = 0; i < length; i++) {
            this.charsetOptions = this.charsetOptions + '<option value="' + arg.charsets[i].code + '">' + arg.charsets[i].description + '</option>';
        }
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
