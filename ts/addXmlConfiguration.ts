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

export class AddXmlFilterConfiguration {

    constructor() {
        ipcRenderer.send('get-theme');
        ipcRenderer.on('set-theme', (event: IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                ipcRenderer.send('close-addXmlConfiguration');
            }
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.addConfiguration();
            }
        });
        (document.getElementById('add') as HTMLButtonElement).addEventListener('click', () => { this.addConfiguration(); });
        (document.getElementById('rootName') as HTMLInputElement).focus();
        setTimeout(() => {
            ipcRenderer.send('set-height', { window: 'addXmlConfiguration', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    addConfiguration(): void {
        let rootName: string = (document.getElementById('rootName') as HTMLInputElement).value;
        if (rootName === '') {
            ipcRenderer.send('show-message', { type: 'warning', message: 'Enter root element name', parent: 'addConfiguration' });
            return;
        }
        ipcRenderer.send('add-xmlConfigurationFile', { root: rootName });
    }
}

