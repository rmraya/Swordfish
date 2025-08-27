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

    dataHolder: HTMLDivElement;

    metaId: MetaId = { project: '', file: '' };
    metadata: MetaData = { project: '', file: '', data: [] };
    editing: number = 0;

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
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-metadata');
            }
        });
        this.dataHolder = document.getElementById('main') as HTMLDivElement;

        window.addEventListener('resize', () => {
            this.resize();
        });

        setTimeout(() => {
            this.electron.ipcRenderer.send('set-height', { window: 'metadata', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    updateMetaGroup(metaGroup: MetaGroup): void {
        this.metadata.data[this.editing] = metaGroup;
        this.setMetadata();
        this.electron.ipcRenderer.send('save-metadata', { metaId: this.metaId, metadata: this.metadata });
    }


    resize(): void {
        let buttons: HTMLDivElement = document.getElementById('buttons') as HTMLDivElement;
        this.dataHolder.style.height = (document.body.clientHeight - buttons.clientHeight) + 'px';
    }

    setMetadata(): void {
        let data: MetaGroup[] = this.metadata.data;
        let length: number = data ? data.length : 0;
        let counter: number = 1;
        this.dataHolder.innerHTML = '';
        for (let i: number = 0; i < length; i++) {
            let groupId: string | undefined = data[i].id;
            let id: string = groupId ? groupId : 'Group_' + counter++;

            let groupHolder: HTMLDivElement = document.createElement('div');
            groupHolder.classList.add('paddedArea');
            this.dataHolder.appendChild(groupHolder);

            let groupButtons: HTMLDivElement = document.createElement('div');
            groupButtons.classList.add('buttonArea');
            groupHolder.appendChild(groupButtons);

            let groupIdLabel: HTMLSpanElement = document.createElement('span');
            groupIdLabel.innerHTML = id;
            groupButtons.appendChild(groupIdLabel);

            let filler: HTMLSpanElement = document.createElement('span');
            filler.classList.add('fill_width');
            filler.innerHTML = '&nbsp;';
            groupButtons.appendChild(filler);

            let editButton: HTMLButtonElement = document.createElement('button');
            editButton.classList.add('button');
            editButton.innerHTML = 'Edit';
            editButton.addEventListener('click', () => {
                this.editing = i;
                this.electron.ipcRenderer.send('show-edit-metaGroup', data[i]);
            });
            groupButtons.appendChild(editButton);

            let removeButton: HTMLButtonElement = document.createElement('button');
            removeButton.classList.add('button');
            removeButton.innerHTML = 'Remove';
            removeButton.addEventListener('click', () => {
                console.log('removing', i);
                this.metadata.data.splice(i, 1);
                this.setMetadata();
                this.electron.ipcRenderer.send('save-metadata', { metaId: this.metaId, metadata: this.metadata });
            });
            groupButtons.appendChild(removeButton);

            let tableContainer: HTMLDivElement = document.createElement('div');
            tableContainer.style.marginBottom = '8px';
            groupHolder.appendChild(tableContainer);

            let table: HTMLTableElement = document.createElement('table');
            table.style.width = '100% - 16px';
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

            if (data[i].category) {
                let categoryRow: HTMLTableRowElement = document.createElement('tr');
                tbody.appendChild(categoryRow);
                let category: HTMLTableCellElement = document.createElement('td');
                category.textContent = 'Category';
                category.classList.add('middle');
                category.classList.add('noWrap');
                categoryRow.appendChild(category);
                let categoryValue: HTMLTableCellElement = document.createElement('td');
                categoryValue.textContent = data[i].category as string;
                categoryValue.classList.add('middle');
                categoryValue.classList.add('nowrap');
                categoryRow.appendChild(categoryValue);
            }

            if (data[i].appliesTo) {
                let appliesRow: HTMLTableRowElement = document.createElement('tr');
                tbody.appendChild(appliesRow);
                let appliesTo: HTMLTableCellElement = document.createElement('td');
                appliesTo.classList.add('middle');
                appliesTo.classList.add('noWrap');
                appliesTo.textContent = 'Applies To';
                appliesRow.appendChild(appliesTo);
                let appliesToValue: HTMLTableCellElement = document.createElement('td');
                appliesToValue.textContent = data[i].appliesTo as string;
                appliesToValue.classList.add('middle');
                appliesToValue.classList.add('noWrap');
                appliesRow.appendChild(appliesToValue);
            }

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
        }

        setTimeout(() => {
            this.resize();
        }, 200);
    }
}