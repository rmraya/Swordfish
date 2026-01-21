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

export class GettingStarted {

    constructor() {
        ipcRenderer.send('get-theme');
        ipcRenderer.on('set-theme', (event: IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                ipcRenderer.send('close-getting-started');
            }
        });
        (document.getElementById('supportGroup') as HTMLButtonElement).addEventListener('click', () => {
            ipcRenderer.send('show-support');
        });
        (document.getElementById('userGuide') as HTMLButtonElement).addEventListener('click', () => {
            ipcRenderer.send('show-help');
        });

        let showWindow: HTMLInputElement = document.getElementById('showWindow') as HTMLInputElement;
        showWindow.addEventListener('click', () => {
            ipcRenderer.send('show-getting-started', { showGuide: showWindow.checked });
        });
        ipcRenderer.send('get-show guide');
        ipcRenderer.on('set-show guide', (event: IpcRendererEvent, arg: any) => {
            showWindow.checked = arg.showGuide;
        });
        (document.getElementById('container') as HTMLDivElement).focus();
        setTimeout(() => {
            ipcRenderer.send('set-height', { window: 'gettingStarted', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }
}
