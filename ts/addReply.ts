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
import { MetaId } from "./metadata.js";
import { CommentField, CommentReply } from "./reviewComments.js";

export class AddReply {

    metaId: MetaId = { project: '', file: '' };
    repliesTo: string = '';
    originalReply: CommentReply | undefined = undefined;
    contentModel: any | undefined = undefined;
    fields: any[] = [];

    constructor() {
        ipcRenderer.send('get-theme');
        ipcRenderer.on('set-theme', (event: IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        ipcRenderer.on('set-metaId', (event: IpcRendererEvent, metaId: MetaId) => {
            this.metaId = metaId;
            ipcRenderer.send('get-content-model', 'addReply');
        });
        ipcRenderer.on('set-content-model', (event: IpcRendererEvent, model: any) => {
            this.contentModel = model;
            this.createElements();
            if (this.originalReply && this.fields.length > 0) {
                this.setValues();
            }
        });
        ipcRenderer.on('set-commentId', (event: IpcRendererEvent, commentId: string) => {
            this.repliesTo = commentId;
        });
        ipcRenderer.on('set-reply', (event: IpcRendererEvent, reply: CommentReply) => {
            this.originalReply = reply;
            if (this.contentModel && this.fields.length > 0) {
                this.setValues();
            }
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                ipcRenderer.send('close-add-reply');
            }
        });
        document.getElementById('saveReply')?.addEventListener('click', () => {
            this.saveReply();
        });
        setTimeout(() => {
            ipcRenderer.send('set-height', { window: 'addReply', width: document.body.clientWidth, height: document.body.clientHeight });
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

                if (field.required === true) {
                    let span: HTMLSpanElement = document.createElement('span');
                    span.classList.add('required');
                    span.textContent = '*';
                    td.appendChild(span);
                }

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
                    ipcRenderer.send('get-username');
                    ipcRenderer.on('set-username', (event: IpcRendererEvent, username: string) => {
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

                if (field.required === true) {
                    let span: HTMLSpanElement = document.createElement('span');
                    span.classList.add('required');
                    span.textContent = '*';
                    td.appendChild(span);
                }

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

                if (field.required === true) {
                    let span: HTMLSpanElement = document.createElement('span');
                    span.classList.add('required');
                    span.textContent = '*';
                    td.appendChild(span);
                }

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
                    ipcRenderer.send('show-message', { type: 'warning', message: 'Enter ' + field.label, parent: 'addCommentDialog' });
                    return;
                }
                replyFields.push(new CommentField(field.storeAs, value));
            }
            if (field.elementType === 'select') {
                let select: HTMLSelectElement = document.getElementById(field.storeAs) as HTMLSelectElement;
                let value: string = select.selectedOptions[0].text;
                if (field.required && value.trim() === '') {
                    ipcRenderer.send('show-message', { type: 'warning', message: 'Enter ' + field.label, parent: 'addCommentDialog' });
                    return;
                }
                replyFields.push(new CommentField(field.storeAs, value));
            }
            if (field.elementType === 'textarea') {
                let textarea: HTMLTextAreaElement = document.getElementById(field.storeAs) as HTMLTextAreaElement;
                let value: string = textarea.value;
                if (field.required && value.trim() === '') {
                    ipcRenderer.send('show-message', { type: 'warning', message: 'Enter ' + field.label, parent: 'addCommentDialog' });
                    return;
                }
                replyFields.push(new CommentField(field.storeAs, value));
            }
        }
        let replyId: string = this.originalReply ? this.originalReply.replyId : '';
        let repliesTo: string = this.originalReply ? this.originalReply.repliesTo : this.repliesTo;
        let reply: CommentReply = new CommentReply(replyId, repliesTo, replyFields);
        ipcRenderer.send('save-reply', { metaId: this.metaId, reply: reply });
    }
}