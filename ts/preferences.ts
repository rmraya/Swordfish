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

export interface Preferences {
    theme: string;
    zoomFactor: string;
    srcLang: string;
    tgtLang: string;
    projectsFolder: string;
    memoriesFolder: string;
    glossariesFolder: string;
    userName: string;
    catalog: string;
    srx: string;
    reviewModel: string;
    paragraphSegmentation: boolean;
    acceptUnconfirmed: boolean;
    fuzzyTermSearches: boolean;
    caseSensitiveSearches: boolean;
    caseSensitiveMatches: boolean;
    autoConfirm: boolean;
    google: {
        enabled: boolean;
        apiKey: string;
        srcLang: string;
        tgtLang: string;
    };
    azure: {
        enabled: boolean;
        apiKey: string;
        srcLang: string;
        tgtLang: string;
    };
    deepl: {
        enabled: boolean;
        apiKey: string;
        srcLang: string;
        tgtLang: string;
    };
    chatGpt: {
        enabled: boolean;
        apiKey: string;
        model: string;
        fixTags: boolean;
    };
    anthropic: {
        enabled: boolean;
        apiKey: string;
        model: string;
        fixTags: boolean;
    };
    modernmt: {
        enabled: boolean;
        apiKey: string;
        srcLang: string;
        tgtLang: string;
    };
    spellchecker: {
        defaultEnglish: string;
        defaultPortuguese: string;
        defaultSpanish: string;
    };
    os: string;
    showGuide: boolean;
    pageRows: number;
}