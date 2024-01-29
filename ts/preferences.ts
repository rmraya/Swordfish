/*******************************************************************************
 * Copyright (c) 2007 - 2024 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/

class Preferences {
    theme: string;
    zoomFactor: string;
    srcLang: string;
    tgtLang: string;
    projectsFolder: string;
    memoriesFolder: string;
    glossariesFolder: string;
    catalog: string;
    srx: string;
    paragraphSegmentation: boolean;
    acceptUnconfirmed: boolean;
    fuzzyTermSearches: boolean;
    caseSensitiveSearches: boolean;
    caseSensitiveMatches: boolean;
    google: {
        enabled: boolean;
        apiKey: string;
        srcLang: string;
        tgtLang: string;
        neural: boolean;
    };
    azure: {
        enabled: boolean;
        apiKey: string;
        srcLang: string;
        tgtLang: string;
    };
    yandex: {
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
}