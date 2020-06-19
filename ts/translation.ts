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

class TranslationView {

    electron = require('electron');

    container: HTMLDivElement;

    mainArea: HTMLDivElement;
    filesArea: HTMLDivElement;
    translationArea: HTMLDivElement;
    rightPanel: HTMLDivElement;
    segmentsArea: HTMLDivElement;
    memoryArea: HTMLDivElement;
    machineArea: HTMLDivElement;
    termsArea: HTMLDivElement;

    projectId: string;
    tbody: HTMLTableSectionElement;

    constructor(div: HTMLDivElement, projectId: string) {
        this.container = div;
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.projectId = projectId;

        let topBar: HTMLDivElement = document.createElement('div');
        topBar.className = 'toolbar';
        div.appendChild(topBar);
        
        let statisticsButton = document.createElement('a');
        statisticsButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2.5 2.1h-15V5h15v14.1zm0-16.1h-15c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Project Statistics</span>';
        statisticsButton.className = 'tooltip';
        statisticsButton.addEventListener('click', () => {
            this.generateStatistics()
        });
        topBar.appendChild(statisticsButton);

        this.mainArea = document.createElement('div');
        this.mainArea.id = 'main' + projectId;
        this.mainArea.style.display = 'flex';
        div.appendChild(this.mainArea);

        let verticalPanels: ThreeVerticalPanels = new ThreeVerticalPanels(this.mainArea);
        verticalPanels.setWeights([25,50,25])
        this.filesArea =verticalPanels.leftPanel();

        this.translationArea = verticalPanels.centerPanel();
        this.translationArea.style.height = '100%';

        this.rightPanel = verticalPanels.rightPanel();

        this.buildFilesArea();
        this.buildTranslationArea();
        this.buildRightSide();

        setTimeout(() => {
            this.mainArea.style.width = this.container.clientWidth + 'px';
            this.mainArea.style.height = (document.getElementById('mainContainer').clientHeight - 34) + 'px';
            this.watchSizes(projectId);
        }, 200);
    }

    getContainer(): HTMLDivElement {
        return this.container;
    }

    watchSizes(id: string): void {
        let targetNode: HTMLElement = document.getElementById('mainContainer');
        let area = document.getElementById('main' + id);
        let config: any = { attributes: true, childList: false, subtree: false };
        let observer = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    area.style.height = (targetNode.clientHeight - 34) + 'px';
                    area.style.width = this.container.clientWidth + 'px';
                }
            }
        });
        observer.observe(targetNode, config);
    }

    buildFilesArea(): void {
        let title: HTMLDivElement = document.createElement('div');
        title.classList.add('titlepanel');
        title.innerText = 'Files';
        this.filesArea.appendChild(title);
    }

    buildTranslationArea() : void {
        let table: HTMLTableElement = document.createElement('table');
        table.classList.add('fill_width');
        table.classList.add('stripes');
        this.translationArea.appendChild(table);

        let thead: HTMLTableSectionElement = document.createElement('thead');
        table.appendChild(thead);

        let tr: HTMLTableRowElement = document.createElement('tr');
        thead.appendChild(tr);

        let th = document.createElement('th');
        th.classList.add('fixed');
        tr.appendChild(th);

        let selectAll: HTMLInputElement = document.createElement('input');
        selectAll.type = 'checkbox';
        th.appendChild(selectAll);

        th = document.createElement('th');
        th.innerText = 'Source'
        tr.appendChild(th);

        th = document.createElement('th');
        th.innerText = 'Target'
        tr.appendChild(th);

        this.tbody = document.createElement('tbody');
        table.appendChild(this.tbody);
    }

    buildRightSide(): void {
        let horizontalSplit: ThreeHorizontalPanels = new ThreeHorizontalPanels(this.rightPanel);

        this.memoryArea = horizontalSplit.topPanel();
        let memoryTitle: HTMLDivElement = document.createElement('div');
        memoryTitle.classList.add('titlepanel');
        memoryTitle.innerText = 'Translation Memory';
        this.memoryArea.appendChild(memoryTitle);

        this.machineArea = horizontalSplit.centerPanel();
        let machineTitle: HTMLDivElement = document.createElement('div');
        machineTitle.classList.add('titlepanel');
        machineTitle.innerText = 'Machine Translation';
        this.machineArea.appendChild(machineTitle);

        this.termsArea = horizontalSplit.bottomPanel();
        let termsTitle: HTMLDivElement = document.createElement('div');
        termsTitle.classList.add('titlepanel');
        termsTitle.innerText = 'Terms';
        this.termsArea.appendChild(termsTitle);
    }

    generateStatistics() : void {
        // TODO
    }
}