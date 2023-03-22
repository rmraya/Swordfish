/*******************************************************************************
 * Copyright (c) 2023 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/

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
}