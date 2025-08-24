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

class FilterSegments {

    electron = require('electron');

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        this.electron.ipcRenderer.send('get-filter-params');
        this.electron.ipcRenderer.on('set-params', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setParams(arg);
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.filterSegments();
            }
            if (event.code === 'Escape') {
                this.clearFilter();
            }
        });
        let regExp: HTMLInputElement = document.getElementById('isRegExp') as HTMLInputElement;
        regExp.addEventListener('change', () => {
            let caseSensitive: HTMLInputElement = document.getElementById('caseSensitive') as HTMLInputElement;
            caseSensitive.disabled = regExp.checked;
            if (regExp.checked) {
                caseSensitive.checked = false;
            }
        });
        (document.getElementById('filterSegments') as HTMLButtonElement).addEventListener('click', () => {
            this.filterSegments();
        });
        (document.getElementById('clearFilter') as HTMLButtonElement).addEventListener('click', () => {
            this.clearFilter();
        });
        (document.getElementById('filterText') as HTMLInputElement).focus();
        setTimeout(() => {
            this.electron.ipcRenderer.send('set-height', { window: 'filterSegments', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    filterSegments(): void {
        let filterText: string = (document.getElementById('filterText') as HTMLInputElement).value;
        if (filterText === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Enter text to search', parent: 'filterSegments' });
            return;
        }
        let filterLanguage: string = 'source';
        if ((document.getElementById('target') as HTMLInputElement).checked) {
            filterLanguage = 'target';
        }
        let showUntranslated: boolean = (document.getElementById('showUntranslated') as HTMLInputElement).checked;
        let showTranslated: boolean = (document.getElementById('showTranslated') as HTMLInputElement).checked;
        let showConfirmed: boolean = (document.getElementById('showConfirmed') as HTMLInputElement).checked;
        if (!(showUntranslated || showTranslated || showConfirmed)) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select segments to display', parent: 'filterSegments' });
            return;
        }
        let params: any = {
            filterText: filterText,
            filterLanguage: filterLanguage,
            caseSensitiveFilter: (document.getElementById('caseSensitive') as HTMLInputElement).checked,
            regExp: (document.getElementById('isRegExp') as HTMLInputElement).checked,
            showUntranslated: showUntranslated,
            showTranslated: showTranslated,
            showConfirmed: showConfirmed
        }
        this.electron.ipcRenderer.send('filter-options', params);
    }

    clearFilter(): void {
        let params: any = {
            filterText: '',
            filterLanguage: '',
            caseSensitiveFilter: false,
            regExp: false,
            showUntranslated: true,
            showTranslated: true,
            showConfirmed: true
        }
        this.electron.ipcRenderer.send('filter-options', params);
    }

    setParams(arg: any): void {
        (document.getElementById('filterText') as HTMLInputElement).value = arg.filterText;
        (document.getElementById('source') as HTMLInputElement).checked = (arg.filterLanguage === 'source');
        (document.getElementById('target') as HTMLInputElement).checked = (arg.filterLanguage === 'target');
        (document.getElementById('isRegExp') as HTMLInputElement).checked = arg.regExp;
        let caseSensitive: HTMLInputElement = document.getElementById('caseSensitive') as HTMLInputElement;
        caseSensitive.disabled = arg.regExp;
        if (arg.regExp) {
            caseSensitive.checked = false;
        } else {
            caseSensitive.checked = arg.caseSensitiveFilter;
        }
        (document.getElementById('showUntranslated') as HTMLInputElement).checked = arg.showUntranslated;
        (document.getElementById('showTranslated') as HTMLInputElement).checked = arg.showTranslated;
        (document.getElementById('showConfirmed') as HTMLInputElement).checked = arg.showConfirmed;
    }
}
