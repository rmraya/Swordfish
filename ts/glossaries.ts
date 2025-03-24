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

class GlossariesView {

    electron = require('electron');

    container: HTMLDivElement;
    topBar: HTMLDivElement;
    tbody: HTMLTableSectionElement;
    tableContainer: HTMLDivElement;
    selected: Map<string, Memory>;

    glossaries: Memory[]

    glossariesSortFielD: string = 'name';
    glossariesSortAscending: boolean = true;

    constructor(div: HTMLDivElement) {
        this.selected = new Map<string, Memory>();
        this.container = div;
        this.topBar = document.createElement('div');
        this.topBar.className = 'toolbar';
        this.container.appendChild(this.topBar);

        let addButton = document.createElement('a');
        addButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M20 6h-8l-2-2H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm0 12H4V6h5.17l2 2H20v10zm-8-4h2v2h2v-2h2v-2h-2v-2h-2v2h-2z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Add Glossary</span>';
        addButton.className = 'tooltip';
        addButton.addEventListener('click', () => {
            this.addGlossary()
        });
        this.topBar.appendChild(addButton);

        let removeButton = document.createElement('a');
        removeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="m376-300 104-104 104 104 56-56-104-104 104-104-56-56-104 104-104-104-56 56 104 104-104 104 56 56Zm-96 180q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520Zm-400 0v520-520Z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Remove Glossary</span>';
        removeButton.className = 'tooltip';
        removeButton.addEventListener('click', () => {
            this.removeGlossary()
        });
        this.topBar.appendChild(removeButton);

        let importButton = document.createElement('a');
        importButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24" viewBox="0 0 24 24" width="24"><path d="M19,9h-2v6.59L5.41,4L4,5.41L15.59,17H9v2h10V9z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Import Glossary File</span>';
        importButton.className = 'tooltip';
        importButton.addEventListener('click', () => {
            this.importGlossary();
        });
        importButton.style.marginLeft = '20px';
        this.topBar.appendChild(importButton);

        let exportButton = document.createElement('a');
        exportButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24" viewBox="0 0 24 24" width="24"><path d="M9,5v2h6.59L4,18.59L5.41,20L17,8.41V15h2V5H9z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Export Glossary</span>';
        exportButton.className = 'tooltip';
        exportButton.addEventListener('click', () => {
            this.exportGlossary();
        });
        this.topBar.appendChild(exportButton);

        let addTermButton = document.createElement('a');
        addTermButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Add Term to Glossary</span>';
        addTermButton.className = 'tooltip';
        addTermButton.style.marginLeft = '20px';
        addTermButton.addEventListener('click', () => {
            this.addTerm();
        });
        this.topBar.appendChild(addTermButton);

        let termSearchButton = document.createElement('a');
        termSearchButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M13 8h-8v-1h8v1zm0 2h-8v-1h8v1zm-3 2h-5v-1h5v1zm11.172 12l-7.387-7.387c-1.388.874-3.024 1.387-4.785 1.387-4.971 0-9-4.029-9-9s4.029-9 9-9 9 4.029 9 9c0 1.761-.514 3.398-1.387 4.785l7.387 7.387-2.828 2.828zm-12.172-8c3.859 0 7-3.14 7-7s-3.141-7-7-7-7 3.14-7 7 3.141 7 7 7z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Search Term in Glossary</span>';
        termSearchButton.className = 'tooltip';
        termSearchButton.addEventListener('click', () => {
            this.searchTerm();
        });
        this.topBar.appendChild(termSearchButton);

        let remoteButton = document.createElement('a');
        remoteButton.style.marginLeft = '20px';
        remoteButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path d="M12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6m0-2C9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96C18.67 6.59 15.64 4 12 4z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Add RemoteTM Glossary</span>';
        remoteButton.addEventListener('click', () => {
            this.browseRemoteTM();
        });
        remoteButton.className = 'tooltip';
        this.topBar.appendChild(remoteButton);

        this.tableContainer = document.createElement('div');
        this.tableContainer.classList.add('paddedPanel');
        this.container.appendChild(this.tableContainer);

        let glossariesTable = document.createElement('table');
        glossariesTable.classList.add('fill_width');
        glossariesTable.classList.add('stripes');
        glossariesTable.classList.add('discover');
        this.tableContainer.appendChild(glossariesTable);

        let header: HTMLTableSectionElement = document.createElement('thead');
        glossariesTable.appendChild(header);

        let headerRow: HTMLTableRowElement = document.createElement('tr');
        header.appendChild(headerRow);

        let headerCell: HTMLTableCellElement = document.createElement('th');
        headerCell.innerHTML = '&nbsp;';
        headerRow.appendChild(headerCell);

        headerCell = document.createElement('th');
        headerCell.classList.add('noWrap');
        headerCell.innerText = 'Name';
        headerCell.id = 'glossary-name';
        headerCell.addEventListener('click', () => {
            (document.getElementById('glossary-' + this.glossariesSortFielD) as HTMLTableCellElement).classList.remove('arrow-down');
            (document.getElementById('glossary-' + this.glossariesSortFielD) as HTMLTableCellElement).classList.remove('arrow-up');
            if (this.glossariesSortFielD === 'name') {
                this.glossariesSortAscending = !this.glossariesSortAscending;
            } else {
                this.glossariesSortFielD = 'name';
                this.glossariesSortAscending = true;
            }
            this.displayGlossaries();
        });
        headerCell.style.paddingLeft = '4px';
        headerCell.style.paddingRight = '4px';
        headerRow.appendChild(headerCell);

        headerCell = document.createElement('th');
        headerCell.classList.add('noWrap');
        headerCell.innerText = 'Type';
        headerCell.id = 'glossary-type';
        headerCell.addEventListener('click', () => {
            (document.getElementById('glossary-' + this.glossariesSortFielD) as HTMLTableCellElement).classList.remove('arrow-down');
            (document.getElementById('glossary-' + this.glossariesSortFielD) as HTMLTableCellElement).classList.remove('arrow-up');
            if (this.glossariesSortFielD === 'type') {
                this.glossariesSortAscending = !this.glossariesSortAscending;
            } else {
                this.glossariesSortFielD = 'type';
                this.glossariesSortAscending = true;
            }
            this.displayGlossaries();
        });
        headerCell.style.paddingLeft = '4px';
        headerCell.style.paddingRight = '4px';
        headerRow.appendChild(headerCell);

        headerCell = document.createElement('th');
        headerCell.classList.add('noWrap');
        headerCell.innerText = 'Project';
        headerCell.id = 'glossary-project';
        headerCell.addEventListener('click', () => {
            (document.getElementById('glossary-' + this.glossariesSortFielD) as HTMLTableCellElement).classList.remove('arrow-down');
            (document.getElementById('glossary-' + this.glossariesSortFielD) as HTMLTableCellElement).classList.remove('arrow-up');
            if (this.glossariesSortFielD === 'project') {
                this.glossariesSortAscending = !this.glossariesSortAscending;
            } else {
                this.glossariesSortFielD = 'project';
                this.glossariesSortAscending = true;
            }
            this.displayGlossaries();
        });
        headerCell.style.paddingLeft = '4px';
        headerCell.style.paddingRight = '4px';
        headerRow.appendChild(headerCell);

        headerCell = document.createElement('th');
        headerCell.classList.add('noWrap');
        headerCell.innerText = 'Client';
        headerCell.id = 'glossary-client';
        headerCell.addEventListener('click', () => {
            (document.getElementById('glossary-' + this.glossariesSortFielD) as HTMLTableCellElement).classList.remove('arrow-down');
            (document.getElementById('glossary-' + this.glossariesSortFielD) as HTMLTableCellElement).classList.remove('arrow-up');
            if (this.glossariesSortFielD === 'client') {
                this.glossariesSortAscending = !this.glossariesSortAscending;
            } else {
                this.glossariesSortFielD = 'client';
                this.glossariesSortAscending = true;
            }
            this.displayGlossaries();
        });
        headerCell.style.paddingLeft = '4px';
        headerCell.style.paddingRight = '4px';
        headerRow.appendChild(headerCell);

        headerCell = document.createElement('th');
        headerCell.classList.add('noWrap');
        headerCell.innerText = 'Subject';
        headerCell.id = 'glossary-subject';
        headerCell.addEventListener('click', () => {
            (document.getElementById('glossary-' + this.glossariesSortFielD) as HTMLTableCellElement).classList.remove('arrow-down');
            (document.getElementById('glossary-' + this.glossariesSortFielD) as HTMLTableCellElement).classList.remove('arrow-up');
            if (this.glossariesSortFielD === 'subject') {
                this.glossariesSortAscending = !this.glossariesSortAscending;
            } else {
                this.glossariesSortFielD = 'subject';
                this.glossariesSortAscending = true;
            }
            this.displayGlossaries();
        });
        headerCell.style.paddingLeft = '4px';
        headerCell.style.paddingRight = '4px';
        headerRow.appendChild(headerCell);

        headerCell = document.createElement('th');
        headerCell.classList.add('noWrap');
        headerCell.innerText = 'Created';
        headerCell.id = 'glossary-created';
        headerCell.addEventListener('click', () => {
            (document.getElementById('glossary-' + this.glossariesSortFielD) as HTMLTableCellElement).classList.remove('arrow-down');
            (document.getElementById('glossary-' + this.glossariesSortFielD) as HTMLTableCellElement).classList.remove('arrow-up');
            if (this.glossariesSortFielD === 'created') {
                this.glossariesSortAscending = !this.glossariesSortAscending;
            } else {
                this.glossariesSortFielD = 'created';
                this.glossariesSortAscending = true;
            }
            this.displayGlossaries();
        });
        headerCell.style.paddingLeft = '4px';
        headerCell.style.paddingRight = '4px';
        headerRow.appendChild(headerCell);

        this.tbody = document.createElement('tbody');
        glossariesTable.appendChild(this.tbody);

        this.electron.ipcRenderer.on('set-glossaries', (event: Electron.IpcRendererEvent, arg: any) => {
            this.glossaries = arg;
            this.displayGlossaries();
        });

        this.loadGlossaries();

        this.watchSizes();

        setTimeout(() => {
            this.setSizes();
        }, 250);
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

    displayGlossaries() {
        if (this.glossariesSortAscending) {
            (document.getElementById('glossary-' + this.glossariesSortFielD) as HTMLTableCellElement).classList.add('arrow-up');
        } else {
            (document.getElementById('glossary-' + this.glossariesSortFielD) as HTMLTableCellElement).classList.add('arrow-down');
        }
        this.glossaries.sort((a: Memory, b: Memory) => {
            if (this.glossariesSortFielD === 'name') {
                if (a.name.toLocaleLowerCase() < b.name.toLocaleLowerCase()) {
                    return this.glossariesSortAscending ? -1 : 1;
                }
                if (a.name.toLocaleLowerCase() > b.name.toLocaleLowerCase()) {
                    return this.glossariesSortAscending ? 1 : -1;
                }
                return 0;
            }
            if (this.glossariesSortFielD === 'type') {
                if (a.type < b.type) {
                    return this.glossariesSortAscending ? -1 : 1;
                }
                if (a.type > b.type) {
                    return this.glossariesSortAscending ? 1 : -1;
                }
                return 0;
            }
            if (this.glossariesSortFielD === 'project') {
                if (a.project.toLocaleLowerCase() < b.project.toLocaleLowerCase()) {
                    return this.glossariesSortAscending ? -1 : 1;
                }
                if (a.project.toLocaleLowerCase() > b.project.toLocaleLowerCase()) {
                    return this.glossariesSortAscending ? 1 : -1;
                }
                return 0;
            }
            if (this.glossariesSortFielD === 'client') {
                if (a.client.toLocaleLowerCase() < b.client.toLocaleLowerCase()) {
                    return this.glossariesSortAscending ? -1 : 1;
                }
                if (a.client.toLocaleLowerCase() > b.client.toLocaleLowerCase()) {
                    return this.glossariesSortAscending ? 1 : -1;
                }
                return 0;
            }
            if (this.glossariesSortFielD === 'subject') {
                if (a.subject.toLocaleLowerCase() < b.subject.toLocaleLowerCase()) {
                    return this.glossariesSortAscending ? -1 : 1;
                }
                if (a.subject.toLocaleLowerCase() > b.subject.toLocaleLowerCase()) {
                    return this.glossariesSortAscending ? 1 : -1;
                }
                return 0;
            }
            if (this.glossariesSortFielD === 'created') {
                if (a.creationDate < b.creationDate) {
                    return this.glossariesSortAscending ? -1 : 1;
                }
                if (a.creationDate > b.creationDate) {
                    return this.glossariesSortAscending ? 1 : -1;
                }
                return 0;
            }
        });
        this.tbody.innerHTML = '';
        let length = this.glossaries.length;
        for (let i = 0; i < length; i++) {
            let gloss: Memory = this.glossaries[i];

            let checkBox: HTMLInputElement = document.createElement('input');
            checkBox.id = 'ck_' + gloss.id;
            checkBox.type = 'checkbox';

            let tr: HTMLTableRowElement = document.createElement('tr');
            tr.id = gloss.id;
            tr.addEventListener('click', (event: MouseEvent) => {
                this.clicked(tr, gloss, checkBox);
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
            td.innerText = gloss.name;
            tr.append(td);

            td = document.createElement('td');
            td.classList.add('middle');
            td.classList.add('center');
            td.innerText = gloss.type;
            tr.append(td);

            td = document.createElement('td');
            td.classList.add('noWrap');
            td.classList.add('middle');
            td.classList.add('center');
            td.style.minWidth = '170px';
            td.innerText = gloss.project;
            tr.append(td);

            td = document.createElement('td');
            td.classList.add('noWrap');
            td.classList.add('middle');
            td.classList.add('center');
            td.style.minWidth = '170px';
            td.innerText = gloss.client;
            tr.append(td);

            td = document.createElement('td');
            td.classList.add('noWrap');
            td.classList.add('middle');
            td.classList.add('center');
            td.style.minWidth = '170px';
            td.innerText = gloss.subject;
            tr.append(td);

            td = document.createElement('td');
            td.classList.add('noWrap');
            td.classList.add('middle');
            td.classList.add('center');
            td.style.minWidth = '170px';
            td.innerText = gloss.creationString;
            tr.append(td);
        }
        this.selected.clear();
    }

    clicked(tr: HTMLTableRowElement, glossary: Memory, checkbox: HTMLInputElement): void {
        let isSelected: boolean = this.selected.has(glossary.id);
        if (!isSelected) {
            this.selected.set(glossary.id, glossary);
            tr.classList.add('selected');
        } else {
            this.selected.delete(glossary.id);
            tr.classList.remove('selected');
        }
        checkbox.checked = !isSelected;
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

    browseRemoteTM(): void {
        this.electron.ipcRenderer.send('show-server-settings', { type: 'glossary' });
    }
}