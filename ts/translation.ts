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

class SegmentId {
    file: string;
    unit: string;
    id: string;

}

class Segment {
    index: number;
    file: string;
    unit: string;
    segment: string;
    state: string;
    translate: boolean;
    preserve: boolean;
    source: string;
    target: string;
    match: number;
    hasNotes: boolean;
    tagErrors: boolean;
    spaceErrors: boolean;
}

class TranslationView {

    electron = require('electron');

    static SVG_BLANK: string = "<svg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 0 24 24' width='24'></svg>";
    static SVG_UNTRANSLATED: string = "<svg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 0 24 24' width='24'><path d='M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z'/></svg>";
    static SVG_TRANSLATED: string = "<svg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 0 24 24' width='24'><g><path d='M19,5v14H5V5H19 M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3L19,3z'/><path d='M14,17H7v-2h7V17z M17,13H7v-2h10V13z M17,9H7V7h10V9z'/></g></svg>";
    static SVG_FINAL: string = "<svg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 0 24 24' width='24'><path d='M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM17.99 9l-1.41-1.42-6.59 6.59-2.58-2.57-1.42 1.41 4 3.99z'/></svg>";
    static SVG_LOCK: string = "<svg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 0 24 24' width='24'><path d='M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z'/></svg>";
    static SVG_WARNING: string = "<svg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 0 24 24' width='24'><path d='M11 15h2v2h-2v-2zm0-8h2v6h-2V7zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z'/></svg>";
    static SVG_NOTE: string = "<svg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 0 24 24' width='24'><path d='M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17l-.59.59-.58.58V4h16v12zm-9-4h2v2h-2zm0-6h2v4h-2z'/></svg>";

    static LOCK_SPAN: string = "<span class='iconTooltip'>" + this.SVG_LOCK + " <small class='tooltiptext'>Locked segment</small></span>";
    static FINAL_SPAN: string = "<span class='iconTooltip'>" + this.SVG_FINAL + " <small class='tooltiptext'>Confirmed</small></span>";
    static TRANSLATED_SPAN: string = "<span class='iconTooltip'>" + this.SVG_TRANSLATED + " <small class='tooltiptext'>Draft</small></span>";
    static NOTES_SPAN: string = "<span class='iconTooltip'>" + this.SVG_NOTE + " <small class='tooltiptext'>Segment has notes</small></span>";
    static SPACE_WARNING: string = "<span class='iconTooltip'>" + this.SVG_WARNING + " <small class='tooltiptext'>Space errors</small></span>";
    static TAG_WARNING: string = "<span class='iconTooltip'>" + this.SVG_WARNING + " <small class='tooltiptext'>Tag errors</small></span>";
    static SPACE_TAG_WARNING: string = "<span class='iconTooltip'>" + this.SVG_WARNING + " <small class='tooltiptext'>Tag and space errors</small></span>";

    static LOCK_FRAGMENT: string = 'M18 8h-1V6c0-2.76-2';
    static NOTE_FRAGMENT: string = 'M20 2H4c-1.1 0-1.99';

    container: HTMLDivElement;
    topBar: HTMLDivElement;
    observer: MutationObserver;
    rowsObserver: MutationObserver;

    mainArea: HTMLDivElement;
    translationArea: HTMLDivElement;
    rightPanel: HTMLDivElement;
    segmentsArea: HTMLDivElement;
    memoryArea: HTMLDivElement;
    machineArea: HTMLDivElement;
    termsArea: HTMLDivElement;
    statusArea: HTMLDivElement;

    projectId: string;
    srcLang: string;
    tgtLang: string;
    tbody: HTMLTableSectionElement;
    numberTh: HTMLTableCellElement;
    sourceTh: HTMLTableCellElement;
    translateTh: HTMLTableCellElement;
    matchTh: HTMLTableCellElement;
    finalTh: HTMLTableCellElement;
    targetTh: HTMLTableCellElement;

    zoom: number = 1.0;

    pagesSpan: HTMLSpanElement;

    maxPage: number;
    pageInput: HTMLInputElement;
    currentPage: number = 0;
    rowsPage: number = 500;
    maxRows: number;
    segmentsCount: number;
    statistics: HTMLDivElement;

    currentRow: HTMLTableRowElement;
    currentCell: HTMLTableCellElement;
    currentState: HTMLTableCellElement;
    currentTranslate: HTMLTableCellElement;
    currentContent: string;
    currentId: SegmentId = { id: '', file: '', unit: '' };
    sourceTags: Map<string, string>;

    filterButton: HTMLAnchorElement;
    sortButton: HTMLAnchorElement;
    filterText: string = '';
    filterLanguage: string = 'source';
    caseSensitiveFilter: boolean = false;
    regExp: boolean = false;
    showUntranslated: boolean = true;
    showTranslated: boolean = true;
    showConfirmed: boolean = true;

    sortOption: string = 'none';
    sortDesc: boolean = false;

    tmMatches: TmMatches;
    mtMatches: MtMatches;
    termsPanel: TermsPanel;

    memSelect: HTMLSelectElement;
    glossSelect: HTMLSelectElement;

    returnTo: SegmentId = { file: '', unit: '', id: '' };
    returnNumber: number = -1;

    notesVisible: boolean = false;

    constructor(tab: Tab, projectId: string, sourceLang: string, targetLang: string, rows: number) {
        this.container = tab.getContainer();
        this.projectId = projectId;
        this.srcLang = sourceLang;
        this.tgtLang = targetLang;
        this.rowsPage = rows;

        this.sourceTags = new Map<string, string>();
        this.topBar = document.createElement('div');
        this.topBar.className = 'toolbar';
        this.container.appendChild(this.topBar);

        this.buildTopBar();

        this.mainArea = document.createElement('div');
        this.mainArea.id = 'main' + projectId;
        this.mainArea.style.display = 'flex';
        this.container.appendChild(this.mainArea);

        let verticalPanels: VerticalSplit = new VerticalSplit(this.mainArea);
        verticalPanels.setWeights([75, 25]);

        this.translationArea = verticalPanels.leftPanel();
        this.translationArea.style.height = '100%';

        this.rightPanel = verticalPanels.rightPanel();

        this.container.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.key === 'PageDown' && !(event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                this.gotoNext();
            }
            if (event.key === 'PageUp' && !(event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                this.gotoPrevious();
            }
            if (event.key === 'PageDown' && (event.ctrlKey || event.metaKey) && !event.shiftKey) {
                event.preventDefault();
                this.nextPage();
            }
            if (event.key === 'PageUp' && (event.ctrlKey || event.metaKey) && !event.shiftKey) {
                event.preventDefault();
                this.previousPage();
            }
            if (event.key === 'PageDown' && (event.ctrlKey || event.metaKey) && event.shiftKey) {
                event.preventDefault();
                this.lastPage();
            }
            if (event.key === 'PageUp' && (event.ctrlKey || event.metaKey) && event.shiftKey) {
                event.preventDefault();
                this.firstPage();
            }
            if ((event.ctrlKey || event.metaKey) && (event.key === 'b' || event.key === 'B')) {
                event.preventDefault();
                this.addTerm();
            }
            if ((event.ctrlKey || event.metaKey) && (event.key === 'u' || event.key === 'U') && !event.shiftKey) {
                event.preventDefault();
                this.nextUntranslated();
            }
            if ((event.ctrlKey || event.metaKey) && (event.key === 'u' || event.key === 'U') && event.shiftKey) {
                event.preventDefault();
                this.nextUnconfirmed();
            }

            // Insert tags with numeric keypad
            if (event.code === 'Numpad1' && (event.ctrlKey || event.metaKey) && !event.altKey) {
                event.preventDefault();
                this.insertTag({ tag: 1 });
            }
            if (event.code === 'Numpad2' && (event.ctrlKey || event.metaKey) && !event.altKey) {
                event.preventDefault();
                this.insertTag({ tag: 2 });
            }
            if (event.code === 'Numpad3' && (event.ctrlKey || event.metaKey) && !event.altKey) {
                event.preventDefault();
                this.insertTag({ tag: 3 });
            }
            if (event.code === 'Numpad4' && (event.ctrlKey || event.metaKey) && !event.altKey) {
                event.preventDefault();
                this.insertTag({ tag: 4 });
            }
            if (event.code === 'Numpad5' && (event.ctrlKey || event.metaKey) && !event.altKey) {
                event.preventDefault();
                this.insertTag({ tag: 5 });
            }
            if (event.code === 'Numpad6' && (event.ctrlKey || event.metaKey) && !event.altKey) {
                event.preventDefault();
                this.insertTag({ tag: 6 });
            }
            if (event.code === 'Numpad7' && (event.ctrlKey || event.metaKey) && !event.altKey) {
                event.preventDefault();
                this.insertTag({ tag: 7 });
            }
            if (event.code === 'Numpad8' && (event.ctrlKey || event.metaKey) && !event.altKey) {
                event.preventDefault();
                this.insertTag({ tag: 8 });
            }
            if (event.code === 'Numpad9' && (event.ctrlKey || event.metaKey) && !event.altKey) {
                event.preventDefault();
                this.insertTag({ tag: 9 });
            }
            if (event.code === 'Numpad0' && (event.ctrlKey || event.metaKey) && !event.altKey) {
                event.preventDefault();
                this.insertTag({ tag: 10 });
            }
            // Insert terms with numeric keypad
            if (event.code === 'Numpad1' && (event.ctrlKey || event.metaKey) && event.altKey) {
                event.preventDefault();
                this.insertTerm({ term: 1 });
            }
            if (event.code === 'Numpad2' && (event.ctrlKey || event.metaKey) && event.altKey) {
                event.preventDefault();
                this.insertTerm({ term: 2 });
            }
            if (event.code === 'Numpad3' && (event.ctrlKey || event.metaKey) && event.altKey) {
                event.preventDefault();
                this.insertTerm({ term: 3 });
            }
            if (event.code === 'Numpad4' && (event.ctrlKey || event.metaKey) && event.altKey) {
                event.preventDefault();
                this.insertTerm({ term: 4 });
            }
            if (event.code === 'Numpad5' && (event.ctrlKey || event.metaKey) && event.altKey) {
                event.preventDefault();
                this.insertTerm({ term: 5 });
            }
            if (event.code === 'Numpad6' && (event.ctrlKey || event.metaKey) && event.altKey) {
                event.preventDefault();
                this.insertTerm({ term: 6 });
            }
            if (event.code === 'Numpad7' && (event.ctrlKey || event.metaKey) && event.altKey) {
                event.preventDefault();
                this.insertTerm({ term: 7 });
            }
            if (event.code === 'Numpad8' && (event.ctrlKey || event.metaKey) && event.altKey) {
                event.preventDefault();
                this.insertTerm({ term: 8 });
            }
            if (event.code === 'Numpad9' && (event.ctrlKey || event.metaKey) && event.altKey) {
                event.preventDefault();
                this.insertTerm({ term: 9 });
            }
            if (event.code === 'Numpad0' && (event.ctrlKey || event.metaKey) && event.altKey) {
                event.preventDefault();
                this.insertTerm({ term: 10 });
            }
        });

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
        this.electron.ipcRenderer.on('count-changed', (event: Electron.IpcRendererEvent, arg: any) => {
            if (arg.project === this.projectId) {
                this.electron.ipcRenderer.send('get-segments-count', { project: this.projectId });
            }
        });
        this.watchSizes();

