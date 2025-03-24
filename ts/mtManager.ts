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

import { AzureTranslator, ChatGPTTranslator, DeepLTranslator, GoogleTranslator, MTEngine, MTMatch, MTUtils, ModernMTTranslator } from "mtengines";
import { Language, LanguageUtils } from "typesbcp47";
import { SAXParser, XMLElement } from "typesxml";
import { MTContentHandler } from "./mtContentHandler";
import { Swordfish } from "./Swordfish";

export class MTManager {

    mtEngines: MTEngine[];
    srcLang: string;
    tgtLang: string;

    readonly mtLanguages: any = {
        google: {
            srcLangs: ["ab", "ace", "ach", "af", "ak", "alz", "am", "ar", "as", "awa", "ay", "az", "ba", "ban", "bbc", "be", "bem", "bew", "bg", "bho", "bik", "bm", "bn", "br", "bs", "bts", "btx", "bua", "ca", "ceb", "cgg", "chm", "ckb", "cnh", "co", "crh", "crs", "cs", "cv", "cy", "da", "de", "din", "doi", "dov", "dv", "dz", "ee", "el", "en", "eo", "es", "et", "eu", "fa", "ff", "fi", "fj", "fr", "fy", "ga", "gaa", "gd", "gl", "gn", "gom", "gu", "ha", "haw", "he", "hi", "hil", "hmn", "hr", "hrx", "ht", "hu", "hy", "id", "ig", "ilo", "is", "it", "iw", "ja", "jv", "jw", "ka", "kk", "km", "kn", "ko", "kri", "ktu", "ku", "ky", "la", "lb", "lg", "li", "lij", "lmo", "ln", "lo", "lt", "ltg", "luo", "lus", "lv", "mai", "mak", "mg", "mi", "min", "mk", "ml", "mn", "mni-Mtei", "mr", "ms", "ms-Arab", "mt", "my", "ne", "new", "nl", "no", "nr", "nso", "nus", "ny", "oc", "om", "or", "pa", "pa-Arab", "pag", "pam", "pap", "pl", "ps", "pt", "qu", "rn", "ro", "rom", "ru", "rw", "sa", "scn", "sd", "sg", "shn", "si", "sk", "sl", "sm", "sn", "so", "sq", "sr", "ss", "st", "su", "sv", "sw", "szl", "ta", "te", "tet", "tg", "th", "ti", "tk", "tl", "tn", "tr", "ts", "tt", "ug", "uk", "ur", "uz", "vi", "xh", "yi", "yo", "yua", "yue", "zh", "zh-CN", "zh-TW", "zu"],
            tgtLangs: ["ab", "ace", "ach", "af", "ak", "alz", "am", "ar", "as", "awa", "ay", "az", "ba", "ban", "bbc", "be", "bem", "bew", "bg", "bho", "bik", "bm", "bn", "br", "bs", "bts", "btx", "bua", "ca", "ceb", "cgg", "chm", "ckb", "cnh", "co", "crh", "crs", "cs", "cv", "cy", "da", "de", "din", "doi", "dov", "dv", "dz", "ee", "el", "en", "eo", "es", "et", "eu", "fa", "ff", "fi", "fj", "fr", "fy", "ga", "gaa", "gd", "gl", "gn", "gom", "gu", "ha", "haw", "he", "hi", "hil", "hmn", "hr", "hrx", "ht", "hu", "hy", "id", "ig", "ilo", "is", "it", "iw", "ja", "jv", "jw", "ka", "kk", "km", "kn", "ko", "kri", "ktu", "ku", "ky", "la", "lb", "lg", "li", "lij", "lmo", "ln", "lo", "lt", "ltg", "luo", "lus", "lv", "mai", "mak", "mg", "mi", "min", "mk", "ml", "mn", "mni-Mtei", "mr", "ms", "ms-Arab", "mt", "my", "ne", "new", "nl", "no", "nr", "nso", "nus", "ny", "oc", "om", "or", "pa", "pa-Arab", "pag", "pam", "pap", "pl", "ps", "pt", "qu", "rn", "ro", "rom", "ru", "rw", "sa", "scn", "sd", "sg", "shn", "si", "sk", "sl", "sm", "sn", "so", "sq", "sr", "ss", "st", "su", "sv", "sw", "szl", "ta", "te", "tet", "tg", "th", "ti", "tk", "tl", "tn", "tr", "ts", "tt", "ug", "uk", "ur", "uz", "vi", "xh", "yi", "yo", "yua", "yue", "zh", "zh-CN", "zh-TW", "zu"]
        },
        azure: {
            srcLangs: ["af", "am", "ar", "as", "az", "ba", "bg", "bho", "bn", "bo", "brx", "bs", "ca", "cs", "cy", "da", "de", "doi", "dsb", "dv", "el", "en", "es", "et", "eu", "fa", "fi", "fil", "fj", "fo", "fr", "fr-CA", "ga", "gl", "gom", "gu", "ha", "he", "hi", "hne", "hr", "hsb", "ht", "hu", "hy", "id", "ig", "ikt", "is", "it", "iu", "iu-Latn", "ja", "ka", "kk", "km", "kmr", "kn", "ko", "ks", "ku", "ky", "ln", "lo", "lt", "lug", "lv", "lzh", "mai", "mg", "mi", "mk", "ml", "mn-Cyrl", "mn-Mong", "mni", "mr", "ms", "mt", "mww", "my", "nb", "ne", "nl", "nso", "nya", "or", "otq", "pa", "pl", "prs", "ps", "pt", "pt-PT", "ro", "ru", "run", "rw", "sd", "si", "sk", "sl", "sm", "sn", "so", "sq", "sr-Cyrl", "sr-Latn", "st", "sv", "sw", "ta", "te", "th", "ti", "tk", "tlh-Latn", "tlh-Piqd", "tn", "to", "tr", "tt", "ty", "ug", "uk", "ur", "uz", "vi", "xh", "yo", "yua", "yue", "zh-Hans", "zh-Hant", "zu"],
            tgtLangs: ["af", "am", "ar", "as", "az", "ba", "bg", "bho", "bn", "bo", "brx", "bs", "ca", "cs", "cy", "da", "de", "doi", "dsb", "dv", "el", "en", "es", "et", "eu", "fa", "fi", "fil", "fj", "fo", "fr", "fr-CA", "ga", "gl", "gom", "gu", "ha", "he", "hi", "hne", "hr", "hsb", "ht", "hu", "hy", "id", "ig", "ikt", "is", "it", "iu", "iu-Latn", "ja", "ka", "kk", "km", "kmr", "kn", "ko", "ks", "ku", "ky", "ln", "lo", "lt", "lug", "lv", "lzh", "mai", "mg", "mi", "mk", "ml", "mn-Cyrl", "mn-Mong", "mni", "mr", "ms", "mt", "mww", "my", "nb", "ne", "nl", "nso", "nya", "or", "otq", "pa", "pl", "prs", "ps", "pt", "pt-PT", "ro", "ru", "run", "rw", "sd", "si", "sk", "sl", "sm", "sn", "so", "sq", "sr-Cyrl", "sr-Latn", "st", "sv", "sw", "ta", "te", "th", "ti", "tk", "tlh-Latn", "tlh-Piqd", "tn", "to", "tr", "tt", "ty", "ug", "uk", "ur", "uz", "vi", "xh", "yo", "yua", "yue", "zh-Hans", "zh-Hant", "zu"]
        },
        deepl: {
            srcLangs: ["bg", "cs", "da", "de", "el", "en", "es", "et", "fi", "fr", "hu", "id", "it", "ja", "ko", "lt", "lv", "nb", "nl", "pl", "pt", "ro", "ru", "sk", "sl", "sv", "tr", "uk", "zh"],
            tgtLangs: ["bg", "cs", "da", "de", "el", "en-GB", "en-US", "es", "et", "fi", "fr", "hu", "id", "it", "ja", "ko", "lt", "lv", "nb", "nl", "pl", "pt-BR", "pt-PT", "ro", "ru", "sk", "sl", "sv", "tr", "uk", "zh", "zh-Hans"]
        },
        modernmt: {
            srcLangs: ["ace", "af", "ak", "als", "am", "ar", "as", "ast", "awa", "ayr", "az", "azb", "azj", "ba", "ban", "be", "bem", "bg", "bho", "bjn", "bm", "bn", "bo", "bs", "bug", "ca", "ceb", "cjk", "ckb", "crh", "cs", "cy", "da", "de", "dik", "diq", "dyu", "dz", "ee", "el", "en", "eo", "es", "es-419", "es-ES", "et", "fi", "fj", "fo", "fon", "fr", "fur", "fuv", "ga", "gaz", "gd", "gl", "gn", "gu", "ha", "he", "hi", "hne", "hr", "ht", "hu", "hy", "id", "ig", "ilo", "is", "it", "ja", "jv", "ka", "kab", "kac", "kam", "kas", "kbp", "kea", "kg", "khk", "ki", "kk", "km", "kmb", "kmr", "kn", "knc", "ko", "ks", "ky", "la", "lb", "lg", "li", "lij", "lmo", "ln", "lo", "lt", "ltg", "lua", "luo", "lus", "lv", "lvs", "mag", "mai", "mg", "mi", "min", "mk", "ml", "mn", "mni", "mos", "mr", "ms", "mt", "my", "nb", "ne", "nl", "nn", "nso", "nus", "ny", "oc", "or", "pa", "pag", "pap", "pbt", "pes", "pl", "plt", "prs", "ps", "pt", "pt-BR", "pt-PT", "quy", "rn", "ro", "ru", "rw", "sa", "sat", "sc", "scn", "sd", "sg", "shn", "si", "sk", "sl", "sm", "sn", "so", "sq", "sr", "ss", "st", "su", "sv", "sw", "szl", "ta", "taq", "te", "tg", "th", "ti", "tk", "tl", "tn", "tpi", "tr", "ts", "tt", "tum", "tw", "tzm", "ug", "uk", "umb", "ur", "uzn", "vec", "vi", "war", "wo", "xh", "ydd", "yo", "zh", "zh-CN", "zh-TW", "zsm", "zu"],
            tgtLangs: ["ace", "af", "ak", "als", "am", "ar", "as", "ast", "awa", "ayr", "az", "azb", "azj", "ba", "ban", "be", "bem", "bg", "bho", "bjn", "bm", "bn", "bo", "bs", "bug", "ca", "ceb", "cjk", "ckb", "crh", "cs", "cy", "da", "de", "dik", "diq", "dyu", "dz", "ee", "el", "en", "eo", "es", "es-419", "es-ES", "et", "fi", "fj", "fo", "fon", "fr", "fur", "fuv", "ga", "gaz", "gd", "gl", "gn", "gu", "ha", "he", "hi", "hne", "hr", "ht", "hu", "hy", "id", "ig", "ilo", "is", "it", "ja", "jv", "ka", "kab", "kac", "kam", "kas", "kbp", "kea", "kg", "khk", "ki", "kk", "km", "kmb", "kmr", "kn", "knc", "ko", "ks", "ky", "la", "lb", "lg", "li", "lij", "lmo", "ln", "lo", "lt", "ltg", "lua", "luo", "lus", "lv", "lvs", "mag", "mai", "mg", "mi", "min", "mk", "ml", "mn", "mni", "mos", "mr", "ms", "mt", "my", "nb", "ne", "nl", "nn", "nso", "nus", "ny", "oc", "or", "pa", "pag", "pap", "pbt", "pes", "pl", "plt", "prs", "ps", "pt", "pt-BR", "pt-PT", "quy", "rn", "ro", "ru", "rw", "sa", "sat", "sc", "scn", "sd", "sg", "shn", "si", "sk", "sl", "sm", "sn", "so", "sq", "sr", "ss", "st", "su", "sv", "sw", "szl", "ta", "taq", "te", "tg", "th", "ti", "tk", "tl", "tn", "tpi", "tr", "ts", "tt", "tum", "tw", "tzm", "ug", "uk", "umb", "ur", "uzn", "vec", "vi", "war", "wo", "xh", "ydd", "yo", "zh", "zh-CN", "zh-TW", "zsm", "zu"]
        }
    };
    currentSegment: SegmentId;

