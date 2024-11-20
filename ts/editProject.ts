/*******************************************************************************
 * Copyright (c) 2007 - 2024 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/

class EditProject {

    electron = require('electron');
    projectId: string;

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
        });
        this.electron.ipcRenderer.send('get-clients');
        this.electron.ipcRenderer.on('set-clients', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setClients(arg);
        });
        this.electron.ipcRenderer.send('get-subjects');
        this.electron.ipcRenderer.on('set-subjects', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setSubjects(arg);
        });
        this.electron.ipcRenderer.send('get-languages');
        this.electron.ipcRenderer.on('set-languages', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setLanguages(arg);
            this.electron.ipcRenderer.send('get-project-data');
        });
        this.electron.ipcRenderer.on('project-data', (event: Electron.IpcRendererEvent, project: Project) => {
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
                this.electron.ipcRenderer.send('close-editProject');
            }
        });
        document.getElementById('updateProjectButton').addEventListener('click', () => {
            this.updateProject();
        });
        setTimeout(() => {
            this.electron.ipcRenderer.send('set-height', { window: 'editProject', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    updateProject(): void {
        let name: string = (document.getElementById('nameInput') as HTMLInputElement).value;
        if (name === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Enter name', parent: 'addProject' });
            return;
        }
        let subject: string = (document.getElementById('subjectInput') as HTMLInputElement).value;
        let client: string = (document.getElementById('clientInput') as HTMLInputElement).value;
        let srcLang = (document.getElementById('srcLangSelect') as HTMLSelectElement).value;
        if (srcLang === 'none') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select source language', parent: 'addProject' });
            return;
        }
        let tgtLang = (document.getElementById('tgtLangSelect') as HTMLSelectElement).value;
        if (tgtLang === 'none') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select target language', parent: 'addProject' });
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
        this.electron.ipcRenderer.send('update-project', params);
    }

    setClients(clients: string[]): void {
        let options: string = '';
        let length: number = clients.length;
        for (let i = 0; i < length; i++) {
            options = options + '<option value="' + clients[i] + '">' + clients[i] + '</option>';
        }
        document.getElementById('clients').innerHTML = options;
    }

    setSubjects(subjects: string[]): void {
        let options: string = '';
        for (let subject of subjects) {
            options = options + '<option value="' + subject + '">' + subject + '</option>';
        }
        document.getElementById('subjects').innerHTML = options;
    }

    setLanguages(arg: any): void {
        let array = arg.languages;
        let languageOptions = '<option value="none">Select Language</option>';
        for (let lang of array) {
            languageOptions = languageOptions + '<option value="' + lang.code + '">' + lang.description + '</option>';
        }
        document.getElementById('srcLangSelect').innerHTML = languageOptions;
        document.getElementById('tgtLangSelect').innerHTML = languageOptions;
    }
}
