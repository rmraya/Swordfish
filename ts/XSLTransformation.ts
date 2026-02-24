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

export class XSLTransformation {
    constructor() {
        ipcRenderer.send('get-theme');
        ipcRenderer.send('get-version');
        ipcRenderer.on('set-theme', (event: IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                ipcRenderer.send('close-XSLTransformation');
            }
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.xslTransform();
            }
        });
        document.getElementById('browseXML')?.addEventListener('click', () => {
            ipcRenderer.send('browse-xsl-source');
        });
        ipcRenderer.on('set-xsl-source', (event: IpcRendererEvent, arg: string) => {
            (document.getElementById('xmlFile') as HTMLInputElement).value = arg;
        });
        document.getElementById('browseXSL')?.addEventListener('click', () => {
            ipcRenderer.send('browse-xsl');
        });
        ipcRenderer.on('set-xsl', (event: IpcRendererEvent, arg: string) => {
            (document.getElementById('xslFile') as HTMLInputElement).value = arg;
        });
        document.getElementById('browseOutput')?.addEventListener('click', () => {
            ipcRenderer.send('browse-output');
        });
        ipcRenderer.on('set-output', (event: IpcRendererEvent, arg: string) => {
            (document.getElementById('outputFile') as HTMLInputElement).value = arg;
        });
        (document.getElementById('transform') as HTMLButtonElement).addEventListener('click', () => { this.xslTransform(); });
        setTimeout(() => {
            ipcRenderer.send('set-height', { window: 'XSLTransformation', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    xslTransform(): void {
        const xmlFile = (document.getElementById('xmlFile') as HTMLInputElement).value;
        if (xmlFile === '') {
            ipcRenderer.send('show-message', { title: 'Error', message: 'Select XML file' });
            return;
        }
        const xslFile = (document.getElementById('xslFile') as HTMLInputElement).value;
        if (xslFile === '') {
            ipcRenderer.send('show-message', { title: 'Error', message: 'Select XSL file' });
            return;
        }
        const outputFile = (document.getElementById('outputFile') as HTMLInputElement).value;
        if (outputFile === '') {
            ipcRenderer.send('show-message', { title: 'Error', message: 'Select output file' });
            return;
        }
        const openResult: boolean = (document.getElementById('openTransformed') as HTMLInputElement).checked;
        ipcRenderer.send('XSLTransform', { xmlFile: xmlFile, xslFile: xslFile, outputFile: outputFile, openResult: openResult });
    }

}