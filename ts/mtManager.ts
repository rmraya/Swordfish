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

import { AzureTranslator, ChatGPTTranslator, DeepLTranslator, GoogleTranslator, MTEngine, MTMatch, MTUtils, ModernMTTranslator, YandexTranslator } from "mtengines";
import { Language, LanguageUtils } from "typesbcp47";
import { Swordfish } from "./Swordfish";
import { SAXParser, XMLElement } from "typesxml";
import { MTContentHandler } from "./mtContentHandler";

export class MTManager {

    mtEngines: MTEngine[];
    srcLang: string;
    tgtLang: string;

    readonly mtLanguages: any = {
        google: {
            srcLangs: ["af", "ak", "am", "ar", "as", "ay", "az", "be", "bg", "bho", "bm", "bn", "bs", "ca", "ceb", "ckb", "co", "cs", "cy", "da", "de", "doi", "dv", "ee", "el", "en", "eo", "es", "et", "eu", "fa", "fi", "fr", "fy", "ga", "gd", "gl", "gn", "gom", "gu", "ha", "haw", "he", "hi", "hmn", "hr", "ht", "hu", "hy", "id", "ig", "ilo", "is", "it", "iw", "ja", "jv", "jw", "ka", "kk", "km", "kn", "ko", "kri", "ku", "ky", "la", "lb", "lg", "ln", "lo", "lt", "lus", "lv", "mai", "mg", "mi", "mk", "ml", "mn", "mni-Mtei", "mr", "ms", "mt", "my", "ne", "nl", "no", "nso", "ny", "om", "or", "pa", "pl", "ps", "pt", "qu", "ro", "ru", "rw", "sa", "sd", "si", "sk", "sl", "sm", "sn", "so", "sq", "sr", "st", "su", "sv", "sw", "ta", "te", "tg", "th", "ti", "tk", "tl", "tr", "ts", "tt", "ug", "uk", "ur", "uz", "vi", "xh", "yi", "yo", "zh", "zh-CN", "zh-TW", "zu"],
            tgtLangs: ["af", "ak", "am", "ar", "as", "ay", "az", "be", "bg", "bho", "bm", "bn", "bs", "ca", "ceb", "ckb", "co", "cs", "cy", "da", "de", "doi", "dv", "ee", "el", "en", "eo", "es", "et", "eu", "fa", "fi", "fr", "fy", "ga", "gd", "gl", "gn", "gom", "gu", "ha", "haw", "he", "hi", "hmn", "hr", "ht", "hu", "hy", "id", "ig", "ilo", "is", "it", "iw", "ja", "jv", "jw", "ka", "kk", "km", "kn", "ko", "kri", "ku", "ky", "la", "lb", "lg", "ln", "lo", "lt", "lus", "lv", "mai", "mg", "mi", "mk", "ml", "mn", "mni-Mtei", "mr", "ms", "mt", "my", "ne", "nl", "no", "nso", "ny", "om", "or", "pa", "pl", "ps", "pt", "qu", "ro", "ru", "rw", "sa", "sd", "si", "sk", "sl", "sm", "sn", "so", "sq", "sr", "st", "su", "sv", "sw", "ta", "te", "tg", "th", "ti", "tk", "tl", "tr", "ts", "tt", "ug", "uk", "ur", "uz", "vi", "xh", "yi", "yo", "zh", "zh-CN", "zh-TW", "zu"],
            nmtSrcLangs: ["af", "ak", "am", "ar", "as", "ay", "az", "be", "bg", "bho", "bm", "bn", "bs", "ca", "ceb", "ckb", "co", "cs", "cy", "da", "de", "doi", "dv", "ee", "el", "en", "eo", "es", "et", "eu", "fa", "fi", "fr", "fy", "ga", "gd", "gl", "gn", "gom", "gu", "ha", "haw", "he", "hi", "hmn", "hr", "ht", "hu", "hy", "id", "ig", "ilo", "is", "it", "iw", "ja", "jv", "jw", "ka", "kk", "km", "kn", "ko", "kri", "ku", "ky", "la", "lb", "lg", "ln", "lo", "lt", "lus", "lv", "mai", "mg", "mi", "mk", "ml", "mn", "mni-Mtei", "mr", "ms", "mt", "my", "ne", "nl", "no", "nso", "ny", "om", "or", "pa", "pl", "ps", "pt", "qu", "ro", "ru", "rw", "sa", "sd", "si", "sk", "sl", "sm", "sn", "so", "sq", "sr", "st", "su", "sv", "sw", "ta", "te", "tg", "th", "ti", "tk", "tl", "tr", "ts", "tt", "ug", "uk", "ur", "uz", "vi", "xh", "yi", "yo", "zh", "zh-CN", "zh-TW", "zu"],
            nmtTgtLangs: ["af", "ak", "am", "ar", "as", "ay", "az", "be", "bg", "bho", "bm", "bn", "bs", "ca", "ceb", "ckb", "co", "cs", "cy", "da", "de", "doi", "dv", "ee", "el", "en", "eo", "es", "et", "eu", "fa", "fi", "fr", "fy", "ga", "gd", "gl", "gn", "gom", "gu", "ha", "haw", "he", "hi", "hmn", "hr", "ht", "hu", "hy", "id", "ig", "ilo", "is", "it", "iw", "ja", "jv", "jw", "ka", "kk", "km", "kn", "ko", "kri", "ku", "ky", "la", "lb", "lg", "ln", "lo", "lt", "lus", "lv", "mai", "mg", "mi", "mk", "ml", "mn", "mni-Mtei", "mr", "ms", "mt", "my", "ne", "nl", "no", "nso", "ny", "om", "or", "pa", "pl", "ps", "pt", "qu", "ro", "ru", "rw", "sa", "sd", "si", "sk", "sl", "sm", "sn", "so", "sq", "sr", "st", "su", "sv", "sw", "ta", "te", "tg", "th", "ti", "tk", "tl", "tr", "ts", "tt", "ug", "uk", "ur", "uz", "vi", "xh", "yi", "yo", "zh", "zh-CN", "zh-TW", "zu"]
        },
        azure: {
            srcLangs: ["af", "am", "ar", "as", "az", "ba", "bg", "bho", "bn", "bo", "brx", "bs", "ca", "cs", "cy", "da", "de", "doi", "dsb", "dv", "el", "en", "es", "et", "eu", "fa", "fi", "fil", "fj", "fo", "fr", "fr-CA", "ga", "gl", "gom", "gu", "ha", "he", "hi", "hr", "hsb", "ht", "hu", "hy", "id", "ig", "ikt", "is", "it", "iu", "iu-Latn", "ja", "ka", "kk", "km", "kmr", "kn", "ko", "ks", "ku", "ky", "ln", "lo", "lt", "lug", "lv", "lzh", "mai", "mg", "mi", "mk", "ml", "mn-Cyrl", "mn-Mong", "mr", "ms", "mt", "mww", "my", "nb", "ne", "nl", "nso", "nya", "or", "otq", "pa", "pl", "prs", "ps", "pt", "pt-PT", "ro", "ru", "run", "rw", "sd", "si", "sk", "sl", "sm", "sn", "so", "sq", "sr-Cyrl", "sr-Latn", "st", "sv", "sw", "ta", "te", "th", "ti", "tk", "tlh-Latn", "tlh-Piqd", "tn", "to", "tr", "tt", "ty", "ug", "uk", "ur", "uz", "vi", "xh", "yo", "yua", "yue", "zh-Hans", "zh-Hant", "zu"],
            tgtLangs: ["af", "am", "ar", "as", "az", "ba", "bg", "bho", "bn", "bo", "brx", "bs", "ca", "cs", "cy", "da", "de", "doi", "dsb", "dv", "el", "en", "es", "et", "eu", "fa", "fi", "fil", "fj", "fo", "fr", "fr-CA", "ga", "gl", "gom", "gu", "ha", "he", "hi", "hr", "hsb", "ht", "hu", "hy", "id", "ig", "ikt", "is", "it", "iu", "iu-Latn", "ja", "ka", "kk", "km", "kmr", "kn", "ko", "ks", "ku", "ky", "ln", "lo", "lt", "lug", "lv", "lzh", "mai", "mg", "mi", "mk", "ml", "mn-Cyrl", "mn-Mong", "mr", "ms", "mt", "mww", "my", "nb", "ne", "nl", "nso", "nya", "or", "otq", "pa", "pl", "prs", "ps", "pt", "pt-PT", "ro", "ru", "run", "rw", "sd", "si", "sk", "sl", "sm", "sn", "so", "sq", "sr-Cyrl", "sr-Latn", "st", "sv", "sw", "ta", "te", "th", "ti", "tk", "tlh-Latn", "tlh-Piqd", "tn", "to", "tr", "tt", "ty", "ug", "uk", "ur", "uz", "vi", "xh", "yo", "yua", "yue", "zh-Hans", "zh-Hant", "zu"]
        },
        yandex: {
            srcLangs: ["az", "be", "bg", "ca", "cs", "da", "de", "el", "en", "es", "et", "fi", "fr", "hr", "hu", "hy", "it", "lt", "lv", "mk", "nl", "no", "pl", "pt", "ro", "ru", "sk", "sl", "sq", "sr", "sv", "tr", "uk"],
            tgtLangs: ["az", "be", "bg", "ca", "cs", "da", "de", "el", "en", "es", "et", "fi", "fr", "hr", "hu", "hy", "it", "lt", "lv", "mk", "nl", "no", "pl", "pt", "ro", "ru", "sk", "sl", "sq", "sr", "sv", "tr", "uk"]
        },
        deepl: {
            srcLangs: ["bg", "cs", "da", "de", "el", "en", "es", "et", "fi", "fr", "hu", "id", "it", "ja", "ko", "lt", "lv", "nb", "nl", "pl", "pt", "ro", "ru", "sk", "sl", "sv", "tr", "uk", "zh"],
            tgtLangs: ["bg", "cs", "da", "de", "el", "en-GB", "en-US", "es", "et", "fi", "fr", "hu", "id", "it", "ja", "ko", "lt", "lv", "nb", "nl", "pl", "pt-BR", "pt-PT", "ro", "ru", "sk", "sl", "sv", "tr", "uk", "zh"]
        },
        modernmt: {
            srcLangs: ["azb", "tk", "tl", "de", "ace", "azj", "li", "ti", "lg", "tg", "th", "tum", "bho", "te", "hne", "dz", "la", "ta", "lb", "tw", "lv", "min", "zsm", "ts", "lt", "tt", "tr", "lo", "ln", "tn", "bs", "bug", "dyu", "prs", "cs", "kk", "sk", "ki", "si", "kg", "sg", "sd", "cy", "ca", "sc", "ka", "sa", "da", "ky", "sv", "ast", "zh-TW", "sw", "st", "su", "sr", "ks", "ss", "sq", "kn", "sn", "ko", "so", "be", "ceb", "sl", "km", "sm", "nn", "bjn", "nl", "vi", "ne", "ga", "nb", "gd", "ilo", "khk", "ltg", "zh-CN", "ny", "mni", "uzn", "fj", "fi", "awa", "fo", "fr", "ml", "et", "mk", "uk", "mi", "ba", "cjk", "mg", "ug", "taq", "vec", "mos", "tpi", "ee", "my", "mt", "bg", "ckb", "el", "mr", "ur", "eo", "ms", "en", "es-ES", "mn", "knc", "pt-PT", "hy", "pl", "xh", "id", "ig", "pa", "hi", "hr", "ps", "ht", "hu", "wo", "az", "crh", "als", "ayr", "ha", "oc", "he", "gl", "gn", "or", "kmr", "plt", "gu", "ro", "rn", "kmb", "war", "rw", "ru", "zu", "jv", "af", "dik", "yo", "diq", "ja", "ydd", "is", "it", "kea", "pag", "es-419", "pap", "bm", "bn", "bo", "pbt", "ban", "ak", "tzm", "gaz", "pes", "am", "bem", "ar", "as", "umb", "pt-BR", "quy", "fon", "kas", "kam", "kab", "kac", "fur", "kbp", "fuv", "lij", "lmo", "es", "luo", "lus", "lua", "lvs", "nso", "sat", "mag", "mai", "scn", "shn", "szl", "nus", "zh", "pt"],
            tgtLangs: ["azb", "tk", "tl", "de", "ace", "azj", "li", "ti", "lg", "tg", "th", "tum", "bho", "te", "hne", "dz", "la", "ta", "lb", "tw", "lv", "min", "zsm", "ts", "lt", "tt", "tr", "lo", "ln", "tn", "bs", "bug", "dyu", "prs", "cs", "kk", "sk", "ki", "si", "kg", "sg", "sd", "cy", "ca", "sc", "ka", "sa", "da", "ky", "sv", "ast", "zh-TW", "sw", "st", "su", "sr", "ks", "ss", "sq", "kn", "sn", "ko", "so", "be", "ceb", "sl", "km", "sm", "nn", "bjn", "nl", "vi", "ne", "ga", "nb", "gd", "ilo", "khk", "ltg", "zh-CN", "ny", "mni", "uzn", "fj", "fi", "awa", "fo", "fr", "ml", "et", "mk", "uk", "mi", "ba", "cjk", "mg", "ug", "taq", "vec", "mos", "tpi", "ee", "my", "mt", "bg", "ckb", "el", "mr", "ur", "eo", "ms", "en", "es-ES", "mn", "knc", "pt-PT", "hy", "pl", "xh", "id", "ig", "pa", "hi", "hr", "ps", "ht", "hu", "wo", "az", "crh", "als", "ayr", "ha", "oc", "he", "gl", "gn", "or", "kmr", "plt", "gu", "ro", "rn", "kmb", "war", "rw", "ru", "zu", "jv", "af", "dik", "yo", "diq", "ja", "ydd", "is", "it", "kea", "pag", "es-419", "pap", "bm", "bn", "bo", "pbt", "ban", "ak", "tzm", "gaz", "pes", "am", "bem", "ar", "as", "umb", "pt-BR", "quy", "fon", "kas", "kam", "kab", "kac", "fur", "kbp", "fuv", "lij", "lmo", "es", "luo", "lus", "lua", "lvs", "nso", "sat", "mag", "mai", "scn", "shn", "szl", "nus", "zh", "pt"]
        }
    };

