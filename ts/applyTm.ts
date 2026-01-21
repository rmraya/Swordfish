/*******************************************************************************
 * Copyright (c) 2007-2026 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/

import { ipcRenderer, IpcRendererEvent } from "electron";

export class ApplyTM {

    memSelect: HTMLSelectElement;
    penalty: HTMLInputElement;
    project: string = '';

    constructor() {
        this.memSelect = document.getElementById('memorySelect') as HTMLSelectElement;
        this.penalty = document.getElementById('penalty') as HTMLInputElement;
        this.penalty.value = '0';

        ipcRenderer.send('get-theme');
        ipcRenderer.send('get-version');
        ipcRenderer.on('set-theme', (event: IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                ipcRenderer.send('close-apply-tm');
            }
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.applyTM();
            }
        });
        ipcRenderer.send('get-memories');
        ipcRenderer.on('set-memories', (event: IpcRendererEvent, arg: any) => {
            this.setMemories(arg);
        });
        ipcRenderer.on('set-memory', (event: IpcRendererEvent, memory: string) => {
            this.memSelect.value = memory;
        });
        ipcRenderer.send('get-project-param');
        ipcRenderer.on('set-project', (event: IpcRendererEvent, project: string) => {
            this.project = project;
        });
        this.penalty.addEventListener('keydown', (event: KeyboardEvent) => {
            let numberKeys: string[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'Backspace', 'Delete', 'Escape', 'Enter', 'NumpadEnter'];
            if (!numberKeys.includes(event.key)) {
                event.preventDefault();
            }
        });
        (document.getElementById('applyTmButton') as HTMLButtonElement).addEventListener('click', () => {
            this.applyTM();
        });
        setTimeout(() => {
            ipcRenderer.send('set-height', { window: 'applyTm', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    applyTM(): void {
        let mem: string = this.memSelect.value;
        if (mem === 'none') {
            ipcRenderer.send('show-message', { type: 'warning', message: 'Select memory', parent: 'applyTm' });
            return;
        }
        if (this.penalty.value.length === 0) {
            this.penalty.value = '0';
        }
        let penalization: number = Number.parseInt(this.penalty.value);
        if (penalization > 59) {
            ipcRenderer.send('show-message', { type: 'warning', message: 'Penalization must be less than 60%', parent: 'applyTm' });
            return;
        }
        let params: any = {
            project: this.project,
            memory: mem,
            penalization: penalization
        }
        ipcRenderer.send('search-memory-all', params);
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
        ipcRenderer.send('get-memory-param');
    }
}
