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

    static SVG_BLANK: string = "<svg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 0 24 24' width='24'></svg>";
    static SVG_TRANSLATED: string = "<svg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 0 24 24' width='24'><g><g><path d='M19,5v14H5V5H19 M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3L19,3z'/></g><path d='M14,17H7v-2h7V17z M17,13H7v-2h10V13z M17,9H7V7h10V9z'/></g></svg>";
    static SVG_FINAL: string = "<svg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 0 24 24' width='24'><path d='M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM17.99 9l-1.41-1.42-6.59 6.59-2.58-2.57-1.42 1.41 4 3.99z'/></svg>";
    static SVG_LOCK: string = "<svg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 0 24 24' width='24'><path d='M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z'/></svg>";

    container: HTMLDivElement;
    observer: MutationObserver;
    rowsObserver: MutationObserver;

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
    private tbody: HTMLTableSectionElement;
    sourceTh: HTMLTableCellElement;
    targetTh: HTMLTableCellElement;

    pagesSpan: HTMLSpanElement;

    maxPage: number;
    pageInput: HTMLInputElement;
    currentPage: number = 0;
    rowsPage: number = 500;
    maxRows: number;
    segmentsCount: number;

    currentCell: HTMLTableCellElement;
    currentState: HTMLTableCellElement;
    currentTranslate: HTMLTableCellElement;
    currentContent: string;
    currentId: any;
    currentTags: string[] = [];

    tmMatches: TmMatches;

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

        let saveEdit = document.createElement('a');
        saveEdit.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Save Changes</span>';
        saveEdit.className = 'tooltip';
        saveEdit.style.marginLeft = '20px';
        saveEdit.addEventListener('click', () => {
            this.saveEdit(false);
        });
        topBar.appendChild(saveEdit);

        let cancelEdit = document.createElement('a');
        cancelEdit.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.59-13L12 10.59 8.41 7 7 8.41 10.59 12 7 15.59 8.41 17 12 13.41 15.59 17 17 15.59 13.41 12 17 8.41z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Discard Changes</span>';
        cancelEdit.className = 'tooltip';
        cancelEdit.addEventListener('click', () => {
            this.cancelEdit();
        });
        topBar.appendChild(cancelEdit);


        let confirmEdit = document.createElement('a');
        confirmEdit.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Confirm Translation</span>';
        confirmEdit.className = 'tooltip';
        confirmEdit.style.marginLeft = '20px';
        confirmEdit.addEventListener('click', () => {
            this.saveEdit(true);
        });
        topBar.appendChild(confirmEdit);


        let statisticsButton = document.createElement('a');
        statisticsButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2.5 2.1h-15V5h15v14.1zm0-16.1h-15c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Project Statistics</span>';
        statisticsButton.className = 'tooltip';
        statisticsButton.style.marginLeft = '20px';
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

        this.electron.ipcRenderer.on('set-segments-count', (event: Electron.IpcRendererEvent, arg: any) => {
            if (arg.project === this.projectId) {
                this.setSegmentsCount(arg.count);
            }
        });
        this.electron.ipcRenderer.on('set-segments', (event: Electron.IpcRendererEvent, arg: any) => {
            if (arg.project === this.projectId) {
                this.setSegments(arg.segments);
            }
        });

        this.watchSizes();

        setTimeout(() => {
            this.setSize();
        }, 200);

        this.electron.ipcRenderer.send('get-segments-count', { project: this.projectId });
    }

    close(): void {
        this.rowsObserver.disconnect();
        this.observer.disconnect();
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
        this.observer = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    this.setSize();
                }
            }
        });
        this.observer.observe(targetNode, config);
    }

    exportTranslations() {
        this.electron.ipcRenderer.send('export-translations', { project: this.projectId });
    }

    setSegmentsCount(count: number): void {

        this.segmentsCount = count;

        this.maxPage = Math.ceil(this.segmentsCount / this.rowsPage);
        if (this.maxPage * this.rowsPage < this.segmentsCount) {
            this.maxPage++;
        }

        this.pagesSpan.innerText = 'of ' + this.maxPage;
        this.pageInput.value = '1';
        this.getSegments();
    }

    getSegments(): void {
        this.container.classList.add('wait');
        let params: any = {
            project: this.projectId, files: [], start: this.currentPage * this.rowsPage, count: this.rowsPage, filterText: '',
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
        th.innerText = 'Status';
        th.colSpan = 3;
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

        this.pageInput = document.createElement('input');
        this.pageInput.type = 'number';
        this.pageInput.style.marginLeft = '10px';
        this.pageInput.style.marginTop = '4px';
        this.pageInput.style.width = '50px';
        this.pageInput.value = '0';
        this.pageInput.addEventListener('change', () => {
            let page = Number.parseInt(this.pageInput.value);
            if (page >= 0 && page <= this.maxPage) {
                this.currentPage = page;
                this.getSegments();
            }
        });
        pageDiv.appendChild(this.pageInput);
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
        rowsInput.value = '' + this.rowsPage;
        rowsInput.addEventListener('change', () => {
            this.rowsPage = Number.parseInt(rowsInput.value);
            this.maxPage = Math.ceil(this.segmentsCount / this.rowsPage);
            if (this.maxPage * this.rowsPage < this.segmentsCount) {
                this.maxPage++;
            }
            this.pagesSpan.innerText = 'of ' + this.maxPage;
            this.pageInput.value = '1';
            this.firstPage();
        });
        rowDiv.appendChild(rowsInput);
        rowDiv.insertAdjacentHTML('beforeend', '<span class="tooltiptext topTooltip">Enter number of rows/page and press ENTER</span>');

        let config: any = { attributes: true, childList: false, subtree: false };
        this.rowsObserver = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    tableContainer.style.height = (this.translationArea.clientHeight - 34) + 'px';
                    tableContainer.style.width = this.translationArea.clientWidth + 'px';
                    this.sourceTh.style.minWidth = (this.translationArea.clientWidth * 0.4) + 'px';
                    this.targetTh.style.minWidth = (this.translationArea.clientWidth * 0.4) + 'px';
                }
            }
        });
        this.rowsObserver.observe(this.translationArea, config);
    }

    buildRightSide(): void {
        let horizontalSplit: ThreeHorizontalPanels = new ThreeHorizontalPanels(this.rightPanel);

        this.memoryArea = horizontalSplit.topPanel();
        let memoryTitle: HTMLDivElement = document.createElement('div');
        memoryTitle.classList.add('titlepanel');
        memoryTitle.innerText = 'Translation Memory';
        this.memoryArea.appendChild(memoryTitle);
        let matchesContainer = document.createElement('div');
        matchesContainer.classList.add('fill_width');
        this.memoryArea.appendChild(matchesContainer);
        this.tmMatches = new TmMatches(matchesContainer, this.projectId);

        let config: any = { attributes: true, childList: false, subtree: false };
        let observer = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    matchesContainer.style.height = (this.memoryArea.clientHeight - memoryTitle.clientHeight) + 'px';
                }
            }
        });
        observer.observe(this.memoryArea, config);

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

    setSegments(arg: any[]): void {
        this.tbody.innerHTML = '';
        this.tbody.parentElement.scrollTo({ top: 0, left: 0 });
        let length = arg.length;
        for (let i = 0; i < length; i++) {
            let row: any = arg[i];
            let tr: HTMLTableRowElement = document.createElement('tr');
            tr.setAttribute('data-file', row.file);
            tr.setAttribute('data-unit', row.unit);
            tr.setAttribute('data-id', row.segment);
            tr.addEventListener('click', (event: MouseEvent) => this.rowClickListener(event));
            this.tbody.appendChild(tr);

            let td: HTMLTableCellElement = document.createElement('td');
            td.classList.add('middle');
            td.classList.add('center');
            td.classList.add('initial');
            td.innerText = row.index;
            tr.appendChild(td);

            td = document.createElement('td');
            td.classList.add('source');
            td.classList.add('initial');
            if (row.preserve) {
                td.classList.add('preserve');
            }
            td.innerHTML = row.source;
            tr.appendChild(td);

            td = document.createElement('td');
            td.classList.add('middle');
            td.classList.add('center');
            td.classList.add('translate');
            td.innerHTML = row.translate ? TranslationView.SVG_BLANK : TranslationView.SVG_LOCK;
            tr.appendChild(td);

            td = document.createElement('td');
            td.classList.add('middle');
            td.classList.add('center');
            td.classList.add('match');
            td.innerHTML = row.match;
            tr.appendChild(td);

            td = document.createElement('td');
            td.classList.add('middle');
            td.classList.add('state');
            td.classList.add(row.state);
            if (row.state === 'initial') {
                td.innerHTML = TranslationView.SVG_BLANK;
            }
            if (row.state === 'translated') {
                td.innerHTML = TranslationView.SVG_TRANSLATED;
            }
            if (row.state === 'final') {
                td.innerHTML = TranslationView.SVG_FINAL;
            }
            tr.appendChild(td);

            td = document.createElement('td');
            td.classList.add('target');
            if (row.preserve) {
                td.classList.add('preserve');
            }
            td.innerHTML = row.target;
            tr.appendChild(td);
        }
        this.container.classList.remove('wait');
    }

    firstPage(): void {
        this.currentPage = 0;
        this.pageInput.value = '' + (this.currentPage + 1);
        this.getSegments();
    }

    previousPage(): void {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.pageInput.value = '' + (this.currentPage + 1);
            this.getSegments();
        }
    }

    nextPage(): void {
        if (this.currentPage < this.maxPage - 1) {
            this.currentPage++;
            this.pageInput.value = '' + (this.currentPage + 1);
            this.getSegments();
        }
    }

    lastPage(): void {
        this.currentPage = this.maxPage - 1;
        this.pageInput.value = '' + (this.currentPage + 1);
        this.getSegments();
    }

    rowClickListener(event: MouseEvent): void {

        var element: HTMLElement = event.target as HTMLElement;

        var x: string = element.tagName;

        if (x === 'TD' && element.contentEditable === 'true') {
            // already editing clicked cell
            return;
        }
        if (this.currentCell) {
            this.saveEdit(false);
        }
        let row: HTMLTableRowElement = event.currentTarget as HTMLTableRowElement;
        this.currentId = { id: row.getAttribute('data-id'), file: row.getAttribute('data-file'), unit: row.getAttribute('data-unit') };
        let source: HTMLTableCellElement = row.getElementsByClassName('source')[0] as HTMLTableCellElement;
        this.harvestTags(source.innerHTML);

        this.currentCell = row.getElementsByClassName('target')[0] as HTMLTableCellElement;
        this.currentState = row.getElementsByClassName('state')[0] as HTMLTableCellElement;
        this.currentTranslate = row.getElementsByClassName('translate')[0] as HTMLTableCellElement;
        this.currentContent = this.currentCell.innerHTML;
        this.currentCell.contentEditable = 'true';
        this.currentCell.classList.add('editing');

        this.tmMatches.clear();

        this.electron.ipcRenderer.send('get-matches', {
            project: this.projectId,
            file: this.currentId.file,
            unit: this.currentId.unit,
            segment: this.currentId.id
        });

        this.currentCell.focus();
    }

    saveEdit(confirm: boolean): void {
        if (this.currentCell) {
            this.currentCell.classList.remove('editing');
            this.currentCell.contentEditable = 'false';
            let translation = this.currentCell.innerHTML;
            this.currentCell = undefined;

            if (confirm) {
                this.currentState.classList.remove('initial');
                this.currentState.classList.remove('translated');
                this.currentState.classList.add('final');
                this.currentState.innerHTML = TranslationView.SVG_FINAL;
            } else {
                if (translation === '') {
                    if (this.currentState.classList.contains('translated')) {
                        this.currentState.classList.remove('translated');
                        this.currentState.classList.add('initial');
                        this.currentState.innerHTML = TranslationView.SVG_BLANK;
                    }
                } else {
                    if (this.currentState.classList.contains('initial')) {
                        this.currentState.classList.remove('initial');
                        this.currentState.classList.add('translated');
                        this.currentState.innerHTML = TranslationView.SVG_TRANSLATED;
                    }
                }
            }
            if (this.currentContent === translation && !confirm) {
                // nothing changed and not confirming
                return;
            }
            this.electron.ipcRenderer.send('save-translation', {
                project: this.projectId,
                file: this.currentId.file,
                unit: this.currentId.unit,
                segment: this.currentId.id, translation: translation,
                confirm: confirm
            });
        }
    }

    cancelEdit(): void {
        if (this.currentCell) {
            this.currentCell.innerHTML = this.currentContent;
            this.currentCell.classList.remove('editing');
            this.currentCell.contentEditable = 'false';
            this.currentCell = undefined;
        }
    }

    harvestTags(source: string): void {
        var index: number = source.indexOf('<img ');
        var tagNumber: number = 1;
        this.currentTags = [];
        while (index >= 0) {
            let start: string = source.slice(0, index);
            let rest: string = source.slice(index + 1);
            let end: number = rest.indexOf('>');
            let tag: string = '<' + rest.slice(0, end) + '/>';
            this.currentTags.push(tag);
            source = start + '[[' + tagNumber++ + ']]' + rest.slice(end + 1);
            index = source.indexOf('<img ');
        }
    }

    copySource(): void {
        if (this.currentCell) {
            let row = this.currentCell.parentElement;
            let source: HTMLTableCellElement = row.getElementsByClassName('source')[0] as HTMLTableCellElement;
            this.currentCell.innerHTML = source.innerHTML;
        }
    }

    inserTag(arg: any): void {
        let tag: number = arg.tag;
        if (this.currentTags.length >= tag) {
            this.electron.ipcRenderer.send('paste-tag', this.currentTags[tag - 1]);
        }
    }

    autoPropagate(rows: any[]): void {
        let length = rows.length;
        for (let i = 0; i < length; i++) {
            this.updateBody(rows[i]);
        }
    }

    updateBody(data: any): void {
        let rows: HTMLCollectionOf<HTMLTableRowElement> = this.tbody.getElementsByTagName('tr');
        let length = rows.length;
        for (let i = 0; i < length; i++) {
            let row: HTMLTableRowElement = rows[i];
            if (row.getAttribute('data-file') === data.file && row.getAttribute('data-unit') === data.unit
                && row.getAttribute('data-id') === data.segment) {
                (row.getElementsByClassName('target')[0] as HTMLTableCellElement).innerHTML = data.target;
                let state = row.getElementsByClassName('state')[0] as HTMLTableCellElement;
                state.classList.remove('initial');
                state.classList.add('translated');
                state.innerHTML = TranslationView.SVG_TRANSLATED;
            }
        }
    }

    setMatches(matches: any[]): void {
        // TODO
        let lengtyh = matches.length;
        for (let i=0 ; i<lengtyh ; i++) {
            let match = matches[i];
            if (match.type === 'TM') {
                this.tmMatches.add(match);
            }
            if (match.type === 'MT') {
                // TODO
            }
        }
    }
}