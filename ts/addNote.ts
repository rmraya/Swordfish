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

class AddNote {

    electron = require('electron');

    segmentData: any;

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
        });
        this.electron.ipcRenderer.on('note-params', (event: Electron.IpcRendererEvent, arg: any) => {
            this.segmentData = arg;
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => { KeyboardHandler.keyListener(event); });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-add-note');
            }
        });
        document.getElementById('addButton').addEventListener('click', () => {
            this.addNote();
        });
        (document.getElementById('area') as HTMLTextAreaElement).focus();
        this.electron.ipcRenderer.send('add-note-height', { width: document.body.clientWidth, height: document.body.clientHeight });
    }

    addNote(): void {
        let noteText: string = (document.getElementById('area') as HTMLTextAreaElement).value;
        if (noteText === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Enter note text', parent: 'addNote' });
            return;
        }
        this.segmentData.noteText = noteText;
        this.electron.ipcRenderer.send('add-note', this.segmentData);
    }
}

new AddNote();