    constructor(preferences: Preferences, srcLang: string, tgtLang: string) {
        this.mtEngines = [];
        this.srcLang = srcLang;
        this.tgtLang = tgtLang;
        if (preferences.google.enabled) {
            let googleTranslator: GoogleTranslator = new GoogleTranslator(preferences.google.apiKey);
            googleTranslator.setSourceLanguage(preferences.google.srcLang);
            googleTranslator.setTargetLanguage(preferences.google.tgtLang);
            this.mtEngines.push(googleTranslator);
        }
        if (preferences.azure.enabled) {
            let azureTranslator: AzureTranslator = new AzureTranslator(preferences.azure.apiKey);
            azureTranslator.setSourceLanguage(preferences.azure.srcLang);
            azureTranslator.setTargetLanguage(preferences.azure.tgtLang);
            this.mtEngines.push(azureTranslator);
        }
        if (preferences.deepl.enabled) {
            let deeplTranslator: DeepLTranslator = new DeepLTranslator(preferences.deepl.apiKey);
            deeplTranslator.setSourceLanguage(preferences.deepl.srcLang);
            deeplTranslator.setTargetLanguage(preferences.deepl.tgtLang);
            this.mtEngines.push(deeplTranslator);
        }
        if (preferences.chatGpt.enabled) {
            let chatGptTranslator: ChatGPTTranslator = new ChatGPTTranslator(preferences.chatGpt.apiKey, preferences.chatGpt.model);
            chatGptTranslator.setSourceLanguage(srcLang);
            chatGptTranslator.setTargetLanguage(tgtLang);
            this.mtEngines.push(chatGptTranslator);
        }
        if (preferences.modernmt.enabled) {
            let modernmtTranslator: ModernMTTranslator = new ModernMTTranslator(preferences.modernmt.apiKey);
            modernmtTranslator.setSourceLanguage(preferences.modernmt.srcLang);
            modernmtTranslator.setTargetLanguage(preferences.modernmt.tgtLang);
            this.mtEngines.push(modernmtTranslator);
        }
    }

