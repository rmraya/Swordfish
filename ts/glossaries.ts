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

class GlossariesView {

    electron = require('electron');

    container: HTMLDivElement;
    tbody: HTMLTableSectionElement;
    tableContainer: HTMLDivElement;
    selected: Map<string, any>;

    constructor(div: HTMLDivElement) {
        this.selected = new Map<string, any>();
        this.container = div;
        let topBar: HTMLDivElement = document.createElement('div');
        topBar.className = 'toolbar';
        this.container.appendChild(topBar);

        let addButton = document.createElement('a');
        addButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M20 6h-8l-2-2H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm0 12H4V6h5.17l2 2H20v10zm-8-4h2v2h2v-2h2v-2h-2v-2h-2v2h-2z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Add Glossary</span>';
        addButton.className = 'tooltip';
        addButton.addEventListener('click', () => {
            this.addGlossary()
        });
        topBar.appendChild(addButton);

        let removeButton = document.createElement('a');
        removeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8 9h8v10H8V9zm7.5-5l-1-1h-5l-1 1H5v2h14V4h-3.5z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Remove Glossary</span>';
        removeButton.className = 'tooltip';
        removeButton.addEventListener('click', () => {
            this.removeGlossary()
        });
        topBar.appendChild(removeButton);

        let importButton = document.createElement('a');
        importButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24" viewBox="0 0 24 24" width="24"><path d="M19,9h-2v6.59L5.41,4L4,5.41L15.59,17H9v2h10V9z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Import Glossary File</span>';
        importButton.className = 'tooltip';
        importButton.addEventListener('click', () => {
            this.importGlossary();
        });
        importButton.style.marginLeft = '20px';
        topBar.appendChild(importButton);

        let exportButton = document.createElement('a');
        exportButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24" viewBox="0 0 24 24" width="24"><path d="M9,5v2h6.59L4,18.59L5.41,20L17,8.41V15h2V5H9z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Export Glossary</span>';
        exportButton.className = 'tooltip';
        exportButton.addEventListener('click', () => {
            this.exportGlossary();
        });
        topBar.appendChild(exportButton);

        let addTermButton = document.createElement('a');
        addTermButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Add Term to Glossary</span>';
        addTermButton.className = 'tooltip';
        addTermButton.style.marginLeft = '20px';
        addTermButton.addEventListener('click', () => {
            this.addTerm();
        });
        topBar.appendChild(addTermButton);

        let termSearchButton = document.createElement('a');
        termSearchButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M13 8h-8v-1h8v1zm0 2h-8v-1h8v1zm-3 2h-5v-1h5v1zm11.172 12l-7.387-7.387c-1.388.874-3.024 1.387-4.785 1.387-4.971 0-9-4.029-9-9s4.029-9 9-9 9 4.029 9 9c0 1.761-.514 3.398-1.387 4.785l7.387 7.387-2.828 2.828zm-12.172-8c3.859 0 7-3.14 7-7s-3.141-7-7-7-7 3.14-7 7 3.141 7 7 7z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Search Term in Glossary</span>';
        termSearchButton.className = 'tooltip';
        termSearchButton.addEventListener('click', () => {
            this.searchTerm();
        });
        topBar.appendChild(termSearchButton);

        this.tableContainer = document.createElement('div');
        this.tableContainer.classList.add('divContainer');
        this.container.appendChild(this.tableContainer);

        let glossariesTable = document.createElement('table');
        glossariesTable.classList.add('fill_width');
        glossariesTable.classList.add('stripes');
        this.tableContainer.appendChild(glossariesTable);

        glossariesTable.innerHTML =
            '<thead><tr>' +
            '<th style="padding-left:5px;padding-right:5px;">Name</th>' +
            '<th style="padding-left:5px;padding-right:5px;">Project</th>' +
            '<th style="padding-left:5px;padding-right:5px;">Client</th>' +
            '<th style="padding-left:5px;padding-right:5px;">Subject</th>' +
            '<th style="padding-left:5px;padding-right:5px;">Created</th>' +
            '</tr></thead>';

        this.tbody = document.createElement('tbody');
        glossariesTable.appendChild(this.tbody);

        this.electron.ipcRenderer.on('set-glossaries', (event: Electron.IpcRendererEvent, arg: any) => {
            this.displayGlossaries(arg);
        });

        this.loadGlossaries();

        this.watchSizes();

        setTimeout(() => {
            this.setSizes();
        }, 250);
    }

