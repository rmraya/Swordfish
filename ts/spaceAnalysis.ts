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

class SpaceAnalysis {

    electron = require('electron');

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.gotoSegment();
            }
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-spaceAnalysis');
            }
        });
        this.electron.ipcRenderer.on('set-spaceErrors', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setErrors(arg);
        });
        document.getElementById('goTo').addEventListener('click', () => {
            this.gotoSegment();
        });
        document.getElementById('fixAll').addEventListener('click', () => {
            this.electron.ipcRenderer.send('fix-spaceErrors');
        });
        document.getElementById('refresh').addEventListener('click', () => {
            this.electron.ipcRenderer.send('get-spaceErrors');
        });
        this.electron.ipcRenderer.send('get-spaceErrors');
        setTimeout(() => {
            this.electron.ipcRenderer.send('set-height', { window: 'spaceAnalysis', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    gotoSegment(): void {
        let selectedRows: HTMLCollectionOf<Element> = document.getElementsByClassName('selected');
        if (selectedRows.length === 0) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select a segment', parent: 'spaceAnalysis' });
            return;
        }
        this.electron.ipcRenderer.send('go-to-segment', { segment: Number.parseInt(selectedRows[0].id, 10) });
    }

    setErrors(data: any): void {
        let table: HTMLTableElement = document.getElementById('table') as HTMLTableElement;
        table.innerHTML = '';
        let length = data.errors.length;
        if (length === 0) {
            this.electron.ipcRenderer.send('show-message', { type: 'info', message: 'There are no space errors', parent: 'spaceAnalysis' });
        }
        for (let i = 0; i < length; i++) {
            let line: any = data.errors[i];
            let tr: HTMLTableRowElement = document.createElement('tr');
            tr.id = line.index;
            tr.addEventListener('click', () => {
                this.clicked(tr);
            });
            tr.addEventListener('dblclick', () => {
                this.electron.ipcRenderer.send('go-to-segment', { segment: line.index });
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
