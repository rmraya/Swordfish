/*****************************************************************************
Copyright (c) 2007-2020 - Maxprograms,  http://www.maxprograms.com/

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

class ProjectsView {

    electron = require('electron');

    container: HTMLDivElement;
    tableContainer: HTMLDivElement;
    tbody: HTMLTableSectionElement;

    descriptions: Map<string, string>;

    constructor(div: HTMLDivElement) {
        this.container = div;

        let topBar: HTMLDivElement = document.createElement('div');
        topBar.className = 'toolbar';
        this.container.appendChild(topBar);

        let addFileButton = document.createElement('a');
        addFileButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="m 21,16.166667 h -2.454545 v -2.5 h -1.636364 v 2.5 h -2.454546 v 1.666666 h 2.454546 v 2.5 h 1.636364 v -2.5 H 21 Z m -5.727273,4.166666 V 22 H 3 V 2 h 8.336455 c 2.587909,0 8.027181,6.0191667 8.027181,8.011667 V 12 h -1.636363 v -1.285833 c 0,-3.4225003 -4.909091,-2.0475003 -4.909091,-2.0475003 0,0 1.242,-5 -2.158364,-5 H 4.6363636 V 20.333333 Z" /></svg>' +
            '<span class="tooltiptext bottomTooltip">Translate Single File</span>';
        addFileButton.className = 'tooltip';
        addFileButton.addEventListener('click', () => {
            this.addFile();
        });
        topBar.appendChild(addFileButton);

        let addProjectButton = document.createElement('a');
        addProjectButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M20 6h-8l-2-2H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm0 12H4V6h5.17l2 2H20v10zm-8-4h2v2h2v-2h2v-2h-2v-2h-2v2h-2z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Add Project</span>';
        addProjectButton.className = 'tooltip';
        addProjectButton.addEventListener('click', () => {
            this.addProject();
        });
        topBar.appendChild(addProjectButton);

        let span0 = document.createElement('span');
        span0.style.width = '30px';
        span0.innerHTML = '&nbsp;';
        topBar.appendChild(span0);

        let openButton = document.createElement('a');
        openButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Open Project</span>';
        openButton.className = 'tooltip';
        openButton.addEventListener('click', () => {
            this.openProjects();
        });
        topBar.appendChild(openButton);

        let span1 = document.createElement('span');
        span1.style.width = '10px';
        span1.innerHTML = '&nbsp;';
        topBar.appendChild(span1);

        let removeButton = document.createElement('a');
        removeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm6 13h-12v-2h12v2z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Remove Project</span>';
        removeButton.className = 'tooltip';
        removeButton.addEventListener('click', () => {
            this.removeProject();
        });
        topBar.appendChild(removeButton);

        let span2 = document.createElement('span');
        span2.style.width = '30px';
        span2.innerHTML = '&nbsp;';
        topBar.appendChild(span2);

        let importButton = document.createElement('a');
        importButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M8 9v-4l8 7-8 7v-4h-8v-6h8zm2-7v2h12v16h-12v2h14v-20h-14z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Import Project</span>';
        importButton.className = 'tooltip';
        importButton.addEventListener('click', () => {
            this.importProject();
        });
        topBar.appendChild(importButton);

        let exportButton = document.createElement('a');
        exportButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M16 9v-4l8 7-8 7v-4h-8v-6h8zm-16-7v20h14v-2h-12v-16h12v-2h-14z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Export Project</span>';
        exportButton.className = 'tooltip';
        exportButton.addEventListener('click', () => {
            this.exportProject();
        });
        topBar.appendChild(exportButton);

        this.tableContainer = document.createElement('div');
        this.tableContainer.classList.add('divContainer');
        this.container.appendChild(this.tableContainer);

        let projectsTable = document.createElement('table');
        projectsTable.classList.add('fill_width');
        projectsTable.classList.add('stripes');
        this.tableContainer.appendChild(projectsTable);

        projectsTable.innerHTML =
            '<thead><tr>' +
            '<th><input type="checkbox"></th>' +
            '<th>Description</th><th>Status</th>' +
            '<th style="padding-left:5px;padding-right:5px;">Src.Lang.</th>' +
            '<th style="padding-left:5px;padding-right:5px;">Tgt.Lang.</th>' +
            '<th style="padding-left:5px;padding-right:5px;">Created</th>' +
            '<th style="padding-left:5px;padding-right:5px;">Client</th>' +
            '<th style="padding-left:5px;padding-right:5px;">Subject</th>' +
            '</tr></thead>';

        this.tbody = document.createElement('tbody');
        projectsTable.appendChild(this.tbody);

        // event listeners

        this.electron.ipcRenderer.on('set-projects', (event: Electron.IpcRendererEvent, arg: any) => {
            this.displayProjects(arg);
        });

        // finish setup

        this.loadProjects();

        this.watchSizes();

        setTimeout(() => {
            this.setSizes();
        }, 200);
    }

    setSizes(): void {
        let main = document.getElementById('main');
        this.container.style.width = main.clientWidth + 'px';
        this.container.style.height = main.clientHeight + 'px';
        this.tableContainer.style.height = (main.clientHeight - 65) + 'px';
        this.tableContainer.style.width = this.container.clientWidth + 'px';
    }

    watchSizes(): void {
        let targetNode: HTMLElement = document.getElementById('main');
        let config: any = { attributes: true, childList: false, subtree: false };
        let observer = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    this.setSizes();
                }
            }
        });
        observer.observe(targetNode, config);
    }

    loadProjects(): void {
        this.electron.ipcRenderer.send('get-projects');
    }

    addFile(): void {
        this.electron.ipcRenderer.send('show-add-file');
    }

    addProject(): void {
        this.electron.ipcRenderer.send('show-add-project');
    }

    openProjects(): void {
        let selected: string[] = [];
        let list: HTMLCollectionOf<Element> = document.getElementsByClassName('projectCheck');
        let length = list.length;
        for (let i = 0; i < length; i++) {
            let check: HTMLInputElement = list[i] as HTMLInputElement;
            if (check.checked) {
                selected.push(check.getAttribute('data'));
            }
        }
        if (selected.length === 0) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select project' });
            return;
        }
        length = selected.length;
        for (let i = 0; i < length; i++) {
            let description = this.descriptions.get(selected[i]);
            this.electron.ipcRenderer.send('add-tab', { id: selected[i], description: description });
        }
    }

    removeProject(): void {
        // TODO
    }

    importProject(): void {
        // TODO
    }

    exportProject(): void {
        // TODO
    }

    displayProjects(projects: any[]) {
        this.descriptions = new Map<string, string>();
        this.tbody.innerHTML = '';
        let length = projects.length;
        for (let i = 0; i < length; i++) {
            let p = projects[i];
            let tr = document.createElement('tr');
            tr.className = 'discover';

            let td = document.createElement('td');
            td.classList.add('fixed');
            td.classList.add('middle');
            td.id = p.id;
            let check: HTMLInputElement = document.createElement('input');
            check.type = 'checkbox';
            check.classList.add('projectCheck');
            check.setAttribute('data', p.id);
            td.appendChild(check);
            tr.appendChild(td);

            td = document.createElement('td');
            td.classList.add('noWrap');
            td.classList.add('middle');
            td.innerText = p.description;
            tr.append(td);
            this.descriptions.set(p.id, p.description);

            td = document.createElement('td');
            td.classList.add('center');
            td.classList.add('middle');
            if (p.status === 0) {
                td.innerText = 'New';
            } else if (p.status === 1) {
                td.innerText = 'In Progress';
            } else {
                td.innerText = 'Completed'
            }
            tr.append(td);

            td = document.createElement('td');
            td.innerText = p.sourceLang;
            td.classList.add('center');
            td.classList.add('middle');
            tr.append(td);

            td = document.createElement('td');
            td.innerText = p.targetLang;
            td.classList.add('center');
            td.classList.add('middle');
            tr.append(td);

            td = document.createElement('td');
            td.classList.add('noWrap');
            td.classList.add('middle');
            td.classList.add('center');
            td.style.minWidth = '170px';
            td.innerText = p.creationDate;
            tr.append(td);

            td = document.createElement('td');
            td.classList.add('noWrap');
            td.classList.add('middle');
            td.classList.add('center');
            td.style.minWidth = '170px';
            td.innerText = p.client;
            tr.append(td);

            td = document.createElement('td');
            td.classList.add('noWrap');
            td.classList.add('middle');
            td.classList.add('center');
            td.style.minWidth = '170px';
            td.innerText = p.subject;
            tr.append(td);
            this.tbody.appendChild(tr);
        }
    }
}