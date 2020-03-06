var currentSum: number;

function hDragStart(ev: DragEvent, leftId: string, rightId: string) {
    var leftPanel: HTMLElement = document.getElementById(leftId);
    var rightPanel: HTMLElement = document.getElementById(rightId);

    currentSum = leftPanel.clientWidth + rightPanel.clientWidth;
}

function hDragEnd(ev: DragEvent, leftId: string, rightId: string) {
    var leftPanel: HTMLElement = document.getElementById(leftId);
    var rightPanel: HTMLElement = document.getElementById(rightId);

    var left: number = leftPanel.clientWidth + ev.offsetX;
    if (left < 20) {
        left = 20;
    }
    left = Math.round(left * 100 / currentSum);

    var right: number = 100 - left;
    leftPanel.style.width = left + 'vw';
    rightPanel.style.width = right + 'vw';
}

function vDragStart(ev: DragEvent, dividerId: string, topId: string, bottomId: string) {
    var topPanel: HTMLElement = document.getElementById(topId);
    var divider: HTMLElement = document.getElementById(dividerId);
    var bottomPanel: HTMLElement = document.getElementById(bottomId);

    currentSum = topPanel.clientHeight + divider.clientHeight + bottomPanel.clientHeight;
}

function vDragEnd(ev: DragEvent, dividerId: string, topId: string, bottomId: string, topContainer: string, bottomContainer: string) {
    var topPanel: HTMLElement = document.getElementById(topId);
    var divider: HTMLElement = document.getElementById(dividerId);
    var bottomPanel: HTMLElement = document.getElementById(bottomId);

    var top: number = topPanel.clientHeight + ev.offsetY;
    if (top < 24) {
        top = 24;
    }
    if (top > currentSum - 26) {
        top = currentSum - 26;
    }
    var bottom: number = currentSum - top - divider.clientHeight;
    topPanel.style.height = top + 'px';
    bottomPanel.style.height = bottom + 'px';

    var tc = document.getElementById(topContainer);
    tc.style.height = (top - 25) + 'px';

    var bc = document.getElementById(bottomContainer);
    bc.style.height = (bottom - 25) + 'px';
}