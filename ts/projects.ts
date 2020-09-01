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

    selected: Map<string, any>;
    shouldOpen: string;

    constructor(div: HTMLDivElement) {
        this.selected = new Map<string, any>();
        this.shouldOpen = '';
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

        let translateButton = document.createElement('a');
        translateButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Translate Project</span>';
        translateButton.className = 'tooltip';
        translateButton.addEventListener('click', () => {
            this.openProjects();
        });
        translateButton.style.marginLeft = '20px';
        topBar.appendChild(translateButton);

        let exportTranslations = document.createElement('a');
        exportTranslations.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Export Translations</span>';
        exportTranslations.className = 'tooltip';
        exportTranslations.addEventListener('click', () => {
            this.exportTranslations();
        });
        topBar.appendChild(exportTranslations);

        let removeButton = document.createElement('a');
        removeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8 9h8v10H8V9zm7.5-5l-1-1h-5l-1 1H5v2h14V4h-3.5z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Remove Project</span>';
        removeButton.className = 'tooltip';
        removeButton.addEventListener('click', () => {
            this.removeProjects();
        });
        removeButton.style.marginLeft = '20px';
        topBar.appendChild(removeButton);

        let importButton = document.createElement('a');
        importButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M8 9v-4l8 7-8 7v-4h-8v-6h8zm2-7v2h12v16h-12v2h14v-20h-14z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Import XLIFF File as Project</span>';
        importButton.className = 'tooltip';
        importButton.addEventListener('click', () => {
            this.electron.ipcRenderer.send('import-xliff');
        });
        importButton.style.marginLeft = '20px';
        topBar.appendChild(importButton);

        let exportButton = document.createElement('a');
        exportButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M16 9v-4l8 7-8 7v-4h-8v-6h8zm-16-7v20h14v-2h-12v-16h12v-2h-14z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Export Project as XLIFF File</span>';
        exportButton.className = 'tooltip';
        exportButton.addEventListener('click', () => {
            this.exportProject();
        });
        topBar.appendChild(exportButton);

        this.tableContainer = document.createElement('div');
        this.tableContainer.classList.add('divContainer');
        this.container.appendChild(this.tableContainer);
        this.tableContainer.addEventListener('drop', (event: DragEvent) => { this.dropListener(event, this.tableContainer) });
        this.tableContainer.addEventListener('dragover', (event: DragEvent) => { this.dragOverListener(event) });
        this.tableContainer.addEventListener('dragenter', () => { this.dragEnterListener(this.tableContainer) });
        this.tableContainer.addEventListener('dragleave', () => { this.dragLeaveListener(this.tableContainer) });

        let projectsTable = document.createElement('table');
        projectsTable.classList.add('fill_width');
        projectsTable.classList.add('stripes');
        this.tableContainer.appendChild(projectsTable);

        projectsTable.innerHTML =
            '<thead><tr>' +
            '<th>Name</th><th>Status</th>' +
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

        this.loadProjects({});

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

    dropListener(event: DragEvent, container: HTMLElement): void {
        event.preventDefault();
        event.stopPropagation();
        let filesList: string[] = [];
        for (const f of event.dataTransfer.files) {
            filesList.push(f.path);
        }
        if (filesList.length > 0) {
            this.electron.ipcRenderer.send('files-dropped', { files: filesList });
        }
        container.style.opacity = '1';
    }

    dragEnterListener(container: HTMLElement): void {
        container.style.opacity = '0.3';
    }

    dragLeaveListener(container: HTMLElement): void {
        container.style.opacity = '1';
    }

    dragOverListener(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'link';
    }

    loadProjects(arg: any): void {
        this.electron.ipcRenderer.send('get-projects');
        if (arg.open) {
            this.shouldOpen = arg.open;
        }
    }

    addFile(): void {
        this.electron.ipcRenderer.send('show-add-file');
    }

    addProject(): void {
        this.electron.ipcRenderer.send('show-add-project');
    }

    openProjects(): void {
        if (this.selected.size === 0) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select project' });
            return;
        }
        for (let key of this.selected.keys()) {
            let project = this.selected.get(key);
            this.electron.ipcRenderer.send('add-tab', {
                id: key,
                description: project.description,
                srcLang: project.sourceLang,
                tgtLang: project.targetLang
            });
            document.getElementById(key).classList.remove('selected');
        }
        this.selected.clear();
    }

    exportTranslations(): void {
        if (this.selected.size === 0) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select project' });
            return;
        }
        if (this.selected.size > 1) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select one project' });
            return;
        }
        for (let key of this.selected.keys()) {
            this.electron.ipcRenderer.send('export-translations', this.selected.get(key));
        }
    }

    removeProjects(): void {
        if (this.selected.size === 0) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select project' });
            return;
        }
        let projects: string[] = [];
        for (let key of this.selected.keys()) {
            projects.push(key);
        }
        this.electron.ipcRenderer.send('remove-projects', { projects: projects });
    }

    exportProject(): void {
        if (this.selected.size === 0) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select project' });
            return;
        }
        if (this.selected.size > 1) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select one project' });
            return;
        }
        for (let key of this.selected.keys()) {
            let project = this.selected.get(key);
            this.electron.ipcRenderer.send('export-xliff', { projectId: key, description: project.description });
        }
    }

    exportTMX(): void {
        // TODO
    }

    displayProjects(projects: any[]) {
        this.selected.clear();
        this.tbody.innerHTML = '';
        let length = projects.length;
        for (let i = 0; i < length; i++) {
            let p = projects[i];
            let tr = document.createElement('tr');
            tr.id = p.id;
            tr.className = 'discover';
            tr.addEventListener('click', (event: MouseEvent) => {
                this.clicked(event, p);
            });
            tr.addEventListener('dblclick', (event: MouseEvent) => {
                this.dblclicked(event, p);
            });
            this.tbody.appendChild(tr);
            if (this.shouldOpen === p.id) {
                this.selected.set(p.id, p);
            }

            let td = document.createElement('td');
            td.classList.add('list');
            td.innerText = p.description;
            tr.append(td);

            td = document.createElement('td');
            td.classList.add('center');
            td.classList.add('list');
            td.style.paddingTop = '4px';
            td.style.paddingBottom = '0px';
            td.innerHTML = p.svg;
            tr.append(td);

            td = document.createElement('td');
            td.innerText = p.sourceLang;
            td.classList.add('center');
            td.classList.add('list');
            tr.append(td);

            td = document.createElement('td');
            td.innerText = p.targetLang;
            td.classList.add('center');
            td.classList.add('list');
            tr.append(td);

            td = document.createElement('td');
            td.classList.add('list');
            td.classList.add('center');
            td.style.minWidth = '170px';
            td.innerText = p.creationDate;
            tr.append(td);

            td = document.createElement('td');
            td.classList.add('list');
            td.classList.add('center');
            td.style.minWidth = '170px';
            td.innerText = p.client;
            tr.append(td);

            td = document.createElement('td');
            td.classList.add('list');
            td.classList.add('center');
            td.style.minWidth = '170px';
            td.innerText = p.subject;
            tr.append(td);
        }
        if (this.shouldOpen !== '') {
            this.openProjects();
            this.shouldOpen = '';
        }
    }

    dblclicked(event: MouseEvent, project: any): void {
        for (let key of this.selected.keys()) {
            document.getElementById(key).classList.remove('selected');
        }
        this.selected.clear();
        this.selected.set(project.id, project);
        this.openProjects();
    }

    clicked(event: MouseEvent, project: any): void {
        let tr: HTMLTableRowElement = event.currentTarget as HTMLTableRowElement;
        let isSelected: boolean = this.selected.has(project.id);
        if (!isSelected) {
            if (!(event.ctrlKey || event.metaKey)) {
                for (let key of this.selected.keys()) {
                    document.getElementById(key).classList.remove('selected');
                }
                this.selected.clear();
            }
            this.selected.set(project.id, project);
            tr.classList.add('selected');
        } else {
            this.selected.delete(project.id);
            tr.classList.remove('selected');
        }
    }

    updateStatus(arg: any): void {
        let projectId = arg.project;
        let svg = arg.statistics.svg;
        let rows: HTMLCollectionOf<HTMLTableRowElement> = this.tbody.getElementsByTagName('tr');
        for (let i = 0; i < rows.length; i++) {
            if (rows[i].id === projectId) {
                let cells: HTMLCollectionOf<HTMLTableCellElement> = rows[i].getElementsByTagName('td');
                cells[1].innerHTML = svg;
                break;
            }
        }
    }

    splitSegment(): void {
        // TODO
    }

    mergeNext(): void {
        // TODO
    }
}