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
import { FullId } from "./segmentId.js";

export class AddNote {

    segmentData: FullId = { project: '', file: '', unit: '', segment: '' };
    noteId: string = '';

    constructor() {
        ipcRenderer.send('get-theme');
        ipcRenderer.on('set-theme', (event: IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        ipcRenderer.on('note-params', (event: IpcRendererEvent, segmentId: FullId) => {
            this.segmentData = segmentId;
        });
        ipcRenderer.on('set-note', (event: IpcRendererEvent, note: string) => {
            (document.getElementById('area') as HTMLTextAreaElement).value = note;
            (document.getElementById('addButton') as HTMLButtonElement).innerText = 'Update Note';
        });
        ipcRenderer.on('set-note-id', (event: IpcRendererEvent, noteId: string) => {
            this.noteId = noteId;
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                ipcRenderer.send('close-add-note');
            }
        });
        (document.getElementById('addButton') as HTMLButtonElement).addEventListener('click', () => {
            this.addNote();
        });
        (document.getElementById('area') as HTMLTextAreaElement).focus();
        setTimeout(() => {
            ipcRenderer.send('set-height', { window: 'addNote', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    addNote(): void {
        let noteText: string = (document.getElementById('area') as HTMLTextAreaElement).value;
        if (noteText === '') {
            ipcRenderer.send('show-message', { type: 'warning', message: 'Enter note text', parent: 'addNote' });
            return;
        }
        if (this.noteId !== '') {
            ipcRenderer.send('update-note', { segment: this.segmentData, note: noteText, noteId: this.noteId });
        } else {
            ipcRenderer.send('add-note', { segment: this.segmentData, note: noteText });
        }
    }
}