    translateProject(project: string, exportedFile: string, currentSegment: SegmentId) {
        this.currentSegment = currentSegment;
        let parser: SAXParser = new SAXParser();
        let handler: MTContentHandler = new MTContentHandler(this, project);
        parser.setContentHandler(handler);
        parser.parseFile(exportedFile);
    }

    translateElement(source: XMLElement, project: string, file: string, unit: string, segment: string) {
        let promises: Promise<MTMatch>[] = [];
        for (let mtEngine of this.mtEngines) {
            if (mtEngine.handlesTags()) {
                promises.push(mtEngine.getMTMatch(source));
            } else {
                let plainText: string = MTUtils.plainText(source);
                let plainSource: XMLElement = MTUtils.toXMLElement('<source>' + plainText + '</source>');
                promises.push(mtEngine.getMTMatch(plainSource));
            }
        }
        Promise.all(promises).then((values: MTMatch[]) => {
            let translations: MTMatch[] = [];
            for (let value of values) {
                translations.push(value);
            }
            this.setMTMatches({
                project: project,
                file: file,
                unit: unit,
                segment: segment,
                srcLang: this.srcLang,
                tgtLang: this.tgtLang,
                translations: translations,
                currentSegment: {
                    file: file,
                    unit: unit,
                    id: segment
                }
            });
        }, (reason: any) => {
            if (reason instanceof Error) {
                throw reason;
            }
            throw new Error(reason);
        }).catch((error: any) => {
            if (error instanceof Error) {
                throw error;
            }
        });
    }

