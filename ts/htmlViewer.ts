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

class HtmlViewer {

    electron = require('electron');

    id: number;

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => { KeyboardHandler.keyListener(event); });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-htmlViewer', { id: this.id });
            }
        });
        this.electron.ipcRenderer.send('get-html-content');
        this.electron.ipcRenderer.on('set-content', (event: Electron.IpcRendererEvent, arg: any) => {
            let container: HTMLDivElement = document.getElementById('content') as HTMLDivElement;
            container.innerHTML = arg;
            let body: HTMLBodyElement = document.getElementById('body') as HTMLBodyElement;
            container.style.width = body.clientWidth + 'px';
            container.style.height = body.clientHeight + 'px';
        });
        this.electron.ipcRenderer.send('get-html-title');
        this.electron.ipcRenderer.on('set-title', (event: Electron.IpcRendererEvent, arg: any) => {
            document.getElementById('title').innerText = arg;
        });
        this.electron.ipcRenderer.send('get-html-id');
        this.electron.ipcRenderer.on('set-id', (event: Electron.IpcRendererEvent, arg: any) => {
            this.id = arg;
        });
        window.addEventListener('resize', () => {
            let body: HTMLBodyElement = document.getElementById('body') as HTMLBodyElement;
            let container: HTMLDivElement = document.getElementById('content') as HTMLDivElement;
            container.style.width = body.clientWidth + 'px';
            container.style.height = body.clientHeight + 'px';
        });
    }
}

new HtmlViewer();