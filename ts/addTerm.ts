/*******************************************************************************
 * Copyright (c) 2007-2021 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/

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
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.addTerm();
            }
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-addTerm');
            }
        });
        this.electron.ipcRenderer.send('get-languages');
        this.electron.ipcRenderer.on('set-languages', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setLanguages(arg);
        });
        this.electron.ipcRenderer.send('get-glossary-param');
        this.electron.ipcRenderer.on('set-glossary', (event: Electron.IpcRendererEvent, arg: any) => {
            this.glossary = arg.glossary;
        });
        this.electron.ipcRenderer.on('set-selected-text', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setParams(arg);
        });
        document.getElementById('srcLangSelect').addEventListener('change', (ev: Event) => {
            let code: string = (document.getElementById('srcLangSelect') as HTMLSelectElement).value;
            if (this.isBiDi(code)) {
                (document.getElementById('source') as HTMLInputElement).dir = 'rtl';
            }
        });
        document.getElementById('tgtLangSelect').addEventListener('change', (ev: Event) => {
            let code: string = (document.getElementById('tgtLangSelect') as HTMLSelectElement).value;
            if (this.isBiDi(code)) {
                (document.getElementById('target') as HTMLInputElement).dir = 'rtl';
            }
        });
        document.getElementById('addTermButton').addEventListener('click', () => {
            this.addTerm();
        });
        (document.getElementById('source') as HTMLInputElement).focus();
        let body: HTMLBodyElement = document.getElementById('body') as HTMLBodyElement;
        this.electron.ipcRenderer.send('add-term-height', { width: body.clientWidth, height: body.clientHeight });
    }

    addTerm(): void {
        let sourceTerm: string = (document.getElementById('source') as HTMLInputElement).value;
        if (sourceTerm === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Enter source term', parent: 'addTerm' });
            return;
        }
        let targetTerm: string = (document.getElementById('target') as HTMLInputElement).value;
        if (targetTerm === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Enter target term', parent: 'addTerm' });
            return;
        }
        let srcLang: string = (document.getElementById('srcLangSelect') as HTMLSelectElement).value;
        if (srcLang === 'none') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select source language', parent: 'addTerm' });
            return;
        }
        let tgtLang: string = (document.getElementById('tgtLangSelect') as HTMLSelectElement).value;
        if (tgtLang === 'none') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select target language', parent: 'addTerm' });
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
        let array = arg.languages;
        let languageOptions = '<option value="none">Select Language</option>';
        for (let i = 0; i < array.length; i++) {
            let lang = array[i];
            languageOptions = languageOptions + '<option value="' + lang.code + '">' + lang.description + '</option>';
        }
        document.getElementById('srcLangSelect').innerHTML = languageOptions;
        if ((document.getElementById('srcLangSelect') as HTMLSelectElement).value === 'none') {
            (document.getElementById('srcLangSelect') as HTMLSelectElement).value = arg.srcLang;
        }
        document.getElementById('tgtLangSelect').innerHTML = languageOptions;
        if ((document.getElementById('tgtLangSelect') as HTMLSelectElement).value === 'none') {
            (document.getElementById('tgtLangSelect') as HTMLSelectElement).value = arg.tgtLang;
        }
        this.electron.ipcRenderer.send('get-selection');
    }

    setParams(arg: any): void {
        if (arg.lang) {
            if (arg.lang === arg.srcLang) {
                (document.getElementById('source') as HTMLInputElement).value = arg.selected;
                (document.getElementById('target') as HTMLInputElement).focus();
            } else {
                (document.getElementById('target') as HTMLInputElement).value = arg.selected;
                (document.getElementById('source') as HTMLInputElement).focus();
            }
        }
        if (arg.srcLang) {
            (document.getElementById('srcLangSelect') as HTMLSelectElement).value = arg.srcLang;
            if (this.isBiDi(arg.srcLang)) {
                (document.getElementById('source') as HTMLInputElement).dir = 'rtl';
            }
        }
        if (arg.tgtLang) {
            (document.getElementById('tgtLangSelect') as HTMLSelectElement).value = arg.tgtLang;
            if (this.isBiDi(arg.tgtLang)) {
                (document.getElementById('target') as HTMLInputElement).dir = 'rtl';
            }
        }
    }

    isBiDi(code: string): boolean {
        return code.startsWith("ar") || code.startsWith("fa") || code.startsWith("az") || code.startsWith("ur")
            || code.startsWith("pa-PK") || code.startsWith("ps") || code.startsWith("prs") || code.startsWith("ug")
            || code.startsWith("he") || code.startsWith("ji") || code.startsWith("yi");
    }
}

new AddTerm();