    constructor(preferences: Preferences, srcLang: string, tgtLang: string) {
        this.mtEngines = [];
        this.srcLang = srcLang;
        this.tgtLang = tgtLang;
        if (preferences.google.enabled) {
            let googleTranslator: GoogleTranslator = new GoogleTranslator(preferences.google.apiKey, preferences.google.neural);
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
        if (preferences.yandex.enabled) {
            let yandexTranslator: YandexTranslator = new YandexTranslator(preferences.yandex.apiKey);
            yandexTranslator.setSourceLanguage(preferences.yandex.srcLang);
            yandexTranslator.setTargetLanguage(preferences.yandex.tgtLang);
            this.mtEngines.push(yandexTranslator);
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

    translateProject(project: string, exportedFile: string) {
        let parser: SAXParser = new SAXParser();
        let handler: MTContentHandler = new MTContentHandler(this, project);
        parser.setContentHandler(handler);
        parser.parseFile(exportedFile);
    }

    translateElement(source: XMLElement, project: string, file: string, unit: string, segment: string) {
        console.log(source.toString());
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
                translations: translations
            });
        }, (reason: any) => {
            if (reason instanceof Error) {
                console.log(reason.message);
                throw reason;
            }
            throw new Error(reason);
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
            });
        }, (reason: any) => {
            Swordfish.mainWindow.webContents.send('end-waiting');
            Swordfish.mainWindow.webContents.send('set-status', '');
            if (reason instanceof Error) {
                throw reason;
            }
            console.log(JSON.stringify(reason, null, 2));
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
        }).then((response: Response) => {
            if (response.ok) {
                response.json().then((result: any) => {
                    if (result.status === 'Success') {
                        resolve(result);
                        return;
                    }
                    reject(result.reason);
                });
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
        }).then((response: Response) => {
            if (response.ok) {
                response.json().then((result: any) => {
                    if (result.status === 'Success') {
                        Swordfish.getMatches({
                            project: params.project,
                            file: params.file,
                            unit: params.unit,
                            segment: params.segment
                        });
                    } else {
                        throw new Error(result.reason);
                    }
                });
            } else {
                throw new Error("Error setting MT matches");
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
                tgtLangs: this.getLanguages(this.mtLanguages.google.tgtLangs),
                nmtSrclangs: this.getLanguages(this.mtLanguages.google.nmtSrcLangs),
                nmtTgtLangs: this.getLanguages(this.mtLanguages.google.nmtTgtLangs)
            },
            azure: {
                srcLangs: this.getLanguages(this.mtLanguages.azure.srcLangs),
                tgtLangs: this.getLanguages(this.mtLanguages.azure.tgtLangs)
            },
            yandex: {
                srcLangs: this.getLanguages(this.mtLanguages.yandex.srcLangs),
                tgtLangs: this.getLanguages(this.mtLanguages.yandex.tgtLangs),
                directions: YandexTranslator.getDirections()
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
                result.push(LanguageUtils.getLanguage(lang));
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