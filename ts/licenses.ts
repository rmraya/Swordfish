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

export class Licenses {

    constructor() {
        ipcRenderer.send('get-theme');
        ipcRenderer.on('set-theme', (event: IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        (document.getElementById('Swordfish') as HTMLAnchorElement).addEventListener('click', () => {
            this.openLicense('Swordfish');
        });
        (document.getElementById('electron') as HTMLAnchorElement).addEventListener('click', () => {
            this.openLicense('electron');
        });
        (document.getElementById('XMLJava') as HTMLAnchorElement).addEventListener('click', () => {
            this.openLicense('XMLJava');
        });
        (document.getElementById('Java') as HTMLAnchorElement).addEventListener('click', () => {
            this.openLicense('Java');
        });
        (document.getElementById('OpenXLIFF') as HTMLAnchorElement).addEventListener('click', () => {
            this.openLicense('OpenXLIFF');
        });
        (document.getElementById('BCP47J') as HTMLAnchorElement).addEventListener('click', () => {
            this.openLicense('BCP47J');
        });
        (document.getElementById('MapDB') as HTMLAnchorElement).addEventListener('click', () => {
            this.openLicense('MapDB');
        });
        (document.getElementById('jsoup') as HTMLAnchorElement).addEventListener('click', () => {
            this.openLicense('jsoup');
        });
        (document.getElementById('MTEngines') as HTMLAnchorElement).addEventListener('click', () => {
            this.openLicense('MTEngines');
        });
        (document.getElementById('TypesBCP47') as HTMLAnchorElement).addEventListener('click', () => {
            this.openLicense('TypesBCP47');
        });
        (document.getElementById('TypesXML') as HTMLAnchorElement).addEventListener('click', () => {
            this.openLicense('TypesXML');
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                ipcRenderer.send('close-licenses');
            }
        });
        setTimeout(() => {
            ipcRenderer.send('set-height', { window: 'licenses', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    openLicense(type: string): void {
        ipcRenderer.send('open-license', type);
    }
}
