class FindText {

    electron = require('electron');

    projectId: string;

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
        });
        this.electron.ipcRenderer.on('get-height', () => {
            let body: HTMLBodyElement = document.getElementById('body') as HTMLBodyElement;
            this.electron.ipcRenderer.send('find-text-height', { width: body.clientWidth, height: body.clientHeight });
        });
        this.electron.ipcRenderer.on('set-project', (event: Electron.IpcRendererEvent, arg: any) => {
            this.projectId = arg;
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => { KeyboardHandler.keyListener(event); });
        document.getElementById('findText').addEventListener('click', () => {
            this.findText();
        });
        document.getElementById('clearSearch').addEventListener('click', () => {
            this.clearSearch();
        });
    }

    findText(): void {
        let filterText: string = (document.getElementById('filterText') as HTMLInputElement).value;
        if (filterText === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Enter text to search' });
            return;
        }
        let params: any = {
            // TODO
        }
    }

    clearSearch(): void {
        // TODO
    }
}

new FindText();