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

import { ipcRenderer, clipboard, IpcRendererEvent } from "electron";

export class PromptDialog {

    constructor() {
        ipcRenderer.send('get-theme');
        ipcRenderer.on('set-theme', (event: IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        ipcRenderer.on('set-prompt', (event: IpcRendererEvent, prompt: string) => {
            (document.getElementById('promptInput') as HTMLTextAreaElement).value = prompt;
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                ipcRenderer.send('close-promptDialog');
            }
        });
        document.getElementById('copyButton')?.addEventListener('click', () => {
            const promptInput: HTMLTextAreaElement = document.getElementById('promptInput') as HTMLTextAreaElement;
            clipboard.writeText(promptInput.value);
            ipcRenderer.send('show-notification', 'Prompt copied to clipboard');
        });
        document.getElementById('pasteButton')?.addEventListener('click', () => {
            ipcRenderer.send('paste-response');
        });
        setTimeout(() => {
            ipcRenderer.send('set-height', { window: 'promptDialog', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }
}