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
import { ThreeHorizontalPanels, ThreeVerticalPanels } from "./divider.js";
import { Main } from "./Main.js";
import { Match } from "./match.js";
import { MetaId } from "./metadata.js";
import { MtMatches } from "./mtMatches.js";
import { Segment } from "./segment.js";
import { FullId, SegmentId } from "./segmentId.js";
import { Tab } from "./tabs.js";
import { TermsPanel } from "./termsPanel.js";
import { TmMatches } from "./tmMatches.js";

export class TranslationView {

    static SVG_BLANK: string = "<svg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 0 24 24' width='24'></svg>";
    static SVG_UNTRANSLATED: string = "<svg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 0 24 24' width='24'>" +
        "<path d='M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z'/></svg>";
    static SVG_TRANSLATED: string = "<svg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 0 24 24' width='24'><g>" +
        "<path d='M19,5v14H5V5H19 M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3L19,3z'/>" +
        "<path d='M14,17H7v-2h7V17z M17,13H7v-2h10V13z M17,9H7V7h10V9z'/></g></svg>";
    static SVG_FINAL: string = "<svg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 0 24 24' width='24'>" +
        "<path d='M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM17.99 9l-1.41-1.42-6.59 6.59-2.58-2.57-1.42 1.41 4 3.99z'/></svg>";
    static SVG_LOCK: string = "<svg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 0 24 24' width='24'>" +
        "<path d='M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z'/></svg>";
    static SVG_WARNING: string = "<svg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 0 24 24' width='24'>" +
        "<path d='M11 15h2v2h-2v-2zm0-8h2v6h-2V7zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z'/></svg>";
    static SVG_NOTE: string = "<svg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 0 24 24' width='24'>" +
        "<path d='M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17l-.59.59-.58.58V4h16v12zm-9-4h2v2h-2zm0-6h2v4h-2z'/></svg>";
    static SVG_EXPAND: string = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px">' +
        '<path d="M460-320v-320L300-480l160 160ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm440-80h120v-560H640v560Zm-80 0v-560H200v560h360Zm80 0h120-120Z"/>' +
        '</svg>';
    static SVG_COLLAPSE: string = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px">' +
        '<path d="M300-640v320l160-160-160-160ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm440-80h120v-560H640v560Zm-80 0v-560H200v560h360Zm80 0h120-120Z"/>' +
        '</svg>';
    static SVG_VERTICAL_EXPAND: string = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M16 12.5H8L12 16.5L16 12.5ZM21 19C21 19.55 20.8042 20.0208 20.4125 20.4125C20.0208 20.8042 19.55 21 19 21H5C4.45 21 3.97917 20.8042 3.5875 20.4125C3.19583 20.0208 3 19.55 3 19V5C3 4.45 3.19583 3.97917 3.5875 3.5875C3.97917 3.19583 4.45 3 5 3H19C19.55 3 20.0208 3.19583 20.4125 3.5875C20.8042 3.97917 21 4.45 21 5V19ZM19 8V5H5V8H19ZM19 10H5V19H19V10Z"/>' +
        '</svg>';
    static SVG_VERTICAL_COLLAPSE: string = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M8 16.5H16L12 12.5L8 16.5ZM21 19C21 19.55 20.8042 20.0208 20.4125 20.4125C20.0208 20.8042 19.55 21 19 21H5C4.45 21 3.97917 20.8042 3.5875 20.4125C3.19583 20.0208 3 19.55 3 19V5C3 4.45 3.19583 3.97917 3.5875 3.5875C3.97917 3.19583 4.45 3 5 3H19C19.55 3 20.0208 3.19583 20.4125 3.5875C20.8042 3.97917 21 4.45 21 5V19ZM19 8V5H5V8H19ZM19 10H5V19H19V10Z"/>' +
        '</svg>';
    static SVG_COMMENT: string = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M200-200h360v-200h200v-360H200v560Zm0 80q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v400L600-120H200Zm80-280v-80h200v80H280Zm0-160v-80h400v80H280Zm-80 360v-560 560Z"/></svg>';
    static SVG_EDIT_COMMENT: string = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M657-121 544-234l56-56 57 57 127-127 56 56-183 183Zm-537 1v-80h360v80H120Zm0-160v-80h360v80H120Zm0-160v-80h720v80H120Zm0-160v-80h720v80H120Zm0-160v-80h720v80H120Z"/></svg>';

    static FILE_INFO: string = "<svg xmlns='http://www.w3.org/2000/svg' height='20px' viewBox='0 -960 960 960' width='20px'><path d='M444-288h72v-240h-72v240Zm35.79-312q15.21 0 25.71-10.29t10.5-25.5q0-15.21-10.29-25.71t-25.5-10.5q-15.21 0-25.71 10.29t-10.5 25.5q0 15.21 10.29 25.71t25.5 10.5Zm.49 504Q401-96 331-126t-122.5-82.5Q156-261 126-330.96t-30-149.5Q96-560 126-629.5q30-69.5 82.5-122T330.96-834q69.96-30 149.5-30t149.04 30q69.5 30 122 82.5T834-629.28q30 69.73 30 149Q864-401 834-331t-82.5 122.5Q699-156 629.28-126q-69.73 30-149 30Zm-.28-72q130 0 221-91t91-221q0-130-91-221t-221-91q-130 0-221 91t-91 221q0 130 91 221t221 91Zm0-312Z'/></svg>";
    static HAS_COMMENT: string = '<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px"><path d="M288-288h288v-72H288v72Zm0-156h384v-72H288v72Zm0-156h384v-72H288v72Zm-72 456q-29.7 0-50.85-21.15Q144-186.3 144-216v-528q0-29.7 21.15-50.85Q186.3-816 216-816h528q29.7 0 50.85 21.15Q816-773.7 816-744v528q0 29.7-21.15 50.85Q773.7-144 744-144H216Zm0-72h528v-528H216v528Zm0-528v528-528Z"/></svg>';
    static NO_COMMENT: string = '<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px"><path d="M204-120q-34.65 0-59.32-24.68Q120-169.35 120-204v-552q0-34.65 24.68-59.33Q169.35-840 204-840h552q34.65 0 59.33 24.67Q840-790.65 840-756v552q0 34.65-24.67 59.32Q790.65-120 756-120H204Zm0-84h552v-552H204v552Zm0 0v-552 552Z"/></svg>';

    static LOCK_SPAN: string = "<span class='iconTooltip'>" + this.SVG_LOCK + " <small class='tooltiptext'>Locked segment</small></span>";
    static FINAL_SPAN: string = "<span class='iconTooltip'>" + this.SVG_FINAL + " <small class='tooltiptext'>Confirmed</small></span>";
    static TRANSLATED_SPAN: string = "<span class='iconTooltip'>" + this.SVG_TRANSLATED + " <small class='tooltiptext'>Draft</small></span>";
    static NOTES_SPAN: string = "<span class='iconTooltip'>" + this.SVG_NOTE + " <small class='tooltiptext'>Segment has notes</small></span>";
    static COMMENT_SPAN: string = this.SVG_COMMENT + " <small class='tooltiptext'>Review comments</small>";
    static EDIT_COMMENT_SPAN: string = this.SVG_EDIT_COMMENT + '<span class="tooltiptext bottomTooltip">Show/Hide Review Comments</span>';
    static SPACE_WARNING: string = "<span class='iconTooltip'>" + this.SVG_WARNING + " <small class='tooltiptext'>Space errors</small></span>";
    static TAG_WARNING: string = "<span class='iconTooltip'>" + this.SVG_WARNING + " <small class='tooltiptext'>Tag errors</small></span>";
    static SPACE_TAG_WARNING: string = "<span class='iconTooltip'>" + this.SVG_WARNING + " <small class='tooltiptext'>Tag and space errors</small></span>";

    static LOCK_FRAGMENT: string = 'M18 8h-1V6c0-2.76-2';
    static NOTE_FRAGMENT: string = 'M20 2H4c-1.1 0-1.99';
    static readonly MIN_PANEL_WIDTH: number = 40;
    static readonly MIN_SUBPANEL_HEIGHT: number = 40;

    container: HTMLDivElement;
    topBar: HTMLDivElement;
    observer: MutationObserver | undefined;
    rowsObserver: MutationObserver | undefined;
    filesPanelWidthObserver: MutationObserver | undefined;
    rightPanelWidthObserver: MutationObserver | undefined;

    verticalPanels: ThreeVerticalPanels;
    mainArea: HTMLDivElement;
    filesPanel: HTMLDivElement;
    filesContainer: HTMLDivElement = document.createElement('div');
    translationArea: HTMLDivElement;
    rightPanel: HTMLDivElement;

    projectId: string;
    srcLang: string;
    tgtLang: string;
    tbody: HTMLTableSectionElement;

    zoom: number = 1.0;

    maxPage: number = 0;
    currentPage: number = 0;
    rowsPage: number = 500;
    segmentsCount: number = 0;
    statistics: HTMLDivElement;

    currentRow: HTMLTableRowElement | undefined;
    currentCell: HTMLTableCellElement | undefined;
    currentContent: string = '';
    currentId: SegmentId = { id: '', file: '', unit: '' };
    sourceTags: Map<string, string>;
    files: any[] = [];

    collapseFilesButton: HTMLAnchorElement;
    expandFilesButton: HTMLAnchorElement;

    collapseRightButton: HTMLAnchorElement;
    expandRightButton: HTMLAnchorElement;

    collapseMatchesButton: HTMLAnchorElement;
    expandMatchesButton: HTMLAnchorElement;
    collapseMtButton: HTMLAnchorElement;
    expandMtButton: HTMLAnchorElement;
    collapseTermsButton: HTMLAnchorElement;
    expandTermsButton: HTMLAnchorElement;

    rightHorizontalPanels: ThreeHorizontalPanels | undefined;

    matchesHiddenBeforePanelCollapse: boolean = false;
    mtHiddenBeforePanelCollapse: boolean = false;
    termsHiddenBeforePanelCollapse: boolean = false;

    matchesContainer: HTMLDivElement = document.createElement('div');
    termsContainer: HTMLDivElement = document.createElement('div');
    mtContainer: HTMLDivElement = document.createElement('div');

    filterButton: HTMLAnchorElement;
    sortButton: HTMLAnchorElement;
    filterText: string = '';
    filterLanguage: string = 'source';
    caseSensitiveFilter: boolean = false;
    regExp: boolean = false;
    showUntranslated: boolean = true;
    showTranslated: boolean = true;
    showConfirmed: boolean = true;
    showReviewed: boolean = true;

    sortOption: string = 'none';
    sortDesc: boolean = false;

    tmMatches: TmMatches | undefined;
    mtMatches: MtMatches | undefined;
    termsPanel: TermsPanel | undefined;

    memSelect: HTMLSelectElement;
    glossSelect: HTMLSelectElement;

    returnTo: SegmentId = { file: '', unit: '', id: '' };
    returnNumber: number = -1;

    notesVisible: boolean = false;
    commentsVisible: boolean = false;

