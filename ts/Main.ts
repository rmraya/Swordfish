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

class Main {

    static electron = require('electron');

    static tabHolder: TabHolder;
    static translationViews: Map<string, TranslationView>;

    mainContainer: HTMLDivElement;
    static main: HTMLDivElement;

    projectsView: ProjectsView;
    memoriesView: MemoriesView;
    glossariesView: GlossariesView;

    constructor() {
        Main.translationViews = new Map<string, TranslationView>();
        this.mainContainer = document.getElementById('mainContainer') as HTMLDivElement;
        Main.tabHolder = new TabHolder(this.mainContainer, 'main');

        Main.main = document.getElementById('main') as HTMLDivElement;

        let projectsTab = new Tab('projects', 'Projects', false);
        this.projectsView = new ProjectsView(projectsTab.getContainer());
        projectsTab.getLabel().addEventListener('click', () => {
            this.projectsView.setSizes();
        });
        Main.tabHolder.addTab(projectsTab);

        let memoriesTab = new Tab('memories', 'Memories', false);
        this.memoriesView = new MemoriesView(memoriesTab.getContainer());
        memoriesTab.getLabel().addEventListener('click', () => {
            this.memoriesView.setSizes();
        });
        Main.tabHolder.addTab(memoriesTab);

        let glossariesTab = new Tab('glossaries', 'Glossaries', false);
        this.glossariesView = new GlossariesView(glossariesTab.getContainer());
        glossariesTab.getLabel().addEventListener('click', () => {
            this.glossariesView.setSizes();
        });
        Main.tabHolder.addTab(glossariesTab);

        Main.tabHolder.selectTab('projects');

        let observerOptions = {
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
        Main.electron.ipcRenderer.on('remove-projects', () => {
            this.projectsView.removeProjects();
        });
        Main.electron.ipcRenderer.on('export-translations', (event: Electron.IpcRendererEvent, arg: any) => {
            this.exportTranslations();
        });
        Main.electron.ipcRenderer.on('export-project', (event: Electron.IpcRendererEvent, arg: any) => {
            this.projectsView.exportProject();
        });
        Main.electron.ipcRenderer.on('export-translations-tmx', () => {
            this.projectsView.exportTMX();
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
            document.getElementById('body').classList.add("wait");
        });
        Main.electron.ipcRenderer.on('end-waiting', () => {
            document.getElementById('body').classList.remove("wait");
        });
        Main.electron.ipcRenderer.on('set-status', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setStatus(arg);
        });
        Main.electron.ipcRenderer.on('add-tab', (event: Electron.IpcRendererEvent, arg: any) => {
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
        Main.electron.ipcRenderer.on('term-search-requested', () => {
            this.searchTerm();
        });
        Main.electron.ipcRenderer.on('apply-terminology', (event: Electron.IpcRendererEvent, arg: any) => {
            this.applyTerminology();
        });
        Main.electron.ipcRenderer.on('apply-terminology-all', (event: Electron.IpcRendererEvent, arg: any) => {
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
        Main.electron.ipcRenderer.on('reload-page', (event: Electron.IpcRendererEvent, arg: any) => {
            this.reloadPage(arg);
        });
        Main.electron.ipcRenderer.on('request-statistics', () => {
            this.requestStatistics();
        });
        Main.electron.ipcRenderer.on('set-statistics', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setStatistics(arg);
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
        let config: any = { attributes: true, childList: false, subtree: false };
        let observer = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    Main.main.style.height = (this.mainContainer.clientHeight - 31) + 'px';
                    Main.main.style.width = this.mainContainer.clientWidth + 'px';
                }
            }
        });
        observer.observe(this.mainContainer, config);

        setTimeout(() => {
            this.resizePanels();
        }, 200);
    }

    setStatus(arg: any): void {
        var status: HTMLDivElement = document.getElementById('status') as HTMLDivElement;
        status.innerHTML = arg;
        if (arg.length > 0) {
            status.style.display = 'block';
        } else {
            status.style.display = 'none';
        }
    }

    addTab(arg: any): void {
        if (Main.tabHolder.has(arg.id)) {
            Main.tabHolder.selectTab(arg.id);
            return;
        }
        let tab = new Tab(arg.id, arg.description, true);
        let view: TranslationView = new TranslationView(tab.getContainer(), arg.id, arg.srcLang, arg.tgtLang);
        Main.tabHolder.addTab(tab);
        Main.tabHolder.selectTab(arg.id);
        tab.getLabel().addEventListener('click', () => {
            view.setSize();
            view.setSpellChecker();
        });
        Main.translationViews.set(arg.id, view);
    }

    closeTab(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.tabHolder.canClose(selected)) {
            Main.tabHolder.closeTab(selected);
        }
    }

    resizePanels(): void {
        let body = document.getElementById('body');
        this.mainContainer.style.width = body.clientWidth + 'px';
        this.mainContainer.style.height = body.clientHeight + 'px';
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

    getTmMatches(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).getTmMatches();
        }
    }

    applyTranslationMemoryAll(): void {
        let selected = Main.tabHolder.getSelected();
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
        // TODO
        Main.electron.ipcRenderer.send('show-message', { type: 'info', message: 'Not implemented yet' });
    }

    mergeNext(): void {
        // TODO
        Main.electron.ipcRenderer.send('show-message', { type: 'info', message: 'Not implemented yet' });
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

    reloadPage(arg: any): void {
        let project: string = arg.project;
        if (Main.translationViews.has(project)) {
            Main.translationViews.get(project).getSegments();
        }
    }

    setStatistics(arg: any): void {
        let project: string = arg.project;
        if (Main.translationViews.has(project)) {
            Main.translationViews.get(project).setStatistics(arg.statistics);
        }
        this.projectsView.updateStatus(arg);
    }

    filterSegments(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).filterSegments();
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
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.electron.ipcRenderer.send('unlock-all', { project: selected });
        }
    }

    tagsAnalysis(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.electron.ipcRenderer.send('analyze-tags', { project: selected });
        }
    }

    spacesAnalysis(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.electron.ipcRenderer.send('analyze-spaces', { project: selected });
        }
    }
}

new Main();
