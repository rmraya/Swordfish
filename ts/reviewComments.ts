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

export class CommentField {
    storeAs: string;
    value: string;

    constructor(storeAs: string, value: string) {
        this.storeAs = storeAs;
        this.value = value;
    }
}

export class CommentReply {

    replyId: string;
    repliesTo: string;
    fields: CommentField[];

    constructor(replyId: string, repliesTo: string, fields: CommentField[]) {
        this.replyId = replyId;
        this.repliesTo = repliesTo;
        this.fields = fields;
    }
}

export class ReviewComment {

    id: string;
    fields: CommentField[];
    replies: CommentReply[];

    constructor(id: string, fields: CommentField[]) {
        this.id = id;
        this.fields = fields;
        this.replies = [];
    }

    addReply(reply: CommentReply): void {
        this.replies.push(reply);
    }
}