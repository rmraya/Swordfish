/*****************************************************************************
Copyright (c) 2007-2021 - Maxprograms,  http://www.maxprograms.com/

Permission is hereby granted, free of charge, to any person obtaining a copy of 
this software and associated documentation files (the "Software"), to compile, 
modify and use the Software in its executable form without restrictions.

Redistribution of this Software or parts of it in any form (source code or 
executable binaries) requires prior written permission from Maxprograms.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE 
SOFTWARE.
*****************************************************************************/

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
        
    private static String[] azureSrcLanguages = { "de", "hi", "pt", "ty", "fil", "lt", "hr", "lv", "ht", "mww",
            "hu", "zh-Hans", "zh-Hant", "uk", "mg", "id", "mi", "ur", "ml", "af", "mr", "ms", "el", "mt",
            "en", "is", "it", "otq", "es", "et", "ar", "pt-pt", "tlh-Latn", "vi", "nb", "ja", "fa", "ro",
            "nl", "fi", "ru", "fj", "yua", "bg", "yue", "bn", "fr", "bs", "sk", "sl", "ga", "sm", "ca",
            "kn", "sv", "ko", "sw", "tlh-Piqd", "ta", "gu", "sr-Latn", "cs", "pa", "sr-Cyrl", "te", "th",
            "cy", "to", "pl", "da", "he", "tr" };

    private static String[] azureTgtLanguages = { "de", "hi", "pt", "ty", "fil", "lt", "hr", "lv", "ht", "mww",
            "hu", "zh-Hans", "zh-Hant", "uk", "mg", "id", "mi", "ur", "ml", "af", "mr", "ms", "el", "mt",
            "en", "is", "it", "otq", "es", "et", "ar", "pt-pt", "tlh-Latn", "vi", "nb", "ja", "fa", "ro",
            "nl", "fi", "ru", "fj", "yua", "bg", "yue", "bn", "fr", "bs", "sk", "sl", "ga", "sm", "ca",
            "kn", "sv", "ko", "sw", "tlh-Piqd", "ta", "gu", "sr-Latn", "cs", "pa", "sr-Cyrl", "te", "th",
            "cy", "to", "pl", "da", "he", "tr" };

    private static String[] gtSrcLanguages = { "af", "am", "ar", "az", "be", "bg", "bn", "bs", "ca", "ceb", "co",
            "cs", "cy", "da", "de", "el", "en", "eo", "es", "et", "eu", "fa", "fi", "fr", "fy", "ga", "gd",
            "gl", "gu", "ha", "haw", "he", "hi", "hmn", "hr", "ht", "hu", "hy", "id", "ig", "is", "it",
            "iw", "ja", "jw", "ka", "kk", "km", "kn", "ko", "ku", "ky", "la", "lb", "lo", "lt", "lv", "mg",
            "mi", "mk", "ml", "mn", "mr", "ms", "mt", "my", "ne", "nl", "no", "ny", "or", "pa", "pl", "ps",
            "pt", "ro", "ru", "rw", "sd", "si", "sk", "sl", "sm", "sn", "so", "sq", "sr", "st", "su", "sv",
            "sw", "ta", "te", "tg", "th", "tk", "tl", "tr", "tt", "ug", "uk", "ur", "uz", "vi", "xh", "yi",
            "yo", "zh", "zh-CN", "zh-TW", "zu" };

    private static String[] gtTgtLanguages = { "af", "am", "ar", "az", "be", "bg", "bn", "bs", "ca", "ceb", "co",
            "cs", "cy", "da", "de", "el", "en", "eo", "es", "et", "eu", "fa", "fi", "fr", "fy", "ga", "gd",
            "gl", "gu", "ha", "haw", "he", "hi", "hmn", "hr", "ht", "hu", "hy", "id", "ig", "is", "it",
            "iw", "ja", "jw", "ka", "kk", "km", "kn", "ko", "ku", "ky", "la", "lb", "lo", "lt", "lv", "mg",
            "mi", "mk", "ml", "mn", "mr", "ms", "mt", "my", "ne", "nl", "no", "ny", "or", "pa", "pl", "ps",
            "pt", "ro", "ru", "rw", "sd", "si", "sk", "sl", "sm", "sn", "so", "sq", "sr", "st", "su", "sv",
            "sw", "ta", "te", "tg", "th", "tk", "tl", "tr", "tt", "ug", "uk", "ur", "uz", "vi", "xh", "yi",
            "yo", "zh", "zh-CN", "zh-TW", "zu" };

    private static String[] gtSrcNmtLangs = { "af", "am", "ar", "az", "be", "bg", "bn", "bs", "ca", "ceb", "co",
            "cs", "cy", "da", "de", "el", "en", "eo", "es", "et", "eu", "fa", "fi", "fr", "fy", "ga", "gd",
            "gl", "gu", "ha", "haw", "he", "hi", "hmn", "hr", "ht", "hu", "hy", "id", "ig", "is", "it",
            "iw", "ja", "jw", "ka", "kk", "km", "kn", "ko", "ku", "lb", "lo", "lt", "lv", "mg", "mi", "mk",
            "ml", "mn", "mr", "ms", "mt", "my", "ne", "nl", "no", "ny", "pa", "pl", "ps", "pt", "ro", "ru",
            "sd", "si", "sk", "sl", "sm", "sn", "so", "sq", "sr", "st", "su", "sv", "sw", "ta", "te", "tg",
            "th", "tl", "tr", "uk", "ur", "uz", "vi", "xh", "yi", "yo", "zh", "zh-CN", "zh-TW", "zu" };

    private static String[] gtTgtNmtLangs = { "af", "am", "ar", "az", "be", "bg", "bn", "bs", "ca", "ceb", "co",
            "cs", "cy", "da", "de", "el", "en", "eo", "es", "et", "eu", "fa", "fi", "fr", "fy", "ga", "gd",
            "gl", "gu", "ha", "haw", "he", "hi", "hmn", "hr", "ht", "hu", "hy", "id", "ig", "is", "it",
            "iw", "ja", "jw", "ka", "kk", "km", "kn", "ko", "ku", "lb", "lo", "lt", "lv", "mg", "mi", "mk",
            "ml", "mn", "mr", "ms", "mt", "my", "ne", "nl", "no", "ny", "pa", "pl", "ps", "pt", "ro", "ru",
            "sd", "si", "sk", "sl", "sm", "sn", "so", "sq", "sr", "st", "su", "sv", "sw", "ta", "te", "tg",
            "th", "tl", "tr", "uk", "ur", "uz", "vi", "xh", "yi", "yo", "zh", "zh-CN", "zh-TW", "zu" };

    private static String[] yandexSrcLanguages = { "tt", "de", "hi", "lo", "pt", "lt", "hr", "lv", "ht", "hu", "yi",
            "hy", "uk", "mg", "id", "mi", "ur", "mk", "pap", "ml", "mn", "af", "mr", "uz", "ms", "el", "mt",
            "en", "eo", "is", "it", "am", "my", "es", "zh", "et", "eu", "ar", "vi", "mhr", "ja", "ne", "az",
            "fa", "ro", "nl", "ba", "udm", "ceb", "no", "be", "fi", "ru", "bg", "bn", "fr", "jv", "bs",
            "ka", "si", "sk", "sl", "ga", "sah", "gd", "ca", "sq", "sr", "kk", "km", "su", "kn", "sv", "ko",
            "mrj", "sw", "gl", "ta", "gu", "ky", "cs", "xh", "pa", "te", "cv", "tg", "th", "la", "cy", "lb",
            "tl", "pl", "da", "he", "tr" };

    private static String[] yandexTgtLanguages = { "tt", "de", "hi", "lo", "pt", "lt", "hr", "lv", "ht", "hu", "yi",
            "hy", "uk", "mg", "id", "mi", "ur", "mk", "pap", "ml", "mn", "af", "mr", "uz", "ms", "el", "mt",
            "en", "eo", "is", "it", "am", "my", "es", "zh", "et", "eu", "ar", "vi", "mhr", "ja", "ne", "az",
            "fa", "ro", "nl", "ba", "udm", "ceb", "no", "be", "fi", "ru", "bg", "bn", "fr", "jv", "bs",
            "ka", "si", "sk", "sl", "ga", "sah", "gd", "ca", "sq", "sr", "kk", "km", "su", "kn", "sv", "ko",
            "mrj", "sw", "gl", "ta", "gu", "ky", "cs", "xh", "pa", "te", "cv", "tg", "th", "la", "cy", "lb",
            "tl", "pl", "da", "he", "tr" };

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

    private static String[] deepLsrcLang = { "de", "en", "fr", "it", "ja", "es", "nl", "pl", "pt", "ru", "zh" };

    private static String[] deepLtgtLang = { "de", "en-GB", "en-US", "fr", "it", "ja", "es", "nl", "pl", "pt", "pt-BR", "ru",
            "zh" };

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