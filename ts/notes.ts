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

class Notes {

    electron = require('electron');

    segmentData: any;
    tabHolder: TabHolder;

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
        });
        this.electron.ipcRenderer.send('get-initial-notes');
        this.electron.ipcRenderer.on('set-notes', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setNotes(arg.notes);
        });
        this.electron.ipcRenderer.on('note-params', (event: Electron.IpcRendererEvent, arg: any) => {
            this.segmentData = arg;
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => { KeyboardHandler.keyListener(event); });
        document.getElementById('addNote').addEventListener('click', () => {
            this.addNote();
        });
        document.getElementById('removeNote').addEventListener('click', () => {
            this.removeNote();
        });
        let tabContainer: HTMLDivElement = document.getElementById('main') as HTMLDivElement;
        tabContainer.classList.add('fill_width');

        this.tabHolder = new TabHolder(tabContainer, 'notes');
    }

    setNotes(notes: any[]): void {
        this.tabHolder.clear();
        let length = notes.length;
        for (let i: number = 0; i < length; i++) {
            let tab = new Tab(notes[i].id, 'Note ' + notes[i].id, false);
            tab.getContainer().style.padding = '8px';
            tab.getContainer().innerText = notes[i].note;
            this.tabHolder.addTab(tab);
        }
    }

    addNote(): void {
        this.electron.ipcRenderer.send('show-add-note', this.segmentData);
    }

    removeNote(): void {
        let selected: string = this.tabHolder.getSelected();
        if (selected) {
            let params: any = this.segmentData;
            params.noteId = selected;
            this.electron.ipcRenderer.send('remove-note', params);
        }
    }
}

new Notes();