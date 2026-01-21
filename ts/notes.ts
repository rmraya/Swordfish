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
import { Tab, TabHolder } from "./tabs.js";
import { Note } from "./note.js";

export class Notes {

    segmentData: FullId;
    tabHolder: TabHolder;
    notes: Note[] = [];

    constructor() {
        this.segmentData = { project: '', file: '', unit: '', segment: '' };
        ipcRenderer.send('get-theme');
        ipcRenderer.on('set-theme', (event: IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        ipcRenderer.on('set-notes', (event: IpcRendererEvent, notes: Note[]) => {
            this.setNotes(notes);
        });
        ipcRenderer.on('note-params', (event: IpcRendererEvent, segment: FullId) => {
            this.segmentData = segment;
        });
        (document.getElementById('addNote') as HTMLAnchorElement).addEventListener('click', () => {
            this.addNote();
        });
        (document.getElementById('editNote') as HTMLButtonElement).addEventListener('click', () => {
            this.editNote();
        });
        (document.getElementById('removeNote') as HTMLAnchorElement).addEventListener('click', () => {
            this.removeNote();
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape' || event.code === 'F2') {
                ipcRenderer.send('close-notes');
            }
        });
        let main: HTMLDivElement = document.getElementById('main') as HTMLDivElement;
        main.classList.add('fill_width');

        this.tabHolder = new TabHolder(main, 'notes');
        window.addEventListener('resize', () => {
            this.resize();
        });

        setTimeout(() => {
            ipcRenderer.send('set-height', { window: 'notes', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);

    }

    resize(): void {
        let noteButtons: HTMLDivElement = document.getElementById('noteButtons') as HTMLDivElement;
        let main: HTMLDivElement = document.getElementById('main') as HTMLDivElement;
        main.style.height = (document.body.clientHeight - noteButtons.clientHeight) + 'px';
    }

    setNotes(notes: Note[]): void {
        let selected: string = this.tabHolder.getSelected();
        this.tabHolder.clear();
        this.notes = notes;
        let length = notes.length;
        for (let i: number = 0; i < length; i++) {
            let tab = new Tab(notes[i].id, 'Note ' + notes[i].id, false, this.tabHolder);
            tab.getContainer().innerText = notes[i].note;
            tab.getContainer().style.padding = '8px';
            tab.getContainer().style.width = 'calc(100% - 16px)';
            this.tabHolder.addTab(tab);
        }
        if (selected && this.tabHolder.has(selected)) {
            this.tabHolder.selectTab(selected);
        }
        setTimeout(() => {
            ipcRenderer.send('set-height', { window: 'notes', width: document.body.clientWidth, height: document.body.clientHeight });
            this.resize();
        }, 200);
    }

    addNote(): void {
        ipcRenderer.send('show-add-note', this.segmentData);
    }

    editNote(): void {
        let selected: string = this.tabHolder.getSelected();
        if (selected) {
            let params: any = this.segmentData;
            params.noteId = selected;
            let tab: Tab | undefined = this.tabHolder.getTab(selected);
            if (tab) {
                let noteText: string = tab.getContainer().innerText;
                ipcRenderer.send('show-edit-note', {segmentId: this.segmentData, noteId: selected, noteText: noteText});
            }
        }
    }

    removeNote(): void {
        let selected: string = this.tabHolder.getSelected();
        if (selected) {
            ipcRenderer.send('remove-note', {segmentId: this.segmentData, noteId: selected});
        }
    }
}
