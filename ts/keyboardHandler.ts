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
            event.preventDefault();
            let element: HTMLElement = event.target as HTMLElement;
            let type: string = element.tagName;
            if (type === 'INPUT') {
                let input: HTMLInputElement = element as HTMLInputElement;
                let start: number = input.selectionStart;
                let end: number = input.selectionEnd;
                navigator.clipboard.writeText(input.value.substring(start, end));
                input.setRangeText('');
            }
            if (type === 'TEXTAREA') {
                let area: HTMLTextAreaElement = element as HTMLTextAreaElement;
                let start: number = area.selectionStart;
                let end: number = area.selectionEnd;
                navigator.clipboard.writeText(area.value.substring(start, end));
                area.setRangeText('');
            }
        }

        if ((event.ctrlKey || event.metaKey) && (event.key === 'a' || event.key === 'A')) {
            event.preventDefault();
            let element: HTMLElement = event.target as HTMLElement;
            let type: string = element.tagName;
            if (type === 'INPUT' ) {
                let input: HTMLInputElement = element as HTMLInputElement;
                input.setSelectionRange(0, input.value.length);
            }
            if (type === 'TEXTAREA') {
                let area: HTMLTextAreaElement = element as HTMLTextAreaElement;
                area.setSelectionRange(0, area.value.length);
            }
        }

        if ((event.ctrlKey || event.metaKey) && (event.key === 'c' || event.key === 'C')) {
            event.preventDefault();
            navigator.clipboard.writeText(window.getSelection().toString());
        }

        if ((event.ctrlKey || event.metaKey) && (event.key === 'v' || event.key === 'V')) {
            event.preventDefault();
            let element: HTMLElement = event.target as HTMLElement;
            let type: string = element.tagName;
            if (type === 'INPUT' ) {
                navigator.clipboard.readText().then(
                    (clipText: string) => {
                        let input: HTMLInputElement = (element as HTMLInputElement);
                        let currentText: string = input.value;
                        let start: number = input.selectionStart;
                        let newText: string = currentText.substring(0, start) + clipText + currentText.substring(start);
                        input.value = newText;
                    }
                );
            }
            if (type === 'TEXTAREA') {
                navigator.clipboard.readText().then(
                    (clipText: string) => {
                        let input: HTMLTextAreaElement = (element as HTMLTextAreaElement);
                        let currentText: string = input.value;
                        let start: number = input.selectionStart;
                        let newText: string = currentText.substring(0, start) + clipText + currentText.substring(start);
                        input.value = newText;
                    }
                );
            }
        }
    }

    static enterHandler(event: KeyboardEvent, button: HTMLButtonElement): void {
        if (event.code === 'Enter' || event.code === 'NumpadEnter') {
            button.click();
        }
    }

    static escapeHandler(event: KeyboardEvent, button: HTMLButtonElement): void {
        if (event.code === 'Escape' ) {
            button.click();
        }
    }

}