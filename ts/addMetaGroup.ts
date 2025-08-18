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

class AddMetaGroup {

    electron = require('electron');

    segmentData: any;

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
       document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape' || event.code === 'F2') {
                this.electron.ipcRenderer.send('close-add-metaGroup');
            }
        });
        
        (document.getElementById('saveGroup') as HTMLButtonElement).addEventListener('click', () => {
            this.saveGroup();
        });
        setTimeout(() => {
            this.electron.ipcRenderer.send('set-height', { window: 'addMetaGroup', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    saveGroup(): void {
    }
}