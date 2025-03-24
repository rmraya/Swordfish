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

class Main {

    static electron = require('electron');

    static tabHolder: TabHolder;
    static translationViews: Map<string, TranslationView>;

    mainContainer: HTMLDivElement;
    static main: HTMLDivElement;

    projectsView: ProjectsView;
    memoriesView: MemoriesView;
    glossariesView: GlossariesView;

    static rowsPage: number;

    constructor() {
        Main.translationViews = new Map<string, TranslationView>();
        this.mainContainer = document.getElementById('mainContainer') as HTMLDivElement;
        Main.tabHolder = new TabHolder(this.mainContainer, 'main');

        Main.main = document.getElementById('main') as HTMLDivElement;

        let projectsTab = new Tab('projects', 'Projects', false);
        this.projectsView = new ProjectsView(projectsTab.getContainer());
        projectsTab.getLabelDiv().addEventListener('click', () => {
            this.projectsView.setSizes();
        });
        Main.tabHolder.addTab(projectsTab);

        let memoriesTab = new Tab('memories', 'Memories', false);
        this.memoriesView = new MemoriesView(memoriesTab.getContainer());
        memoriesTab.getLabelDiv().addEventListener('click', () => {
            this.memoriesView.setSizes();
        });
        Main.tabHolder.addTab(memoriesTab);

        let glossariesTab = new Tab('glossaries', 'Glossaries', false);
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
        let tabsObserver = new MutationObserver((mutationList) => {
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

        Main.electron.ipcRenderer.send('get-theme');
        Main.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
        });
        Main.electron.ipcRenderer.send('get-rows-page');
        Main.electron.ipcRenderer.on('set-rows-page', (event: Electron.IpcRendererEvent, rows:number) => {
            Main.rowsPage = rows;
        });
        Main.electron.ipcRenderer.on('request-theme', () => {
            Main.electron.ipcRenderer.send('get-theme');
        });
        window.addEventListener('resize', () => {
            this.resizePanels();
        });
        Main.electron.ipcRenderer.on('view-projects', () => {
            Main.tabHolder.selectTab('projects');
        });
        Main.electron.ipcRenderer.on('request-projects', (event: Electron.IpcRendererEvent, arg: any) => {
            this.projectsView.loadProjects(arg);
        });
        Main.electron.ipcRenderer.on('export-xliff-review', () => {
            this.projectsView.exportXLIFF();
        });
        Main.electron.ipcRenderer.on('edit-project', () => {
            this.projectsView.editProject();
        });
        Main.electron.ipcRenderer.on('remove-projects', () => {
            this.projectsView.removeProjects();
        });
        Main.electron.ipcRenderer.on('export-translations', () => {
            this.exportTranslations();
        });
        Main.electron.ipcRenderer.on('export-project', () => {
            this.projectsView.exportProject();
        });
        Main.electron.ipcRenderer.on('export-translations-tmx', () => {
            this.projectsView.exportTMX();
        });
        Main.electron.ipcRenderer.on('export-matches', () => {
            this.projectsView.exportMatches();
        });
        Main.electron.ipcRenderer.on('export-terminology-all', () => {
            this.projectsView.exportTerms();
        });
        Main.electron.ipcRenderer.on('split-segment', () => {
            this.splitSegment();
        });
        Main.electron.ipcRenderer.on('merge-next', () => {
            this.mergeNext();
        });
        Main.electron.ipcRenderer.on('view-memories', () => {
            Main.tabHolder.selectTab('memories');
        });
        Main.electron.ipcRenderer.on('request-memories', () => {
            this.memoriesView.loadMemories();
        });
        Main.electron.ipcRenderer.on('view-glossaries', () => {
            Main.tabHolder.selectTab('glossaries');
        });
        Main.electron.ipcRenderer.on('request-glossaries', () => {
            this.glossariesView.loadGlossaries();
        });
        Main.electron.ipcRenderer.on('close-tab', () => {
            this.closeTab();
        });
        Main.electron.ipcRenderer.on('start-waiting', () => {
            document.body.classList.add("wait");
        });
        Main.electron.ipcRenderer.on('end-waiting', () => {
            document.body.classList.remove("wait");
        });
        Main.electron.ipcRenderer.on('set-status', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setStatus(arg);
        });
        Main.electron.ipcRenderer.on('add-tab', (event: Electron.IpcRendererEvent, arg: Project) => {
            this.addTab(arg);
        });
        Main.electron.ipcRenderer.on('translate-projects', () => {
            this.projectsView.openProjects();
        });
        Main.electron.ipcRenderer.on('remove-memory', () => {
            this.memoriesView.removeMemory();
        });
        Main.electron.ipcRenderer.on('import-tmx', () => {
            this.memoriesView.importTMX();
        });
        Main.electron.ipcRenderer.on('export-tmx', () => {
            this.memoriesView.exportTMX();
        });
        Main.electron.ipcRenderer.on('import-glossary', () => {
            this.glossariesView.importGlossary();
        });
        Main.electron.ipcRenderer.on('remove-glossary', () => {
            this.glossariesView.removeGlossary();
        });
        Main.electron.ipcRenderer.on('concordance-requested', () => {
            this.concordanceSearch();
        });
        Main.electron.ipcRenderer.on('get-selected-text', () => {
            this.getSelectedText();
        });
        Main.electron.ipcRenderer.on('term-search-requested', () => {
            this.searchTerm();
        });
        Main.electron.ipcRenderer.on('apply-terminology', () => {
            this.applyTerminology();
        });
        Main.electron.ipcRenderer.on('apply-terminology-all', () => {
            this.applyTerminologyAll();
        });
        Main.electron.ipcRenderer.on('add-term-requested', () => {
            this.addTerm();
        });
        Main.electron.ipcRenderer.on('export-glossary', () => {
            this.glossariesView.exportGlossary();
        });
        Main.electron.ipcRenderer.on('first-page', () => {
            this.firstPage();
        });
        Main.electron.ipcRenderer.on('previous-segment', () => {
            this.previousSegment();
        });
        Main.electron.ipcRenderer.on('next-segment', () => {
            this.nextSegment();
        });
        Main.electron.ipcRenderer.on('go-to', () => {
            this.goToSegment();
        });
        Main.electron.ipcRenderer.on('open-segment', (event: Electron.IpcRendererEvent, arg: any) => {
            this.openSegment(arg);
        });
        Main.electron.ipcRenderer.on('previous-page', () => {
            this.previousPage();
        });
        Main.electron.ipcRenderer.on('next-page', () => {
            this.nextPage();
        });
        Main.electron.ipcRenderer.on('last-page', () => {
            this.lastPage();
        });
        Main.electron.ipcRenderer.on('next-untranslated', () => {
            this.nextUntranslated();
        });
        Main.electron.ipcRenderer.on('next-unconfirmed', () => {
            this.nextUnconfirmed();
        });
        Main.electron.ipcRenderer.on('cancel-edit', () => {
            this.cancelEdit();
        });
        Main.electron.ipcRenderer.on('save-edit', (event: Electron.IpcRendererEvent, arg: any) => {
            this.saveEdit(arg);
        });
        Main.electron.ipcRenderer.on('insert-next-tag', () => {
            this.insertNextTag();
        });
        Main.electron.ipcRenderer.on('insert-remaining-tags', () => {
            this.insertRemainingTags();
        });
        Main.electron.ipcRenderer.on('remove-tags', () => {
            this.removeTags();
        });
        Main.electron.ipcRenderer.on('confirm-all', () => {
            this.confirmAllTranslations();
        });
        Main.electron.ipcRenderer.on('unconfirm-all', () => {
            this.unconfirmAllTranslations();
        });
        Main.electron.ipcRenderer.on('remove-all', () => {
            this.removeAllTranslations();
        });
        Main.electron.ipcRenderer.on('remove-matches', () => {
            this.removeAllMatches();
        });
        Main.electron.ipcRenderer.on('copy-source', () => {
            this.copySource();
        });
        Main.electron.ipcRenderer.on('copy-all-sources', () => {
            this.copyAllSources();
        });
        Main.electron.ipcRenderer.on('pseudo-translate', () => {
            this.pseudoTranslate();
        });
        Main.electron.ipcRenderer.on('insert-tag', (event: Electron.IpcRendererEvent, arg: any) => {
            this.insertTag(arg);
        });
        Main.electron.ipcRenderer.on('insert-tem', (event: Electron.IpcRendererEvent, arg: any) => {
            this.insertTerm(arg);
        });
        Main.electron.ipcRenderer.on('select-previous-term', () => {
            this.selectPreviousTerm();
        });
        Main.electron.ipcRenderer.on('select-next-term', () => {
            this.selectNextTerm();
        });
        Main.electron.ipcRenderer.on('auto-propagate', (event: Electron.IpcRendererEvent, arg: any) => {
            this.autoPropagate(arg);
        });
        Main.electron.ipcRenderer.on('set-matches', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setMatches(arg);
        });
        Main.electron.ipcRenderer.on('set-terms', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setTerms(arg);
        });
        Main.electron.ipcRenderer.on('set-target', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setTarget(arg);
        });
        Main.electron.ipcRenderer.on('get-mt-matches', () => {
            this.getMachineTranslations();
        });
        Main.electron.ipcRenderer.on('get-am-matches', () => {
            this.getAssembledMatches();
        });
        Main.electron.ipcRenderer.on('apply-am-all', () => {
            this.assembleMatchesAll();
        });
        Main.electron.ipcRenderer.on('remove-am-all', () => {
            this.removeAssembleMatches();
        });
        Main.electron.ipcRenderer.on('get-tm-matches', () => {
            this.getTmMatches();
        });
        Main.electron.ipcRenderer.on('apply-mt-all', () => {
            this.applyMachineTranslationsAll();
        });
        Main.electron.ipcRenderer.on('accept-all-mt', () => {
            this.acceptAllMachineTranslations();
        });
        Main.electron.ipcRenderer.on('remove-mt-all', () => {
            this.removeAllMachineTranslations();
        });
        Main.electron.ipcRenderer.on('apply-tm-all', () => {
            this.applyTranslationMemoryAll();
        });
        Main.electron.ipcRenderer.on('accept-all-matches', () => {
            this.acceptAll100Matches();
        });
        Main.electron.ipcRenderer.on('toggle-lock', () => {
            this.toggleLock();
        });
        Main.electron.ipcRenderer.on('lock-repeated', () => {
            this.lockRepeated();
        });
        Main.electron.ipcRenderer.on('unlock-segments', () => {
            this.unlockSegments();
        });
        Main.electron.ipcRenderer.on('set-project-memories', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setProjectMemories(arg);
        });
        Main.electron.ipcRenderer.on('set-project-glossaries', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setProjectGlossaries(arg);
        });
        Main.electron.ipcRenderer.on('reload-page', (event: Electron.IpcRendererEvent, projectId: string) => {
            this.reloadPage(projectId);
        });
        Main.electron.ipcRenderer.on('request-statistics', () => {
            this.requestStatistics();
        });
        Main.electron.ipcRenderer.on('set-statistics', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setStatistics(arg);
        });
        Main.electron.ipcRenderer.on('sort-segments', () => {
            this.sortSegments();
        });
        Main.electron.ipcRenderer.on('set-sorting', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setSorting(arg);
        });
        Main.electron.ipcRenderer.on('filter-segments', () => {
            this.filterSegments();
        });
        Main.electron.ipcRenderer.on('set-filters', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setFilters(arg);
        });
        Main.electron.ipcRenderer.on('replace-text', () => {
            this.replaceText();
        });
        Main.electron.ipcRenderer.on('tags-analysis', () => {
            this.tagsAnalysis();
        });
        Main.electron.ipcRenderer.on('spaces-analysis', () => {
            this.spacesAnalysis();
        });
        Main.electron.ipcRenderer.on('next-match', () => {
            this.nextMatch();
        });
        Main.electron.ipcRenderer.on('previous-match', () => {
            this.previousMatch();
        });
        Main.electron.ipcRenderer.on('next-mt', () => {
            this.nextMT();
        });
        Main.electron.ipcRenderer.on('previous-mt', () => {
            this.previousMT();
        });
        Main.electron.ipcRenderer.on('export-html', () => {
            this.exportHTML();
        });
        Main.electron.ipcRenderer.on('change-case', () => {
            this.changeCase();
        });
        Main.electron.ipcRenderer.on('case-changed', (event: Electron.IpcRendererEvent, arg: any) => {
            this.caseChanged(arg);
        });
        Main.electron.ipcRenderer.on('set-errors', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setErrors(arg);
        });
        Main.electron.ipcRenderer.on('clear-errors', (event: Electron.IpcRendererEvent, arg: any) => {
            this.clearErrors(arg);
        });
        Main.electron.ipcRenderer.on('update-target', (event: Electron.IpcRendererEvent, arg: any) => {
            this.updateTarget(arg);
        });
        Main.electron.ipcRenderer.on('notes-requested', () => {
            this.notesRequested();
        });
        Main.electron.ipcRenderer.on('notes-closed', () => {
            this.notesClosed();
        });
        Main.electron.ipcRenderer.on('notes-removed', (event: Electron.IpcRendererEvent, arg: any) => {
            this.notesRemoved(arg);
        });
        Main.electron.ipcRenderer.on('notes-added', (event: Electron.IpcRendererEvent, arg: any) => {
            this.notesAdded(arg);
        });
        Main.electron.ipcRenderer.on('edit-source', () => {
            this.editSource();
        });
        Main.electron.ipcRenderer.on('remember-segment', () => {
            this.rememberSegment();
        })
        Main.electron.ipcRenderer.on('tags-deleted', () => {
            if (Main.translationViews.size > 0) {
                Main.electron.ipcRenderer.send('show-message', {
                    type: 'info',
                    message: 'Tag colors will be adjusted on application restart.'
                });
            }
        });
        let config: MutationObserverInit = { attributes: true, childList: false, subtree: false };
        let observer = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    Main.main.style.height = (this.mainContainer.clientHeight - Main.tabHolder.getTabsHeight()) + 'px';
                    Main.main.style.width = this.mainContainer.clientWidth + 'px';
                }
            }
        });
        observer.observe(this.mainContainer, config);

        document.addEventListener('paste', (event) => {
            let clipboardData = event.clipboardData;
            let html: string = clipboardData.getData('text/html');
            if (html.length !== 0) {
                event.preventDefault();
                if (this.hasTags(html)) {
                    this.parseClipboardHtml(html);
                } else {
                    let text = clipboardData.getData('text/plain').replace(/\r/g, '');
                    text = text.replace(/\n\n/g, '\n');
                    document.execCommand('insertHTML', false, text);
                }
            }
        });

        setTimeout(() => {
            this.resizePanels();
        }, 200);
    }

    hasTags(html: string): boolean {
        let container: HTMLDivElement = document.createElement('div');
        container.innerHTML = html;
        let images: NodeListOf<HTMLImageElement> = container.querySelectorAll('img');
        if (images.length > 0) {
            for (let tag of images) {
                if (tag.getAttribute('data-ref') && tag.getAttribute('src').endsWith('.svg')) {
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
        document.execCommand('insertHTML', false, text);
    }

    trimSpaces(node: Node): string {
        let result: string = '';
        if (node.nodeType === Node.TEXT_NODE) {
            result = node.textContent.replace(/\s\s+/g, ' ');
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
            let content = node.textContent.replace(/\n/g, '');
            return content;
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
        if (img.getAttribute('data-ref') && img.getAttribute('src').endsWith('.svg')) {
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
        let tab = new Tab(project.id, project.description, true);
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

    resizePanels(): void {
        this.mainContainer.style.width = document.body.clientWidth + 'px';
        this.mainContainer.style.height = document.body.clientHeight + 'px';
    }

    static checkTabs(): void {
        for (let key of Main.translationViews.keys()) {
            if (!Main.tabHolder.has(key)) {
                let view: TranslationView = Main.translationViews.get(key);
                view.close();
                Main.translationViews.delete(key);
                Main.electron.ipcRenderer.send('close-project', { project: key });
                break;
            }
        }
    }

    editSource(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).editSource();
        }
    }

    rememberSegment(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).rememberSegment();
        }
    }
    
    cancelEdit(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).cancelEdit();
        }
    }

    saveEdit(arg: any): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).saveEdit(arg);
        }
    }

    nextUntranslated(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).nextUntranslated();
        }
    }

    nextUnconfirmed(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).nextUnconfirmed();
        }
    }

    insertTag(arg: any): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).insertTag(arg);
        }
    }

    insertTerm(arg: any): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).insertTerm(arg);
        }
    }

    insertNextTag(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).insertNextTag();
        }
    }

    insertRemainingTags(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).insertRemainingTags();
        }
    }

    removeTags(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).removeTags();
        }
    }

    confirmAllTranslations(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).confirmAllTranslations();
        }
    }

    unconfirmAllTranslations(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).unconfirmAllTranslations();
        }
    }

    removeAllTranslations(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).removeAllTranslations();
        }
    }

    removeAllMatches(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).removeAllMatches();
        }
    }

    copySource(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).copySource();
        }
    }

    copyAllSources(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).copyAllSources();
        }
    }

    pseudoTranslate(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).pseudoTranslate();
        }
    }

    autoPropagate(arg: any): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).autoPropagate(arg.rows);
        }
    }

    setMatches(arg: any): void {
        if (Main.translationViews.has(arg.project)) {
            Main.translationViews.get(arg.project).setMatches(arg.matches);
        }
    }

    setTerms(arg: any): void {
        if (Main.translationViews.has(arg.project)) {
            Main.translationViews.get(arg.project).setTerms(arg.terms);
        }
    }

    setTarget(arg: any): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).setTarget(arg);
        }
    }

    firstPage(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).firstPage();
        }
    }

    previousPage(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).previousPage();
        }
    }

    nextPage(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).nextPage();
        }
    }

    lastPage(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).lastPage();
        }
    }

    getMachineTranslations(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).getMachineTranslations();
        }
    }

    getAssembledMatches(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).getAssembledMatches();
        }
    }

    assembleMatchesAll(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).assembleMatchesAll();
        }
    }

    removeAssembleMatches(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).removeAssembleMatches();
        }
    }

    getTmMatches(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).getTmMatches();
        }
    }

    applyTranslationMemoryAll(): void {
        let selected = Main.tabHolder.getSelected();
        if (selected === 'projects') {
            this.projectsView.applyTranslationMemoryAll();
            return;
        }
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).applyTranslationMemoryAll();
        }
    }

    acceptAll100Matches(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).acceptAll100Matches();
        }
    }

    applyMachineTranslationsAll(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).applyMachineTranslationsAll();
        }
    }

    acceptAllMachineTranslations(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).acceptAllMachineTranslations();
        }
    }

    removeAllMachineTranslations(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).removeAllMachineTranslations();
        }
    }

    splitSegment(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).splitSegment();
        }
    }

    mergeNext(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).mergeNext();
        }
    }

    setProjectMemories(arg: any): void {
        let project: string = arg.project;
        if (Main.translationViews.has(project)) {
            Main.translationViews.get(project).setProjectMemories(arg);
        }
    }

    setProjectGlossaries(arg: any): void {
        let project: string = arg.project;
        if (Main.translationViews.has(project)) {
            Main.translationViews.get(project).setProjectGlossaries(arg);
        }
    }

    reloadPage(projectId: string): void {
        if (Main.translationViews.has(projectId)) {
            Main.translationViews.get(projectId).getSegments();
        }
    }

    setStatistics(arg: any): void {
        let project: string = arg.project;
        if (Main.translationViews.has(project)) {
            Main.translationViews.get(project).setStatistics(arg.statistics);
        }
        this.projectsView.updateStatus(arg);
    }

    sortSegments(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).sortSegments();
        }
    }

    filterSegments(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).filterSegments();
        }
    }

    setSorting(args: any) {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).setSorting(args);
        }
    }

    setFilters(args: any) {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).setFilters(args);
        }
    }

    exportTranslations(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.electron.ipcRenderer.send('export-open-project', { project: selected });
            return;
        }
        this.projectsView.exportTranslations();
    }

    replaceText(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).replaceText();
        }
    }

    concordanceSearch(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).concordanceSearch();
        } else {
            this.memoriesView.concordanceSearch();
        }
    }

    searchTerm(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).searchTerm();
        } else {
            this.glossariesView.searchTerm();
        }
    }

    addTerm(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).addTerm();
        } else {
            this.glossariesView.addTerm();
        }
    }

    requestStatistics(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).generateStatistics();
        } else {
            this.projectsView.generateStatistics();
        }
    }

    applyTerminology(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).applyTerminology();
        }
    }

    applyTerminologyAll(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).applyTerminologyAll();
        }
    }

    toggleLock(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).toggleLock();
        }
    }

    lockRepeated(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.electron.ipcRenderer.send('lock-duplicates', { project: selected });
        }
    }

    unlockSegments(): void {
        let projectId: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(projectId)) {
            Main.electron.ipcRenderer.send('unlock-all', projectId);
        }
    }

    tagsAnalysis(): void {
        let projectId: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(projectId)) {
            Main.electron.ipcRenderer.send('analyze-tags', projectId);
        }
    }

    spacesAnalysis(): void {
        let projectId: string = Main.tabHolder.getSelected();
        if (Main.translationViews.has(projectId)) {
            Main.electron.ipcRenderer.send('analyze-spaces', projectId);
        }
    }

    nextMatch(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).nextMatch();
        }
    }

    previousMatch(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).previousMatch();
        }
    }

    nextMT(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).nextMT();
        }
    }

    previousMT(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).previousMT();
        }
    }

    previousSegment(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).gotoPrevious();
        }
    }

    nextSegment(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).gotoNext();
        }
    }

    goToSegment(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.electron.ipcRenderer.send('show-go-to-window');
        }
    }

    openSegment(arg: any): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).openSegment(arg);
        }
    }

    getSelectedText(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            let selection: Selection = document.getSelection();
            let selectedText = selection.toString();
            if (selectedText.length > 0) {
                let element: Element = selection.anchorNode.parentElement;
                let lang: string = '';
                if (element.classList.contains('source')) {
                    lang = Main.translationViews.get(selected).getSrcLang();
                }
                if (element.classList.contains('target')) {
                    lang = Main.translationViews.get(selected).getTgtLang();
                }
                Main.electron.ipcRenderer.send('selected-text', {
                    selected: selectedText,
                    lang: lang,
                    srcLang: Main.translationViews.get(selected).getSrcLang(),
                    tgtLang: Main.translationViews.get(selected).getTgtLang()
                });
            } else {
                Main.electron.ipcRenderer.send('selected-text', {
                    selected: "",
                    srcLang: Main.translationViews.get(selected).getSrcLang(),
                    tgtLang: Main.translationViews.get(selected).getTgtLang()
                });
            }
        }
    }

    selectNextTerm(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).selectNextTerm();
        }
    }

    selectPreviousTerm(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).selectPreviousTerm();
        }
    }

    exportHTML(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.electron.ipcRenderer.send('export-project-html', { project: selected });
            return;
        }
        this.projectsView.exportHTML();
    }

    changeCase(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).changeCase();
        }
    }

    caseChanged(arg: any): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).caseChanged(arg);
        }
    }

    setErrors(arg: any): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).setErrors(arg);
        }
    }

    clearErrors(arg: any): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).clearErrors(arg);
        }
    }

    updateTarget(arg: any): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).updateTarget(arg);
        }
    }

    notesRequested(): void {
        let selected = Main.tabHolder.getSelected();
        for (let key of Main.translationViews.keys()) {
            Main.translationViews.get(key).showingNotes(true);
        }
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).showNotes();
        }
    }

    notesClosed(): void {
        for (let key of Main.translationViews.keys()) {
            Main.translationViews.get(key).showingNotes(false);
        }
    }

    notesRemoved(arg: any): void {
        if (Main.translationViews.has(arg.project)) {
            Main.translationViews.get(arg.project).notesRemoved(arg);
        }
    }

    notesAdded(arg: any): void {
        if (Main.translationViews.has(arg.project)) {
            Main.translationViews.get(arg.project).notesAdded(arg);
        }
    }
}