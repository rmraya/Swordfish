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

import { AnthropicTranslator, AzureTranslator, ChatGPTTranslator, DeepLTranslator, GoogleTranslator, MTEngine, MTMatch, MTUtils, MistralTranslator, ModernMTTranslator, QwenTranslator } from "mtengines";
import { Language, LanguageUtils } from "typesbcp47";
import { SAXParser, XMLElement } from "typesxml";
import { MTContentHandler } from "./mtContentHandler.js";
import { Preferences } from "./preferences.js";
import { SegmentId } from "./segmentId.js";
import { Swordfish } from "./Swordfish.js";

type MTFailure = {
    engine: string;
    project: string;
    segment: SegmentId;
    message: string;
};

type RetryOptions = {
    attempts: number;
    initialDelayMs: number;
    jitterMs: number;
};

// Throttle outbound requests so we do not overwhelm MT engines or the local service.
const DEFAULT_TRANSLATION_CONCURRENCY: number = 4;
const DEFAULT_MATCH_UPDATE_CONCURRENCY: number = 8;
const DEFAULT_TRANSLATION_RETRY_OPTIONS: RetryOptions = { attempts: 3, initialDelayMs: 250, jitterMs: 150 };
const DEFAULT_MATCH_UPDATE_RETRY_OPTIONS: RetryOptions = { attempts: 3, initialDelayMs: 400, jitterMs: 200 };
const HTTP_STATUS_DESCRIPTIONS: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    408: 'Request Timeout',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout'
};

class ConcurrencyLimiter {
    private active: number = 0;
    private queue: Array<() => void> = [];
    private limit: number;

    constructor(limit: number) {
        this.limit = limit > 0 ? limit : Infinity;
    }

    async run<T>(task: () => Promise<T>): Promise<T> {
        await this.acquire();
        try {
            return await task();
        } finally {
            this.release();
        }
    }

    private async acquire(): Promise<void> {
        if (this.active < this.limit) {
            this.active++;
            return;
        }
        return new Promise<void>((resolve) => {
            this.queue.push(() => {
                this.active++;
                resolve();
            });
        });
    }

    private release(): void {
        this.active--;
        let next: (() => void) | undefined = this.queue.shift();
        if (next) {
            next();
        }
    }
}

export class MTManager {

    mtEngines: MTEngine[];
    srcLang: string;
    tgtLang: string;
    tagFixer: MTEngine | undefined = undefined;
    translationFailures: MTFailure[] = [];
    currentProject: string = '';
    private translationLimiter: ConcurrencyLimiter;
    private matchUpdateLimiter: ConcurrencyLimiter;
    private translationRetryOptions: RetryOptions;
    private matchUpdateRetryOptions: RetryOptions;

