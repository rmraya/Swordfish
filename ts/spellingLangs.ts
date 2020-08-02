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
        this.electron.ipcRenderer.on('get-height', () => {
            let body: HTMLBodyElement = document.getElementById('body') as HTMLBodyElement;
            this.electron.ipcRenderer.send('set-spellchecker-height', { width: body.clientWidth, height: 400 });
        });
    }

    setLanguages(languages: any[]): void {
        let langsTable: HTMLTableElement = document.getElementById('langsTable') as HTMLTableElement;
        let length = languages.length;
        for (let i=0 ; i<length ; i++) {
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