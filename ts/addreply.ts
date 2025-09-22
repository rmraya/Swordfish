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

class AddReply {

    electron = require('electron');
    metaId: MetaId = { project: '', file: '' };
    repliesTo: string = '';
    originalReply: CommentReply | null = null;

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
        this.electron.ipcRenderer.on('set-commentId', (event: Electron.IpcRendererEvent, commentId: string) => {
            this.repliesTo = commentId;
        });
        this.electron.ipcRenderer.on('set-reply', (event: Electron.IpcRendererEvent, reply: CommentReply) => {
            this.setReply(reply);
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-add-reply');
            }
        });
        document.getElementById('saveReply')?.addEventListener('click', () => {
            this.saveReply();
        });
        setTimeout(() => {
            this.electron.ipcRenderer.send('set-height', { window: 'addReply', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 100);
    }

    setReply(reply: CommentReply): void {
        this.originalReply = reply;
        (document.getElementById('comment') as HTMLTextAreaElement).value = reply.commentText;
        (document.getElementById('username') as HTMLInputElement).value = reply.userName;
        (document.getElementById('commentId') as HTMLInputElement).value = reply.commentId;
    }

    saveReply(): void {
        let comment: string = (document.getElementById('comment') as HTMLTextAreaElement).value;
        if (comment.trim() === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Enter comment', parent: 'addReplyDialog' });
            return;
        }
        let replyId: string = this.originalReply ? this.originalReply.replyId : ''
        let repliesTo:string = this.originalReply ? this.originalReply.repliesTo : this.repliesTo;
        let commentId: string = (document.getElementById('commentId') as HTMLInputElement).value;
        let userName: string = (document.getElementById('username') as HTMLInputElement).value;
        let reply: CommentReply = new CommentReply(replyId, repliesTo, commentId, userName, comment);
        this.electron.ipcRenderer.send('save-reply', { metaId: this.metaId, reply: reply });
    }
}