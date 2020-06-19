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
    segmentsArea: HTMLDivElement;
    memoryArea: HTMLDivElement;
    termsArea: HTMLDivElement;


    projectId: string;
    tableContainer: HTMLDivElement;
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

        let splitVertical: VerticalSplit = new VerticalSplit(this.mainArea, 25);

        this.filesArea =splitVertical.leftPanel();
        this.filesArea.id = 'left' + projectId;

        this.translationArea = splitVertical.rightPanel();
        this.translationArea.id = 'right' + projectId;
        this.translationArea.classList.add('fill_width');

        this.buildFilesArea();
        this.buildTranslationArea();

        this.watchSizes(projectId);


        setTimeout(() => {
            this.mainArea.style.width = this.container.clientWidth + 'px';
            this.mainArea.style.height = (document.getElementById('mainContainer').clientHeight - 34) + 'px';
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
        this.filesArea.innerText = 'files section'
    }

    buildTranslationArea(): void {

        let verticalSplit : VerticalSplit = new VerticalSplit(this.translationArea, 70);

        this.segmentsArea = verticalSplit.leftPanel()
        this.segmentsArea.innerText = 'segments';
        this.segmentsArea.classList.add('divContainer');

        let rightPanel: HTMLDivElement = verticalSplit.rightPanel();

        let horizontalSplit: HorizontalSplit = new HorizontalSplit(rightPanel, 50);

        this.memoryArea = horizontalSplit.topPanel();
        this.memoryArea.innerText = 'memory';

        this.termsArea = horizontalSplit.bottomPanel();
        this.termsArea.innerText = 'terms'

    }

    generateStatistics() : void {
        // TODO
    }
}