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
    right: HTMLDivElement;
    weights: number[];
    currentSum: number;

    constructor(parent: HTMLDivElement) {
        parent.style.display = 'flex';
        parent.style.flexDirection = 'row';

        this.weights = [50, 50];

        this.left = document.createElement('div');
        this.left.style.width = '50%';
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
        this.right.style.width = '50%';
        parent.appendChild(this.right);

        let config: any = { attributes: true, childList: false, subtree: false };
        let observer = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    this.left.style.height = parent.clientHeight + 'px';
                    this.right.style.height = parent.clientHeight + 'px';
                    let width = parent.clientWidth - this.divider.clientWidth;
                    this.left.style.width = (width * this.weights[0] / (this.weights[0] + this.weights[1])) + 'px';
                    this.right.style.width = (width * this.weights[1] / (this.weights[0] + this.weights[1])) + 'px';
                }
            }
        });
        observer.observe(parent, config);
    }

    setWeights(weights: number[]): void {
        this.weights = weights;
        this.left.style.width = weights[0] + '%';
        this.right.style.width = weights[1] + '%';
    }

    leftPanel(): HTMLDivElement {
        return this.left;
    }

    rightPanel(): HTMLDivElement {
        return this.right;
    }

    dragStart(ev: DragEvent) {
        this.currentSum = this.left.clientWidth + this.right.clientWidth;
    }

    dragEnd(ev: DragEvent) {
        var leftWidth: number = this.left.clientWidth + ev.offsetX;
        if (leftWidth < 5) {
            leftWidth = 5;
        }
        var rightWidth: number = this.currentSum - leftWidth;
        this.left.style.width = leftWidth + 'px';
        this.right.style.width = rightWidth + 'px';
        this.weights = [leftWidth, rightWidth];
    }
}

class ThreeVerticalPanels {

    left: HTMLDivElement;
    leftDivider: HTMLDivElement;
    center: HTMLDivElement;
    rightDivider: HTMLDivElement;
    right: HTMLDivElement;

    leftWidth: number;
    centerWidth: number;
    rightWidth: number;

    weights: number[];