        setTimeout(() => {
            this.setSize();
        }, 200);

        this.electron.ipcRenderer.send('get-segments-count', { project: this.projectId });
        this.electron.ipcRenderer.send('get-project-memories', { project: this.projectId });
        this.electron.ipcRenderer.send('get-project-glossaries', { project: this.projectId });
        this.electron.ipcRenderer.on('request-memories', () => {
            this.electron.ipcRenderer.send('get-project-memories', { project: this.projectId });
        });
        this.electron.ipcRenderer.on('request-glossaries', () => {
            this.electron.ipcRenderer.send('get-project-glossaries', { project: this.projectId });
        });
        this.electron.ipcRenderer.send('get-zoom');
        this.electron.ipcRenderer.on('set-zoom', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setZoom(arg.zoom);
        });
        this.setSpellChecker();
    }

    setZoom(zoom: string): void {
        this.zoom = Number.parseFloat(zoom);
        let style: HTMLStyleElement = document.getElementById('zoom') as HTMLStyleElement;
        if (!style) {
            style = document.createElement('style');
            style.id = 'zoom';
            document.head.appendChild(style);
        }
        style.innerHTML = '.zoomable td { font-size: ' + zoom + 'em; } .zoom { font-size: ' + zoom + 'em; } .match { width: ' + (40 * this.zoom) + 'px; }';
        this.setColumnWidths();
    }

    buildTopBar(): void {
        let exportTranslations: HTMLAnchorElement = document.createElement('a');
        exportTranslations.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Export Translations</span>';
        exportTranslations.className = 'tooltip';
        exportTranslations.addEventListener('click', () => {
            this.exportTranslations();
        });
        this.topBar.appendChild(exportTranslations);

        let saveButton: HTMLAnchorElement = document.createElement('a');
        saveButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Save Changes</span>';
        saveButton.className = 'tooltip';
        saveButton.style.marginLeft = '20px';
        saveButton.addEventListener('click', () => {
            this.saveEdit({ confirm: false, next: 'none' });
        });
        this.topBar.appendChild(saveButton);

        let cancelEdit: HTMLAnchorElement = document.createElement('a');
        cancelEdit.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.59-13L12 10.59 8.41 7 7 8.41 10.59 12 7 15.59 8.41 17 12 13.41 15.59 17 17 15.59 13.41 12 17 8.41z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Discard Changes</span>';
        cancelEdit.className = 'tooltip';
        cancelEdit.addEventListener('click', () => {
            this.cancelEdit();
        });
        this.topBar.appendChild(cancelEdit);

        let confirmEdit: HTMLAnchorElement = document.createElement('a');
        confirmEdit.innerHTML = TranslationView.SVG_FINAL +
            '<span class="tooltiptext bottomTooltip">Confirm Translation</span>';
        confirmEdit.className = 'tooltip';
        confirmEdit.style.marginLeft = '20px';
        confirmEdit.addEventListener('click', () => {
            this.saveEdit({ confirm: true, next: 'none' });
        });
        this.topBar.appendChild(confirmEdit);

        let confirmNextUntranslated: HTMLAnchorElement = document.createElement('a');
        confirmNextUntranslated.innerHTML = TranslationView.SVG_UNTRANSLATED +
            '<span class="tooltiptext bottomTooltip">Confirm and go to Next Untranslated</span>';
        confirmNextUntranslated.className = 'tooltip';
        confirmNextUntranslated.addEventListener('click', () => {
            this.saveEdit({ confirm: true, next: 'untranslated' });
        });
        this.topBar.appendChild(confirmNextUntranslated);

        let confirmNextUnconfirmed: HTMLAnchorElement = document.createElement('a');
        confirmNextUnconfirmed.innerHTML = TranslationView.SVG_TRANSLATED +
            '<span class="tooltiptext bottomTooltip">Confirm and go to Next Uncornfirmed</span>';
        confirmNextUnconfirmed.className = 'tooltip';
        confirmNextUnconfirmed.addEventListener('click', () => {
            this.saveEdit({ confirm: true, next: 'unconfirmed' });
        });
        this.topBar.appendChild(confirmNextUnconfirmed);

        let goToLink: HTMLAnchorElement = document.createElement('a');
        goToLink.style.marginLeft = '10px';
        goToLink.classList.add('tooltip');
        goToLink.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M17.27 6.73l-4.24 10.13-1.32-3.42-.32-.83-.82-.32-3.43-1.33 10.13-4.23M21 3L3 10.53v.98l6.84 2.65L12.48 21h.98L21 3z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Go To Segment...</span>';
        goToLink.addEventListener('click', () => {
            this.electron.ipcRenderer.send('show-go-to-window');
        });
        this.topBar.appendChild(goToLink);

        let splitButton: HTMLAnchorElement = document.createElement('a');
        splitButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M8 19h3v4h2v-4h3l-4-4-4 4zm8-14h-3V1h-2v4H8l4 4 4-4zM4 11v2h16v-2H4z" /></svg>' +
            '<span class="tooltiptext bottomTooltip">Split Segment</span>';
        splitButton.className = 'tooltip';
        splitButton.style.marginLeft = '20px';
        splitButton.addEventListener('click', () => {
            this.splitSegment();
        });
        this.topBar.appendChild(splitButton);

        let mergeButton: HTMLAnchorElement = document.createElement('a');
        mergeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M16 13h-3V3h-2v10H8l4 4 4-4zM4 19v2h16v-2H4z" /></svg>' +
            '<span class="tooltiptext bottomTooltip">Merge With Next Segment</span>';
        mergeButton.className = 'tooltip';
        mergeButton.addEventListener('click', () => {
            this.mergeNext();
        });
        this.topBar.appendChild(mergeButton);

        this.sortButton = document.createElement('a');
        this.sortButton.innerHTML = '<svg version="1.1" viewBox="0 0 24 24" height="24" width="24"><path style="stroke-width:0.1" d="m 8.666667,10.444444 v 3.111112 H 12 L 7,19 2,13.555556 H 5.333333 V 10.444444 H 2 L 7,5 12,10.444444 Z M 22,14.333333 h -8.333333 v 1.555556 H 22 Z M 22,19 H 13.666667 V 17.444444 H 22 Z m 0,-6.222222 H 13.666667 V 11.222222 H 22 Z M 22,9.6666667 H 13.666667 V 8.1111111 H 22 Z M 22,6.5555556 H 13.666667 V 5 H 22 Z" /></svg>' +
            '<span class="tooltiptext bottomTooltip">Sort Segments</span>';
        this.sortButton.className = 'tooltip';
        this.sortButton.style.marginLeft = '20px';
        this.sortButton.addEventListener('click', () => {
            this.sortSegments();
        });
        this.topBar.appendChild(this.sortButton);

        this.filterButton = document.createElement('a');
        this.filterButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 24 24" height="24" width="24"><path style="stroke-width:0.1" d="M 18.091348,3.6666667 11.913044,14.119167 v 4.936666 l -0.826087,-0.5 V 14.119167 L 4.9086522,3.6666667 Z M 21,2 H 2 L 9.4347826,14.578333 V 19.5 L 13.565217,22 v -7.421667 z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Filter Segments</span>';
        this.filterButton.className = 'tooltip';
        this.filterButton.addEventListener('click', () => {
            this.filterSegments();
        });
        this.topBar.appendChild(this.filterButton);

        let replaceText: HTMLAnchorElement = document.createElement('a');
        replaceText.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M11 6c1.38 0 2.63.56 3.54 1.46L12 10h6V4l-2.05 2.05C14.68 4.78 12.93 4 11 4c-3.53 0-6.43 2.61-6.92 6H6.1c.46-2.28 2.48-4 4.9-4zm5.64 9.14c.66-.9 1.12-1.97 1.28-3.14H15.9c-.46 2.28-2.48 4-4.9 4-1.38 0-2.63-.56-3.54-1.46L10 12H4v6l2.05-2.05C7.32 17.22 9.07 18 11 18c1.55 0 2.98-.51 4.14-1.36L20 21.49 21.49 20l-4.85-4.86z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Replace Text</span>';
        replaceText.className = 'tooltip';
        replaceText.addEventListener('click', () => {
            this.replaceText();
        });
        this.topBar.appendChild(replaceText);

        let statisticsButton: HTMLAnchorElement = document.createElement('a');
        statisticsButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2.5 2.1h-15V5h15v14.1zm0-16.1h-15c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Project Statistics</span>';
        statisticsButton.className = 'tooltip';
        statisticsButton.style.marginLeft = '20px';
        statisticsButton.addEventListener('click', () => {
            this.generateStatistics();
        });
        this.topBar.appendChild(statisticsButton);

        let htmlExportButton: HTMLAnchorElement = document.createElement('a');
        htmlExportButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24" viewBox="0 0 24 24" width="24"><path d="M19,3H5C3.89,3,3,3.9,3,5v14c0,1.1,0.89,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.11,3,19,3z M19,19H5V7h14V19z M17,12H7v-2 h10V12z M13,16H7v-2h6V16z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Export HTML</span>';
        htmlExportButton.className = 'tooltip';
        htmlExportButton.addEventListener('click', () => {
            this.exportHTML();
        });
        this.topBar.appendChild(htmlExportButton);

        let concordanceButton: HTMLAnchorElement = document.createElement('a');
        concordanceButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M21.172 24l-7.387-7.387c-1.388.874-3.024 1.387-4.785 1.387-4.971 0-9-4.029-9-9s4.029-9 9-9 9 4.029 9 9c0 1.761-.514 3.398-1.387 4.785l7.387 7.387-2.828 2.828zm-12.172-8c3.859 0 7-3.14 7-7s-3.141-7-7-7-7 3.14-7 7 3.141 7 7 7z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Concordance Search</span>';
        concordanceButton.className = 'tooltip';
        concordanceButton.style.marginLeft = '20px';
        concordanceButton.addEventListener('click', () => {
            this.concordanceSearch();
        });
        this.topBar.appendChild(concordanceButton);

        let notesButton: HTMLAnchorElement = document.createElement('a');
        notesButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17l-.59.59-.58.58V4h16v12zM6 12h2v2H6zm0-3h2v2H6zm0-3h2v2H6zm4 6h5v2h-5zm0-3h8v2h-8zm0-3h8v2h-8z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Show/Hide Notes</span>';
        notesButton.className = 'tooltip';
        notesButton.style.marginLeft = '20px';
        notesButton.addEventListener('click', () => {
            this.showNotes();
        });
        this.topBar.appendChild(notesButton);

        let addTermButton: HTMLAnchorElement = document.createElement('a');
        addTermButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Add Term to Glossary</span>';
        addTermButton.className = 'tooltip';
        addTermButton.style.marginLeft = '20px';
        addTermButton.addEventListener('click', () => {
            this.addTerm();
        });
        this.topBar.appendChild(addTermButton);

        let termSearchButton: HTMLAnchorElement = document.createElement('a');
        termSearchButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M13 8h-8v-1h8v1zm0 2h-8v-1h8v1zm-3 2h-5v-1h5v1zm11.172 12l-7.387-7.387c-1.388.874-3.024 1.387-4.785 1.387-4.971 0-9-4.029-9-9s4.029-9 9-9 9 4.029 9 9c0 1.761-.514 3.398-1.387 4.785l7.387 7.387-2.828 2.828zm-12.172-8c3.859 0 7-3.14 7-7s-3.141-7-7-7-7 3.14-7 7 3.141 7 7 7z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Search Term in Glossary</span>';
        termSearchButton.className = 'tooltip';
        termSearchButton.addEventListener('click', () => {
            this.searchTerm();
        });
        this.topBar.appendChild(termSearchButton);

        let tagsAnalysisButton: HTMLAnchorElement = document.createElement('a');
        tagsAnalysisButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-7-2h2V7h-4v2h2z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Check Inline Tags</span>';
        tagsAnalysisButton.className = 'tooltip';
        tagsAnalysisButton.style.marginLeft = '20px';
        tagsAnalysisButton.addEventListener('click', () => {
            Main.electron.ipcRenderer.send('analyze-tags', this.projectId);
        });
        this.topBar.appendChild(tagsAnalysisButton);

        let spaceAnalysisButton: HTMLAnchorElement = document.createElement('a');
        spaceAnalysisButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M3 21h18v-2H3v2zM3 8v8l4-4-4-4zm8 9h10v-2H11v2zM3 3v2h18V3H3zm8 6h10V7H11v2zm0 4h10v-2H11v2z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Check Initial/Trailing Spaces</span>';
        spaceAnalysisButton.className = 'tooltip';
        spaceAnalysisButton.addEventListener('click', () => {
            Main.electron.ipcRenderer.send('analyze-spaces', this.projectId);
        });
        this.topBar.appendChild(spaceAnalysisButton);

        let filler: HTMLSpanElement = document.createElement('span');
        filler.innerHTML = '&nbsp;';
        filler.className = 'fill_width';
        this.topBar.appendChild(filler);

        let memLabel: HTMLLabelElement = document.createElement('label');
        memLabel.style.marginTop = '4px';
        memLabel.innerHTML = 'Memory';
        memLabel.setAttribute('for', 'memSelect' + this.projectId);
        this.topBar.appendChild(memLabel);

        this.memSelect = document.createElement('select');
        this.memSelect.id = 'memSelect' + this.projectId;
        this.memSelect.style.marginTop = '4px';
        this.memSelect.style.minWidth = '180px';
        this.memSelect.addEventListener('change', () => {
            this.electron.ipcRenderer.send('set-project-memory', { project: this.projectId, memory: this.memSelect.value });
        });
        this.topBar.appendChild(this.memSelect);

        let requestTranslation: HTMLAnchorElement = document.createElement('a');
        requestTranslation.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M21 21h-1.713l-.658-1.846h-3l-.663 1.846h-1.659l3.04-8h1.603l3.05 8zm-2.814-3.12l-1.049-3.018-1.054 3.018h2.103zm-9.464-12.037l.125-.562-1.02-.199-.101.464c-.345-.05-.712-.057-1.083-.019.009-.249.023-.494.045-.728h1.141v-.966h-1.004c.049-.246.092-.394.134-.533l-.997-.3c-.072.245-.134.484-.195.833h-1.138v.966h1.014c-.027.312-.043.637-.048.964-1.119.411-1.595 1.195-1.595 1.905 0 .84.663 1.578 1.709 1.482 1.301-.118 2.169-1.1 2.679-2.308.525.303.746.814.548 1.286-.185.436-.725.852-1.757.831v1.041c1.146.018 2.272-.417 2.715-1.469.431-1.028-.062-2.151-1.172-2.688zm-1.342.71c-.162.36-.375.717-.648.998-.041-.3-.07-.628-.086-.978.249-.032.499-.038.734-.02zm-1.758.336c.028.44.078.844.148 1.205-.927.169-.963-.744-.148-1.205zm15.378 5.111c.552 0 1 .449 1 1v8c0 .551-.448 1-1 1h-8c-.552 0-1-.449-1-1v-8c0-.551.448-1 1-1h8zm0-2h-8c-1.656 0-3 1.343-3 3v8c0 1.657 1.344 3 3 3h8c1.657 0 3-1.343 3-3v-8c0-1.657-1.343-3-3-3zm-13 3c0-.342.035-.677.102-1h-5.102c-.552 0-1-.449-1-1v-8c0-.551.448-1 1-1h8c.552 0 1 .449 1 1v5.101c.323-.066.657-.101 1-.101h1v-5c0-1.657-1.343-3-3-3h-8c-1.656 0-3 1.343-3 3v8c0 1.657 1.344 3 3 3h5v-1z"/></svg>' +
            '<span class="tooltiptext bottomCenterTooltip">Apply Translation Memory to All Segments</span>';
        requestTranslation.className = 'tooltip';
        requestTranslation.style.marginLeft = '4px';
        requestTranslation.addEventListener('click', () => {
            this.applyTranslationMemoryAll();
        });
        this.topBar.appendChild(requestTranslation);

        let glossLabel: HTMLLabelElement = document.createElement('label');
        glossLabel.style.marginLeft = '20px';
        glossLabel.style.marginTop = '4px';
        glossLabel.innerHTML = 'Glossary';
        glossLabel.setAttribute('for', 'glossSelect' + this.projectId);
        this.topBar.appendChild(glossLabel);

        this.glossSelect = document.createElement('select');
        this.glossSelect.id = 'glossSelect' + this.projectId;
        this.glossSelect.style.marginTop = '4px';
        this.glossSelect.style.minWidth = '180px';
        this.glossSelect.addEventListener('change', () => {
            this.electron.ipcRenderer.send('set-project-glossary', { project: this.projectId, glossary: this.glossSelect.value });
        });
        this.topBar.appendChild(this.glossSelect);

        let requestTerms: HTMLAnchorElement = document.createElement('a');
        requestTerms.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24" viewBox="0 0 24 24" width="24"><path d="M14.17,5L19,9.83V19H5V5L14.17,5L14.17,5 M14.17,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V9.83 c0-0.53-0.21-1.04-0.59-1.41l-4.83-4.83C15.21,3.21,14.7,3,14.17,3L14.17,3z M7,15h10v2H7V15z M7,11h10v2H7V11z M7,7h7v2H7V7z"/></svg>' +
            '<span class="tooltiptext bottomRightTooltip">Get Terms for All Segments</span>';
        requestTerms.className = 'tooltip';
        requestTerms.style.marginRight = '10px';
        requestTerms.addEventListener('click', () => {
            this.applyTerminologyAll();
        });
        this.topBar.appendChild(requestTerms);
    }

    close(): void {
        this.rowsObserver.disconnect();
        this.observer.disconnect();
    }

    getContainer(): HTMLDivElement {
        return this.container;
    }

    setSize() {
        let main: HTMLDivElement = document.getElementById('main') as HTMLDivElement;
        this.container.style.width = main.clientWidth + 'px';
        this.container.style.height = main.clientHeight + 'px';
        this.mainArea.style.height = (main.clientHeight - this.topBar.clientHeight) + 'px';
        this.mainArea.style.width = this.container.clientWidth + 'px';
    }

    watchSizes(): void {
        let targetNode: HTMLDivElement = document.getElementById('main') as HTMLDivElement;
        let config: MutationObserverInit = { attributes: true, childList: false, subtree: false };
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
        this.saveEdit({ next: 'none', confirm: false });
        this.electron.ipcRenderer.send('export-open-project', { project: this.projectId });
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
            project: this.projectId,
            start: this.currentPage * this.rowsPage,
            count: this.rowsPage,
            filterText: this.filterText,
            filterLanguage: this.filterLanguage,
            caseSensitiveFilter: this.caseSensitiveFilter,
            regExp: this.regExp,
            showUntranslated: this.showUntranslated,
            showTranslated: this.showTranslated,
            showConfirmed: this.showConfirmed,
            sortOption: this.sortOption,
            sortDesc: this.sortDesc
        };
        this.electron.ipcRenderer.send('get-segments', params);
    }

    buildTranslationArea(): void {

        let leftPanel: HTMLDivElement = document.createElement('div');
        leftPanel.classList.add('leftPaddedPanel');
        this.translationArea.appendChild(leftPanel);

        let tableContainer: HTMLDivElement = document.createElement('div');
        tableContainer.classList.add('divContainer');
        tableContainer.classList.add('fill_width');
        leftPanel.appendChild(tableContainer);

        let table: HTMLTableElement = document.createElement('table');
        table.classList.add('stripes');
        table.classList.add('zoomable');
        table.style.tableLayout = 'fixed';
        tableContainer.appendChild(table);

        let thead: HTMLTableSectionElement = document.createElement('thead');
        table.appendChild(thead);

        let tr: HTMLTableRowElement = document.createElement('tr');
        tr.classList.add('middle');
        thead.appendChild(tr);

        this.numberTh = document.createElement('th');
        this.numberTh.classList.add('fixed');
        this.numberTh.innerText = '#'
        tr.appendChild(this.numberTh);

        this.sourceTh = document.createElement('th');
        this.sourceTh.innerText = 'Source (' + this.srcLang + ')';
        tr.appendChild(this.sourceTh);

        this.translateTh = document.createElement('th');
        this.translateTh.innerHTML = '&nbsp;';
        tr.appendChild(this.translateTh);

        this.matchTh = document.createElement('th');
        this.matchTh.innerText = '%';
        tr.appendChild(this.matchTh);

        this.finalTh = document.createElement('th');
        this.finalTh.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.2222 0H1.77778C0.8 0 0 0.8 0 1.77778V14.2222C0 15.2 0.8 16 1.77778 16H14.2222C15.2 16 16 15.2 16 14.2222V1.77778C16 0.8 15.2 0 14.2222 0ZM14.2222 14.2222H1.77778V1.77778H14.2222V14.2222ZM13.3244 5.33333L12.0711 4.07111L6.21333 9.92889L3.92 7.64444L2.65778 8.89778L6.21333 12.4444L13.3244 5.33333Z"/></svg>';
        tr.appendChild(this.finalTh);

        this.targetTh = document.createElement('th');
        this.targetTh.innerText = 'Target (' + this.tgtLang + ')';
        tr.appendChild(this.targetTh);

        this.tbody = document.createElement('tbody');
        table.appendChild(this.tbody);

        this.statusArea = document.createElement('div');
        this.statusArea.classList.add('toolbar');
        leftPanel.appendChild(this.statusArea);

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
            let page = Number.parseInt(this.pageInput.value, 10);
            if (page >= 0 && page <= this.maxPage) {
                this.currentPage = page - 1;
                this.getSegments();
            }
        });
        pageDiv.appendChild(this.pageInput);
        pageDiv.insertAdjacentHTML('beforeend', '<span class="tooltiptext topTooltip">Enter page number and press ENTER</span>');

        this.pagesSpan = document.createElement('span');
        this.pagesSpan.classList.add('noWrap');
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

        let rowDiv: HTMLDivElement = document.createElement('div');
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
            this.rowsPage = Number.parseInt(rowsInput.value, 10);
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

        let filler: HTMLSpanElement = document.createElement('span');
        filler.innerHTML = '&nbsp;';
        filler.className = 'fill_width';
        this.statusArea.appendChild(filler);

        this.statistics = document.createElement('div');
        this.statistics.innerHTML = '&nbsp;';
        this.statistics.classList.add('stats');
        this.statusArea.appendChild(this.statistics);

        let config: MutationObserverInit = { attributes: true, childList: false, subtree: false };
        this.rowsObserver = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    tableContainer.style.height = (leftPanel.clientHeight - this.statusArea.clientHeight) + 'px';
                    tableContainer.style.width = leftPanel.clientWidth + 'px';
                    this.setColumnWidths();

                }
            }
        });
        this.rowsObserver.observe(this.translationArea, config);
    }

    setColumnWidths(): void {

        let digits = 1;
        if (this.segmentsCount > 10) {
            digits = 2;
        }
        if (this.segmentsCount > 100) {
            digits = 3;
        }
        if (this.segmentsCount > 100) {
            digits = 4;
        }
        if (this.segmentsCount > 1000) {
            digits = 5;
        }
        if (this.segmentsCount > 10000) {
            digits = 6;
        }
        if (this.segmentsCount > 100000) {
            digits = 7;
        }
        let numbersWidth = (digits * 9 * this.zoom) + 11; // 9: digit width 11: padding

        let status = (40 * this.zoom) + 8;

        let width: number = (this.translationArea.clientWidth - numbersWidth - status) / 2;

        this.numberTh.style.width = (100 * numbersWidth / this.translationArea.clientWidth) + '%';
        this.translateTh.style.width = (100 * 32 / this.translationArea.clientWidth) + '%';
        this.matchTh.style.width = (100 * (40 * this.zoom + 8) / this.translationArea.clientWidth) + '%';
        this.finalTh.style.width = (100 * 35 / this.translationArea.clientWidth) + '%';
        this.sourceTh.style.width = (100 * width / this.translationArea.clientWidth) + '%';
        this.targetTh.style.width = (100 * width / this.translationArea.clientWidth) + '%';
    }

    buildRightSide(): void {
        let panelsContainer: HTMLDivElement = document.createElement('div');
        panelsContainer.classList.add('rightPaddedPanel');
        this.rightPanel.appendChild(panelsContainer);

        let config: any = { attributes: true, childList: false, subtree: false };
        let observer = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    panelsContainer.style.height = this.rightPanel.clientHeight + 'px';
                    panelsContainer.style.width = this.rightPanel.clientWidth + 'px';
                }
            }
        });
        observer.observe(this.rightPanel, config);

        let horizontalSplit: ThreeHorizontalPanels = new ThreeHorizontalPanels(panelsContainer);

        this.createMemoryArea(horizontalSplit.topPanel());
        this.createTermsArea(horizontalSplit.bottomPanel());
        this.createMachineArea(horizontalSplit.centerPanel());
    }

    createMemoryArea(topPanel: HTMLDivElement): void {
        this.memoryArea = topPanel;

        let panelsContainer: HTMLDivElement = document.createElement('div');
        panelsContainer.classList.add('topPaddedPanel');
        this.memoryArea.appendChild(panelsContainer);

        let memoryTitle: HTMLDivElement = document.createElement('div');
        memoryTitle.classList.add('titlepanel');
        memoryTitle.innerText = 'Translation Memory';
        panelsContainer.appendChild(memoryTitle);
        let matchesContainer: HTMLDivElement = document.createElement('div');
        matchesContainer.classList.add('fill_width');
        panelsContainer.appendChild(matchesContainer);
        this.tmMatches = new TmMatches(matchesContainer, this.projectId);

        let config: MutationObserverInit = { attributes: true, childList: false, subtree: false };
        let observer: MutationObserver = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    matchesContainer.style.height = (panelsContainer.clientHeight - memoryTitle.clientHeight) + 'px';
                }
            }
        });
        observer.observe(this.memoryArea, config);
    }

    createMachineArea(centerPanel: HTMLDivElement): void {
        this.machineArea = centerPanel;

        let panelsContainer: HTMLDivElement = document.createElement('div');
        panelsContainer.classList.add('centerPaddedPanel');
        this.machineArea.appendChild(panelsContainer);

        let machineTitle: HTMLDivElement = document.createElement('div');
        machineTitle.classList.add('titlepanel');
        machineTitle.innerText = 'Machine Translation';
        panelsContainer.appendChild(machineTitle);
        let mtContainer: HTMLDivElement = document.createElement('div');
        mtContainer.classList.add('fill_width');
        panelsContainer.appendChild(mtContainer);
        this.mtMatches = new MtMatches(mtContainer, this.projectId);

        let config: MutationObserverInit = { attributes: true, childList: false, subtree: false };
        let observer: MutationObserver = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    mtContainer.style.height = (panelsContainer.clientHeight - machineTitle.clientHeight) + 'px';
                }
            }
        });
        observer.observe(this.machineArea, config);
    }

    createTermsArea(bottomPanel: HTMLDivElement): void {
        this.termsArea = bottomPanel;

        let panelsContainer: HTMLDivElement = document.createElement('div');
        panelsContainer.classList.add('bottomPaddedPanel');
        this.termsArea.appendChild(panelsContainer);

        let termsTitle: HTMLDivElement = document.createElement('div');
        termsTitle.classList.add('titlepanel');
        termsTitle.innerText = 'Terms';
        panelsContainer.appendChild(termsTitle);

        let termsContainer: HTMLDivElement = document.createElement('div');
        termsContainer.classList.add('fill_width');
        panelsContainer.appendChild(termsContainer);
        this.termsPanel = new TermsPanel(termsContainer, this.projectId);

        let config: MutationObserverInit = { attributes: true, childList: false, subtree: false };
        let observer: MutationObserver = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    termsContainer.style.height = (panelsContainer.clientHeight - termsTitle.clientHeight) + 'px';
                }
            }
        });
        observer.observe(this.termsArea, config);
    }

    generateStatistics(): void {
        this.electron.ipcRenderer.send('generate-statistics', { project: this.projectId });
    }

    setSegments(arg: Segment[]): void {
        this.tbody.innerHTML = '';
        this.tbody.parentElement.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        let length: number = arg.length;
        if (length === 0 && this.filterButton.classList.contains('active')) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Nothing to display, consider clearing current filter' });
            this.container.classList.remove('wait');
            return;
        }
        let returnRow: HTMLTableRowElement;
        for (let i = 0; i < length; i++) {
            let row: Segment = arg[i];
            let tr: HTMLTableRowElement = document.createElement('tr');
            tr.setAttribute('data-file', row.file);
            tr.setAttribute('data-unit', row.unit);
            tr.setAttribute('data-id', row.segment);
            tr.addEventListener('click', (event: MouseEvent) => this.rowClickListener(event));
            this.tbody.appendChild(tr);

            if (row.file === this.returnTo.file && row.unit === this.returnTo.unit && row.segment === this.returnTo.id) {
                returnRow = tr;
            }

            let td: HTMLTableCellElement = document.createElement('td');
            td.classList.add('middle');
            td.classList.add('center');
            td.classList.add('initial');
            td.innerText = '' + (row.index + 1);
            tr.appendChild(td);

            if (row.index + 1 === this.returnNumber) {
                returnRow = tr;
                this.electron.ipcRenderer.send('close-go-to');
            }

            if (length > 1 && ((i > 0 && arg[i - 1].unit === row.unit) || (i < length - 1 && arg[i + 1].unit === row.unit))) {
                let unit: number = Number.parseInt(row.unit);
                if (unit % 2 === 0) {
                    td.classList.add('evenUnit');
                } else {
                    td.classList.add('oddUnit');
                }
            }

            td = document.createElement('td');
            td.classList.add('source');
            td.lang = this.srcLang;
            if (TranslationView.isBiDi(this.srcLang)) {
                td.dir = 'rtl';
            }
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
            td.innerHTML = TranslationView.SVG_BLANK;
            if (!row.translate) {
                td.innerHTML = TranslationView.LOCK_SPAN;
            } else if (row.tagErrors || row.spaceErrors) {
                if (row.tagErrors) {
                    td.innerHTML = TranslationView.TAG_WARNING;
                }
                if (row.spaceErrors) {
                    td.innerHTML = TranslationView.SPACE_WARNING;
                }
                if (row.tagErrors && row.spaceErrors) {
                    td.innerHTML = TranslationView.SPACE_TAG_WARNING;
                }
            }
            tr.appendChild(td);

            td = document.createElement('td');
            td.classList.add('middle');
            td.classList.add('center');
            td.classList.add('match');
            if (row.match > 0) {
                td.innerHTML = row.match + '%';
            }
            tr.appendChild(td);

            td = document.createElement('td');
            td.classList.add('middle');
            td.classList.add('state');
            td.classList.add(row.state);
            if (row.state === 'initial' && !row.hasNotes) {
                td.innerHTML = TranslationView.SVG_BLANK;
            }
            if (row.state === 'translated') {
                td.innerHTML = TranslationView.TRANSLATED_SPAN;
            }
            if (row.state === 'final') {
                td.innerHTML = TranslationView.FINAL_SPAN;
            }
            if (row.hasNotes) {
                td.innerHTML = td.innerHTML + TranslationView.NOTES_SPAN;
            }
            tr.appendChild(td);

            td = document.createElement('td');
            td.classList.add('target');
            td.lang = this.tgtLang;
            if (TranslationView.isBiDi(this.tgtLang)) {
                td.dir = 'rtl';
            }
            td.spellcheck = true;
            if (row.preserve) {
                td.classList.add('preserve');
            }
            td.innerHTML = row.target;
            tr.appendChild(td);
        }
        this.tmMatches.clear();
        this.mtMatches.clear();
        this.termsPanel.clear();
        this.currentRow = undefined;
        this.container.classList.remove('wait');

        this.setColumnWidths();

        let rows: HTMLCollectionOf<HTMLTableRowElement> = this.tbody.rows;
        this.currentId = { id: '', file: '', unit: '' };
        if (returnRow) {
            this.selectRow(returnRow);
            this.returnTo = { file: '', unit: '', id: '' };
            this.returnNumber = -1;
            return;
        }
        this.selectRow(rows[0]);
    }

    static isBiDi(code: string): boolean {
        return code.startsWith("ar") || code.startsWith("fa") || code.startsWith("az") || code.startsWith("ur")
            || code.startsWith("pa-PK") || code.startsWith("ps") || code.startsWith("prs") || code.startsWith("ug")
            || code.startsWith("he") || code.startsWith("ji") || code.startsWith("yi");
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
        let clickedRow: HTMLTableRowElement = event.currentTarget as HTMLTableRowElement;
        if (clickedRow === this.currentRow) {
            return;
        }
        this.saveEdit({ confirm: false, next: 'clicked', segment: clickedRow.rowIndex });
    }

    getMachineTranslations(): void {
        this.electron.ipcRenderer.send('machine-translate', {
            project: this.projectId,
            file: this.currentId.file,
            unit: this.currentId.unit,
            segment: this.currentId.id,
            srcLang: this.srcLang,
            tgtLang: this.tgtLang,
            currentSegment: {
                file: this.currentId.file,
                unit: this.currentId.unit,
                id: this.currentId.id
            }
        });
    }

    getAssembledMatches(): void {
        if (this.memSelect.value === 'none') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select memory' });
            return;
        }
        if (this.glossSelect.value === 'none') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select glossary' });
            return;
        }
        this.electron.ipcRenderer.send('assemble-matches', {
            project: this.projectId,
            file: this.currentId.file,
            unit: this.currentId.unit,
            segment: this.currentId.id,
            memory: this.memSelect.value,
            glossary: this.glossSelect.value
        });
    }

    getTmMatches(): void {
        if (this.memSelect.value === 'none') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select memory' });
            return;
        }
        this.electron.ipcRenderer.send('tm-translate', {
            project: this.projectId,
            file: this.currentId.file,
            unit: this.currentId.unit,
            segment: this.currentId.id,
            memory: this.memSelect.value
        });
    }

    saveEdit(arg: any): void {
        let confirm: boolean = arg.confirm;
        let next: string = arg.next;

        if (!this.currentTranslate.innerHTML.includes(TranslationView.LOCK_FRAGMENT)) {
            // not locked
            this.currentCell.classList.remove('editing');
            this.currentRow.classList.remove('currentRow');
            let translation: string = this.getTranslation(this.currentCell.innerHTML);
            this.currentCell.innerHTML = this.highlightSpaces(translation);

            let hasNotes: boolean = this.currentState.innerHTML.includes(TranslationView.NOTE_FRAGMENT);

            let isConfirmed: boolean = this.currentState.classList.contains('final');
            if (!confirm && isConfirmed && this.currentContent === this.currentCell.innerHTML) {
                confirm = true;
            }
            if (arg.unconfirm) {
                confirm = false;
                this.currentState.classList.remove('final');
                if (translation === '') {
                    this.currentState.classList.add('initial');
                    this.currentState.innerHTML = hasNotes ? TranslationView.NOTES_SPAN : TranslationView.SVG_BLANK;
                } else {
                    this.currentState.classList.add('translated');
                    this.currentState.innerHTML = TranslationView.TRANSLATED_SPAN;
                    if (hasNotes) {
                        this.currentState.innerHTML = this.currentState.innerHTML + TranslationView.NOTES_SPAN;
                    }
                }
            }
            if (confirm) {
                this.currentState.classList.remove('initial');
                this.currentState.classList.remove('translated');
                this.currentState.classList.add('final');
                this.currentState.innerHTML = TranslationView.FINAL_SPAN;
                if (hasNotes) {
                    this.currentState.innerHTML = this.currentState.innerHTML + TranslationView.NOTES_SPAN;
                }
            } else {
                if (translation === '') {
                    this.currentState.classList.remove('final');
                    this.currentState.classList.remove('translated');
                    this.currentState.classList.add('initial');
                    this.currentState.innerHTML = hasNotes ? TranslationView.NOTES_SPAN : TranslationView.SVG_BLANK;
                } else {
                    this.currentState.classList.remove('final');
                    this.currentState.classList.remove('initial');
                    this.currentState.classList.add('translated');
                    this.currentState.innerHTML = TranslationView.TRANSLATED_SPAN;
                    if (hasNotes) {
                        this.currentState.innerHTML = this.currentState.innerHTML + TranslationView.NOTES_SPAN;
                    }
                }
            }

            this.electron.ipcRenderer.send('save-translation', {
                project: this.projectId,
                file: this.currentId.file,
                unit: this.currentId.unit,
                segment: this.currentId.id,
                translation: translation,
                confirm: confirm,
                memory: this.memSelect.value
            });

        }
        let rows: HTMLCollection = this.tbody.rows;
        if (next === 'none') {
            this.selectRow(this.currentRow);
        }
        if (next === 'clicked') {
            let index = arg.segment - 1;
            let row: HTMLTableRowElement = (rows[index] as HTMLTableRowElement);
            this.selectRow(row);
        }
        if (next === 'number') {
            let index = arg.segment - 1 - (this.currentPage * this.rowsPage);
            if (index < 0) {
                index = 0;
            }
            if (index >= rows.length) {
                index = rows.length - 1;
            }
            let row: HTMLTableRowElement = (rows[index] as HTMLTableRowElement);
            this.selectRow(row);
            this.electron.ipcRenderer.send('close-go-to');
        }
        if (next === 'next') {
            let index = this.currentRow.rowIndex;
            if (index >= rows.length) {
                index = rows.length - 1;
            }
            let row: HTMLTableRowElement = (rows[index] as HTMLTableRowElement);
            this.selectRow(row);
        }
        if (next === 'previous') {
            let index = this.currentRow.rowIndex - 2;
            if (index < 0) {
                index = 0;
            }
            let row: HTMLTableRowElement = (rows[index] as HTMLTableRowElement);
            this.selectRow(row);
        }
        if (next === 'untranslated') {
            let found: boolean = false;
            let length: number = rows.length;
            for (let i: number = this.currentRow.rowIndex; i < length; i++) {
                let row: HTMLTableRowElement = (rows[i] as HTMLTableRowElement);
                let cell: HTMLTableCellElement = row.getElementsByClassName('state')[0] as HTMLTableCellElement;
                if (cell.classList.contains('initial')) {
                    found = true;
                    this.selectRow(row);
                    break;
                }
            }
            if (!found) {
                this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'No more untranslated segments on this page' });
            }
        }
        if (next === 'unconfirmed') {
            let found: boolean = false;
            let length: number = rows.length;
            for (let i: number = this.currentRow.rowIndex; i < length; i++) {
                let row: HTMLTableRowElement = (rows[i] as HTMLTableRowElement);
                let cell: HTMLTableCellElement = row.getElementsByClassName('state')[0] as HTMLTableCellElement;
                if (cell.classList.contains('translated')) {
                    found = true;
                    this.selectRow(row);
                    break;
                }
            }
            if (!found) {
                this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'No more unconfirmed segments on this page' });
            }
        }
    }

    getTranslation(html: string): string {
        if (html.trim() === '<br>') {
            html = '';
        }
        return html;
    }

    nextUntranslated(): void {
        this.saveEdit({ confirm: false, next: 'untranslated' });
    }

    nextUnconfirmed(): void {
        this.saveEdit({ confirm: false, next: 'unconfirmed' });
    }

    centerRow(row: HTMLTableRowElement): void {
        setTimeout(() => {
            row.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }, 100);
    }

    changeListener(): void {
        if (this.currentContent === this.currentCell.innerHTML) {
            return;
        }
        if (!this.currentState.classList.contains('final')) {
            return;
        }
        this.currentState.classList.remove('final');
        if (this.currentCell.innerHTML === '') {
            this.currentState.classList.add('initial');
            this.currentState.innerHTML = TranslationView.SVG_BLANK;
        } else {
            this.currentState.classList.add('translated');
            this.currentState.innerHTML = TranslationView.TRANSLATED_SPAN;
        }
    }

    selectRow(row: HTMLTableRowElement): void {
        if (this.currentRow) {
            this.currentRow.classList.remove('currentRow');
        }
        if (this.currentCell) {
            this.currentCell.contentEditable = 'false';
            this.currentCell.classList.remove('editing');
        }
        this.currentRow = row;
        this.currentRow.classList.add('currentRow');
        let id: string = this.currentRow.getAttribute('data-id');
        let file: string = this.currentRow.getAttribute('data-file');
        let unit: string = this.currentRow.getAttribute('data-unit');

        this.currentId = { id: id, file: file, unit: unit };
        let source: HTMLTableCellElement = this.currentRow.getElementsByClassName('source')[0] as HTMLTableCellElement;
        this.sourceTags = this.getTags(source);

        this.currentCell = this.currentRow.getElementsByClassName('target')[0] as HTMLTableCellElement;
        this.currentCell.addEventListener('keyup', () => this.changeListener());

        this.currentState = this.currentRow.getElementsByClassName('state')[0] as HTMLTableCellElement;
        this.currentTranslate = this.currentRow.getElementsByClassName('translate')[0] as HTMLTableCellElement;
        this.currentContent = this.currentCell.innerHTML;
        if (!this.currentTranslate.innerHTML.includes(TranslationView.LOCK_FRAGMENT)) {
            this.currentCell.contentEditable = 'true';
            this.currentCell.classList.add('editing');
        }

        this.tmMatches.clear();
        this.mtMatches.clear();
        this.termsPanel.clear();

        let params: any = {
            project: this.projectId,
            file: this.currentId.file,
            unit: this.currentId.unit,
            segment: this.currentId.id
        };
        this.electron.ipcRenderer.send('get-matches', params);
        this.electron.ipcRenderer.send('get-terms', params);
        if (this.notesVisible) {
            this.showNotes();
        }

        this.centerRow(this.currentRow);
        this.currentCell.focus();
    }

    editSource(): void {
        if (this.currentState.classList.contains('final')) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Confirmed segment' });
            return;
        }
        let isLocked: boolean = this.currentTranslate.innerHTML.includes(TranslationView.LOCK_FRAGMENT);
        if (isLocked) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Locked segment' });
            return;
        }
        let segmentId: any = this.currentId;
        let source: HTMLTableCellElement = this.currentRow.getElementsByClassName('source')[0] as HTMLTableCellElement;
        let originalSource = source.innerHTML;
        source.classList.add('splitting');
        source.contentEditable = 'true';
        source.focus();
        source.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                source.innerHTML = originalSource;
                source.contentEditable = 'false';
                source.classList.remove('splitting');
            }
            if (event.key === 'Enter' && event.altKey) {
                event.preventDefault();
                this.saveSource(segmentId, source, originalSource);
                this.currentCell.contentEditable = 'true';
                this.currentCell.focus();
            }
        });
        source.addEventListener('focusout', () => {
            this.saveSource(segmentId, source, originalSource);
        });
    }

    saveSource(segmentId: any, source: HTMLTableCellElement, originalSource: string): void {
        source.classList.remove('splitting');
        source.contentEditable = 'false';
        let newSource: string = this.getTranslation(source.innerHTML);
        if (newSource === '') {
            source.innerHTML = originalSource;
            return;
        }
        source.innerHTML = this.highlightSpaces(newSource);
        this.electron.ipcRenderer.send('save-source', {
            project: this.projectId,
            file: segmentId.file,
            unit: segmentId.unit,
            segment: segmentId.id,
            newSource: newSource
        });
    }

    cancelEdit(): void {
        this.currentCell.innerHTML = this.currentContent;
    }

    getTags(element: HTMLTableCellElement): Map<string, string> {
        let map: Map<string, string> = new Map<string, string>();
        let children: HTMLCollectionOf<HTMLImageElement> = element.getElementsByTagName('img');
        let length: number = children.length;
        for (let i = 0; i < length; i++) {
            let child: HTMLElement = children[i];
            map.set(child.getAttribute('data-id'), child.outerHTML);
        }
        return map;
    }

    copySource(): void {
        let source: HTMLTableCellElement = this.currentRow.getElementsByClassName('source')[0] as HTMLTableCellElement;
        if (this.currentTranslate.innerHTML.includes(TranslationView.LOCK_FRAGMENT)) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Locked segment' });
            return;
        }
        let hasNotes = this.currentState.innerHTML.includes(TranslationView.NOTE_FRAGMENT);
        if (this.currentCell.innerHTML === source.innerHTML) {
            return;
        }
        this.currentCell.innerHTML = source.innerHTML;
        this.currentState.classList.remove('final');
        if (source.innerHTML === '') {
            this.currentState.classList.add('initial');
            this.currentState.innerHTML = hasNotes ? TranslationView.NOTES_SPAN : TranslationView.SVG_BLANK;
        } else {
            this.currentState.classList.add('translated');
            this.currentState.innerHTML = TranslationView.TRANSLATED_SPAN;
            if (hasNotes) {
                this.currentState.innerHTML = this.currentState.innerHTML + TranslationView.NOTES_SPAN;
            }
        }
        this.currentCell.focus();
    }

    insertTag(arg: any): void {
        let isLocked: boolean = this.currentTranslate.innerHTML.includes(TranslationView.LOCK_FRAGMENT);
        if (isLocked) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Locked segment' });
            return;
        }
        if (arg.tag) {
            let tag: string = '' + arg.tag;
            if (this.sourceTags.has(tag)) {
                let target: HTMLTableCellElement = this.currentRow.getElementsByClassName('target')[0] as HTMLTableCellElement;
                let targetTags: Map<string, string> = this.getTags(target);
                if (targetTags.has(tag)) {
                    this.removeTag(tag);
                }
                let svg: string = this.sourceTags.get(tag)
                document.execCommand('insertHTML', false, svg);
            }
        } else {
            this.electron.ipcRenderer.send('show-tag-window');
        }
    }

    autoPropagate(rows: any[]): void {
        let length: number = rows.length;
        for (let i: number = 0; i < length; i++) {
            this.updateBody(rows[i]);
        }
    }

    updateBody(data: any): void {
        let rows: HTMLCollectionOf<HTMLTableRowElement> = this.tbody.getElementsByTagName('tr');
        let length: number = rows.length;
        for (let i: number = 0; i < length; i++) {
            let row: HTMLTableRowElement = rows[i];
            if (row.getAttribute('data-file') === data.file && row.getAttribute('data-unit') === data.unit
                && row.getAttribute('data-id') === data.segment) {
                (row.getElementsByClassName('match')[0] as HTMLTableCellElement).innerHTML = data.match + '%';
                if (data.target) {
                    let status: string = data.status;
                    (row.getElementsByClassName('state')[0] as HTMLTableCellElement).classList.remove('initial');
                    (row.getElementsByClassName('state')[0] as HTMLTableCellElement).classList.add(status);
                    (row.getElementsByClassName('target')[0] as HTMLTableCellElement).innerHTML = data.target;
                    if (data.status === 'translated') {
                        (row.getElementsByClassName('state')[0] as HTMLTableCellElement).innerHTML = TranslationView.TRANSLATED_SPAN;
                    }
                    if (data.status === 'final') {
                        (row.getElementsByClassName('state')[0] as HTMLTableCellElement).innerHTML = TranslationView.FINAL_SPAN;
                    }
                }
                break;
            }
        }
    }

    setMatches(matches: Match[]): void {
        this.tmMatches.clear();
        this.mtMatches.clear();
        let length: number = matches.length;
        let max: number = 0;
        for (let i: number = 0; i < length; i++) {
            let match: any = matches[i];
            match.project = this.projectId;
            if (match.type === 'tm') {
                this.tmMatches.add(match);
                if (match.similarity > max) {
                    max = match.similarity;
                }
            }
            if (match.type === 'mt' || match.type === 'am') {
                this.mtMatches.add(match);
            }
        }
        if (max > 0) {
            (this.currentRow.getElementsByClassName('match')[0] as HTMLTableCellElement).innerHTML = max + '%';
        }
    }

    setTerms(terms: any[]): void {
        this.termsPanel.setTerms(terms);
    }

    setTarget(arg: any): void {
        if (this.currentCell.innerHTML === arg.target) {
            return;
        }
        this.currentCell.innerHTML = arg.target;
        this.currentState.classList.remove('final');
        if (arg.target === '') {
            this.currentState.classList.add('initial');
            this.currentState.innerHTML = TranslationView.SVG_BLANK;
        } else {
            this.currentState.classList.add('translated');
            this.currentState.innerHTML = TranslationView.TRANSLATED_SPAN;
        }
        this.currentCell.focus();
    }

    setProjectMemories(arg: any): void {
        let memories: any[] = arg.memories;
        if (memories.length === 0) {
            this.memSelect.innerHTML = '<option value="none" class="error">-- No Memory --</option>';
            return;
        }
        let array: string[] = [];
        let options: string = '<option value="none" class="error">-- Select Memory --</option>';
        let length: number = memories.length;
        for (let i: number = 0; i < length; i++) {
            let mem: string[] = memories[i];
            array.push(mem[0]);
            options = options + '<option value="' + mem[0] + '">' + mem[1] + '</option>';
        }
        this.memSelect.innerHTML = options;
        if (array.includes(arg.default)) {
            this.memSelect.value = arg.default;
        }
    }

    setStatistics(stats: any): void {
        this.statistics.innerHTML = '';
        let span: HTMLSpanElement = document.createElement('span');
        span.classList.add('stats');
        span.innerText = stats.text;
        this.statistics.appendChild(span);

        let svg: HTMLSpanElement = document.createElement('span');
        svg.classList.add('stats');
        svg.innerHTML = stats.svg;
        this.statistics.appendChild(svg);
    }

    setSpellChecker(): void {
        this.electron.ipcRenderer.send('spell-language', this.tgtLang);
    }

    sortSegments(): void {
        let params: any = {
            projectId: this.projectId,
            sortOption: this.sortOption,
            sortDesc: this.sortDesc
        };
        this.electron.ipcRenderer.send('show-sort-segments', params);
    }

    filterSegments(): void {
        let params: any = {
            projectId: this.projectId,
            filterText: this.filterText,
            filterLanguage: this.filterLanguage,
            caseSensitiveFilter: this.caseSensitiveFilter,
            regExp: this.regExp,
            showUntranslated: this.showUntranslated,
            showTranslated: this.showTranslated,
            showConfirmed: this.showConfirmed
        };
        this.electron.ipcRenderer.send('show-filter-segments', params);
    }

    setSorting(args: any): void {
        if (this.sortOption === 'none' && args.sortOption === 'none') {
            return;
        }
        this.sortDesc = args.sortDesc;
        this.sortOption = args.sortOption;
        if (this.sortOption === 'none') {
            this.sortButton.classList.remove('active');
        } else {
            this.sortButton.classList.add('active');
        }
        this.currentPage = 0;
        this.getSegments();
    }

    setFilters(args: any): void {
        if (this.filterText === '' && args.filterText === '') {
            return;
        }
        this.filterText = args.filterText;
        this.filterLanguage = args.filterLanguage;
        this.caseSensitiveFilter = args.caseSensitiveFilter;
        this.regExp = args.regExp;
        this.showUntranslated = args.showUntranslated;
        this.showTranslated = args.showTranslated;
        this.showConfirmed = args.showConfirmed;
        this.saveEdit({ confirm: false, next: 'none' });
        if (this.filterText === '') {
            this.filterButton.classList.remove('active');
        } else {
            this.filterButton.classList.add('active');
        }
        this.currentPage = 0;
        this.getSegments();
    }

    applyTranslationMemoryAll(): void {
        this.returnTo = {
            file: this.currentId.file,
            unit: this.currentId.unit,
            id: this.currentId.id
        }
        this.electron.ipcRenderer.send('show-apply-tm', { project: this.projectId, memory: this.memSelect.value });
    }

    rememberSegment(): void {
        this.returnTo = {
            file: this.currentId.file,
            unit: this.currentId.unit,
            id: this.currentId.id
        }
    }
    
    removeAllTranslations(): void {
        this.returnTo = {
            file: this.currentId.file,
            unit: this.currentId.unit,
            id: this.currentId.id
        }
        this.electron.ipcRenderer.send('remove-translations', { project: this.projectId });
    }

    removeAllMatches(): void {
        this.returnTo = {
            file: this.currentId.file,
            unit: this.currentId.unit,
            id: this.currentId.id
        }
        this.electron.ipcRenderer.send('remove-all-matches', { project: this.projectId });
    }

    removeAllMachineTranslations(): void {
        this.returnTo = {
            file: this.currentId.file,
            unit: this.currentId.unit,
            id: this.currentId.id
        }
        this.electron.ipcRenderer.send('remove-machine-translations', { project: this.projectId });
    }

    unconfirmAllTranslations(): void {
        this.returnTo = {
            file: this.currentId.file,
            unit: this.currentId.unit,
            id: this.currentId.id
        }
        this.electron.ipcRenderer.send('unconfirm-translations', { project: this.projectId });
    }

    pseudoTranslate(): void {
        this.electron.ipcRenderer.send('pseudo-translate', { project: this.projectId });
    }

    copyAllSources(): void {
        this.returnTo = {
            file: this.currentId.file,
            unit: this.currentId.unit,
            id: this.currentId.id
        }
        this.electron.ipcRenderer.send('copy-sources', { project: this.projectId });
    }

    confirmAllTranslations(): void {
        this.returnTo = {
            file: this.currentId.file,
            unit: this.currentId.unit,
            id: this.currentId.id
        }
        this.electron.ipcRenderer.send('confirm-translations', { project: this.projectId, memory: this.memSelect.value });
    }

    acceptAll100Matches(): void {
        this.returnTo = {
            file: this.currentId.file,
            unit: this.currentId.unit,
            id: this.currentId.id
        }
        this.electron.ipcRenderer.send('accept-100-matches', { project: this.projectId });
    }

    insertNextTag(): void {
        let target: HTMLTableCellElement = this.currentRow.getElementsByClassName('target')[0] as HTMLTableCellElement;
        let targetTags = this.getTags(target);
        let length = this.sourceTags.size + 1;
        for (let i = 1; i < length; i++) {
            if (!targetTags.has('' + i)) {
                this.insertTag({ tag: i });
                return;
            }
        }
    }

    insertRemainingTags(): void {
        let target: HTMLTableCellElement = this.currentRow.getElementsByClassName('target')[0] as HTMLTableCellElement;
        let targetTags = this.getTags(target);
        let length = this.sourceTags.size + 1;
        let tags: string = '';
        for (let i = 1; i < length; i++) {
            if (!targetTags.has('' + i)) {
                tags = tags + this.sourceTags.get('' + i);
            }
        }
        if (tags !== '') {
            document.execCommand('insertHTML', false, tags);
        }
    }

    removeTags(): void {
        let target: HTMLTableCellElement = this.currentRow.getElementsByClassName('target')[0] as HTMLTableCellElement;
        let tags: NodeListOf<Element> = target.querySelectorAll('img');
        for (let i = 0; i < tags.length; i++) {
            target.removeChild(tags[i]);
        }
    }

    removeTag(tag: string): void {
        let target: HTMLTableCellElement = this.currentRow.getElementsByClassName('target')[0] as HTMLTableCellElement;
        let images: HTMLCollectionOf<HTMLImageElement> = target.getElementsByTagName('img');
        for (let img of images) {
            if (tag === img.getAttribute('data-id')) {
                target.removeChild(img);
                return;
            }
        }
    }

    replaceText(): void {
        this.electron.ipcRenderer.send('show-replaceText', { project: this.projectId });
    }

    applyMachineTranslationsAll(): void {
        this.returnTo = {
            file: this.currentId.file,
            unit: this.currentId.unit,
            id: this.currentId.id
        }
        this.electron.ipcRenderer.send('apply-mt-all', {
            project: this.projectId, srcLang: this.srcLang, tgtLang: this.tgtLang, currentSegment: {
                file: this.currentId.file,
                unit: this.currentId.unit,
                id: this.currentId.id
            }
        });
    }

    assembleMatchesAll(): void {
        if (this.memSelect.value === 'none') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select memory' });
            return;
        }
        if (this.glossSelect.value === 'none') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select glossary' });
            return;
        }
        this.returnTo = {
            file: this.currentId.file,
            unit: this.currentId.unit,
            id: this.currentId.id
        }
        this.electron.ipcRenderer.send('assemble-matches-all', {
            project: this.projectId,
            memory: this.memSelect.value,
            glossary: this.glossSelect.value
        });
    }

    removeAssembleMatches(): void {
        this.electron.ipcRenderer.send('remove-assembled-matches', { project: this.projectId });
    }

    acceptAllMachineTranslations(): void {
        this.returnTo = {
            file: this.currentId.file,
            unit: this.currentId.unit,
            id: this.currentId.id
        }
        this.electron.ipcRenderer.send('accept-mt-all', { project: this.projectId });
    }

    setProjectGlossaries(arg: any): void {
        let glossaries: any[] = arg.glossaries;
        if (glossaries.length === 0) {
            this.glossSelect.innerHTML = '<option value="none" class="error">-- No Glossary --</option>';
            return;
        }
        let array: string[] = [];
        let options: string = '<option value="none" class="error">-- Select Glossary --</option>';
        let length: number = glossaries.length;
        for (let i: number = 0; i < length; i++) {
            let mem: string[] = glossaries[i];
            array.push(mem[0]);
            options = options + '<option value="' + mem[0] + '">' + mem[1] + '</option>';
        }
        this.glossSelect.innerHTML = options;
        if (array.includes(arg.default)) {
            this.glossSelect.value = arg.default;
        }
    }

    concordanceSearch(): void {
        if (this.memSelect.value === 'none') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select memory' });
            return;
        }
        this.electron.ipcRenderer.send('concordance-search', { memories: [this.memSelect.value] });
    }

    searchTerm(): void {
        if (this.glossSelect.value === 'none') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select glossary' });
            return;
        }
        this.electron.ipcRenderer.send('show-term-search', { glossary: this.glossSelect.value });
    }

    addTerm(): void {
        if (this.glossSelect.value === 'none') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select glossary' });
            return;
        }
        this.electron.ipcRenderer.send('show-add-term', { glossary: this.glossSelect.value, srcLang: this.srcLang, tgtLang: this.tgtLang });
    }

    applyTerminologyAll(): void {
        if (this.glossSelect.value === 'none') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select glossary' });
            return;
        }
        this.returnTo = {
            file: this.currentId.file,
            unit: this.currentId.unit,
            id: this.currentId.id
        }
        this.electron.ipcRenderer.send('get-project-terms', { project: this.projectId, glossary: this.glossSelect.value });
    }

    applyTerminology(): void {
        if (this.glossSelect.value === 'none') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select glossary' });
            return;
        }
        if (!this.currentCell) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select segment' });
            return;
        }
        this.electron.ipcRenderer.send('get-segment-terms', {
            project: this.projectId,
            file: this.currentId.file,
            unit: this.currentId.unit,
            segment: this.currentId.id,
            glossary: this.glossSelect.value
        });
    }

    insertTerm(arg: any): void {
        let term: string = '';
        if (arg.term) {
            term = this.termsPanel.getTerm(arg.term);
        } else {
            term = this.termsPanel.getSelected();
        }
        if (term !== '') {
            this.electron.ipcRenderer.send('paste-text', term);
        }
    }

    toggleLock(): void {
        if (this.currentRow) {
            this.electron.ipcRenderer.send('lock-segment', {
                project: this.projectId,
                file: this.currentId.file,
                unit: this.currentId.unit,
                segment: this.currentId.id
            });
            let isLocked: boolean = this.currentTranslate.innerHTML.includes(TranslationView.LOCK_FRAGMENT);
            this.currentTranslate.innerHTML = isLocked ? TranslationView.SVG_BLANK : TranslationView.LOCK_SPAN;
            this.selectRow(this.currentRow);
            return;
        }
        this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select segment' });
    }

    highlightSpaces(text: string): string {
        let start: string = '';
        for (let i: number = 0; i < text.length; i++) {
            let c: string = text.charAt(i);
            if (!this.isWhiteSpace(c)) {
                break;
            }
            start = start + c;
        }
        if (start !== '') {
            text = "<span class='space'>" + start + "</span>" + text.substring(start.length);
        }
        let end: string = '';
        for (let i: number = text.length - 1; i >= 0; i--) {
            let c: string = text.charAt(i);
            if (!this.isWhiteSpace(c)) {
                break;
            }
            end = end + c;
        }
        if (end !== '') {
            text = text.substring(0, text.length - end.length) + "<span class='space'>" + end + "</span>";
        }
        return text;
    }

    isWhiteSpace(c: string): boolean {
        return (c === ' ' || c === '\n' || c === '\t' || c === '\u00A0');
    }

    nextMatch(): void {
        this.tmMatches.nextMatch();
    }

    previousMatch(): void {
        this.tmMatches.previousMatch();
    }

    nextMT(): void {
        this.mtMatches.nextMatch();
    }

    previousMT(): void {
        this.mtMatches.previousMatch();
    }

    gotoNext(): void {
        this.saveEdit({ next: 'next', confirm: false });
    }

    gotoPrevious(): void {
        this.saveEdit({ next: 'previous', confirm: false });
    }

    openSegment(arg: any): void {
        if (this.currentPage * this.rowsPage <= arg.segment && arg.segment < (this.currentPage + 1) * this.rowsPage) {
            this.saveEdit({ next: 'number', confirm: false, segment: arg.segment });
        } else {
            let page = Math.floor(arg.segment / this.rowsPage) + 1;
            if (page >= 0 && page <= this.maxPage) {
                this.returnNumber = arg.segment;
                this.currentPage = page - 1;
                this.pageInput.value = '' + (this.currentPage + 1);
                this.getSegments();
            }
        }
    }

    getSrcLang(): string {
        return this.srcLang;
    }

    getTgtLang(): string {
        return this.tgtLang;
    }

    selectNextTerm(): void {
        this.termsPanel.selectNextTerm();
    }

    selectPreviousTerm(): void {
        this.termsPanel.selectPreviousTerm();
    }

    exportHTML(): void {
        this.electron.ipcRenderer.send('export-project-html', { project: this.projectId });
    }

    changeCase(): void {
        if (!this.currentCell) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select segment' });
            return;
        }
        let translation = this.currentCell.innerText.trim();
        if (translation === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Empty target' });
            return;
        }
        this.electron.ipcRenderer.send('show-change-case');
    }

    caseChanged(arg: any): void {
        if (arg.case === 'sentence') {
            this.currentCell.innerText = this.sentence(this.currentCell.innerText);
        }
        if (arg.case === 'lowercase') {
            this.currentCell.innerText = this.currentCell.innerText.toLocaleLowerCase(this.tgtLang);
        }
        if (arg.case === 'uppercase') {
            this.currentCell.innerText = this.currentCell.innerText.toLocaleUpperCase(this.tgtLang);
        }
        if (arg.case === 'title') {
            this.currentCell.innerText = this.title(this.currentCell.innerText);
        }
        if (arg.case === 'toggle') {
            this.currentCell.innerText = this.toggle(this.currentCell.innerText);
        }
    }

    isLower(str: string): boolean {
        return str === str.toLocaleLowerCase(this.tgtLang);
    }

    sentence(str: string): string {
        let result: string = '';
        str = str.toLocaleLowerCase(this.tgtLang);
        let changed: boolean = false;
        for (let i: number = 0; i < str.length; i++) {
            let c: string = str.charAt(i);
            if (!changed) {
                let d: string = c.toLocaleUpperCase(this.tgtLang);
                if (c !== d) {
                    c = d;
                    changed = true;
                }
            }
            result = result.concat(c);
        }
        return result;
    }

    title(str: string): string {
        str = str.toLocaleLowerCase(this.tgtLang);
        return str.replace(/(^|\s)\S/g, (t) => { return t.toLocaleUpperCase(this.tgtLang) });
    }

    toggle(str: string): string {
        let result: string = '';
        for (let i: number = 0; i < str.length; i++) {
            let c: string = str.charAt(i);
            result = this.isLower(c) ? result.concat(c.toLocaleUpperCase(this.tgtLang)) : result.concat(c.toLocaleLowerCase(this.tgtLang));
        }
        return result;
    }

    splitSegment(): void {
        if (this.currentState.classList.contains('final')) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Confirmed segment' });
            return;
        }
        let isLocked: boolean = this.currentTranslate.innerHTML.includes(TranslationView.LOCK_FRAGMENT);
        if (isLocked) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Locked segment' });
            return;
        }
        let source: HTMLTableCellElement = this.currentRow.getElementsByClassName('source')[0] as HTMLTableCellElement;
        source.classList.add('splitting');
        source.innerHTML = source.innerText;
        source.contentEditable = 'true';
        source.focus();
        source.addEventListener('keydown', (key: KeyboardEvent) => this.sourceKeyListener(key, source.innerHTML));
        source.addEventListener('focusout', () => {
            source.classList.remove('splitting');
        });
    }

    sourceKeyListener(event: KeyboardEvent, originalHTML: string): void {
        let allowedKeys: string[] = ['Escape', 'Enter', 'NumpadEnter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Alt'];
        if (!allowedKeys.includes(event.key)) {
            event.preventDefault();
            return;
        }
        if (event.key === 'Escape') {
            let source: HTMLTableCellElement = event.currentTarget as HTMLTableCellElement;
            source.innerHTML = originalHTML;
            source.contentEditable = 'false';
            this.currentCell.focus();
        }

        if (event.key === 'Enter' || event.key === 'NumpadEnter') {
            event.preventDefault();
            let selection: Selection = window.getSelection();
            if (selection.rangeCount !== 0) {
                let source: HTMLTableCellElement = event.currentTarget as HTMLTableCellElement;
                source.contentEditable = 'false';
                if (selection.anchorOffset === 0 || selection.anchorOffset === selection.anchorNode.textContent.length) {
                    source.innerHTML = originalHTML;
                    this.currentCell.focus();
                } else {
                    this.returnTo = {
                        file: this.currentId.file,
                        unit: this.currentId.unit,
                        id: this.currentId.id + '-1'
                    }
                    this.electron.ipcRenderer.send('split-at', {
                        project: this.projectId,
                        file: this.currentId.file,
                        unit: this.currentId.unit,
                        segment: this.currentId.id,
                        text: selection.anchorNode.textContent,
                        offset: selection.anchorOffset
                    });
                }
            }
        }
    }

    mergeNext(): void {
        if (this.currentState.classList.contains('final')) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Confirmed segment' });
            return;
        }
        let isLocked: boolean = this.currentTranslate.innerHTML.includes(TranslationView.LOCK_FRAGMENT);
        if (isLocked) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Locked segment' });
            return;
        }
        let nextRow: HTMLTableRowElement = this.currentRow.nextElementSibling as HTMLTableRowElement;
        if (nextRow) {
            if (this.currentRow.getAttribute('data-file') === nextRow.getAttribute('data-file') && this.currentRow.getAttribute('data-unit') === nextRow.getAttribute('data-unit')) {
                if (nextRow.getElementsByClassName('state')[0].classList.contains('final')) {
                    this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Confirmed segment' });
                    return;
                }
                if (nextRow.getElementsByClassName('translate')[0].innerHTML.includes(TranslationView.LOCK_FRAGMENT)) {
                    this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Locked segment' });
                    return;
                }
                this.returnTo = {
                    file: this.currentId.file,
                    unit: this.currentId.unit,
                    id: this.currentId.id
                }
                this.electron.ipcRenderer.send('merge-at', {
                    project: this.projectId,
                    file: this.currentId.file,
                    unit: this.currentId.unit,
                    segment: this.currentId.id
                });
                return;
            }
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Segments from different paragraphs' });
        }
    }

    setErrors(arg: any): void {
        let rows: HTMLCollectionOf<HTMLTableRowElement> = this.tbody.getElementsByTagName('tr');
        let length: number = rows.length;
        for (let i: number = 0; i < length; i++) {
            let row: HTMLTableRowElement = rows[i];
            if (row.getAttribute('data-file') === arg.file && row.getAttribute('data-unit') === arg.unit
                && row.getAttribute('data-id') === arg.segment) {
                let td: HTMLTableCellElement = row.getElementsByClassName('translate')[0] as HTMLTableCellElement;
                if (arg.tagErrors) {
                    td.innerHTML = TranslationView.TAG_WARNING;
                }
                if (arg.spaceErrors) {
                    td.innerHTML = TranslationView.SPACE_WARNING;
                }
                if (arg.tagErrors && arg.spaceErrors) {
                    td.innerHTML = TranslationView.SPACE_TAG_WARNING;
                }
                break;
            }
        }
    }

    clearErrors(arg: any): void {
        let rows: HTMLCollectionOf<HTMLTableRowElement> = this.tbody.getElementsByTagName('tr');
        let length: number = rows.length;
        for (let i: number = 0; i < length; i++) {
            let row: HTMLTableRowElement = rows[i];
            if (row.getAttribute('data-file') === arg.file && row.getAttribute('data-unit') === arg.unit
                && row.getAttribute('data-id') === arg.segment) {
                let td: HTMLTableCellElement = row.getElementsByClassName('translate')[0] as HTMLTableCellElement;
                if (!td.innerHTML.includes(TranslationView.LOCK_FRAGMENT)) {
                    td.innerHTML = TranslationView.SVG_BLANK;
                }
                break;
            }
        }
    }

    showNotes(): void {
        this.electron.ipcRenderer.send('show-notes', {
            project: this.projectId,
            file: this.currentId.file,
            unit: this.currentId.unit,
            segment: this.currentId.id
        });
    }

    showingNotes(arg: boolean): void {
        this.notesVisible = arg;
    }

    notesRemoved(arg: any): void {
        if (this.currentState.innerHTML.includes(TranslationView.NOTE_FRAGMENT)) {
            if (this.currentState.classList.contains('final')) {
                this.currentState.innerHTML = TranslationView.FINAL_SPAN;
            }
            if (this.currentState.classList.contains('initial')) {
                this.currentState.innerHTML = TranslationView.SVG_BLANK;
            }
            if (this.currentState.classList.contains('translated')) {
                this.currentState.innerHTML = TranslationView.TRANSLATED_SPAN;
            }
        }
    }

    notesAdded(arg: any): void {
        if (!this.currentState.innerHTML.includes(TranslationView.NOTE_FRAGMENT)) {
            if (this.currentState.classList.contains('final')) {
                this.currentState.innerHTML = TranslationView.FINAL_SPAN + TranslationView.NOTES_SPAN;
            }
            if (this.currentState.classList.contains('initial')) {
                this.currentState.innerHTML = TranslationView.SVG_BLANK + TranslationView.NOTES_SPAN;
            }
            if (this.currentState.classList.contains('translated')) {
                this.currentState.innerHTML = TranslationView.TRANSLATED_SPAN + TranslationView.NOTES_SPAN;
            }
        }
    }

    updateTarget(arg: any) {
        let rows: HTMLCollectionOf<HTMLTableRowElement> = this.tbody.getElementsByTagName('tr');
        let length: number = rows.length;
        for (let i: number = 0; i < length; i++) {
            let row: HTMLTableRowElement = rows[i];
            if (row.getAttribute('data-file') === arg.file && row.getAttribute('data-unit') === arg.unit
                && row.getAttribute('data-id') === arg.segment) {
                let td: HTMLTableCellElement = row.getElementsByClassName('target')[0] as HTMLTableCellElement;
                let oldTags: number = td.getElementsByTagName('img').length;
                td.innerHTML = arg.target;
                let newTags: number = td.getElementsByTagName('img').length;
                if (oldTags !== newTags) {
                    this.electron.ipcRenderer.send('show-notification', 'Extra tags were removed');
                }
                break;
            }
        }
    }

}