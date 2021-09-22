/*******************************************************************************
 * Copyright (c) 2007-2021 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/

class Tab {

    id: string;
    label: HTMLAnchorElement;
    labelDiv: HTMLDivElement;
    container: HTMLDivElement;
    parent: TabHolder;
    closeable: boolean;

    constructor(tabId: string, description: string, closeable: boolean) {
        this.id = tabId;
        this.labelDiv = document.createElement('div');
        this.labelDiv.classList.add('tab');
        this.closeable = closeable;

        this.label = document.createElement('a');
        this.label.id = this.id;
        if (description.length > 40) {
            this.label.title = description;
            this.label.innerText = '...' + description.substr(description.length - 37);
        } else {
            this.label.innerText = description;
        }
        this.label.addEventListener('click', () => {
            this.parent.selectTab(this.id);
        });
        this.labelDiv.appendChild(this.label);
        if (closeable) {
            let closeAnchor: HTMLAnchorElement = document.createElement('a');
            closeAnchor.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path style="stroke-width: 1.4;" d="M6 6 L14 14 M6 14 L14 6"/></svg>';
            closeAnchor.style.marginLeft = '8px';
            closeAnchor.addEventListener('click', () => {
                this.parent.closeTab(this.id);
            });
            this.labelDiv.appendChild(closeAnchor);
        }
        this.container = document.createElement('div');
        this.container.style.width = '100%';
        this.container.style.height = '100%';
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

    canClose(): boolean {
        return this.closeable;
    }

    setSelected(selected: boolean): void {
        if (selected) {
            this.labelDiv.classList.add('selectedTab');
            this.container.classList.remove('hidden');
        } else {
            this.labelDiv.classList.remove('selectedTab');
            this.container.classList.add('hidden');
        }
    }
}

class TabHolder {

    labels: Map<string, HTMLDivElement>;
    tabs: Map<string, Tab>;
    closeable: Map<string, boolean>;
    tabsHolder: HTMLDivElement;
    contentHolder: HTMLDivElement;

    tabsList: string[] = [];
    selectedTab: string;

    constructor(parent: HTMLDivElement, id: string) {
        this.labels = new Map<string, HTMLDivElement>();
        this.tabs = new Map<string, Tab>();
        this.closeable = new Map<string, boolean>();

        this.tabsHolder = document.createElement('div');
        this.tabsHolder.classList.add('tabHolder');
        parent.appendChild(this.tabsHolder);

        this.contentHolder = document.createElement('div');
        this.contentHolder.id = id;
        this.contentHolder.style.width = '100%';
        this.contentHolder.style.height = '100%';
        parent.appendChild(this.contentHolder);
    }

    getTabsHeight(): number {
        return this.tabsHolder.clientHeight;
    }

    clear(): void {
        this.labels.forEach((value, key) => {
            this.tabsHolder.removeChild(value);
        });
        this.labels.clear();
        this.tabs.forEach((value, key) => {
            this.contentHolder.removeChild(value.getContainer());
        });
        this.tabs.clear();
        this.tabsList = [];
        this.selectedTab = undefined;
    }

    addTab(tab: Tab): void {
        tab.setParent(this);
        this.tabsHolder.appendChild(tab.getLabel());
        this.labels.set(tab.getId(), tab.getLabel());
        this.contentHolder.appendChild(tab.getContainer());
        this.tabs.set(tab.getId(), tab);
        this.tabsList.push(tab.getId());
        this.closeable.set(tab.getId(), tab.canClose());
        if (this.tabsList.length === 1) {
            this.selectTab(tab.getId());
        }
    }

    selectTab(tabId: string): void {
        this.tabs.forEach((value, key) => {
            value.setSelected(tabId === key);
        });
        this.selectedTab = tabId;
    }

    getSelected(): string {
        return this.selectedTab;
    }

    canClose(tabId: string): boolean {
        return this.closeable.get(tabId);
    }

    closeTab(tabId: string): void {
        if (tabId === this.selectedTab && this.tabsList.length > 1) {
            this.selectTab(this.tabsList[0]);
        }
        this.tabsHolder.removeChild(this.labels.get(tabId));
        this.labels.delete(tabId);
        this.contentHolder.removeChild(this.tabs.get(tabId).getContainer());
        this.tabs.delete(tabId);
        this.closeable.delete(tabId);
        this.tabsList.splice(this.tabsList.indexOf(tabId), 1);
    }

    has(tabId: string): boolean {
        return this.labels.has(tabId);
    }

    getTabsHolder(): HTMLDivElement {
        return this.tabsHolder;
    }

    size(): number {
        return this.tabsList.length;
    }

    selectNext(): void {
        if (this.tabsList.length < 2) {
            return;
        }
        let index = this.tabsList.indexOf(this.selectedTab);
        if (index < this.tabsList.length - 1) {
            this.selectTab(this.tabsList[index + 1]);
        }
    }

    selectPrevious(): void {
        if (this.tabsList.length < 2) {
            return;
        }
        let index = this.tabsList.indexOf(this.selectedTab);
        if (index > 0) {
            this.selectTab(this.tabsList[index - 1]);
        }
    }
}
