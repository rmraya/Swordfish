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

class CommentsDialog {

    electron = require('electron');

    tabHolder: TabHolder;

    metaId: MetaId = { project: '', file: '' };
    metadata: MetaData = { project: '', file: '', data: [] };
    comments: ReviewComment[] = [];
    selectedTab: string = '';

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        this.electron.ipcRenderer.on('set-data', (event: Electron.IpcRendererEvent, metaId: MetaId) => {
            this.metaId = metaId;
            this.electron.ipcRenderer.send('get-metadata', metaId);
        });
        this.electron.ipcRenderer.on('set-metadata', (event: Electron.IpcRendererEvent, metadata: MetaData) => {
            this.metadata = metadata;
            this.setComments();
        });
        (document.getElementById('addComment') as HTMLButtonElement).addEventListener('click', () => {
            this.electron.ipcRenderer.send('show-add-comment', this.metaId);
        });
        (document.getElementById('editComment') as HTMLButtonElement).addEventListener('click', () => {
            this.editComment();
        });
        (document.getElementById('removeComment') as HTMLButtonElement).addEventListener('click', () => {
            this.removeComment();
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-review-comments');
            }
        });
        this.electron.ipcRenderer.on('add-comment', (event: Electron.IpcRendererEvent, comment: ReviewComment) => {
            this.addComment(comment);
        });
        this.electron.ipcRenderer.on('add-reply', (event: Electron.IpcRendererEvent, reply: CommentReply) => {
            this.addReply(reply);
        });

        let main: HTMLDivElement = document.getElementById('main') as HTMLDivElement;
        main.classList.add('fill_width');

        this.tabHolder = new TabHolder(main, 'tabHolder');

        window.addEventListener('resize', () => {
            this.resize();
        });

        setTimeout(() => {
            this.electron.ipcRenderer.send('set-height', { window: 'reviewComments', width: document.body.clientWidth, height: document.body.clientHeight });
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
        let reviewComments: ReviewComment[] = this.parseComments(this.metadata);
        let length: number = reviewComments ? reviewComments.length : 0;
        let counter: number = 1;
        for (let i: number = 0; i < length; i++) {
            let groupId: string = reviewComments[i].id;
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

            let tr: HTMLTableRowElement = document.createElement('tr');
            commentTable.appendChild(tr);

            let td: HTMLTableCellElement = document.createElement('td');
            td.textContent = 'Comment ID';
            td.classList.add('noWrap');
            tr.appendChild(td);

            td = document.createElement('td');
            td.textContent = reviewComments[i].commentId;
            tr.appendChild(td);

            tr = document.createElement('tr');
            commentTable.appendChild(tr);

            td = document.createElement('td');
            td.textContent = 'Category';
            tr.appendChild(td);

            td = document.createElement('td');
            td.textContent = reviewComments[i].category;
            td.classList.add('fill_width');
            tr.appendChild(td);

            tr = document.createElement('tr');
            commentTable.appendChild(tr);

            td = document.createElement('td');
            td.textContent = 'Severity';
            tr.appendChild(td);

            td = document.createElement('td');
            td.textContent = reviewComments[i].severity;
            td.classList.add('fill_width');
            tr.appendChild(td);

            tr = document.createElement('tr');
            commentTable.appendChild(tr);

            td = document.createElement('td');
            td.textContent = 'Applies To';
            td.classList.add('noWrap');
            tr.appendChild(td);

            td = document.createElement('td');
            td.textContent = reviewComments[i].appliesTo;
            td.classList.add('fill_width');
            tr.appendChild(td);

            tr = document.createElement('tr');
            commentTable.appendChild(tr);

            td = document.createElement('td');
            td.textContent = 'User Name';
            td.classList.add('noWrap');
            tr.appendChild(td);

            td = document.createElement('td');
            td.textContent = reviewComments[i].userName;
            td.classList.add('fill_width');
            tr.appendChild(td);

            tr = document.createElement('tr');
            commentTable.appendChild(tr);

            td = document.createElement('td');
            td.textContent = 'Comment';
            tr.appendChild(td);

            td = document.createElement('td');
            td.textContent = reviewComments[i].commentText;
            td.classList.add('fill_width');
            tr.appendChild(td);

            let commentButtons: HTMLDivElement = document.createElement('div');
            commentButtons.classList.add('buttonArea');
            commentContainer.appendChild(commentButtons);

            let addReply: HTMLButtonElement = document.createElement('button');
            addReply.textContent = 'Add Reply';
            addReply.addEventListener('click', () => {
                this.electron.ipcRenderer.send('show-add-reply', { metaId: this.metaId, commentId: reviewComments[i].id });
            });
            commentButtons.appendChild(addReply);

            for (let j: number = 0; j < reviewComments[i].replies.length; j++) {
                let replyContainer: HTMLDivElement = document.createElement('div');
                replyContainer.classList.add('borderedArea');
                groupHolder.appendChild(replyContainer);

                let replyTable: HTMLTableElement = document.createElement('table');
                replyTable.classList.add('fill_width');
                replyTable.classList.add('alternate');
                replyContainer.appendChild(replyTable);

                tr = document.createElement('tr');
                replyTable.appendChild(tr);

                td = document.createElement('td');
                td.textContent = 'Reply ID';
                tr.appendChild(td);

                td = document.createElement('td');
                td.textContent = reviewComments[i].replies[j].replyId;
                tr.appendChild(td);

                tr = document.createElement('tr');
                replyTable.appendChild(tr);

                td = document.createElement('td');
                td.textContent = 'Comment ID';
                td.classList.add('noWrap');
                tr.appendChild(td);

                td = document.createElement('td');
                td.textContent = reviewComments[i].replies[j].commentId;
                tr.appendChild(td);

                tr = document.createElement('tr');
                replyTable.appendChild(tr);

                td = document.createElement('td');
                td.textContent = 'User Name';
                td.classList.add('noWrap');
                tr.appendChild(td);

                td = document.createElement('td');
                td.textContent = reviewComments[i].replies[j].userName;
                td.classList.add('fill_width');
                tr.appendChild(td);

                tr = document.createElement('tr');
                replyTable.appendChild(tr);

                td = document.createElement('td');
                td.textContent = 'Comment';
                tr.appendChild(td);

                td = document.createElement('td');
                td.textContent = reviewComments[i].replies[j].commentText;
                td.classList.add('fill_width');
                tr.appendChild(td);

                let replyButtons: HTMLDivElement = document.createElement('div');
                replyButtons.classList.add('buttonArea');
                replyContainer.appendChild(replyButtons);

                let editComment: HTMLButtonElement = document.createElement('button');
                editComment.textContent = 'Edit Reply';
                editComment.addEventListener('click', () => {
                    console.log(JSON.stringify(reviewComments[i].replies[j]));
                    this.electron.ipcRenderer.send('show-edit-reply', { metaId: this.metaId, reply: reviewComments[i].replies[j] });
                });
                replyButtons.appendChild(editComment);

                let removeComment: HTMLButtonElement = document.createElement('button');
                removeComment.textContent = 'Remove Reply';
                removeComment.addEventListener('click', () => {
                    this.removeReply(reviewComments[i].id, reviewComments[i].replies[j].replyId);
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
                this.electron.ipcRenderer.send('show-edit-comment', { metaId: this.metaId, comment: this.comments[i] });
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
        this.electron.ipcRenderer.send('save-metadata', { metaId: this.metaId, metadata: this.metadata });
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
        this.electron.ipcRenderer.send('save-metadata', { metaId: this.metaId, metadata: this.metadata });
    }

    parseComments(metadata: MetaData): ReviewComment[] {
        if (!metadata || !metadata.data) {
            return this.comments;
        }

        let data: any[] = metadata.data;
        for (let i = 0; i < data.length; i++) {
            let item = data[i];
            let groupId: string = item.id ? item.id : 'c' + (i + 1);
            let userName: string = this.getMetaValue(item, 'Username');
            let commentId: string = this.getMetaValue(item, 'AMCommentId');
            let commentText: string = this.getMetaValue(item, 'CommentText');
            let repliesTo: string = this.getMetaValue(item, 'ReplyTo');
            if (repliesTo !== '') {
                // is reply
                let reply = new CommentReply(groupId, repliesTo, commentId, userName, commentText);
                for (let j = 0; j < this.comments.length; j++) {
                    if (this.comments[j].id === repliesTo) {
                        this.comments[j].addReply(reply);
                        break;
                    }
                }
            } else {
                // is comment
                let severity: string = this.getMetaValue(item, 'Severity');
                let category: string = this.getMetaValue(item, 'Category');
                let appliesTo: string = this.getMetaValue(item, 'AppliesTo');
                let comment = new ReviewComment(groupId, commentId, category, severity, appliesTo, userName, commentText);
                this.comments.push(comment);
            }
        }
        return this.comments;
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

    addReply(reply: CommentReply): void {
        console.log(JSON.stringify(reply, null, 2));
        if (reply.replyId === '') {
            let length: number = this.metadata.data.length;
            let max: number = 0;
            let prefix: string = '';
            for (let i: number = 0; i < length; i++) {
                let group: MetaGroup = this.metadata.data[i];
                let id: string | undefined = group.id;
                if (id) {
                    prefix = id.substring(0, 2);
                    let num: number = parseInt(id.substring(2), 10);
                    max = Math.max(max, num);
                }
            }
            let metaGroup: MetaGroup = { id: prefix + (max + 1), meta: [] };
            metaGroup.meta.push({ type: 'AMCommentId', value: reply.commentId });
            metaGroup.meta.push({ type: 'Username', value: reply.userName });
            metaGroup.meta.push({ type: 'CommentText', value: reply.commentText });
            metaGroup.meta.push({ type: 'ReplyTo', value: reply.repliesTo });
            this.metadata.data.push(metaGroup);
            this.selectedTab = this.tabHolder.getSelected();
            this.electron.ipcRenderer.send('save-metadata', { metaId: this.metaId, metadata: this.metadata });
        } else {
            let length:number = this.metadata.data.length;
            for (let i=0 ; i<length;i++) {
                let group: MetaGroup = this.metadata.data[i];
                if (group.id === reply.replyId) {
                    group.meta = [];
                    group.meta.push({ type: 'AMCommentId', value: reply.commentId });
                    group.meta.push({ type: 'Username', value: reply.userName });
                    group.meta.push({ type: 'CommentText', value: reply.commentText });
                    group.meta.push({ type: 'ReplyTo', value: reply.repliesTo });
                    this.selectedTab = reply.repliesTo;
                    this.electron.ipcRenderer.send('save-metadata', { metaId: this.metaId, metadata: this.metadata });
                }
            }
        }

    }

    addComment(comment: ReviewComment): void {
        if (!this.metadata || !this.metadata.data) {
            this.metadata = { project: this.metaId.project, file: this.metaId.file, data: [] };
        }
        let length: number = this.metadata ? this.metadata.data?.length : 0;
        let max: number = 0;
        let prefix: string = '';
        for (let i: number = 0; i < length; i++) {
            let group: MetaGroup = this.metadata.data[i];
            if (group.id === comment.id) {
                // already exists
                group.meta = [];
                group.meta.push({ type: 'AMCommentId', value: comment.commentId });
                group.meta.push({ type: 'Username', value: comment.userName });
                group.meta.push({ type: 'CommentText', value: comment.commentText });
                group.meta.push({ type: 'Severity', value: comment.severity });
                group.meta.push({ type: 'Category', value: comment.category });
                group.meta.push({ type: 'AppliesTo', value: comment.appliesTo });
                this.selectedTab = comment.id;
                this.electron.ipcRenderer.send('save-metadata', { metaId: this.metaId, metadata: this.metadata });
                return;
            }
            let id: string | undefined = group.id;
            if (id) {
                prefix = id.substring(0, 2);
                let num: number = parseInt(id.substring(2), 10);
                max = Math.max(max, num);
            }
        }
        if (prefix === '') {
            prefix = this.metaId.unit ? "uc" : "gc";
        }
        let metaGroup: MetaGroup = { id: prefix + (max + 1), meta: [] };
        metaGroup.meta.push({ type: 'AMCommentId', value: comment.commentId });
        metaGroup.meta.push({ type: 'Username', value: comment.userName });
        metaGroup.meta.push({ type: 'CommentText', value: comment.commentText });
        metaGroup.meta.push({ type: 'Severity', value: comment.severity });
        metaGroup.meta.push({ type: 'Category', value: comment.category });
        metaGroup.meta.push({ type: 'AppliesTo', value: comment.appliesTo });
        this.metadata.data.push(metaGroup);
        this.selectedTab = prefix + (max + 1);
        this.electron.ipcRenderer.send('save-metadata', { metaId: this.metaId, metadata: this.metadata });
    }
}

