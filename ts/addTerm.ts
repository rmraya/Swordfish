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

export class AddTerm {

    glossary: string = '';

    constructor() {
        ipcRenderer.send('get-theme');
        ipcRenderer.on('set-theme', (event: IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.addTerm();
            }
            if (event.code === 'Escape') {
                ipcRenderer.send('close-addTerm');
            }
        });
        ipcRenderer.send('get-languages');
        ipcRenderer.on('set-languages', (event: IpcRendererEvent, arg: any) => {
            this.setLanguages(arg);
        });
        ipcRenderer.send('get-glossary-param');
        ipcRenderer.on('set-glossary', (event: IpcRendererEvent, glossary: string) => {
            this.glossary = glossary;
        });
        ipcRenderer.on('set-selected-text', (event: IpcRendererEvent, arg: { selected: string, lang?: string, srcLang: string, tgtLang: string }) => {
            this.setParams(arg);
        });
        (document.getElementById('srcLangSelect') as HTMLSelectElement).addEventListener('change', () => {
            let code: string = (document.getElementById('srcLangSelect') as HTMLSelectElement).value;
            if (this.isBiDi(code)) {
                (document.getElementById('source') as HTMLInputElement).dir = 'rtl';
            }
        });
        (document.getElementById('tgtLangSelect') as HTMLSelectElement).addEventListener('change', () => {
            let code: string = (document.getElementById('tgtLangSelect') as HTMLSelectElement).value;
            if (this.isBiDi(code)) {
                (document.getElementById('target') as HTMLInputElement).dir = 'rtl';
            }
        });
        (document.getElementById('addTermButton') as HTMLButtonElement).addEventListener('click', () => {
            this.addTerm();
        });
        (document.getElementById('source') as HTMLInputElement).focus();
        setTimeout(() => {
            ipcRenderer.send('set-height', { window: 'addTerm', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    addTerm(): void {
        let sourceTerm: string = (document.getElementById('source') as HTMLInputElement).value;
        if (sourceTerm === '') {
            ipcRenderer.send('show-message', { type: 'warning', message: 'Enter source term', parent: 'addTerm' });
            return;
        }
        let targetTerm: string = (document.getElementById('target') as HTMLInputElement).value;
        if (targetTerm === '') {
            ipcRenderer.send('show-message', { type: 'warning', message: 'Enter target term', parent: 'addTerm' });
            return;
        }
        let srcLang: string = (document.getElementById('srcLangSelect') as HTMLSelectElement).value;
        if (srcLang === 'none') {
            ipcRenderer.send('show-message', { type: 'warning', message: 'Select source language', parent: 'addTerm' });
            return;
        }
        let tgtLang: string = (document.getElementById('tgtLangSelect') as HTMLSelectElement).value;
        if (tgtLang === 'none') {
            ipcRenderer.send('show-message', { type: 'warning', message: 'Select target language', parent: 'addTerm' });
            return;
        }
        ipcRenderer.send('add-to-glossary', {
            glossary: this.glossary,
            sourceTerm: sourceTerm,
            targetTerm: targetTerm,
            srcLang: srcLang,
            tgtLang: tgtLang
        });
    }

    setLanguages(arg: any): void {
        let array: Language[] = arg.languages;
        let languageOptions: string = '<option value="none">Select Language</option>';
        for (let lang of array) {
            languageOptions = languageOptions + '<option value="' + lang.code + '">' + lang.description + '</option>';
        }
        (document.getElementById('srcLangSelect') as HTMLSelectElement).innerHTML = languageOptions;
        if ((document.getElementById('srcLangSelect') as HTMLSelectElement).value === 'none') {
            (document.getElementById('srcLangSelect') as HTMLSelectElement).value = arg.srcLang;
        }
        (document.getElementById('tgtLangSelect') as HTMLSelectElement).innerHTML = languageOptions;
        if ((document.getElementById('tgtLangSelect') as HTMLSelectElement).value === 'none') {
            (document.getElementById('tgtLangSelect') as HTMLSelectElement).value = arg.tgtLang;
        }
        ipcRenderer.send('get-selection');
    }

    setParams(arg: { selected: string, lang?: string, srcLang: string, tgtLang: string }): void {
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
