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

export class About {

    constructor() {
        ipcRenderer.send('get-theme');
        ipcRenderer.send('get-version');
        ipcRenderer.on('set-theme', (event: IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        ipcRenderer.on('set-version', (event: IpcRendererEvent, arg: any) => {
            (document.getElementById('version') as HTMLTitleElement).innerHTML = arg;
        });
        (document.getElementById('system') as HTMLButtonElement).addEventListener('click', () => {
            ipcRenderer.send('system-info-clicked');
            (document.getElementById('system') as HTMLButtonElement).blur();
        });
        (document.getElementById('licensesButton') as HTMLButtonElement).addEventListener('click', () => {
            ipcRenderer.send('licenses-clicked');
            (document.getElementById('licensesButton') as HTMLButtonElement).blur();
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                ipcRenderer.send('close-about');
            }
        });
        setTimeout(() => {
            ipcRenderer.send('set-height', { window: 'about', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 150);
        (document.getElementById('system') as HTMLButtonElement).blur();
    }

}