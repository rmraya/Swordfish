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

export interface Memory {
    id: string;
    name: string;
    project: string;
    subject: string;
    client: string;
    creationDate: number;
    creationString: string;
    type: string;
    server: string;
    user: string;
}