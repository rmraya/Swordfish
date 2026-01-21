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

export class AddGlossary {

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
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.addGlossary();
            }
            if (event.code === 'Escape') {
                ipcRenderer.send('close-addGlossary');
            }
        });
        (document.getElementById('addGlossaryButton') as HTMLButtonElement).addEventListener('click', () => {
            this.addGlossary();
        });
        (document.getElementById('nameInput') as HTMLInputElement).focus();
        setTimeout(() => {
            ipcRenderer.send('set-height', { window: 'addGlossary', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    addGlossary(): void {
        let name: string = (document.getElementById('nameInput') as HTMLInputElement).value;
        if (name === '') {
            ipcRenderer.send('show-message', { type: 'warning', message: 'Enter name', parent: 'addGlossary' });
            return;
        }
        let params: any = {
            name: name,
            project: (document.getElementById('projectInput') as HTMLInputElement).value,
            subject: (document.getElementById('subjectInput') as HTMLInputElement).value,
            client: (document.getElementById('clientInput') as HTMLInputElement).value
        }
        ipcRenderer.send('add-glossary', params);
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
}
