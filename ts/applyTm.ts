/*******************************************************************************
 * Copyright (c) 2023 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/

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
        this.electron.ipcRenderer.send('apply-tm-height', { width: document.body.clientWidth, height: document.body.clientHeight });
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
