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

export class ElementConfig {

    elementConfig: any;

    constructor() {
        ipcRenderer.send('get-theme');
        ipcRenderer.send('get-version');
        ipcRenderer.on('set-theme', (event: IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                ipcRenderer.send('close-elementConfig');
            }
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.saveElement();
            }
        });
        (document.getElementById('save') as HTMLButtonElement).addEventListener('click', () => { this.saveElement(); });
        ipcRenderer.send('get-elementConfig');
        ipcRenderer.on('set-elementConfig', (event: IpcRendererEvent, arg: any) => {
            this.setValues(arg);
        })
        setTimeout(() => {
            ipcRenderer.send('set-height', { window: 'configElement', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    setValues(arg: any) {
        this.elementConfig = arg;
        (document.getElementById('name') as HTMLInputElement).value = arg.name;
        (document.getElementById('type') as HTMLSelectElement).value = arg.type;
        (document.getElementById('inline') as HTMLSelectElement).value = arg.inline;
        (document.getElementById('attributes') as HTMLInputElement).value = arg.attributes;
        (document.getElementById('keep') as HTMLInputElement).checked = arg.keepSpace === 'yes';
        (document.getElementById('type') as HTMLSelectElement).addEventListener('change', (event) => {
            let value: string = (event.target as HTMLSelectElement).value;
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
            ipcRenderer.send('show-message', { type: 'warning', message: 'Enter element name', parent: 'elementConfig' });
            return;
        }
        this.elementConfig.name = name;
        this.elementConfig.type = (document.getElementById('type') as HTMLSelectElement).value;
        this.elementConfig.inline = (document.getElementById('inline') as HTMLSelectElement).value;
        this.elementConfig.attributes = (document.getElementById('attributes') as HTMLInputElement).value;
        this.elementConfig.keepSpace = (document.getElementById('keep') as HTMLInputElement).checked ? 'yes': '';        
        if (this.elementConfig.type === 'inline' && this.elementConfig.inline === '') {
            ipcRenderer.send('show-message', { type: 'warning', message: 'Select inline type', parent: 'elementConfig' });
            return;
        }
        ipcRenderer.send('save-elementConfig', this.elementConfig);
    }
}
