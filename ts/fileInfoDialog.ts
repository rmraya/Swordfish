/*******************************************************************************
 * Copyright (c) 2007-2026 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/

import { ipcRenderer, IpcRendererEvent } from "electron";

export class FileInfoDialog {

    constructor() {
        ipcRenderer.send('get-theme');
        ipcRenderer.on('set-theme', (event: IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        ipcRenderer.on('set-file-info', (event: IpcRendererEvent, details: any) => {
            this.showFileInfo(details);
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                ipcRenderer.send('close-file-info');
            }
        });
        document.addEventListener('resize', (event: UIEvent) => {
            let main: HTMLDivElement = document.getElementById('main') as HTMLDivElement;
            main.style.height = document.body.clientHeight + 'px';
        });
        setTimeout(() => {
            ipcRenderer.send('set-height', { window: 'fileInfo', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    showFileInfo(details: any) {
        let id: number = 0;
        let main: HTMLDivElement = document.getElementById('main') as HTMLDivElement;
        main.innerHTML = '';

        let topTable: HTMLTableElement = document.createElement('table');
        topTable.classList.add('stripes');
        main.appendChild(topTable);

        let row: HTMLTableRowElement = document.createElement('tr');
        let cell: HTMLTableCellElement = document.createElement('td');
        cell.innerText = 'Original File';
        cell.classList.add('noWrap');
        row.appendChild(cell);
        cell = document.createElement('td');
        cell.innerText = details.original;
        cell.classList.add('noWrap');
        row.appendChild(cell);
        topTable.appendChild(row);

        let metadata: any[] = details.metadata;
        for (const item of metadata) {
            row = document.createElement('tr');
            cell = document.createElement('td');
            cell.innerText = item.category;
            cell.classList.add('noWrap');
            cell.classList.add('middle');
            cell.classList.add('center');
            row.appendChild(cell);

            let metaTable: HTMLTableElement = document.createElement('table');
            metaTable.classList.add('nestedTable');
            metaTable.style.minWidth = '360px';
            main.appendChild(metaTable);
            let data: any[] = item.meta;
            for (const entry of data) {
                let row: HTMLTableRowElement = document.createElement('tr');
                let cell: HTMLTableCellElement = document.createElement('td');
                cell.innerText = entry.type;
                cell.classList.add('noWrap');
                cell.id = 'meta-' + id;
                row.appendChild(cell);
                cell = document.createElement('td');
                cell.innerText = entry.value;
                cell.id = 'value-' + id++;
                cell.style.width = '100%';
                row.appendChild(cell);
                metaTable.appendChild(row);
            }
            cell = document.createElement('td');
            cell.appendChild(metaTable);
            cell.classList.add('nopadding');
            row.appendChild(cell);
            topTable.appendChild(row);
        }
        setTimeout(() => {
            let max: number = 0;
            for (let i = 0; i < id; i++) {
                let cell: HTMLTableCellElement = document.getElementById('meta-' + i) as HTMLTableCellElement;
                let width: number = cell.clientWidth;
                if (width > max) {
                    max = width;
                }
            }

            for (let i = 0; i < id; i++) {
                let typeCell: HTMLTableCellElement = document.getElementById('meta-' + i) as HTMLTableCellElement;
                typeCell.style.width = max + 'px';
                typeCell.style.minWidth = max + 'px';
                let valueCell: HTMLTableCellElement = document.getElementById('value-' + i) as HTMLTableCellElement;
                valueCell.style.width = 'calc(100% - ' + max + 'px)';
            }

        }, 150);
    }
}
