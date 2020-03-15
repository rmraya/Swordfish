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

class MemoriesView {

    container: HTMLDivElement;

    constructor() {
        this.container = document.createElement('div');
        let topBar: HTMLDivElement = document.createElement('div');
        topBar.className = 'toolbar';
        this.container.appendChild(topBar);

        let addButton = document.createElement('a');
        addButton.innerHTML = '<img src="images/add.svg"><span class="tooltiptext bottomTooltip">Add Memory</span>';
        addButton.className = 'tooltip';
        addButton.addEventListener('click', () => { this.addMemory() });
        topBar.appendChild(addButton);

        let removeButton = document.createElement('a');
        removeButton.innerHTML = '<img src="images/minus.svg"><span class="tooltiptext bottomTooltip">Remove Memory</span>';
        removeButton.className = 'tooltip';
        removeButton.addEventListener('click', () => { this.removeMemory() });
        topBar.appendChild(removeButton);

        let modifyButton = document.createElement('a');
        modifyButton.innerHTML = '<img src="images/edit.svg"><span class="tooltiptext bottomTooltip">Modify Memory</span>';
        modifyButton.className = 'tooltip';
        modifyButton.addEventListener('click', () => { this.modifyMemory() });
        topBar.appendChild(modifyButton);
    }

    getHtml(): string {
        return this.container.innerHTML;
    }

    addMemory(): void {
        // TODO
    }

    removeMemory(): void {
        // TODO
    }

    modifyMemory(): void {
        // TODO
    }
}