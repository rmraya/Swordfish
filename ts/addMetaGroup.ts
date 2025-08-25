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

    metaEntries: MetaEntry[] = [];
    selectedMeta: number[] = [];
    editing: boolean = false;

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        this.electron.ipcRenderer.on('set-metaGroup', (event: Electron.IpcRendererEvent, data: MetaGroup) => {
            this.setMetaGroup(data);
        });
        this.electron.ipcRenderer.on('add-meta', (event: Electron.IpcRendererEvent, meta: MetaEntry) => {
            this.addMeta(meta);
        });

        this.electron.ipcRenderer.on('edit-meta', (event: Electron.IpcRendererEvent, meta: MetaEntry) => {
            this.editMeta(meta);
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
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
        (document.getElementById('groupId') as HTMLInputElement).focus();
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
        this.metaEntries = data.meta;
        this.displayEntries();
        this.editing = true;
    }

    displayEntries() {
        let tbody: HTMLTableSectionElement = document.getElementById('tbody') as HTMLTableSectionElement;
        tbody.innerHTML = '';
        this.selectedMeta = [];
        for (let i: number = 0; i < this.metaEntries.length; i++) {
            let entry: MetaEntry = this.metaEntries[i];
            let tr: HTMLTableRowElement = document.createElement('tr');
            tbody.appendChild(tr);

            let cell: HTMLTableCellElement = document.createElement('td');
            cell.classList.add('middle');
            let checkbox: HTMLInputElement = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.addEventListener('change', (event: Event) => {
                if (checkbox.checked) {
                    this.selectedMeta.push(i);
                } else {
                    const index = this.selectedMeta.indexOf(i);
                    if (index > -1) {
                        this.selectedMeta.splice(index, 1);
                    }
                }
            });
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
        if (this.metaEntries.length === 0) {
            return;
        }
        if (this.selectedMeta.length === 0) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select entry', parent: 'addMetaGroupDialog' });
            return;
        }
        if (this.selectedMeta.length !== 1) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select one entry', parent: 'addMetaGroupDialog' });
            return;
        }
        this.electron.ipcRenderer.send('show-edit-metaDialog', this.metaEntries[this.selectedMeta[0]]);
    }

    removeEntry(): void {
        if (this.selectedMeta.length === 0) {
            return;
        }
        this.selectedMeta.sort((a, b) => b - a);
        for (let index of this.selectedMeta) {
            this.metaEntries.splice(index, 1);
        }
        this.selectedMeta = [];
        this.displayEntries();
    }

    addMeta(entry: MetaEntry): void {
        this.metaEntries.push(entry);
        this.displayEntries();
    }

    editMeta(entry: MetaEntry): void {
        if (this.selectedMeta.length === 0) {
            return;
        }
        this.metaEntries[this.selectedMeta[0]] = entry;
        this.displayEntries();
    }

    saveGroup(): void {
        if (this.metaEntries.length === 0) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Add entries', parent: 'addMetaGroupDialog' });
            return;
        }
        let id: string | undefined = (document.getElementById('groupId') as HTMLInputElement).value;
        if (id === '') {
            id = undefined;
        } else {
            if (!AddMeta.isNMToken(id)) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Invalid ID', parent: 'addMetaGroupDialog' });
            return;
        }
        }
        let category: string | undefined = (document.getElementById('category') as HTMLInputElement).value;
        if (category === '') {
            category = undefined;
        }
        let appliesTo: string | undefined = (document.getElementById('appliesTo') as HTMLSelectElement).value;
        if (appliesTo === 'none') {
            appliesTo = undefined;
        }
        let metaGroup: MetaGroup = { id: id, category: category, appliesTo: appliesTo, meta: this.metaEntries };
        if (!this.editing) {
            this.electron.ipcRenderer.send('add-metaGroup', metaGroup);
        } else {
            this.electron.ipcRenderer.send('edit-metaGroup', metaGroup);
        }
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