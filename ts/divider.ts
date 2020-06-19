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

class VerticalSplit {

    left: HTMLDivElement;
    divider: HTMLDivElement;
    right: HTMLDivElement

    currentSum: number;

    constructor(parent: HTMLDivElement, leftPercentage: number) {

        parent.style.display = 'flex';
        parent.style.flexDirection = 'row';

        this.left = document.createElement('div');
        this.left.style.width = leftPercentage + '%';
        parent.appendChild(this.left);

        this.divider = document.createElement('div');
        this.divider.classList.add('hdivider');
        this.divider.draggable = true;
        this.divider.addEventListener('dragstart', (event: DragEvent) => {
            this.dragStart(event);
        });
        this.divider.addEventListener('dragend', (event) => {
            this.dragEnd(event);
        });
        parent.appendChild(this.divider);

        this.right = document.createElement('div');
        this.right.style.width = (100 - leftPercentage) + '%';
        parent.appendChild(this.right);
    }

    leftPanel(): HTMLDivElement {
        return this.left;
    }

    rightPanel(): HTMLDivElement {
        return this.right;
    }

    dragStart(ev: DragEvent) {
        this.currentSum = this.left.clientWidth + this.divider.clientWidth + this.right.clientWidth;
    }

    dragEnd(ev: DragEvent) {
        var leftWidth: number = this.left.clientWidth + ev.offsetX;
        if (leftWidth < 20) {
            leftWidth = 20;
        }
        leftWidth = Math.round(leftWidth * 100 / this.currentSum);

        var rightWidth: number = 100 - leftWidth;
        this.left.style.width = leftWidth + 'vw';
        this.right.style.width = rightWidth + 'vw';
    }
}

class HorizontalSplit {

    currentSum: number;

    top: HTMLDivElement;
    divider: HTMLDivElement;
    bottom: HTMLDivElement;

    constructor(parent: HTMLDivElement, topPercentage: number) {

        parent.style.display = 'flex';
        parent.style.flexDirection = 'column';

        this.top = document.createElement('div');
        this.top.style.height = topPercentage + '%';
        parent.appendChild(this.top);

        this.divider = document.createElement('div');
        this.divider.classList.add('vdivider');
        this.divider.draggable = true;
        this.divider.addEventListener('dragstart', (event: DragEvent) => {
            this.dragStart(event);
        });
        this.divider.addEventListener('dragend', (event: DragEvent) => {
            this.dragEnd(event);
        });
        parent.appendChild(this.divider);

        this.bottom = document.createElement('div');
        this.bottom.style.width = (100 - topPercentage) + '%';
        parent.appendChild(this.bottom);
    }

    topPanel(): HTMLDivElement {
        return this.top;
    }

    bottomPanel(): HTMLDivElement {
        return this.bottom;
    }

    dragStart(ev: DragEvent) {
        this.currentSum = this.top.clientHeight + this.divider.clientHeight + this.bottom.clientHeight;
    }

    dragEnd(ev: DragEvent) {
        var topHeight: number = this.top.clientHeight + ev.offsetY;
        if (topHeight < 24) {
            topHeight = 24;
        }
        topHeight = Math.round(topHeight * 100 / this.currentSum);

        var bottomHeight: number = 100 - topHeight;

        this.top.style.height = topHeight + 'vh';
        this.bottom.style.height = bottomHeight + 'vh';
    }
}