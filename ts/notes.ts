/*****************************************************************************
Copyright (c) 2007-2021 - Maxprograms,  http://www.maxprograms.com/

Permission is hereby granted, free of charge, to any person obtaining a copy of 
this software and associated documentation files (the "Software"), to compile, 
modify and use the Software in its executable form without restrictions.

Redistribution of this Software or parts of it in any form (source code or 
executable binaries) requires prior written permission from Maxprograms.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE 
SOFTWARE.
*****************************************************************************/

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