/*******************************************************************************
 * Copyright (c) 2007-2022 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/

class ConcordanceSearch {

    electron = require('electron');

    memories: string[];

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => { KeyboardHandler.keyListener(event); });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.search();
            }
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-concordanceSearch');
            }
        });
        this.electron.ipcRenderer.send('get-languages');
        this.electron.ipcRenderer.on('set-languages', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setLanguages(arg);
        });
        document.getElementById('searchButton').addEventListener('click', () => {
            this.search()
        });
        this.electron.ipcRenderer.send('get-concordance-memories');
        this.electron.ipcRenderer.on('set-concordance-memories', (event: Electron.IpcRendererEvent, arg: any) => {
            this.memories = arg.memories;
        });
        this.electron.ipcRenderer.on('set-selected-text', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setParams(arg);
        });
        (document.getElementById('maxEntries') as HTMLSelectElement).value = '20';
        (document.getElementById('searchText') as HTMLInputElement).focus();
        document.getElementById('languagesSelect').addEventListener('change', () => {
            let code: string = (document.getElementById('languagesSelect') as HTMLSelectElement).value;
            if (this.isBiDi(code)) {
                (document.getElementById('searchText') as HTMLInputElement).dir = 'rtl';
            }
        });
        this.electron.ipcRenderer.send('concordance-search-height', { width: document.body.clientWidth, height: document.body.clientHeight });
    }

    setLanguages(arg: any): void {
        let array = arg.languages;
        let languageOptions = '<option value="none">Select Language</option>';
        for (let lang of array) {
            languageOptions = languageOptions + '<option value="' + lang.code + '">' + lang.description + '</option>';
        }
        document.getElementById('languagesSelect').innerHTML = languageOptions;
        (document.getElementById('languagesSelect') as HTMLSelectElement).value = arg.srcLang;
        this.electron.ipcRenderer.send('get-selection');
    }

    setParams(arg: any): void {
        (document.getElementById('searchText') as HTMLInputElement).value = arg.selected;
        if (arg.lang) {
            (document.getElementById('languagesSelect') as HTMLSelectElement).value = arg.lang;
            if (this.isBiDi(arg.lang)) {
                (document.getElementById('searchText') as HTMLInputElement).dir = 'rtl';
            }
        }
    }

    search(): void {
        let searchInput: HTMLInputElement = document.getElementById('searchText') as HTMLInputElement;
        let searchText: string = searchInput.value;
        if (searchText === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Enter text to search', parent: 'concordanceSearch' });
            return;
        }
        let languagesSelect: HTMLSelectElement = document.getElementById('languagesSelect') as HTMLSelectElement;
        let lang: string = languagesSelect.value;
        if (lang === 'none') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select language', parent: 'concordanceSearch' });
            return;
        }
        let regExp: HTMLInputElement = document.getElementById('regularExpression') as HTMLInputElement;
        let caseSensitive: HTMLInputElement = document.getElementById('caseSensitive') as HTMLInputElement;
        let count: string = (document.getElementById('maxEntries') as HTMLSelectElement).value;
        this.electron.ipcRenderer.send('get-concordance', {
            searchStr: searchText,
            srcLang: lang,
            limit: Number.parseInt(count, 10),
            regExp: regExp.checked,
            caseSensitive: caseSensitive.checked,
            memories: this.memories
        });
    }

    isBiDi(code: string): boolean {
        return code.startsWith("ar") || code.startsWith("fa") || code.startsWith("az") || code.startsWith("ur")
            || code.startsWith("pa-PK") || code.startsWith("ps") || code.startsWith("prs") || code.startsWith("ug")
            || code.startsWith("he") || code.startsWith("ji") || code.startsWith("yi");
    }
}
