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

class ElementConfig {

    electron = require('electron');
    elementConfig: any;

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.send('get-version');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-elementConfig');
            }
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.saveElement();
            }
        });
        document.getElementById('save').addEventListener('click', () => { this.saveElement(); });
        this.electron.ipcRenderer.send('get-elementConfig');
        this.electron.ipcRenderer.on('set-elementConfig', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setValues(arg);
        })
        this.electron.ipcRenderer.send('elementConfig-height', { width: document.body.clientWidth, height: document.body.clientHeight });
    }

    setValues(arg: any) {
        this.elementConfig = arg;
        (document.getElementById('name') as HTMLInputElement).value = arg.name;
        (document.getElementById('type') as HTMLSelectElement).value = arg.type;
        (document.getElementById('inline') as HTMLSelectElement).value = arg.inline;
        (document.getElementById('attributes') as HTMLInputElement).value = arg.attributes;
        (document.getElementById('keep') as HTMLInputElement).checked = arg.keepSpace === 'yes';
        document.getElementById('type').addEventListener('change', (event) => {
            let value: string = (event.target as HTMLInputElement).value;
            let inline: HTMLSelectElement = document.getElementById('inline') as HTMLSelectElement;
            inline.disabled = value !== 'inline';
            if (value != 'inline') {
                inline.value = '';
            }
        });
        if (arg.type !== 'inline') {
            (document.getElementById('inline') as HTMLSelectElement).disabled = true;
        }
        (document.getElementById('table') as HTMLTableElement).focus();
    }

    saveElement(): void {
        let name: string = (document.getElementById('name') as HTMLInputElement).value;
        if (name === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Enter element name', parent: 'elementConfig' });
            return;
        }
        this.elementConfig.name = name;
        this.elementConfig.type = (document.getElementById('type') as HTMLSelectElement).value;
        this.elementConfig.inline = (document.getElementById('inline') as HTMLSelectElement).value;
        this.elementConfig.attributes = (document.getElementById('attributes') as HTMLInputElement).value;
        this.elementConfig.keepSpace = (document.getElementById('keep') as HTMLInputElement).checked ? 'yes': '';        
        if (this.elementConfig.type === 'inline' && this.elementConfig.inline === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select inline type', parent: 'elementConfig' });
            return;
        }
        this.electron.ipcRenderer.send('save-elementConfig', this.elementConfig);
    }
}

new ElementConfig();