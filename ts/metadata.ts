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

interface MetaData {
    project:string;
    file: string;
    unit?: string;
    segment?: string;
    data: [
        {
            id: string;
            category: string;
            appliesTo: string;
            meta: [
                {
                    type: string;
                    value: string;
                }
            ]
        }
    ]
}