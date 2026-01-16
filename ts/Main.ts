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
import { GlossariesView } from "./glossaries.js";
import { MemoriesView } from "./memories.js";
import { MetaId } from "./metadata.js";
import { Project } from "./project.js";
import { ProjectsView } from "./projects.js";
import { FullId } from "./segmentId.js";
import { Tab, TabHolder } from "./tabs.js";
import { TranslationView } from "./translation.js";

export class Main {

    static tabHolder: TabHolder;
    static translationViews: Map<string, TranslationView>;

    static mainContainer: HTMLDivElement;
    static main: HTMLDivElement;

    projectsView: ProjectsView;
    memoriesView: MemoriesView;
    glossariesView: GlossariesView;

    static rowsPage: number;

    constructor() {
        Main.translationViews = new Map<string, TranslationView>();
        Main.mainContainer = document.getElementById('mainContainer') as HTMLDivElement;
        Main.tabHolder = new TabHolder(Main.mainContainer, 'main');

        Main.main = document.getElementById('main') as HTMLDivElement;

        let projectsTab: Tab = new Tab('projects', 'Projects', false, Main.tabHolder);
        this.projectsView = new ProjectsView(projectsTab.getContainer());
        projectsTab.getLabelDiv().addEventListener('click', () => {
            this.projectsView.setSizes();
        });
        Main.tabHolder.addTab(projectsTab);

        let memoriesTab: Tab = new Tab('memories', 'Memories', false, Main.tabHolder);
        this.memoriesView = new MemoriesView(memoriesTab.getContainer());
        memoriesTab.getLabelDiv().addEventListener('click', () => {
            this.memoriesView.setSizes();
        });
        Main.tabHolder.addTab(memoriesTab);

        let glossariesTab: Tab = new Tab('glossaries', 'Glossaries', false, Main.tabHolder);
        this.glossariesView = new GlossariesView(glossariesTab.getContainer());
        glossariesTab.getLabelDiv().addEventListener('click', () => {
            this.glossariesView.setSizes();
        });
        Main.tabHolder.addTab(glossariesTab);

        Main.tabHolder.selectTab('projects');

        let observerOptions: MutationObserverInit = {
            childList: true,
            attributes: false
        }
        let tabsObserver: MutationObserver = new MutationObserver((mutationList) => {
            mutationList.forEach((mutation) => {
                switch (mutation.type) {
                    case 'childList':
                        Main.checkTabs();
                        break;
                    case 'attributes':
                        break;
                }
            });
        });
        tabsObserver.observe(Main.tabHolder.getTabsHolder(), observerOptions);

        ipcRenderer.send('get-theme');
        ipcRenderer.on('set-theme', (event: IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        ipcRenderer.send('get-rows-page');
        ipcRenderer.on('set-rows-page', (event: IpcRendererEvent, rows: number) => {
            Main.rowsPage = rows;
        });
        window.addEventListener('resize', () => {
            Main.resizePanels();
        });
        ipcRenderer.on('app-ready', (event: IpcRendererEvent, contentSize: number[]) => {
            Main.mainContainer.style.width = contentSize[0] + 'px';
            Main.mainContainer.style.height = contentSize[1] + 'px';
        });
        ipcRenderer.on('view-projects', () => {
            Main.tabHolder.selectTab('projects');
        });
        ipcRenderer.on('request-projects', (event: IpcRendererEvent, arg: any) => {
            this.projectsView.loadProjects(arg);
        });
        ipcRenderer.on('export-xliff-review', () => {
            this.projectsView.exportXLIFF();
        });
        ipcRenderer.on('edit-project', () => {
            this.projectsView.editProject();
        });
        ipcRenderer.on('remove-projects', () => {
            this.projectsView.removeProjects();
        });
        ipcRenderer.on('export-translations', () => {
            this.exportTranslations();
        });
        ipcRenderer.on('export-project', () => {
            this.projectsView.exportProject();
        });
        ipcRenderer.on('export-translations-tmx', () => {
            this.projectsView.exportTMX();
        });
        ipcRenderer.on('export-matches', () => {
            this.projectsView.exportMatches();
        });
        ipcRenderer.on('export-terminology-all', () => {
            this.projectsView.exportTerms();
        });
        ipcRenderer.on('split-segment', () => {
            this.splitSegment();
        });
        ipcRenderer.on('merge-next', () => {
            this.mergeNext();
        });
        ipcRenderer.on('view-memories', () => {
            Main.tabHolder.selectTab('memories');
        });
        ipcRenderer.on('request-memories', () => {
            this.memoriesView.loadMemories();
        });
        ipcRenderer.on('view-glossaries', () => {
            Main.tabHolder.selectTab('glossaries');
        });
        ipcRenderer.on('request-glossaries', () => {
            this.glossariesView.loadGlossaries();
        });
        ipcRenderer.on('close-tab', () => {
            this.closeTab();
        });
        ipcRenderer.on('start-waiting', () => {
            document.body.classList.add("wait");
        });
        ipcRenderer.on('end-waiting', () => {
            document.body.classList.remove("wait");
        });
        ipcRenderer.on('set-status', (event: IpcRendererEvent, arg: any) => {
            this.setStatus(arg);
        });
        ipcRenderer.on('add-tab', (event: IpcRendererEvent, arg: Project) => {
            this.addTab(arg);
        });
        ipcRenderer.on('translate-projects', () => {
            this.projectsView.openProjects();
        });
        ipcRenderer.on('remove-memory', () => {
            this.memoriesView.removeMemory();
        });
        ipcRenderer.on('import-tmx', () => {
            this.memoriesView.importTMX();
        });
        ipcRenderer.on('export-tmx', () => {
            this.memoriesView.exportTMX();
        });
        ipcRenderer.on('import-sdltm', () => {
            this.memoriesView.importSDLTM();
        });
        ipcRenderer.on('import-glossary', () => {
            this.glossariesView.importGlossary();
        });
        ipcRenderer.on('remove-glossary', () => {
            this.glossariesView.removeGlossary();
        });
        ipcRenderer.on('concordance-requested', () => {
            this.concordanceSearch();
        });
        ipcRenderer.on('get-selected-text', () => {
            this.getSelectedText();
        });
        ipcRenderer.on('term-search-requested', () => {
            this.searchTerm();
        });
        ipcRenderer.on('apply-terminology', () => {
            this.applyTerminology();
        });
        ipcRenderer.on('apply-terminology-all', () => {
            this.applyTerminologyAll();
        });
        ipcRenderer.on('add-term-requested', () => {
            this.addTerm();
        });
        ipcRenderer.on('export-glossary', () => {
            this.glossariesView.exportGlossary();
        });
        ipcRenderer.on('first-page', () => {
            this.firstPage();
        });
        ipcRenderer.on('previous-segment', () => {
            this.previousSegment();
        });
        ipcRenderer.on('next-segment', () => {
            this.nextSegment();
        });
        ipcRenderer.on('go-to', () => {
            this.goToSegment();
        });
        ipcRenderer.on('next-same-source', () => {
            this.goToSameSource();
        });
        ipcRenderer.on('open-segment', (event: IpcRendererEvent, seg: number) => {
            this.openSegment(seg);
        });
        ipcRenderer.on('previous-page', () => {
            this.previousPage();
        });
        ipcRenderer.on('next-page', () => {
            this.nextPage();
        });
        ipcRenderer.on('last-page', () => {
            this.lastPage();
        });
        ipcRenderer.on('next-untranslated', () => {
            this.nextUntranslated();
        });
        ipcRenderer.on('next-unconfirmed', () => {
            this.nextUnconfirmed();
        });
        ipcRenderer.on('cancel-edit', () => {
            this.cancelEdit();
        });
        ipcRenderer.on('save-edit', (event: IpcRendererEvent, arg: any) => {
            this.saveEdit(arg);
        });
        ipcRenderer.on('insert-next-tag', () => {
            this.insertNextTag();
        });
        ipcRenderer.on('insert-remaining-tags', () => {
            this.insertRemainingTags();
        });
        ipcRenderer.on('fix-tags', () => {
            this.fixTags();
        });
        ipcRenderer.on('set-project-files', (event: IpcRendererEvent, files: any[]) => {
            this.drawFiles(files);
        });
        ipcRenderer.on('update-target-cell', (event: IpcRendererEvent, arg: any) => {
            this.updateTargetCell(arg);
        });
        ipcRenderer.on('remove-tags', () => {
            this.removeTags();
        });
        ipcRenderer.on('confirm-all', () => {
            this.confirmAllTranslations();
        });
        ipcRenderer.on('unconfirm-all', () => {
            this.unconfirmAllTranslations();
        });
        ipcRenderer.on('remove-all', () => {
            this.removeAllTranslations();
        });
        ipcRenderer.on('remove-matches', () => {
            this.removeAllMatches();
        });
        ipcRenderer.on('copy-source', () => {
            this.copySource();
        });
        ipcRenderer.on('copy-all-sources', () => {
            this.copyAllSources();
        });
        ipcRenderer.on('pseudo-translate', () => {
            this.pseudoTranslate();
        });
        ipcRenderer.on('insert-tag', (event: IpcRendererEvent, arg: any) => {
            this.insertTag(arg);
        });
        ipcRenderer.on('insert-tem', (event: IpcRendererEvent, arg: any) => {
            this.insertTerm(arg);
        });
        ipcRenderer.on('select-previous-term', () => {
            this.selectPreviousTerm();
        });
        ipcRenderer.on('select-next-term', () => {
            this.selectNextTerm();
        });
        ipcRenderer.on('auto-propagate', (event: IpcRendererEvent, arg: any) => {
            this.autoPropagate(arg);
        });
        ipcRenderer.on('set-matches', (event: IpcRendererEvent, arg: any) => {
            this.setMatches(arg);
        });
        ipcRenderer.on('set-terms', (event: IpcRendererEvent, arg: any) => {
            this.setTerms(arg);
        });
        ipcRenderer.on('set-target', (event: IpcRendererEvent, arg: any) => {
            this.setTarget(arg);
        });
        ipcRenderer.on('get-mt-matches', () => {
            this.getMachineTranslations();
        });
        ipcRenderer.on('get-am-matches', () => {
            this.getAssembledMatches();
        });
        ipcRenderer.on('apply-am-all', () => {
            this.assembleMatchesAll();
        });
        ipcRenderer.on('remove-am-all', () => {
            this.removeAssembleMatches();
        });
        ipcRenderer.on('get-tm-matches', () => {
            this.getTmMatches();
        });
        ipcRenderer.on('apply-mt-all', () => {
            this.applyMachineTranslationsAll();
        });
        ipcRenderer.on('accept-all-mt', () => {
            this.acceptAllMachineTranslations();
        });
        ipcRenderer.on('remove-mt-all', () => {
            this.removeAllMachineTranslations();
        });
        ipcRenderer.on('apply-tm-all', () => {
            this.applyTranslationMemoryAll();
        });
        ipcRenderer.on('accept-all-matches', () => {
            this.acceptAll100Matches();
        });
        ipcRenderer.on('toggle-lock', () => {
            this.toggleLock();
        });
        ipcRenderer.on('lock-repeated', () => {
            this.lockRepeated();
        });
        ipcRenderer.on('unlock-segments', () => {
            this.unlockSegments();
        });
        ipcRenderer.on('set-project-memories', (event: IpcRendererEvent, arg: any) => {
            this.setProjectMemories(arg);
        });
        ipcRenderer.on('set-project-glossaries', (event: IpcRendererEvent, arg: any) => {
            this.setProjectGlossaries(arg);
        });
        ipcRenderer.on('reload-page', (event: IpcRendererEvent, projectId: string) => {
            this.reloadPage(projectId);
        });
        ipcRenderer.on('request-statistics', () => {
            this.requestStatistics();
        });
        ipcRenderer.on('set-statistics', (event: IpcRendererEvent, arg: any) => {
            this.setStatistics(arg);
        });
        ipcRenderer.on('sort-segments', () => {
            this.sortSegments();
        });
        ipcRenderer.on('set-sorting', (event: IpcRendererEvent, arg: any) => {
            this.setSorting(arg);
        });
        ipcRenderer.on('filter-segments', () => {
            this.filterSegments();
        });
        ipcRenderer.on('set-filters', (event: IpcRendererEvent, arg: any) => {
            this.setFilters(arg);
        });
        ipcRenderer.on('replace-text', () => {
            this.replaceText();
        });
        ipcRenderer.on('tags-analysis', () => {
            this.tagsAnalysis();
        });
        ipcRenderer.on('spaces-analysis', () => {
            this.spacesAnalysis();
        });
        ipcRenderer.on('next-match', () => {
            this.nextMatch();
        });
        ipcRenderer.on('previous-match', () => {
            this.previousMatch();
        });
        ipcRenderer.on('next-mt', () => {
            this.nextMT();
        });
        ipcRenderer.on('previous-mt', () => {
            this.previousMT();
        });
        ipcRenderer.on('export-html', () => {
            this.exportHTML();
        });
        ipcRenderer.on('change-case', () => {
            this.changeCase();
        });
        ipcRenderer.on('case-changed', (event: IpcRendererEvent, arg: any) => {
            this.caseChanged(arg);
        });
        ipcRenderer.on('set-errors', (event: IpcRendererEvent, arg: any) => {
            this.setErrors(arg);
        });
        ipcRenderer.on('clear-errors', (event: IpcRendererEvent, arg: any) => {
            this.clearErrors(arg);
        });
        ipcRenderer.on('update-target', (event: IpcRendererEvent, arg: any) => {
            this.updateTarget(arg);
        });
        ipcRenderer.on('toggle-files-panel', () => {
            this.toggleFilesPanel();
        });
        ipcRenderer.on('toggle-right-panels', () => {
            this.toggleRightPanels();
        });
        ipcRenderer.on('notes-requested', () => {
            this.notesRequested();
        });
        ipcRenderer.on('metadata-requested', (event: IpcRendererEvent, metaId: MetaId) => {
            this.metadataRequested(metaId);
        });
        ipcRenderer.on('show-metadata', () => {
            this.showReviewComments();
        });
        ipcRenderer.on('notes-closed', () => {
            this.notesClosed();
        });
        ipcRenderer.on('review-comments-closed', () => {
            this.reviewCommentsClosed();
        });
        ipcRenderer.on('notes-removed', (event: IpcRendererEvent, segmentId: FullId) => {
            this.notesRemoved(segmentId);
        });
        ipcRenderer.on('notes-added', (event: IpcRendererEvent, segmentId: FullId) => {
            this.notesAdded(segmentId);
        });
        ipcRenderer.on('edit-source', () => {
            this.editSource();
        });
        ipcRenderer.on('remember-segment', () => {
            this.rememberSegment();
        });
        ipcRenderer.on('open-ai-prompt', () => {
            this.openAiPrompt();
        });
        ipcRenderer.on('copy-ai-prompt', () => {
            this.copyAiPropmpt();
        });
        ipcRenderer.on('insert-ai-response', (event: IpcRendererEvent, response: string) => {
            this.insertAiReponse(response);
        });
        ipcRenderer.on('tags-deleted', () => {
            if (Main.translationViews.size > 0) {
                ipcRenderer.send('show-message', {
                    type: 'info',
                    message: 'Tag colors will be adjusted on application restart.'
                });
            }
        });
        let config: MutationObserverInit = { attributes: true, childList: false, subtree: false };
        let observer: MutationObserver = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    Main.main.style.height = (Main.mainContainer.clientHeight - Main.tabHolder.getTabsHeight()) + 'px';
                    Main.main.style.width = Main.mainContainer.clientWidth + 'px';
                }
            }
        });
        observer.observe(Main.mainContainer, config);

        document.addEventListener('paste', (event) => {
            let clipboardData: DataTransfer | null = event.clipboardData;
            if (clipboardData) {
                let html: string = clipboardData.getData('text/html');
                if (html.length !== 0) {
                    event.preventDefault();
                    if (this.hasTags(html)) {
                        this.parseClipboardHtml(html);
                    } else {
                        let text: string = clipboardData.getData('text/plain').replace(/\r/g, '');
                        text = text.replace(/\n\n/g, '\n');
                        Main.insertHtmlAtSelection(text);
                    }
                }
            }
        });
    }

    hasTags(html: string): boolean {
        let container: HTMLDivElement = document.createElement('div');
        container.innerHTML = html;
        let images: NodeListOf<HTMLImageElement> = container.querySelectorAll('img');
        if (images.length > 0) {
            for (let tag of images) {
                let src: string | null = tag.getAttribute('src');
                if (tag.getAttribute('data-ref') && src && src.endsWith('.svg')) {
                    return true;
                }
            }
        }
        return false;
    }

    parseClipboardHtml(html: string): void {
        let container: HTMLDivElement = document.createElement('div');
        container.innerHTML = html;
        let text: string = this.recurseNodes(container);
        container.innerHTML = text;
        text = this.trimSpaces(container);
        Main.insertHtmlAtSelection(text);
    }

    static insertHtmlAtSelection(html: string): void {
        const selection: Selection | null = document.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return;
        }
        const range: Range = selection.getRangeAt(0);
        range.deleteContents();
        const fragment: DocumentFragment = range.createContextualFragment(html);
        const lastNode: Node | null = fragment.lastChild;
        range.insertNode(fragment);
        const collapseRange: Range = document.createRange();
        if (lastNode) {
            collapseRange.setStartAfter(lastNode);
        } else {
            collapseRange.setStart(range.endContainer, range.endOffset);
        }
        collapseRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(collapseRange);
    }

    trimSpaces(node: Node): string {
        let result: string = '';
        if (node.nodeType === Node.TEXT_NODE) {
            let content: string | null = node.textContent;
            if (content) {
                result = content.replace(/\s\s+/g, ' ');
            }
        }
        if (node.nodeName === 'IMG' && this.isTag(node)) {
            return (node as HTMLImageElement).outerHTML;
        }
        node.childNodes.forEach((child) => {
            result += this.trimSpaces(child);
        });
        return result;
    }

    recurseNodes(node: Node): string {
        let result: string = '';
        if (node.nodeName === 'IMG' && this.isTag(node)) {
            return (node as HTMLImageElement).outerHTML;
        }
        if (node.nodeType === Node.COMMENT_NODE || node.nodeName === 'META' || node.nodeName === 'STYLE'
            || node.nodeName === 'SCRIPT' || node.nodeName === 'LINK') {
            return '';
        }
        if (node.nodeType === Node.TEXT_NODE) {
            let content: string | null = node.textContent;
            if (content) {
                return content.replace(/\n/g, '');
            }
        }
        node.childNodes.forEach((child) => {
            result += this.recurseNodes(child);
        });
        if (node.nodeName === 'DIV') {
            return result.trim();
        }
        return result;
    }

    isTag(node: Node): boolean {
        let img: HTMLImageElement = node as HTMLImageElement;
        let src: string | null = img.getAttribute('src');
        if (img.getAttribute('data-ref') && src && src.endsWith('.svg')) {
            return true;
        }
        return false;
    }

    setStatus(arg: any): void {
        let status: HTMLDivElement = document.getElementById('status') as HTMLDivElement;
        status.innerText = arg;
        if (arg.length > 0) {
            status.style.display = 'block';
        } else {
            status.style.display = 'none';
        }
    }

    addTab(project: Project): void {
        if (Main.tabHolder.has(project.id)) {
            Main.tabHolder.selectTab(project.id);
            return;
        }
        let tab: Tab = new Tab(project.id, project.description, true, Main.tabHolder);
        let view: TranslationView = new TranslationView(tab, project.id, project.sourceLang, project.targetLang, Main.rowsPage);
        Main.tabHolder.addTab(tab);
        Main.tabHolder.selectTab(project.id);
        tab.getLabelDiv().addEventListener('click', () => {
            view.setSize();
            view.setSpellChecker();
        });
        Main.translationViews.set(project.id, view);
    }

    closeTab(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.tabHolder.canClose(selected)) {
            Main.tabHolder.closeTab(selected);
        }
    }

    static resizePanels(): void {
        Main.mainContainer.style.width = document.body.clientWidth + 'px';
        Main.mainContainer.style.height = document.body.clientHeight + 'px';
    }

    static checkTabs(): void {
        for (let key of Main.translationViews.keys()) {
            if (!Main.tabHolder.has(key)) {
                let view: TranslationView = Main.translationViews.get(key) as TranslationView;
                view.close();
                Main.translationViews.delete(key);
                ipcRenderer.send('close-project', { project: key });
                break;
            }
        }
    }

    editSource(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).editSource();
        }
    }

    rememberSegment(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).rememberSegment();
        }
    }

    openAiPrompt(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).openAiPrompt();
        }
    }

    copyAiPropmpt(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).generatePrompt();
        }
    }

    insertAiReponse(response: string): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).insertAiResponse(response);
        }
    }

    drawFiles(files: any[]): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).setFiles(files);
        }
    }

    cancelEdit(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).cancelEdit();
        }
    }

    saveEdit(arg: any): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).saveEdit(arg);
        }
    }

    nextUntranslated(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).nextUntranslated();
        }
    }

    nextUnconfirmed(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).nextUnconfirmed();
        }
    }

    insertTag(arg: any): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).insertTag(arg);
        }
    }

    insertTerm(arg: any): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).insertTerm(arg);
        }
    }

    insertNextTag(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).insertNextTag();
        }
    }

    insertRemainingTags(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).insertRemainingTags();
        }
    }

    fixTags(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).fixTags();
        }
    }

    removeTags(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).removeTags();
        }
    }

    confirmAllTranslations(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).confirmAllTranslations();
        }
    }

    unconfirmAllTranslations(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).unconfirmAllTranslations();
        }
    }

    removeAllTranslations(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).removeAllTranslations();
        }
    }

    removeAllMatches(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).removeAllMatches();
        }
    }

    copySource(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).copySource();
        }
    }

    copyAllSources(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).copyAllSources();
        }
    }

    pseudoTranslate(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).pseudoTranslate();
        }
    }

    autoPropagate(arg: any): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).autoPropagate(arg.rows);
        }
    }

    setMatches(arg: any): void {
        if (Main.translationViews.has(arg.project)) {
            (Main.translationViews.get(arg.project) as TranslationView).setMatches(arg.matches);
        }
    }

    setTerms(arg: any): void {
        if (Main.translationViews.has(arg.project)) {
            (Main.translationViews.get(arg.project) as TranslationView).setTerms(arg.terms);
        }
    }

    setTarget(arg: any): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).setTarget(arg);
        }
    }

    firstPage(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).firstPage();
        }
    }

    previousPage(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).previousPage();
        }
    }

    nextPage(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).nextPage();
        }
    }

    lastPage(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).lastPage();
        }
    }

    getMachineTranslations(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).getMachineTranslations();
        }
    }

    getAssembledMatches(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).getAssembledMatches();
        }
    }

    assembleMatchesAll(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).assembleMatchesAll();
        }
    }

    removeAssembleMatches(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).removeAssembleMatches();
        }
    }

    getTmMatches(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).getTmMatches();
        }
    }

    applyTranslationMemoryAll(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (selected === 'projects') {
            this.projectsView.applyTranslationMemoryAll();
            return;
        }
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).applyTranslationMemoryAll();
        }
    }

    acceptAll100Matches(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).acceptAll100Matches();
        }
    }

    applyMachineTranslationsAll(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).applyMachineTranslationsAll();
        }
    }

    acceptAllMachineTranslations(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).acceptAllMachineTranslations();
        }
    }

    removeAllMachineTranslations(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).removeAllMachineTranslations();
        }
    }

    splitSegment(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).splitSegment();
        }
    }

    mergeNext(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).mergeNext();
        }
    }

    setProjectMemories(arg: any): void {
        let project: string = arg.project;
        if (Main.translationViews.has(project)) {
            (Main.translationViews.get(project) as TranslationView).setProjectMemories(arg);
        }
    }

    setProjectGlossaries(arg: any): void {
        let project: string = arg.project;
        if (Main.translationViews.has(project)) {
            (Main.translationViews.get(project) as TranslationView).setProjectGlossaries(arg);
        }
    }

    reloadPage(projectId: string): void {
        if (Main.translationViews.has(projectId)) {
            (Main.translationViews.get(projectId) as TranslationView).getSegments();
        }
    }

    setStatistics(arg: any): void {
        let project: string = arg.project;
        if (Main.translationViews.has(project)) {
            (Main.translationViews.get(project) as TranslationView).setStatistics(arg.statistics);
        }
        this.projectsView.updateStatus(arg);
    }

    sortSegments(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).sortSegments();
        }
    }

    filterSegments(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).filterSegments();
        }
    }

    setSorting(args: any): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).setSorting(args);
        }
    }

    setFilters(args: any): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).setFilters(args);
        }
    }

    exportTranslations(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            ipcRenderer.send('export-open-project', { project: selected });
            return;
        }
        this.projectsView.exportTranslations();
    }

    replaceText(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).replaceText();
        }
    }

    concordanceSearch(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).concordanceSearch();
        } else {
            this.memoriesView.concordanceSearch();
        }
    }

    searchTerm(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).searchTerm();
        } else {
            this.glossariesView.searchTerm();
        }
    }

    addTerm(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).addTerm();
        } else {
            this.glossariesView.addTerm();
        }
    }

    requestStatistics(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).generateStatistics();
        } else {
            this.projectsView.generateStatistics();
        }
    }

    applyTerminology(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).applyTerminology();
        }
    }

    applyTerminologyAll(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).applyTerminologyAll();
        }
    }

    toggleLock(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).toggleLock();
        }
    }

    lockRepeated(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            ipcRenderer.send('lock-duplicates', { project: selected });
        }
    }

    unlockSegments(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            ipcRenderer.send('unlock-all', selected);
        }
    }

    tagsAnalysis(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            ipcRenderer.send('analyze-tags', selected);
        }
    }

    spacesAnalysis(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            ipcRenderer.send('analyze-spaces', selected);
        }
    }

    nextMatch(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).nextMatch();
        }
    }

    previousMatch(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).previousMatch();
        }
    }

    nextMT(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).nextMT();
        }
    }

    previousMT(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).previousMT();
        }
    }

    previousSegment(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).gotoPrevious();
        }
    }

    nextSegment(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).gotoNext();
        }
    }

    goToSameSource(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).goToSameSource();
        }
    }

    goToSegment(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            ipcRenderer.send('show-go-to-window');
        }
    }

    openSegment(seg: number): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).openSegment(seg);
        }
    }

    getSelectedText(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            let selection: Selection | null = document.getSelection();
            if (selection) {
                let selectedText: string = selection.toString();
                if (selectedText.length > 0) {
                    let anchorNode: Node | null = selection.anchorNode;
                    if (anchorNode) {
                        let element: Element | null = anchorNode.parentElement;
                        if (element) {
                            let lang: string = '';
                            if (element.classList.contains('source')) {
                                lang = (Main.translationViews.get(selected) as TranslationView).getSrcLang();
                            }
                            if (element.classList.contains('target')) {
                                lang = (Main.translationViews.get(selected) as TranslationView).getTgtLang();
                            }
                            ipcRenderer.send('selected-text', {
                                selected: selectedText,
                                lang: lang,
                                srcLang: (Main.translationViews.get(selected) as TranslationView).getSrcLang(),
                                tgtLang: (Main.translationViews.get(selected) as TranslationView).getTgtLang()
                            });
                        }
                    }
                } else {
                    ipcRenderer.send('selected-text', {
                        selected: "",
                        srcLang: (Main.translationViews.get(selected) as TranslationView).getSrcLang(),
                        tgtLang: (Main.translationViews.get(selected) as TranslationView).getTgtLang()
                    });
                }
            }
        }
    }

    selectNextTerm(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).selectNextTerm();
        }
    }

    selectPreviousTerm(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).selectPreviousTerm();
        }
    }

    exportHTML(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            ipcRenderer.send('export-project-html', selected);
            return;
        }
        this.projectsView.exportHTML();
    }

    changeCase(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).changeCase();
        }
    }

    caseChanged(arg: any): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).caseChanged(arg);
        }
    }

    setErrors(arg: any): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).setErrors(arg);
        }
    }

    clearErrors(arg: any): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).clearErrors(arg);
        }
    }

    updateTarget(arg: any): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).updateTarget(arg);
        }
    }

    updateTargetCell(arg: any): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).updateTargetCell(arg);
        }
    }

    notesRequested(): void {
        let selected: string = Main.tabHolder.getSelected();
        for (let key of Main.translationViews.keys()) {
            (Main.translationViews.get(key) as TranslationView).showingNotes(true);
        }
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).showNotes();
        }
    }

    metadataRequested(metaId: MetaId): void {
        let selected: string = Main.tabHolder.getSelected();
        for (let key of Main.translationViews.keys()) {
            (Main.translationViews.get(key) as TranslationView).showingReviewComments(true);
        }
        if (metaId.unit && Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).showReviewComments();
        }
    }

    showReviewComments(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            (Main.translationViews.get(selected) as TranslationView).showReviewComments();
        }
    }

    toggleFilesPanel(): void {
        for (let key of Main.translationViews.keys()) {
            (Main.translationViews.get(key) as TranslationView).toggleFilesPanel();
        }
    }

    toggleRightPanels(): void {
        for (let key of Main.translationViews.keys()) {
            (Main.translationViews.get(key) as TranslationView).toggleRightPanels();
        }
    }

    notesClosed(): void {
        for (let key of Main.translationViews.keys()) {
            (Main.translationViews.get(key) as TranslationView).showingNotes(false);
        }
    }

    reviewCommentsClosed(): void {
        for (let key of Main.translationViews.keys()) {
            (Main.translationViews.get(key) as TranslationView).showingReviewComments(false);
        }
    }

    notesRemoved(segmentId: FullId): void {
        if (Main.translationViews.has(segmentId.project)) {
            (Main.translationViews.get(segmentId.project) as TranslationView).notesRemoved();
        }
    }

    notesAdded(segmentId: FullId): void {
        if (Main.translationViews.has(segmentId.project)) {
            (Main.translationViews.get(segmentId.project) as TranslationView).notesAdded();
        }
    }
}