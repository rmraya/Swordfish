/*****************************************************************************
Copyright (c) 2007-2020 - Maxprograms,  http://www.maxprograms.com/

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

class ChangeCase {

    electron = require('electron');

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.send('get-version');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-change-case');
            }
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.changeCase();
            }
        });
        document.getElementById('changeCase').addEventListener('click', () => { this.changeCase(); });
        document.getElementById('uppercase').focus();
        let body: HTMLBodyElement = document.getElementById('body') as HTMLBodyElement;
        this.electron.ipcRenderer.send('change-case-height', { width: body.clientWidth, height: body.clientHeight });
    }

    changeCase(): void {
        if ((document.getElementById('sentence') as HTMLInputElement).checked) {
            this.electron.ipcRenderer.send('change-case-to', { case: 'sentence' });
        }
        if ((document.getElementById('lowercase') as HTMLInputElement).checked) {
            this.electron.ipcRenderer.send('change-case-to', { case: 'lowercase' });
        }
        if ((document.getElementById('uppercase') as HTMLInputElement).checked) {
            this.electron.ipcRenderer.send('change-case-to', { case: 'uppercase' });
        }
        if ((document.getElementById('title') as HTMLInputElement).checked) {
            this.electron.ipcRenderer.send('change-case-to', { case: 'title' });
        }
        if ((document.getElementById('toggle') as HTMLInputElement).checked) {
            this.electron.ipcRenderer.send('change-case-to', { case: 'toggle' });
        }
    }
}

new ChangeCase();