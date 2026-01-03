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

export class DefaultLanguages {

    constructor() {
        ipcRenderer.send('get-theme');
        ipcRenderer.send('get-languages');
        ipcRenderer.on('set-languages', (event: IpcRendererEvent, arg: any) => {
            this.setLanguages(arg);
        });
        ipcRenderer.on('set-theme', (event: IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        (document.getElementById('save') as HTMLButtonElement).addEventListener('click', () => {
            this.savePreferences();
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                ipcRenderer.send('close-defaultLangs');
            }
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.savePreferences();
            }
        });
        (document.getElementById('srcLangSelect') as HTMLSelectElement).focus();
        setTimeout(() => {
            ipcRenderer.send('set-height', { window: 'defaultLangs', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    setLanguages(arg: any): void {
        let array: LanguageInterface[] = arg.languages;
        let languageOptions: string = '<option value="none">Select Language</option>';
        for (let lang of array) {
            languageOptions = languageOptions + '<option value="' + lang.code + '">' + lang.description + '</option>';
        }
        (document.getElementById('srcLangSelect') as HTMLSelectElement).innerHTML = languageOptions;
        (document.getElementById('tgtLangSelect') as HTMLSelectElement).innerHTML = languageOptions;
        ipcRenderer.send('get-preferences');
    }

    savePreferences(): void {
        let prefs: any = {
            srcLang: (document.getElementById('srcLangSelect') as HTMLSelectElement).value,
            tgtLang: (document.getElementById('tgtLangSelect') as HTMLSelectElement).value,
        }
        ipcRenderer.send('save-languages', prefs);
    }
}
