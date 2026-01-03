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

class TagAnalysis {

    constructor() {
        ipcRenderer.send('get-theme');
        ipcRenderer.on('set-theme', (event: IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.gotoSegment();
            }
            if (event.code === 'Escape') {
                ipcRenderer.send('close-tagsAnalysis');
            }
        });
        ipcRenderer.on('set-tagsErrors', (event: IpcRendererEvent, arg: any) => {
            this.setErrors(arg);
        });
        (document.getElementById('goTo') as HTMLButtonElement).addEventListener('click', () => {
            this.gotoSegment();
        });
        (document.getElementById('refresh') as HTMLButtonElement).addEventListener('click', () => {
            ipcRenderer.send('get-tagsErrors');
        });
        ipcRenderer.send('get-tagsErrors');
        setTimeout(() => {
            ipcRenderer.send('set-height', { window: 'tagsAnalysis', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    gotoSegment(): void {
        let selectedRows: HTMLCollectionOf<Element> = document.getElementsByClassName('selected');
        if (selectedRows.length === 0) {
            ipcRenderer.send('show-message', { type: 'warning', message: 'Select a segment', parent: 'tagsAnalysis' });
            return;
        }
        ipcRenderer.send('go-to-segment', Number.parseInt(selectedRows[0].id, 10));
    }

    setErrors(data: any): void {
        let table: HTMLTableElement = document.getElementById('table') as HTMLTableElement;
        table.innerHTML = '';
        let length = data.errors.length;
        if (length === 0) {
            ipcRenderer.send('show-message', { type: 'info', message: 'There are no tag errors', parent: 'tagsAnalysis' });
        }
        for (let i = 0; i < length; i++) {
            let line: any = data.errors[i];
            let tr: HTMLTableRowElement = document.createElement('tr');
            tr.id = line.index;
            tr.addEventListener('click', () => {
                this.clicked(tr);
            });
            tr.addEventListener('dblclick', () => {
                ipcRenderer.send('go-to-segment', line.index);
            });
            table.appendChild(tr);
            let cell: HTMLTableCellElement = document.createElement('td');
            cell.classList.add('center');
            cell.classList.add('initial');
            cell.innerText = line.index;
            tr.appendChild(cell);
            let errorType: HTMLTableCellElement = document.createElement('td');
            errorType.classList.add('center');
            errorType.classList.add('fill_width');
            errorType.innerText = line.type;
            tr.appendChild(errorType);
        }
        table.focus();
    }

    clicked(tr: HTMLTableRowElement): void {
        if (tr.classList.contains('selected')) {
            tr.classList.remove('selected');
            return;
        }
        let selectedRows: HTMLCollectionOf<Element> = document.getElementsByClassName('selected');
        for (let row of selectedRows) {
            row.classList.remove('selected');
        }
        tr.classList.add('selected');
    }
}
