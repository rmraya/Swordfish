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

class TmMatches {

    electron = require('electron');

    container: HTMLDivElement;
    projectId: string;

    tabHolder: TabHolder;
    matches: Map<string, any>;
    origin: HTMLSpanElement;

    constructor(div: HTMLDivElement, projectId: string) {
        this.container = div;
        this.projectId = projectId;
        this.matches = new Map<string, any>();

        let tabContainer: HTMLDivElement = document.createElement('div');
        tabContainer.classList.add('fill_width');
        this.container.appendChild(tabContainer);

        this.tabHolder = new TabHolder(tabContainer, 'tm' + this.projectId);

        let toolbar: HTMLDivElement = document.createElement('div');
        toolbar.classList.add('toolbar');
        toolbar.classList.add('middle');
        this.container.appendChild(toolbar);

        let acceptTranslation = document.createElement('a');
        acceptTranslation.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M21 11H6.83l3.58-3.59L9 6l-6 6 6 6 1.41-1.41L6.83 13H21v-2z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Accept Translation</span>';
        acceptTranslation.className = 'tooltip';
        acceptTranslation.addEventListener('click', () => {
            this.acceptTranslation();
        });
        toolbar.appendChild(acceptTranslation);

        this.origin = document.createElement('span');
        this.origin.innerText = '';
        this.origin.style.marginTop = '4px';
        this.origin.style.marginLeft = '10px';
        toolbar.appendChild(this.origin);

        this.electron.ipcRenderer.on('accept-tm-match', () => {
            this.acceptTranslation();
        });
        
        let config: any = { attributes: true, childList: false, subtree: false };
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
        this.origin.innerText = '';
        this.matches.clear();
    }

    add(match: any) {
        this.matches.set(match.matchId, match);
        let tab = new Tab(match.matchId, match.similarity + '%', false);

        let div: HTMLDivElement = tab.getContainer();
        div.classList.add('fill_width');

        let table = document.createElement('table');
        table.classList.add('fill_width');
        table.classList.add('stripes');
        div.appendChild(table);

        let tr = document.createElement('tr');
        table.appendChild(tr);

        let td = document.createElement('td');
        td.classList.add('preserve');
        td.innerHTML = match.source;
        tr.appendChild(td);

        tr = document.createElement('tr');
        table.appendChild(tr);

        td = document.createElement('td');
        td.classList.add('preserve');
        td.innerHTML = match.target;
        tr.appendChild(td);

        this.tabHolder.addTab(tab);

        if (this.tabHolder.size() === 1) {
            this.origin.innerText = match.origin;
        }

        tab.getLabel().addEventListener('click', () => {
            this.origin.innerText = match.origin;
        });
    }

    acceptTranslation(): void {
        if (this.tabHolder.size() === 0) {
            return;
        }
        let selected: string = this.tabHolder.getSelected();
        let match: any = this.matches.get(selected);
        this.electron.ipcRenderer.send('accept-match', match);
    }
}