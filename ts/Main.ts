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
    container: HTMLDivElement;

    constructor(tabId: string, description: string) {
        this.id = tabId;

        this.label = document.createElement('a');
        this.label.id = this.id;
        this.label.classList.add('tab');
        this.label.innerText = description;
        this.label.addEventListener('click', () => {
            Main.selectTab(this.id);
        })
        this.container = document.createElement('div');
        this.container.classList.add('hidden');
    }

    getId(): string {
        return this.id;
    }

    getLabel(): HTMLAnchorElement {
        return this.label;
    }

    getContainer(): HTMLDivElement {
        return this.container;
    }

    setContainer(div: HTMLDivElement) : void {
        this.container = div;
    }
}

class Main {

    electron = require('electron');

    static labels: Map<String, HTMLAnchorElement>;
    static tabs: Map<string, HTMLDivElement>;

    projectsView: ProjectsView;
    memoriesView: MemoriesView;
    glossariesView: GlossariesView;

    constructor() {
        Main.labels = new Map<String, HTMLAnchorElement>();
        Main.tabs = new Map<string, HTMLDivElement>();

        let tabHolder = document.getElementById('tabs');
        let main = document.getElementById('main');

        let projLabel = document.createElement('a');
        projLabel.innerText = 'Projects';
        projLabel.classList.add('tab');
        projLabel.id = 'projects';
        projLabel.addEventListener('click', () => {
            Main.selectTab('projects');
        });
        tabHolder.appendChild(projLabel);
        Main.labels.set('projects', projLabel);

        let proj = this.buildProjectsTab();
        main.appendChild(proj);
        Main.tabs.set('projects', proj);

        let memLabel = document.createElement('a');
        memLabel.innerHTML = 'Memories';
        memLabel.classList.add('tab');
        memLabel.id = 'memories';
        memLabel.addEventListener('click', () => {
            Main.selectTab('memories');
        });
        tabHolder.appendChild(memLabel);
        Main.labels.set('memories', memLabel);

        let mem = this.buildMemoriesTab();
        main.appendChild(mem);
        Main.tabs.set('memories', mem);

        let glossLabel = document.createElement('a');
        glossLabel.innerText = 'Glossaries';
        glossLabel.classList.add('tab');
        glossLabel.id = 'glossaries';
        glossLabel.addEventListener('click', () => {
            Main.selectTab('glossaries');
        });
        tabHolder.appendChild(glossLabel);
        Main.labels.set('glossaries', glossLabel);

        let gloss = this.buildGlossariesTab();
        main.appendChild(gloss);
        Main.tabs.set('glossaries', gloss);

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

    addTab(arg: any) {
        let tab = new Tab(arg.id, arg.description);

        let tabHolder = document.getElementById('tabs');
        Main.labels.set(tab.getId(), tab.getLabel());
        tabHolder.appendChild(tab.getLabel());

        let main = document.getElementById('main');
        Main.tabs.set(tab.getId(), tab.getContainer());
        main.appendChild(tab.getContainer());
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
