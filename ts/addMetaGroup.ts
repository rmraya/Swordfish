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

class AddMetaGroup {

    electron = require('electron');

    segmentData: MetaId = { project: '', file: '' };

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        this.electron.ipcRenderer.on('set-data', (event: Electron.IpcRendererEvent, data: MetaId) => {
            this.segmentData = data;
        });
        this.electron.ipcRenderer.on('set-metaGroup', (event: Electron.IpcRendererEvent, data: MetaGroup) => {
            this.setMetaGroup(data);
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape' || event.code === 'F2') {
                this.electron.ipcRenderer.send('close-add-metaGroup');
            }
        });
        (document.getElementById('addEntry') as HTMLButtonElement).addEventListener('click', () => {
            this.addEntry();
        });
        (document.getElementById('editEntry') as HTMLButtonElement).addEventListener('click', () => {
            this.editEntry();
        });
        (document.getElementById('removeEntry') as HTMLButtonElement).addEventListener('click', () => {
            this.removeEntry();
        });
        (document.getElementById('saveGroup') as HTMLButtonElement).addEventListener('click', () => {
            this.saveGroup();
        });
        window.addEventListener('resize', () => {
            this.resize();
        });
        setTimeout(() => {
            this.resize();
            this.electron.ipcRenderer.send('set-height', { window: 'addMetaGroup', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    setMetaGroup(data: MetaGroup): void {
        if (data.id) {
            (document.getElementById('groupId') as HTMLInputElement).value = data.id;
        }
        if (data.category) {
            (document.getElementById('category') as HTMLInputElement).value = data.category;
        }
        if (data.appliesTo) {
            (document.getElementById('appliesTo') as HTMLSelectElement).value = data.appliesTo;
        }
        // Meta Entries
        let tbody: HTMLTableSectionElement = document.getElementById('tbody') as HTMLTableSectionElement;
        tbody.innerHTML = '';
        for (let i: number = 0; i < data.meta.length; i++) {
            let entry: MetaEntry = data.meta[i];
            let tr: HTMLTableRowElement = document.createElement('tr');
            tbody.appendChild(tr);

            let cell: HTMLTableCellElement = document.createElement('td');
            cell.classList.add('middle');
            let checkbox: HTMLInputElement = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = '' + i;
            cell.appendChild(checkbox);
            tr.appendChild(cell);

            cell = document.createElement('td');
            cell.classList.add('middle');
            cell.innerHTML = entry.type;
            tr.appendChild(cell);

            cell = document.createElement('td');
            cell.classList.add('middle');
            cell.innerHTML = entry.value;
            tr.appendChild(cell);
        };
    }

    addEntry(): void {
        this.electron.ipcRenderer.send('show-add-metaDialog');
    }

    editEntry(): void {
    }

    removeEntry(): void {
    }

    saveGroup(): void {
        let id: string = (document.getElementById('groupId') as HTMLInputElement).value;
        let category: string = (document.getElementById('category') as HTMLInputElement).value;
        let appliesTo: string = (document.getElementById('appliesTo') as HTMLSelectElement).value;
    }

    resize(): void {
        let entryButtons: HTMLDivElement = document.getElementById('entryButtons') as HTMLDivElement;
        let saveButtons: HTMLDivElement = document.getElementById('saveButtons') as HTMLDivElement;
        let buttonsHeight: number = entryButtons.clientHeight + saveButtons.clientHeight;

        let attributesTable: HTMLTableElement = document.getElementById('attributesTable') as HTMLTableElement;
        let tableContainer: HTMLDivElement = document.getElementById('tableContainer') as HTMLDivElement;
        tableContainer.style.height = (document.body.clientHeight - buttonsHeight - attributesTable.clientHeight - 12) + 'px'; // 12 = 8px padding top + 4px padding bottom
    }
}