    readonly mtLanguages: any = {
        google: {
            srcLangs: ["ab", "ace", "ach", "af", "ak", "alz", "am", "ar", "as", "awa", "ay", "az", "ba", "ban", "bbc", "be", "bem", "bew", "bg", "bho", "bik", "bm", "bn", "br", "bs", "bts", "btx", "bua", "ca", "ceb", "cgg", "chm", "ckb", "cnh", "co", "crh", "crs", "cs", "cv", "cy", "da", "de", "din", "doi", "dov", "dv", "dz", "ee", "el", "en", "eo", "es", "et", "eu", "fa", "ff", "fi", "fj", "fr", "fy", "ga", "gaa", "gd", "gl", "gn", "gom", "gu", "ha", "haw", "he", "hi", "hil", "hmn", "hr", "hrx", "ht", "hu", "hy", "id", "ig", "ilo", "is", "it", "iw", "ja", "jv", "jw", "ka", "kk", "km", "kn", "ko", "kri", "ktu", "ku", "ky", "la", "lb", "lg", "li", "lij", "lmo", "ln", "lo", "lt", "ltg", "luo", "lus", "lv", "mai", "mak", "mg", "mi", "min", "mk", "ml", "mn", "mni-Mtei", "mr", "ms", "ms-Arab", "mt", "my", "ne", "new", "nl", "no", "nr", "nso", "nus", "ny", "oc", "om", "or", "pa", "pa-Arab", "pag", "pam", "pap", "pl", "ps", "pt", "qu", "rn", "ro", "rom", "ru", "rw", "sa", "scn", "sd", "sg", "shn", "si", "sk", "sl", "sm", "sn", "so", "sq", "sr", "ss", "st", "su", "sv", "sw", "szl", "ta", "te", "tet", "tg", "th", "ti", "tk", "tl", "tn", "tr", "ts", "tt", "ug", "uk", "ur", "uz", "vi", "xh", "yi", "yo", "yua", "yue", "zh", "zh-CN", "zh-TW", "zu"],
            tgtLangs: ["ab", "ace", "ach", "af", "ak", "alz", "am", "ar", "as", "awa", "ay", "az", "ba", "ban", "bbc", "be", "bem", "bew", "bg", "bho", "bik", "bm", "bn", "br", "bs", "bts", "btx", "bua", "ca", "ceb", "cgg", "chm", "ckb", "cnh", "co", "crh", "crs", "cs", "cv", "cy", "da", "de", "din", "doi", "dov", "dv", "dz", "ee", "el", "en", "eo", "es", "et", "eu", "fa", "ff", "fi", "fj", "fr", "fy", "ga", "gaa", "gd", "gl", "gn", "gom", "gu", "ha", "haw", "he", "hi", "hil", "hmn", "hr", "hrx", "ht", "hu", "hy", "id", "ig", "ilo", "is", "it", "iw", "ja", "jv", "jw", "ka", "kk", "km", "kn", "ko", "kri", "ktu", "ku", "ky", "la", "lb", "lg", "li", "lij", "lmo", "ln", "lo", "lt", "ltg", "luo", "lus", "lv", "mai", "mak", "mg", "mi", "min", "mk", "ml", "mn", "mni-Mtei", "mr", "ms", "ms-Arab", "mt", "my", "ne", "new", "nl", "no", "nr", "nso", "nus", "ny", "oc", "om", "or", "pa", "pa-Arab", "pag", "pam", "pap", "pl", "ps", "pt", "qu", "rn", "ro", "rom", "ru", "rw", "sa", "scn", "sd", "sg", "shn", "si", "sk", "sl", "sm", "sn", "so", "sq", "sr", "ss", "st", "su", "sv", "sw", "szl", "ta", "te", "tet", "tg", "th", "ti", "tk", "tl", "tn", "tr", "ts", "tt", "ug", "uk", "ur", "uz", "vi", "xh", "yi", "yo", "yua", "yue", "zh", "zh-CN", "zh-TW", "zu"]
        },
        azure: {
            srcLangs: ["af", "am", "ar", "as", "az", "ba", "be", "bg", "bho", "bn", "bo", "brx", "bs", "ca", "cs", "cy", "da", "de", "doi", "dsb", "dv", "el", "en", "es", "et", "eu", "fa", "fi", "fil", "fj", "fo", "fr", "fr-CA", "ga", "gl", "gom", "gu", "ha", "he", "hi", "hne", "hr", "hsb", "ht", "hu", "hy", "id", "ig", "ikt", "is", "it", "iu", "iu-Latn", "ja", "ka", "kk", "km", "kmr", "kn", "ko", "ks", "ku", "ky", "lb", "ln", "lo", "lt", "lug", "lv", "lzh", "mai", "mg", "mi", "mk", "ml", "mn-Cyrl", "mn-Mong", "mni", "mr", "ms", "mt", "mww", "my", "nb", "ne", "nl", "nso", "nya", "or", "otq", "pa", "pl", "prs", "ps", "pt", "pt-PT", "ro", "ru", "run", "rw", "sd", "si", "sk", "sl", "sm", "sn", "so", "sq", "sr-Cyrl", "sr-Latn", "st", "sv", "sw", "ta", "te", "th", "ti", "tk", "tlh-Latn", "tlh-Piqd", "tn", "to", "tr", "tt", "ty", "ug", "uk", "ur", "uz", "vi", "xh", "yo", "yua", "yue", "zh-Hans", "zh-Hant", "zu"],
            tgtLangs: ["af", "am", "ar", "as", "az", "ba", "be", "bg", "bho", "bn", "bo", "brx", "bs", "ca", "cs", "cy", "da", "de", "doi", "dsb", "dv", "el", "en", "es", "et", "eu", "fa", "fi", "fil", "fj", "fo", "fr", "fr-CA", "ga", "gl", "gom", "gu", "ha", "he", "hi", "hne", "hr", "hsb", "ht", "hu", "hy", "id", "ig", "ikt", "is", "it", "iu", "iu-Latn", "ja", "ka", "kk", "km", "kmr", "kn", "ko", "ks", "ku", "ky", "lb", "ln", "lo", "lt", "lug", "lv", "lzh", "mai", "mg", "mi", "mk", "ml", "mn-Cyrl", "mn-Mong", "mni", "mr", "ms", "mt", "mww", "my", "nb", "ne", "nl", "nso", "nya", "or", "otq", "pa", "pl", "prs", "ps", "pt", "pt-PT", "ro", "ru", "run", "rw", "sd", "si", "sk", "sl", "sm", "sn", "so", "sq", "sr-Cyrl", "sr-Latn", "st", "sv", "sw", "ta", "te", "th", "ti", "tk", "tlh-Latn", "tlh-Piqd", "tn", "to", "tr", "tt", "ty", "ug", "uk", "ur", "uz", "vi", "xh", "yo", "yua", "yue", "zh-Hans", "zh-Hant", "zu"]
        },
        deepl: {
            srcLangs: ["ar", "bg", "cs", "da", "de", "el", "en", "es", "et", "fi", "fr", "he", "hu", "id", "it", "ja", "ko", "lt", "lv", "nb", "nl", "pl", "pt", "ro", "ru", "sk", "sl", "sv", "th", "tr", "uk", "vi", "zh"],
            tgtLangs: ["ar", "bg", "cs", "da", "de", "el", "en-GB", "en-US", "es", "es-419", "et", "fi", "fr", "he", "hu", "id", "it", "ja", "ko", "lt", "lv", "nb", "nl", "pl", "pt-BR", "pt-PT", "ro", "ru", "sk", "sl", "sv", "th", "tr", "uk", "vi", "zh", "zh-Hans", "zh-Hant"]
        },
        modernmt: {
            srcLangs: ["ace", "af", "ak", "als", "am", "ar", "as", "ast", "awa", "ayr", "az", "azb", "azj", "ba", "ban", "be", "bem", "bg", "bho", "bjn", "bm", "bn", "bo", "bs", "bug", "ca", "ceb", "cjk", "ckb", "crh", "cs", "cy", "da", "de", "dik", "diq", "dyu", "dz", "ee", "el", "en", "eo", "es", "es-419", "es-ES", "et", "fi", "fj", "fo", "fon", "fr", "fur", "fuv", "ga", "gaz", "gd", "gl", "gn", "gu", "ha", "he", "hi", "hne", "hr", "ht", "hu", "hy", "id", "ig", "ilo", "is", "it", "ja", "jv", "ka", "kab", "kac", "kam", "kas", "kbp", "kea", "kg", "khk", "ki", "kk", "km", "kmb", "kmr", "kn", "knc", "ko", "ks", "ky", "la", "lb", "lg", "li", "lij", "lmo", "ln", "lo", "lt", "ltg", "lua", "luo", "lus", "lv", "lvs", "mag", "mai", "mg", "mi", "min", "mk", "ml", "mn", "mni", "mos", "mr", "ms", "mt", "my", "nb", "ne", "nl", "nn", "nso", "nus", "ny", "oc", "or", "pa", "pag", "pap", "pbt", "pes", "pl", "plt", "prs", "ps", "pt", "pt-BR", "pt-PT", "quy", "rn", "ro", "ru", "rw", "sa", "sat", "sc", "scn", "sd", "sg", "shn", "si", "sk", "sl", "sm", "sn", "so", "sq", "sr", "ss", "st", "su", "sv", "sw", "szl", "ta", "taq", "te", "tg", "th", "ti", "tk", "tl", "tn", "tpi", "tr", "ts", "tt", "tum", "tw", "tzm", "ug", "uk", "umb", "ur", "uzn", "vec", "vi", "war", "wo", "xh", "ydd", "yo", "zh", "zh-CN", "zh-TW", "zsm", "zu"],
            tgtLangs: ["ace", "af", "ak", "als", "am", "ar", "as", "ast", "awa", "ayr", "az", "azb", "azj", "ba", "ban", "be", "bem", "bg", "bho", "bjn", "bm", "bn", "bo", "bs", "bug", "ca", "ceb", "cjk", "ckb", "crh", "cs", "cy", "da", "de", "dik", "diq", "dyu", "dz", "ee", "el", "en", "eo", "es", "es-419", "es-ES", "et", "fi", "fj", "fo", "fon", "fr", "fur", "fuv", "ga", "gaz", "gd", "gl", "gn", "gu", "ha", "he", "hi", "hne", "hr", "ht", "hu", "hy", "id", "ig", "ilo", "is", "it", "ja", "jv", "ka", "kab", "kac", "kam", "kas", "kbp", "kea", "kg", "khk", "ki", "kk", "km", "kmb", "kmr", "kn", "knc", "ko", "ks", "ky", "la", "lb", "lg", "li", "lij", "lmo", "ln", "lo", "lt", "ltg", "lua", "luo", "lus", "lv", "lvs", "mag", "mai", "mg", "mi", "min", "mk", "ml", "mn", "mni", "mos", "mr", "ms", "mt", "my", "nb", "ne", "nl", "nn", "nso", "nus", "ny", "oc", "or", "pa", "pag", "pap", "pbt", "pes", "pl", "plt", "prs", "ps", "pt", "pt-BR", "pt-PT", "quy", "rn", "ro", "ru", "rw", "sa", "sat", "sc", "scn", "sd", "sg", "shn", "si", "sk", "sl", "sm", "sn", "so", "sq", "sr", "ss", "st", "su", "sv", "sw", "szl", "ta", "taq", "te", "tg", "th", "ti", "tk", "tl", "tn", "tpi", "tr", "ts", "tt", "tum", "tw", "tzm", "ug", "uk", "umb", "ur", "uzn", "vec", "vi", "war", "wo", "xh", "ydd", "yo", "zh", "zh-CN", "zh-TW", "zsm", "zu"]
        }
    };
    currentSegment: SegmentId;

