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
    projectsTable: HTMLTableElement;

    constructor(div: HTMLDivElement) {
        this.container = div;
        let topBar: HTMLDivElement = document.createElement('div');
        topBar.className = 'toolbar';
        this.container.appendChild(topBar);

        let addButton = document.createElement('a');
        addButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm6 13h-5v5h-2v-5h-5v-2h5v-5h2v5h5v2z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Add Project</span>';
        addButton.className = 'tooltip';
        addButton.addEventListener('click', () => {
            this.addProject()
        });
        topBar.appendChild(addButton);

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

        this.tableContainer = document.createElement('div');
        this.tableContainer.classList.add('scrollPanel');
        this.container.appendChild(this.tableContainer);

        this.projectsTable = document.createElement('table');
        this.projectsTable.classList.add('fill_width');
        this.projectsTable.classList.add('stripes');
        this.tableContainer.appendChild(this.projectsTable);

        /*
                this.projectsTable.innerHTML = '<thead><tr>' +
                    '<th class="fixed"><input type="checkbox"></th>' +
                    '<th>Description</th><th>Status</th>' +
                    '<th>Src.Lang.</th><th>Tgt.Lang.</th>' +
                    '<th>Created</th><th>Completed</th>' +
                    '</tr></thead>' +
                    '<tbody id="projectsBody"></tbody>';
        */

        let tbody = document.createElement('tbody');
        tbody.id = 'projectsBody';
        this.projectsTable.appendChild(tbody);

        // event listeners

        window.addEventListener('resize', () => {
            this.setSizes()
        });

        this.electron.ipcRenderer.on('set-projects', (event, arg) => {
            this.displayProjects(arg);
        })

        // finish setup

        this.setSizes();
        // this.loadProjects();
    }

    setSizes() {
        this.tableContainer.style.height = (this.container.clientHeight - 30) + 'px';
        this.tableContainer.style.width = (this.container.clientWidth - 2) + 'px';
    }

    addProject(): void {
        // TODO
        this.electron.ipcRenderer.send('show-add-project');
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

    displayProjects(projects: any[]) {
        document.getElementById('projectsBody').innerHTML = '';
        let length = projects.length;
        for (let i = 0; i < length; i++) {
            let p = projects[i];
            let tr = document.createElement('tr');
            tr.className = 'discover';

            let td = document.createElement('td');
            td.id = p.id;
            td.innerHTML = '<input type="checkbox" data="' + p.id + '" class="fixed">'
            tr.appendChild(td);

            td = document.createElement('td');
            td.innerText = p.description;
            tr.append(td);

            document.getElementById('projectsBody').appendChild(tr);
        }
    }
}