    constructor(parent: HTMLDivElement) {
        parent.style.display = 'flex';
        parent.style.flexDirection = 'row';

        this.weights = [33.3, 33.3, 33.3];

        this.left = document.createElement('div');
        this.left.style.width = '33%';
        parent.appendChild(this.left);

        this.leftDivider = document.createElement('div');
        this.leftDivider.classList.add('hdivider');
        this.leftDivider.draggable = true;
        this.leftDivider.addEventListener('dragstart', () => {
            this.dragStart();
        });
        this.leftDivider.addEventListener('dragend', (event) => {
            this.leftDragEnd(event);
        });
        parent.appendChild(this.leftDivider);

        this.center = document.createElement('div');
        this.center.style.width = '33%';
        parent.appendChild(this.center);

        this.rightDivider = document.createElement('div');
        this.rightDivider.classList.add('hdivider');
        this.rightDivider.draggable = true;
        this.rightDivider.addEventListener('dragstart', () => {
            this.dragStart();
        });
        this.rightDivider.addEventListener('dragend', (event) => {
            this.rightDragEnd(event);
        });
        parent.appendChild(this.rightDivider);

        this.right = document.createElement('div');
        this.right.style.width = '33%';
        parent.appendChild(this.right);

        let config: any = { attributes: true, childList: false, subtree: false };
        let observer = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    this.left.style.height = parent.clientHeight + 'px';
                    this.center.style.height = parent.clientHeight + 'px';
                    this.right.style.height = parent.clientHeight + 'px';
                    let width = parent.clientWidth - this.leftDivider.clientWidth - this.rightDivider.clientWidth;
                    this.left.style.width = (width * this.weights[0] / (this.weights[0] + this.weights[1] + this.weights[2])) + 'px';
                    this.center.style.width = (width * this.weights[1] / (this.weights[0] + this.weights[1] + this.weights[2])) + 'px';
                    this.right.style.width = (width * this.weights[3] / (this.weights[0] + this.weights[1] + this.weights[2])) + 'px';
                }
            }
        });
        observer.observe(parent, config);
    }

    setWeights(weights: number[]): void {
        this.weights = weights;
        this.left.style.width = weights[0] + '%';
        this.center.style.width = weights[1] + '%';
        this.right.style.width = weights[2] + '%';
    }

    leftPanel(): HTMLDivElement {
        return this.left;
    }

    centerPanel(): HTMLDivElement {
        return this.center;
    }

    rightPanel(): HTMLDivElement {
        return this.right;
    }

    dragStart() {
        this.leftWidth = this.left.clientWidth;
        this.centerWidth = this.center.clientWidth;
        this.rightWidth = this.right.clientWidth;
    }

    leftDragEnd(ev: DragEvent) {
        let sum = this.leftWidth + this.centerWidth + this.rightWidth;
        this.leftWidth = this.leftWidth + ev.offsetX;
        if (this.leftWidth < 5) {
            this.leftWidth = 5;
        }
        this.centerWidth = sum - this.leftWidth - this.rightWidth;
        this.left.style.width = this.leftWidth + 'px';
        this.center.style.width = this.centerWidth + 'px';
        this.weights = [this.leftWidth, this.centerWidth, this.rightWidth];
    }

    rightDragEnd(ev: DragEvent) {
        let sum = this.leftWidth + this.centerWidth + this.rightWidth;
        this.centerWidth = this.centerWidth + ev.offsetX;
        if (this.centerWidth < 5) {
            this.centerWidth = 5;
        }
        this.rightWidth = sum - this.leftWidth - this.centerWidth;
        this.center.style.width = this.centerWidth + 'px';
        this.right.style.width = this.rightWidth + 'px';
        this.weights = [this.leftWidth, this.centerWidth, this.rightWidth];
    }
}

class HorizontalSplit {

    top: HTMLDivElement;
    divider: HTMLDivElement;
    bottom: HTMLDivElement;
    weights: number[];
    currentSum: number;

    constructor(parent: HTMLDivElement) {
        parent.style.display = 'flex';
        parent.style.flexDirection = 'column';

        this.weights = [50, 50];

        this.top = document.createElement('div');
        this.top.style.height = '50%';
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
        this.bottom.style.height = '50%';
        parent.appendChild(this.bottom);

        let config: any = { attributes: true, childList: false, subtree: false };
        let observer = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    this.top.style.width = parent.clientWidth + 'px';
                    this.bottom.style.width = parent.clientWidth + 'px';
                    let height = parent.clientHeight - this.divider.clientHeight;
                    this.top.style.height = (height * this.weights[0] / (this.weights[0] + this.weights[1])) + 'px';
                    this.bottom.style.height = (height * this.weights[1] / (this.weights[0] + this.weights[1])) + 'px';
                }
            }
        });
        observer.observe(parent, config);
    }

    setWeights(weights: number[]): void {
        this.weights = weights;
        this.top.style.height = weights[0] + '%';
        this.bottom.style.height = weights[1] + '%';
    }

    topPanel(): HTMLDivElement {
        return this.top;
    }

    bottomPanel(): HTMLDivElement {
        return this.bottom;
    }

    dragStart(ev: DragEvent) {
        this.currentSum = this.top.clientHeight + this.bottom.clientHeight;
    }

    dragEnd(ev: DragEvent) {
        var topHeight: number = this.top.clientHeight + ev.offsetY;
        if (topHeight < 5) {
            topHeight = 5;
        }
        var bottomHeight: number = this.currentSum - topHeight;
        this.top.style.height = topHeight + 'px';
        this.bottom.style.height = bottomHeight + 'px';
        this.weights = [topHeight, bottomHeight];
    }
}

class ThreeHorizontalPanels {

    top: HTMLDivElement;
    topDivider: HTMLDivElement;
    center: HTMLDivElement;
    bottomDivider: HTMLDivElement;
    bottom: HTMLDivElement;

