class Tags {

    electron = require('electron');

    tagsList: number[] = [];
    tagInput: HTMLInputElement;

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
        });
        this.tagInput = document.getElementById('tagInput') as HTMLInputElement;
        this.tagInput.addEventListener('keydown', (event: KeyboardEvent) => {
            this.parseKey(event);
        });
        this.electron.ipcRenderer.on('get-height', () => {
            let body: HTMLBodyElement = document.getElementById('body') as HTMLBodyElement;
            this.electron.ipcRenderer.send('tags-height', { width: body.clientWidth, height: body.clientHeight });
        });
        document.getElementById('tagInput').focus();
    }

    parseKey(event: KeyboardEvent): void {
        let code: string = event.code;
        console.log(code);
        if (code === 'Escape') {
            // TODO
            this.electron.ipcRenderer.send('close-tags');
        }
        if (code === 'Enter' || code === 'NumpadEnter') {
            let value: string = this.tagInput.value;
            if (value.length > 0) {
                this.electron.ipcRenderer.send('forward-tag', { tag: Number.parseInt(value) });
                this.tagInput.value = '';
            }
        }
        if (!(code.startsWith('Digit') || code.startsWith('Numpad') || code === 'Delete' || code === 'Backspace')) {
            event.preventDefault();
            event.stopPropagation();
        }
    }
}

new Tags();