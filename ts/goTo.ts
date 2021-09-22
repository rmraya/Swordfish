/*******************************************************************************
 * Copyright (c) 2007-2021 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/

class GoTo {
    
    electron = require('electron');

    segInput: HTMLInputElement;

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
        });
        this.segInput = document.getElementById('segInput') as HTMLInputElement;
        this.segInput.addEventListener('keydown', (event: KeyboardEvent) => {
            this.parseKey(event);
        });
        document.getElementById('goToButton').addEventListener('click', () => {
            this.goToSegment();
        });
        document.getElementById('segInput').focus();

        this.electron.ipcRenderer.send('go-to-height', { width: document.body.clientWidth, height: document.body.clientHeight });
    }

    parseKey(event: KeyboardEvent): void {
        let code: string = event.code;
        if (code === 'Escape') {
            this.electron.ipcRenderer.send('close-go-to');
        }
        if (code === 'Enter' || code === 'NumpadEnter') {
            this.goToSegment();
        }
        if (!(code.startsWith('Digit') || code.startsWith('Numpad') || code === 'Delete' || code === 'Backspace')) {
            event.preventDefault();
            event.stopPropagation();
        }
    }

    goToSegment(): void {
        let value: string = this.segInput.value;
        if (value.length > 0) {
            this.electron.ipcRenderer.send('go-to-segment', { segment: Number.parseInt(value, 10) });
            return;
        }
        this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Enter segment number', parent: 'goTo' });
        document.getElementById('segInput').focus();
    }
}

new GoTo();