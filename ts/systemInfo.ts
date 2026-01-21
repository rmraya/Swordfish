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

export class SystemInformation {

    constructor() {
        ipcRenderer.send('get-theme');
        ipcRenderer.send('get-version');
        ipcRenderer.on('set-theme', (event: IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        ipcRenderer.send('get-system-info');
        ipcRenderer.on('set-system-info', (event: IpcRendererEvent, arg: any) => {
            this.setInfo(arg);
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                ipcRenderer.send('close-systemInfo');
            }
        });
        setTimeout(() => {
            ipcRenderer.send('set-height', { window: 'systemInfo', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    setInfo(info: any) {
        (document.getElementById('swordfish') as HTMLTableCellElement).innerText = info.swordfish;
        (document.getElementById('openxliff') as HTMLTableCellElement).innerText = info.openxliff;
        (document.getElementById('xmljava') as HTMLTableCellElement).innerText = info.xmljava;
        (document.getElementById('java') as HTMLTableCellElement).innerText = info.java;
        (document.getElementById('electron') as HTMLTableCellElement).innerText = info.electron;
    }
}
