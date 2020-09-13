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

class AddTerm {

    electron = require('electron');

    glossary: string;

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => { KeyboardHandler.keyListener(event); });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Enter') {
                this.addTerm();
            }
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-addTerm');
            }
        });
        this.electron.ipcRenderer.on('get-height', () => {
            let body: HTMLBodyElement = document.getElementById('body') as HTMLBodyElement;
            this.electron.ipcRenderer.send('add-term-height', { width: body.clientWidth, height: body.clientHeight });
        });
        this.electron.ipcRenderer.send('get-languages');
        this.electron.ipcRenderer.on('set-languages', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setLanguages(arg);
        });
        this.electron.ipcRenderer.on('set-glossary', (event: Electron.IpcRendererEvent, arg: any) => {
            this.glossary = arg.glossary;
        });
        document.getElementById('addTermButton').addEventListener('click', () => {
            this.addTerm();
        });
        (document.getElementById('source') as HTMLInputElement).focus();
    }

    addTerm(): void {
        let sourceTerm: string = (document.getElementById('source') as HTMLInputElement).value;
        if (sourceTerm === '' ) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Enter source term' });
            return;
        }
        let targetTerm: string = (document.getElementById('target') as HTMLInputElement).value;
        if (targetTerm === '' ) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Enter target term' });
            return;
        }
        let srcLang: string = (document.getElementById('srcLangSelect') as HTMLSelectElement).value;
        if (srcLang === 'none') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select source language' });
            return;
        }
        let tgtLang: string = (document.getElementById('tgtLangSelect') as HTMLSelectElement).value;
        if (tgtLang === 'none') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select target language' });
            return;
        }
        this.electron.ipcRenderer.send('add-to-glossary', {
            glossary: this.glossary,
            sourceTerm: sourceTerm,
            targetTerm: targetTerm,
            srcLang: srcLang,
            tgtLang: tgtLang
        });
    }

    setLanguages(arg: any): void {
        var array = arg.languages;
        var languageOptions = '<option value="none">Select Language</option>';
        for (let i = 0; i < array.length; i++) {
            var lang = array[i];
            languageOptions = languageOptions + '<option value="' + lang.code + '">' + lang.description + '</option>';
        }
        document.getElementById('srcLangSelect').innerHTML = languageOptions;
        (document.getElementById('srcLangSelect') as HTMLSelectElement).value = arg.srcLang;
        document.getElementById('tgtLangSelect').innerHTML = languageOptions;
        (document.getElementById('tgtLangSelect') as HTMLSelectElement).value = arg.tgtLang;
    }
}

new AddTerm();