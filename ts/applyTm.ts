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

class ApplyTM {

    electron = require('electron');

    memSelect: HTMLSelectElement;
    penalty: HTMLInputElement;
    project: string;

    constructor() {
        this.memSelect = document.getElementById('memorySelect') as HTMLSelectElement;
        this.penalty = document.getElementById('penalty') as HTMLInputElement;
        this.penalty.value = '0';

        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.send('get-version');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-apply-tm');
            }
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.applyTM();
            }
        });
        this.electron.ipcRenderer.send('get-memories');
        this.electron.ipcRenderer.on('set-memories', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setMemories(arg);
        });
        this.electron.ipcRenderer.on('set-memory', (event: Electron.IpcRendererEvent, arg: any) => {
            this.memSelect.value = arg;
        });
        this.electron.ipcRenderer.send('get-project-param');
        this.electron.ipcRenderer.on('set-project', (event: Electron.IpcRendererEvent, arg: any) => {
            this.project = arg;
        });
        this.penalty.addEventListener('keydown', (event: KeyboardEvent) => {
            let numberKeys: string[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'Backspace', 'Delete', 'Escape', 'Enter', 'NumpadEnter'];
            if (!numberKeys.includes(event.key)) {
                event.preventDefault();
                event.cancelBubble = true;
            }
        });
        document.getElementById('applyTmButton').addEventListener('click', () => {
            this.applyTM();
        });
        let body: HTMLBodyElement = document.getElementById('body') as HTMLBodyElement;
        this.electron.ipcRenderer.send('apply-tm-height', { width: body.clientWidth, height: body.clientHeight });
    }

    applyTM(): void {
        let mem: string = this.memSelect.value;
        if (mem === 'none') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select memory', parent: 'applyTm' });
            return;
        }
        if (this.penalty.value.length === 0) {
            this.penalty.value = '0';
        }
        let penalization: number = Number.parseInt(this.penalty.value);
        if (penalization > 59) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Penalization must be less than 60%', parent: 'applyTm' });
            return;
        }
        let params: any = {
            project: this.project,
            memory: mem,
            penalization: penalization
        }
        this.electron.ipcRenderer.send('search-memory-all', params);
    }

    setMemories(memories: any[]): void {
        if (memories.length === 0) {
            this.memSelect.innerHTML = '<option value="none" class="error">-- No Memory --</option>';
            return;
        }
        let options = '<option value="none" class="error">-- Select Memory --</option>';
        let length = memories.length;
        for (let i = 0; i < length; i++) {
            options = options + '<option value="' + memories[i].id + '">' + memories[i].name + '</option>';
        }
        this.memSelect.innerHTML = options;
        this.memSelect.value = 'none';
        this.electron.ipcRenderer.send('get-memory-param');
    }
}

new ApplyTM();