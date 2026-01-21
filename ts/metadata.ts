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

export interface MetaId {
    project: string;
    file: string;
    unit?: string;
    segment?: string;
}

export interface MetaData {
    project: string;
    file: string;
    unit?: string;
    segment?: string;
    data: Array<MetaGroup>;
}

export interface MetaEntry {
    type: string;
    value: string;
}

export interface MetaGroup {
    id?: string;
    category?: string;
    appliesTo?: string;
    meta: Array<MetaEntry>;
}