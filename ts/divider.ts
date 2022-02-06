/*******************************************************************************
 * Copyright (c) 2007-2022 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/

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
        this.left.style.minWidth = '4px';
        parent.appendChild(this.left);

        this.divider = document.createElement('div');
        this.divider.classList.add('hdivider');
        this.divider.draggable = true;
        this.divider.addEventListener('dragstart', (event: DragEvent) => {
            this.dragStart(event);
        });
        this.divider.addEventListener('drag', (event: DragEvent) => {
            this.drag(event);
        })
        this.divider.addEventListener('dragend', (event: DragEvent) => {
            this.dragEnd(event);
        });
        parent.appendChild(this.divider);

        this.right = document.createElement('div');
        this.right.style.width = '50%';
        this.right.style.minWidth = '4px';
        parent.appendChild(this.right);

        let config: any = { attributes: true, childList: false, subtree: false };
        let observer = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    this.resize(parent)
                }
            }
        });
        observer.observe(parent, config);
        setTimeout(() => {
            this.resize(parent);
        });
    }

    resize(parent: HTMLDivElement): void {
        this.left.style.height = parent.clientHeight + 'px';
        this.right.style.height = parent.clientHeight + 'px';
        let width = parent.clientWidth - this.divider.clientWidth;
        let leftWidth: number = Math.round(width * this.weights[0] / (this.weights[0] + this.weights[1]));
        let rightWidth = width - leftWidth;
        this.left.style.width = leftWidth + 'px';
        this.right.style.width = rightWidth + 'px';
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

    dragStart(ev: DragEvent): void {
        this.currentSum = this.left.clientWidth + this.right.clientWidth;
    }

    drag(ev: DragEvent): void {
        if (ev.clientX === 0 && ev.clientY === 0) {
            return;
        }
        var leftWidth: number = this.left.clientWidth + ev.offsetX;
        var rightWidth: number = this.currentSum - leftWidth;
        this.left.style.width = leftWidth + 'px';
        this.right.style.width = rightWidth + 'px';
        this.weights = [leftWidth, rightWidth];
    }

    dragEnd(ev: DragEvent): void {
        var leftWidth: number = this.left.clientWidth + ev.offsetX;
        var rightWidth: number = this.currentSum - leftWidth;
        this.left.style.width = leftWidth + 'px';
        this.right.style.width = rightWidth + 'px';
        this.weights = [leftWidth, rightWidth];
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
        this.top.style.minHeight = '4px';
        parent.appendChild(this.top);

        this.topDivider = document.createElement('div');
        this.topDivider.classList.add('vdivider');
        this.topDivider.draggable = true;
        this.topDivider.addEventListener('dragstart', () => {
            this.dragStart();
        });
        this.topDivider.addEventListener('drag', (event: DragEvent) => {
            this.topDrag(event);
        })
        this.topDivider.addEventListener('dragend', (event: DragEvent) => {
            this.topDragEnd(event);
        });
        parent.appendChild(this.topDivider);

        this.center = document.createElement('div');
        this.center.style.height = '33%';
        this.center.style.minHeight = '4px';
        parent.appendChild(this.center);

        this.bottomDivider = document.createElement('div');
        this.bottomDivider.classList.add('vdivider');
        this.bottomDivider.draggable = true;
        this.bottomDivider.addEventListener('dragstart', () => {
            this.dragStart();
        });
        this.bottomDivider.addEventListener('drag', (event: DragEvent) => {
            this.bottomDrag(event);
        });
        this.bottomDivider.addEventListener('dragend', (event: DragEvent) => {
            this.bottomDragEnd(event);
        });
        parent.appendChild(this.bottomDivider);

        this.bottom = document.createElement('div');
        this.bottom.style.height = '33%';
        this.bottom.style.minHeight = '4px';
        parent.appendChild(this.bottom);

        let config: any = { attributes: true, childList: false, subtree: false };
        let observer = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    setTimeout(() => {
                        this.resize(parent);
                    });
                }
            }
        });
        observer.observe(parent, config);
        setTimeout(() => {
            this.resize(parent);
        });
    }

    resize(parent: HTMLDivElement): void {
        this.top.style.width = parent.clientWidth + 'px';
        this.center.style.width = parent.clientWidth + 'px';
        this.bottom.style.width = parent.clientWidth + 'px';
        let height = parent.clientHeight - this.topDivider.clientHeight - this.bottomDivider.clientHeight;
        let top: number = Math.round(height * this.weights[0] / (this.weights[0] + this.weights[1] + this.weights[2]));
        let center: number = Math.round(height * this.weights[1] / (this.weights[0] + this.weights[1] + this.weights[2]));
        let bottom: number = height - top - center;
        this.top.style.height = top + 'px';
        this.center.style.height = center + 'px';
        this.bottom.style.height = bottom + 'px';
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

    dragStart(): void {
        this.topHeight = this.top.clientHeight;
        this.centerHeight = this.center.clientHeight;
        this.bottomHeight = this.bottom.clientHeight;
    }

    topDrag(event: DragEvent): void {
        if (event.clientX === 0 && event.clientY === 0) {
            return;
        }
        let sum = this.topHeight + this.centerHeight + this.bottomHeight;
        this.topHeight = this.topHeight + event.offsetY;
        this.centerHeight = sum - this.topHeight - this.bottomHeight;
        this.top.style.height = this.topHeight + 'px';
        this.center.style.height = this.centerHeight + 'px';
        this.weights = [this.topHeight, this.centerHeight, this.bottomHeight];
    }

    topDragEnd(event: DragEvent): void {
        let sum = this.topHeight + this.centerHeight + this.bottomHeight;
        this.topHeight = this.topHeight + event.offsetY;
        this.centerHeight = sum - this.topHeight - this.bottomHeight;
        this.top.style.height = this.topHeight + 'px';
        this.center.style.height = this.centerHeight + 'px';
        this.weights = [this.topHeight, this.centerHeight, this.bottomHeight];
    }

    bottomDrag(event: DragEvent): void {
        if (event.clientX === 0 && event.clientY === 0) {
            return;
        }
        let sum = this.topHeight + this.centerHeight + this.bottomHeight;
        this.centerHeight = this.centerHeight + event.offsetY;
        this.bottomHeight = sum - this.topHeight - this.centerHeight;
        this.center.style.height = this.centerHeight + 'px';
        this.bottom.style.height = this.bottomHeight + 'px';
        this.weights = [this.topHeight, this.centerHeight, this.bottomHeight];

    }

    bottomDragEnd(event: DragEvent): void {
        let sum = this.topHeight + this.centerHeight + this.bottomHeight;
        this.centerHeight = this.centerHeight + event.offsetY;
        this.bottomHeight = sum - this.topHeight - this.centerHeight;
        this.center.style.height = this.centerHeight + 'px';
        this.bottom.style.height = this.bottomHeight + 'px';
        this.weights = [this.topHeight, this.centerHeight, this.bottomHeight];
    }
}