class GoTo {
    electron = require('electron');

    segInput: HTMLInputElement;

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
        });
        this.segInput = document.getElementById('segInput') as HTMLInputElement;
        this.segInput.addEventListener('keydown', (event: KeyboardEvent) => {
            this.parseKey(event);
        });
        this.electron.ipcRenderer.on('get-height', () => {
            let body: HTMLBodyElement = document.getElementById('body') as HTMLBodyElement;
            this.electron.ipcRenderer.send('go-to-height', { width: body.clientWidth, height: body.clientHeight });
        });
        document.getElementById('goToButton').addEventListener('click', () => {
            this.goToSegment();
        });
        document.getElementById('segInput').focus();
    }

    parseKey(event: KeyboardEvent): void {
        let code: string = event.code;
        console.log(code);
        if (code === 'Escape') {
            this.electron.ipcRenderer.send('close-go-to');
        }
        if (code === 'Enter' || code === 'NumpadEnter') {
            this.goToSegment();
        }
        if (!(code.startsWith('Digit') || code.startsWith('Numpad') || code === 'Delete' || code === 'Backspace')) {
            event.preventDefault();
            event.stopPropagation();
        }
    }

    goToSegment(): void {
        let value: string = this.segInput.value;
        if (value.length > 0) {
            this.electron.ipcRenderer.send('go-to-segment', { segment: Number.parseInt(value, 10) });
            return;
        }
        this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Enter segment number', parent: 'goTo' });
        document.getElementById('segInput').focus();
    }
}

new GoTo();