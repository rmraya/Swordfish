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

class Memory {
    id: string;
    name: string;
    project: string;
    subject: string;
    client: string;
    creationDate: number;
    creationString: string;
    type: string;
    server: string;
    user: string;
}

class MemoriesView {

    electron = require('electron');

    container: HTMLDivElement;
    topBar: HTMLDivElement;
    tableContainer: HTMLDivElement;
    tbody: HTMLTableSectionElement;
    selected: Map<string, Memory>;

    memories: Memory[]

    memoriesSortFielD: string = 'name';
    memoriesSortAscending: boolean = true;

    constructor(div: HTMLDivElement) {
        this.selected = new Map<string, Memory>();
        this.container = div;

        this.topBar = document.createElement('div');
        this.topBar.className = 'toolbar';
        this.container.appendChild(this.topBar);

        let addButton = document.createElement('a');
        addButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M20 6h-8l-2-2H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm0 12H4V6h5.17l2 2H20v10zm-8-4h2v2h2v-2h2v-2h-2v-2h-2v2h-2z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Add Memory</span>';
        addButton.className = 'tooltip';
        addButton.addEventListener('click', () => {
            this.addMemory()
        });
        this.topBar.appendChild(addButton);

        let removeButton = document.createElement('a');
        removeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="m376-300 104-104 104 104 56-56-104-104 104-104-56-56-104 104-104-104-56 56 104 104-104 104 56 56Zm-96 180q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520Zm-400 0v520-520Z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Remove Memory</span>';
        removeButton.className = 'tooltip';
        removeButton.addEventListener('click', () => {
            this.removeMemory()
        });
        this.topBar.appendChild(removeButton);

        let importButton = document.createElement('a');
        importButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24" viewBox="0 0 24 24" width="24"><path d="M19,9h-2v6.59L5.41,4L4,5.41L15.59,17H9v2h10V9z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Import TMX File</span>';
        importButton.className = 'tooltip';
        importButton.addEventListener('click', () => {
            this.importTMX();
        });
        importButton.style.marginLeft = '20px';
        this.topBar.appendChild(importButton);

        let exportButton = document.createElement('a');
        exportButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24" viewBox="0 0 24 24" width="24"><path d="M9,5v2h6.59L4,18.59L5.41,20L17,8.41V15h2V5H9z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Export Memory as TMX File</span>';
        exportButton.className = 'tooltip';
        exportButton.addEventListener('click', () => {
            this.exportTMX();
        });
        this.topBar.appendChild(exportButton);

        let concordanceButton = document.createElement('a');
        concordanceButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M21.172 24l-7.387-7.387c-1.388.874-3.024 1.387-4.785 1.387-4.971 0-9-4.029-9-9s4.029-9 9-9 9 4.029 9 9c0 1.761-.514 3.398-1.387 4.785l7.387 7.387-2.828 2.828zm-12.172-8c3.859 0 7-3.14 7-7s-3.141-7-7-7-7 3.14-7 7 3.141 7 7 7z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Concordance Search</span>';
        concordanceButton.className = 'tooltip';
        concordanceButton.style.marginLeft = '20px';
        concordanceButton.addEventListener('click', () => {
            this.concordanceSearch();
        });
        this.topBar.appendChild(concordanceButton);

        let remoteButton = document.createElement('a');
        remoteButton.style.marginLeft = '20px';
        remoteButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path d="M12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6m0-2C9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96C18.67 6.59 15.64 4 12 4z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Add RemoteTM Memory</span>';
        remoteButton.addEventListener('click', () => {
            this.browseRemoteTM();
        });
        remoteButton.className = 'tooltip';
        this.topBar.appendChild(remoteButton);

        this.tableContainer = document.createElement('div');
        this.tableContainer.classList.add('paddedPanel');
        this.container.appendChild(this.tableContainer);

        let memoriesTable = document.createElement('table');
        memoriesTable.classList.add('fill_width');
        memoriesTable.classList.add('stripes');
        memoriesTable.classList.add('discover');
        this.tableContainer.appendChild(memoriesTable);

        let header: HTMLTableSectionElement = document.createElement('thead');
        memoriesTable.appendChild(header);

        let headerRow: HTMLTableRowElement = document.createElement('tr');
        header.appendChild(headerRow);

        let headerCell: HTMLTableCellElement = document.createElement('th');
        headerCell.innerHTML = '&nbsp;';
        headerRow.appendChild(headerCell);

        headerCell = document.createElement('th');
        headerCell.classList.add('noWrap');
        headerCell.innerText = 'Name';
        headerCell.id = 'memory-name';
        headerCell.addEventListener('click', () => {
            (document.getElementById('memory-' + this.memoriesSortFielD) as HTMLTableCellElement).classList.remove('arrow-down');
            (document.getElementById('memory-' + this.memoriesSortFielD) as HTMLTableCellElement).classList.remove('arrow-up');
            if (this.memoriesSortFielD === 'name') {
                this.memoriesSortAscending = !this.memoriesSortAscending;
            } else {
                this.memoriesSortFielD = 'name';
                this.memoriesSortAscending = true;
            }
            this.displayMemories();
        });
        headerCell.style.paddingLeft = '4px';
        headerCell.style.paddingRight = '4px';
        headerRow.appendChild(headerCell);

        headerCell = document.createElement('th');
        headerCell.classList.add('noWrap');
        headerCell.innerText = 'Type';
        headerCell.id = 'memory-type';
        headerCell.addEventListener('click', () => {
            (document.getElementById('memory-' + this.memoriesSortFielD) as HTMLTableCellElement).classList.remove('arrow-down');
            (document.getElementById('memory-' + this.memoriesSortFielD) as HTMLTableCellElement).classList.remove('arrow-up');
            if (this.memoriesSortFielD === 'type') {
                this.memoriesSortAscending = !this.memoriesSortAscending;
            } else {
                this.memoriesSortFielD = 'type';
                this.memoriesSortAscending = true;
            }
            this.displayMemories();
        });
        headerCell.style.paddingLeft = '4px';
        headerCell.style.paddingRight = '4px';
        headerRow.appendChild(headerCell);

        headerCell = document.createElement('th');
        headerCell.classList.add('noWrap');
        headerCell.innerText = 'Project';
        headerCell.id = 'memory-project';
        headerCell.addEventListener('click', () => {
            (document.getElementById('memory-' + this.memoriesSortFielD) as HTMLTableCellElement).classList.remove('arrow-down');
            (document.getElementById('memory-' + this.memoriesSortFielD) as HTMLTableCellElement).classList.remove('arrow-up');
            if (this.memoriesSortFielD === 'project') {
                this.memoriesSortAscending = !this.memoriesSortAscending;
            } else {
                this.memoriesSortFielD = 'project';
                this.memoriesSortAscending = true;
            }
            this.displayMemories();
        });
        headerCell.style.paddingLeft = '4px';
        headerCell.style.paddingRight = '4px';
        headerRow.appendChild(headerCell);

        headerCell = document.createElement('th');
        headerCell.classList.add('noWrap');
        headerCell.innerText = 'Client';
        headerCell.id = 'memory-client';
        headerCell.addEventListener('click', () => {
            (document.getElementById('memory-' + this.memoriesSortFielD) as HTMLTableCellElement).classList.remove('arrow-down');
            (document.getElementById('memory-' + this.memoriesSortFielD) as HTMLTableCellElement).classList.remove('arrow-up');
            if (this.memoriesSortFielD === 'client') {
                this.memoriesSortAscending = !this.memoriesSortAscending;
            } else {
                this.memoriesSortFielD = 'client';
                this.memoriesSortAscending = true;
            }
            this.displayMemories();
        });
        headerCell.style.paddingLeft = '4px';
        headerCell.style.paddingRight = '4px';
        headerRow.appendChild(headerCell);

        headerCell = document.createElement('th');
        headerCell.classList.add('noWrap');
        headerCell.innerText = 'Subject';
        headerCell.id = 'memory-subject';
        headerCell.addEventListener('click', () => {
            (document.getElementById('memory-' + this.memoriesSortFielD) as HTMLTableCellElement).classList.remove('arrow-down');
            (document.getElementById('memory-' + this.memoriesSortFielD) as HTMLTableCellElement).classList.remove('arrow-up');
            if (this.memoriesSortFielD === 'subject') {
                this.memoriesSortAscending = !this.memoriesSortAscending;
            } else {
                this.memoriesSortFielD = 'subject';
                this.memoriesSortAscending = true;
            }
            this.displayMemories();
        });
        headerCell.style.paddingLeft = '4px';
        headerCell.style.paddingRight = '4px';
        headerRow.appendChild(headerCell);

        headerCell = document.createElement('th');
        headerCell.classList.add('noWrap');
        headerCell.innerText = 'Created';
        headerCell.id = 'memory-created';
        headerCell.addEventListener('click', () => {
            (document.getElementById('memory-' + this.memoriesSortFielD) as HTMLTableCellElement).classList.remove('arrow-down');
            (document.getElementById('memory-' + this.memoriesSortFielD) as HTMLTableCellElement).classList.remove('arrow-up');
            if (this.memoriesSortFielD === 'created') {
                this.memoriesSortAscending = !this.memoriesSortAscending;
            } else {
                this.memoriesSortFielD = 'created';
                this.memoriesSortAscending = true;
            }
            this.displayMemories();
        });
        headerCell.style.paddingLeft = '4px';
        headerCell.style.paddingRight = '4px';
        headerRow.appendChild(headerCell);

        this.tbody = document.createElement('tbody');
        memoriesTable.appendChild(this.tbody);

        this.electron.ipcRenderer.on('set-memories', (event: Electron.IpcRendererEvent, arg: any) => {
            this.memories = arg;
            this.displayMemories();
        });

        this.loadMemories();

        this.watchSizes();

        setTimeout(() => {
            this.setSizes();
        }, 200);
    }

