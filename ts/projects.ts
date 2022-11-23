/*******************************************************************************
 * Copyright (c) 2007-2022 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/

class SourceFile {
    file: string;
    type: string;
    encoding: string;
}

class Project {
    id: string;
    description: string;
    status: string;
    sourceLang: string;
    targetLang: string;
    client: string;
    subject: string;
    creationDate: string;
    files: SourceFile[];
    xliff: string;
    memory: string;
    glossary: string;
    svg: string;
    version: string;
}

class ProjectsView {

    electron = require('electron');

    container: HTMLDivElement;
    topBar: HTMLDivElement;
    tableContainer: HTMLDivElement;
    tbody: HTMLTableSectionElement;
    projects: Project[];
    shouldOpen: string;

    constructor(div: HTMLDivElement) {
        this.shouldOpen = '';
        this.container = div;

        this.topBar = document.createElement('div');
        this.topBar.className = 'toolbar';
        this.container.appendChild(this.topBar);

        let addFileButton = document.createElement('a');
        addFileButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="m 21,16.166667 h -2.454545 v -2.5 h -1.636364 v 2.5 h -2.454546 v 1.666666 h 2.454546 v 2.5 h 1.636364 v -2.5 H 21 Z m -5.727273,4.166666 V 22 H 3 V 2 h 8.336455 c 2.587909,0 8.027181,6.0191667 8.027181,8.011667 V 12 h -1.636363 v -1.285833 c 0,-3.4225003 -4.909091,-2.0475003 -4.909091,-2.0475003 0,0 1.242,-5 -2.158364,-5 H 4.6363636 V 20.333333 Z" /></svg>' +
            '<span class="tooltiptext bottomTooltip">Translate Single File</span>';
        addFileButton.className = 'tooltip';
        addFileButton.addEventListener('click', () => {
            this.addFile();
        });
        this.topBar.appendChild(addFileButton);

        let addProjectButton = document.createElement('a');
        addProjectButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M20 6h-8l-2-2H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm0 12H4V6h5.17l2 2H20v10zm-8-4h2v2h2v-2h2v-2h-2v-2h-2v2h-2z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Add Project</span>';
        addProjectButton.className = 'tooltip';
        addProjectButton.addEventListener('click', () => {
            this.addProject();
        });
        this.topBar.appendChild(addProjectButton);

        let translateButton = document.createElement('a');
        translateButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Translate Project</span>';
        translateButton.className = 'tooltip';
        translateButton.addEventListener('click', () => {
            this.openProjects();
        });
        translateButton.style.marginLeft = '20px';
        this.topBar.appendChild(translateButton);

        let exportTranslations = document.createElement('a');
        exportTranslations.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Export Translations</span>';
        exportTranslations.className = 'tooltip';
        exportTranslations.addEventListener('click', () => {
            this.exportTranslations();
        });
        this.topBar.appendChild(exportTranslations);

        let statisticsButton = document.createElement('a');
        statisticsButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2.5 2.1h-15V5h15v14.1zm0-16.1h-15c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Project Statistics</span>';
        statisticsButton.className = 'tooltip';
        statisticsButton.style.marginLeft = '20px';
        statisticsButton.addEventListener('click', () => {
            this.generateStatistics()
        });
        this.topBar.appendChild(statisticsButton);

        let htmlExportButton = document.createElement('a');
        htmlExportButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24" viewBox="0 0 24 24" width="24"><path d="M19,3H5C3.89,3,3,3.9,3,5v14c0,1.1,0.89,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.11,3,19,3z M19,19H5V7h14V19z M17,12H7v-2 h10V12z M13,16H7v-2h6V16z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Export HTML</span>';
        htmlExportButton.className = 'tooltip';
        htmlExportButton.addEventListener('click', () => {
            this.exportHTML();
        });
        this.topBar.appendChild(htmlExportButton);

        let removeButton = document.createElement('a');
        removeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8 9h8v10H8V9zm7.5-5l-1-1h-5l-1 1H5v2h14V4h-3.5z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Remove Project</span>';
        removeButton.className = 'tooltip';
        removeButton.addEventListener('click', () => {
            this.removeProjects();
        });
        removeButton.style.marginLeft = '20px';
        this.topBar.appendChild(removeButton);

        let importButton = document.createElement('a');
        importButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24" viewBox="0 0 24 24" width="24"><path d="M19,9h-2v6.59L5.41,4L4,5.41L15.59,17H9v2h10V9z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Import Project</span>';
        importButton.className = 'tooltip';
        importButton.addEventListener('click', () => {
            this.electron.ipcRenderer.send('import-xliff');
        });
        importButton.style.marginLeft = '20px';
        this.topBar.appendChild(importButton);

        let exportButton = document.createElement('a');
        exportButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24" viewBox="0 0 24 24" width="24"><path d="M9,5v2h6.59L4,18.59L5.41,20L17,8.41V15h2V5H9z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Export Project</span>';
        exportButton.className = 'tooltip';
        exportButton.addEventListener('click', () => {
            this.exportProject();
        });
        this.topBar.appendChild(exportButton);

        this.tableContainer = document.createElement('div');
        this.tableContainer.classList.add('paddedPanel');
        this.container.appendChild(this.tableContainer);
        this.tableContainer.addEventListener('drop', (event: DragEvent) => { this.dropListener(event, this.tableContainer) });
        this.tableContainer.addEventListener('dragover', (event: DragEvent) => { this.dragOverListener(event) });
        this.tableContainer.addEventListener('dragenter', () => { this.dragEnterListener(this.tableContainer) });
        this.tableContainer.addEventListener('dragleave', () => { this.dragLeaveListener(this.tableContainer) });

        let projectsTable = document.createElement('table');
        projectsTable.classList.add('fill_width');
        projectsTable.classList.add('stripes');
        projectsTable.classList.add('discover');
        this.tableContainer.appendChild(projectsTable);

        projectsTable.innerHTML =
            '<thead><tr>' +
            '<th>&nbsp;</th>' +
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
            this.projects = arg;
            this.displayProjects();
        });

        // finish setup

        this.loadProjects({});

        this.watchSizes();

        setTimeout(() => {
            this.setSizes();
        }, 200);
    }

    setSizes(): void {
        let main: HTMLDivElement = document.getElementById('main') as HTMLDivElement;
        this.tableContainer.style.height = (main.clientHeight - this.topBar.clientHeight - 16) + 'px';
        this.tableContainer.style.width = (this.container.clientWidth - 16) + 'px';
    }

    watchSizes(): void {
        let targetNode: HTMLElement = document.getElementById('main');
        let config: MutationObserverInit = { attributes: true, childList: false, subtree: false };
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

    getSelectedProjects(): Map<string, Project> {
        let selected: Map<string, Project> = new Map<string, Project>();
        let checkboxes: HTMLCollectionOf<Element> = document.getElementsByClassName('projectSelection');
        for (let i: number = 0; i < checkboxes.length; i++) {
            let checkbox: HTMLInputElement = checkboxes[i] as HTMLInputElement;
            let id: string = checkbox.id.substring('ck_'.length);
            if (checkbox.checked) {
                selected.set(id, this.getProject(id));
            } else {
                document.getElementById(id).classList.remove('selected');
            }
        }
        return selected;
    }

    getProject(id: string): Project {
        let length: number = this.projects.length;
        for (let i = 0; i < length; i++) {
            if (this.projects[i].id === id) {
                return this.projects[i];
            }
        }
        return null;
    }

    clearSelection(): void {
        let checkboxes: HTMLCollectionOf<Element> = document.getElementsByClassName('projectSelection');
        for (let i: number = 0; i < checkboxes.length; i++) {
            let checkbox: HTMLInputElement = checkboxes[i] as HTMLInputElement;
            checkbox.checked = false;
            let id: string = checkbox.id.substring('ck_'.length);
            document.getElementById(id).classList.remove('selected');
        }
    }

    openProjects(): void {
        let selected = this.getSelectedProjects();
        if (selected.size === 0) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select project' });
            return;
        }
        for (let key of selected.keys()) {
            let project: Project = selected.get(key);
            this.electron.ipcRenderer.send('add-tab', project);
        }
    }

    exportTranslations(): void {
        let selected = this.getSelectedProjects();
        if (selected.size === 0) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select project' });
            return;
        }
        if (selected.size > 1) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select one project' });
            return;
        }
        for (let key of selected.keys()) {
            this.electron.ipcRenderer.send('export-translations', selected.get(key));
        }
    }

    generateStatistics(): void {
        let selected = this.getSelectedProjects();
        if (selected.size === 0) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select project' });
            return;
        }
        if (selected.size > 1) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select one project' });
            return;
        }
        for (let key of selected.keys()) {
            this.electron.ipcRenderer.send('generate-statistics', { project: key });
        }
    }

    removeProjects(): void {
        let selected = this.getSelectedProjects();
        if (selected.size === 0) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select project' });
            return;
        }
        let projects: string[] = [];
        for (let key of selected.keys()) {
            if (!Main.tabHolder.has(key)) {
                projects.push(key);
            } else {
                let p: Project = this.getProject(key);
                this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Project "' + p.description + '" is open' });
            }
        }
        this.electron.ipcRenderer.send('remove-projects', { projects: projects });
    }

    exportProject(): void {
        let selected = this.getSelectedProjects();
        if (selected.size === 0) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select project' });
            return;
        }
        if (selected.size > 1) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select one project' });
            return;
        }
        for (let key of selected.keys()) {
            let project: Project = selected.get(key);
            this.electron.ipcRenderer.send('export-xliff', { projectId: key, description: project.description });
        }
    }

    exportTMX(): void {
        let selected = this.getSelectedProjects();
        if (selected.size === 0) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select project' });
            return;
        }
        if (selected.size > 1) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select one project' });
            return;
        }
        for (let key of selected.keys()) {
            let project: Project = selected.get(key);
            this.electron.ipcRenderer.send('export-tmx-file', { projectId: key, description: project.description });
        }
    }

    displayProjects() {
        this.tbody.innerHTML = '';
        let length = this.projects.length;
        for (let i = 0; i < length; i++) {
            let p: Project = this.projects[i];

            let checkBox: HTMLInputElement = document.createElement('input');
            checkBox.id = 'ck_' + p.id;
            checkBox.type = 'checkbox';
            checkBox.classList.add('projectSelection');
            checkBox.addEventListener('click', () => {
                checkBox.checked = !checkBox.checked;
                if (checkBox.checked) {
                    tr.classList.add('selected');
                } else {
                    tr.classList.remove('selected');
                }
            });

            let tr = document.createElement('tr');
            tr.id = p.id;
            tr.addEventListener('click', () => {
                this.clicked(tr, checkBox);
            });
            tr.addEventListener('dblclick', () => {
                this.dblclicked(tr, checkBox);
            });
            this.tbody.appendChild(tr);
            if (this.shouldOpen === p.id) {
                this.clicked(tr, checkBox);
            }

            let td = document.createElement('td');
            td.classList.add('center');
            td.classList.add('list');
            td.style.width = '24px';
            td.appendChild(checkBox);
            tr.append(td);

            td = document.createElement('td');
            td.classList.add('list');
            if (p.description.length > 90 && (p.description.indexOf('/') != -1 || p.description.indexOf('\\') != -1)) {
                td.innerText = p.description.substring(0, 30) + ' ... ' + p.description.substring(p.description.length - 50);
                td.title = p.description;
            } else {
                td.innerText = p.description;
            }
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

    dblclicked(tr: HTMLTableRowElement, checkbox: HTMLInputElement): void {
        this.clearSelection();
        checkbox.checked = true;
        tr.classList.add('selected');
        this.openProjects();
    }

    clicked(tr: HTMLTableRowElement, checkbox: HTMLInputElement): void {
        checkbox.checked = !checkbox.checked;
        if (checkbox.checked) {
            tr.classList.add('selected');
        } else {
            tr.classList.remove('selected');
        }
    }

    updateStatus(arg: any): void {
        let projectId = arg.project;
        let svg = arg.statistics.svg;
        let rows: HTMLCollectionOf<HTMLTableRowElement> = this.tbody.getElementsByTagName('tr');
        for (let row of rows) {
            if (row.id === projectId) {
                let cells: HTMLCollectionOf<HTMLTableCellElement> = row.getElementsByTagName('td');
                cells[2].innerHTML = svg;
                break;
            }
        }
    }

    exportHTML(): void {
        let selected = this.getSelectedProjects();
        if (selected.size === 0) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select project' });
            return;
        }
        if (selected.size > 1) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select one project' });
            return;
        }
        for (let key of selected.keys()) {
            this.electron.ipcRenderer.send('export-project-html', { project: key });
        }
    }

    applyTranslationMemoryAll(): void {
        let selected = this.getSelectedProjects();
        if (selected.size === 0) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select project' });
            return;
        }
        if (selected.size > 1) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select one project' });
            return;
        }
        for (let key of selected.keys()) {
            let project: Project = selected.get(key);
            this.electron.ipcRenderer.send('show-apply-tm', { project: key, memory: project.memory });
        }
    }
}