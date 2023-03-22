/*******************************************************************************
 * Copyright (c) 2023 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/

package com.maxprograms.swordfish.mt;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import com.maxprograms.languages.Language;
import com.maxprograms.languages.LanguageUtils;

import org.json.JSONArray;
import org.json.JSONObject;

public class MTUtils {

        private MTUtils() {
                // empty for security
        }

        private static String[] azureSrcLanguages = { "rn", "ny", "lg", "af", "sq", "am", "ar", "hy", "as", "az",
                        "ba", "eu", "bn", "bs", "bg", "my", "ca", "zh-Hans", "zh-Hant", "hr", "cs", "da", "prs", "dv",
                        "nl", "en", "et", "fo", "fj", "fil", "fi", "fr", "fr-CA", "gl", "ka", "de", "el", "gu", "ht",
                        "ha", "he", "hi", "mww", "hu", "is", "ig", "id", "ikt", "iu", "iu-Latn", "ga", "it", "ja", "kn",
                        "kk", "km", "rw", "ky", "tlh-Piqd", "tlh-Latn", "ko", "ku", "lo", "lv", "ln", "lzh", "lt", "mk",
                        "mg", "ms", "ml", "mt", "mi", "mr", "mn-Cyrl", "mn-Mong", "ne", "kmr", "nb", "or", "pa", "nso",
                        "fa", "pl", "pt", "pt-PT", "ps", "otq", "ro", "ru", "sm", "sr-Cyrl", "sr-Latn", "sn", "sk",
                        "sl", "so", "st", "es", "sw", "sv", "ty", "ta", "tt", "te", "th", "bo", "ti", "to", "tn", "tr",
                        "tk", "ug", "uk", "hsb", "ur", "uz", "vi", "cy", "xh", "yo", "yua", "yue", "zu" };

        private static String[] azureTgtLanguages = { "rn", "ny", "lg", "af", "sq", "am", "ar", "hy", "as", "az",
                        "ba", "eu", "bn", "bs", "bg", "my", "ca", "zh-Hans", "zh-Hant", "hr", "cs", "da", "prs", "dv",
                        "nl", "en", "et", "fo", "fj", "fil", "fi", "fr", "fr-CA", "gl", "ka", "de", "el", "gu", "ht",
                        "ha", "he", "hi", "mww", "hu", "is", "ig", "id", "ikt", "iu", "iu-Latn", "ga", "it", "ja", "kn",
                        "kk", "km", "rw", "ky", "tlh-Piqd", "tlh-Latn", "ko", "ku", "lo", "lv", "ln", "lzh", "lt", "mk",
                        "mg", "ms", "ml", "mt", "mi", "mr", "mn-Cyrl", "mn-Mong", "ne", "kmr", "nb", "or", "pa", "nso",
                        "fa", "pl", "pt", "pt-PT", "ps", "otq", "ro", "ru", "sm", "sr-Cyrl", "sr-Latn", "sn", "sk",
                        "sl", "so", "st", "es", "sw", "sv", "ty", "ta", "tt", "te", "th", "bo", "ti", "to", "tn", "tr",
                        "tk", "ug", "uk", "hsb", "ur", "uz", "vi", "cy", "xh", "yo", "yua", "yue", "zu" };

        private static String[] gtSrcLanguages = { "af", "ak", "sq", "am", "ar", "hy", "as", "ay", "az", "bm", "eu",
                        "be", "bn", "bho", "bs", "bg", "my", "ca", "ceb", "ckb", "zh", "zh-CN", "zh-TW", "co", "hr",
                        "cs", "da", "dv", "doi", "nl", "en", "eo", "et", "ee", "fi", "fr", "gl", "lg", "ka", "de",
                        "gom", "el", "gn", "gu", "ht", "ha", "haw", "he", "iw", "hi", "hmn", "hu", "is", "ig", "ilo",
                        "id", "ga", "it", "ja", "jv", "jw", "kn", "kk", "km", "rw", "ky", "ko", "kri", "ku", "lo", "la",
                        "lv", "ln", "lt", "lus", "lb", "mk", "mai", "mg", "ms", "ml", "mt", "mni-Mtei", "mi", "mr",
                        "mn", "ne", "no", "ny", "or", "om", "pa", "nso", "fa", "pl", "pt", "ps", "qu", "ro", "ru", "sm",
                        "sa", "gd", "sr", "sn", "sd", "si", "sk", "sl", "so", "st", "es", "su", "sw", "sv", "tl", "tg",
                        "ta", "tt", "te", "th", "ti", "ts", "tr", "tk", "ug", "uk", "ur", "uz", "vi", "cy", "fy", "xh",
                        "yi", "yo", "zu" };

        private static String[] gtTgtLanguages = { "af", "ak", "sq", "am", "ar", "hy", "as", "ay", "az", "bm", "eu",
                        "be", "bn", "bho", "bs", "bg", "my", "ca", "ceb", "ckb", "zh", "zh-CN", "zh-TW", "co", "hr",
                        "cs", "da", "dv", "doi", "nl", "en", "eo", "et", "ee", "fi", "fr", "gl", "lg", "ka", "de",
                        "gom", "el", "gn", "gu", "ht", "ha", "haw", "he", "iw", "hi", "hmn", "hu", "is", "ig", "ilo",
                        "id", "ga", "it", "ja", "jv", "jw", "kn", "kk", "km", "rw", "ky", "ko", "kri", "ku", "lo", "la",
                        "lv", "ln", "lt", "lus", "lb", "mk", "mai", "mg", "ms", "ml", "mt", "mni-Mtei", "mi", "mr",
                        "mn", "ne", "no", "ny", "or", "om", "pa", "nso", "fa", "pl", "pt", "ps", "qu", "ro", "ru", "sm",
                        "sa", "gd", "sr", "sn", "sd", "si", "sk", "sl", "so", "st", "es", "su", "sw", "sv", "tl", "tg",
                        "ta", "tt", "te", "th", "ti", "ts", "tr", "tk", "ug", "uk", "ur", "uz", "vi", "cy", "fy", "xh",
                        "yi", "yo", "zu" };

        private static String[] gtSrcNmtLangs = { "af", "ak", "sq", "am", "ar", "hy", "as", "ay", "az", "bm", "eu",
                        "be", "bn", "bho", "bs", "bg", "my", "ca", "ceb", "ckb", "zh", "zh-CN", "zh-TW", "co", "hr",
                        "cs", "da", "dv", "doi", "nl", "en", "eo", "et", "ee", "fi", "fr", "gl", "lg", "ka", "de",
                        "gom", "el", "gn", "gu", "ht", "ha", "haw", "he", "iw", "hi", "hmn", "hu", "is", "ig", "ilo",
                        "id", "ga", "it", "ja", "jv", "jw", "kn", "kk", "km", "rw", "ky", "ko", "kri", "ku", "lo", "la",
                        "lv", "ln", "lt", "lus", "lb", "mk", "mai", "mg", "ms", "ml", "mt", "mni-Mtei", "mi", "mr",
                        "mn", "ne", "no", "ny", "or", "om", "pa", "nso", "fa", "pl", "pt", "ps", "qu", "ro", "ru", "sm",
                        "sa", "gd", "sr", "sn", "sd", "si", "sk", "sl", "so", "st", "es", "su", "sw", "sv", "tl", "tg",
                        "ta", "tt", "te", "th", "ti", "ts", "tr", "tk", "ug", "uk", "ur", "uz", "vi", "cy", "fy", "xh",
                        "yi", "yo", "zu" };

        private static String[] gtTgtNmtLangs = { "af", "ak", "sq", "am", "ar", "hy", "as", "ay", "az", "bm", "eu",
                        "be", "bn", "bho", "bs", "bg", "my", "ca", "ceb", "ckb", "zh", "zh-CN", "zh-TW", "co", "hr",
                        "cs", "da", "dv", "doi", "nl", "en", "eo", "et", "ee", "fi", "fr", "gl", "lg", "ka", "de",
                        "gom", "el", "gn", "gu", "ht", "ha", "haw", "he", "iw", "hi", "hmn", "hu", "is", "ig", "ilo",
                        "id", "ga", "it", "ja", "jv", "jw", "kn", "kk", "km", "rw", "ky", "ko", "kri", "ku", "lo", "la",
                        "lv", "ln", "lt", "lus", "lb", "mk", "mai", "mg", "ms", "ml", "mt", "mni-Mtei", "mi", "mr",
                        "mn", "ne", "no", "ny", "or", "om", "pa", "nso", "fa", "pl", "pt", "ps", "qu", "ro", "ru", "sm",
                        "sa", "gd", "sr", "sn", "sd", "si", "sk", "sl", "so", "st", "es", "su", "sw", "sv", "tl", "tg",
                        "ta", "tt", "te", "th", "ti", "ts", "tr", "tk", "ug", "uk", "ur", "uz", "vi", "cy", "fy", "xh",
                        "yi", "yo", "zu" };

        private static String[] yandexSrcLanguages = { "ka-Latn", "uz-Cyrl", "af", "sq", "am", "ar", "hy", "az", "ba",
                        "eu", "be", "bn", "bs", "bg", "my", "ca", "ceb", "zh", "cv", "hr", "cs", "da", "nl", "mhr",
                        "en", "eo", "et", "fi", "fr", "gl", "ka", "de", "el", "gu", "ht", "he", "hi", "hu", "is", "id",
                        "ga", "it", "ja", "jv", "kn", "kk", "km", "ky", "ko", "lo", "la", "lv", "lt", "lb", "mk", "mg",
                        "ms", "ml", "mt", "mi", "mr", "mn", "ne", "no", "pa", "pap", "fa", "pl", "pt", "ro", "ru", "gd",
                        "sr", "si", "sk", "sl", "es", "su", "sw", "sv", "tl", "tg", "ta", "tt", "te", "th", "tr", "udm",
                        "uk", "ur", "uz", "vi", "cy", "mrj", "xh", "sah", "yi", "zu" };

        private static String[] yandexTgtLanguages = { "ka-Latn", "uz-Cyrl", "af", "sq", "am", "ar", "hy", "az", "ba",
                        "eu", "be", "bn", "bs", "bg", "my", "ca", "ceb", "zh", "cv", "hr", "cs", "da", "nl", "mhr",
                        "en", "eo", "et", "fi", "fr", "gl", "ka", "de", "el", "gu", "ht", "he", "hi", "hu", "is", "id",
                        "ga", "it", "ja", "jv", "kn", "kk", "km", "ky", "ko", "lo", "la", "lv", "lt", "lb", "mk", "mg",
                        "ms", "ml", "mt", "mi", "mr", "mn", "ne", "no", "pa", "pap", "fa", "pl", "pt", "ro", "ru", "gd",
                        "sr", "si", "sk", "sl", "es", "su", "sw", "sv", "tl", "tg", "ta", "tt", "te", "th", "tr", "udm",
                        "uk", "ur", "uz", "vi", "cy", "mrj", "xh", "sah", "yi", "zu", };

        private static String[] yandexDirections = { "az-ru", "be-bg", "be-cs", "be-de", "be-en", "be-es", "be-fr",
                        "be-it", "be-pl", "be-ro", "be-ru", "be-sr", "be-tr", "bg-be", "bg-ru", "bg-uk", "ca-en",
                        "ca-ru", "cs-be", "cs-en", "cs-ru", "cs-uk", "da-en", "da-ru", "de-be", "de-en", "de-es",
                        "de-fr", "de-it", "de-ru", "de-tr", "de-uk", "el-en", "el-ru", "en-be", "en-ca", "en-cs",
                        "en-da", "en-de", "en-el", "en-es", "en-et", "en-fi", "en-fr", "en-hu", "en-it", "en-lt",
                        "en-lv", "en-mk", "en-nl", "en-no", "en-pt", "en-ru", "en-sk", "en-sl", "en-sq", "en-sv",
                        "en-tr", "en-uk", "es-be", "es-de", "es-en", "es-ru", "es-uk", "et-en", "et-ru", "fi-en",
                        "fi-ru", "fr-be", "fr-de", "fr-en", "fr-ru", "fr-uk", "hr-ru", "hu-en", "hu-ru", "hy-ru",
                        "it-be", "it-de", "it-en", "it-ru", "it-uk", "lt-en", "lt-ru", "lv-en", "lv-ru", "mk-en",
                        "mk-ru", "nl-en", "nl-ru", "no-en", "no-ru", "pl-be", "pl-ru", "pl-uk", "pt-en", "pt-ru",
                        "ro-be", "ro-ru", "ro-uk", "ru-az", "ru-be", "ru-bg", "ru-ca", "ru-cs", "ru-da", "ru-de",
                        "ru-el", "ru-en", "ru-es", "ru-et", "ru-fi", "ru-fr", "ru-hr", "ru-hu", "ru-hy", "ru-it",
                        "ru-lt", "ru-lv", "ru-mk", "ru-nl", "ru-no", "ru-pl", "ru-pt", "ru-ro", "ru-sk", "ru-sl",
                        "ru-sq", "ru-sr", "ru-sv", "ru-tr", "ru-uk", "sk-en", "sk-ru", "sl-en", "sl-ru", "sq-en",
                        "sq-ru", "sr-be", "sr-ru", "sr-uk", "sv-en", "sv-ru", "tr-be", "tr-de", "tr-en", "tr-ru",
                        "tr-uk", "uk-bg", "uk-cs", "uk-de", "uk-en", "uk-es", "uk-fr", "uk-it", "uk-pl", "uk-ro",
                        "uk-ru", "uk-sr", "uk-tr" };

        private static String[] deepLsrcLang = { "bg", "cs", "da", "de", "el", "en", "es", "et", "fi", "fr", "hu", "id",
                        "it", "ja", "ko", "lt", "lv", "nb", "nl", "pl", "pt", "ro", "ru", "sk", "sl", "sv", "tr",
                        "zh" };

        private static String[] deepLtgtLang = { "bg", "cs", "da", "de", "el", "en-GB", "en-US", "es", "et", "fi", "fr",
                        "hu", "id", "it", "ja", "ko", "lt", "lv", "nb", "nl", "pl", "pt-BR", "pt-PT", "ro", "ru", "sk",
                        "sl", "sv", "tr", "zh" };

        public static JSONObject getMTLanguages() throws IOException {
                JSONObject result = new JSONObject();

                JSONObject google = new JSONObject();
                google.put("srcLangs", getLanguages(gtSrcLanguages));
                google.put("tgtLangs", getLanguages(gtTgtLanguages));
                google.put("nmtSrcLangs", getLanguages(gtSrcNmtLangs));
                google.put("nmtTgtLangs", getLanguages(gtTgtNmtLangs));
                result.put("google", google);

                JSONObject azure = new JSONObject();
                azure.put("srcLangs", getLanguages(azureSrcLanguages));
                azure.put("tgtLangs", getLanguages(azureTgtLanguages));
                result.put("azure", azure);

                JSONObject yandex = new JSONObject();
                yandex.put("srcLangs", getLanguages(yandexSrcLanguages));
                yandex.put("tgtLangs", getLanguages(yandexTgtLanguages));
                yandex.put("directions", getDirections(yandexDirections));
                result.put("yandex", yandex);

                JSONObject deepL = new JSONObject();
                deepL.put("srcLangs", getLanguages(deepLsrcLang));
                deepL.put("tgtLangs", getLanguages(deepLtgtLang));
                result.put("deepl", deepL);

                return result;
        }

        private static JSONArray getLanguages(String[] langs) throws IOException {
                JSONArray array = new JSONArray();
                List<Language> languages = new ArrayList<>();
                for (int i = 0; i < langs.length; i++) {
                        languages.add(LanguageUtils.getLanguage(langs[i]));
                }
                Collections.sort(languages);
                for (int i = 0; i < languages.size(); i++) {
                        Language lang = languages.get(i);
                        JSONObject obj = new JSONObject();
                        obj.put("code", lang.getCode());
                        obj.put("description", lang.getDescription());
                        array.put(obj);
                }
                return array;
        }

        private static JSONArray getDirections(String[] dirs) {
                JSONArray array = new JSONArray();
                for (int i = 0; i < dirs.length; i++) {
                        array.put(dirs[i]);
                }
                return array;
        }
}