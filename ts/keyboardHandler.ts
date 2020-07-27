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

class KeyboardHandler {

    static keyListener(event: KeyboardEvent): void {
        if ((event.ctrlKey || event.metaKey) && (event.key === 'x' || event.key === 'X')) {
            var element: HTMLElement = event.target as HTMLElement;
            var type: string = element.tagName;
            if (type === 'INPUT' || type === 'TEXTAREA' || element.contentEditable) {
                window.getSelection().deleteFromDocument();
            }
        }

        if ((event.ctrlKey || event.metaKey) && (event.key === 'a' || event.key === 'A')) {
            var element: HTMLElement = event.target as HTMLElement;
            var type: string = element.tagName;
            if (type === 'INPUT' || type === 'TEXTAREA' || element.contentEditable) {
                window.getSelection().selectAllChildren(element);
            }
        }

        if ((event.ctrlKey || event.metaKey) && (event.key === 'c' || event.key === 'C')) {
            let selected: Selection = window.getSelection();
            navigator.clipboard.writeText(selected.toString());
        }

        if ((event.ctrlKey || event.metaKey) && (event.key === 'v' || event.key === 'V')) {
            var element: HTMLElement = event.target as HTMLElement;
            var type: string = element.tagName;
            if (type === 'INPUT' || type === 'TEXTAREA' || element.contentEditable) {
                let selected: Selection = window.getSelection();
                navigator.clipboard.readText().then(
                    (clipText: string) => {
                        selected.getRangeAt(0).insertNode(document.createTextNode(clipText));
                    }
                );
            }
        }
    }
}