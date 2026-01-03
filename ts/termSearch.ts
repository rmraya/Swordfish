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
import { LanguageInterface } from "./language.js";

export class TermSearch {

    glossary: string = '';

    constructor() {
        ipcRenderer.send('get-theme');
        ipcRenderer.on('set-theme', (event: IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.search();
            }
            if (event.code === 'Escape') {
                ipcRenderer.send('close-termSearch');
            }
        });
        ipcRenderer.send('get-languages');
        ipcRenderer.on('set-languages', (event: IpcRendererEvent, arg: any) => {
            this.setLanguages(arg);
        });
        (document.getElementById('searchButton') as HTMLButtonElement).addEventListener('click', () => {
            this.search()
        });
        ipcRenderer.send('get-glossary-param');
        ipcRenderer.on('set-glossary', (event: IpcRendererEvent, glossary: string) => {
            this.glossary = glossary;
        });
        ipcRenderer.on('set-selected-text', (event: IpcRendererEvent, arg: { selected: string, lang?: string, srcLang: string, tgtLang: string }) => {
            this.setParams(arg);
        });
        (document.getElementById('similarity') as HTMLSelectElement).value = '70';
        (document.getElementById('searchText') as HTMLInputElement).focus();
        (document.getElementById('languagesSelect') as HTMLSelectElement).addEventListener('change', () => {
            let code: string = (document.getElementById('languagesSelect') as HTMLSelectElement).value;
            if (this.isBiDi(code)) {
                (document.getElementById('searchText') as HTMLInputElement).dir = 'rtl';
            }
        });
        setTimeout(() => {
            ipcRenderer.send('set-height', { window: 'termSearch', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    setLanguages(arg: any): void {
        let array: LanguageInterface[] = arg.languages;
        let languageOptions: string = '<option value="none">Select Language</option>';
        for (let lang of array) {
            languageOptions = languageOptions + '<option value="' + lang.code + '">' + lang.description + '</option>';
        }
        let languageSelect: HTMLSelectElement = document.getElementById('languagesSelect') as HTMLSelectElement;
        languageSelect.innerHTML = languageOptions;
        languageSelect.value = arg.srcLang;
        ipcRenderer.send('get-selection');
    }

    setParams(arg: { selected: string, lang?: string, srcLang: string, tgtLang: string }): void {
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
            ipcRenderer.send('show-message', { type: 'warning', message: 'Enter term to search', parent: 'termSearch' });
            return;
        }
        let languagesSelect: HTMLSelectElement = document.getElementById('languagesSelect') as HTMLSelectElement;
        let lang: string = languagesSelect.value;
        if (lang === 'none') {
            ipcRenderer.send('show-message', { type: 'warning', message: 'Select language', parent: 'termSearch' });
            return;
        }
        let caseSensitive: HTMLInputElement = document.getElementById('caseSensitive') as HTMLInputElement;
        let similarity: string = (document.getElementById('similarity') as HTMLSelectElement).value;
        ipcRenderer.send('search-terms', {
            searchStr: searchText,
            srcLang: lang,
            similarity: Number.parseInt(similarity, 10),
            caseSensitive: caseSensitive.checked,
            glossary: this.glossary
        });
    }

    isBiDi(code: string): boolean {
        return code.startsWith("ar") || code.startsWith("fa") || code.startsWith("az") || code.startsWith("ur")
            || code.startsWith("pa-PK") || code.startsWith("ps") || code.startsWith("prs") || code.startsWith("ug")
            || code.startsWith("he") || code.startsWith("ji") || code.startsWith("yi");
    }
}
