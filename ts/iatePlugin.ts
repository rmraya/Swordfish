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

class IatePlugin {

    electron = require('electron');
    searchText: string = '';
    sourceLang: string = '';
    tgtLangs: string[] = [];

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        this.electron.ipcRenderer.send('get-selection');
        this.electron.ipcRenderer.on('set-selected-text', (event: Electron.IpcRendererEvent, arg: { selected: string, lang?: string, srcLang: string, tgtLang: string }) => {
            this.searchText = arg.selected;
            if (arg.lang && arg.lang === arg.tgtLang) {
                let tmp: string = arg.srcLang;
                arg.srcLang = arg.tgtLang;
                arg.tgtLang = tmp;
            }
            this.sourceLang = arg.srcLang.indexOf('-') !== -1 ? arg.srcLang.split('-')[0] : arg.srcLang;
            this.tgtLangs = [];
            if (arg.tgtLang) {
                this.tgtLangs = [arg.tgtLang.indexOf('-') !== -1 ? arg.tgtLang.split('-')[0] : arg.tgtLang];
            }
        });
        let toolbar: HTMLDivElement = (document.getElementById('toolbar') as HTMLDivElement);
        let iateFrame: HTMLIFrameElement = document.getElementById('iateFrame') as HTMLIFrameElement;
        let loadingDiv: HTMLDivElement = document.getElementById('loading') as HTMLDivElement;
        iateFrame.addEventListener('load', () => {
            loadingDiv.style.display = 'none';
            iateFrame.style.display = 'block';
            if (this.sourceLang) {
                let sourceRadios: NodeListOf<HTMLElement> | undefined = iateFrame.contentDocument?.getElementsByName('iate_selector_sourceLanguages');
                if (sourceRadios) {
                    for (let i = 0; i < sourceRadios.length; i++) {
                        let radio: HTMLInputElement = sourceRadios[i] as HTMLInputElement;
                        if (radio.value === this.sourceLang) {
                            radio.checked = true;
                            const event: Event = new Event('change', { bubbles: true });
                            radio.dispatchEvent(event);
                        }
                    }
                }
            }
            if (this.tgtLangs.length > 0) {
                let tgtCheckboxes: NodeListOf<HTMLElement> | undefined = iateFrame.contentDocument?.getElementsByName('iate_selector_targetLanguages');
                if (tgtCheckboxes) {
                    for (let i = 0; i < tgtCheckboxes.length; i++) {
                        let checkbox: HTMLInputElement = tgtCheckboxes[i] as HTMLInputElement;
                        if (this.tgtLangs.indexOf(checkbox.value) !== -1) {
                            checkbox.checked = true;
                            const event: Event = new Event('change', { bubbles: true });
                            checkbox.dispatchEvent(event);
                        }
                    }
                }
            }
            let iateQuery: HTMLInputElement | undefined = (iateFrame.contentDocument?.getElementById('iate-query') as HTMLInputElement);
            if (iateQuery && this.searchText) {
                iateQuery.value = this.searchText;
                const event: Event = new Event('change', { bubbles: true });
                iateQuery.dispatchEvent(event);
                iateQuery.focus();
            }
            let logo: HTMLCollectionOf<Element> | undefined = iateFrame.contentDocument?.getElementsByClassName('iatelogo');
            if (logo && logo.length > 0) {
                let iateLogo: HTMLAnchorElement = logo[0] as HTMLAnchorElement;
                iateLogo.href = 'https://iate.europa.eu/home';
            }
            this.setSize();
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-iatePlugin');
            }
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                let iateFrame: HTMLIFrameElement = document.getElementById('iateFrame') as HTMLIFrameElement;
                let searchButton: HTMLInputElement | undefined = (iateFrame.contentDocument?.getElementById('iate-search-btn') as HTMLInputElement);
                if (searchButton) {
                    searchButton.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' }));
                }
            }
        });
        (document.getElementById('basic') as HTMLInputElement).addEventListener('click', () => {
            this.harvestLanguages();
            loadingDiv.style.display = 'flex';
            iateFrame.style.display = 'none';
            iateFrame.src = './iate/basic_search.html';
            iateFrame.style.height = '480px';
            this.setSize();
        });
        (document.getElementById('advanced') as HTMLInputElement).addEventListener('click', () => {
            this.harvestLanguages();
            loadingDiv.style.display = 'flex';
            iateFrame.style.display = 'none';
            iateFrame.src = './iate/advanced_search.html';
            iateFrame.style.height = '600px';
            this.setSize();
        });
        let toolbarHeight = toolbar.offsetHeight;
        iateFrame.style.height = (window.innerHeight - toolbarHeight) + 'px';
        window.addEventListener('resize', () => {
            iateFrame.style.height = (window.innerHeight - toolbarHeight) + 'px';
        });
        setTimeout(() => {
            iateFrame.src = './iate/basic_search.html';
            iateFrame.style.height = '480px';
            this.setSize();
        }, 200);
    }

    setSize(): void {
        setTimeout(() => {
            this.electron.ipcRenderer.send('set-height', { window: 'iatePlugin', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    harvestLanguages(): void {
        let iateFrame: HTMLIFrameElement = document.getElementById('iateFrame') as HTMLIFrameElement;
        let iateQuery: HTMLInputElement = (iateFrame.contentDocument?.getElementById('iate-query') as HTMLInputElement);
        if (iateQuery) {
            this.searchText = iateQuery.value;
        }
        let sourceRadios: NodeListOf<HTMLElement> | undefined = iateFrame.contentDocument?.getElementsByName('iate_selector_sourceLanguages');
        if (sourceRadios) {
            for (let i = 0; i < sourceRadios.length; i++) {
                let radio: HTMLInputElement = sourceRadios[i] as HTMLInputElement;
                if (radio.checked) {
                    this.sourceLang = radio.value;
                }
            }
        }
        let tgtCheckboxes: NodeListOf<HTMLElement> | undefined = iateFrame.contentDocument?.getElementsByName('iate_selector_targetLanguages');
        if (tgtCheckboxes) {
            this.tgtLangs = [];
            for (let i = 0; i < tgtCheckboxes.length; i++) {
                let checkbox: HTMLInputElement = tgtCheckboxes[i] as HTMLInputElement;
                if (checkbox.checked) {
                    this.tgtLangs.push(checkbox.value);
                }
            }
        }
    }

}