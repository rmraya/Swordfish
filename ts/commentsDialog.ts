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
import { MetaData, MetaEntry, MetaGroup, MetaId } from "./metadata.js";
import { CommentField, CommentReply, ReviewComment } from "./reviewComments.js";
import { Tab, TabHolder } from "./tabs.js";

export class CommentsDialog {

    tabHolder: TabHolder;

    metaId: MetaId = { project: '', file: '' };
    metadata: MetaData = { project: '', file: '', data: [] };
    comments: ReviewComment[] = [];
    selectedTab: string = '';

    constructor() {
        ipcRenderer.send('get-theme');
        ipcRenderer.on('set-theme', (event: IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        ipcRenderer.on('set-data', (event: IpcRendererEvent, metaId: MetaId) => {
            this.metaId = metaId;
            ipcRenderer.send('get-metadata', metaId);
        });
        ipcRenderer.on('set-metadata', (event: IpcRendererEvent, metadata: MetaData) => {
            this.metadata = metadata;
            this.setComments();
        });
        (document.getElementById('addComment') as HTMLButtonElement).addEventListener('click', () => {
            ipcRenderer.send('show-add-comment', this.metaId);
        });
        (document.getElementById('editComment') as HTMLButtonElement).addEventListener('click', () => {
            this.editComment();
        });
        (document.getElementById('removeComment') as HTMLButtonElement).addEventListener('click', () => {
            this.removeComment();
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                ipcRenderer.send('close-review-comments');
            }
            if (event.code === 'PageUp' && (event.ctrlKey || event.metaKey)) {
                this.tabHolder.selectPrevious();
            }
            if (event.code === 'PageDown' && (event.ctrlKey || event.metaKey)) {
                this.tabHolder.selectNext();
            }
        });
        ipcRenderer.on('add-comment', (event: IpcRendererEvent, comment: ReviewComment) => {
            this.addComment(comment);
        });
        ipcRenderer.on('add-reply', (event: IpcRendererEvent, reply: CommentReply) => {
            this.addReply(reply);
        });
        ipcRenderer.on('set-svg', (event: IpcRendererEvent, svg: string) => {
            this.tabHolder.setEmptyMessage(svg, 'No comments yet');
        });
        let main: HTMLDivElement = document.getElementById('main') as HTMLDivElement;
        main.classList.add('fill_width');

        this.tabHolder = new TabHolder(main, 'tabHolder');

        window.addEventListener('resize', () => {
            this.resize();
        });

        setTimeout(() => {
            ipcRenderer.send('set-height', { window: 'reviewComments', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    resize(): void {
        let main = document.getElementById('main') as HTMLDivElement;
        let buttons: HTMLDivElement = document.getElementById('buttons') as HTMLDivElement;
        main.style.height = document.body.clientHeight - buttons.clientHeight + 'px';

        let tabHolders = document.getElementsByClassName('tabHolder') as HTMLCollectionOf<HTMLDivElement>;
        if (tabHolders.length > 0) {
            let tabHolderHeight: number = tabHolders[0].clientHeight;
            let divContainers: HTMLCollectionOf<HTMLDivElement> = document.getElementsByClassName('divContainer') as HTMLCollectionOf<HTMLDivElement>;
            let length: number = divContainers.length;
            for (let i: number = 0; i < length; i++) {
                divContainers[i].style.height = (main.clientHeight - tabHolderHeight) + 'px';
            }
        }
    }

    setComments(): void {
        let main = document.getElementById('main') as HTMLDivElement;
        main.innerHTML = '';
        this.comments = [];
        this.tabHolder = new TabHolder(document.getElementById('main') as HTMLDivElement, 'tabHolder');
        this.parseComments(this.metadata);
        let length: number = this.comments.length;
        let counter: number = 1;
        if (length === 0) {
            ipcRenderer.send('get-svg', 'no_comment.svg');
        }
        for (let i: number = 0; i < length; i++) {
            let groupId: string = this.comments[i].id;
            let id: string = groupId ? groupId : 'Comment_' + counter++;

            let tab: Tab = new Tab(id, id, false, this.tabHolder);
            this.tabHolder.addTab(tab);

            let groupHolder: HTMLDivElement = tab.getContainer();
            groupHolder.classList.add('divContainer');

            let commentContainer: HTMLDivElement = document.createElement('div');
            commentContainer.classList.add('borderedArea');
            groupHolder.appendChild(commentContainer);

            let commentTable: HTMLTableElement = document.createElement('table');
            commentTable.classList.add('fill_width');
            commentTable.classList.add('alternate');
            commentContainer.appendChild(commentTable);

            let fields: CommentField[] = this.comments[i].fields;
            for (let field of fields) {
                let tr: HTMLTableRowElement = document.createElement('tr');
                commentTable.appendChild(tr);

                let td: HTMLTableCellElement = document.createElement('td');
                td.textContent = field.storeAs;
                td.classList.add('noWrap');
                tr.appendChild(td);

                td = document.createElement('td');
                td.textContent = field.value;
                td.classList.add('fill_width');
                tr.appendChild(td);
            }

            let commentButtons: HTMLDivElement = document.createElement('div');
            commentButtons.classList.add('buttonArea');
            commentContainer.appendChild(commentButtons);

            let addReply: HTMLButtonElement = document.createElement('button');
            addReply.textContent = 'Add Reply';
            addReply.addEventListener('click', () => {
                ipcRenderer.send('show-add-reply', { metaId: this.metaId, commentId: this.comments[i].id });
            });
            commentButtons.appendChild(addReply);

            for (let j: number = 0; j < this.comments[i].replies.length; j++) {
                let reply: CommentReply = this.comments[i].replies[j];
                let replyContainer: HTMLDivElement = document.createElement('div');
                replyContainer.classList.add('borderedArea');
                groupHolder.appendChild(replyContainer);

                let replyTable: HTMLTableElement = document.createElement('table');
                replyTable.classList.add('fill_width');
                replyTable.classList.add('alternate');
                replyContainer.appendChild(replyTable);

                for (let field of reply.fields) {
                    let tr: HTMLTableRowElement = document.createElement('tr');
                    replyTable.appendChild(tr);

                    let td: HTMLTableCellElement = document.createElement('td');
                    td.textContent = field.storeAs;
                    td.classList.add('noWrap');
                    tr.appendChild(td);

                    td = document.createElement('td');
                    td.textContent = field.value;
                    td.classList.add('fill_width');
                    tr.appendChild(td);
                }

                let replyButtons: HTMLDivElement = document.createElement('div');
                replyButtons.classList.add('buttonArea');
                replyContainer.appendChild(replyButtons);

                let editComment: HTMLButtonElement = document.createElement('button');
                editComment.textContent = 'Edit Reply';
                editComment.addEventListener('click', () => {
                    ipcRenderer.send('show-edit-reply', { metaId: this.metaId, reply: this.comments[i].replies[j] });
                });
                replyButtons.appendChild(editComment);

                let removeComment: HTMLButtonElement = document.createElement('button');
                removeComment.textContent = 'Remove Reply';
                removeComment.addEventListener('click', () => {
                    this.removeReply(this.comments[i].id, this.comments[i].replies[j].replyId);
                });
                replyButtons.appendChild(removeComment);
            }
        }

        if (this.selectedTab !== '') {
            this.tabHolder.selectTab(this.selectedTab);
        }

        setTimeout(() => {
            this.resize();
        }, 200);
    }

    editComment(): void {
        let selected: string = this.tabHolder.getSelected();
        if (selected === '') {
            // no tab selected
            return;
        }
        let length: number = this.comments.length;
        for (let i: number = 0; i < length; i++) {
            if (this.comments[i].id === selected) {
                ipcRenderer.send('show-edit-comment', { metaId: this.metaId, comment: this.comments[i] });
                break;
            }
        }
    }

    removeComment(): void {
        let selected: string = this.tabHolder.getSelected();
        if (selected === '') {
            // no tab selected
            return;
        }
        let removeArray: string[] = [];
        removeArray.push(selected);
        // remove replies too
        for (let comment of this.comments) {
            if (comment.id === selected) {
                for (let reply of comment.replies) {
                    removeArray.push(reply.replyId);
                }
                break;
            }
        }
        let newData: MetaGroup[] = [];
        let length: number = this.metadata.data.length;
        for (let i: number = 0; i < length; i++) {
            let group: MetaGroup = this.metadata.data[i];
            let id: string | undefined = group.id;
            if (id && !removeArray.includes(id)) {
                newData.push(group);
            }
        }
        this.metadata.data = newData;
        this.selectedTab = '';
        ipcRenderer.send('save-metadata', { metaId: this.metaId, metadata: this.metadata });
    }

    removeReply(commentId: string, replyId: string): void {
        let newData: MetaGroup[] = [];
        let length: number = this.metadata.data.length;
        for (let i: number = 0; i < length; i++) {
            let group: MetaGroup = this.metadata.data[i];
            let id: string | undefined = group.id;
            if (id && replyId !== id) {
                newData.push(group);
            }
        }
        this.metadata.data = newData;
        this.selectedTab = commentId;
        ipcRenderer.send('save-metadata', { metaId: this.metaId, metadata: this.metadata });
    }

    parseComments(metadata: MetaData): void {
        this.comments = [];
        if (!metadata || !metadata.data) {
            return;
        }
        let data: MetaGroup[] = metadata.data;
        for (let i = 0; i < data.length; i++) {
            let metaGroup: MetaGroup = data[i];
            let repliesTo: string = this.getRepliesTo(metaGroup);
            let fields: CommentField[] = this.parseFields(metaGroup.meta);

            if (repliesTo === '') {
                // handle comment
                let comment: ReviewComment = new ReviewComment(metaGroup.id ? metaGroup.id : '', fields);
                this.comments.push(comment);
            } else {
                // handle reply
                let reply: CommentReply = new CommentReply(metaGroup.id ? metaGroup.id : '', repliesTo, fields);
                for (let j = 0; j < this.comments.length; j++) {
                    if (this.comments[j].id === repliesTo) {
                        this.comments[j].addReply(reply);
                        break;
                    }
                }
            }
        }
    }

    getMetaValue(item: any, type: string): string {
        let meta: any[] = item.meta;
        for (let i = 0; i < meta.length; i++) {
            if (meta[i].type === type) {
                return meta[i].value;
            }
        }
        return '';
    }

    getRepliesTo(item: MetaGroup): string {
        let meta: MetaEntry[] = item.meta;
        for (let i = 0; i < meta.length; i++) {
            if (meta[i].type === 'ReplyTo') {
                return meta[i].value;
            }
        }
        return '';
    }

    parseFields(meta: MetaEntry[]): CommentField[] {
        let fields: CommentField[] = [];
        for (let i = 0; i < meta.length; i++) {
            let entry: MetaEntry = meta[i];
            let field: CommentField = new CommentField(entry.type, entry.value);
            fields.push(field);
        }
        return fields;
    }

    addComment(comment: ReviewComment): void {
        if (!this.metadata || !this.metadata.data) {
            this.metadata = { project: this.metaId.project, file: this.metaId.file, data: [] };
        }
        let length: number = this.metadata.data.length;
        let max: number = 0;
        let prefix: string = '';
        for (let i: number = 0; i < length; i++) {
            let group: MetaGroup = this.metadata.data[i];
            if (group.id === comment.id) {
                // already exists
                group.meta = [];
                let fields: CommentField[] = comment.fields;
                for (let field of fields) {
                    group.meta.push({ type: field.storeAs, value: field.value });
                }
                this.selectedTab = comment.id;
                ipcRenderer.send('save-metadata', { metaId: this.metaId, metadata: this.metadata });
                return;
            }
            let id: string | undefined = group.id;
            if (id) {
                prefix = id.substring(0, 2);
                let num: number = Number.parseInt(id.substring(2), 10);
                max = Math.max(max, num);
            }
        }
        if (prefix === '') {
            prefix = this.metaId.unit ? "uc" : "gc";
        }
        let metaGroup: MetaGroup = { id: prefix + (max + 1), meta: [] };
        let fields: CommentField[] = comment.fields;
        for (let field of fields) {
            metaGroup.meta.push({ type: field.storeAs, value: field.value });
        }
        this.metadata.data.push(metaGroup);
        this.selectedTab = prefix + (max + 1);
        ipcRenderer.send('save-metadata', { metaId: this.metaId, metadata: this.metadata });
    }

    addReply(reply: CommentReply): void {
        if (!this.metadata || !this.metadata.data) {
            // can't be a reply without a comment
            //send an error message and return
            ipcRenderer.send('show-message', { type: 'error', message: 'Cannot add a reply without a comment', parent: 'commentsDialog' });
            return;
        }
        let length: number = this.metadata.data.length;
        let max: number = 0;
        let prefix: string = '';
        for (let i: number = 0; i < length; i++) {
            let group: MetaGroup = this.metadata.data[i];
            if (group.id === reply.replyId) {
                // already exists
                group.meta = [];
                group.meta.push({ type: 'ReplyTo', value: reply.repliesTo });
                let fields: CommentField[] = reply.fields;
                for (let field of fields) {
                    group.meta.push({ type: field.storeAs, value: field.value });
                }
                this.selectedTab = reply.repliesTo;
                ipcRenderer.send('save-metadata', { metaId: this.metaId, metadata: this.metadata });
                return;
            }
            let id: string | undefined = group.id;
            if (id) {
                prefix = id.substring(0, 2);
                let num: number = Number.parseInt(id.substring(2), 10);
                max = Math.max(max, num);
            }
        }
        if (prefix === '') {
            prefix = this.metaId.unit ? "uc" : "gc  ";
        }
        let metaGroup: MetaGroup = { id: prefix + (max + 1), meta: [] };
        metaGroup.meta.push({ type: 'ReplyTo', value: reply.repliesTo });
        let fields: CommentField[] = reply.fields;
        for (let field of fields) {
            metaGroup.meta.push({ type: field.storeAs, value: field.value });
        }
        this.metadata.data.push(metaGroup);
        this.selectedTab = reply.repliesTo;
        ipcRenderer.send('save-metadata', { metaId: this.metaId, metadata: this.metadata });
    }
}