    fixMatch(params: any): void {
        let promises: Promise<MTMatch>[] = [];
        for (let mtEngine of this.mtEngines) {
            if (mtEngine.fixesMatches()) {
                promises.push(mtEngine.fixMatch(
                    MTUtils.toXMLElement(params.source),
                    MTUtils.toXMLElement(params.matchSource),
                    MTUtils.toXMLElement(params.matchTarget)
                ));
            }
        }
        Promise.all(promises).then((values: MTMatch[]) => {
            let translations: MTMatch[] = [];
            for (let value of values) {
                translations.push(value);
            }
            this.setMTMatches({
                project: params.project,
                file: params.file,
                unit: params.unit,
                segment: params.segment,
                srcLang: this.srcLang,
                tgtLang: this.tgtLang,
                translations: translations,
                currentSegment: {
                    file: params.file,
                    unit: params.unit,
                    id: params.segment
                }
            });
        }, (reason: any) => {
            if (reason instanceof Error) {
                throw reason;
            }
            throw new Error(reason);
        }).catch((error: any) => {
            if (error instanceof Error) {
                throw error;
            }
        });
    }

    translateSegment(params: any) {
        Swordfish.mainWindow.webContents.send('start-waiting');
        Swordfish.mainWindow.webContents.send('set-status', 'Getting Translations');
        this.getSourceSegment(params, (segment: any) => {
            let promises: Promise<MTMatch>[] = [];
            for (let mtEngine of this.mtEngines) {
                if (mtEngine.handlesTags()) {
                    promises.push(mtEngine.getMTMatch(MTUtils.toXMLElement(segment.source)));
                } else {
                    promises.push(mtEngine.getMTMatch(MTUtils.toXMLElement(segment.plainText)));
                }
            }
            Promise.all(promises).then((values: MTMatch[]) => {
                let translations: MTMatch[] = [];
                for (let value of values) {
                    translations.push(value);
                }
                params.translations = translations;
                params.reload = true;
                this.setMTMatches(params);
                Swordfish.mainWindow.webContents.send('end-waiting');
                Swordfish.mainWindow.webContents.send('set-status', '');
            }, (reason: any) => {
                Swordfish.mainWindow.webContents.send('end-waiting');
                Swordfish.mainWindow.webContents.send('set-status', '');
                if (reason instanceof Error) {
                    throw reason;
                }
                throw new Error(reason);
            }).catch((error: any) => {
                Swordfish.mainWindow.webContents.send('end-waiting');
                Swordfish.mainWindow.webContents.send('set-status', '');
                if (error instanceof Error) {
                    throw error;
                }
                throw new Error(error);
            });
        }, (reason: any) => {
            Swordfish.mainWindow.webContents.send('end-waiting');
            Swordfish.mainWindow.webContents.send('set-status', '');
            if (reason instanceof Error) {
                throw reason;
            }
            console.log('translateSegment error', JSON.stringify(reason, null, 2));
            throw new Error(reason);
        });
    }

