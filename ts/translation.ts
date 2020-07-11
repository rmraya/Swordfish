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

class TranslationView {

    electron = require('electron');

    container: HTMLDivElement;

    mainArea: HTMLDivElement;
    filesArea: HTMLDivElement;
    translationArea: HTMLDivElement;
    rightPanel: HTMLDivElement;
    segmentsArea: HTMLDivElement;
    memoryArea: HTMLDivElement;
    machineArea: HTMLDivElement;
    termsArea: HTMLDivElement;
    statusArea: HTMLDivElement;

    projectId: string;
    projectFiles: string[];
    tbody: HTMLTableSectionElement;
    sourceTh: HTMLTableCellElement;
    targetTh: HTMLTableCellElement;

    pagesSpan: HTMLSpanElement;

    maxPage: number;
    currentPage: number;
    rowsPage: number = 500;
    maxRows: number;

    currentCell: HTMLTableCellElement;
    currentContent: string;
    currentId: string;
    textArea: HTMLTextAreaElement;

    constructor(div: HTMLDivElement, projectId: string) {
        this.container = div;
        this.projectId = projectId;

        let topBar: HTMLDivElement = document.createElement('div');
        topBar.className = 'toolbar';
        div.appendChild(topBar);

        let exportTranslations = document.createElement('a');
        exportTranslations.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Export Translations</span>';
        exportTranslations.className = 'tooltip';
        exportTranslations.addEventListener('click', () => {
            this.exportTranslations();
        });
        topBar.appendChild(exportTranslations);

        let statisticsButton = document.createElement('a');
        statisticsButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2.5 2.1h-15V5h15v14.1zm0-16.1h-15c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Project Statistics</span>';
        statisticsButton.className = 'tooltip';
        statisticsButton.addEventListener('click', () => {
            this.generateStatistics()
        });
        topBar.appendChild(statisticsButton);

        this.mainArea = document.createElement('div');
        this.mainArea.id = 'main' + projectId;
        this.mainArea.style.display = 'flex';
        div.appendChild(this.mainArea);

        let verticalPanels: VerticalSplit = new VerticalSplit(this.mainArea);
        verticalPanels.setWeights([75, 25]);
        this.filesArea = verticalPanels.leftPanel();

        this.translationArea = verticalPanels.leftPanel();
        this.translationArea.style.height = '100%';

        this.rightPanel = verticalPanels.rightPanel();

        this.buildTranslationArea();
        this.buildRightSide();

        this.electron.ipcRenderer.send('get-files', { project: this.projectId });
        this.electron.ipcRenderer.on('set-files', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setFiles(arg);
        });
        this.electron.ipcRenderer.on('set-segments', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setSegments(arg);
        });

        this.watchSizes();

        setTimeout(() => {
            this.setSize();
        }, 200);
    }

    getContainer(): HTMLDivElement {
        return this.container;
    }

    setSize() {
        let main = document.getElementById('main');
        this.container.style.width = main.clientWidth + 'px';
        this.container.style.height = main.clientHeight + 'px';
        this.mainArea.style.height = (main.clientHeight - 34) + 'px';
        this.mainArea.style.width = this.container.clientWidth + 'px';
    }

    watchSizes(): void {
        let targetNode: HTMLElement = document.getElementById('main');
        let config: any = { attributes: true, childList: false, subtree: false };
        let observer = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    this.setSize();
                }
            }
        });
        observer.observe(targetNode, config);
    }

    exportTranslations() {
        this.electron.ipcRenderer.send('export-translations', { id: this.projectId, files: this.projectFiles });
    }

    setFiles(arg: any): void {
        this.projectFiles = arg.files;
        this.getSegments();
    }

    getSegments(): void {
        let params: any = {
            project: this.projectId, files: [], start: 0, count: 10000, filterText: '',
            filterLanguage: '', caseSensitiveFilter: false, filterUntranslated: false, regExp: false
        };

        this.electron.ipcRenderer.send('get-segments', params);
    }

    buildTranslationArea(): void {
        let tableContainer: HTMLDivElement = document.createElement('div');
        tableContainer.classList.add('divContainer');
        tableContainer.classList.add('fill_width');
        this.translationArea.appendChild(tableContainer);

        let table: HTMLTableElement = document.createElement('table');
        table.classList.add('fill_width');
        table.classList.add('stripes');
        tableContainer.appendChild(table);

        let thead: HTMLTableSectionElement = document.createElement('thead');
        table.appendChild(thead);

        let tr: HTMLTableRowElement = document.createElement('tr');
        thead.appendChild(tr);

        let th = document.createElement('th');
        th.classList.add('fixed');
        th.innerText = '#'
        tr.appendChild(th);

        this.sourceTh = document.createElement('th');
        this.sourceTh.innerText = 'Source'
        this.sourceTh.style.minWidth = '200px';
        tr.appendChild(this.sourceTh);

        th = document.createElement('th');
        let selectAll: HTMLInputElement = document.createElement('input');
        selectAll.type = 'checkbox';
        th.appendChild(selectAll);
        tr.appendChild(th);

        this.targetTh = document.createElement('th');
        this.targetTh.innerText = 'Target'
        this.targetTh.style.minWidth = '200px';
        tr.appendChild(this.targetTh);

        this.tbody = document.createElement('tbody');
        table.appendChild(this.tbody);

        this.statusArea = document.createElement('div');
        this.statusArea.classList.add('toolbar');
        this.statusArea.style.borderTopColor = 'var(--accent-color)';
        this.translationArea.appendChild(this.statusArea);

        let firstLink: HTMLAnchorElement = document.createElement('a');
        firstLink.classList.add('tooltip');
        firstLink.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24">' +
            '<path d="M18.41 16.59L13.82 12l4.59-4.59L17 6l-6 6 6 6zM6 6h2v12H6z" /></svg>' +
            '<span class="tooltiptext topTooltip">First Page</span>';
        firstLink.addEventListener('click', () => {
            this.firstPage();
        });
        this.statusArea.appendChild(firstLink);

        let previousLink: HTMLAnchorElement = document.createElement('a');
        previousLink.classList.add('tooltip');
        previousLink.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24">' +
            '<path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg>' +
            '<span class="tooltiptext topTooltip">Previous Page</span>';
        previousLink.addEventListener('click', () => {
            this.previousPage();
        });
        this.statusArea.appendChild(previousLink);

        let pageLabel: HTMLLabelElement = document.createElement('label');
        pageLabel.innerText = 'Page';
        pageLabel.setAttribute('for', 'page' + this.projectId);
        pageLabel.style.marginLeft = '10px';
        pageLabel.style.marginTop = '4px';
        this.statusArea.appendChild(pageLabel);

        let pageDiv: HTMLDivElement = document.createElement('div');
        pageDiv.classList.add('tooltip');
        this.statusArea.appendChild(pageDiv);

        let pageInput: HTMLInputElement = document.createElement('input');
        pageInput.id = 'page' + this.projectId;
        pageInput.type = 'number';
        pageInput.style.marginLeft = '10px';
        pageInput.style.marginTop = '4px';
        pageInput.style.width = '50px';
        pageInput.value = '0';
        pageInput.addEventListener('change', () => {
            let page = Number.parseInt(pageInput.value);
            if (page >= 0 && page <= this.maxPage) {
                this.currentPage = page;
                this.getSegments();
            }
        });
        pageDiv.appendChild(pageInput);
        pageDiv.insertAdjacentHTML('beforeend', '<span class="tooltiptext topTooltip">Enter page number and press ENTER</span>');

        let ofSpan: HTMLSpanElement = document.createElement('span');
        ofSpan.innerText = 'of'
        ofSpan.style.marginLeft = '10px';
        ofSpan.style.marginTop = '4px';
        this.statusArea.appendChild(ofSpan);

        this.pagesSpan = document.createElement('span');
        this.pagesSpan.innerText = 'of'
        this.pagesSpan.style.marginLeft = '10px';
        this.pagesSpan.style.marginTop = '4px';
        this.pagesSpan.innerText = '0';
        this.statusArea.appendChild(this.pagesSpan);

        let nextLink: HTMLAnchorElement = document.createElement('a');
        nextLink.classList.add('tooltip');
        nextLink.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24">' +
            '<path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg>' +
            '<span class="tooltiptext topTooltip">Next Page</span>';
        nextLink.addEventListener('click', () => {
            this.nextPage();
        });
        this.statusArea.appendChild(nextLink);

        let lastLink: HTMLAnchorElement = document.createElement('a');
        lastLink.classList.add('tooltip');
        lastLink.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24">' +
            '<path d="M5.59 7.41L10.18 12l-4.59 4.59L7 18l6-6-6-6zM16 6h2v12h-2z" /></svg>' +
            '<span class="tooltiptext topTooltip">Last Page</span>';
        lastLink.addEventListener('click', () => {
            this.lastPage();
        });
        this.statusArea.appendChild(lastLink);

        let rowsLabel: HTMLLabelElement = document.createElement('label');
        rowsLabel.innerText = 'Rows/Page';
        rowsLabel.setAttribute('for', 'rows_page' + this.projectId);
        rowsLabel.style.marginLeft = '10px';
        rowsLabel.style.marginTop = '4px';
        this.statusArea.appendChild(rowsLabel);

        let rowDiv = document.createElement('div');
        rowDiv.classList.add('tooltip');
        this.statusArea.appendChild(rowDiv);

        let rowsInput: HTMLInputElement = document.createElement('input');
        rowsInput.id = 'rows_page' + this.projectId;
        rowsInput.type = 'number';
        rowsInput.style.marginLeft = '10px';
        rowsInput.style.marginTop = '4px';
        rowsInput.style.width = '50px';
        rowsInput.value = '500';
        rowsInput.addEventListener('change', () => {
            this.rowsPage = Number.parseInt(rowsInput.value);
            this.firstPage();
        });
        rowDiv.appendChild(rowsInput);
        rowDiv.insertAdjacentHTML('beforeend', '<span class="tooltiptext topTooltip">Enter number of rows/page and press ENTER</span>');

        let config: any = { attributes: true, childList: false, subtree: false };
        let observer = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    tableContainer.style.height = (this.translationArea.clientHeight - 34) + 'px';
                    tableContainer.style.width = this.translationArea.clientWidth + 'px';
                    this.sourceTh.style.minWidth = (this.translationArea.clientWidth * 0.4) + 'px';
                    this.targetTh.style.minWidth = (this.translationArea.clientWidth * 0.4) + 'px';
                }
            }
        });
        observer.observe(this.translationArea, config);
    }

    buildRightSide(): void {
        let horizontalSplit: ThreeHorizontalPanels = new ThreeHorizontalPanels(this.rightPanel);

        this.memoryArea = horizontalSplit.topPanel();
        let memoryTitle: HTMLDivElement = document.createElement('div');
        memoryTitle.classList.add('titlepanel');
        memoryTitle.innerText = 'Translation Memory';
        this.memoryArea.appendChild(memoryTitle);

        this.machineArea = horizontalSplit.centerPanel();
        let machineTitle: HTMLDivElement = document.createElement('div');
        machineTitle.classList.add('titlepanel');
        machineTitle.innerText = 'Machine Translation';
        this.machineArea.appendChild(machineTitle);

        this.termsArea = horizontalSplit.bottomPanel();
        let termsTitle: HTMLDivElement = document.createElement('div');
        termsTitle.classList.add('titlepanel');
        termsTitle.innerText = 'Terms';
        this.termsArea.appendChild(termsTitle);
    }

    generateStatistics(): void {
        // TODO
    }

    setSegments(arg: any): void {
        this.tbody.innerHTML = '';
        let length = arg.length;
        for (let i = 0; i < length; i++) {
            this.tbody.insertAdjacentHTML('beforeend', arg[i]);
        }
        let rows: HTMLCollectionOf<HTMLTableRowElement> = this.tbody.getElementsByTagName('tr');
        length = rows.length;
        for (let i = 0; i < rows.length; i++) {
            let row: HTMLTableRowElement = rows[i];
            row.addEventListener('click', (event: MouseEvent) => this.rowClickListener(event));
        }
    }

    firstPage(): void {
        this.currentPage = 0;
        this.getSegments();
    }

    previousPage(): void {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.getSegments();
        }
    }

    nextPage(): void {
        if (this.currentPage < this.maxPage) {
            this.currentPage++;
            this.getSegments();
        }
    }

    lastPage(): void {
        this.currentPage = this.maxPage;
        this.getSegments();
    }

    rowClickListener(event: MouseEvent): void {

        var element: Element = event.target as Element;
        var x: string = element.tagName;

        if (x === 'TEXTAREA') {
            // already editing
            return;
        }

        if (this.textArea !== undefined) {
            this.saveEdit();
        }

        let row: HTMLTableRowElement = event.currentTarget as HTMLTableRowElement;
        this.currentId = row.id;
        this.currentCell = row.getElementsByClassName('target')[0] as HTMLTableCellElement;
        this.currentContent = this.currentCell.innerHTML;
        this.textArea = document.createElement('textarea');
        this.textArea.lang = this.currentCell.lang;
        this.textArea.style.height = (this.currentCell.clientHeight - 8) + 'px';
        this.textArea.style.width = (this.currentCell.clientWidth - 8) + 'px';
        this.textArea.value = this.currentContent;
        this.currentCell.setAttribute('style', 'padding: 0px;');
        this.currentCell.innerHTML = '';
        this.currentCell.appendChild(this.textArea);
        this.textArea.focus();
    }

    saveEdit(): void {
        if (this.textArea !== undefined) {
            let text: string = this.textArea.value;
            this.currentCell.innerText = text;
            this.textArea = undefined;
            // TODO send to server
        }
    }
}