    setSizes(): void {
        let body = document.getElementById('body');
        this.tableContainer.style.height = (body.clientHeight - 65) + 'px';
        this.tableContainer.style.width = this.container.clientWidth + 'px';
    }

    watchSizes(): void {
        let targetNode: HTMLElement = document.getElementById('main');
        let config: any = { attributes: true, childList: false, subtree: false };
        let observer = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    this.setSizes();
                }
            }
        });
        observer.observe(targetNode, config);
    }

    addGlossary(): void {
        this.electron.ipcRenderer.send('show-add-glossary');
    }

    removeGlossary(): void {
        if (this.selected.size === 0) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select glossary' });
            return;
        }
        let glossaries: string[] = [];
        for (let key of this.selected.keys()) {
            glossaries.push(key);
        }
        this.electron.ipcRenderer.send('remove-glossaries', glossaries);
    }

    importGlossary(): void {
        if (this.selected.size === 0) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select glossary' });
            return;
        }
        if (this.selected.size > 1) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select one glossary' });
            return;
        }
        for (let key of this.selected.keys()) {
            this.electron.ipcRenderer.send('show-import-glossary', key);
        }
    }

    exportGlossary(): void {
        if (this.selected.size === 0) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select glossary' });
            return;
        }
        let glossaries: any[] = [];
        for (let key of this.selected.keys()) {
            let mem = { glossary: key, name: this.selected.get(key).name }
            glossaries.push(mem);
        }
        this.electron.ipcRenderer.send('export-glossaries', glossaries);
    }

    loadGlossaries(): void {
        this.electron.ipcRenderer.send('get-glossaries');
    }

    displayGlossaries(glossaries: any[]) {
        this.tbody.innerHTML = '';
        let length = glossaries.length;
        for (let i = 0; i < length; i++) {
            let p = glossaries[i];
            let tr: HTMLTableRowElement = document.createElement('tr');
            tr.id = p.id;
            tr.addEventListener('click', (event: MouseEvent) => {
                this.clicked(event, p);
            });
            this.tbody.appendChild(tr);

            let td = document.createElement('td');
            td.classList.add('noWrap');
            td.classList.add('middle');
            td.innerText = p.name;
            tr.append(td);

            td = document.createElement('td');
            td.classList.add('noWrap');
            td.classList.add('middle');
            td.classList.add('center');
            td.style.minWidth = '170px';
            td.innerText = p.project;
            tr.append(td);

            td = document.createElement('td');
            td.classList.add('noWrap');
            td.classList.add('middle');
            td.classList.add('center');
            td.style.minWidth = '170px';
            td.innerText = p.client;
            tr.append(td);

            td = document.createElement('td');
            td.classList.add('noWrap');
            td.classList.add('middle');
            td.classList.add('center');
            td.style.minWidth = '170px';
            td.innerText = p.subject;
            tr.append(td);

            td = document.createElement('td');
            td.classList.add('noWrap');
            td.classList.add('middle');
            td.classList.add('center');
            td.style.minWidth = '170px';
            td.innerText = p.creationString;
            tr.append(td);
        }
        this.selected.clear();
    }

    clicked(event: MouseEvent, glossary: any): void {
        let tr: HTMLTableRowElement = event.currentTarget as HTMLTableRowElement;
        let isSelected: boolean = this.selected.has(glossary.id);
        if (!isSelected) {
            if (!(event.ctrlKey || event.metaKey)) {
                for (let key of this.selected.keys()) {
                    document.getElementById(key).classList.remove('selected');
                }
                this.selected.clear()
            }
            this.selected.set(glossary.id, glossary);
            tr.classList.add('selected');
        } else {
            this.selected.delete(glossary.id);
            tr.classList.remove('selected');
        }
    }

    searchTerm(): void {
        if (this.selected.size === 0) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select glossary' });
            return;
        }
        if (this.selected.size > 1) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select one glossary' });
            return;
        }
        for (let key of this.selected.keys()) {
            this.electron.ipcRenderer.send('show-term-search', { glossary: key });
        }
    }

    addTerm(): void {
        if (this.selected.size === 0) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select glossary' });
            return;
        }
        if (this.selected.size > 1) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select one glossary' });
            return;
        }
        for (let key of this.selected.keys()) {
            this.electron.ipcRenderer.send('show-add-term', { glossary: key });
        }
    }
}