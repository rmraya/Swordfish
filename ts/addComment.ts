/*******************************************************************************
 * Copyright (c) 2007 - 2025 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/

class AddComment {

    electron = require('electron');
    metaId: MetaId = { project: '', file: '' };
    originalComment: ReviewComment | null = null;

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        this.electron.ipcRenderer.send('get-username');
        this.electron.ipcRenderer.on('set-username', (event: Electron.IpcRendererEvent, username: string) => {
            (document.getElementById('username') as HTMLInputElement).value = username;
        });
        this.electron.ipcRenderer.on('set-metaId', (event: Electron.IpcRendererEvent, metaId: MetaId) => {
            this.metaId = metaId;
        });
        this.electron.ipcRenderer.on('set-comment', (event: Electron.IpcRendererEvent, comment: ReviewComment) => {
            this.originalComment = comment;
            (document.getElementById('commentId') as HTMLInputElement).value = comment.commentId;
            (document.getElementById('commentId') as HTMLInputElement).disabled = true;
            this.selectByText((document.getElementById('category') as HTMLSelectElement), comment.category);
            this.selectByText((document.getElementById('severity') as HTMLSelectElement), comment.severity);
            this.selectByText((document.getElementById('appliesTo') as HTMLSelectElement), comment.appliesTo);
            (document.getElementById('username') as HTMLInputElement).value = comment.userName;
            (document.getElementById('comment') as HTMLTextAreaElement).value = comment.commentText;
        });
        document.getElementById('saveComment')?.addEventListener('click', () => {
            this.saveComment();
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-add-comment');
            }
        });
        setTimeout(() => {
            this.electron.ipcRenderer.send('set-height', { window: 'addComment', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 100);
    }

    selectByText(selectElement: HTMLSelectElement, text: string): void {
        for (let option of selectElement.options) {
            if (option.textContent.trim() === text) {
                selectElement.value = option.value;
                selectElement.dispatchEvent(new Event('change'));
                return;
            }
        }
    }

    saveComment(): void {
        let comment: string = (document.getElementById('comment') as HTMLTextAreaElement).value;
        if (comment.trim() === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Enter comment', parent: 'addCommentDialog' });
            return;
        }
        let commentId: string = (document.getElementById('commentId') as HTMLInputElement).value;
        let category: string = (document.getElementById('category') as HTMLSelectElement).selectedOptions[0].text;
        let appliesTo: string = (document.getElementById('appliesTo') as HTMLSelectElement).selectedOptions[0].text;
        let severity: string = (document.getElementById('severity') as HTMLSelectElement).selectedOptions[0].text;
        if (severity.trim() === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select severity', parent: 'addCommentDialog' });
            return;
        }
        let username: string = (document.getElementById('username') as HTMLInputElement).value;
        let id: string = '';
        if (this.originalComment) {
            id = this.originalComment.id;
        }
        let newComment: ReviewComment = new ReviewComment(id, commentId, category, severity, appliesTo, username, comment);
        this.electron.ipcRenderer.send('save-comment', { metaId: this.metaId, comment: newComment });
    }
}