    constructor(tab: Tab, projectId: string, sourceLang: string, targetLang: string, rows: number) {
        this.container = tab.getContainer();
        this.projectId = projectId;
        this.srcLang = sourceLang;
        this.tgtLang = targetLang;
        this.rowsPage = rows;

        this.memSelect = document.createElement('select');
        this.glossSelect = document.createElement('select');
        this.tbody = document.createElement('tbody');
        this.filterButton = document.createElement('a');
        this.sortButton = document.createElement('a');
        this.statistics = document.createElement('div');

        this.sourceTags = new Map<string, string>();
        this.topBar = document.createElement('div');
        this.topBar.className = 'toolbar';
        this.container.appendChild(this.topBar);

        this.buildTopBar();

        this.collapseFilesButton = document.createElement('a');
        this.expandFilesButton = document.createElement('a');

        this.collapseRightButton = document.createElement('a');
        this.expandRightButton = document.createElement('a');

        this.collapseMatchesButton = document.createElement('a');
        this.expandMatchesButton = document.createElement('a');
        this.collapseMtButton = document.createElement('a');
        this.expandMtButton = document.createElement('a');
        this.collapseTermsButton = document.createElement('a');
        this.expandTermsButton = document.createElement('a');

        this.mainArea = document.createElement('div');
        this.mainArea.id = 'main' + projectId;
        this.mainArea.style.display = 'flex';
        this.container.appendChild(this.mainArea);

        this.verticalPanels = new ThreeVerticalPanels(this.mainArea);
        this.verticalPanels.setWeights([16, 64, 20]);

        // Capture PageUp/PageDown for locked segments and navigate instead of scrolling
        let keyNavHandler: (event: KeyboardEvent) => void = (event: KeyboardEvent) => {
            if (!this.currentRow) {
                return;
            }
            if (event.key === 'PageDown' || event.key === 'PageUp') {
                let translateCell: HTMLTableCellElement = this.currentRow.getElementsByClassName('translate')[0] as HTMLTableCellElement;
                let isLocked: boolean = translateCell && translateCell.innerHTML.includes(TranslationView.LOCK_FRAGMENT);
                if (isLocked && !(event.ctrlKey || event.metaKey)) {
                    event.preventDefault();
                    if (event.key === 'PageDown') {
                        this.gotoNext();
                    } else {
                        this.gotoPrevious();
                    }
                }
            }
        };
        let keyNavObserver: MutationObserver = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    let hidden: boolean = this.container.classList.contains('hidden');
                    if (hidden) {
                        document.removeEventListener('keydown', keyNavHandler, true);
                    } else {
                        document.addEventListener('keydown', keyNavHandler, true);
                    }
                }
            }
        });
        keyNavObserver.observe(this.container, { attributes: true, childList: false, subtree: false });
        if (!this.container.classList.contains('hidden')) {
            document.addEventListener('keydown', keyNavHandler, true);
        }

        this.filesPanel = this.verticalPanels.leftPanel();
        this.filesPanel.style.height = '100%';

        this.translationArea = this.verticalPanels.centerPanel();
        this.translationArea.style.height = '100%';

        this.rightPanel = this.verticalPanels.rightPanel();
        this.rightPanel.style.height = '100%';

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

        this.buildFilesArea();
        this.buildTranslationArea();
        this.buildRightSide();

        ipcRenderer.on('set-segments-count', (event: IpcRendererEvent, arg: any) => {
            if (arg.project === this.projectId) {
                this.setSegmentsCount(arg.count);
            }
        });
        ipcRenderer.on('set-segments', (event: IpcRendererEvent, arg: any) => {
            if (arg.project === this.projectId) {
                this.setSegments(arg.segments);
            }
        });
        ipcRenderer.on('count-changed', (event: IpcRendererEvent, arg: any) => {
            if (arg.project === this.projectId) {
                ipcRenderer.send('get-segments-count', { project: this.projectId });
            }
        });
        this.watchSizes();

        setTimeout(() => {
            this.setSize();
        }, 200);

        ipcRenderer.send('get-segments-count', { project: this.projectId });
        ipcRenderer.send('get-project-memories', { project: this.projectId });
        ipcRenderer.send('get-project-glossaries', { project: this.projectId });
        ipcRenderer.on('request-memories', () => {
            ipcRenderer.send('get-project-memories', { project: this.projectId });
        });
        ipcRenderer.on('request-glossaries', () => {
            ipcRenderer.send('get-project-glossaries', { project: this.projectId });
        });
        ipcRenderer.send('get-zoom');
        ipcRenderer.on('set-zoom', (event: IpcRendererEvent, arg: any) => {
            this.setZoom(arg.zoom);
        });
        this.setSpellChecker();
    }

    selectFile(file: string): void {
        let selectedFile = this.filesContainer.querySelector('[data-file="'+file+'"]');
        if (selectedFile) {
            this.filesContainer.getElementsByClassName('selectedFile')[0]?.classList.remove('selectedFile');
        }
        this.filesContainer.querySelector('[data-file="'+file+'"]')?.classList.add('selectedFile');
    }

    setFiles(files: any[]): void {
        this.files = files;
        this.drawFiles();
    }

    drawFiles(): void {
        this.filesContainer.innerHTML = '';

        let filesTable: HTMLTableElement = document.createElement('table');
        filesTable.className = 'filesTable';
        this.filesContainer.appendChild(filesTable);

        for (const file of this.files) {
            let sourceFile: string = file.sourceFile;
            let detailsArray: any[] = file.files;

            if (detailsArray.length === 1) {
                let tr: HTMLTableRowElement = document.createElement('tr');
                tr.setAttribute('data-file', detailsArray[0].file);
                filesTable.appendChild(tr);

                let td: HTMLTableCellElement = document.createElement('td');
                td.style.width = '24px';
                let infoSpan: HTMLSpanElement = document.createElement('span');
                infoSpan.classList.add('iconTooltip');
                infoSpan.classList.add('sourceSymbol');
                infoSpan.innerHTML = TranslationView.FILE_INFO + '<small class="tooltiptext">File Info</small>';
                infoSpan.addEventListener('click', () => {
                    this.showFileInfo(detailsArray[0]);
                });
                td.appendChild(infoSpan);
                tr.appendChild(td);

                td = document.createElement('td');
                td.style.width = '24px';
                let metaSpan: HTMLSpanElement = document.createElement('span');
                metaSpan.classList.add('iconTooltip');
                metaSpan.classList.add('sourceSymbol');
                metaSpan.addEventListener('click', () => {
                    this.showFileMetadata(detailsArray[0]);
                });
                if (this.hasCustomMetadata(detailsArray[0].customdata)) {
                    metaSpan.innerHTML = TranslationView.HAS_COMMENT + '<small class="tooltiptext">Review Comments</small>';
                } else {
                    metaSpan.innerHTML = TranslationView.NO_COMMENT + '<small class="tooltiptext">Review Comments</small>';
                }
                td.appendChild(metaSpan);
                tr.appendChild(td);

                td = document.createElement('td');
                td.classList.add('noWrap');
                td.classList.add('fileName');
                td.addEventListener('click', () => {
                    ipcRenderer.send('goto-file', { project: this.projectId, file: detailsArray[0].file });
                });
                td.innerText = sourceFile;
                tr.appendChild(td);
            } else {
                let tr: HTMLTableRowElement = document.createElement('tr');
                tr.classList.add('sourceFile');

                let td: HTMLTableCellElement = document.createElement('td');
                td.classList.add('middle');
                td.classList.add('noWrap');
                td.innerText = sourceFile;
                td.colSpan = 3;
                tr.appendChild(td);
                filesTable.appendChild(tr);

                for (const details of detailsArray) {
                    let tr: HTMLTableRowElement = document.createElement('tr');
                    tr.setAttribute('data-file', details.file);
                    filesTable.appendChild(tr);

                    let td: HTMLTableCellElement = document.createElement('td');
                    td.style.width = '24px';
                    let infoSpan: HTMLSpanElement = document.createElement('span');
                    infoSpan.classList.add('iconTooltip');
                    infoSpan.classList.add('sourceSymbol');
                    infoSpan.innerHTML = TranslationView.FILE_INFO + '<small class="tooltiptext">File Info</small>';
                    infoSpan.addEventListener('click', () => {
                        this.showFileInfo(details);
                    });
                    td.appendChild(infoSpan);
                    tr.appendChild(td);

                    td = document.createElement('td');
                    td.style.width = '24px';
                    let metaSpan: HTMLSpanElement = document.createElement('span');
                    metaSpan.classList.add('iconTooltip');
                    metaSpan.classList.add('sourceSymbol');
                    metaSpan.addEventListener('click', () => {
                        this.showFileMetadata(details);
                    });
                    if (this.hasCustomMetadata(details.customdata)) {
                        metaSpan.innerHTML = TranslationView.HAS_COMMENT + '<small class="tooltiptext">File Metadata</small>';
                    } else {
                        metaSpan.innerHTML = TranslationView.NO_COMMENT + '<small class="tooltiptext">File Metadata</small>';
                    }
                    td.appendChild(metaSpan);
                    tr.appendChild(td);

                    td = document.createElement('td');
                    td.classList.add('middle');
                    td.classList.add('noWrap');
                    td.classList.add('fileName');
                    td.innerText = details.original;
                    td.addEventListener('click', () => {
                        ipcRenderer.send('goto-file', { project: this.projectId, file: details.file });
                    });
                    tr.appendChild(td);
                }
            }
        }
        if (this.currentRow) {
            let file: string = this.currentRow.getAttribute('data-file') || '';
            this.selectFile(file);
        }
        setTimeout(() => {
            if (filesTable.getElementsByTagName('tr').length === 1) {
                this.collapseFilesButton.click();
            }
        }, 150);
    }

    showFileMetadata(details: any) {
        ipcRenderer.send('show-metadata', { project: this.projectId, file: details.file });
    }

    showFileInfo(details: any) {
        let metadata: any = details.metadata;
        let data: any[] = metadata.data;
        let array: any[] = [];
        for (let i = 0; i < data.length; i++) {
            let meta: any = data[i];
            let category: string = meta.category || '';
            if (category === 'format' || category === 'tool' || category === 'PI' || category === 'sourceFile' || category === 'document') {
                array.push(meta);
            }
        }
        let info: any = {
            original: details.original,
            id: details.file,
            metadata: array
        };
        ipcRenderer.send('show-file-info', info);
    }

    hasCustomMetadata(metadata: any): boolean {
        let keys: string[] = Object.keys(metadata);
        return keys.length > 0;
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
        exportTranslations.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">'
            + '<path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z"/>' +
            '</svg>' +
            '<span class="tooltiptext bottomTooltip">Export Translations/Reviews</span>';
        exportTranslations.className = 'tooltip bottomTooltip';
        exportTranslations.addEventListener('click', () => {
            this.exportTranslations();
        });
        this.topBar.appendChild(exportTranslations);

        let saveButton: HTMLAnchorElement = document.createElement('a');
        saveButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">'
            + '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z"/>' +
            '</svg>' +
            '<span class="tooltiptext bottomTooltip">Save Changes</span>';
        saveButton.className = 'tooltip bottomTooltip';
        saveButton.style.marginLeft = '10px';
        saveButton.addEventListener('click', () => {
            this.saveEdit({ confirm: false, next: 'none' });
        });
        this.topBar.appendChild(saveButton);

        let cancelEdit: HTMLAnchorElement = document.createElement('a');
        cancelEdit.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">'
            + '<path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.59-13L12 10.59 8.41 7 7 8.41 10.59 12 7 15.59 8.41 17 12 13.41 15.59 17 17 15.59 13.41 12 17 8.41z"/>' +
            '</svg>' +
            '<span class="tooltiptext bottomTooltip">Discard Changes</span>';
        cancelEdit.className = 'tooltip bottomTooltip';
        cancelEdit.addEventListener('click', () => {
            this.cancelEdit();
        });
        this.topBar.appendChild(cancelEdit);

        let confirmEdit: HTMLAnchorElement = document.createElement('a');
        confirmEdit.innerHTML = TranslationView.SVG_FINAL +
            '<span class="tooltiptext bottomTooltip">Confirm Translation</span>';
        confirmEdit.className = 'tooltip bottomTooltip';
        confirmEdit.style.marginLeft = '10px';
        confirmEdit.addEventListener('click', () => {
            this.saveEdit({ confirm: true, next: 'none' });
        });
        this.topBar.appendChild(confirmEdit);

        let confirmNextUntranslated: HTMLAnchorElement = document.createElement('a');
        confirmNextUntranslated.innerHTML = TranslationView.SVG_UNTRANSLATED +
            '<span class="tooltiptext bottomTooltip">Confirm and go to Next Untranslated</span>';
        confirmNextUntranslated.className = 'tooltip bottomTooltip';
        confirmNextUntranslated.addEventListener('click', () => {
            this.saveEdit({ confirm: true, next: 'untranslated' });
        });
        this.topBar.appendChild(confirmNextUntranslated);

        let confirmNextUnconfirmed: HTMLAnchorElement = document.createElement('a');
        confirmNextUnconfirmed.innerHTML = TranslationView.SVG_TRANSLATED +
            '<span class="tooltiptext bottomTooltip">Confirm and go to Next Uncornfirmed</span>';
        confirmNextUnconfirmed.className = 'tooltip bottomTooltip';
        confirmNextUnconfirmed.addEventListener('click', () => {
            this.saveEdit({ confirm: true, next: 'unconfirmed' });
        });
        this.topBar.appendChild(confirmNextUnconfirmed);

        let goToLink: HTMLAnchorElement = document.createElement('a');
        goToLink.style.marginLeft = '10px';
        goToLink.classList.add('tooltip');
        goToLink.classList.add('bottomTooltip');
        goToLink.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">'
            + '<path d="M17.27 6.73l-4.24 10.13-1.32-3.42-.32-.83-.82-.32-3.43-1.33 10.13-4.23M21 3L3 10.53v.98l6.84 2.65L12.48 21h.98L21 3z"/>' +
            '</svg>' +
            '<span class="tooltiptext bottomTooltip">Go To Segment...</span>';
        goToLink.addEventListener('click', () => {
            ipcRenderer.send('show-go-to-window');
        });
        this.topBar.appendChild(goToLink);

        let goToSource: HTMLAnchorElement = document.createElement('a');
        goToSource.classList.add('tooltip');
        goToSource.classList.add('bottomTooltip');
        goToSource.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M2 9V6.9H13V9H2ZM2 4.1V2H13V4.1H2Z"/>' +
            '<path d="M15.7 22L13.4833 16.5167L8 14.3V13.2111L22 8L16.7889 22H15.7ZM16.2056 19.1222L19.3556 10.6444L10.8778 13.7944L14.6889 15.3111L16.2056 19.1222Z"/>' +
            '</svg>' +
            '<span class="tooltiptext bottomTooltip">Go To Next Segment With Same Source</span>';
        goToSource.addEventListener('click', () => {
            this.goToSameSource();
        });
        this.topBar.appendChild(goToSource);

        let splitButton: HTMLAnchorElement = document.createElement('a');
        splitButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">'
            + '<path d="M8 19h3v4h2v-4h3l-4-4-4 4zm8-14h-3V1h-2v4H8l4 4 4-4zM4 11v2h16v-2H4z" />' +
            '</svg>' +
            '<span class="tooltiptext bottomTooltip">Split Segment</span>';
        splitButton.className = 'tooltip bottomTooltip';
        splitButton.style.marginLeft = '10px';
        splitButton.addEventListener('click', () => {
            this.splitSegment();
        });
        this.topBar.appendChild(splitButton);

        let mergeButton: HTMLAnchorElement = document.createElement('a');
        mergeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">'
            + '<path d="M16 13h-3V3h-2v10H8l4 4 4-4zM4 19v2h16v-2H4z" />' +
            '</svg>' +
            '<span class="tooltiptext bottomTooltip">Merge With Next Segment</span>';
        mergeButton.className = 'tooltip bottomTooltip';
        mergeButton.addEventListener('click', () => {
            this.mergeNext();
        });
        this.topBar.appendChild(mergeButton);

        this.sortButton.innerHTML = '<svg version="1.1" viewBox="0 0 24 24" height="24" width="24">'
            + '<path style="stroke-width:0.1" d="m 8.666667,10.444444 v 3.111112 H 12 L 7,19 2,13.555556 H 5.333333 V 10.444444 H 2 L 7,5 12,10.444444 Z M 22,14.333333 h -8.333333 v 1.555556 H 22 Z M 22,19 H 13.666667 V 17.444444 H 22 Z m 0,-6.222222 H 13.666667 V 11.222222 H 22 Z M 22,9.6666667 H 13.666667 V 8.1111111 H 22 Z M 22,6.5555556 H 13.666667 V 5 H 22 Z" />' +
            '</svg>' +
            '<span class="tooltiptext bottomTooltip">Sort Segments</span>';
        this.sortButton.className = 'tooltip bottomTooltip';
        this.sortButton.style.marginLeft = '10px';
        this.sortButton.addEventListener('click', () => {
            this.sortSegments();
        });
        this.topBar.appendChild(this.sortButton);

        this.filterButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 24 24" height="24" width="24">'
            + '<path style="stroke-width:0.1" d="M 18.091348,3.6666667 11.913044,14.119167 v 4.936666 l -0.826087,-0.5 V 14.119167 L 4.9086522,3.6666667 Z M 21,2 H 2 L 9.4347826,14.578333 V 19.5 L 13.565217,22 v -7.421667 z"/>' +
            '</svg>' +
            '<span class="tooltiptext bottomTooltip">Filter Segments</span>';
        this.filterButton.className = 'tooltip bottomTooltip';
        this.filterButton.addEventListener('click', () => {
            this.filterSegments();
        });
        this.topBar.appendChild(this.filterButton);

        let replaceText: HTMLAnchorElement = document.createElement('a');
        replaceText.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">' +
            '<path d="M11 6c1.38 0 2.63.56 3.54 1.46L12 10h6V4l-2.05 2.05C14.68 4.78 12.93 4 11 4c-3.53 0-6.43 2.61-6.92 6H6.1c.46-2.28 2.48-4 4.9-4zm5.64 9.14c.66-.9 1.12-1.97 1.28-3.14H15.9c-.46 2.28-2.48 4-4.9 4-1.38 0-2.63-.56-3.54-1.46L10 12H4v6l2.05-2.05C7.32 17.22 9.07 18 11 18c1.55 0 2.98-.51 4.14-1.36L20 21.49 21.49 20l-4.85-4.86z"/>' +
            '</svg>' +
            '<span class="tooltiptext bottomTooltip">Replace Text</span>';
        replaceText.className = 'tooltip bottomTooltip';
        replaceText.addEventListener('click', () => {
            this.replaceText();
        });
        this.topBar.appendChild(replaceText);

        let statisticsButton: HTMLAnchorElement = document.createElement('a');
        statisticsButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">' +
            '<path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2.5 2.1h-15V5h15v14.1zm0-16.1h-15c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>' +
            '</svg>' +
            '<span class="tooltiptext bottomTooltip">Project Statistics</span>';
        statisticsButton.className = 'tooltip bottomTooltip';
        statisticsButton.style.marginLeft = '10px';
        statisticsButton.addEventListener('click', () => {
            this.generateStatistics();
        });
        this.topBar.appendChild(statisticsButton);

        let htmlExportButton: HTMLAnchorElement = document.createElement('a');
        htmlExportButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24" viewBox="0 0 24 24" width="24">'
            + '<path d="M19,3H5C3.89,3,3,3.9,3,5v14c0,1.1,0.89,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.11,3,19,3z M19,19H5V7h14V19z M17,12H7v-2 h10V12z M13,16H7v-2h6V16z"/>' +
            '</svg>' +
            '<span class="tooltiptext bottomTooltip">Export HTML</span>';
        htmlExportButton.className = 'tooltip bottomTooltip';
        htmlExportButton.addEventListener('click', () => {
            this.exportHTML();
        });
        this.topBar.appendChild(htmlExportButton);

        let concordanceButton: HTMLAnchorElement = document.createElement('a');
        concordanceButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
            '<path d="M21.172 24l-7.387-7.387c-1.388.874-3.024 1.387-4.785 1.387-4.971 0-9-4.029-9-9s4.029-9 9-9 9 4.029 9 9c0 1.761-.514 3.398-1.387 4.785l7.387 7.387-2.828 2.828zm-12.172-8c3.859 0 7-3.14 7-7s-3.141-7-7-7-7 3.14-7 7 3.141 7 7 7z"/>' +
            '</svg>' +
            '<span class="tooltiptext bottomTooltip">Concordance Search</span>';
        concordanceButton.className = 'tooltip bottomTooltip';
        concordanceButton.style.marginLeft = '10px';
        concordanceButton.addEventListener('click', () => {
            this.concordanceSearch();
        });
        this.topBar.appendChild(concordanceButton);

        let notesButton: HTMLAnchorElement = document.createElement('a');
        notesButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">' +
            '<path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17l-.59.59-.58.58V4h16v12zM6 12h2v2H6zm0-3h2v2H6zm0-3h2v2H6zm4 6h5v2h-5zm0-3h8v2h-8zm0-3h8v2h-8z"/>' +
            '</svg>' +
            '<span class="tooltiptext bottomTooltip">Show/Hide Notes</span>';
        notesButton.className = 'tooltip bottomTooltip';
        notesButton.style.marginLeft = '10px';
        notesButton.addEventListener('click', () => {
            this.showNotes();
        });
        this.topBar.appendChild(notesButton);

        let metadataButton: HTMLAnchorElement = document.createElement('a');
        metadataButton.innerHTML = TranslationView.EDIT_COMMENT_SPAN;
        metadataButton.className = 'tooltip bottomTooltip';
        metadataButton.addEventListener('click', () => {
            this.showReviewComments();
        });
        this.topBar.appendChild(metadataButton);

        let addTermButton: HTMLAnchorElement = document.createElement('a');
        addTermButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">' +
            '<path d="M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z"/>' +
            '</svg>' +
            '<span class="tooltiptext bottomTooltip">Add Term to Glossary</span>';
        addTermButton.className = 'tooltip bottomTooltip';
        addTermButton.style.marginLeft = '10px';
        addTermButton.addEventListener('click', () => {
            this.addTerm();
        });
        this.topBar.appendChild(addTermButton);

        let termSearchButton: HTMLAnchorElement = document.createElement('a');
        termSearchButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
            '<path d="M13 8h-8v-1h8v1zm0 2h-8v-1h8v1zm-3 2h-5v-1h5v1zm11.172 12l-7.387-7.387c-1.388.874-3.024 1.387-4.785 1.387-4.971 0-9-4.029-9-9s4.029-9 9-9 9 4.029 9 9c0 1.761-.514 3.398-1.387 4.785l7.387 7.387-2.828 2.828zm-12.172-8c3.859 0 7-3.14 7-7s-3.141-7-7-7-7 3.14-7 7 3.141 7 7 7z"/>' +
            '</svg>' +
            '<span class="tooltiptext bottomTooltip">Search Term in Glossary</span>';
        termSearchButton.className = 'tooltip bottomTooltip';
        termSearchButton.addEventListener('click', () => {
            this.searchTerm();
        });
        this.topBar.appendChild(termSearchButton);

        let tagsAnalysisButton: HTMLAnchorElement = document.createElement('a');
        tagsAnalysisButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">' +
            '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-7-2h2V7h-4v2h2z"/>' +
            '</svg>' +
            '<span class="tooltiptext bottomTooltip">Check Inline Tags</span>';
        tagsAnalysisButton.className = 'tooltip bottomTooltip';
        tagsAnalysisButton.style.marginLeft = '10px';
        tagsAnalysisButton.addEventListener('click', () => {
            ipcRenderer.send('analyze-tags', this.projectId);
        });
        this.topBar.appendChild(tagsAnalysisButton);

        let spaceAnalysisButton: HTMLAnchorElement = document.createElement('a');
        spaceAnalysisButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">' +
            '<path d="M3 21h18v-2H3v2zM3 8v8l4-4-4-4zm8 9h10v-2H11v2zM3 3v2h18V3H3zm8 6h10V7H11v2zm0 4h10v-2H11v2z"/>' +
            '</svg>' +
            '<span class="tooltiptext bottomTooltip">Check Initial/Trailing Spaces</span>';
        spaceAnalysisButton.className = 'tooltip bottomTooltip';
        spaceAnalysisButton.addEventListener('click', () => {
            ipcRenderer.send('analyze-spaces', this.projectId);
        });
        this.topBar.appendChild(spaceAnalysisButton);

        let fixTagsButton: HTMLAnchorElement = document.createElement('a');
        fixTagsButton.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M2.11786 20.3562L5.83503 16.6165C5.4674 15.6713 5.67164 14.5617 6.44775 13.7809C7.26471 12.959 8.49015 12.7946 9.4705 13.2466L7.71404 15.0137L8.93948 16.2466L10.7368 14.4795C11.227 15.4658 11.0227 16.6987 10.2058 17.5206C9.42965 18.3014 8.32676 18.5069 7.38725 18.137L3.67009 21.8767C3.5067 22.0411 3.26161 22.0411 3.09822 21.8767L2.15871 20.9315C1.95447 20.7671 1.95447 20.4795 2.11786 20.3562Z" />' +
            '<rect x="11" y="3" width="10" height="10" stroke-width="2" stroke-linejoin="round" fill="none" />' +
            '<line x1="15" y1="6" x2="18" y2="6" stroke-width="2"/>' +
            '<path d="M17 7V11"  stroke-width="2"/>' +
            '</svg>' +
            '<span class="tooltiptext bottomTooltip">Fix Tags with AI</span>';
        fixTagsButton.className = 'tooltip bottomTooltip';
        fixTagsButton.style.marginLeft = '10px';
        fixTagsButton.addEventListener('click', () => {
            this.fixTags();
        });
        this.topBar.appendChild(fixTagsButton);

        let promptButton: HTMLAnchorElement = document.createElement('a');
        promptButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" >' +
            '<path d="M240-280h480v-120H240v120Zm-80 120q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm0-80h640v-480H160v480Zm0 0v-480 480Z"/>' +
            '</svg>' +
            '<span class="tooltiptext bottomTooltip">Open AI Prompt Dialog</span>';
        promptButton.className = 'tooltip bottomTooltip';
        promptButton.addEventListener('click', () => {
            this.openAiPrompt();
        });
        this.topBar.appendChild(promptButton);

        let insertAiTransltionButton: HTMLAnchorElement = document.createElement('a');
        insertAiTransltionButton.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M16 17.67L13.41 15.09L12 16.5L17 21.5L22 16.5L20.59 15.09L18 17.67V8H16V17.67Z"/>' +
            '<path d="M2 3H14" stroke-width="2"/>' +
            '<path d="M2 7H14" stroke-width="2"/>' +
            '<path d="M2 11H14" stroke-width="2"/>' +
            '</svg>' +
            '<span class="tooltiptext bottomTooltip">Insert AI Response in Segment</span>';
        insertAiTransltionButton.className = 'tooltip bottomTooltip';
        insertAiTransltionButton.addEventListener('click', () => {
            ipcRenderer.send('paste-response');
        });
        this.topBar.appendChild(insertAiTransltionButton);

        let iateSearchButton: HTMLAnchorElement = document.createElement('a');
        iateSearchButton.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M10.5 2L11.2858 4.41844H13.8287L11.7714 5.91312L12.5572 8.33156L10.5 6.83688L8.44275 8.33156L9.22855 5.91312L7.1713 4.41844H9.7142L10.5 2Z"/>' +
            '<path d="M6.5 8L7.2858 10.4184H9.8287L7.77145 11.9131L8.55725 14.3316L6.5 12.8369L4.44275 14.3316L5.22855 11.9131L3.1713 10.4184H5.7142L6.5 8Z"/>' +
            '<path d="M7.5 15L8.2858 17.4184H10.8287L8.77145 18.9131L9.55725 21.3316L7.5 19.8369L5.44275 21.3316L6.22855 18.9131L4.1713 17.4184H6.7142L7.5 15Z"/>' +
            '<path d="M19.12 19.42H20.38C20.58 19.42 20.68 19.52 20.68 19.72V20.7C20.68 20.9 20.58 21 20.38 21H15.62C15.42 21 15.32 20.9 15.32 20.7V19.72C15.32 19.52 15.42 19.42 15.62 19.42C15.62 19.42 16.04 19.42 16.88 19.42V12.74H15.8C15.6 12.74 15.5 12.64 15.5 12.44V11.4C15.5 11.2 15.6 11.1 15.8 11.1H18.82C19.02 11.1 19.12 11.2 19.12 11.4V19.42ZM16.7 9.32C16.4467 9.05333 16.32 8.71333 16.32 8.3C16.32 7.88667 16.4467 7.54667 16.7 7.28C16.9667 7 17.3133 6.86 17.74 6.86C18.18 6.86 18.5267 7 18.78 7.28C19.0467 7.54667 19.18 7.88667 19.18 8.3C19.18 8.71333 19.0467 9.05333 18.78 9.32C18.5133 9.58667 18.16 9.72 17.72 9.72C17.2933 9.72 16.9533 9.58667 16.7 9.32Z"/>' +
            '</svg>' +
            '<span class="tooltiptext bottomTooltip">Search on IATE</span>';
        iateSearchButton.className = 'tooltip bottomTooltip';
        iateSearchButton.style.marginLeft = '10px';
        iateSearchButton.addEventListener('click', () => {
            ipcRenderer.send('search-iate');
        });
        this.topBar.appendChild(iateSearchButton);

        let filler1: HTMLSpanElement = document.createElement('span');
        filler1.innerHTML = '&nbsp;';
        filler1.className = 'fill_width';
        this.topBar.appendChild(filler1);

        let filler2: HTMLSpanElement = document.createElement('span');
        filler2.innerHTML = '&nbsp;';
        filler2.className = 'fill_width';
        this.topBar.appendChild(filler2);

        let memLabel: HTMLLabelElement = document.createElement('label');
        memLabel.style.marginTop = '4px';
        memLabel.innerHTML = 'Memory';
        memLabel.setAttribute('for', 'memSelect' + this.projectId);
        this.topBar.appendChild(memLabel);

        this.memSelect.id = 'memSelect' + this.projectId;
        this.memSelect.style.marginTop = '4px';
        this.memSelect.style.minWidth = '180px';
        this.memSelect.addEventListener('change', () => {
            ipcRenderer.send('set-project-memory', { project: this.projectId, memory: this.memSelect.value });
        });
        this.topBar.appendChild(this.memSelect);

        let requestTranslation: HTMLAnchorElement = document.createElement('a');
        requestTranslation.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
            '<path d="M21 21h-1.713l-.658-1.846h-3l-.663 1.846h-1.659l3.04-8h1.603l3.05 8zm-2.814-3.12l-1.049-3.018-1.054 3.018h2.103zm-9.464-12.037l.125-.562-1.02-.199-.101.464c-.345-.05-.712-.057-1.083-.019.009-.249.023-.494.045-.728h1.141v-.966h-1.004c.049-.246.092-.394.134-.533l-.997-.3c-.072.245-.134.484-.195.833h-1.138v.966h1.014c-.027.312-.043.637-.048.964-1.119.411-1.595 1.195-1.595 1.905 0 .84.663 1.578 1.709 1.482 1.301-.118 2.169-1.1 2.679-2.308.525.303.746.814.548 1.286-.185.436-.725.852-1.757.831v1.041c1.146.018 2.272-.417 2.715-1.469.431-1.028-.062-2.151-1.172-2.688zm-1.342.71c-.162.36-.375.717-.648.998-.041-.3-.07-.628-.086-.978.249-.032.499-.038.734-.02zm-1.758.336c.028.44.078.844.148 1.205-.927.169-.963-.744-.148-1.205zm15.378 5.111c.552 0 1 .449 1 1v8c0 .551-.448 1-1 1h-8c-.552 0-1-.449-1-1v-8c0-.551.448-1 1-1h8zm0-2h-8c-1.656 0-3 1.343-3 3v8c0 1.657 1.344 3 3 3h8c1.657 0 3-1.343 3-3v-8c0-1.657-1.343-3-3-3zm-13 3c0-.342.035-.677.102-1h-5.102c-.552 0-1-.449-1-1v-8c0-.551.448-1 1-1h8c.552 0 1 .449 1 1v5.101c.323-.066.657-.101 1-.101h1v-5c0-1.657-1.343-3-3-3h-8c-1.656 0-3 1.343-3 3v8c0 1.657 1.344 3 3 3h5v-1z"/>' +
            '</svg>' +
            '<span class="tooltiptext bottomCenterTooltip">Apply Translation Memory to All Segments</span>';
        requestTranslation.className = 'tooltip bottomCenterTooltip';
        requestTranslation.style.marginLeft = '4px';
        requestTranslation.addEventListener('click', () => {
            this.applyTranslationMemoryAll();
        });
        this.topBar.appendChild(requestTranslation);

        let glossLabel: HTMLLabelElement = document.createElement('label');
        glossLabel.style.marginLeft = '10px';
        glossLabel.style.marginTop = '4px';
        glossLabel.innerHTML = 'Glossary';
        glossLabel.setAttribute('for', 'glossSelect' + this.projectId);
        this.topBar.appendChild(glossLabel);

        this.glossSelect = document.createElement('select');
        this.glossSelect.id = 'glossSelect' + this.projectId;
        this.glossSelect.style.marginTop = '4px';
        this.glossSelect.style.minWidth = '180px';
        this.glossSelect.addEventListener('change', () => {
            ipcRenderer.send('set-project-glossary', { project: this.projectId, glossary: this.glossSelect.value });
        });
        this.topBar.appendChild(this.glossSelect);

        let requestTerms: HTMLAnchorElement = document.createElement('a');
        requestTerms.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24" viewBox="0 0 24 24" width="24">' +
            '<path d="M14.17,5L19,9.83V19H5V5L14.17,5L14.17,5 M14.17,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V9.83 c0-0.53-0.21-1.04-0.59-1.41l-4.83-4.83C15.21,3.21,14.7,3,14.17,3L14.17,3z M7,15h10v2H7V15z M7,11h10v2H7V11z M7,7h7v2H7V7z"/>' +
            '</svg>' +
            '<span class="tooltiptext bottomRightTooltip">Get Terms for All Segments</span>';
        requestTerms.className = 'tooltip bottomRightTooltip';
        requestTerms.style.marginRight = '10px';
        requestTerms.addEventListener('click', () => {
            this.applyTerminologyAll();
        });
        this.topBar.appendChild(requestTerms);
    }

    close(): void {
        this.rowsObserver?.disconnect();
        this.observer?.disconnect();
        ipcRenderer.send('close-notes');
        ipcRenderer.send('close-review-comments');
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
        ipcRenderer.send('export-open-project', { project: this.projectId });
    }

    setSegmentsCount(count: number): void {
        this.segmentsCount = count;
        this.maxPage = Math.ceil(this.segmentsCount / this.rowsPage);
        if (this.maxPage * this.rowsPage < this.segmentsCount) {
            this.maxPage++;
        }

        let pagesSpan: HTMLSpanElement = document.getElementById('pages' + this.projectId) as HTMLSpanElement;
        pagesSpan.innerText = 'of ' + this.maxPage;
        let pageInput: HTMLInputElement = document.getElementById('page' + this.projectId) as HTMLInputElement;
        pageInput.value = '1';
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
            showReviewed: this.showReviewed,
            sortOption: this.sortOption,
            sortDesc: this.sortDesc
        };
        ipcRenderer.send('get-segments', params);
    }

    buildTranslationArea(): void {
        let leftPanel: HTMLDivElement = document.createElement('div');
        leftPanel.classList.add('translationPanel');
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

        let numberTh: HTMLTableCellElement = document.createElement('th');
        numberTh.id = 'numberTh' + this.projectId;
        numberTh.classList.add('fixed');
        numberTh.innerText = '#'
        tr.appendChild(numberTh);

        let sourceTh: HTMLTableCellElement = document.createElement('th');
        sourceTh.id = 'sourceTh' + this.projectId;
        sourceTh.innerText = 'Source (' + this.srcLang + ')';
        tr.appendChild(sourceTh);

        let translateTh: HTMLTableCellElement = document.createElement('th');
        translateTh.id = 'translateTh' + this.projectId;
        translateTh.innerHTML = '&nbsp;';
        tr.appendChild(translateTh);

        let matchTh: HTMLTableCellElement = document.createElement('th');
        matchTh.id = 'matchTh' + this.projectId;
        matchTh.innerText = '%';
        tr.appendChild(matchTh);

        let finalTh: HTMLTableCellElement = document.createElement('th');
        finalTh.id = 'finalTh' + this.projectId;
        finalTh.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">'
            + '<path d="M14.2222 0H1.77778C0.8 0 0 0.8 0 1.77778V14.2222C0 15.2 0.8 16 1.77778 16H14.2222C15.2 16 16 15.2 16 14.2222V1.77778C16 0.8 15.2 0 14.2222 0ZM14.2222 14.2222H1.77778V1.77778H14.2222V14.2222ZM13.3244 5.33333L12.0711 4.07111L6.21333 9.92889L3.92 7.64444L2.65778 8.89778L6.21333 12.4444L13.3244 5.33333Z"/></svg>';
        tr.appendChild(finalTh);

        let targetTh: HTMLTableCellElement = document.createElement('th');
        targetTh.id = 'targetTh' + this.projectId;
        targetTh.innerText = 'Target (' + this.tgtLang + ')';
        tr.appendChild(targetTh);

        table.appendChild(this.tbody);

        let statusArea: HTMLDivElement = document.createElement('div');
        statusArea.classList.add('toolbar');
        leftPanel.appendChild(statusArea);

        let firstLink: HTMLAnchorElement = document.createElement('a');
        firstLink.classList.add('tooltip');
        firstLink.classList.add('topTooltip');
        firstLink.innerHTML = '<svg width="16" height="24" viewBox="3 0 19 24">' +
            '<path d="M18.41 16.59L13.82 12l4.59-4.59L17 6l-6 6 6 6zM6 6h2v12H6z" />' +
            '</svg>' +
            '<span class="tooltiptext topTooltip">First Page</span>';
        firstLink.addEventListener('click', () => {
            this.firstPage();
        });
        statusArea.appendChild(firstLink);

        let previousLink: HTMLAnchorElement = document.createElement('a');
        previousLink.classList.add('tooltip');
        previousLink.classList.add('topTooltip');
        previousLink.innerHTML = '<svg width="16" height="24" viewBox="3 0 19 24">' +
            '<path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />' + '</svg>' +
            '<span class="tooltiptext topTooltip">Previous Page</span>';
        previousLink.addEventListener('click', () => {
            this.previousPage();
        });
        statusArea.appendChild(previousLink);

        let pageLabel: HTMLLabelElement = document.createElement('label');
        pageLabel.innerText = 'Page';
        pageLabel.setAttribute('for', 'page' + this.projectId);
        pageLabel.style.marginTop = '4px';
        statusArea.appendChild(pageLabel);

        let pageDiv: HTMLDivElement = document.createElement('div');
        pageDiv.classList.add('tooltip');
        pageDiv.classList.add('topTooltip');
        statusArea.appendChild(pageDiv);

        let pageInput: HTMLInputElement = document.createElement('input');
        pageInput.id = 'page' + this.projectId;
        pageInput.type = 'number';
        pageInput.style.marginLeft = '4px';
        pageInput.style.marginTop = '4px';
        pageInput.style.width = '40px';
        pageInput.value = '0';
        pageInput.addEventListener('change', () => {
            let page = Number.parseInt(pageInput.value, 10);
            if (page >= 0 && page <= this.maxPage) {
                this.currentPage = page - 1;
                this.getSegments();
            }
        });
        pageDiv.appendChild(pageInput);
        pageDiv.insertAdjacentHTML('beforeend', '<span class="tooltiptext topTooltip">Enter page number and press ENTER</span>');

        let pagesSpan: HTMLSpanElement = document.createElement('span');
        pagesSpan.id = 'pages' + this.projectId;
        pagesSpan.classList.add('noWrap');
        pagesSpan.innerText = 'of'
        pagesSpan.style.marginLeft = '4px';
        pagesSpan.style.marginTop = '4px';
        pagesSpan.innerText = '0';
        statusArea.appendChild(pagesSpan);

        let nextLink: HTMLAnchorElement = document.createElement('a');
        nextLink.classList.add('tooltip');
        nextLink.classList.add('topTooltip');
        nextLink.innerHTML = '<svg width="16" height="24" viewBox="3 0 19 24">' +
            '<path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />' + '</svg>' +
            '<span class="tooltiptext topTooltip">Next Page</span>';
        nextLink.addEventListener('click', () => {
            this.nextPage();
        });
        statusArea.appendChild(nextLink);

        let lastLink: HTMLAnchorElement = document.createElement('a');
        lastLink.classList.add('tooltip');
        lastLink.classList.add('topTooltip');
        lastLink.innerHTML = '<svg width="16" height="24" viewBox="3 0 19 24">' +
            '<path d="M5.59 7.41L10.18 12l-4.59 4.59L7 18l6-6-6-6zM16 6h2v12h-2z" />' + '</svg>' +
            '<span class="tooltiptext topTooltip">Last Page</span>';
        lastLink.addEventListener('click', () => {
            this.lastPage();
        });
        statusArea.appendChild(lastLink);

        let rowsLabel: HTMLLabelElement = document.createElement('label');
        rowsLabel.innerText = 'Rows/Page';
        rowsLabel.setAttribute('for', 'rows_page' + this.projectId);
        rowsLabel.style.marginTop = '4px';
        statusArea.appendChild(rowsLabel);

        let rowDiv: HTMLDivElement = document.createElement('div');
        rowDiv.classList.add('tooltip');
        rowDiv.classList.add('topTooltip');
        statusArea.appendChild(rowDiv);

        let rowsInput: HTMLInputElement = document.createElement('input');
        rowsInput.id = 'rows_page' + this.projectId;
        rowsInput.type = 'number';
        rowsInput.style.marginTop = '4px';
        rowsInput.style.width = '44px';
        rowsInput.value = '' + this.rowsPage;
        rowsInput.addEventListener('change', () => {
            this.rowsPage = Number.parseInt(rowsInput.value, 10);
            this.maxPage = Math.ceil(this.segmentsCount / this.rowsPage);
            if (this.maxPage * this.rowsPage < this.segmentsCount) {
                this.maxPage++;
            }
            pagesSpan.innerText = 'of ' + this.maxPage;
            pageInput.value = '1';
            this.firstPage();
        });
        rowDiv.appendChild(rowsInput);
        rowDiv.insertAdjacentHTML('beforeend', '<span class="tooltiptext topTooltip">Enter number of rows/page and press ENTER</span>');

        let filler: HTMLSpanElement = document.createElement('span');
        filler.innerHTML = '&nbsp;';
        filler.className = 'fill_width';
        statusArea.appendChild(filler);

        this.statistics.innerHTML = '&nbsp;';
        this.statistics.classList.add('stats');
        statusArea.appendChild(this.statistics);

        let config: MutationObserverInit = { attributes: true, childList: false, subtree: false };
        this.rowsObserver = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    tableContainer.style.height = (leftPanel.clientHeight - statusArea.clientHeight) + 'px';
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

        let numberTh: HTMLTableCellElement = document.getElementById('numberTh' + this.projectId) as HTMLTableCellElement;
        if (numberTh) {
            numberTh.style.width = (100 * numbersWidth / this.translationArea.clientWidth) + '%';
        }
        let translateTh: HTMLTableCellElement = document.getElementById('translateTh' + this.projectId) as HTMLTableCellElement;
        if (translateTh) {
            translateTh.style.width = (100 * 32 / this.translationArea.clientWidth) + '%';
        }
        let matchTh: HTMLTableCellElement = document.getElementById('matchTh' + this.projectId) as HTMLTableCellElement;
        if (matchTh) {
            matchTh.style.width = (100 * (40 * this.zoom + 8) / this.translationArea.clientWidth) + '%';
        }
        let finalTh: HTMLTableCellElement = document.getElementById('finalTh' + this.projectId) as HTMLTableCellElement;
        if (finalTh) {
            finalTh.style.width = (100 * 35 / this.translationArea.clientWidth) + '%';
        }
        let sourceTh: HTMLTableCellElement = document.getElementById('sourceTh' + this.projectId) as HTMLTableCellElement;
        if (sourceTh) {
            sourceTh.style.width = (100 * width / this.translationArea.clientWidth) + '%';
        }
        let targetTh: HTMLTableCellElement = document.getElementById('targetTh' + this.projectId) as HTMLTableCellElement;
        if (targetTh) {
            targetTh.style.width = (100 * width / this.translationArea.clientWidth) + '%';
        }
    }

    toggleFilesPanel(): void {
        if (this.collapseFilesButton.classList.contains('hidden')) {
            this.expandFilesButton.click();
        } else {
            this.collapseFilesButton.click();
        }
    }

    toggleRightPanels(): void {
        if (this.collapseRightButton.classList.contains('hidden')) {
            this.expandRightButton.click();
        } else {
            this.collapseRightButton.click();
        }
    }

    buildFilesArea(): void {
        let panelsContainer: HTMLDivElement = document.createElement('div');
        panelsContainer.classList.add('leftPaddedPanel');
        this.filesPanel.appendChild(panelsContainer);

        let filesTitle: HTMLDivElement = document.createElement('div');
        filesTitle.classList.add('titlepanel');
        filesTitle.classList.add('row');
        panelsContainer.appendChild(filesTitle);

        let filler: HTMLSpanElement = document.createElement('span');
        filler.classList.add('fill_width');
        filler.innerText = 'Files';
        filesTitle.appendChild(filler);

        this.collapseFilesButton.innerHTML = TranslationView.SVG_EXPAND;
        this.collapseFilesButton.style.marginRight = '4px';
        this.collapseFilesButton.addEventListener('click', () => {
            filler.classList.add('hidden');
            this.toggleButtonVisibility(this.collapseFilesButton, false);
            this.toggleButtonVisibility(this.expandFilesButton, true);
            this.filesContainer.classList.add('hidden');
            this.verticalPanels.collapseLeft();

            if (this.filesPanelWidthObserver) {
                this.filesPanelWidthObserver.disconnect();
                this.filesPanelWidthObserver = undefined;
            }

            const observer: MutationObserver = new MutationObserver((mutationsList: MutationRecord[]) => {
                for (const mutation of mutationsList) {
                    if (mutation.type !== 'attributes' || mutation.attributeName !== 'style') {
                        continue;
                    }

                    const panelWidth: number = this.filesPanel.clientWidth;
                    if (panelWidth > TranslationView.MIN_PANEL_WIDTH) {
                        filler.classList.remove('hidden');
                        this.filesContainer.classList.remove('hidden');
                        this.toggleButtonVisibility(this.collapseFilesButton, true);
                        this.toggleButtonVisibility(this.expandFilesButton, false);
                        observer.disconnect();
                        this.filesPanelWidthObserver = undefined;
                        break;
                    }
                }
            });

            observer.observe(this.filesPanel, { attributes: true, attributeFilter: ['style'] });
            this.filesPanelWidthObserver = observer;
        });
        this.collapseFilesButton.addEventListener('mouseenter', () => {
            const rect = this.collapseFilesButton.getBoundingClientRect();
            collapseTooltip.style.top = rect.top + 'px';
            collapseTooltip.style.left = (rect.left + rect.width + 4) + 'px';
            collapseTooltip.style.visibility = 'visible';
        });
        this.collapseFilesButton.addEventListener('mouseleave', () => {
            collapseTooltip.style.visibility = 'hidden';
        });
        filesTitle.appendChild(this.collapseFilesButton);

        this.toggleButtonVisibility(this.expandFilesButton, false);
        this.expandFilesButton.innerHTML = TranslationView.SVG_COLLAPSE;
        this.expandFilesButton.style.marginRight = '4px';
        this.expandFilesButton.style.marginLeft = '-2px';
        this.expandFilesButton.addEventListener('click', () => {
            filler.classList.remove('hidden');
            this.toggleButtonVisibility(this.collapseFilesButton, true);
            this.toggleButtonVisibility(this.expandFilesButton, false);
            this.filesContainer.classList.remove('hidden');
            this.verticalPanels.expandLeft();
        });
        this.expandFilesButton.addEventListener('mouseenter', () => {
            const rect = this.expandFilesButton.getBoundingClientRect();
            expandTooltip.style.top = (rect.top) + 'px';
            expandTooltip.style.left = (rect.left + rect.width + 6) + 'px';
            expandTooltip.style.visibility = 'visible';
        });
        this.expandFilesButton.addEventListener('mouseleave', () => {
            expandTooltip.style.visibility = 'hidden';
        });
        filesTitle.appendChild(this.expandFilesButton);

        let collapseTooltip: HTMLDivElement = document.createElement('div');
        collapseTooltip.classList.add('filesTooltip');
        collapseTooltip.innerText = 'Collapse Files Panel';
        collapseTooltip.style.visibility = 'hidden';
        panelsContainer.appendChild(collapseTooltip);

        let expandTooltip: HTMLDivElement = document.createElement('div');
        expandTooltip.classList.add('filesTooltip');
        expandTooltip.innerText = 'Expand Files Panel';
        expandTooltip.style.visibility = 'hidden';
        panelsContainer.appendChild(expandTooltip);

        this.filesContainer.classList.add('fill_width');
        this.filesContainer.classList.add('roundedBottom');
        this.filesContainer.classList.add('divContainer');

        panelsContainer.appendChild(this.filesContainer);

        setTimeout(() => {
            this.filesContainer.style.height = 'calc(100% - ' + filesTitle.clientHeight + 'px)';
        }, 200);
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
        this.rightHorizontalPanels = horizontalSplit;
        horizontalSplit.topPanel().dataset.collapsed = 'false';
        horizontalSplit.centerPanel().dataset.collapsed = 'false';
        horizontalSplit.bottomPanel().dataset.collapsed = 'false';

        this.createMemoryArea(horizontalSplit.topPanel());
        this.createTermsArea(horizontalSplit.bottomPanel());
        this.createMachineArea(horizontalSplit.centerPanel());

        this.updateRightPanelsLayout();
        this.toggleButtonVisibility(this.expandMatchesButton, false);
        this.toggleButtonVisibility(this.expandMtButton, false);
        this.toggleButtonVisibility(this.expandTermsButton, false);
    }

    createMemoryArea(topPanel: HTMLDivElement): void {
        let panelsContainer: HTMLDivElement = document.createElement('div');
        panelsContainer.classList.add('topPaddedPanel');
        topPanel.appendChild(panelsContainer);

        let memoryTitle: HTMLDivElement = document.createElement('div');
        memoryTitle.classList.add('titlepanel');
        memoryTitle.style.overflow = 'visible';
        memoryTitle.style.display = 'flex';
        panelsContainer.appendChild(memoryTitle);

        let filler: HTMLSpanElement = document.createElement('span');
        filler.classList.add('fill_width');
        filler.innerText = 'Translation Memory';
        memoryTitle.appendChild(filler);

        this.expandMatchesButton.className = 'tooltip bottomRightTooltip';
        this.expandMatchesButton.innerHTML = TranslationView.SVG_VERTICAL_EXPAND + '<span class="tooltiptext bottomRightTooltip">Expand Translation Memory</span>';
        this.expandMatchesButton.style.marginLeft = '4px';
        this.toggleButtonVisibility(this.expandMatchesButton, false);
        this.expandMatchesButton.addEventListener('click', () => {
            if (!this.matchesContainer.classList.contains('hidden')) {
                return;
            }
            this.matchesContainer.classList.remove('hidden');
            this.rightHorizontalPanels?.expandTop();
            this.updateRightPanelsLayout();
            this.matchesHiddenBeforePanelCollapse = false;
        });
        memoryTitle.appendChild(this.expandMatchesButton);

        this.collapseMatchesButton.className = 'tooltip bottomRightTooltip';
        this.collapseMatchesButton.innerHTML = TranslationView.SVG_VERTICAL_COLLAPSE + '<span class="tooltiptext bottomRightTooltip">Collapse Translation Memory</span>';
        this.collapseMatchesButton.style.marginLeft = '4px';
        this.collapseMatchesButton.style.marginLeft = '4px';
        this.collapseMatchesButton.addEventListener('click', () => {
            if (this.matchesContainer.classList.contains('hidden')) {
                return;
            }
            this.matchesContainer.classList.add('hidden');
            this.rightHorizontalPanels?.collapseTop();
            this.updateRightPanelsLayout();
            this.matchesHiddenBeforePanelCollapse = true;
        });
        memoryTitle.appendChild(this.collapseMatchesButton);

        this.collapseRightButton.innerHTML = TranslationView.SVG_COLLAPSE;
        this.collapseRightButton.style.marginLeft = '-2px';
        this.collapseRightButton.addEventListener('click', () => {
            filler.classList.add('hidden');
            this.toggleButtonVisibility(this.collapseRightButton, false);
            this.toggleButtonVisibility(this.expandRightButton, true);
            this.matchesHiddenBeforePanelCollapse = this.matchesContainer.classList.contains('hidden');
            this.mtHiddenBeforePanelCollapse = this.mtContainer.classList.contains('hidden');
            this.termsHiddenBeforePanelCollapse = this.termsContainer.classList.contains('hidden');
            this.matchesContainer.classList.add('hidden');
            this.mtContainer.classList.add('hidden');
            this.termsContainer.classList.add('hidden');
            this.updateRightPanelsLayout(true);
            this.verticalPanels.collapseRight();

            if (this.rightPanelWidthObserver) {
                this.rightPanelWidthObserver.disconnect();
                this.rightPanelWidthObserver = undefined;
            }

            const observer: MutationObserver = new MutationObserver((mutationsList: MutationRecord[]) => {
                for (const mutation of mutationsList) {
                    if (mutation.type !== 'attributes' || mutation.attributeName !== 'style') {
                        continue;
                    }

                    const panelWidth: number = this.rightPanel.clientWidth;
                    if (panelWidth > TranslationView.MIN_PANEL_WIDTH) {
                        filler.classList.remove('hidden');
                        if (this.matchesHiddenBeforePanelCollapse) {
                            this.matchesContainer.classList.add('hidden');
                        } else {
                            this.matchesContainer.classList.remove('hidden');
                        }
                        if (this.mtHiddenBeforePanelCollapse) {
                            this.mtContainer.classList.add('hidden');
                        } else {
                            this.mtContainer.classList.remove('hidden');
                        }
                        if (this.termsHiddenBeforePanelCollapse) {
                            this.termsContainer.classList.add('hidden');
                        } else {
                            this.termsContainer.classList.remove('hidden');
                        }
                        this.updateRightPanelsLayout();
                        this.toggleButtonVisibility(this.collapseRightButton, true);
                        this.toggleButtonVisibility(this.expandRightButton, false);
                        this.matchesHiddenBeforePanelCollapse = this.matchesContainer.classList.contains('hidden');
                        this.mtHiddenBeforePanelCollapse = this.mtContainer.classList.contains('hidden');
                        this.termsHiddenBeforePanelCollapse = this.termsContainer.classList.contains('hidden');
                        observer.disconnect();
                        this.rightPanelWidthObserver = undefined;
                        break;
                    }
                }
            });

            observer.observe(this.rightPanel, { attributes: true, attributeFilter: ['style'] });
            this.rightPanelWidthObserver = observer;
        });
        this.collapseRightButton.addEventListener('mouseenter', () => {
            const rect = this.collapseRightButton.getBoundingClientRect();
            collapseTooltip.style.top = rect.top + 'px';
            collapseTooltip.style.left = (rect.left + rect.width + 4) + 'px';
            collapseTooltip.style.visibility = 'visible';
        });
        this.collapseRightButton.addEventListener('mouseleave', () => {
            collapseTooltip.style.visibility = 'hidden';
        });
        memoryTitle.prepend(this.collapseRightButton);

        this.toggleButtonVisibility(this.expandRightButton, false);
        this.expandRightButton.innerHTML = TranslationView.SVG_EXPAND;
        this.expandRightButton.style.marginLeft = '-2px';
        this.expandRightButton.style.marginRight = '0px';
        this.expandRightButton.addEventListener('click', () => {
            if (this.rightPanelWidthObserver) {
                this.rightPanelWidthObserver.disconnect();
                this.rightPanelWidthObserver = undefined;
            }
            filler.classList.remove('hidden');
            this.toggleButtonVisibility(this.collapseRightButton, true);
            this.toggleButtonVisibility(this.expandRightButton, false);
            if (this.matchesHiddenBeforePanelCollapse) {
                this.matchesContainer.classList.add('hidden');
            } else {
                this.matchesContainer.classList.remove('hidden');
            }
            if (this.mtHiddenBeforePanelCollapse) {
                this.mtContainer.classList.add('hidden');
            } else {
                this.mtContainer.classList.remove('hidden');
            }
            if (this.termsHiddenBeforePanelCollapse) {
                this.termsContainer.classList.add('hidden');
            } else {
                this.termsContainer.classList.remove('hidden');
            }
            this.updateRightPanelsLayout();
            this.matchesHiddenBeforePanelCollapse = this.matchesContainer.classList.contains('hidden');
            this.mtHiddenBeforePanelCollapse = this.mtContainer.classList.contains('hidden');
            this.termsHiddenBeforePanelCollapse = this.termsContainer.classList.contains('hidden');
            this.verticalPanels.expandRight();
        });
        this.expandRightButton.addEventListener('mouseenter', () => {
            const rect = this.expandRightButton.getBoundingClientRect();
            expandTooltip.style.top = (rect.top) + 'px';
            expandTooltip.style.left = (rect.right - rect.width - 6 - expandTooltip.clientWidth) + 'px';
            expandTooltip.style.visibility = 'visible';
        });
        this.expandRightButton.addEventListener('mouseleave', () => {
            expandTooltip.style.visibility = 'hidden';
        });
        memoryTitle.prepend(this.expandRightButton);

        let collapseTooltip: HTMLDivElement = document.createElement('div');
        collapseTooltip.classList.add('rightPanelTooltip');
        collapseTooltip.innerText = 'Collapse Right Panels';
        collapseTooltip.style.visibility = 'hidden';
        panelsContainer.appendChild(collapseTooltip);

        let expandTooltip: HTMLDivElement = document.createElement('div');
        expandTooltip.classList.add('rightPanelTooltip');
        expandTooltip.innerText = 'Expand Right Panels';
        expandTooltip.style.visibility = 'hidden';
        panelsContainer.appendChild(expandTooltip);

        this.matchesContainer.classList.add('fill_width');
        panelsContainer.appendChild(this.matchesContainer);
        this.tmMatches = new TmMatches(this.matchesContainer, this.projectId);

        let config: MutationObserverInit = { attributes: true, childList: false, subtree: false };
        let observer: MutationObserver = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    const availableHeight: number = panelsContainer.clientHeight - memoryTitle.clientHeight;
                    this.matchesContainer.style.height = availableHeight + 'px';
                    if (this.matchesContainer.classList.contains('hidden') && availableHeight > TranslationView.MIN_SUBPANEL_HEIGHT) {
                        this.matchesContainer.classList.remove('hidden');
                        this.rightHorizontalPanels?.expandTop();
                        this.matchesHiddenBeforePanelCollapse = false;
                        this.updateRightPanelsLayout();
                    }
                }
            }
        });
        observer.observe(topPanel, config);
    }

    createMachineArea(centerPanel: HTMLDivElement): void {
        let panelsContainer: HTMLDivElement = document.createElement('div');
        panelsContainer.classList.add('centerPaddedPanel');
        centerPanel.appendChild(panelsContainer);

        let machineTitle: HTMLDivElement = document.createElement('div');
        machineTitle.classList.add('titlepanel');
        machineTitle.style.overflow = 'visible';
        machineTitle.style.display = 'flex';
        panelsContainer.appendChild(machineTitle);

        let blankFiller: HTMLSpanElement = document.createElement('span');
        blankFiller.innerHTML = TranslationView.SVG_BLANK;
        machineTitle.appendChild(blankFiller);

        let Title: HTMLSpanElement = document.createElement('span');
        Title.classList.add('fill_width');
        Title.innerText = 'Machine Translation';
        machineTitle.appendChild(Title);

        this.expandMtButton.className = 'tooltip bottomRightTooltip';
        this.expandMtButton.innerHTML = TranslationView.SVG_VERTICAL_EXPAND + '<span class="tooltiptext bottomRightTooltip">Expand Machine Translation</span>';
        this.expandMtButton.style.marginLeft = '4px';
        this.toggleButtonVisibility(this.expandMtButton, false);
        this.expandMtButton.addEventListener('click', () => {
            if (!this.mtContainer.classList.contains('hidden')) {
                return;
            }
            this.mtContainer.classList.remove('hidden');
            this.rightHorizontalPanels?.expandCenter();
            this.updateRightPanelsLayout();
            this.mtHiddenBeforePanelCollapse = false;
        });
        machineTitle.appendChild(this.expandMtButton);

        this.collapseMtButton.className = 'tooltip bottomRightTooltip';
        this.collapseMtButton.innerHTML = TranslationView.SVG_VERTICAL_COLLAPSE + '<span class="tooltiptext bottomRightTooltip">Collapse Machine Translation</span>';
        this.collapseMtButton.style.marginLeft = '4px';
        this.collapseMtButton.style.marginLeft = '4px';
        this.collapseMtButton.addEventListener('click', () => {
            if (this.mtContainer.classList.contains('hidden')) {
                return;
            }
            this.mtContainer.classList.add('hidden');
            this.rightHorizontalPanels?.collapseCenter();
            this.updateRightPanelsLayout();
            this.mtHiddenBeforePanelCollapse = true;
        });
        machineTitle.appendChild(this.collapseMtButton);

        this.mtContainer.classList.add('fill_width');
        panelsContainer.appendChild(this.mtContainer);
        this.mtMatches = new MtMatches(this.mtContainer, this.projectId);

        let config: MutationObserverInit = { attributes: true, childList: false, subtree: false };
        let observer: MutationObserver = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    const availableHeight: number = panelsContainer.clientHeight - machineTitle.clientHeight;
                    this.mtContainer.style.height = availableHeight + 'px';
                    if (this.mtContainer.classList.contains('hidden') && availableHeight > TranslationView.MIN_SUBPANEL_HEIGHT) {
                        this.mtContainer.classList.remove('hidden');
                        this.rightHorizontalPanels?.expandCenter();
                        this.mtHiddenBeforePanelCollapse = false;
                        this.updateRightPanelsLayout();
                    }
                }
            }
        });
        observer.observe(centerPanel, config);
    }

    createTermsArea(bottomPanel: HTMLDivElement): void {
        let panelsContainer: HTMLDivElement = document.createElement('div');
        panelsContainer.classList.add('bottomPaddedPanel');
        bottomPanel.appendChild(panelsContainer);

        let termsTitle: HTMLDivElement = document.createElement('div');
        termsTitle.classList.add('titlepanel');
        termsTitle.style.overflow = 'visible';
        termsTitle.style.display = 'flex';
        panelsContainer.appendChild(termsTitle);

        let blankFiller: HTMLSpanElement = document.createElement('span');
        blankFiller.innerHTML = TranslationView.SVG_BLANK;
        termsTitle.appendChild(blankFiller);

        let Title: HTMLSpanElement = document.createElement('span');
        Title.classList.add('fill_width');
        Title.innerText = 'Terms';
        termsTitle.appendChild(Title);

        this.expandTermsButton.className = 'tooltip topRightTooltip';
        this.expandTermsButton.innerHTML = TranslationView.SVG_VERTICAL_EXPAND + '<span class="tooltiptext topRightTooltip">Expand Terms</span>';
        this.expandTermsButton.style.marginLeft = '4px';
        this.toggleButtonVisibility(this.expandTermsButton, false);
        this.expandTermsButton.addEventListener('click', () => {
            if (!this.termsContainer.classList.contains('hidden')) {
                return;
            }
            this.termsContainer.classList.remove('hidden');
            this.rightHorizontalPanels?.expandBottom();
            this.updateRightPanelsLayout();
            this.termsHiddenBeforePanelCollapse = false;
        });
        termsTitle.appendChild(this.expandTermsButton);

        this.collapseTermsButton.className = 'tooltip bottomRightTooltip';
        this.collapseTermsButton.innerHTML = TranslationView.SVG_VERTICAL_COLLAPSE + '<span class="tooltiptext bottomRightTooltip">Collapse Terms</span>';
        this.collapseTermsButton.style.marginLeft = '4px';
        this.collapseTermsButton.addEventListener('click', () => {
            if (this.termsContainer.classList.contains('hidden')) {
                return;
            }
            this.termsContainer.classList.add('hidden');
            this.rightHorizontalPanels?.collapseBottom();
            this.updateRightPanelsLayout();
            this.termsHiddenBeforePanelCollapse = true;
        });
        termsTitle.appendChild(this.collapseTermsButton);

        this.termsContainer.classList.add('fill_width');
        panelsContainer.appendChild(this.termsContainer);
        this.termsPanel = new TermsPanel(this.termsContainer, this.projectId);

        let config: MutationObserverInit = { attributes: true, childList: false, subtree: false };
        let observer: MutationObserver = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    const availableHeight: number = panelsContainer.clientHeight - termsTitle.clientHeight;
                    this.termsContainer.style.height = availableHeight + 'px';
                    if (this.termsContainer.classList.contains('hidden') && availableHeight > TranslationView.MIN_SUBPANEL_HEIGHT) {
                        this.termsContainer.classList.remove('hidden');
                        this.rightHorizontalPanels?.expandBottom();
                        this.termsHiddenBeforePanelCollapse = false;
                        this.updateRightPanelsLayout();
                    }
                }
            }
        });
        observer.observe(bottomPanel, config);
    }

    toggleButtonVisibility(button: HTMLAnchorElement, visible: boolean): void {
        if (visible) {
            button.classList.remove('hidden');
            button.hidden = false;
            button.style.display = 'inline-flex';
        } else {
            button.classList.add('hidden');
            button.hidden = true;
            button.style.display = 'none';
        }
    }

    updateRightPanelsLayout(skipAutoRestore: boolean = false): void {
        const matchesHidden: boolean = this.matchesContainer.classList.contains('hidden');
        const mtHidden: boolean = this.mtContainer.classList.contains('hidden');
        const termsHidden: boolean = this.termsContainer.classList.contains('hidden');

        if (!skipAutoRestore && matchesHidden && mtHidden && termsHidden) {
            this.matchesContainer.classList.remove('hidden');
            this.mtContainer.classList.remove('hidden');
            this.termsContainer.classList.remove('hidden');
            this.matchesHiddenBeforePanelCollapse = false;
            this.mtHiddenBeforePanelCollapse = false;
            this.termsHiddenBeforePanelCollapse = false;
            if (this.rightHorizontalPanels) {
                this.rightHorizontalPanels.topPanel().dataset.collapsed = 'false';
                this.rightHorizontalPanels.centerPanel().dataset.collapsed = 'false';
                this.rightHorizontalPanels.bottomPanel().dataset.collapsed = 'false';
                this.rightHorizontalPanels.expandedTop = 0;
                this.rightHorizontalPanels.expandedCenter = 0;
                this.rightHorizontalPanels.expandedBottom = 0;
                this.rightHorizontalPanels.setWeights([33.3, 33.3, 33.4]);
            }
            this.updateRightPanelsLayout(true);
            return;
        }

        const toggleButtons = (hidden: boolean, collapseButton: HTMLAnchorElement, expandButton: HTMLAnchorElement): void => {
            this.toggleButtonVisibility(collapseButton, !hidden);
            this.toggleButtonVisibility(expandButton, hidden);
        };

        toggleButtons(matchesHidden, this.collapseMatchesButton, this.expandMatchesButton);
        toggleButtons(mtHidden, this.collapseMtButton, this.expandMtButton);
        toggleButtons(termsHidden, this.collapseTermsButton, this.expandTermsButton);

        if (this.rightHorizontalPanels) {
            this.rightHorizontalPanels.topPanel().dataset.collapsed = matchesHidden ? 'true' : 'false';
            this.rightHorizontalPanels.centerPanel().dataset.collapsed = mtHidden ? 'true' : 'false';
            this.rightHorizontalPanels.bottomPanel().dataset.collapsed = termsHidden ? 'true' : 'false';
        }
    }

    generateStatistics(): void {
        ipcRenderer.send('generate-statistics', { project: this.projectId });
    }

    setSegments(arg: Segment[]): void {
        this.tbody.innerHTML = '';
        this.tbody.parentElement?.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        let length: number = arg.length;
        if (length === 0 && this.filterButton.classList.contains('active')) {
            ipcRenderer.send('show-message', { type: 'warning', message: 'Nothing to display, consider clearing current filter' });
            this.container.classList.remove('wait');
            return;
        }
        let returnRow: HTMLTableRowElement | undefined;
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
                ipcRenderer.send('close-go-to');
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
                tr.classList.add('locked');
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
            if (row.hasMetadata) {
                let span: HTMLSpanElement = document.createElement('span');
                span.innerHTML = TranslationView.COMMENT_SPAN;
                span.classList.add('iconTooltip');
                span.addEventListener('click', (event: MouseEvent) => {
                    let metaId: MetaId = {
                        project: this.projectId,
                        file: row.file,
                        unit: row.unit,
                        segment: row.segment
                    };
                    ipcRenderer.send('show-metadata', metaId);
                });
                td.appendChild(span);
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
                let span: HTMLSpanElement = document.createElement('span');
                span.innerHTML = TranslationView.NOTES_SPAN;
                span.addEventListener('click', () => {
                    ipcRenderer.send('show-notes', {
                        project: this.projectId,
                        file: row.file,
                        unit: row.unit,
                        segment: row.segment
                    });
                });
                td.appendChild(span);
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
        this.tmMatches?.clear();
        this.mtMatches?.clear();
        this.termsPanel?.clear();
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
        if (this.files.length === 0) {
            ipcRenderer.send('get-project-files', this.projectId);
        }
    }

    static isBiDi(code: string): boolean {
        return code.startsWith("ar") || code.startsWith("fa") || code.startsWith("az") || code.startsWith("ur")
            || code.startsWith("pa-PK") || code.startsWith("ps") || code.startsWith("prs") || code.startsWith("ug")
            || code.startsWith("he") || code.startsWith("ji") || code.startsWith("yi");
    }

    firstPage(): void {
        this.currentPage = 0;
        let pageInput: HTMLInputElement = document.getElementById('page' + this.projectId) as HTMLInputElement;
        pageInput.value = '' + (this.currentPage + 1);
        this.getSegments();
    }

    previousPage(): void {
        if (this.currentPage > 0) {
            this.currentPage--;
            let pageInput: HTMLInputElement = document.getElementById('page' + this.projectId) as HTMLInputElement;
            pageInput.value = '' + (this.currentPage + 1);
            this.getSegments();
        }
    }

    nextPage(): void {
        if (this.currentPage < this.maxPage - 1) {
            this.currentPage++;
            let pageInput: HTMLInputElement = document.getElementById('page' + this.projectId) as HTMLInputElement;
            pageInput.value = '' + (this.currentPage + 1);
            this.getSegments();
        }
    }

    lastPage(): void {
        this.currentPage = this.maxPage - 1;
        let pageInput: HTMLInputElement = document.getElementById('page' + this.projectId) as HTMLInputElement;
        pageInput.value = '' + (this.currentPage + 1);
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
        ipcRenderer.send('machine-translate', {
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
            ipcRenderer.send('show-message', { type: 'warning', message: 'Select memory' });
            return;
        }
        if (this.glossSelect.value === 'none') {
            ipcRenderer.send('show-message', { type: 'warning', message: 'Select glossary' });
            return;
        }
        ipcRenderer.send('assemble-matches', {
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
            ipcRenderer.send('show-message', { type: 'warning', message: 'Select memory' });
            return;
        }
        ipcRenderer.send('tm-translate', {
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
        let currentTranslate: HTMLTableCellElement = this.currentRow?.getElementsByClassName('translate')[0] as HTMLTableCellElement;
        if (!currentTranslate.innerHTML.includes(TranslationView.LOCK_FRAGMENT)) {
            // not locked
            let translation: string = '';
            if (this.currentCell) {
                this.currentCell.classList.remove('editing');
                translation = this.getTranslation(this.currentCell.innerHTML);
                this.currentCell.innerHTML = this.highlightSpaces(translation);
            }
            this.currentRow?.classList.remove('currentRow');

            let currentState: HTMLTableCellElement = this.currentRow?.getElementsByClassName('state')[0] as HTMLTableCellElement;
            let hasNotes: boolean = currentState.innerHTML.includes(TranslationView.NOTE_FRAGMENT);

            let isConfirmed: boolean = currentState.classList.contains('final');
            if (!confirm && isConfirmed && this.currentContent === this.currentCell?.innerHTML) {
                confirm = true;
            }
            if (arg.unconfirm) {
                confirm = false;
                currentState.classList.remove('final');
                if (translation === '') {
                    currentState.classList.add('initial');
                    currentState.innerHTML = hasNotes ? TranslationView.NOTES_SPAN : TranslationView.SVG_BLANK;
                } else {
                    currentState.classList.add('translated');
                    currentState.innerHTML = TranslationView.TRANSLATED_SPAN;
                    if (hasNotes) {
                        let span: HTMLSpanElement = document.createElement('span');
                        span.innerHTML = TranslationView.NOTES_SPAN;
                        span.addEventListener('click', () => {
                            ipcRenderer.send('show-notes', {
                                project: this.projectId,
                                file: this.currentId.file,
                                unit: this.currentId.unit,
                                segment: this.currentId.id,
                            });
                        });
                        currentState.appendChild(span);
                    }
                }
            }
            if (confirm) {
                currentState.classList.remove('initial');
                currentState.classList.remove('translated');
                currentState.classList.add('final');
                currentState.innerHTML = TranslationView.FINAL_SPAN;
                if (hasNotes) {
                    let span: HTMLSpanElement = document.createElement('span');
                    span.innerHTML = TranslationView.NOTES_SPAN;
                    span.addEventListener('click', () => {
                        ipcRenderer.send('show-notes', {
                            project: this.projectId,
                            file: this.currentId.file,
                            unit: this.currentId.unit,
                            segment: this.currentId.id,
                        });
                    });
                    currentState.appendChild(span);
                }
            } else {
                if (translation === '') {
                    currentState.classList.remove('final');
                    currentState.classList.remove('translated');
                    currentState.classList.add('initial');
                    if (hasNotes) {
                        let span: HTMLSpanElement = document.createElement('span');
                        span.innerHTML = TranslationView.NOTES_SPAN;
                        span.addEventListener('click', () => {
                            ipcRenderer.send('show-notes', {
                                project: this.projectId,
                                file: this.currentId.file,
                                unit: this.currentId.unit,
                                segment: this.currentId.id,
                            });
                        });
                        currentState.appendChild(span);
                    } else {
                        currentState.innerHTML = TranslationView.SVG_BLANK;
                    }
                } else {
                    currentState.classList.remove('final');
                    currentState.classList.remove('initial');
                    currentState.classList.add('translated');
                    currentState.innerHTML = TranslationView.TRANSLATED_SPAN;
                    if (hasNotes) {
                        let span: HTMLSpanElement = document.createElement('span');
                        span.innerHTML = TranslationView.NOTES_SPAN;
                        span.addEventListener('click', () => {
                            ipcRenderer.send('show-notes', {
                                project: this.projectId,
                                file: this.currentId.file,
                                unit: this.currentId.unit,
                                segment: this.currentId.id,
                            });
                        });
                        currentState.appendChild(span);
                    }
                }
            }

            ipcRenderer.send('save-translation', {
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
        if (next === 'none' && this.currentRow) {
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
            ipcRenderer.send('close-go-to');
        }
        if (next === 'next' && this.currentRow) {
            let index: number = this.currentRow.rowIndex;
            if (index >= rows.length) {
                index = rows.length - 1;
            }
            let row: HTMLTableRowElement = (rows[index] as HTMLTableRowElement);
            this.selectRow(row);
        }
        if (next === 'previous' && this.currentRow) {
            let index: number = this.currentRow.rowIndex - 2;
            if (index < 0) {
                index = 0;
            }
            let row: HTMLTableRowElement = (rows[index] as HTMLTableRowElement);
            this.selectRow(row);
        }
        if (next === 'untranslated' && this.currentRow) {
            let found: boolean = false;
            let length: number = rows.length;
            for (let i: number = this.currentRow.rowIndex; i < length; i++) {
                let row: HTMLTableRowElement = (rows[i] as HTMLTableRowElement);
                let cell: HTMLTableCellElement = row.getElementsByClassName('state')[0] as HTMLTableCellElement;
                if (cell.classList.contains('initial') && !row.innerHTML.includes(TranslationView.LOCK_FRAGMENT)) {
                    found = true;
                    this.selectRow(row);
                    break;
                }
            }
            if (!found) {
                ipcRenderer.send('show-message', { type: 'warning', message: 'No more untranslated segments on this page' });
            }
        }
        if (next === 'unconfirmed' && this.currentRow) {
            let found: boolean = false;
            let length: number = rows.length;
            for (let i: number = this.currentRow.rowIndex; i < length; i++) {
                let row: HTMLTableRowElement = (rows[i] as HTMLTableRowElement);
                let cell: HTMLTableCellElement = row.getElementsByClassName('state')[0] as HTMLTableCellElement;
                if (cell.classList.contains('translated') && !row.innerHTML.includes(TranslationView.LOCK_FRAGMENT)) {
                    found = true;
                    this.selectRow(row);
                    break;
                }
            }
            if (!found) {
                ipcRenderer.send('show-message', { type: 'warning', message: 'No more unconfirmed segments on this page' });
            }
        }
        if (next === 'needsAction' && this.currentRow) {
            let found: boolean = false;
            let length: number = rows.length;
            for (let i: number = this.currentRow.rowIndex; i < length; i++) {
                let row: HTMLTableRowElement = (rows[i] as HTMLTableRowElement);
                let cell: HTMLTableCellElement = row.getElementsByClassName('state')[0] as HTMLTableCellElement;
                if (cell.classList.contains('locked')) {
                    continue;
                }
                if ((cell.classList.contains('initial') || cell.classList.contains('translated')) && !row.innerHTML.includes(TranslationView.LOCK_FRAGMENT)) {
                    found = true;
                    this.selectRow(row);
                    break;
                }
            }
            if (!found) {
                ipcRenderer.send('show-message', { type: 'warning', message: 'No more segments needing action on this page' });
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

    nextNeedsAction(): void {
        this.saveEdit({ confirm: false, next: 'needsAction' });
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
        if (this.currentContent === this.currentCell?.innerHTML) {
            return;
        }
        let currentState: HTMLTableCellElement = this.currentRow?.getElementsByClassName('state')[0] as HTMLTableCellElement;
        if (!currentState.classList.contains('final')) {
            return;
        }
        currentState.classList.remove('final');
        if (this.currentCell?.innerHTML === '') {
            currentState.classList.add('initial');
            currentState.innerHTML = TranslationView.SVG_BLANK;
        } else {
            currentState.classList.add('translated');
            currentState.innerHTML = TranslationView.TRANSLATED_SPAN;
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
        let id: string = this.currentRow.getAttribute('data-id') as string;
        let file: string = this.currentRow.getAttribute('data-file') as string;
        let unit: string = this.currentRow.getAttribute('data-unit') as string;

        this.selectFile(file);

        this.currentId = { id: id, file: file, unit: unit };
        let source: HTMLTableCellElement = this.currentRow.getElementsByClassName('source')[0] as HTMLTableCellElement;
        this.sourceTags = this.getTags(source);

        this.currentCell = this.currentRow.getElementsByClassName('target')[0] as HTMLTableCellElement;
        this.currentCell.addEventListener('keyup', () => this.changeListener());

        let currentTranslate: HTMLTableCellElement = this.currentRow.getElementsByClassName('translate')[0] as HTMLTableCellElement;
        this.currentContent = this.currentCell.innerHTML;
        if (!currentTranslate.innerHTML.includes(TranslationView.LOCK_FRAGMENT)) {
            this.currentCell.contentEditable = 'true';
            this.currentCell.classList.add('editing');
        }

        this.tmMatches?.clear();
        this.mtMatches?.clear();
        this.termsPanel?.clear();

        let params: any = {
            project: this.projectId,
            file: this.currentId.file,
            unit: this.currentId.unit,
            segment: this.currentId.id
        };
        ipcRenderer.send('get-matches', params);
        ipcRenderer.send('get-terms', params);
        if (this.notesVisible) {
            this.showNotes();
        }
        if (this.commentsVisible) {
            this.showReviewComments();
        }
        this.centerRow(this.currentRow);
        this.currentCell.focus();
    }

    editSource(): void {
        if (this.currentRow) {
            let currentState: HTMLTableCellElement = this.currentRow.getElementsByClassName('state')[0] as HTMLTableCellElement;
            if (currentState.classList.contains('final')) {
                ipcRenderer.send('show-message', { type: 'warning', message: 'Confirmed segment' });
                return;
            }

            let currentTranslate: HTMLTableCellElement = this.currentRow.getElementsByClassName('translate')[0] as HTMLTableCellElement;
            let isLocked: boolean = currentTranslate.innerHTML.includes(TranslationView.LOCK_FRAGMENT);
            if (isLocked) {
                ipcRenderer.send('show-message', { type: 'warning', message: 'Locked segment' });
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
                    if (this.currentCell) {
                        this.currentCell.contentEditable = 'true';
                        this.currentCell.focus();
                    }
                }
            });
            source.addEventListener('focusout', () => {
                this.saveSource(segmentId, source, originalSource);
            });
        }
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
        ipcRenderer.send('save-source', {
            project: this.projectId,
            file: segmentId.file,
            unit: segmentId.unit,
            segment: segmentId.id,
            newSource: newSource
        });
    }

    cancelEdit(): void {
        if (this.currentCell) {
            this.currentCell.innerHTML = this.currentContent;
        }
    }

    getTags(element: HTMLTableCellElement): Map<string, string> {
        let map: Map<string, string> = new Map<string, string>();
        let children: HTMLCollectionOf<HTMLImageElement> = element.getElementsByTagName('img');
        let length: number = children.length;
        for (let i = 0; i < length; i++) {
            let child: HTMLElement = children[i];
            map.set(child.getAttribute('data-id') as string, child.outerHTML);
        }
        return map;
    }

    copySource(): void {
        if (this.currentRow) {
            let source: HTMLTableCellElement = this.currentRow.getElementsByClassName('source')[0] as HTMLTableCellElement;
            let currentTranslate: HTMLTableCellElement = this.currentRow.getElementsByClassName('translate')[0] as HTMLTableCellElement;
            let currentState: HTMLTableCellElement = this.currentRow.getElementsByClassName('state')[0] as HTMLTableCellElement;
            this.currentCell = this.currentRow.getElementsByClassName('target')[0] as HTMLTableCellElement;
            if (currentTranslate.innerHTML.includes(TranslationView.LOCK_FRAGMENT)) {
                ipcRenderer.send('show-message', { type: 'warning', message: 'Locked segment' });
                return;
            }
            let hasNotes = currentState.innerHTML.includes(TranslationView.NOTE_FRAGMENT);

            if (this.currentCell.innerHTML === source.innerHTML) {
                return;
            }
            this.currentCell.innerHTML = source.innerHTML;
            currentState.classList.remove('final');
            if (source.innerHTML === '') {
                currentState.classList.add('initial');
                if (hasNotes) {
                    let span: HTMLSpanElement = document.createElement('span');
                    span.innerHTML = TranslationView.NOTES_SPAN;
                    span.addEventListener('click', () => {
                        ipcRenderer.send('show-notes', {
                            project: this.projectId,
                            file: this.currentId.file,
                            unit: this.currentId.unit,
                            segment: this.currentId.id,
                        });
                    });
                    currentState.appendChild(span);
                } else {
                    currentState.innerHTML = TranslationView.SVG_BLANK;
                }
            } else {
                currentState.classList.add('translated');
                currentState.innerHTML = TranslationView.TRANSLATED_SPAN;
                if (hasNotes) {
                    let span: HTMLSpanElement = document.createElement('span');
                    span.innerHTML = TranslationView.NOTES_SPAN;
                    span.addEventListener('click', () => {
                        ipcRenderer.send('show-notes', {
                            project: this.projectId,
                            file: this.currentId.file,
                            unit: this.currentId.unit,
                            segment: this.currentId.id,
                        });
                    });
                    currentState.appendChild(span);
                }
            }
            this.currentCell.focus();
        }
    }

    insertTag(arg: any): void {
        let currentTranslate: HTMLTableCellElement = this.currentRow?.getElementsByClassName('translate')[0] as HTMLTableCellElement;
        let isLocked: boolean = currentTranslate.innerHTML.includes(TranslationView.LOCK_FRAGMENT);
        if (isLocked) {
            ipcRenderer.send('show-message', { type: 'warning', message: 'Locked segment' });
            return;
        }
        if (arg.tag) {
            let tag: string = '' + arg.tag;
            if (this.sourceTags.has(tag) && this.currentRow) {
                let target: HTMLTableCellElement = this.currentRow.getElementsByClassName('target')[0] as HTMLTableCellElement;
                let selection: Selection | null = document.getSelection();
                let savedRange: Range | null = null;
                if (selection && selection.rangeCount > 0) {
                    savedRange = selection.getRangeAt(0).cloneRange();
                }
                let targetTags: Map<string, string> = this.getTags(target);
                if (targetTags.has(tag)) {
                    this.removeTag(tag);
                }
                if (savedRange && selection) {
                    selection.removeAllRanges();
                    selection.addRange(savedRange);
                }
                let svg: string = this.sourceTags.get(tag) as string;
                Main.insertHtmlAtSelection(svg);
            }
        } else {
            ipcRenderer.send('show-tag-window');
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
        this.tmMatches?.clear();
        this.mtMatches?.clear();
        let length: number = matches.length;
        let max: number = 0;
        for (let i: number = 0; i < length; i++) {
            let match: any = matches[i];
            match.project = this.projectId;
            if (match.type === 'tm') {
                this.tmMatches?.add(match);
                if (match.similarity > max) {
                    max = match.similarity;
                }
            }
            if (match.type === 'mt' || match.type === 'am') {
                this.mtMatches?.add(match);
            }
        }
        if (max > 0 && this.currentRow) {
            (this.currentRow.getElementsByClassName('match')[0] as HTMLTableCellElement).innerHTML = max + '%';
        }
    }

    setTerms(terms: any[]): void {
        this.termsPanel?.setTerms(terms);
    }

    setTarget(arg: any): void {
        let rows: HTMLCollectionOf<HTMLTableRowElement> = this.tbody.getElementsByTagName('tr');
        let length: number = rows.length;
        for (let i: number = 0; i < length; i++) {
            let row: HTMLTableRowElement = rows[i];
            if (row.getAttribute('data-file') === arg.file && row.getAttribute('data-unit') === arg.unit
                && row.getAttribute('data-id') === arg.segment) {
                let targetCell: HTMLTableCellElement = row.getElementsByClassName('target')[0] as HTMLTableCellElement;
                if (targetCell.innerHTML === arg.target) {
                    return;
                }
                targetCell.innerHTML = arg.target;
                if (row === this.currentRow) {
                    this.currentCell = targetCell;
                }

                let stateCell: HTMLTableCellElement = row.getElementsByClassName('state')[0] as HTMLTableCellElement;
                let hadNotes: boolean = stateCell.innerHTML.includes(TranslationView.NOTE_FRAGMENT);
                let hadComments: boolean = stateCell.innerHTML.includes(TranslationView.SVG_COMMENT);
                let wasFinal: boolean = stateCell.classList.contains('final');

                if (arg.target === '') {
                    stateCell.classList.remove('translated');
                    stateCell.classList.remove('final');
                    stateCell.classList.add('initial');
                    stateCell.innerHTML = TranslationView.SVG_BLANK;
                } else if (wasFinal) {
                    stateCell.classList.remove('initial');
                    stateCell.classList.remove('translated');
                    stateCell.classList.add('final');
                    stateCell.innerHTML = TranslationView.FINAL_SPAN;
                } else {
                    stateCell.classList.remove('initial');
                    stateCell.classList.remove('final');
                    stateCell.classList.add('translated');
                    stateCell.innerHTML = TranslationView.TRANSLATED_SPAN;
                }

                if (hadNotes) {
                    let span: HTMLSpanElement = document.createElement('span');
                    span.innerHTML = TranslationView.NOTES_SPAN;
                    span.addEventListener('click', () => {
                        ipcRenderer.send('show-notes', {
                            project: arg.project,
                            file: arg.file,
                            unit: arg.unit,
                            segment: arg.segment,
                        });
                    });
                    stateCell.appendChild(span);
                }

                if (hadComments || arg.hasMetadata) {
                    let span: HTMLSpanElement = document.createElement('span');
                    span.classList.add('iconTooltip');
                    span.innerHTML = TranslationView.COMMENT_SPAN;
                    span.addEventListener('click', () => {
                        let metaId: MetaId = {
                            project: arg.project,
                            file: arg.file,
                            unit: arg.unit,
                            segment: arg.segment
                        };
                        ipcRenderer.send('show-metadata', metaId);
                    });
                    stateCell.appendChild(span);
                }

                if (row === this.currentRow) {
                    targetCell.focus();
                }
                break;
            }
        }
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
        ipcRenderer.send('spell-language', this.tgtLang);
    }

    sortSegments(): void {
        let params: any = {
            projectId: this.projectId,
            sortOption: this.sortOption,
            sortDesc: this.sortDesc
        };
        ipcRenderer.send('show-sort-segments', params);
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
            showConfirmed: this.showConfirmed,
            showReviewed: this.showReviewed
        };
        ipcRenderer.send('show-filter-segments', params);
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
        const sameFilters = this.filterText === args.filterText
            && this.filterLanguage === args.filterLanguage
            && this.caseSensitiveFilter === args.caseSensitiveFilter
            && this.regExp === args.regExp
            && this.showUntranslated === args.showUntranslated
            && this.showTranslated === args.showTranslated
            && this.showConfirmed === args.showConfirmed
            && this.showReviewed === args.showReviewed;
        if (sameFilters) {
            return;
        }
        this.filterText = args.filterText;
        this.filterLanguage = args.filterLanguage;
        this.caseSensitiveFilter = args.caseSensitiveFilter;
        this.regExp = args.regExp;
        this.showUntranslated = args.showUntranslated;
        this.showTranslated = args.showTranslated;
        this.showConfirmed = args.showConfirmed;
        this.showReviewed = args.showReviewed;
        this.saveEdit({ confirm: false, next: 'none' });
        const hasActiveFilter = this.filterText.trim() !== ''
            || !this.showUntranslated
            || !this.showTranslated
            || !this.showConfirmed
            || !this.showReviewed;
        if (hasActiveFilter) {
            this.filterButton.classList.add('active');
        } else {
            this.filterButton.classList.remove('active');
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
        ipcRenderer.send('show-apply-tm', { project: this.projectId, memory: this.memSelect.value });
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
        ipcRenderer.send('remove-translations', { project: this.projectId });
    }

    removeAllMatches(): void {
        this.returnTo = {
            file: this.currentId.file,
            unit: this.currentId.unit,
            id: this.currentId.id
        }
        ipcRenderer.send('remove-all-matches', { project: this.projectId });
    }

    removeAllMachineTranslations(): void {
        this.returnTo = {
            file: this.currentId.file,
            unit: this.currentId.unit,
            id: this.currentId.id
        }
        ipcRenderer.send('remove-machine-translations', { project: this.projectId });
    }

    unconfirmAllTranslations(): void {
        this.returnTo = {
            file: this.currentId.file,
            unit: this.currentId.unit,
            id: this.currentId.id
        }
        ipcRenderer.send('unconfirm-translations', { project: this.projectId });
    }

    pseudoTranslate(): void {
        ipcRenderer.send('pseudo-translate', { project: this.projectId });
    }

    copyAllSources(): void {
        this.returnTo = {
            file: this.currentId.file,
            unit: this.currentId.unit,
            id: this.currentId.id
        }
        ipcRenderer.send('copy-sources', { project: this.projectId });
    }

    confirmAllTranslations(): void {
        this.returnTo = {
            file: this.currentId.file,
            unit: this.currentId.unit,
            id: this.currentId.id
        }
        ipcRenderer.send('confirm-translations', { project: this.projectId, memory: this.memSelect.value });
    }

    acceptAll100Matches(): void {
        this.returnTo = {
            file: this.currentId.file,
            unit: this.currentId.unit,
            id: this.currentId.id
        }
        ipcRenderer.send('accept-100-matches', { project: this.projectId });
    }

    insertNextTag(): void {
        if (this.currentRow) {
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
    }

    insertRemainingTags(): void {
        if (this.currentRow) {
            let target: HTMLTableCellElement = this.currentRow.getElementsByClassName('target')[0] as HTMLTableCellElement;
            let targetTags = this.getTags(target);
            let length = this.sourceTags.size + 1;
            let tags: string = '';
            let selection: Selection | null = document.getSelection();
            let savedRange: Range | null = null;
            if (selection && selection.rangeCount > 0) {
                savedRange = selection.getRangeAt(0).cloneRange();
            }
            for (let i = 1; i < length; i++) {
                if (!targetTags.has('' + i)) {
                    tags = tags + this.sourceTags.get('' + i);
                }
            }
            if (tags !== '') {
                if (savedRange && selection) {
                    selection.removeAllRanges();
                    selection.addRange(savedRange);
                }
                Main.insertHtmlAtSelection(tags);
            }
        }
    }

    fixTags(): void {
        if (this.currentRow) {
            this.returnTo = {
                file: this.currentId.file,
                unit: this.currentId.unit,
                id: this.currentId.id
            }
        }
        ipcRenderer.send('fix-segment-tags', {
            srcLang: this.srcLang,
            tgtLang: this.tgtLang,
            project: this.projectId,
            file: this.currentId.file,
            unit: this.currentId.unit,
            segment: this.currentId.id
        });
    }

    openAiPrompt() {
        if (this.currentRow) {
            this.returnTo = {
                file: this.currentId.file,
                unit: this.currentId.unit,
                id: this.currentId.id
            }
        }
        ipcRenderer.send('open-prompt', {
            srcLang: this.srcLang,
            tgtLang: this.tgtLang,
            project: this.projectId,
            file: this.currentId.file,
            unit: this.currentId.unit,
            segment: this.currentId.id
        });
    }

    generatePrompt(): void {
        if (this.currentRow) {
            this.returnTo = {
                file: this.currentId.file,
                unit: this.currentId.unit,
                id: this.currentId.id
            }
        }
        ipcRenderer.send('generate-prompt', {
            srcLang: this.srcLang,
            tgtLang: this.tgtLang,
            project: this.projectId,
            file: this.currentId.file,
            unit: this.currentId.unit,
            segment: this.currentId.id
        });
    }

    insertAiResponse(response: string): void {
        ipcRenderer.send('insert-response', {
            project: this.projectId,
            file: this.currentId.file,
            unit: this.currentId.unit,
            segment: this.currentId.id,
            target: response
        });
    }

    removeTags(): void {
        if (this.currentRow) {
            let target: HTMLTableCellElement = this.currentRow.getElementsByClassName('target')[0] as HTMLTableCellElement;
            let tags: NodeListOf<Element> = target.querySelectorAll('img');
            for (let i = 0; i < tags.length; i++) {
                target.removeChild(tags[i]);
            }
        }
    }

    removeTag(tag: string): void {
        if (this.currentRow) {
            let target: HTMLTableCellElement = this.currentRow.getElementsByClassName('target')[0] as HTMLTableCellElement;
            let images: HTMLCollectionOf<HTMLImageElement> = target.getElementsByTagName('img');
            for (let img of images) {
                if (tag === img.getAttribute('data-id')) {
                    target.removeChild(img);
                }
            }
        }
    }

    replaceText(): void {
        ipcRenderer.send('show-replaceText', { project: this.projectId });
    }

    applyMachineTranslationsAll(): void {
        this.returnTo = {
            file: this.currentId.file,
            unit: this.currentId.unit,
            id: this.currentId.id
        }
        ipcRenderer.send('apply-mt-all', {
            project: this.projectId, srcLang: this.srcLang, tgtLang: this.tgtLang, currentSegment: {
                file: this.currentId.file,
                unit: this.currentId.unit,
                id: this.currentId.id
            }
        });
    }

    assembleMatchesAll(): void {
        if (this.memSelect.value === 'none') {
            ipcRenderer.send('show-message', { type: 'warning', message: 'Select memory' });
            return;
        }
        if (this.glossSelect.value === 'none') {
            ipcRenderer.send('show-message', { type: 'warning', message: 'Select glossary' });
            return;
        }
        this.returnTo = {
            file: this.currentId.file,
            unit: this.currentId.unit,
            id: this.currentId.id
        }
        ipcRenderer.send('assemble-matches-all', {
            project: this.projectId,
            memory: this.memSelect.value,
            glossary: this.glossSelect.value
        });
    }

    removeAssembleMatches(): void {
        ipcRenderer.send('remove-assembled-matches', { project: this.projectId });
    }

    acceptAllMachineTranslations(): void {
        this.returnTo = {
            file: this.currentId.file,
            unit: this.currentId.unit,
            id: this.currentId.id
        }
        ipcRenderer.send('accept-mt-all', { project: this.projectId });
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
            ipcRenderer.send('show-message', { type: 'warning', message: 'Select memory' });
            return;
        }
        ipcRenderer.send('concordance-search', [this.memSelect.value]);
    }

    searchTerm(): void {
        if (this.glossSelect.value === 'none') {
            ipcRenderer.send('show-message', { type: 'warning', message: 'Select glossary' });
            return;
        }
        ipcRenderer.send('show-term-search', this.glossSelect.value);
    }

    addTerm(): void {
        if (this.glossSelect.value === 'none') {
            ipcRenderer.send('show-message', { type: 'warning', message: 'Select glossary' });
            return;
        }
        ipcRenderer.send('show-add-term', this.glossSelect.value);
    }

    applyTerminologyAll(): void {
        if (this.glossSelect.value === 'none') {
            ipcRenderer.send('show-message', { type: 'warning', message: 'Select glossary' });
            return;
        }
        this.returnTo = {
            file: this.currentId.file,
            unit: this.currentId.unit,
            id: this.currentId.id
        }
        ipcRenderer.send('get-project-terms', { project: this.projectId, glossary: this.glossSelect.value });
    }

    applyTerminology(): void {
        if (this.glossSelect.value === 'none') {
            ipcRenderer.send('show-message', { type: 'warning', message: 'Select glossary' });
            return;
        }
        if (!this.currentCell) {
            ipcRenderer.send('show-message', { type: 'warning', message: 'Select segment' });
            return;
        }
        ipcRenderer.send('get-segment-terms', {
            project: this.projectId,
            file: this.currentId.file,
            unit: this.currentId.unit,
            segment: this.currentId.id,
            glossary: this.glossSelect.value
        });
    }

    insertTerm(arg: any): void {
        if (this.termsPanel) {
            let term: string = '';
            if (arg.term) {
                term = this.termsPanel.getTerm(arg.term);
            } else {
                term = this.termsPanel.getSelected();
            }
            if (term !== '') {
                ipcRenderer.send('paste-text', term);
            }
        }
    }

    toggleLock(): void {
        if (this.currentRow) {
            ipcRenderer.send('lock-segment', {
                project: this.projectId,
                file: this.currentId.file,
                unit: this.currentId.unit,
                segment: this.currentId.id
            });
            let currentTranslate: HTMLTableCellElement = this.currentRow.getElementsByClassName('translate')[0] as HTMLTableCellElement;
            let isLocked: boolean = currentTranslate.innerHTML.includes(TranslationView.LOCK_FRAGMENT);
            currentTranslate.innerHTML = isLocked ? TranslationView.SVG_BLANK : TranslationView.LOCK_SPAN;
            this.currentRow.classList.toggle('locked');
            this.selectRow(this.currentRow);
            return;
        }
        ipcRenderer.send('show-message', { type: 'warning', message: 'Select segment' });
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
        this.tmMatches?.nextMatch();
    }

    previousMatch(): void {
        this.tmMatches?.previousMatch();
    }

    nextMT(): void {
        this.mtMatches?.nextMatch();
    }

    previousMT(): void {
        this.mtMatches?.previousMatch();
    }

    gotoNext(): void {
        this.saveEdit({ next: 'next', confirm: false });
    }

    gotoPrevious(): void {
        this.saveEdit({ next: 'previous', confirm: false });
    }

    goToSameSource(): void {
        let segment: FullId = { project: this.projectId, file: this.currentId.file, unit: this.currentId.unit, segment: this.currentId.id };
        ipcRenderer.send('go-to-same-source', segment);
    }

    openSegment(seg: number): void {
        if (this.currentPage * this.rowsPage <= seg && seg < (this.currentPage + 1) * this.rowsPage) {
            this.saveEdit({ next: 'number', confirm: false, segment: seg });
        } else {
            let page = Math.floor(seg / this.rowsPage) + 1;
            if (page >= 0 && page <= this.maxPage) {
                this.returnNumber = seg;
                this.currentPage = page - 1;
                let pageInput: HTMLInputElement = document.getElementById('page' + this.projectId) as HTMLInputElement;
                pageInput.value = '' + (this.currentPage + 1);
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
        this.termsPanel?.selectNextTerm();
    }

    selectPreviousTerm(): void {
        this.termsPanel?.selectPreviousTerm();
    }

    exportHTML(): void {
        ipcRenderer.send('export-project-html', this.projectId);
    }

    changeCase(): void {
        if (!this.currentCell) {
            ipcRenderer.send('show-message', { type: 'warning', message: 'Select segment' });
            return;
        }
        let translation = this.currentCell.innerText.trim();
        if (translation === '') {
            ipcRenderer.send('show-message', { type: 'warning', message: 'Empty target' });
            return;
        }
        ipcRenderer.send('show-change-case');
    }

    caseChanged(arg: any): void {
        this.currentCell = this.currentRow?.getElementsByClassName('target')[0] as HTMLTableCellElement;
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
        let currentState: HTMLTableCellElement = this.currentRow?.getElementsByClassName('state')[0] as HTMLTableCellElement;
        if (currentState.classList.contains('final')) {
            ipcRenderer.send('show-message', { type: 'warning', message: 'Confirmed segment' });
            return;
        }
        let currentTranslate: HTMLTableCellElement = this.currentRow?.getElementsByClassName('translate')[0] as HTMLTableCellElement;
        let isLocked: boolean = currentTranslate.innerHTML.includes(TranslationView.LOCK_FRAGMENT);
        if (isLocked) {
            ipcRenderer.send('show-message', { type: 'warning', message: 'Locked segment' });
            return;
        }
        if (this.currentRow) {
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
            this.currentCell?.focus();
        }

        if (event.key === 'Enter' || event.key === 'NumpadEnter') {
            event.preventDefault();
            let selection: Selection | null = window.getSelection();
            if (selection && selection.rangeCount !== 0) {
                let source: HTMLTableCellElement = event.currentTarget as HTMLTableCellElement;
                let anchorNode: Node = selection.anchorNode as Node;
                source.contentEditable = 'false';
                if (selection.anchorOffset === 0 || selection.anchorOffset === anchorNode.textContent?.length) {
                    source.innerHTML = originalHTML;
                    this.currentCell?.focus();
                } else {
                    this.returnTo = {
                        file: this.currentId.file,
                        unit: this.currentId.unit,
                        id: this.currentId.id + '-1'
                    }
                    ipcRenderer.send('split-at', {
                        project: this.projectId,
                        file: this.currentId.file,
                        unit: this.currentId.unit,
                        segment: this.currentId.id,
                        text: anchorNode.textContent,
                        offset: selection.anchorOffset
                    });
                }
            }
        }
    }

    mergeNext(): void {
        if (this.currentRow) {
            let currentState: HTMLTableCellElement = this.currentRow.getElementsByClassName('state')[0] as HTMLTableCellElement;
            if (currentState.classList.contains('final')) {
                ipcRenderer.send('show-message', { type: 'warning', message: 'Confirmed segment' });
                return;
            }
            let currentTranslate: HTMLTableCellElement = this.currentRow.getElementsByClassName('translate')[0] as HTMLTableCellElement;
            let isLocked: boolean = currentTranslate.innerHTML.includes(TranslationView.LOCK_FRAGMENT);
            if (isLocked) {
                ipcRenderer.send('show-message', { type: 'warning', message: 'Locked segment' });
                return;
            }
            let nextRow: HTMLTableRowElement = this.currentRow.nextElementSibling as HTMLTableRowElement;
            if (nextRow) {
                if (this.currentRow.getAttribute('data-file') === nextRow.getAttribute('data-file') && this.currentRow.getAttribute('data-unit') === nextRow.getAttribute('data-unit')) {
                    if (nextRow.getElementsByClassName('state')[0].classList.contains('final')) {
                        ipcRenderer.send('show-message', { type: 'warning', message: 'Confirmed segment' });
                        return;
                    }
                    if (nextRow.getElementsByClassName('translate')[0].innerHTML.includes(TranslationView.LOCK_FRAGMENT)) {
                        ipcRenderer.send('show-message', { type: 'warning', message: 'Locked segment' });
                        return;
                    }
                    this.returnTo = {
                        file: this.currentId.file,
                        unit: this.currentId.unit,
                        id: this.currentId.id
                    }
                    ipcRenderer.send('merge-at', {
                        project: this.projectId,
                        file: this.currentId.file,
                        unit: this.currentId.unit,
                        segment: this.currentId.id
                    });
                    return;
                }
                ipcRenderer.send('show-message', { type: 'warning', message: 'Segments from different paragraphs' });
            }
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
                if (arg.hasMetadata) {
                    let span: HTMLSpanElement = document.createElement('span');
                    span.classList.add('iconTooltip');
                    span.innerHTML = TranslationView.COMMENT_SPAN;
                    span.addEventListener('click', (event: MouseEvent) => {
                        let metaId: MetaId = {
                            project: arg.project,
                            file: arg.file,
                            unit: arg.unit,
                            segment: arg.segment
                        };
                        ipcRenderer.send('show-metadata', metaId);
                    });
                    td.appendChild(span);
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
                if (arg.hasMetadata) {
                    let span: HTMLSpanElement = document.createElement('span');
                    span.classList.add('iconTooltip');
                    span.innerHTML = TranslationView.COMMENT_SPAN;
                    span.classList.add('iconTooltip');
                    span.addEventListener('click', (event: MouseEvent) => {
                        let metaId: MetaId = {
                            project: arg.project,
                            file: arg.file,
                            unit: arg.unit,
                            segment: arg.segment
                        };
                        ipcRenderer.send('show-metadata', metaId);
                    });
                    td.appendChild(span);
                }
                break;
            }
        }
    }

    showNotes(): void {
        ipcRenderer.send('show-notes', {
            project: this.projectId,
            file: this.currentId.file,
            unit: this.currentId.unit,
            segment: this.currentId.id
        });
    }

    showReviewComments(): void {
        let data: MetaId = {
            project: this.projectId,
            file: this.currentId.file,
            unit: this.currentId.unit,
            segment: this.currentId.id
        };
        ipcRenderer.send('show-metadata', data);
    }

    showingNotes(arg: boolean): void {
        this.notesVisible = arg;
    }

    showingReviewComments(arg: boolean): void {
        this.commentsVisible = arg;
    }

    notesRemoved(): void {
        let currentState: HTMLTableCellElement = this.currentRow?.getElementsByClassName('state')[0] as HTMLTableCellElement;
        if (currentState.innerHTML.includes(TranslationView.NOTE_FRAGMENT)) {
            if (currentState.classList.contains('final')) {
                currentState.innerHTML = TranslationView.FINAL_SPAN;
            }
            if (currentState.classList.contains('initial')) {
                currentState.innerHTML = TranslationView.SVG_BLANK;
            }
            if (currentState.classList.contains('translated')) {
                currentState.innerHTML = TranslationView.TRANSLATED_SPAN;
            }
        }
    }

    notesAdded(): void {
        let currentState: HTMLTableCellElement = this.currentRow?.getElementsByClassName('state')[0] as HTMLTableCellElement;
        if (!currentState.innerHTML.includes(TranslationView.NOTE_FRAGMENT)) {
            if (currentState.classList.contains('final')) {
                currentState.innerHTML = TranslationView.FINAL_SPAN;
            }
            if (currentState.classList.contains('initial')) {
                currentState.innerHTML = TranslationView.SVG_BLANK;
            }
            if (currentState.classList.contains('translated')) {
                currentState.innerHTML = TranslationView.TRANSLATED_SPAN;
            }
            let span: HTMLSpanElement = document.createElement('span');
            span.innerHTML = TranslationView.NOTES_SPAN;
            span.addEventListener('click', () => {
                ipcRenderer.send('show-notes', {
                    project: this.projectId,
                    file: this.currentId.file,
                    unit: this.currentId.unit,
                    segment: this.currentId.id,
                });
            });
            currentState.appendChild(span);
        }
    }

    updateTarget(arg: any) {
        let rows: HTMLCollectionOf<HTMLTableRowElement> = this.tbody.getElementsByTagName('tr');
        let length: number = rows.length;
        for (let i: number = 0; i < length; i++) {
            let row: HTMLTableRowElement = rows[i];
            if (row.getAttribute('data-file') === arg.file && row.getAttribute('data-unit') === arg.unit
                && row.getAttribute('data-id') === arg.segment) {
                setTimeout(() => {
                    let td: HTMLTableCellElement = row.getElementsByClassName('target')[0] as HTMLTableCellElement;
                    let oldTags: number = td.getElementsByTagName('img').length;
                    td.innerHTML = arg.target;
                    let newTags: number = td.getElementsByTagName('img').length;
                    if (oldTags !== newTags) {
                        ipcRenderer.send('show-notification', 'Extra tags were removed');
                    }
                }, 600);
                break;
            }
        }
    }

    updateTargetCell(arg: any) {
        setTimeout(() => {
            let rows: HTMLCollectionOf<HTMLTableRowElement> = this.tbody.getElementsByTagName('tr');
            let length: number = rows.length;
            for (let i: number = 0; i < length; i++) {
                let row: HTMLTableRowElement = rows[i];
                if (row.getAttribute('data-file') === arg.file && row.getAttribute('data-unit') === arg.unit
                    && row.getAttribute('data-id') === arg.segment) {
                    let td: HTMLTableCellElement = row.getElementsByClassName('target')[0] as HTMLTableCellElement;
                    td.innerHTML = arg.target;
                    break;
                }
            }
        }, 400);
    }
}