    constructor(preferences: Preferences, srcLang: string, tgtLang: string) {
        this.currentSegment = { file: '', unit: '', id: '' };
        this.mtEngines = [];
        this.srcLang = srcLang;
        this.tgtLang = tgtLang;
        this.translationFailures = [];
        this.currentProject = '';
        this.translationLimiter = new ConcurrencyLimiter(DEFAULT_TRANSLATION_CONCURRENCY);
        this.matchUpdateLimiter = new ConcurrencyLimiter(DEFAULT_MATCH_UPDATE_CONCURRENCY);
        this.translationRetryOptions = { ...DEFAULT_TRANSLATION_RETRY_OPTIONS };
        this.matchUpdateRetryOptions = { ...DEFAULT_MATCH_UPDATE_RETRY_OPTIONS };
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
            chatGptTranslator.setModel(preferences.chatGpt.model);
            this.mtEngines.push(chatGptTranslator);
            if (preferences.chatGpt.fixTags) {
                this.tagFixer = chatGptTranslator;
            }
        }
        if (preferences.anthropic.enabled) {
            let anthropicTranslator: AnthropicTranslator = new AnthropicTranslator(preferences.anthropic.apiKey, preferences.anthropic.model);
            anthropicTranslator.setSourceLanguage(srcLang);
            anthropicTranslator.setTargetLanguage(tgtLang);
            anthropicTranslator.setModel(preferences.anthropic.model);
            this.mtEngines.push(anthropicTranslator);
            if (preferences.anthropic.fixTags) {
                this.tagFixer = anthropicTranslator;
            }
        }
        if (preferences.modernmt.enabled) {
            let modernmtTranslator: ModernMTTranslator = new ModernMTTranslator(preferences.modernmt.apiKey);
            modernmtTranslator.setSourceLanguage(preferences.modernmt.srcLang);
            modernmtTranslator.setTargetLanguage(preferences.modernmt.tgtLang);
            this.mtEngines.push(modernmtTranslator);
        }
        if (preferences.mistral.enabled) {
            let mistralTranslator: MistralTranslator = new MistralTranslator(preferences.mistral.apiKey);
            mistralTranslator.setSourceLanguage(srcLang);
            mistralTranslator.setTargetLanguage(tgtLang);
            mistralTranslator.setModel(preferences.mistral.model);
            this.mtEngines.push(mistralTranslator);
            if (preferences.mistral.fixTags) {
                this.tagFixer = mistralTranslator;
            }
        }
        if (preferences.qwen.enabled) {
            let qwenTranslator: QwenTranslator = new QwenTranslator(preferences.qwen.apiKey, preferences.qwen.region, preferences.qwen.model);
            qwenTranslator.setSourceLanguage(srcLang);
            qwenTranslator.setTargetLanguage(tgtLang);
            this.mtEngines.push(qwenTranslator);
            if (preferences.qwen.fixTags) {
                this.tagFixer = qwenTranslator;
            }
        }
    }

    private resetFailures(): void {
        this.translationFailures = [];
    }

    private recordFailure(engine: string, segment: SegmentId, reason: unknown, project?: string, failures?: MTFailure[]): void {
        let projectId: string = project ?? this.currentProject ?? '';
        let segmentLabel: string = this.describeSegment(segment);
        let message: string = this.describeError(reason);
        let target: MTFailure[] = failures ?? this.translationFailures;
        target.push({
            engine: engine,
            project: projectId,
            segment: segment,
            message: message
        });
        console.warn('MT engine ' + engine + ' failed for ' + (projectId || 'UnknownProject') + ' ' + segmentLabel + ': ' + message);
    }

    private notifyFailures(failures: MTFailure[], message?: string): void {
        if (failures.length === 0) {
            return;
        }
        let engineCounts: Map<string, number> = new Map();
        for (let failure of failures) {
            let current: number = engineCounts.get(failure.engine) ?? 0;
            engineCounts.set(failure.engine, current + 1);
        }
        let engineSummary: string = Array.from(engineCounts.entries()).map((entry: [string, number]) => {
            return entry[0] + ' (' + entry[1] + ')';
        }).join(', ');
        let summaryParts: string[] = [];
        summaryParts.push('Detected ' + failures.length + ' error' + (failures.length === 1 ? '' : 's') + '.');
        if (engineSummary.length > 0) {
            summaryParts.push('Engines: ' + engineSummary + '.');
        }
        let summary: string = summaryParts.join(' ');
        let logEntries: string[] = failures.map((failure: MTFailure) => this.formatFailureLogEntry(failure));
        Swordfish.notifyMtTranslationErrors(summary, logEntries, message);
    }

    private describeError(reason: unknown): string {
        if (reason instanceof Error) {
            return this.annotateHttpStatus(reason.message);
        }
        if (typeof reason === "string") {
            return this.annotateHttpStatus(reason);
        }
        try {
            return this.annotateHttpStatus(JSON.stringify(reason));
        } catch (error) {
            return this.annotateHttpStatus(String(reason));
        }
    }

    private annotateHttpStatus(message: string): string {
        let statusMatch: RegExpMatchArray | null = message.match(/status(?:\s+code)?\s*[:=]?\s*(\d{3})/i);
        if (statusMatch) {
            let code: number = parseInt(statusMatch[1], 10);
            let description: string | undefined = HTTP_STATUS_DESCRIPTIONS[code];
            let locale: string = Swordfish.currentPreferences?.appLang ?? 'en';
            let messageLower: string = message.toLocaleLowerCase(locale);
            let descriptionLower: string = description ? description.toLocaleLowerCase(locale) : '';
            if (description && messageLower.indexOf(descriptionLower) === -1) {
                return message + ' (' + description + ')';
            }
        }
        return message;
    }

    private getEngineName(engine: MTEngine): string {
        if (engine && engine.constructor && engine.constructor.name) {
            return engine.constructor.name;
        }
        return "UnknownMT";
    }

    private describeSegment(segment: SegmentId): string {
        let parts: string[] = [];
        if (segment.file) {
            parts.push(segment.file);
        }
        if (segment.unit) {
            parts.push(segment.unit);
        }
        if (segment.id) {
            parts.push(segment.id);
        }
        if (parts.length === 0) {
            return "Unknown segment";
        }
        return parts.join("/");
    }

    private formatFailureLogEntry(failure: MTFailure): string {
        let projectPart: string = failure.project ? '[' + failure.project + '] ' : '';
        let segmentPart: string = this.describeSegment(failure.segment);
        return projectPart + '[' + failure.engine + '] ' + segmentPart + ': ' + failure.message;
    }

    private async runWithRetry<T>(task: () => Promise<T>, options: RetryOptions): Promise<T> {
        for (let attempt: number = 1; attempt <= options.attempts; attempt++) {
            try {
                return await task();
            } catch (error: unknown) {
                if (attempt === options.attempts) {
                    throw error;
                }
                let baseDelay: number = options.initialDelayMs * attempt;
                let jitter: number = Math.floor(Math.random() * options.jitterMs);
                await this.delay(baseDelay + jitter);
            }
        }
        throw new Error('Retry attempts exhausted');
    }

    private async delay(durationMs: number): Promise<void> {
        return new Promise<void>((resolve: () => void) => {
            setTimeout(resolve, durationMs);
        });
    }

    private async getMatchForEngine(mtEngine: MTEngine, source: XMLElement, terms: { source: string, target: string }[]): Promise<MTMatch> {
        if (mtEngine.handlesTags()) {
            return mtEngine.getMTMatch(source, terms);
        }
        let plainText: string = MTUtils.plainText(source);
        let plainSource: XMLElement = MTUtils.toXMLElement('<source>' + plainText + '</source>');
        return mtEngine.getMTMatch(plainSource, terms);
    }

    async translateProject(project: string, exportedFile: string, currentSegment: SegmentId): Promise<boolean> {
        this.resetFailures();
        this.currentProject = project;
        this.currentSegment = currentSegment;
        let parser: SAXParser = new SAXParser();
        let pendingTranslations: Promise<void>[] = [];
        let handler: MTContentHandler = new MTContentHandler(this, project, pendingTranslations);
        parser.setContentHandler(handler);
        try {
            parser.parseFile(exportedFile);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error("Error translating project: " + error.message);
                console.error(error.stack);
                console.log('exportedFile=' + exportedFile);
                throw error;
            }
            throw error;
        }

        if (pendingTranslations.length > 0) {
            let settled = await Promise.allSettled(pendingTranslations);
            for (let i = 0; i < settled.length; i++) {
                let result = settled[i];
                if (result.status === "rejected") {
                    this.recordFailure("SegmentTranslation", { file: '', unit: '', id: '' }, result.reason, project);
                }
            }
        }

        let hadFailures: boolean = this.translationFailures.length > 0;
        if (hadFailures) {
            // Count segments where all engines failed
            let allEnginesFailedCount: number = this.translationFailures.filter(
                (failure: MTFailure) => failure.engine === "All Engines Failed"
            ).length;

            let userMessage: string = '';
            if (allEnginesFailedCount > 0) {
                userMessage = allEnginesFailedCount + " segment" + (allEnginesFailedCount === 1 ? " was" : "s were") + " not translated due to errors.";
            }

            this.notifyFailures(this.translationFailures, userMessage);
        }
        this.resetFailures();
        this.currentProject = '';
        return hadFailures;
    }

    async translateElement(source: XMLElement, project: string, file: string, unit: string, segment: string, terms: { source: string, target: string }[]): Promise<void> {
        return this.translationLimiter.run(async () => {
            let segmentId: SegmentId = { file: file, unit: unit, id: segment };
            try {
                let matchPromises: Promise<MTMatch>[] = this.mtEngines.map((mtEngine: MTEngine) => this.runWithRetry(() => this.getMatchForEngine(mtEngine, source, terms), this.translationRetryOptions));
                let results = await Promise.allSettled(matchPromises);
                let translations: MTMatch[] = [];
                let engineCount: number = 0;
                for (let i = 0; i < results.length; i++) {
                    let result = results[i];
                    let engine = this.mtEngines[i];
                    let engineName = this.getEngineName(engine);
                    engineCount++;
                    if (result.status === "fulfilled") {
                        translations.push(result.value);
                    } else {
                        this.recordFailure(engineName, segmentId, result.reason, project);
                    }
                }
                if (translations.length > 0) {
                    this.setMTMatches({
                        project: project,
                        file: file,
                        unit: unit,
                        segment: segment,
                        srcLang: this.srcLang,
                        tgtLang: this.tgtLang,
                        translations: translations,
                        currentSegment: this.currentSegment
                    });
                } else if (engineCount > 0) {
                    // All engines failed for this segment - record as failure
                    this.recordFailure("All Engines Failed", segmentId, new Error("All translation engines failed for this segment"), project);
                }
            } catch (error: unknown) {
                this.recordFailure("translateElement", segmentId, error, project);
            }
        });
    }

    fixTags(params: any): void {
        if (!this.tagFixer) {
            return;
        }
        let engineName: string = this.getEngineName(this.tagFixer);
        let projectId: string | undefined = typeof params.project === 'string' ? params.project : undefined;
        let segmentId: SegmentId = {
            file: params.file ?? '',
            unit: params.unit ?? '',
            id: params.segment ?? ''
        };
        let failures: MTFailure[] = [];
        let handleFailure = (error: unknown): void => {
            this.recordFailure(engineName, segmentId, error, projectId, failures);
            this.notifyFailures(failures, 'There were errors fixing tags');
            Swordfish.mainWindow.webContents.send('end-waiting');
            Swordfish.mainWindow.webContents.send('set-status', '');
        };
        try {
            this.tagFixer.fixTags(
                MTUtils.toXMLElement(params.source),
                MTUtils.toXMLElement(params.target)
            ).then((result: XMLElement) => {
                params.target = result.toString();
                this.setTarget(params);
            }).catch((error: any) => {
                handleFailure(error);
            });
        } catch (error: any) {
            handleFailure(error);
        }
    }

    setTarget(params: any): void {
        fetch('http://127.0.0.1:8070/projects/setTarget', {
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
                let args: any = {
                    project: params.project,
                    file: params.file,
                    unit: params.unit,
                    segment: params.segment,
                    target: json.target
                };
                Swordfish.updateTarget(args);
            } else {
                throw new Error("Error setting fixed target: " + response.statusText);
            }
        }).catch((error: any) => {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error("Error setting fixed target");
        });
    }

    fixMatch(params: any): void {
        let failures: MTFailure[] = [];
        let projectId: string | undefined = typeof params.project === 'string' ? params.project : undefined;
        let segmentId: SegmentId = {
            file: params.file ?? '',
            unit: params.unit ?? '',
            id: params.segment ?? ''
        };
        try {
            let promises: Promise<MTMatch>[] = [];
            let engines: MTEngine[] = [];
            for (let mtEngine of this.mtEngines) {
                if (mtEngine.fixesMatches()) {
                    promises.push(this.runWithRetry(() => mtEngine.fixMatch(
                        MTUtils.toXMLElement(params.source),
                        MTUtils.toXMLElement(params.matchSource),
                        MTUtils.toXMLElement(params.matchTarget)
                    ), this.translationRetryOptions));
                    engines.push(mtEngine);
                }
            }
            Promise.allSettled(promises).then((results) => {
                let translations: MTMatch[] = [];
                for (let i = 0; i < results.length; i++) {
                    let result = results[i];
                    let engine = engines[i];
                    let engineName: string = this.getEngineName(engine);
                    if (result.status === "fulfilled") {
                        translations.push(result.value);
                    } else {
                        this.recordFailure(engineName, segmentId, result.reason, projectId, failures);
                    }
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
                if (failures.length > 0) {
                    this.notifyFailures(failures, 'There were errors fixing matches');
                }
            }).catch((error: any) => {
                this.recordFailure('fixMatch', segmentId, error, projectId, failures);
                this.notifyFailures(failures, 'There were errors fixing matches');
            });
        } catch (error: any) {
            this.recordFailure('fixMatch', segmentId, error, projectId, failures);
            this.notifyFailures(failures, 'There were errors fixing matches');
        }
    }

    translateSegment(params: any): void {
        Swordfish.mainWindow.webContents.send('start-waiting');
        Swordfish.mainWindow.webContents.send('set-status', 'Getting Translations');
        this.getSegment(params, (segment: any) => {
            let promises: Promise<MTMatch>[] = [];
            let engines: MTEngine[] = [];
            let failures: MTFailure[] = [];
            let projectId: string | undefined = typeof params.project === 'string' ? params.project : undefined;
            let segmentId: SegmentId = {
                file: params.file,
                unit: params.unit,
                id: params.segment
            };
            if (!segmentId.file || !segmentId.unit || !segmentId.id) {
                Swordfish.mainWindow.webContents.send('end-waiting');
                Swordfish.mainWindow.webContents.send('set-status', '');
                Swordfish.showMessage({ type: 'error', message: 'Missing segment identifiers for translation.' });
                return;
            }
            for (let mtEngine of this.mtEngines) {
                let matchPromise: Promise<MTMatch>;
                if (mtEngine.handlesTags()) {
                    matchPromise = this.runWithRetry(() => mtEngine.getMTMatch(MTUtils.toXMLElement(segment.source), segment.terms), this.translationRetryOptions);
                } else {
                    matchPromise = this.runWithRetry(() => mtEngine.getMTMatch(MTUtils.toXMLElement(segment.plainText), segment.terms), this.translationRetryOptions);
                }
                promises.push(matchPromise);
                engines.push(mtEngine);
            }
            Promise.allSettled(promises).then((results) => {
                let translations: MTMatch[] = [];
                for (let i = 0; i < results.length; i++) {
                    let result = results[i];
                    let engine = engines[i];
                    let engineName: string = this.getEngineName(engine);
                    if (result.status === 'fulfilled') {
                        translations.push(result.value);
                    } else {
                        this.recordFailure(engineName, segmentId, result.reason, projectId, failures);
                    }
                }
                if (translations.length > 0 || engines.length === 0) {
                    params.translations = translations;
                    params.reload = true;
                    this.setMTMatches(params);
                    Swordfish.mainWindow.webContents.send('end-waiting');
                    Swordfish.mainWindow.webContents.send('set-status', '');
                } else {
                    Swordfish.mainWindow.webContents.send('end-waiting');
                    Swordfish.mainWindow.webContents.send('set-status', '');
                }
                if (failures.length > 0) {
                    this.notifyFailures(failures, 'There were errors translating the segment');
                }
            }).catch((error: any) => {
                this.recordFailure('translateSegment', segmentId, error, projectId, failures);
                this.notifyFailures(failures, 'There were errors translating the segment');
                Swordfish.mainWindow.webContents.send('end-waiting');
                Swordfish.mainWindow.webContents.send('set-status', '');
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

    getSegment(params: any, resolve: Function, reject: Function): void {
        fetch('http://127.0.0.1:8070/projects/getSegment', {
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
        this.matchUpdateLimiter.run(() => this.performSetMTMatches(params)).catch((error: unknown) => {
            this.recordFailure("setMTMatches", {
                file: params.file ?? '',
                unit: params.unit ?? '',
                id: params.segment ?? ''
            }, error, typeof params.project === 'string' ? params.project : undefined);
        });
    }

    private async performSetMTMatches(params: any): Promise<void> {
        await this.runWithRetry(async () => {
            const response: Response = await fetch('http://127.0.0.1:8070/projects/setMTMatches', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(params)
            });
            if (!response.ok) {
                throw new Error("Error setting MT matches: " + response.statusText);
            }
            const json: any = await response.json();
            if (json.status !== 'Success') {
                console.error("Received " + JSON.stringify(json));
                throw new Error(json.reason);
            }
            if (params.currentSegment) {
                const current: SegmentId = params.currentSegment;
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
        }, this.matchUpdateRetryOptions);
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
                let l: Language | undefined = LanguageUtils.getLanguage(lang, 'en');
                if (l) {
                    result.push(l);
                }
            } catch (error) {
                // ignore unsupported tags
            }
        }
        result.sort((a: Language, b: Language) => {
            return a.description.localeCompare(b.description);
        });
        return result;
    }

}