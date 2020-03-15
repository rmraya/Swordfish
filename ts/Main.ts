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

const { ipcRenderer } = require('electron');

class Main {

    tabs: Map<string, string>;

    projectsView: ProjectsView;
    memoriesView: MemoriesView;
    glossariesView: GlossariesView;

    constructor() {
        this.tabs = new Map<string, string>();

        document.getElementById('projects').addEventListener('click', () => { this.selectTab('projects') });
        document.getElementById('memories').addEventListener('click', () => { this.selectTab('memories') });
        document.getElementById('glossaries').addEventListener('click', () => { this.selectTab('glossaries') });

        this.tabs.set('projects', this.buildProjectsTab());
        this.tabs.set('memories', this.buildMemoriesTab());
        this.tabs.set('glossaries', this.buildGlossariesTab());

        this.selectTab('projects');

        ipcRenderer.send('get-theme');
        ipcRenderer.on('set-theme', (event, arg) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
        });
        window.addEventListener('resize', () => {
            this.resizePanels();
        });
        ipcRenderer.on('view-projects', () => {
            this.selectTab('projects');
        });
        ipcRenderer.on('view-memories', () => {
            this.selectTab('memories');
        });
        ipcRenderer.on('view-glossaries', () => {
            this.selectTab('glossaries');
        });
    }

    selectTab(tab: string): void {
        let list: HTMLCollectionOf<Element> = document.getElementsByClassName('tab');
        let length = list.length;
        for (let i = 0; i < length; i++) {
            if (list[i].classList.contains('selectedTab')) {
                list[i].classList.remove('selectedTab');
                this.tabs.set(list[i].getAttribute('id'), document.getElementById('main').innerHTML);
            }
        }
        document.getElementById('main').innerHTML = this.tabs.get(tab);
        document.getElementById(tab).classList.add('selectedTab');
        document.getElementById(tab).blur();
    }

    buildProjectsTab(): string {
        this.projectsView = new ProjectsView();
        return this.projectsView.getHtml();
    }

    buildMemoriesTab(): string {
        this.memoriesView = new MemoriesView();
        return this.memoriesView.getHtml();
    }

    buildGlossariesTab(): string {
        this.glossariesView = new GlossariesView();
        return this.glossariesView.getHtml();
    }
    
    resizePanels(): void {
        // TODO
    }    
}

new Main();
