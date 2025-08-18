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

class MetaData {

    electron = require('electron');

    tabHolder: TabHolder;
    counter: number = 1;

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        this.electron.ipcRenderer.on('set-data', (event: Electron.IpcRendererEvent, arg: any) => {
            this.electron.ipcRenderer.send('get-metadata', arg);
        });
        this.electron.ipcRenderer.on('set-metadata', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setMetadata(arg);
        });
        (document.getElementById('addMetaGroup') as HTMLButtonElement).addEventListener('click', () => {
            this.electron.ipcRenderer.send('show-add-metaGroup');
        });
        (document.getElementById('editMetaGroup') as HTMLButtonElement).addEventListener('click', () => {
            this.electron.ipcRenderer.send('show-edit-metaGroup');
        });

        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape' || event.code === 'F2') {
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

    resize(): void {
        let main: HTMLDivElement = document.getElementById('main') as HTMLDivElement;
        let buttons: HTMLDivElement = document.getElementById('buttons') as HTMLDivElement;
        main.style.height = (document.body.clientHeight - buttons.clientHeight) + 'px';

        let tabs: HTMLCollectionOf<Element> = document.getElementsByClassName('tab');
        let attributesContainers: HTMLCollectionOf<Element> = document.getElementsByClassName('attributesContainer');
        let tableContainers: HTMLCollectionOf<Element> = document.getElementsByClassName('metaContainer');
        let entryButtonsContainer: HTMLCollectionOf<Element> = document.getElementsByClassName('entryButtonsContainer');
        for (let i: number = 0; i < tableContainers.length; i++) {
            let tab: HTMLDivElement = tabs[i] as HTMLDivElement;
            let attributesContainer: HTMLDivElement = attributesContainers[i] as HTMLDivElement;
            let tableContainer: HTMLDivElement = tableContainers[i] as HTMLDivElement;
            let entryButtons: HTMLDivElement = entryButtonsContainer[i] as HTMLDivElement;
            tableContainer.style.height = (main.clientHeight - (tab.clientHeight + attributesContainer.clientHeight + entryButtons.clientHeight)) + 'px';
        }
    }

    setMetadata(metadata: MetaData): void {
        console.log(JSON.stringify(metadata));
        this.tabHolder.clear();
        if (!metadata.data) {
            return;
        }
        let data = metadata.data;
        let length = data.length;
        for (let i: number = 0; i < length; i++) {
            let id: string = data[i].id ? data[i].id : 'Group_' + this.counter++;
            let tab: Tab = new Tab(id, id, false, this.tabHolder);

            let holder: HTMLDivElement = tab.getContainer();

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
            categoryValue.textContent = data[i].category ? data[i].category : '';
            attributesRow.appendChild(categoryValue);

            let appliesTo: HTMLTableCellElement = document.createElement('td');
            appliesTo.classList.add('noWrap');
            appliesTo.textContent = 'Applies To:';
            attributesRow.appendChild(appliesTo);

            let appliesToValue: HTMLTableCellElement = document.createElement('td');
            appliesToValue.style.width = '45%';
            appliesToValue.textContent = data[i].appliesTo ? data[i].appliesTo : '';
            attributesRow.appendChild(appliesToValue);

            let tableContainer: HTMLDivElement = document.createElement('div');
            tableContainer.classList.add('divContainer');
            tableContainer.style.height = '300px';
            tableContainer.classList.add('metaContainer');
            holder.appendChild(tableContainer);

            let table: HTMLTableElement = document.createElement('table');
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';
            table.classList.add('stripes');
            tableContainer.appendChild(table);

            let colgroup: HTMLTableColElement = document.createElement('colgroup');
            let col1: HTMLTableColElement = document.createElement('col');
            col1.style.width = '20px';
            let col2: HTMLTableColElement = document.createElement('col');
            let col3: HTMLTableColElement = document.createElement('col');
            col3.classList.add('fill_width');
            colgroup.appendChild(col1);
            colgroup.appendChild(col2);
            colgroup.appendChild(col3);
            table.appendChild(colgroup);

            let header: HTMLTableSectionElement = document.createElement('thead')
            let headerCell1: HTMLTableCellElement = document.createElement('th')
            let checkbox: HTMLInputElement = document.createElement('input');
            checkbox.type = 'checkbox';
            headerCell1.innerHTML = checkbox.outerHTML;
            let headerCell2: HTMLTableCellElement = document.createElement('th');
            headerCell2.classList.add('left');
            headerCell2.textContent = 'Type';
            let headerCell3: HTMLTableCellElement = document.createElement('th');
            headerCell3.classList.add('left');
            headerCell3.textContent = 'Value';
            header.appendChild(headerCell1);
            header.appendChild(headerCell2);
            header.appendChild(headerCell3);
            table.appendChild(header);

            let tbody: HTMLTableSectionElement = document.createElement('tbody');
            table.appendChild(tbody);
            let metaArray: Array<{ type: string, value: string }> = data[i].meta;
            for (let j: number = 0; j < metaArray.length; j++) {
                let row: HTMLTableRowElement = document.createElement('tr');
                tbody.appendChild(row);
                let checkbox: HTMLInputElement = document.createElement('input');
                checkbox.type = 'checkbox';
                let cell1: HTMLTableCellElement = document.createElement('td');
                cell1.innerHTML = checkbox.outerHTML;
                row.appendChild(cell1);
                cell1.classList.add('middle');
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

            let entryButtons: HTMLDivElement = document.createElement('div');
            entryButtons.classList.add('buttonArea');
            entryButtons.classList.add('borderBottom');
            entryButtons.classList.add('entryButtonsContainer');
            holder.appendChild(entryButtons);

            let addButton: HTMLButtonElement = document.createElement('button');
            addButton.textContent = 'Add Entry';
            addButton.addEventListener('click', () => {
                this.electron.ipcRenderer.send('show-add-metaDialog');
            });
            entryButtons.appendChild(addButton);

            let editButton: HTMLButtonElement = document.createElement('button');
            editButton.textContent = 'Edit Entry';
            editButton.addEventListener('click', () => {
                this.electron.ipcRenderer.send('show-edit-metaDialog');
            });
            entryButtons.appendChild(editButton);

            let removeButton: HTMLButtonElement = document.createElement('button');
            removeButton.textContent = 'Remove Entry';
            entryButtons.appendChild(removeButton);

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