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

import { SourceFile } from "./sourceFile.js";

export interface Project {
    id: string;
    description: string;
    status: string;
    sourceLang: string;
    targetLang: string;
    client: string;
    subject: string;
    creationDate: string;
    files: SourceFile[];
    xliff: string;
    memory: string;
    glossary: string;
    svg: string;
    version: string;
    review?: boolean;
}
