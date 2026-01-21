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

export class ImportSDLTM {

    memory: string = '';

    constructor() {
        ipcRenderer.send('get-theme');
        ipcRenderer.on('set-theme', (event: IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        ipcRenderer.send('get-project-names');
        ipcRenderer.on('set-project-names', (event: IpcRendererEvent, projects: string[]) => {
            this.setProjectNames(projects);
        });
        ipcRenderer.send('get-clients');
        ipcRenderer.on('set-clients', (event: IpcRendererEvent, clients: string[]) => {
            this.setClients(clients);
        });
        ipcRenderer.send('get-subjects');
        ipcRenderer.on('set-subjects', (event: IpcRendererEvent, subjects: string[]) => {
            this.setSubjects(subjects);
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                ipcRenderer.send('close-importSdltm');
            }
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.importSDLTM();
            }
        });
        ipcRenderer.send('get-memory-param');
        ipcRenderer.on('set-memory', (event: IpcRendererEvent, memory: string) => {
            this.memory = memory;
        });
        (document.getElementById('browse') as HTMLButtonElement).addEventListener('click', () => {
            ipcRenderer.send('get-sdltm-file');
            (document.getElementById('browse') as HTMLButtonElement).blur();
        });
        ipcRenderer.on('set-sdltm-file', (event: IpcRendererEvent, arg: any) => {
            (document.getElementById('sdltm') as HTMLInputElement).value = arg;
        });
        (document.getElementById('importSdltm') as HTMLButtonElement).addEventListener('click', () => {
            this.importSDLTM();
        });
        (document.getElementById('sdltm') as HTMLInputElement).focus();
        setTimeout(() => {
            ipcRenderer.send('set-height', { window: 'importSdltm', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    setProjectNames(projects: string[]): void {
        let options: string = '';
        let length: number = projects.length;
        for (let i = 0; i < length; i++) {
            options = options + '<option value="' + projects[i] + '">' + projects[i] + '</option>';
        }
        (document.getElementById('projects') as HTMLDataListElement).innerHTML = options;
    }

    setClients(clients: string[]): void {
        let options: string = '';
        let length: number = clients.length;
        for (let i = 0; i < length; i++) {
            options = options + '<option value="' + clients[i] + '">' + clients[i] + '</option>';
        }
        (document.getElementById('clients') as HTMLDataListElement).innerHTML = options;
    }

    setSubjects(subjects: string[]): void {
        let options: string = '';
        let length: number = subjects.length;
        for (let i = 0; i < length; i++) {
            options = options + '<option value="' + subjects[i] + '">' + subjects[i] + '</option>';
        }
        (document.getElementById('subjects') as HTMLDataListElement).innerHTML = options;
    }

    importSDLTM(): void {
        let sdltm: string = (document.getElementById('sdltm') as HTMLInputElement).value;
        if (sdltm === '') {
            ipcRenderer.send('show-message', { type: 'warning', message: 'Select SDLTM file', parent: 'importSdltm' });
            return;
        }
        let params = {
            memory: this.memory,
            sdltm: sdltm,
            project: (document.getElementById('projectInput') as HTMLInputElement).value,
            subject: (document.getElementById('subjectInput') as HTMLInputElement).value,
            client: (document.getElementById('clientInput') as HTMLInputElement).value
        }
        ipcRenderer.send('import-sdltm-file', params);
    }
}
