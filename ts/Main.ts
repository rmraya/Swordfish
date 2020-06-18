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

class Tab {

    id: string;
    label: HTMLAnchorElement;
    labelDiv: HTMLDivElement;
    container: HTMLDivElement;

    constructor(tabId: string, description: string, closeable: boolean) {
        this.id = tabId;
        this.labelDiv = document.createElement('div');
        this.labelDiv.classList.add('tab');

        this.label = document.createElement('a');
        this.label.id = this.id;
        this.label.innerText = description;
        this.label.addEventListener('click', () => {
            Main.selectTab(this.id);
        });
        this.labelDiv.appendChild(this.label);
        if (closeable) {
            let closeAnchor: HTMLAnchorElement = document.createElement('a');
            closeAnchor.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path style="stroke-width: 1.4;" d="M4 4 L12 12 M4 12 L12 4"/></svg>';
            closeAnchor.style.marginLeft = '10px';
            closeAnchor.addEventListener('click', () => {
                Main.closeTab(this.id);
            });
            this.labelDiv.appendChild(closeAnchor);
        }
        this.container = document.createElement('div');
        this.container.classList.add('hidden');
    }

    getId(): string {
        return this.id;
    }

    getLabel(): HTMLDivElement {
        return this.labelDiv;
    }

    getContainer(): HTMLDivElement {
        return this.container;
    }

    setContainer(div: HTMLDivElement): void {
        this.container = div;
    }
}

class Main {

    electron = require('electron');

    static labels: Map<String, HTMLDivElement>;
    static tabs: Map<string, HTMLDivElement>;
    static tabHolder: HTMLDivElement;
    static main: HTMLDivElement;

    projectsView: ProjectsView;
    memoriesView: MemoriesView;
    glossariesView: GlossariesView;

    constructor() {
        Main.labels = new Map<String, HTMLDivElement>();
        Main.tabs = new Map<string, HTMLDivElement>();

        Main.tabHolder = document.getElementById('tabs') as HTMLDivElement;
        Main.main = document.getElementById('main') as HTMLDivElement;

        let projectsTab = new Tab('projects', 'Projects', false);
        projectsTab.setContainer(this.buildProjectsTab());
        Main.tabHolder.appendChild(projectsTab.getLabel());
        Main.labels.set(projectsTab.getId(), projectsTab.getLabel());
        Main.main.appendChild(projectsTab.getContainer());
        Main.tabs.set(projectsTab.getId(), projectsTab.getContainer());

        let memoriesTab = new Tab('memories', 'Memories', false);
        memoriesTab.setContainer(this.buildMemoriesTab());
        Main.tabHolder.appendChild(memoriesTab.getLabel());
        Main.labels.set(memoriesTab.getId(), memoriesTab.getLabel());
        Main.main.appendChild(memoriesTab.getContainer());
        Main.tabs.set(memoriesTab.getId(), memoriesTab.getContainer());

        let glossariesTab = new Tab('glossaries', 'Glossaries', false);
        glossariesTab.setContainer(this.buildGlossariesTab())
        Main.tabHolder.appendChild(glossariesTab.getLabel());
        Main.labels.set(glossariesTab.getId(), glossariesTab.getLabel());
        Main.main.appendChild(glossariesTab.getContainer());
        Main.tabs.set(glossariesTab.getId(), glossariesTab.getContainer());

        Main.selectTab('projects');

        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
        });
        this.electron.ipcRenderer.on('request-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            this.electron.ipcRenderer.send('get-theme');
        });
        window.addEventListener('resize', () => {
            this.resizePanels();
        });
        window.addEventListener('load', () => {
            this.resizePanels();
        })
        this.electron.ipcRenderer.on('view-projects', () => {
            Main.selectTab('projects');
        });
        this.electron.ipcRenderer.on('request-projects', () => {
            this.projectsView.loadProjects();
        });
        this.electron.ipcRenderer.on('view-memories', () => {
            Main.selectTab('memories');
        });
        this.electron.ipcRenderer.on('view-glossaries', () => {
            Main.selectTab('glossaries');
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
        })
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

    static selectTab(tab: string): void {
        Main.labels.forEach(function (value, key) {
            if (value.classList.contains('selectedTab')) {
                value.classList.remove('selectedTab');
            }
        });
        Main.labels.get(tab).classList.add('selectedTab');
        Main.labels.get(tab).blur();

        Main.tabs.forEach(function (value, key) {
            if (!value.classList.contains('hidden')) {
                value.classList.add('hidden');
            }
        });
        Main.tabs.get(tab).classList.remove('hidden');
    }

    static closeTab(tab: string): void {
        Main.tabHolder.removeChild(Main.labels.get(tab));
        Main.labels.delete(tab);
        Main.main.removeChild(Main.tabs.get(tab));
        Main.tabs.delete(tab);

        Main.selectTab('projects');
    }

    addTab(arg: any) {
        if (Main.tabs.has(arg.id)) {
            Main.selectTab(arg.id);
            return;
        }
        let tab = new Tab(arg.id, arg.description, true);

        Main.labels.set(tab.getId(), tab.getLabel());
        Main.tabHolder.appendChild(tab.getLabel());

        Main.tabs.set(tab.getId(), tab.getContainer());
        Main.main.appendChild(tab.getContainer());
        Main.selectTab(arg.id);
    }

    buildProjectsTab(): HTMLDivElement {
        let div: HTMLDivElement = document.createElement('div');
        div.classList.add('hidden');
        this.projectsView = new ProjectsView(div);
        return div;
    }

    buildMemoriesTab(): HTMLDivElement {
        let div: HTMLDivElement = document.createElement('div');
        div.classList.add('hidden');
        this.memoriesView = new MemoriesView(div);
        return div;
    }

    buildGlossariesTab(): HTMLDivElement {
        let div: HTMLDivElement = document.createElement('div');
        div.classList.add('hidden');
        this.glossariesView = new GlossariesView(div);
        return div;
    }

    resizePanels(): void {
        let body = document.getElementById('body');
        let main = document.getElementById('main');
        main.style.width = body.clientWidth + 'px';
        main.style.height = (body.clientHeight - 31) + 'px';
    }
}

new Main();
