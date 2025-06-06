/*******************************************************************************
 * Copyright (c) 2007 - 2025 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/

class ReplaceText {

    electron = require('electron');

    project: string = '';

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.replaceText();
            }
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-replaceText');
            }
        });
        this.electron.ipcRenderer.send('get-project-param');
        this.electron.ipcRenderer.on('set-project', (event: Electron.IpcRendererEvent, project: string) => {
            this.project = project;
        });
        (document.getElementById('replace') as HTMLButtonElement).addEventListener('click', () => {
            this.replaceText();
        });
        (document.getElementById('searchText') as HTMLInputElement).focus();
        setTimeout(() => {
            this.electron.ipcRenderer.send('set-height', { window: 'replaceText', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    replaceText(): void {
        let searchInput: HTMLInputElement = document.getElementById('searchText') as HTMLInputElement;
        let searchText: string = searchInput.value;
        if (searchText === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Enter text to search', parent: 'replaceText' });
            return;
        }
        let replaceInput: HTMLInputElement = document.getElementById('replaceText') as HTMLInputElement;
        let replaceText = replaceInput.value;
        let regExp: HTMLInputElement = document.getElementById('regularExpression') as HTMLInputElement;
        let caseSensitive: HTMLInputElement = document.getElementById('caseSensitive') as HTMLInputElement;

        this.electron.ipcRenderer.send('search-replace', {
            project: this.project,
            searchText: searchText,
            replaceText: replaceText,
            regExp: regExp.checked,
            caseSensitive: caseSensitive.checked
        });
    }
}
