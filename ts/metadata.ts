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

interface MetaId {
    project: string;
    file: string;
    unit?: string;
    segment?: string;
}

interface MetaData {
    project: string;
    file: string;
    unit?: string;
    segment?: string;
    data: Array<MetaGroup>;
}

interface MetaEntry {
    type: string;
    value: string;
}

interface MetaGroup {
    id?: string;
    category?: string;
    appliesTo?: 'source' | 'target' | 'ignorable';
    meta: Array<MetaEntry>;
}