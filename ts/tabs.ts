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
    parent: TabHolder;

    constructor(tabId: string, description: string, closeable: boolean) {
        this.id = tabId;
        this.labelDiv = document.createElement('div');
        this.labelDiv.classList.add('tab');

        this.label = document.createElement('a');
        this.label.id = this.id;
        if (description.length > 40) {
            this.label.title = description;
            this.label.innerText = description.substr(0, 37) + '...';
        } else {
            this.label.innerText = description;
        }
        this.label.addEventListener('click', () => {
            this.parent.selectTab(this.id);
        });
        this.labelDiv.appendChild(this.label);
        if (closeable) {
            let closeAnchor: HTMLAnchorElement = document.createElement('a');
            closeAnchor.className = 'tooltip';
            closeAnchor.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path style="stroke-width: 1.4;" d="M4 4 L12 12 M4 12 L12 4"/></svg>' +
                '<span  class="tooltiptext bottomTooltip">Close</span>';
            closeAnchor.style.marginLeft = '10px';
            closeAnchor.addEventListener('click', () => {
                this.parent.closeTab(this.id);
            });
            this.labelDiv.appendChild(closeAnchor);
        }
        this.container = document.createElement('div');
        this.container.classList.add('hidden');
    }

    setParent(holder: TabHolder): void {
        this.parent = holder;
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

class TabHolder {

    labels: Map<String, HTMLDivElement>;
    tabs: Map<string, HTMLDivElement>;

    tabsHolder: HTMLDivElement;
    contentHolder: HTMLDivElement;

    tabsList: string[] = [];
    selectedTab: string;

    constructor(parent: HTMLDivElement, id: string) {
        this.labels = new Map<String, HTMLDivElement>();
        this.tabs = new Map<string, HTMLDivElement>();

        this.tabsHolder = document.createElement('div');
        this.tabsHolder.classList.add('tabHolder');
        parent.appendChild(this.tabsHolder);

        this.contentHolder = document.createElement('div');
        this.contentHolder.id = id;
        parent.appendChild(this.contentHolder);
    }

    addTab(tab: Tab): void {
        tab.setParent(this);
        this.tabsHolder.appendChild(tab.getLabel());
        this.labels.set(tab.getId(), tab.getLabel());
        this.contentHolder.appendChild(tab.getContainer());
        this.tabs.set(tab.getId(), tab.getContainer());
        this.tabsList.push(tab.getId());
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
        this.selectedTab = tab;
    }

    closeTab(tab: string): void {
        this.tabsHolder.removeChild(this.labels.get(tab));
        this.labels.delete(tab);
        this.contentHolder.removeChild(this.tabs.get(tab));
        this.tabs.delete(tab);
        this.tabsList.splice(this.tabsList.indexOf("tab"), 1);
        if (tab === this.selectedTab && this.tabsList.length > 1) {
            this.selectTab(this.tabsList[0]);
        }
    }

    has(tab: string): boolean {
        return this.labels.has(tab);
    }
}