    topHeight: number;
    centerHeight: number;
    bottomHeight: number;

    weights: number[];

    constructor(parent: HTMLDivElement) {
        parent.style.display = 'flex';
        parent.style.flexDirection = 'column';

        this.weights = [33.3, 33.3, 33.3];

        this.top = document.createElement('div');
        this.top.style.height = '33%';
        parent.appendChild(this.top);

        this.topDivider = document.createElement('div');
        this.topDivider.classList.add('vdivider');
        this.topDivider.draggable = true;
        this.topDivider.addEventListener('dragstart', () => {
            this.dragStart();
        });
        this.topDivider.addEventListener('dragend', (event: DragEvent) => {
            this.topDragEnd(event);
        });
        parent.appendChild(this.topDivider);

        this.center = document.createElement('div');
        this.center.style.height = '33%';
        parent.appendChild(this.center);

        this.bottomDivider = document.createElement('div');
        this.bottomDivider.classList.add('vdivider');
        this.bottomDivider.draggable = true;
        this.bottomDivider.addEventListener('dragstart', () => {
            this.dragStart();
        });
        this.bottomDivider.addEventListener('dragend', (event: DragEvent) => {
            this.bottomDragEnd(event);
        });
        parent.appendChild(this.bottomDivider);

        this.bottom = document.createElement('div');
        this.bottom.style.height = '33%';
        parent.appendChild(this.bottom);

        let config: any = { attributes: true, childList: false, subtree: false };
        let observer = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    this.top.style.width = parent.clientWidth + 'px';
                    this.center.style.width = parent.clientWidth + 'px';
                    this.bottom.style.width = parent.clientWidth + 'px';
                    let height = parent.clientHeight - this.topDivider.clientHeight - this.bottomDivider.clientHeight;
                    this.top.style.height = (height * this.weights[0] / (this.weights[0] + this.weights[1] + this.weights[2])) + 'px';
                    this.center.style.height = (height * this.weights[1] / (this.weights[0] + this.weights[1] + this.weights[2])) + 'px';
                    this.bottom.style.height = (height * this.weights[3] / (this.weights[0] + this.weights[1] + this.weights[2])) + 'px';
                }
            }
        });
        observer.observe(parent, config);
    }

    setWeights(weights: number[]): void {
        this.weights = weights;
        this.top.style.height = weights[0] + '%';
        this.center.style.height = weights[1] + '%';
        this.bottom.style.height = weights[2] + '%';
    }

    topPanel(): HTMLDivElement {
        return this.top;
    }

    centerPanel(): HTMLDivElement {
        return this.center;
    }

    bottomPanel(): HTMLDivElement {
        return this.bottom;
    }

    dragStart() {
        this.topHeight = this.top.clientHeight;
        this.centerHeight = this.center.clientHeight;
        this.bottomHeight = this.bottom.clientHeight;
    }

    topDragEnd(event: DragEvent) {
        let sum = this.topHeight + this.centerHeight + this.bottomHeight;
        this.topHeight = this.topHeight + event.offsetY;
        if (this.topHeight < 5) {
            this.topHeight = 5;
        }
        this.centerHeight = sum - this.topHeight - this.bottomHeight;
        this.top.style.height = this.topHeight + 'px';
        this.center.style.height = this.centerHeight + 'px';
        this.weights = [this.topHeight, this.centerHeight, this.bottomHeight];
    }


    bottomDragEnd(event: DragEvent) {
        let sum = this.topHeight + this.centerHeight + this.bottomHeight;
        this.centerHeight = this.centerHeight + event.offsetY;
        if (this.centerHeight < 5) {
            this.centerHeight = 5;
        }
        this.bottomHeight = sum - this.topHeight - this.centerHeight;
        this.center.style.height = this.centerHeight + 'px';
        this.bottom.style.height = this.bottomHeight + 'px';
        this.weights = [this.topHeight, this.centerHeight, this.bottomHeight];
    }
}