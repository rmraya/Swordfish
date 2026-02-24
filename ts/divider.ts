/*******************************************************************************
 * Copyright (c) 2007-2026 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/

const MIN_HORIZONTAL_PANEL_HEIGHT: number = 40;

export class ThreeHorizontalPanels {

    top: HTMLDivElement;
    topDivider: HTMLDivElement;
    center: HTMLDivElement;
    bottomDivider: HTMLDivElement;
    bottom: HTMLDivElement;

    topHeight: number = 0;
    centerHeight: number = 0;
    bottomHeight: number = 0;

    topCollapsed: boolean = false;
    centerCollapsed: boolean = false;
    bottomCollapsed: boolean = false;

    weights: number[];

    expandedTop: number = 0;
    expandedCenter: number = 0;
    expandedBottom: number = 0;

    centerTopStoredHeight: number = 0;
    centerBottomStoredHeight: number = 0;

    constructor(parent: HTMLDivElement) {
        parent.style.display = 'flex';
        parent.style.flexDirection = 'column';

        this.weights = [33.3, 33.3, 33.3];

        this.top = document.createElement('div');
        this.top.style.height = '33%';
        this.top.style.minHeight = '4px';
        this.top.addEventListener('dragover', (event: DragEvent) => {
            event.preventDefault();
        });
        parent.appendChild(this.top);

        this.topDivider = document.createElement('div');
        this.topDivider.classList.add('vdivider');
        this.topDivider.draggable = true;
        this.topDivider.addEventListener('dragstart', (event: DragEvent) => {
            if (this.topCollapsed || this.twoPanelsCollapsed()) {
                event.preventDefault();
                return;
            }
            this.dragStart(event);
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
        this.center.addEventListener('dragover', (event: DragEvent) => {
            event.preventDefault();
        });
        parent.appendChild(this.center);

        this.bottomDivider = document.createElement('div');
        this.bottomDivider.classList.add('vdivider');
        this.bottomDivider.draggable = true;
        this.bottomDivider.addEventListener('dragstart', (event: DragEvent) => {
            if (this.bottomCollapsed || this.twoPanelsCollapsed()) {
                event.preventDefault();
                return;
            }
            this.dragStart(event);
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
        this.bottom.addEventListener('dragover', (event: DragEvent) => {
            event.preventDefault();
        });
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

    isTopCollapsed():boolean {
        return this.topCollapsed;
    }

    isCenterCollapsed():boolean {
        return this.centerCollapsed;
    }

    isBottomCollapsed():boolean {
        return this.bottomCollapsed;
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

    twoPanelsCollapsed(): boolean {
        return (this.topCollapsed && this.centerCollapsed) 
        || (this.topCollapsed && this.bottomCollapsed) 
        || (this.centerCollapsed && this.bottomCollapsed);
    }

    dragStart(event: DragEvent): void {
        document.body.style.cursor = 'ns-resize';
        this.topDivider.classList.add('dragging');
        this.topHeight = this.top.clientHeight;
        this.centerHeight = this.center.clientHeight;
        this.bottomHeight = this.bottom.clientHeight;
    }

    topDrag(event: DragEvent): void {
        event.preventDefault();
    }

    topDragEnd(event: DragEvent): void {
        document.body.style.cursor = 'pointer';
        this.topDivider.classList.remove('dragging');
        let sum = this.topHeight + this.centerHeight + this.bottomHeight;
        this.topHeight = this.topHeight + event.offsetY;
        this.centerHeight = sum - this.topHeight - this.bottomHeight;
        this.top.style.height = this.topHeight + 'px';
        this.center.style.height = this.centerHeight + 'px';
        this.weights = [this.topHeight, this.centerHeight, this.bottomHeight];
    }

    bottomDrag(event: DragEvent): void {
        event.preventDefault();
    }

    bottomDragEnd(event: DragEvent): void {
        document.body.style.cursor = 'pointer';
        this.bottomDivider.classList.remove('dragging');
        let sum = this.topHeight + this.centerHeight + this.bottomHeight;
        this.centerHeight = this.centerHeight + event.offsetY;
        this.bottomHeight = sum - this.topHeight - this.centerHeight;
        this.center.style.height = this.centerHeight + 'px';
        this.bottom.style.height = this.bottomHeight + 'px';
        this.weights = [this.topHeight, this.centerHeight, this.bottomHeight];
    }

    collapseTop(): void {
        if (this.topCollapsed) {
            return;
        }
        if (this.centerCollapsed && this.bottomCollapsed) {
            return;
        }
        const currentHeight: number = this.top.clientHeight;
        if (currentHeight <= MIN_HORIZONTAL_PANEL_HEIGHT) {
            return;
        }
        this.topCollapsed = true;
        this.expandedTop = currentHeight;
        const centerHeight: number = this.center.clientHeight;
        const bottomHeight: number = this.bottom.clientHeight;
        this.top.style.height = MIN_HORIZONTAL_PANEL_HEIGHT + 'px';
        const delta: number = currentHeight - MIN_HORIZONTAL_PANEL_HEIGHT;
        const recipients: Array<{ panel: HTMLDivElement; original: number }> = [];
        if (this.center.dataset.collapsed !== 'true') {
            recipients.push({ panel: this.center, original: centerHeight });
        }
        if (this.bottom.dataset.collapsed !== 'true') {
            recipients.push({ panel: this.bottom, original: bottomHeight });
        }
        if (delta > 0 && recipients.length > 0) {
            const share: number = Math.floor(delta / recipients.length);
            let remaining: number = delta;
            recipients.forEach((recipient, index) => {
                const addition: number = (index === recipients.length - 1) ? remaining : share;
                const newHeight: number = Math.max(MIN_HORIZONTAL_PANEL_HEIGHT, recipient.original + addition);
                recipient.panel.style.height = newHeight + 'px';
                remaining -= addition;
            });
        }
        this.updateWeights();
    }

    expandTop(): void {
        if (!this.topCollapsed) {
            return;
        }
        const totalHeight: number = this.top.clientHeight + this.center.clientHeight + this.bottom.clientHeight;
        this.top.style.height = this.expandedTop + 'px';
        const newCenterHeight: number = totalHeight - this.expandedTop - this.bottom.clientHeight;
        this.center.style.height = Math.max(MIN_HORIZONTAL_PANEL_HEIGHT, newCenterHeight) + 'px';
        this.updateWeights();
        this.topCollapsed = false;
        this.expandedTop = 0;
    }

    collapseCenter(): void {
        if (this.centerCollapsed) {
            return;
        }
        if (this.topCollapsed && this.bottomCollapsed) {
            return;
        }
        const currentHeight: number = this.center.clientHeight;
        if (currentHeight <= MIN_HORIZONTAL_PANEL_HEIGHT) {
            return;
        }
        this.centerCollapsed = true;
        this.expandedCenter = currentHeight;
        this.centerTopStoredHeight = this.top.clientHeight;
        this.centerBottomStoredHeight = this.bottom.clientHeight;
        this.center.style.height = MIN_HORIZONTAL_PANEL_HEIGHT + 'px';
        const delta: number = currentHeight - MIN_HORIZONTAL_PANEL_HEIGHT;
        if (delta > 0) {
            const recipients: Array<{ panel: HTMLDivElement; original: number }> = [];
            if (this.top.dataset.collapsed !== 'true') {
                recipients.push({ panel: this.top, original: this.centerTopStoredHeight });
            }
            if (this.bottom.dataset.collapsed !== 'true') {
                recipients.push({ panel: this.bottom, original: this.centerBottomStoredHeight });
            }
            if (recipients.length > 0) {
                const share: number = Math.floor(delta / recipients.length);
                let remaining: number = delta;
                recipients.forEach((recipient, index) => {
                    const addition: number = (index === recipients.length - 1) ? remaining : share;
                    const newHeight: number = Math.max(MIN_HORIZONTAL_PANEL_HEIGHT, recipient.original + addition);
                    recipient.panel.style.height = newHeight + 'px';
                    remaining -= addition;
                });
            }
        }
        this.updateWeights();
    }

    expandCenter(): void {
        if (!this.centerCollapsed) {
            return;
        }
        if (this.centerTopStoredHeight > 0) {
            this.top.style.height = this.centerTopStoredHeight + 'px';
        }
        if (this.centerBottomStoredHeight > 0) {
            this.bottom.style.height = this.centerBottomStoredHeight + 'px';
        }
        this.center.style.height = this.expandedCenter + 'px';
        this.updateWeights();
        this.centerCollapsed = false;
        this.expandedCenter = 0;
        this.centerTopStoredHeight = 0;
        this.centerBottomStoredHeight = 0;
    }

    collapseBottom(): void {
        if (this.bottomCollapsed) {
            return;
        }
        if (this.topCollapsed && this.centerCollapsed) {
            return;
        }
        const currentHeight: number = this.bottom.clientHeight;
        if (currentHeight <= MIN_HORIZONTAL_PANEL_HEIGHT) {
            return;
        }
        this.bottomCollapsed = true;
        this.expandedBottom = currentHeight;
        const topHeight: number = this.top.clientHeight;
        const centerHeight: number = this.center.clientHeight;
        this.bottom.style.height = MIN_HORIZONTAL_PANEL_HEIGHT + 'px';
        const delta: number = currentHeight - MIN_HORIZONTAL_PANEL_HEIGHT;
        const recipients: Array<{ panel: HTMLDivElement; original: number }> = [];
        if (this.center.dataset.collapsed !== 'true') {
            recipients.push({ panel: this.center, original: centerHeight });
        }
        if (this.top.dataset.collapsed !== 'true') {
            recipients.push({ panel: this.top, original: topHeight });
        }
        if (delta > 0 && recipients.length > 0) {
            const share: number = Math.floor(delta / recipients.length);
            let remaining: number = delta;
            recipients.forEach((recipient, index) => {
                const addition: number = (index === recipients.length - 1) ? remaining : share;
                const newHeight: number = Math.max(MIN_HORIZONTAL_PANEL_HEIGHT, recipient.original + addition);
                recipient.panel.style.height = newHeight + 'px';
                remaining -= addition;
            });
        }
        this.updateWeights();
    }

    expandBottom(): void {
        if (!this.bottomCollapsed) {
            return;
        }
        const totalHeight: number = this.top.clientHeight + this.center.clientHeight + this.bottom.clientHeight;
        this.bottom.style.height = this.expandedBottom + 'px';
        const newCenterHeight: number = totalHeight - this.top.clientHeight - this.expandedBottom;
        this.center.style.height = Math.max(MIN_HORIZONTAL_PANEL_HEIGHT, newCenterHeight) + 'px';
        this.updateWeights();
        this.bottomCollapsed = false;
        this.expandedBottom = 0;
    }

    updateWeights(): void {
        this.weights = [this.top.clientHeight, this.center.clientHeight, this.bottom.clientHeight];
    }
}

export class ThreeVerticalPanels {
    left: HTMLDivElement;
    leftDivider: HTMLDivElement;
    center: HTMLDivElement;
    rightDivider: HTMLDivElement;
    right: HTMLDivElement;

    leftWidth: number = 0;
    centerWidth: number = 0;
    rightWidth: number = 0;

    expandedLeft: number = 0;
    expandedRight: number = 0;

    weights: number[];

    constructor(parent: HTMLDivElement) {
        parent.style.display = 'flex';
        parent.style.flexDirection = 'row';

        this.weights = [33.3, 33.3, 33.3];

        this.left = document.createElement('div');
        this.left.style.width = '33%';
        this.left.style.minWidth = '40px';
        this.left.addEventListener('dragover', (event: DragEvent) => {
            event.preventDefault();
        });
        parent.appendChild(this.left);

        this.leftDivider = document.createElement('div');
        this.leftDivider.classList.add('hdivider');
        this.leftDivider.draggable = true;
        this.leftDivider.addEventListener('dragstart', (event: DragEvent) => {
            this.dragStart(event);
        });
        this.leftDivider.addEventListener('drag', (event: DragEvent) => {
            this.leftDrag(event);
        })
        this.leftDivider.addEventListener('dragend', (event: DragEvent) => {
            this.leftDragEnd(event);
        });
        parent.appendChild(this.leftDivider);

        this.center = document.createElement('div');
        this.center.style.width = '33%';
        this.center.style.minWidth = '4px';
        this.center.addEventListener('dragover', (event: DragEvent) => {
            event.preventDefault();
        });
        parent.appendChild(this.center);

        this.rightDivider = document.createElement('div');
        this.rightDivider.classList.add('hdivider');
        this.rightDivider.draggable = true;
        this.rightDivider.addEventListener('dragstart', (event: DragEvent) => {
            this.dragStart(event);
        });
        this.rightDivider.addEventListener('drag', (event: DragEvent) => {
            this.rightDrag(event);
        });
        this.rightDivider.addEventListener('dragend', (event: DragEvent) => {
            this.rightDragEnd(event);
        });
        parent.appendChild(this.rightDivider);

        this.right = document.createElement('div');
        this.right.style.width = '33%';
        this.right.style.minWidth = '40px';
        this.right.addEventListener('dragover', (event: DragEvent) => {
            event.preventDefault();
        });
        parent.appendChild(this.right);

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
        this.left.style.height = parent.clientHeight + 'px';
        this.center.style.height = parent.clientHeight + 'px';
        this.right.style.height = parent.clientHeight + 'px';
        let width = parent.clientWidth - this.leftDivider.clientWidth - this.rightDivider.clientWidth;
        let left: number = Math.round(width * this.weights[0] / (this.weights[0] + this.weights[1] + this.weights[2]));
        let center: number = Math.round(width * this.weights[1] / (this.weights[0] + this.weights[1] + this.weights[2]));
        let right: number = width - left - center;
        this.left.style.width = left + 'px';
        this.center.style.width = center + 'px';
        this.right.style.width = right + 'px';
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

    dragStart(event: DragEvent): void {
        // change cursor shape to resizing
        document.body.style.cursor = 'ew-resize';
        (event.target as HTMLDivElement).classList.add('dragging');
        this.leftWidth = this.left.clientWidth;
        this.centerWidth = this.center.clientWidth;
        this.rightWidth = this.right.clientWidth;
    }

    leftDrag(event: DragEvent): void {
        event.preventDefault();
    }

    leftDragEnd(event: DragEvent): void {
        document.body.style.cursor = 'pointer';
        this.leftDivider.classList.remove('dragging');
        let sum = this.leftWidth + this.centerWidth + this.rightWidth;
        this.leftWidth = this.leftWidth + event.offsetX;
        this.centerWidth = sum - this.leftWidth - this.rightWidth;
        this.left.style.width = this.leftWidth + 'px';
        this.center.style.width = this.centerWidth + 'px';
        this.weights = [this.leftWidth, this.centerWidth, this.rightWidth];
    }

    rightDrag(event: DragEvent): void {
        event.preventDefault();
    }

    rightDragEnd(event: DragEvent): void {
        document.body.style.cursor = 'pointer';
        this.rightDivider.classList.remove('dragging');
        let sum = this.leftWidth + this.centerWidth + this.rightWidth;
        this.centerWidth = this.centerWidth + event.offsetX;
        this.rightWidth = sum - this.leftWidth - this.centerWidth;
        this.center.style.width = this.centerWidth + 'px';
        this.right.style.width = this.rightWidth + 'px';
        this.weights = [this.leftWidth, this.centerWidth, this.rightWidth];
    }

    expandLeft() {
        this.center.style.width = (this.center.clientWidth - this.expandedLeft + 40) + 'px';
        this.left.style.width = this.expandedLeft + 'px';
        this.weights = [this.left.clientWidth, this.center.clientWidth, this.right.clientWidth];
    }

    collapseLeft() {
        this.expandedLeft = this.left.clientWidth;
        this.center.style.width = (this.center.clientWidth + this.expandedLeft - 40) + 'px';
        this.left.style.width = '40px';
        this.weights = [this.left.clientWidth, this.center.clientWidth, this.right.clientWidth];
    }

    setExpandedLeft(width: number) {
        this.expandedLeft = width;
    }

    expandRight() {
        this.center.style.width = (this.center.clientWidth - this.expandedRight + 40) + 'px';
        this.right.style.width = this.expandedRight + 'px';
        this.weights = [this.left.clientWidth, this.center.clientWidth, this.right.clientWidth];
    }

    collapseRight() {
        this.expandedRight = this.right.clientWidth;
        this.center.style.width = (this.center.clientWidth + this.right.clientWidth - 40) + 'px';
        this.right.style.width = '40px';
        this.weights = [this.left.clientWidth, this.center.clientWidth, this.right.clientWidth];
    }

    setExpandedRight(width: number) {
        this.expandedRight = width;
    }

}