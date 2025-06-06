/*******************************************************************************
 * Copyright (c) 2007 - 2025 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/

class ChangeCase {

    electron = require('electron');

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.send('get-version');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-change-case');
            }
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.changeCase();
            }
        });
        (document.getElementById('changeCase') as HTMLButtonElement).addEventListener('click', () => { this.changeCase(); });
        (document.getElementById('uppercase') as HTMLInputElement).focus();
        setTimeout(() => {
            this.electron.ipcRenderer.send('set-height', { window: 'changeCase', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    changeCase(): void {
        if ((document.getElementById('sentence') as HTMLInputElement).checked) {
            this.electron.ipcRenderer.send('change-case-to', { case: 'sentence' });
        }
        if ((document.getElementById('lowercase') as HTMLInputElement).checked) {
            this.electron.ipcRenderer.send('change-case-to', { case: 'lowercase' });
        }
        if ((document.getElementById('uppercase') as HTMLInputElement).checked) {
            this.electron.ipcRenderer.send('change-case-to', { case: 'uppercase' });
        }
        if ((document.getElementById('title') as HTMLInputElement).checked) {
            this.electron.ipcRenderer.send('change-case-to', { case: 'title' });
        }
        if ((document.getElementById('toggle') as HTMLInputElement).checked) {
            this.electron.ipcRenderer.send('change-case-to', { case: 'toggle' });
        }
    }
}
