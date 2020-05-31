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

    labels: Map<String, HTMLAnchorElement>;
    tabs: Map<string, HTMLDivElement>;

    projectsView: ProjectsView;
    memoriesView: MemoriesView;
    glossariesView: GlossariesView;

    constructor() {
        this.labels = new Map<String, HTMLAnchorElement>();
        this.tabs = new Map<string, HTMLDivElement>();

        let tabHolder = document.getElementById('tabs');
        let main = document.getElementById('main');

        let projLabel = document.createElement('a');
        projLabel.innerText = 'Projects';
        projLabel.classList.add('tab');
        projLabel.id = 'projects';
        projLabel.addEventListener('click', () => {
            this.selectTab('projects');
        });
        tabHolder.appendChild(projLabel);
        this.labels.set('projects', projLabel);

        let proj = this.buildProjectsTab();
        main.appendChild(proj);
        this.tabs.set('projects', proj);

        let memLabel = document.createElement('a');
        memLabel.innerHTML = 'Memories';
        memLabel.classList.add('tab');
        memLabel.id = 'memories';
        memLabel.addEventListener('click', () => {
            this.selectTab('memories');
        });
        tabHolder.appendChild(memLabel);
        this.labels.set('memories', memLabel);

        let mem = this.buildMemoriesTab();
        main.appendChild(mem);
        this.tabs.set('memories', mem);

        let glossLabel = document.createElement('a');
        glossLabel.innerText = 'Glossaries';
        glossLabel.classList.add('tab');
        glossLabel.id = 'glossaries';
        glossLabel.addEventListener('click', () => {
            this.selectTab('glossaries');
        });
        tabHolder.appendChild(glossLabel);
        this.labels.set('glossaries', glossLabel);

        let gloss = this.buildGlossariesTab();
        main.appendChild(gloss);
        this.tabs.set('glossaries', gloss);

        this.selectTab('projects');

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
        this.electron.ipcRenderer.on('view-projects', () => {
            this.selectTab('projects');
        });
        this.electron.ipcRenderer.on('view-memories', () => {
            this.selectTab('memories');
        });
        this.electron.ipcRenderer.on('view-glossaries', () => {
            this.selectTab('glossaries');
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
    
    selectTab(tab: string): void {
        this.labels.forEach(function (value, key) {
            if (value.classList.contains('selectedTab')) {
                value.classList.remove('selectedTab');
            }
        });
        this.labels.get(tab).classList.add('selectedTab');
        this.labels.get(tab).blur();

        this.tabs.forEach(function (value, key) {
            if (!value.classList.contains('hidden')) {
                value.classList.add('hidden');
            }
        });
        this.tabs.get(tab).classList.remove('hidden');
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
        // TODO
    }
}

new Main();
