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
        this.electron.ipcRenderer.on('get-height', () => {
            let body: HTMLBodyElement = document.getElementById('body') as HTMLBodyElement;
            this.electron.ipcRenderer.send('import-tmx-height', { width: body.clientWidth, height: body.clientHeight });
        });
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
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select TMX file' });
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