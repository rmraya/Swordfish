/*****************************************************************************
Copyright (c) 2007-2021 - Maxprograms,  http://www.maxprograms.com/

Permission is hereby granted, free of charge, to any person obtaining a copy of 
this software and associated documentation files (the "Software"), to compile, 
modify and use the Software in its executable form without restrictions.

Redistribution of this Software or parts of it in any form (source code or 
executable binaries) requires prior written permission from Maxprograms.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE 
SOFTWARE.
*****************************************************************************/

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
        document.getElementById('goToButton').addEventListener('click', () => {
            this.goToSegment();
        });
        document.getElementById('segInput').focus();

        let body: HTMLBodyElement = document.getElementById('body') as HTMLBodyElement;
        this.electron.ipcRenderer.send('go-to-height', { width: body.clientWidth, height: body.clientHeight });
    }

    parseKey(event: KeyboardEvent): void {
        let code: string = event.code;
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