    setSizes(): void {
        let main: HTMLDivElement = document.getElementById('main') as HTMLDivElement;
        this.tableContainer.style.height = (main.clientHeight - this.topBar.clientHeight - 16) + 'px';
        this.tableContainer.style.width = (this.container.clientWidth - 16) + 'px';
    }

    watchSizes(): void {
        let targetNode: HTMLElement = document.getElementById('main');
        let config: MutationObserverInit = { attributes: true, childList: false, subtree: false };
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

    displayMemories() {
        if (this.memoriesSortAscending) {
            (document.getElementById('memory-' + this.memoriesSortFielD) as HTMLTableCellElement).classList.add('arrow-up');
        } else {
            (document.getElementById('memory-' + this.memoriesSortFielD) as HTMLTableCellElement).classList.add('arrow-down');
        }
        this.memories.sort((a: Memory, b: Memory) => {
            if (this.memoriesSortFielD === 'name') {
                if (a.name.toLocaleLowerCase() < b.name.toLocaleLowerCase()) {
                    return this.memoriesSortAscending ? -1 : 1;
                }
                if (a.name.toLocaleLowerCase() > b.name.toLocaleLowerCase()) {
                    return this.memoriesSortAscending ? 1 : -1;
                }
                return 0;
            }
            if (this.memoriesSortFielD === 'type') {
                if (a.type < b.type) {
                    return this.memoriesSortAscending ? -1 : 1;
                }
                if (a.type > b.type) {
                    return this.memoriesSortAscending ? 1 : -1;
                }
                return 0;
            }
            if (this.memoriesSortFielD === 'project') {
                if (a.project.toLocaleLowerCase() < b.project.toLocaleLowerCase()) {
                    return this.memoriesSortAscending ? -1 : 1;
                }
                if (a.project.toLocaleLowerCase() > b.project.toLocaleLowerCase()) {
                    return this.memoriesSortAscending ? 1 : -1;
                }
                return 0;
            }
            if (this.memoriesSortFielD === 'client') {
                if (a.client.toLocaleLowerCase() < b.client.toLocaleLowerCase()) {
                    return this.memoriesSortAscending ? -1 : 1;
                }
                if (a.client.toLocaleLowerCase() > b.client.toLocaleLowerCase()) {
                    return this.memoriesSortAscending ? 1 : -1;
                }
                return 0;
            }
            if (this.memoriesSortFielD === 'subject') {
                if (a.subject.toLocaleLowerCase() < b.subject.toLocaleLowerCase()) {
                    return this.memoriesSortAscending ? -1 : 1;
                }
                if (a.subject.toLocaleLowerCase() > b.subject.toLocaleLowerCase()) {
                    return this.memoriesSortAscending ? 1 : -1;
                }
                return 0;
            }
            if (this.memoriesSortFielD === 'created') {
                if (a.creationDate < b.creationDate) {
                    return this.memoriesSortAscending ? -1 : 1;
                }
                if (a.creationDate > b.creationDate) {
                    return this.memoriesSortAscending ? 1 : -1;
                }
                return 0;
            }
        });
        this.tbody.innerHTML = '';
        let length = this.memories.length;
        for (let i = 0; i < length; i++) {
            let mem = this.memories[i];

            let checkBox: HTMLInputElement = document.createElement('input');
            checkBox.id = 'ck_' + mem.id;
            checkBox.type = 'checkbox';

            let tr: HTMLTableRowElement = document.createElement('tr');
            tr.id = mem.id;
            tr.addEventListener('click', (event: MouseEvent) => {
                this.clicked(tr, mem, checkBox);
            });
            this.tbody.appendChild(tr);

            let td = document.createElement('td');
            td.classList.add('center');
            td.classList.add('list');
            td.style.width = '24px';
            td.appendChild(checkBox);
            tr.append(td);

            td = document.createElement('td');
            td.classList.add('noWrap');
            td.classList.add('middle');
            td.innerText = mem.name;
            tr.append(td);

            td = document.createElement('td');
            td.classList.add('middle');
            td.classList.add('center');
            td.innerText = mem.type;
            tr.append(td);

            td = document.createElement('td');
            td.classList.add('noWrap');
            td.classList.add('middle');
            td.classList.add('center');
            td.style.minWidth = '170px';
            td.innerText = mem.project;
            tr.append(td);

            td = document.createElement('td');
            td.classList.add('noWrap');
            td.classList.add('middle');
            td.classList.add('center');
            td.style.minWidth = '170px';
            td.innerText = mem.client;
            tr.append(td);

            td = document.createElement('td');
            td.classList.add('noWrap');
            td.classList.add('middle');
            td.classList.add('center');
            td.style.minWidth = '170px';
            td.innerText = mem.subject;
            tr.append(td);

            td = document.createElement('td');
            td.classList.add('noWrap');
            td.classList.add('middle');
            td.classList.add('center');
            td.style.minWidth = '170px';
            td.innerText = mem.creationString;
            tr.append(td);
        }
        this.selected.clear();
    }

    clicked(tr: HTMLTableRowElement, memory: Memory, checkbox: HTMLInputElement): void {
        let isSelected: boolean = this.selected.has(memory.id);
        if (!isSelected) {
            this.selected.set(memory.id, memory);
            tr.classList.add('selected');
        } else {
            this.selected.delete(memory.id);
            tr.classList.remove('selected');
        }
        checkbox.checked = !isSelected;
    }

    concordanceSearch(): void {
        if (this.selected.size === 0) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select memory' });
            return;
        }
        let memories: string[] = [];
        for (let key of this.selected.keys()) {
            memories.push(key);
        }
        this.electron.ipcRenderer.send('concordance-search', { memories: memories });
    }

    browseRemoteTM(): void {
        this.electron.ipcRenderer.send('show-server-settings', { type: 'memory' });
    }
}