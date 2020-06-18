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
    static main: HTMLDivElement;

    projectsView: ProjectsView;
    memoriesView: MemoriesView;
    glossariesView: GlossariesView;

    constructor() {

        let container: HTMLDivElement = document.getElementById('mainContainer') as HTMLDivElement;
        Main.tabHolder = new TabHolder(container, 'main');

        Main.main = document.getElementById('main') as HTMLDivElement;

        let projectsTab = new Tab('projects', 'Projects', false);
        this.buildProjectsTab(projectsTab.getContainer());
        Main.tabHolder.addTab(projectsTab);

        let memoriesTab = new Tab('memories', 'Memories', false);
        this.buildMemoriesTab(memoriesTab.getContainer());
        Main.tabHolder.addTab(memoriesTab);

        let glossariesTab = new Tab('glossaries', 'Glossaries', false);
        this.buildGlossariesTab(glossariesTab.getContainer());
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
        window.addEventListener('load', () => {
            this.resizePanels();
        })
        this.electron.ipcRenderer.on('view-projects', () => {
            Main.tabHolder.selectTab('projects');
        });
        this.electron.ipcRenderer.on('request-projects', () => {
            this.projectsView.loadProjects();
        });
        this.electron.ipcRenderer.on('view-memories', () => {
            Main.tabHolder.selectTab('memories');
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
        this.electron.ipcRenderer.on('open-projects', () => {
            this.projectsView.openProjects();
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

    addTab(arg: any) {
        if (Main.tabHolder.has(arg.id)) {
            Main.tabHolder.selectTab(arg.id);
            return;
        }
        let tab = new Tab(arg.id, arg.description, true);
        new TranslationView(tab.getContainer(), arg.id);
        Main.tabHolder.addTab(tab);
        Main.tabHolder.selectTab(arg.id);
    }

    buildProjectsTab(div: HTMLDivElement): void {
        this.projectsView = new ProjectsView(div);
    }

    buildMemoriesTab(div: HTMLDivElement): void {
        this.memoriesView = new MemoriesView(div);
    }

    buildGlossariesTab(div: HTMLDivElement): void {
        this.glossariesView = new GlossariesView(div);
    }

    resizePanels(): void {
        let body = document.getElementById('body');
        let main = document.getElementById('main');
        main.style.width = body.clientWidth + 'px';
        main.style.height = (body.clientHeight - 31) + 'px';
    }
}

new Main();
