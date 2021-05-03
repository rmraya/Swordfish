/*****************************************************************************
Copyright (c) 2007-2021 - Maxprograms,  http://www.maxprograms.com/

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

class Term {
    srcLang: string;
    tgtLang: string;
    source: string;
    target: string;
    origin: string;
}

class TermsPanel {

    electron = require('electron');

    container: HTMLDivElement;
    projectId: string;
    selected: Term;
    selectedIndex: number = 0;
    terms: Term[] = [];
    rows: HTMLTableRowElement[] = [];
    table: HTMLTableElement;

    originSpan: HTMLSpanElement;

    constructor(div: HTMLDivElement, projectId: string) {
        this.container = div;
        this.projectId = projectId;

        let tableHolder: HTMLDivElement = document.createElement('div');
        tableHolder.classList.add('divContainer');
        this.container.appendChild(tableHolder);

        this.table = document.createElement('table');
        this.table.classList.add('stripes');
        this.table.classList.add('zoomable');
        tableHolder.appendChild(this.table);

        let toolbar: HTMLDivElement = document.createElement('div');
        toolbar.classList.add('toolbar');
        toolbar.classList.add('middle');
        this.container.appendChild(toolbar);

        let getTerms = document.createElement('a');
        getTerms.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M17.01 14h-.8l-.27-.27c.98-1.14 1.57-2.61 1.57-4.23 0-3.59-2.91-6.5-6.5-6.5s-6.5 3-6.5 6.5H2l3.84 4 4.16-4H6.51C6.51 7 8.53 5 11.01 5s4.5 2.01 4.5 4.5c0 2.48-2.02 4.5-4.5 4.5-.65 0-1.26-.14-1.82-.38L7.71 15.1c.97.57 2.09.9 3.3.9 1.61 0 3.08-.59 4.22-1.57l.27.27v.79l5.01 4.99L22 19l-4.99-5z"/></svg>' +
            '<span class="tooltiptext topTooltip">Get Glossary Terms</span>';
        getTerms.className = 'tooltip';
        getTerms.addEventListener('click', () => {
            this.electron.ipcRenderer.send('request-apply-terminology');
        });
        toolbar.appendChild(getTerms);

        this.originSpan = document.createElement('span');
        this.originSpan.style.marginLeft = '10px';
        this.originSpan.style.marginTop = '4px';
        toolbar.appendChild(this.originSpan);

        let config: MutationObserverInit = { attributes: true, childList: false, subtree: false };
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
        this.table.innerHTML = '<tr/>';
        this.selected = undefined;
        this.terms = [];
        this.originSpan.innerText = '';
        this.rows = [];
    }

    getTerm(i: number) {
        return this.terms[i - 1].target;
    }

    getSelected(): string {
        if (this.selected) {
            return this.selected.target;
        }
        return '';
    }

    setTerms(terms: Term[]): void {
        if (terms.length === 0) {
            this.clear();
            return;
        }
        this.terms = terms;
        this.table.innerHTML = '';
        let length: number = terms.length;
        this.rows = [];
        for (let i: number = 0; i < length; i++) {
            let term: Term = terms[i];
            let row: HTMLTableRowElement = document.createElement('tr');
            row.addEventListener('click', () => {
                this.selected = term;
                let collection = this.table.getElementsByClassName('selected');
                if (collection.length > 0) {
                    collection[0].classList.remove('selected');
                }
                this.originSpan.innerText = term.origin;
                row.classList.add('selected');
                this.selectedIndex = i;
            });
            this.table.appendChild(row);

            let td: HTMLTableCellElement = document.createElement('td');
            td.classList.add('center');
            td.classList.add('middle');
            td.classList.add('initial');
            td.innerText = '' + (i + 1);
            row.appendChild(td);

            let source: HTMLTableCellElement = document.createElement('td');
            source.innerText = term.source;
            source.style.width = '49%';
            source.classList.add('initial')
            if (TranslationView.isBiDi(term.srcLang)) {
                source.dir = 'rtl';
            }
            row.appendChild(source);

            let target: HTMLTableCellElement = document.createElement('td');
            target.innerText = term.target;
            target.style.width = '49%';
            if (TranslationView.isBiDi(term.tgtLang)) {
                target.dir = 'rtl';
            }
            row.appendChild(target);

            this.rows.push(row);
        }
        if (this.rows.length > 0) {
            this.rows[0].classList.add('selected');
            this.selected = this.terms[0];
            this.originSpan.innerText = this.terms[0].origin;
            this.selectedIndex = 0;
        }
    }

    selectNextTerm(): void {
        if (this.selectedIndex < this.rows.length - 1) {
            this.rows[this.selectedIndex].classList.remove('selected');
            this.selectedIndex++;
            this.rows[this.selectedIndex].classList.add('selected');
            this.selected = this.terms[this.selectedIndex];
            this.originSpan.innerText = this.terms[this.selectedIndex].origin;
            this.rows[this.selectedIndex].scrollIntoView()
        }
    }

    selectPreviousTerm(): void {
        if (this.selectedIndex > 0) {
            this.rows[this.selectedIndex].classList.remove('selected');
            this.selectedIndex--;
            this.rows[this.selectedIndex].classList.add('selected');
            this.selected = this.terms[this.selectedIndex];
            this.originSpan.innerText = this.terms[this.selectedIndex].origin;
            this.rows[this.selectedIndex].scrollIntoView()
        }
    }
}