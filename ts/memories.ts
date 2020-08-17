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

class MemoriesView {

    electron = require('electron');

    container: HTMLDivElement;
    tableContainer: HTMLDivElement;
    tbody: HTMLTableSectionElement;
    selected: Map<string, any>;

    constructor(div: HTMLDivElement) {
        this.selected = new Map<string, any>();
        this.container = div;

        let topBar: HTMLDivElement = document.createElement('div');
        topBar.className = 'toolbar';
        this.container.appendChild(topBar);

        let addButton = document.createElement('a');
        addButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M20 6h-8l-2-2H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm0 12H4V6h5.17l2 2H20v10zm-8-4h2v2h2v-2h2v-2h-2v-2h-2v2h-2z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Add Memory</span>';
        addButton.className = 'tooltip';
        addButton.addEventListener('click', () => {
            this.addMemory()
        });
        topBar.appendChild(addButton);

        let removeButton = document.createElement('a');
        removeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8 9h8v10H8V9zm7.5-5l-1-1h-5l-1 1H5v2h14V4h-3.5z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Remove Memory</span>';
        removeButton.className = 'tooltip';
        removeButton.addEventListener('click', () => {
            this.removeMemory()
        });
        topBar.appendChild(removeButton);


        let importButton = document.createElement('a');
        importButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M8 9v-4l8 7-8 7v-4h-8v-6h8zm2-7v2h12v16h-12v2h14v-20h-14z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Import TMX File</span>';
        importButton.className = 'tooltip';
        importButton.addEventListener('click', () => {
            this.importTMX();
        });
        importButton.style.marginLeft = '20px';
        topBar.appendChild(importButton);

        let exportButton = document.createElement('a');
        exportButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M16 9v-4l8 7-8 7v-4h-8v-6h8zm-16-7v20h14v-2h-12v-16h12v-2h-14z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Export as TMX File</span>';
        exportButton.className = 'tooltip';
        exportButton.addEventListener('click', () => {
            this.exportTMX();
        });
        topBar.appendChild(exportButton);

        this.tableContainer = document.createElement('div');
        this.tableContainer.classList.add('divContainer');
        this.container.appendChild(this.tableContainer);

        let memoriesTable = document.createElement('table');
        memoriesTable.classList.add('fill_width');
        memoriesTable.classList.add('stripes');
        this.tableContainer.appendChild(memoriesTable);

        memoriesTable.innerHTML =
            '<thead><tr>' +
            '<th style="padding-left:5px;padding-right:5px;">Name</th>' +
            '<th style="padding-left:5px;padding-right:5px;">Project</th>' +
            '<th style="padding-left:5px;padding-right:5px;">Client</th>' +
            '<th style="padding-left:5px;padding-right:5px;">Subject</th>' +
            '<th style="padding-left:5px;padding-right:5px;">Created</th>' +
            '</tr></thead>';

        this.tbody = document.createElement('tbody');
        memoriesTable.appendChild(this.tbody);

        this.electron.ipcRenderer.on('set-memories', (event: Electron.IpcRendererEvent, arg: any) => {
            this.displayMemories(arg);
        });

        this.loadMemories();

        this.watchSizes();

        setTimeout(() => {
            this.setSizes();
        }, 200);
    }

    setSizes(): void {
        let main = document.getElementById('main');
        this.container.style.width = main.clientWidth + 'px';
        this.container.style.height = main.clientHeight + 'px';
        this.tableContainer.style.height = (main.clientHeight - 65) + 'px';
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

    loadMemories(): void {
        this.electron.ipcRenderer.send('get-memories');
    }

    addMemory(): void {
        this.electron.ipcRenderer.send('show-add-memory');
    }

    removeMemory(): void {
        if (this.selected.size === 0) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select memory' });
            return;
        }
        let memories: string[] = [];
        for (let key of this.selected.keys()) {
            memories.push(key);
        }
        this.electron.ipcRenderer.send('remove-memories', memories);
    }

    importTMX(): void {
        if (this.selected.size === 0) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select memory' });
            return;
        }
        if (this.selected.size > 1) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select one memory' });
            return;
        }
        for (let key of this.selected.keys()) {
            this.electron.ipcRenderer.send('show-import-tmx', key);
        }
    }

    exportTMX(): void {
        if (this.selected.size === 0) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select memory' });
            return;
        }
        let memories: any[] = [];
        for (let key of this.selected.keys()) {
            let mem = { memory: key, name: this.selected.get(key).name }
            memories.push(mem);
        }
        this.electron.ipcRenderer.send('export-memories', memories);
    }

    displayMemories(memories: any[]) {
        this.tbody.innerHTML = '';
        let length = memories.length;
        for (let i = 0; i < length; i++) {
            let p = memories[i];
            let tr: HTMLTableRowElement = document.createElement('tr');
            tr.id = p.id;
            tr.classList.add('discover');
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
    }

    clicked(event: MouseEvent, memory: any): void {
        let tr: HTMLTableRowElement = event.currentTarget as HTMLTableRowElement;
        let isSelected: boolean = this.selected.has(memory.id);
        if (!isSelected) {
            if (!(event.ctrlKey || event.metaKey)) {
                for (let key of this.selected.keys()) {
                    document.getElementById(key).classList.remove('selected');
                }
                this.selected.clear()
            }
            this.selected.set(memory.id, memory);
            tr.classList.add('selected');
        } else {
            this.selected.delete(memory.id);
            tr.classList.remove('selected');
        }
    }
}