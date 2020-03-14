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