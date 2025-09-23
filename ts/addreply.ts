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
    originalReply: CommentReply | undefined = undefined;
    contentModel: any | undefined = undefined;
    fields: any[] = [];

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        this.electron.ipcRenderer.on('set-metaId', (event: Electron.IpcRendererEvent, metaId: MetaId) => {
            this.metaId = metaId;
            this.electron.ipcRenderer.send('get-content-model', 'addReply');
        });
        this.electron.ipcRenderer.on('set-content-model', (event: Electron.IpcRendererEvent, model: any) => {
            this.contentModel = model;
            this.createElements();
            if (this.originalReply && this.fields.length > 0) {
                this.setValues();
            }
        });
        this.electron.ipcRenderer.on('set-commentId', (event: Electron.IpcRendererEvent, commentId: string) => {
            this.repliesTo = commentId;
        });
        this.electron.ipcRenderer.on('set-reply', (event: Electron.IpcRendererEvent, reply: CommentReply) => {
            this.originalReply = reply;
            if (this.contentModel && this.fields.length > 0) {
                this.setValues();
            }
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

    createElements(): void {
        let table: HTMLTableElement = document.getElementById('main') as HTMLTableElement;
        this.fields = this.metaId.unit ? this.contentModel.unitReplies : this.contentModel.fileReplies;
        this.fields.forEach((field: any) => {
            if (field.elementType === 'input') {
                let tr: HTMLTableRowElement = document.createElement('tr');
                table.appendChild(tr);

                let td: HTMLTableCellElement = document.createElement('td');
                td.classList.add('middle');
                tr.appendChild(td);

                let label: HTMLLabelElement = document.createElement('label');
                label.htmlFor = field.storeAs;
                label.className = 'noWrap';
                label.textContent = field.label;
                td.appendChild(label);

                td = document.createElement('td');
                td.classList.add('middle');
                td.classList.add('fill_width');
                tr.appendChild(td);

                let input: HTMLInputElement = document.createElement('input');
                input.type = 'text';
                input.id = field.storeAs;
                input.classList.add('middle');
                input.classList.add('table_input');
                td.appendChild(input);
                if (field.default === '@USERNAME') {
                    this.electron.ipcRenderer.send('get-username');
                    this.electron.ipcRenderer.on('set-username', (event: Electron.IpcRendererEvent, username: string) => {
                        input.value = username;
                    });
                }
            }
            if (field.elementType === 'select') {
                let tr: HTMLTableRowElement = document.createElement('tr');
                table.appendChild(tr);

                let td: HTMLTableCellElement = document.createElement('td');
                td.classList.add('middle');
                tr.appendChild(td);

                let label: HTMLLabelElement = document.createElement('label');
                label.htmlFor = field.storeAs;
                label.className = 'noWrap';
                label.textContent = field.label;
                td.appendChild(label);

                td = document.createElement('td');
                td.classList.add('middle');
                td.classList.add('fill_width');
                tr.appendChild(td);

                let select: HTMLSelectElement = document.createElement('select');
                select.id = field.storeAs;
                select.classList.add('middle');
                select.classList.add('table_select');
                field.options.forEach((optionData: any) => {
                    let option: HTMLOptionElement = document.createElement('option');
                    option.value = optionData.value;
                    option.textContent = optionData.text;
                    select.appendChild(option);
                });
                td.appendChild(select);
            }
            if (field.elementType === 'textarea') {
                let tr: HTMLTableRowElement = document.createElement('tr');
                table.appendChild(tr);

                let td: HTMLTableCellElement = document.createElement('td');
                td.classList.add('middle');
                td.colSpan = 2;
                tr.appendChild(td);

                let label: HTMLLabelElement = document.createElement('label');
                label.htmlFor = field.storeAs;
                label.className = 'noWrap';
                label.textContent = field.label;
                td.appendChild(label);

                let textarea: HTMLTextAreaElement = document.createElement('textarea');
                textarea.id = field.storeAs;
                textarea.classList.add('fill_width');
                textarea.style.height = '80px';
                td.appendChild(textarea);
            }
        });
    }

    setValues(): void {
        if (this.originalReply) {
            this.originalReply.fields.forEach((field) => {
                let element = document.getElementById(field.storeAs);
                if (element) {
                    if (element.tagName === 'INPUT') {
                        (element as HTMLInputElement).value = field.value;
                    } else if (element.tagName === 'SELECT') {
                        this.selectByText(element as HTMLSelectElement, field.value);
                    } else if (element.tagName === 'TEXTAREA') {
                        (element as HTMLTextAreaElement).value = field.value;
                    }
                }
            });
        }
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

    saveReply(): void {
        let replyFields: CommentField[] = [];
        for (let field of this.fields) {
            if (field.elementType === 'input') {
                let input: HTMLInputElement = document.getElementById(field.storeAs) as HTMLInputElement;
                let value: string = input.value;
                if (field.required && value.trim() === '') {
                    this.electron.ipcRenderer.send('show-message', { type: 'warning', message: `Enter ${field.label}`, parent: 'addCommentDialog' });
                    return;
                }
                replyFields.push(new CommentField(field.storeAs, value));
            }
            if (field.elementType === 'select') {
                let select: HTMLSelectElement = document.getElementById(field.storeAs) as HTMLSelectElement;
                let value: string = select.selectedOptions[0].text;
                if (field.required && value.trim() === '') {
                    this.electron.ipcRenderer.send('show-message', { type: 'warning', message: `Enter ${field.label}`, parent: 'addCommentDialog' });
                    return;
                }
                replyFields.push(new CommentField(field.storeAs, value));
            }
            if (field.elementType === 'textarea') {
                let textarea: HTMLTextAreaElement = document.getElementById(field.storeAs) as HTMLTextAreaElement;
                let value: string = textarea.value;
                if (field.required && value.trim() === '') {
                    this.electron.ipcRenderer.send('show-message', { type: 'warning', message: `Enter ${field.label}`, parent: 'addCommentDialog' });
                    return;
                }
                replyFields.push(new CommentField(field.storeAs, value));
            }
        }
        let replyId: string = this.originalReply ? this.originalReply.replyId : '';
        let repliesTo: string = this.originalReply ? this.originalReply.repliesTo : this.repliesTo;
        let reply: CommentReply = new CommentReply(replyId, repliesTo, replyFields);
        this.electron.ipcRenderer.send('save-reply', { metaId: this.metaId, reply: reply });
    }
}