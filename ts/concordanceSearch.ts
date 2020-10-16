/*****************************************************************************
Copyright (c) 2007-2020 - Maxprograms,  http://www.maxprograms.com/

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
            if (event.code === 'Enter') {
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
        this.electron.ipcRenderer.on('set-memories', (event: Electron.IpcRendererEvent, arg: any) => {
            this.memories = arg;
        });
        this.electron.ipcRenderer.on('set-selected-text', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setParams(arg);
        });
        this.electron.ipcRenderer.on('get-height', () => {
            let body: HTMLBodyElement = document.getElementById('body') as HTMLBodyElement;
            this.electron.ipcRenderer.send('concordance-search-height', { width: body.clientWidth, height: body.clientHeight });
        });
        (document.getElementById('maxEntries') as HTMLSelectElement).value = '20';
        (document.getElementById('searchText') as HTMLInputElement).focus();
    }

    setLanguages(arg: any): void {
        var array = arg.languages;
        var languageOptions = '<option value="none">Select Language</option>';
        for (let i = 0; i < array.length; i++) {
            var lang = array[i];
            languageOptions = languageOptions + '<option value="' + lang.code + '">' + lang.description + '</option>';
        }
        document.getElementById('languagesSelect').innerHTML = languageOptions;
        (document.getElementById('languagesSelect') as HTMLSelectElement).value = arg.srcLang;
        this.electron.ipcRenderer.send('get-selection');
    }

    setParams(arg: any): void {
        (document.getElementById('searchText') as HTMLInputElement).value = arg.selected;
        if (arg.lang !== '') {
            (document.getElementById('languagesSelect') as HTMLSelectElement).value = arg.lang;
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
}

new ConcordanceSearch();