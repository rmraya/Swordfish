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
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                window.close();
            }
            if (event.key === 'Enter') {
                this.importXLIFF();
            }
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => { KeyboardHandler.keyListener(event); });
        this.electron.ipcRenderer.on('get-height', () => {
            let body: HTMLBodyElement = document.getElementById('body') as HTMLBodyElement;
            this.electron.ipcRenderer.send('import-xliff-height', { width: body.clientWidth, height: body.clientHeight });
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
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Enter project name' });
            return;
        }
        let xliff: string = (document.getElementById('xliff') as HTMLInputElement).value;
        if (xliff === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select XLIFF file' });
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