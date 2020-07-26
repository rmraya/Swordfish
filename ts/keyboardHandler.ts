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
        if ((event.ctrlKey || event.metaKey) && event.keyCode === 88) { // Ctrl or Cmd + X
            var element: HTMLElement = event.target as HTMLElement;
            var type: string = element.tagName;
            if (type === 'INPUT') {
                let input: HTMLInputElement = (element as HTMLInputElement);
                let currentText: string = input.value;
                let start: number = input.selectionStart;
                let end: number = input.selectionEnd;
                if (end > start) {
                    navigator.clipboard.writeText(currentText.substring(start, end));
                    input.value = currentText.substring(0, start) + currentText.substring(end);
                    input.setSelectionRange(start,start);
                }
            }
        }
        if ((event.ctrlKey || event.metaKey) && event.keyCode === 65) { // Ctrl or Cmd + A
            var element: HTMLElement = event.target as HTMLElement;
            var type: string = element.tagName;
            if (type === 'INPUT') {
                let input: HTMLInputElement = (element as HTMLInputElement);
                input.setSelectionRange(0, input.value.length);
            }
        }
        if ((event.ctrlKey || event.metaKey) && event.keyCode === 67) { // Ctrl or Cmd + C
            var element: HTMLElement = event.target as HTMLElement;
            var type: string = element.tagName;
            if (type === 'INPUT') {
                let input: HTMLInputElement = (element as HTMLInputElement);
                let start: number = input.selectionStart;
                let end: number = input.selectionEnd;
                if (end > start) {
                    navigator.clipboard.writeText(input.value.substring(start, end));
                }
            }
        }
        if ((event.ctrlKey || event.metaKey) && event.keyCode === 86) { // Ctrl or Cmd + V
            var element: HTMLElement = event.target as HTMLElement;
            var type: string = element.tagName;
            if (type === 'INPUT') {
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
        }
    }
}