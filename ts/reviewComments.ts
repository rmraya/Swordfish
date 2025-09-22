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

class CommentReply {

    replyId: string;
    repliesTo: string;
    commentId: string;
    userName: string;
    commentText: string;

    constructor(replyId: string, repliesTo: string, commentId: string, userName: string, comment: string) {        
        this.replyId = replyId;
        this.repliesTo = repliesTo;
        this.commentId = commentId;
        this.userName = userName;
        this.commentText = comment;
    }
}

class ReviewComment {

    id: string
    commentId: string;
    category: string;
    severity: string;
    appliesTo: string;
    userName: string;
    commentText: string;
    replies: CommentReply[];

    constructor(id: string, commentId: string, category: string, severity: string, appliesTo: string, userName: string, comment: string) {
        this.id = id;
        this.commentId = commentId;
        this.category = category;
        this.severity = severity;
        this.appliesTo = appliesTo;
        this.userName = userName;
        this.commentText = comment;
        this.replies = [];
    }

    addReply(reply: CommentReply): void {
        this.replies.push(reply);
    }
}