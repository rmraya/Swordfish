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

class PromptDialog {

    electron = require('electron');

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        this.electron.ipcRenderer.on('set-prompt', (event: Electron.IpcRendererEvent, prompt: string) => {
            (document.getElementById('promptInput') as HTMLTextAreaElement).value = prompt;
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-promptDialog');
            }
        });
        document.getElementById('copyButton')?.addEventListener('click', () => {
            const promptInput: HTMLTextAreaElement = document.getElementById('promptInput') as HTMLTextAreaElement;
            this.electron.clipboard.writeText(promptInput.value);
            this.electron.ipcRenderer.send('show-notification', 'Prompt copied to clipboard');
        });
        document.getElementById('pasteButton')?.addEventListener('click', () => {
            this.electron.ipcRenderer.send('paste-response');
        });
        setTimeout(() => {
            this.electron.ipcRenderer.send('set-height', { window: 'promptDialog', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }
}