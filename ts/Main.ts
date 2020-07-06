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

    electron = require('electron');

    static tabHolder: TabHolder;
    mainContainer: HTMLDivElement;
    static main: HTMLDivElement;

    projectsView: ProjectsView;
    memoriesView: MemoriesView;
    glossariesView: GlossariesView;

    constructor() {

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

        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
        });
        this.electron.ipcRenderer.on('request-theme', () => {
            this.electron.ipcRenderer.send('get-theme');
        });
        window.addEventListener('resize', () => {
            this.resizePanels();
        });
        this.electron.ipcRenderer.on('view-projects', () => {
            Main.tabHolder.selectTab('projects');
        });
        this.electron.ipcRenderer.on('request-projects', (event: Electron.IpcRendererEvent, arg: any) => {
            this.projectsView.loadProjects(arg);
        });
        this.electron.ipcRenderer.on('export-translations', (event: Electron.IpcRendererEvent, arg: any) => {
            this.projectsView.exportTranslations();
        });
        this.electron.ipcRenderer.on('import-project', (event: Electron.IpcRendererEvent, arg: any) => {
            this.projectsView.importProject();
        });
        this.electron.ipcRenderer.on('export-project', (event: Electron.IpcRendererEvent, arg: any) => {
            this.projectsView.exportProject();
        });
        this.electron.ipcRenderer.on('view-memories', () => {
            Main.tabHolder.selectTab('memories');
        });
        this.electron.ipcRenderer.on('request-memories', () => {
            this.memoriesView.loadMemories();
        });

        this.electron.ipcRenderer.on('view-glossaries', () => {
            Main.tabHolder.selectTab('glossaries');
        });
        this.electron.ipcRenderer.on('start-waiting', () => {
            document.getElementById('body').classList.add("wait");
        });
        this.electron.ipcRenderer.on('end-waiting', () => {
            document.getElementById('body').classList.remove("wait");
        });
        this.electron.ipcRenderer.on('set-status', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setStatus(arg);
        });
        this.electron.ipcRenderer.on('add-tab', (event: Electron.IpcRendererEvent, arg: any) => {
            this.addTab(arg);
        });
        this.electron.ipcRenderer.on('translate-projects', () => {
            this.projectsView.openProjects();
        });
        this.electron.ipcRenderer.on('remove-memory', () => {
            this.memoriesView.removeMemory();
        });
        this.electron.ipcRenderer.on('import-tmx', () => {
            this.memoriesView.importTMX();
        });
        this.electron.ipcRenderer.on('export-tmx', () => {
            this.memoriesView.exportTMX();
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

    addTab(arg: any) {
        if (Main.tabHolder.has(arg.id)) {
            Main.tabHolder.selectTab(arg.id);
            return;
        }
        let tab = new Tab(arg.id, arg.description, true);
        let view: TranslationView = new TranslationView(tab.getContainer(), arg.id);
        Main.tabHolder.addTab(tab);
        Main.tabHolder.selectTab(arg.id);
        tab.getLabel().addEventListener('click', () => {
            view.setSize();
        });
    }

    resizePanels(): void {
        let body = document.getElementById('body');
        this.mainContainer.style.width = body.clientWidth + 'px';
        this.mainContainer.style.height = body.clientHeight + 'px';
    }
}

new Main();
