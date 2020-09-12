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

class TermsPanel {

    electron = require('electron');

    container: HTMLDivElement;
    projectId: string;

    table: HTMLTableElement;

    constructor(div: HTMLDivElement, projectId: string) {
        this.container = div;
        this.projectId = projectId;

        let tableHolder: HTMLDivElement = document.createElement('div');
        tableHolder.classList.add('divContainer');
        this.container.appendChild(tableHolder);

        this.table = document.createElement('table');
        this.table.classList.add('stripes');
        tableHolder.appendChild(this.table);

        let toolbar: HTMLDivElement = document.createElement('div');
        toolbar.classList.add('toolbar');
        toolbar.classList.add('middle');
        this.container.appendChild(toolbar);

        let insertTerm = document.createElement('a');
        insertTerm.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M21 11H6.83l3.58-3.59L9 6l-6 6 6 6 1.41-1.41L6.83 13H21v-2z"/></svg>' +
            '<span class="tooltiptext topTooltip">Insert Selected Term</span>';
        insertTerm.className = 'tooltip';
        insertTerm.addEventListener('click', () => {
            this.insertTerm();
        });
        toolbar.appendChild(insertTerm);

        let getTerms = document.createElement('a');
        getTerms.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M17.01 14h-.8l-.27-.27c.98-1.14 1.57-2.61 1.57-4.23 0-3.59-2.91-6.5-6.5-6.5s-6.5 3-6.5 6.5H2l3.84 4 4.16-4H6.51C6.51 7 8.53 5 11.01 5s4.5 2.01 4.5 4.5c0 2.48-2.02 4.5-4.5 4.5-.65 0-1.26-.14-1.82-.38L7.71 15.1c.97.57 2.09.9 3.3.9 1.61 0 3.08-.59 4.22-1.57l.27.27v.79l5.01 4.99L22 19l-4.99-5z"/></svg>' +
            '<span class="tooltiptext topTooltip">Get Glossary Terms</span>';
            getTerms.className = 'tooltip';
        insertTerm.addEventListener('click', () => {
            this.getTerms();
        });
        toolbar.appendChild(getTerms);

        let config: any = { attributes: true, childList: false, subtree: false };
        let observer = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    tableHolder.style.height = (this.container.clientHeight - toolbar.clientHeight) + 'px';
                }
            }
        });
        observer.observe(this.container, config);
    }

    clear(): void {
        // TODO
    }

    insertTerm(): void  {
        // TODO
    }

    getTerms(): void {
        // TODO
    }

    setTerms(terms:any[]): void {
        // TODO
    }
}