    getSourceSegment(params: any, resolve: Function, reject: Function): void {
        fetch('http://127.0.0.1:8070/projects/segmentSource', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(params)
        }).then(async (response: Response) => {
            if (response.ok) {
                let result: any = await response.json();
                if (result.status === 'Success') {
                    resolve(result);
                    return;
                }
                reject(result.reason);
            } else {
                throw new Error("Error getting source segment");
            }
        }).catch((error: any) => {
            if (error instanceof Error) {
                reject(error.message);
                return;
            }
            reject('Error getting source segment');
        });
    }

    setMTMatches(params: any): void {
        fetch('http://127.0.0.1:8070/projects/setMTMatches', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(params)
        }).then(async (response: Response) => {
            if (response.ok) {
                let json: any = await response.json();
                if (json.status !== 'Success') {
                    console.error("Received " + JSON.stringify(json));
                    throw new Error(json.reason);
                }
                if (params.currentSegment) {
                    let current: SegmentId = params.currentSegment;
                    if (current.file === params.file && current.unit === params.unit && current.id === params.segment) {
                        Swordfish.getMatches({
                            project: params.project,
                            file: params.file,
                            unit: params.unit,
                            segment: params.segment
                        });
                    }
                    Swordfish.mainWindow.webContents.send('end-waiting');
                    Swordfish.mainWindow.webContents.send('set-status', '');
                }
            } else {
                throw new Error("Error setting MT matches: " + response.statusText);
            }
        }).catch((error: any) => {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error("Error setting MT matches");
        });
    }

    getMTLanguages(): any {
        return {
            google: {
                srcLangs: this.getLanguages(this.mtLanguages.google.srcLangs),
                tgtLangs: this.getLanguages(this.mtLanguages.google.tgtLangs)
            },
            azure: {
                srcLangs: this.getLanguages(this.mtLanguages.azure.srcLangs),
                tgtLangs: this.getLanguages(this.mtLanguages.azure.tgtLangs)
            },
            deepl: {
                srcLangs: this.getLanguages(this.mtLanguages.deepl.srcLangs),
                tgtLangs: this.getLanguages(this.mtLanguages.deepl.tgtLangs)
            },
            modernmt: {
                srcLangs: this.getLanguages(this.mtLanguages.modernmt.srcLangs),
                tgtLangs: this.getLanguages(this.mtLanguages.modernmt.tgtLangs)
            }
        };

    }

    getLanguages(langs: string[]): Language[] {
        let result: Language[] = [];
        for (let lang of langs) {
            try {
                result.push(LanguageUtils.getLanguage(lang, 'en'));
            } catch (error) {
                // ignore unsupported tags
                // console.log('unsupported tag', lang);
            }
        }
        result.sort((a: Language, b: Language) => {
            return a.description.localeCompare(b.description);
        });
        return result;
    }

}