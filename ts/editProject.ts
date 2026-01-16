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
import { Language } from "typesbcp47";
import { Project } from "./project.js";

export class EditProject {

    projectId: string = '';

    constructor() {
        ipcRenderer.send('get-theme');
        ipcRenderer.on('set-theme', (event: IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        ipcRenderer.send('get-clients');
        ipcRenderer.on('set-clients', (event: IpcRendererEvent, clients: string[]) => {
            this.setClients(clients);
        });
        ipcRenderer.send('get-subjects');
        ipcRenderer.on('set-subjects', (event: IpcRendererEvent, subjects: string[]) => {
            this.setSubjects(subjects);
        });
        ipcRenderer.send('get-languages');
        ipcRenderer.on('set-languages', (event: IpcRendererEvent, arg: any) => {
            this.setLanguages(arg);
            ipcRenderer.send('get-project-data');
        });
        ipcRenderer.on('project-data', (event: IpcRendererEvent, project: Project) => {
            this.projectId = project.id;
            (document.getElementById('nameInput') as HTMLInputElement).value = project.description;
            (document.getElementById('subjectInput') as HTMLInputElement).value = project.subject;
            (document.getElementById('clientInput') as HTMLInputElement).value = project.client;
            (document.getElementById('srcLangSelect') as HTMLSelectElement).value = project.sourceLang;
            (document.getElementById('tgtLangSelect') as HTMLSelectElement).value = project.targetLang;
            (document.getElementById('nameInput') as HTMLInputElement).focus();
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.updateProject();
            }
            if (event.code === 'Escape') {
                ipcRenderer.send('close-editProject');
            }
        });
        (document.getElementById('updateProjectButton') as HTMLButtonElement).addEventListener('click', () => {
            this.updateProject();
        });
        setTimeout(() => {
            ipcRenderer.send('set-height', { window: 'editProject', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    updateProject(): void {
        let name: string = (document.getElementById('nameInput') as HTMLInputElement).value;
        if (name === '') {
            ipcRenderer.send('show-message', { type: 'warning', message: 'Enter name', parent: 'addProject' });
            return;
        }
        let subject: string = (document.getElementById('subjectInput') as HTMLInputElement).value;
        let client: string = (document.getElementById('clientInput') as HTMLInputElement).value;
        let srcLang: string = (document.getElementById('srcLangSelect') as HTMLSelectElement).value;
        if (srcLang === 'none') {
            ipcRenderer.send('show-message', { type: 'warning', message: 'Select source language', parent: 'addProject' });
            return;
        }
        let tgtLang: string = (document.getElementById('tgtLangSelect') as HTMLSelectElement).value;
        if (tgtLang === 'none') {
            ipcRenderer.send('show-message', { type: 'warning', message: 'Select target language', parent: 'addProject' });
            return;
        }

        let params: any = {
            project: this.projectId,
            description: name,
            subject: subject,
            client: client,
            srcLang: srcLang,
            tgtLang: tgtLang
        }
        ipcRenderer.send('update-project', params);
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
        for (let subject of subjects) {
            options = options + '<option value="' + subject + '">' + subject + '</option>';
        }
        (document.getElementById('subjects') as HTMLDataListElement).innerHTML = options;
    }

    setLanguages(arg: any): void {
        let array: Language[] = arg.languages;
        let languageOptions: string = '<option value="none">Select Language</option>';
        for (let lang of array) {
            languageOptions = languageOptions + '<option value="' + lang.code + '">' + lang.description + '</option>';
        }
        (document.getElementById('srcLangSelect') as HTMLSelectElement).innerHTML = languageOptions;
        (document.getElementById('tgtLangSelect') as HTMLSelectElement).innerHTML = languageOptions;
    }
}
