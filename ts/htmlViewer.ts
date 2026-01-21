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

export class HtmlViewer {

    id: number = -1;

    constructor() {
        ipcRenderer.send('get-theme');
        ipcRenderer.on('set-theme', (event: IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                ipcRenderer.send('close-htmlViewer', this.id );
            }
        });
        ipcRenderer.send('get-html-content');
        ipcRenderer.on('set-content', (event: IpcRendererEvent, arg: any) => {
            let container: HTMLDivElement = document.getElementById('content') as HTMLDivElement;
            container.innerHTML = arg;
            container.style.width = document.body.clientWidth + 'px';
            container.style.height = document.body.clientHeight + 'px';
        });
        ipcRenderer.send('get-html-title');
        ipcRenderer.on('set-title', (event: IpcRendererEvent, title: string) => {
            (document.getElementById('title') as HTMLTitleElement).innerText = title;
        });
        ipcRenderer.send('get-html-id');
        ipcRenderer.on('set-id', (event: IpcRendererEvent, id: number) => {
            this.id = id;
        });
        window.addEventListener('resize', () => {
            let container: HTMLDivElement = document.getElementById('content') as HTMLDivElement;
            container.style.width = document.body.clientWidth + 'px';
            container.style.height = document.body.clientHeight + 'px';
        });
    }
}
