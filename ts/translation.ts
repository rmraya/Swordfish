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
        topBar.innerText = 'top bar'

        this.mainArea = document.createElement('div');
        this.mainArea.id = 'main' + projectId;
        this.mainArea.style.display = 'flex';
        div.appendChild(this.mainArea);

        this.filesArea = document.createElement('div');
        this.filesArea.id = 'left' + projectId;
        this.filesArea.style.width = '20%';
        this.mainArea.appendChild(this.filesArea);

        let leftDivider: HTMLDivElement = document.createElement('div');
        leftDivider.classList.add('hdivider');
        this.mainArea.appendChild(leftDivider);

        this.translationArea = document.createElement('div');
        this.translationArea.id = 'right' + projectId;
        this.translationArea.style.width = '80%';
        this.mainArea.appendChild(this.translationArea);

        this.buildFilesArea();
        this.buildTranslationArea();

        this.watchSizes(projectId);

        window.addEventListener('load', () => {
            this.mainArea.style.width = this.container.clientWidth + 'px';
            this.mainArea.style.height = (document.getElementById('main').clientHeight - 65) + 'px';
        });
    }

    getContainer(): HTMLDivElement {
        return this.container;
    }

    watchSizes(id: string): void {
        let targetNode: HTMLElement = document.getElementById('main');
        let area = document.getElementById('main' + id);
        let config: any = { attributes: true, childList: false, subtree: false };
        let observer = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    console.log('The ' + mutation.attributeName + ' attribute was modified.');
                    area.style.height = (targetNode.clientHeight - 65) + 'px';
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
        this.translationArea.innerText = 'translation area'
    }
}