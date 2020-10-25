/*****************************************************************************
Copyright (c) 2007-2020 - Maxprograms,  http://www.maxprograms.com/

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

class SpellcheckerLanguages {

    electron = require('electron');

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
        });
        this.electron.ipcRenderer.send('get-spellchecker-langs');
        this.electron.ipcRenderer.on('set-spellchecker-langs', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setLanguages(arg.languages);
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-spellingLangs');
            }
        });
        let body: HTMLBodyElement = document.getElementById('body') as HTMLBodyElement;
        this.electron.ipcRenderer.send('set-spellchecker-height', { width: body.clientWidth, height: 400 });
    }

    setLanguages(languages: any[]): void {
        let langsTable: HTMLTableElement = document.getElementById('langsTable') as HTMLTableElement;
        let length = languages.length;
        for (let i = 0; i < length; i++) {
            let lang: string[] = languages[i];
            let tr: HTMLTableRowElement = document.createElement('tr');
            langsTable.appendChild(tr);

            let td: HTMLTableCellElement = document.createElement('td');
            td.classList.add('center');
            td.innerText = lang[0];
            tr.appendChild(td);

            let desc: HTMLTableCellElement = document.createElement('td');
            desc.classList.add('noWrap');
            desc.innerText = lang[1];
            tr.appendChild(desc);
        }
    }
}

new SpellcheckerLanguages();