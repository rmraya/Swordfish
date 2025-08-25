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

class MetaDataDialog {

    electron = require('electron');

    tabHolder: TabHolder;
    metaId: MetaId = { project: '', file: '' };
    metadata: MetaData = { project: '', file: '', data: [] };

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        this.electron.ipcRenderer.on('set-data', (event: Electron.IpcRendererEvent, metaId: MetaId) => {
            this.metaId = metaId;
            this.electron.ipcRenderer.send('get-metadata', metaId);
        });
        this.electron.ipcRenderer.on('set-metadata', (event: Electron.IpcRendererEvent, metadata: MetaData) => {
            this.metadata = metadata;
            this.setMetadata();
        });
        this.electron.ipcRenderer.on('add-metaGroup', (event: Electron.IpcRendererEvent, metaGroup: MetaGroup) => {
            if (!this.metadata) {
                this.metadata = { project: '', file: '', data: [] };
            }
            if (!this.metadata.data) {
                this.metadata.project = this.metaId.project;
                this.metadata.file = this.metaId.file;
                if (this.metaId.unit) {
                    this.metadata.unit = this.metaId.unit;
                }
                if (this.metaId.segment) {
                    this.metadata.segment = this.metaId.segment;
                }
                this.metadata.data = [];
            }
            this.metadata.data.push(metaGroup);
            this.setMetadata();
            this.electron.ipcRenderer.send('save-metadata', { metaId: this.metaId, metadata: this.metadata });
        });
        this.electron.ipcRenderer.on('edit-metaGroup', (event: Electron.IpcRendererEvent, metaGroup: MetaGroup) => {
            this.updateMetaGroup(metaGroup);
        });
        (document.getElementById('addMetaGroup') as HTMLButtonElement).addEventListener('click', () => {
            this.electron.ipcRenderer.send('show-add-metaGroup');
        });
        (document.getElementById('editMetaGroup') as HTMLButtonElement).addEventListener('click', () => {
            this.editMetaGroup();
        });
        (document.getElementById('removeMetaGroup') as HTMLButtonElement).addEventListener('click', () => {
            this.removeMetaGroup();
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-metadata');
            }
        });
        let main: HTMLDivElement = document.getElementById('main') as HTMLDivElement;
        main.classList.add('fill_width');

        this.tabHolder = new TabHolder(main, 'metadata');

        window.addEventListener('resize', () => {
            this.resize();
        });

        setTimeout(() => {
            this.electron.ipcRenderer.send('set-height', { window: 'metadata', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    editMetaGroup(): void {
        let tab: string = this.tabHolder.getSelected();
        if (!tab) {
            return;
        }
        let length: number = this.metadata.data ? this.metadata.data.length : 0;
        let counter: number = 1;
        let tabSet: Set<string> = new Set<string>();
        for (let i: number = 0; i < length; i++) {
            let groupId: string | undefined = this.metadata.data[i].id;
            let id: string = groupId ? groupId : 'Group_' + counter++;
            while (tabSet.has(id)) {
                id = id + '*';
            }
            tabSet.add(id);
            if (id === tab) {
                let metaGroup: MetaGroup = this.metadata.data[i];
                this.electron.ipcRenderer.send('show-edit-metaGroup', metaGroup);
                break;
            }
        }
    }

    removeMetaGroup(): void {
        console.log('removing meta group');
        let tab: string = this.tabHolder.getSelected();
        if (!tab) {
            console.error('No tab selected for removal');
            return;
        }
        console.log('selected tab for removal:', tab);
        let length: number = this.metadata.data ? this.metadata.data.length : 0;
        let counter: number = 1;
        let tabSet: Set<string> = new Set<string>();
        for (let i: number = 0; i < length; i++) {
            let groupId: string | undefined = this.metadata.data[i].id;
            let id: string = groupId ? groupId : 'Group_' + counter++;
            while (tabSet.has(id)) {
                id = id + '*';
            }
            tabSet.add(id); if (id === tab) {
                console.log('removing meta group:', id);
                this.metadata.data.splice(i, 1);
                this.setMetadata();
                this.electron.ipcRenderer.send('save-metadata', { metaId: this.metaId, metadata: this.metadata });
                break;
            }
        }
    }

    updateMetaGroup(metaGroup: MetaGroup): void {
        let tab: string = this.tabHolder.getSelected();
        if (!tab) {
            return;
        }
        let length: number = this.metadata.data ? this.metadata.data.length : 0;
        let counter: number = 1;
        let tabSet: Set<string> = new Set<string>();
        for (let i: number = 0; i < length; i++) {
            let groupId: string | undefined = this.metadata.data[i].id;
            let id: string = groupId ? groupId : 'Group_' + counter++;
            while (tabSet.has(id)) {
                id = id + '*';
            }
            tabSet.add(id);
            if (id === tab) {
                this.metadata.data[i] = metaGroup;
                this.setMetadata();
                break;
            }
        }
        this.electron.ipcRenderer.send('save-metadata', { metaId: this.metaId, metadata: this.metadata });
    }

    resize(): void {
        let main: HTMLDivElement = document.getElementById('main') as HTMLDivElement;
        let buttons: HTMLDivElement = document.getElementById('buttons') as HTMLDivElement;
        main.style.height = (document.body.clientHeight - buttons.clientHeight) + 'px';

        let tabs: HTMLCollectionOf<Element> = document.getElementsByClassName('tab');
        let attributesContainers: HTMLCollectionOf<Element> = document.getElementsByClassName('attributesContainer');
        let tableContainers: HTMLCollectionOf<Element> = document.getElementsByClassName('divContainer');
        for (let i: number = 0; i < tableContainers.length; i++) {
            let tab: HTMLDivElement = tabs[i] as HTMLDivElement;
            let attributesContainer: HTMLDivElement = attributesContainers[i] as HTMLDivElement;
            let tableContainer: HTMLDivElement = tableContainers[i] as HTMLDivElement;
            tableContainer.style.height = (main.clientHeight - (tab.clientHeight + attributesContainer.clientHeight)) + 'px';
        }
    }

    setMetadata(): void {
        this.tabHolder.clear();
        let data: MetaGroup[] = this.metadata.data;
        let length: number = data ? data.length : 0;
        let counter: number = 1;
        let tabSet: Set<string> = new Set<string>();
        for (let i: number = 0; i < length; i++) {
            let groupId: string | undefined = data[i].id;
            let id: string = groupId ? groupId : 'Group_' + counter++;
            while (tabSet.has(id)) {
                id = id + '*';
            }
            tabSet.add(id);
            let tab: Tab = new Tab(id, id, false, this.tabHolder);

            let holder: HTMLDivElement = tab.getContainer();
            holder.classList.add('paddedArea');

            let attributesContainer: HTMLDivElement = document.createElement('div');
            attributesContainer.classList.add('attributesContainer');
            holder.appendChild(attributesContainer);

            let attributesTable: HTMLTableElement = document.createElement('table');
            attributesTable.style.width = '100%';
            attributesContainer.appendChild(attributesTable);

            let attributesRow: HTMLTableRowElement = document.createElement('tr');
            attributesTable.appendChild(attributesRow);

            let category: HTMLTableCellElement = document.createElement('td');
            category.textContent = 'Category:';
            category.classList.add('noWrap');
            attributesRow.appendChild(category);

            let categoryValue: HTMLTableCellElement = document.createElement('td');
            categoryValue.style.width = '45%';
            let groupCategory: string | undefined = data[i].category;
            categoryValue.textContent = groupCategory ? groupCategory : '';
            attributesRow.appendChild(categoryValue);

            let appliesTo: HTMLTableCellElement = document.createElement('td');
            appliesTo.classList.add('noWrap');
            appliesTo.textContent = 'Applies To:';
            attributesRow.appendChild(appliesTo);

            let appliesToValue: HTMLTableCellElement = document.createElement('td');
            appliesToValue.style.width = '45%';
            let groupAppliesTo: string | undefined = data[i].appliesTo;
            appliesToValue.textContent = groupAppliesTo ? groupAppliesTo : '';
            attributesRow.appendChild(appliesToValue);

            let tableContainer: HTMLDivElement = document.createElement('div');
            tableContainer.classList.add('divContainer');
            tableContainer.style.height = '300px';
            holder.appendChild(tableContainer);

            let table: HTMLTableElement = document.createElement('table');
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';
            table.classList.add('stripes');
            tableContainer.appendChild(table);

            let colgroup: HTMLTableColElement = document.createElement('colgroup');
            let col2: HTMLTableColElement = document.createElement('col');
            let col3: HTMLTableColElement = document.createElement('col');
            col3.classList.add('fill_width');
            colgroup.appendChild(col2);
            colgroup.appendChild(col3);
            table.appendChild(colgroup);

            let header: HTMLTableSectionElement = document.createElement('thead')
            let headerCell2: HTMLTableCellElement = document.createElement('th');
            headerCell2.classList.add('left');
            headerCell2.textContent = 'Type';
            let headerCell3: HTMLTableCellElement = document.createElement('th');
            headerCell3.classList.add('left');
            headerCell3.classList.add('fill_width');
            headerCell3.textContent = 'Value';
            header.appendChild(headerCell2);
            header.appendChild(headerCell3);
            table.appendChild(header);

            let tbody: HTMLTableSectionElement = document.createElement('tbody');
            table.appendChild(tbody);
            let metaArray: Array<MetaEntry> = data[i].meta;
            for (let j: number = 0; j < metaArray.length; j++) {
                let row: HTMLTableRowElement = document.createElement('tr');
                tbody.appendChild(row);
                let cell2: HTMLTableCellElement = document.createElement('td');
                cell2.classList.add('middle');
                cell2.classList.add('noWrap');
                cell2.textContent = metaArray[j].type;
                row.appendChild(cell2);
                let cell3: HTMLTableCellElement = document.createElement('td');
                cell3.classList.add('middle');
                cell3.textContent = metaArray[j].value;
                row.appendChild(cell3);
            }
            this.tabHolder.addTab(tab);
        }

        let tabs: HTMLCollectionOf<Element> = document.getElementsByClassName('tab');
        for (let t: number = 0; t < tabs.length; t++) {
            let tab: HTMLDivElement = tabs[t] as HTMLDivElement;
            tab.addEventListener('click', () => {
                this.resize();
            });
        }

        setTimeout(() => {
            this.resize();
        }, 200);
    }
}