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

import { ipcRenderer, IpcRendererEvent } from "electron";

export class Tags {

    tagsList: number[] = [];
    tagInput: HTMLInputElement;

    constructor() {
        ipcRenderer.send('get-theme');
        ipcRenderer.on('set-theme', (event: IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        this.tagInput = document.getElementById('tagInput') as HTMLInputElement;
        this.tagInput.addEventListener('keydown', (event: KeyboardEvent) => {
            this.parseKey(event);
        });
        this.tagInput.focus();
        setTimeout(() => {
            ipcRenderer.send('set-height', { window: 'tags', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    parseKey(event: KeyboardEvent): void {
        let code: string = event.code;
        if (code === 'Escape') {
            ipcRenderer.send('close-tags');
        }
        if (code === 'Enter' || code === 'NumpadEnter') {
            let value: string = this.tagInput.value;
            if (value.length > 0) {
                ipcRenderer.send('forward-tag', { tag: Number.parseInt(value, 10) });
                this.tagInput.value = '';
            }
        }
        if (!(code.startsWith('Digit') || code.startsWith('Numpad') || code === 'Delete' || code === 'Backspace')) {
            event.preventDefault();
            event.stopPropagation();
        }
    }
}
