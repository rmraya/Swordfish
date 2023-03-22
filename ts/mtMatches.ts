/*******************************************************************************
 * Copyright (c) 2023 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/

class MtMatches {

    electron = require('electron');

    container: HTMLDivElement;
    projectId: string;

    tabHolder: TabHolder;
    matches: Map<string, Match>;

    constructor(div: HTMLDivElement, projectId: string) {
        this.container = div;
        this.projectId = projectId;
        this.matches = new Map<string, Match>();

        let tabContainer: HTMLDivElement = document.createElement('div');
        tabContainer.classList.add('fill_width');
        this.container.appendChild(tabContainer);

        this.tabHolder = new TabHolder(tabContainer, 'mt' + this.projectId);

        let toolbar: HTMLDivElement = document.createElement('div');
        toolbar.classList.add('toolbar');
        toolbar.classList.add('middle');
        toolbar.classList.add('roundedBottom');
        this.container.appendChild(toolbar);

        let acceptTranslation = document.createElement('a');
        acceptTranslation.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M21 11H6.83l3.58-3.59L9 6l-6 6 6 6 1.41-1.41L6.83 13H21v-2z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Accept Machine Translation</span>';
        acceptTranslation.className = 'tooltip';
        acceptTranslation.addEventListener('click', () => {
            this.acceptTranslation();
        });
        toolbar.appendChild(acceptTranslation);

        let requestTranslation = document.createElement('a');
        requestTranslation.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Get Machine Translations</span>';
        requestTranslation.className = 'tooltip';
        requestTranslation.addEventListener('click', () => {
            this.electron.ipcRenderer.send('get-mt-matches');
        });
        toolbar.appendChild(requestTranslation);

        let autoTranslate = document.createElement('a');
        autoTranslate.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M5.495 2h16.505v-2h-17c-1.657 0-3 1.343-3 3v18c0 1.657 1.343 3 3 3h17v-20h-16.505c-1.375 0-1.375-2 0-2zm.505 4h14v16h-14v-16z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Get Auto-Translation</span>';
        autoTranslate.className = 'tooltip';
        autoTranslate.addEventListener('click', () => {
            this.electron.ipcRenderer.send('get-am-matches');
        });
        toolbar.appendChild(autoTranslate);

        this.electron.ipcRenderer.on('accept-mt-match', () => {
            this.acceptTranslation();
        });

        let config: MutationObserverInit = { attributes: true, childList: false, subtree: false };
        let observer = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    tabContainer.style.height = (this.container.clientHeight - toolbar.clientHeight) + 'px';
                }
            }
        });
        observer.observe(this.container, config);
    }

    clear(): void {
        this.tabHolder.clear();
        this.matches.clear();
    }

    add(match: Match) {
        this.matches.set(match.matchId, match);
        let tab = new Tab(match.matchId, match.origin, false);

        let div: HTMLDivElement = tab.getContainer();
        div.classList.add('divContainer');
        div.classList.add('machineContainer');
        div.classList.add('zoom');
        div.style.width = ('calc(100% - 8px');
        div.innerHTML = match.target;
        if (TranslationView.isBiDi(match.tgtLang)) {
            div.dir = 'rtl';
        }

        this.tabHolder.addTab(tab);
    }

    acceptTranslation(): void {
        if (this.tabHolder.size() === 0) {
            return;
        }
        let selected: string = this.tabHolder.getSelected();
        let match: Match = this.matches.get(selected);
        this.electron.ipcRenderer.send('accept-match', match);
    }

    nextMatch(): void {
        this.tabHolder.selectNext();
    }

    previousMatch(): void {
        this.tabHolder.selectPrevious();
    }
}

