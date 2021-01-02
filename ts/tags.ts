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
        document.getElementById('tagInput').focus();
        let body: HTMLBodyElement = document.getElementById('body') as HTMLBodyElement;
        this.electron.ipcRenderer.send('tags-height', { width: body.clientWidth, height: body.clientHeight });
    }

    parseKey(event: KeyboardEvent): void {
        let code: string = event.code;
        if (code === 'Escape') {
            this.electron.ipcRenderer.send('close-tags');
        }
        if (code === 'Enter' || code === 'NumpadEnter') {
            let value: string = this.tagInput.value;
            if (value.length > 0) {
                this.electron.ipcRenderer.send('forward-tag', { tag: Number.parseInt(value, 10) });
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