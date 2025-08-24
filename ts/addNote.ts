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

class AddNote {

    electron = require('electron');

    segmentData: FullId = { project: '', file: '', unit: '', segment: '' };
    noteId: string = '';

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        this.electron.ipcRenderer.on('note-params', (event: Electron.IpcRendererEvent, segmentId: FullId) => {
            this.segmentData = segmentId;
        });
        this.electron.ipcRenderer.on('set-note', (event: Electron.IpcRendererEvent, note: string) => {
            (document.getElementById('area') as HTMLTextAreaElement).value = note;
            (document.getElementById('addButton') as HTMLButtonElement).innerText = 'Update Note';
        });
        this.electron.ipcRenderer.on('set-note-id', (event: Electron.IpcRendererEvent, noteId: string) => {
            this.noteId = noteId;
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-add-note');
            }
        });
        (document.getElementById('addButton') as HTMLButtonElement).addEventListener('click', () => {
            this.addNote();
        });
        (document.getElementById('area') as HTMLTextAreaElement).focus();
        setTimeout(() => {
            this.electron.ipcRenderer.send('set-height', { window: 'addNote', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    addNote(): void {
        let noteText: string = (document.getElementById('area') as HTMLTextAreaElement).value;
        if (noteText === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Enter note text', parent: 'addNote' });
            return;
        }
        if (this.noteId !== '') {
            this.electron.ipcRenderer.send('update-note', { segment: this.segmentData, note: noteText, noteId: this.noteId });
        } else {
            this.electron.ipcRenderer.send('add-note', { segment: this.segmentData, note: noteText });
        }
    }
}