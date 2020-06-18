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

        let addButton = document.createElement('a');
        addButton.innerHTML = '<svg version="1.1" viewBox="0 0 24 24" height="24" width="24">' +
            '<path style="stroke-width:0.825723" ' +
            'd="m 21,16.166667 h -2.454545 v -2.5 h -1.636364 v 2.5 h -2.454546 v 1.666666 h 2.454546 v 2.5 h 1.636364 v -2.5 H 21 Z m -5.727273,4.166666 V 22 H 3 V 2 h 8.336455 c 2.587909,0 8.027181,6.0191667 8.027181,8.011667 V 12 h -1.636363 v -1.285833 c 0,-3.4225003 -4.909091,-2.0475003 -4.909091,-2.0475003 0,0 1.242,-5 -2.158364,-5 H 4.6363636 V 20.333333 Z" />' +
            '</svg>' +
            '<span class="tooltiptext bottomTooltip">Add Project</span>';
        addButton.className = 'tooltip';
        addButton.addEventListener('click', () => {
            this.addProject()
        });
        topBar.appendChild(addButton);

        let openButton = document.createElement('a');
        openButton.innerHTML = '<svg version="1.1" viewBox="0 0 24 24" height="24" width="24">' +
            '<path style="stroke-width:0.816497" id="path299" ' +
            'd="m 20.0575,11.2 -1.154167,7.2 H 5.0966667 L 3.9425,11.2 Z M 8.6433333,4 h -5.81 l 0.595,4 H 5.1125 L 4.755,5.6 H 7.8333333 C 8.76,6.7104 9.46,7.2 11.3975,7.2 h 7.735833 L 18.966667,8 h 1.7 l 0.5,-2.4 H 11.3975 C 9.7491667,5.6 9.6966667,5.2664 8.6433333,4 Z M 22,9.6 H 2 L 3.6666667,20 H 20.333333 Z" />' +
            '</svg>' +
            '<span class="tooltiptext bottomTooltip">Open Project</span>';
        openButton.className = 'tooltip';
        openButton.addEventListener('click', () => {
            this.openProject()
        });
        topBar.appendChild(openButton);

        let span1 = document.createElement('span');
        span1.style.width = '30px';
        span1.innerHTML = '&nbsp;';
        topBar.appendChild(span1);

        let removeButton = document.createElement('a');
        removeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm6 13h-12v-2h12v2z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Remove Project</span>';
        removeButton.className = 'tooltip';
        removeButton.addEventListener('click', () => {
            this.removeProject()
        });
        topBar.appendChild(removeButton);

        let modifyButton = document.createElement('a');
        modifyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-3.994 12.964l3.106 3.105-4.112.931 1.006-4.036zm9.994-3.764l-5.84 5.921-3.202-3.202 5.841-5.919 3.201 3.2z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Modify Project</span>';
        modifyButton.className = 'tooltip';
        modifyButton.addEventListener('click', () => {
            this.modifyProject()
        });
        topBar.appendChild(modifyButton);

        let checkButton = document.createElement('a');
        checkButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm4.393 7.5l-5.643 5.784-2.644-2.506-1.856 1.858 4.5 4.364 7.5-7.643-1.857-1.857z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Complete Project</span>';
        checkButton.className = 'tooltip';
        checkButton.addEventListener('click', () => {
            this.completeProject()
        });
        topBar.appendChild(checkButton);

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
            '<th style="padding-left:5px;padding-right:5px;">Due Date</th>' +
            '<th style="padding-left:5px;padding-right:5px;">Completed</th>' +
            '</tr></thead>';

        this.tbody = document.createElement('tbody');
        projectsTable.appendChild(this.tbody);

        // event listeners

        window.addEventListener('resize', () => {
            this.setSizes()
        });
        this.electron.ipcRenderer.on('set-projects', (event: Electron.IpcRendererEvent, arg: any) => {
            this.displayProjects(arg);
        });

        // finish setup

        this.setSizes();
        this.loadProjects();
    }

    setSizes(): void {
        let body = document.getElementById('body');
        this.tableContainer.style.height = (body.clientHeight - 65) + 'px';
        this.tableContainer.style.width = this.container.clientWidth + 'px';
    }

    addProject(): void {
        this.electron.ipcRenderer.send('show-add-project');
    }

    openProject(): void {
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
            console.log(selected[i] + ' - ' + description);
            this.electron.ipcRenderer.send('add-tab', { id: selected[i], description: description });
        }
    }

    removeProject(): void {
        // TODO
    }

    modifyProject(): void {
        // TODO
    }

    completeProject(): void {
        // TODO
    }

    loadProjects(): void {
        this.electron.ipcRenderer.send('get-projects');
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
            td.id = p.id;
            let check: HTMLInputElement = document.createElement('input');
            check.type = 'checkbox';
            check.classList.add('projectCheck');
            check.setAttribute('data', p.id);
            td.appendChild(check);
            tr.appendChild(td);

            td = document.createElement('td');
            td.classList.add('noWrap');
            td.innerText = p.description;
            tr.append(td);
            this.descriptions.set(p.id, p.description);

            td = document.createElement('td');
            td.classList.add('center');
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
            tr.append(td);

            td = document.createElement('td');
            td.innerText = p.targetLang;
            td.classList.add('center');
            tr.append(td);

            td = document.createElement('td');
            td.classList.add('noWrap');
            td.classList.add('center');
            td.style.minWidth = '170px';
            td.innerText = p.creationDate;
            tr.append(td);

            td = document.createElement('td');
            td.classList.add('noWrap');
            td.classList.add('center');
            if (Date.now() > Date.parse(p.dueDate) && p.status !== 2) {
                td.classList.add('error');
            }
            td.style.minWidth = '170px';
            td.innerText = p.dueDate;
            tr.append(td);

            td = document.createElement('td');
            td.classList.add('noWrap');
            td.classList.add('center');
            td.style.minWidth = '170px';
            if (p.finishDateString) {
                td.innerText = p.finishDate;
            }
            tr.append(td);
            this.tbody.appendChild(tr);
        }
    }
}