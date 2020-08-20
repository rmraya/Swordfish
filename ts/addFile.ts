class AddFile {

    electron = require('electron');

    charsetOptions: string;
    typesOption: string;

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
        this.electron.ipcRenderer.send('get-languages');
        this.electron.ipcRenderer.on('set-languages', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setLanguages(arg);
        });
        this.electron.ipcRenderer.on('get-height', () => {
            let body: HTMLBodyElement = document.getElementById('body') as HTMLBodyElement;
            this.electron.ipcRenderer.send('add-file-height', { width: body.clientWidth, height: body.clientHeight });
        });
        this.electron.ipcRenderer.send('get-types');
        this.electron.ipcRenderer.on('set-types', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setTypes(arg);
        }); 
        this.electron.ipcRenderer.on('set-charsets', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setCharsets(arg);
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                window.close();
            }
            if (event.key === 'Enter') {
                this.addProject();
            }
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => { KeyboardHandler.keyListener(event); });
        document.getElementById('addFilesButton').addEventListener('click', () => {
            this.electron.ipcRenderer.send('select-source-files');
            document.getElementById('addFilesButton').blur();
        });
        this.electron.ipcRenderer.on('add-source-files', (event: Electron.IpcRendererEvent, arg: any) => {
            this.addFile(arg);
        });
        document.getElementById('addProjectButton').addEventListener('click', () => {
            this.addProject();
        });
    }

    setClients(clients: string[]): void {
        let options: string = '';
        let length: number = clients.length;
        for (let i=0 ; i<length ; i++) {
            options = options + '<option value="' + clients[i] + '">' + clients[i] + '</option>';
        }
        document.getElementById('clients').innerHTML = options;
    }

    setSubjects(subjects: string[]): void {
        let options: string = '';
        let length: number = subjects.length;
        for (let i=0 ; i<length ; i++) {
            options = options + '<option value="' + subjects[i] + '">'+ subjects[i] + '</option>';
        }
        document.getElementById('subjects').innerHTML = options;
    }

    setLanguages(arg: any): void {
        var array = arg.languages;
        var languageOptions = '<option value="none">Select Language</option>';
        for (let i = 0; i < array.length; i++) {
            var lang = array[i];
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
        this.charsetOptions = '<option value="none" class="error">Select Charset</option>';
        let length: number = arg.charsets.length;
        for (let i = 0; i < length; i++) {
            this.charsetOptions = this.charsetOptions + '<option value="' + arg.charsets[i].code + '">' + arg.charsets[i].description + '</option>';
        }
        document.getElementById('charsetSelect').innerHTML = this.charsetOptions;
        this.electron.ipcRenderer.send('get-selected-file');
    }

    addFile(arg: any): void {
        let file: any = arg.files[0];
        (document.getElementById('nameInput') as HTMLInputElement).value = file.file;
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
        let name: string = (document.getElementById('nameInput') as HTMLInputElement).value;
        if (name === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select file' });
            return;
        }

        let subject: string = (document.getElementById('subjectInput') as HTMLInputElement).value;
        let client: string = (document.getElementById('clientInput') as HTMLInputElement).value;
        let srcLang = (document.getElementById('srcLangSelect') as HTMLSelectElement).value;
        if (srcLang === 'none') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select source language' });
            return;
        }
        let tgtLang = (document.getElementById('tgtLangSelect') as HTMLSelectElement).value;
        if (tgtLang === 'none') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select target language' });
            return;
        }
        let type = (document.getElementById('typeSelect') as HTMLSelectElement).value;
        if (type === 'none') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select file type' });
            return;
        }
        let charset = (document.getElementById('charsetSelect') as HTMLSelectElement).value;
        if (charset === 'none') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select character set' });
            return;
        }
        let array: any[] = [{ file: name, type: type, encoding: charset }];

        let params: any = {
            description: name,
            files: array,
            subject: subject,
            client: client,
            srcLang: srcLang,
            tgtLang: tgtLang
        }
        this.electron.ipcRenderer.send('create-project', params);
    }
}

new AddFile();