class AddMeta {

    electron = require('electron');

    segmentData: any;

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape' || event.code === 'F2') {
                this.electron.ipcRenderer.send('close-add-metaDialog');
            }
        });
        (document.getElementById('saveMeta') as HTMLButtonElement).addEventListener('click', () => {
            this.saveMeta();
        });
        setTimeout(() => {
            this.electron.ipcRenderer.send('set-height', { window: 'addMetaDialog', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);

    }
    
    saveMeta(): void {
    }
}