/*****************************************************************************
Copyright (c) 2007-2021 - Maxprograms,  http://www.maxprograms.com/

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to compile,
modify and use the Software in its executable form without restrictions.

Redistribution of this Software or parts of it in any form (source code or
executable binaries) requires prior written permission from Maxprograms.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*****************************************************************************/

class Database {
    id: string;
    name: string;
    owner: string;
    project: string;
    subject: string;
    client: string;
    creationDate: string;
    open: boolean;
}

class BrowseDatabases {

    electron = require('electron');
    databases: any;
    selected: Map<string, Database>;

    constructor() {
        this.selected = new Map<string, Database>();
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
        });
        document.getElementById('container').style.height = '250px';
        this.electron.ipcRenderer.send('get-databases');
        this.electron.ipcRenderer.on('set-databases', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setDatabases(arg);
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => { KeyboardHandler.keyListener(event); });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.addSelected();
            }
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-browseServer');
            }
        });
        document.getElementById('addButton').addEventListener('click', () => {
            this.addSelected();
        });
        let body: HTMLBodyElement = document.getElementById('body') as HTMLBodyElement;
        this.electron.ipcRenderer.send('browseDatabases-height', { width: body.clientWidth, height: body.clientHeight });
    }

    setDatabases(arg: any) {
        this.databases = arg;
        let tbody = document.getElementById('tbody') as HTMLTableSectionElement;
        let length = this.databases.memories.length;
        for (let i = 0; i < length; i++) {
            let database: Database = this.databases.memories[i];
            let tr: HTMLTableRowElement = document.createElement('tr');
            tr.addEventListener('click', (event: MouseEvent) => {
                this.clicked(event, database);
            });
            tr.id = database.id;
            tbody.appendChild(tr);

            let td: HTMLTableCellElement = document.createElement('td');
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
        document.getElementById('addButton').innerText = arg.type === 'memory' ? 'Add Memory' : 'Add Glossary';
    }

    addSelected(): void {
        if (this.selected.size === 0) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select one or more rows', parent: 'browseDatabases' });
            return;
        }
        let selectedList: any[] = [];
        this.selected.forEach((database) => {
            selectedList.push(database);
        });
        this.electron.ipcRenderer.send('add-databases', {
            type: this.databases.type, databases: selectedList,
            server: this.databases.server, user: this.databases.user,
            password: this.databases.password
        });
    }

    clicked(event: MouseEvent, memory: Database): void {
        let tr: HTMLTableRowElement = event.currentTarget as HTMLTableRowElement;
        let isSelected: boolean = this.selected.has(memory.id);
        if (!isSelected) {
            if (!(event.ctrlKey || event.metaKey)) {
                for (let key of this.selected.keys()) {
                    document.getElementById(key).classList.remove('selected');
                }
                this.selected.clear()
            }
            this.selected.set(memory.id, memory);
            tr.classList.add('selected');
        } else {
            this.selected.delete(memory.id);
            tr.classList.remove('selected');
        }
    }
}

new BrowseDatabases();