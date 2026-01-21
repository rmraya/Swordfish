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
import { Database } from "./database.js";

export class BrowseDatabases {

    databases: any;
    selected: Map<string, Database>;

    constructor() {
        this.selected = new Map<string, Database>();
        ipcRenderer.send('get-theme');
        ipcRenderer.on('set-theme', (event: IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        (document.getElementById('container') as HTMLDivElement).style.height = '250px';
        ipcRenderer.send('get-databases');
        ipcRenderer.on('set-databases', (event: IpcRendererEvent, arg: any) => {
            this.setDatabases(arg);
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.addSelected();
            }
            if (event.code === 'Escape') {
                ipcRenderer.send('close-browseServer');
            }
        });
        (document.getElementById('addButton') as HTMLButtonElement).addEventListener('click', () => {
            this.addSelected();
        });
        setTimeout(() => {
            ipcRenderer.send('set-height', { window: 'browseDatabases', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    setDatabases(arg: any): void {
        this.databases = arg;
        let tbody = document.getElementById('tbody') as HTMLTableSectionElement;
        let length = this.databases.memories.length;
        for (let i = 0; i < length; i++) {
            let database: Database = this.databases.memories[i];

            let checkBox: HTMLInputElement = document.createElement('input');
            checkBox.id = 'ck_' + database.id;
            checkBox.type = 'checkbox';

            let tr: HTMLTableRowElement = document.createElement('tr');
            tr.addEventListener('click', (event: MouseEvent) => {
                this.clicked(tr, database, checkBox);
            });
            tr.id = database.id;
            tbody.appendChild(tr);

            let td: HTMLTableCellElement = document.createElement('td');
            td.classList.add('center');
            td.classList.add('list');
            td.style.width = '24px';
            td.appendChild(checkBox);
            tr.append(td);

            td = document.createElement('td');
            tr.appendChild(td);
            td.innerText = database.name;

            td = document.createElement('td');
            tr.appendChild(td);
            td.innerText = database.project;

            td = document.createElement('td');
            tr.appendChild(td);
            td.innerText = database.subject;

            td = document.createElement('td');
            tr.appendChild(td);
            td.innerText = database.client;
        }
        (document.getElementById('addButton') as HTMLButtonElement).innerText = arg.type === 'memory' ? 'Add Memory' : 'Add Glossary';
    }

    addSelected(): void {
        if (this.selected.size === 0) {
            ipcRenderer.send('show-message', { type: 'warning', message: 'Select one or more rows', parent: 'browseDatabases' });
            return;
        }
        let selectedList: any[] = [];
        this.selected.forEach((database) => {
            selectedList.push(database);
        });
        ipcRenderer.send('add-databases', {
            type: this.databases.type, databases: selectedList,
            server: this.databases.server, user: this.databases.user,
            password: this.databases.password
        });
    }

    clicked(tr: HTMLTableRowElement, memory: Database, checkbox: HTMLInputElement): void {
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
}
