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

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

import com.maxprograms.mt.AzureTranslator;
import com.maxprograms.mt.DeepLTranslator;
import com.maxprograms.mt.GoogleTranslator;
import com.maxprograms.mt.MTranslator;
import com.maxprograms.mt.MyMemoryTranslator;
import com.maxprograms.mt.YandexTranslator;
import com.maxprograms.swordfish.TmsServer;

import org.json.JSONObject;

public class MT {

    private MTranslator translator;

    private boolean googleEnabled;
    private String googleKey;
    private String googleSrcLang;
    private String googleTgtLang;
    private boolean neural;

    private boolean azureEnabled;
    private String azureKey;
    private String azureSrcLang;
    private String azureTgtLang;

    private boolean yandexEnabled;
    private String yandexKey;
    private String yandexSrcLang;
    private String yandexTgtLang;

    private boolean deeplEnabled;
    private String deeplKey;
    private String deeplSrcLang;
    private String deeplTgtLang;

    private boolean myMemoryEnabled;
    private String myMemoryKey;
    private String myMemorySrcLang;
    private String myMemoryTgtLang;

    public MT() throws IOException {
        loadDefaults();
        translator = new MTranslator();
        if (azureEnabled) {
            AzureTranslator az = new AzureTranslator(azureKey);
            az.setSourceLanguage(azureSrcLang);
            az.setTargetLanguage(azureTgtLang);
            translator.addEngine(az);
        }
        if (googleEnabled) {
            GoogleTranslator gt = new GoogleTranslator(googleKey, neural);
            gt.setSourceLanguage(googleSrcLang);
            gt.setTargetLanguage(googleTgtLang);
            translator.addEngine(gt);
        }
        if (yandexEnabled) {
            YandexTranslator yt = new YandexTranslator(yandexKey);
            yt.setSourceLanguage(yandexSrcLang);
            yt.setTargetLanguage(yandexTgtLang);
            translator.addEngine(yt);
        }
        if (deeplEnabled) {
            DeepLTranslator dl = new DeepLTranslator(deeplKey);
            dl.setSourceLanguage(deeplSrcLang);
            dl.setTargetLanguage(deeplTgtLang);
            translator.addEngine(dl);
        }
        if (myMemoryEnabled) {
            MyMemoryTranslator mm = new MyMemoryTranslator(myMemoryKey);
            mm.setSourceLanguage(myMemorySrcLang);
            mm.setTargetLanguage(myMemoryTgtLang);
            translator.addEngine(mm);
        }
    }

    public boolean hasEngines() {
        return translator.hasEngines();
    }

    private void loadDefaults() throws IOException {
        File preferences = new File(TmsServer.getWorkFolder(), "preferences.json");
        StringBuilder builder = new StringBuilder();
        try (FileReader reader = new FileReader(preferences, StandardCharsets.UTF_8)) {
            try (BufferedReader buffer = new BufferedReader(reader)) {
                String line = "";
                while ((line = buffer.readLine()) != null) {
                    builder.append(line);
                }
            }
        }
        JSONObject json = new JSONObject(builder.toString());

        JSONObject google = json.getJSONObject("google");
        googleEnabled = google.getBoolean("enabled");
        googleKey = google.getString("apiKey");
        googleSrcLang = google.getString("srcLang");
        googleTgtLang = google.getString("tgtLang");
        neural = google.getBoolean("neural");

        JSONObject azure = json.getJSONObject("azure");
        azureEnabled = azure.getBoolean("enabled");
        azureKey = azure.getString("apiKey");
        azureSrcLang = azure.getString("srcLang");
        azureTgtLang = azure.getString("tgtLang");

        JSONObject yandex = json.getJSONObject("yandex");
        yandexEnabled = yandex.getBoolean("enabled");
        yandexKey = yandex.getString("apiKey");
        yandexSrcLang = yandex.getString("srcLang");
        yandexTgtLang = yandex.getString("tgtLang");

        JSONObject deepl = json.getJSONObject("deepl");
        deeplEnabled = deepl.getBoolean("enabled");
        deeplKey = deepl.getString("apiKey");
        deeplSrcLang = deepl.getString("srcLang");
        deeplTgtLang = deepl.getString("tgtLang");

        JSONObject myMemory = json.getJSONObject("myMemory");
        myMemoryEnabled = myMemory.getBoolean("enabled");
        myMemoryKey = myMemory.getString("apiKey");
        myMemorySrcLang = myMemory.getString("srcLang");
        myMemoryTgtLang = myMemory.getString("tgtLang");
    }

    public List<JSONObject> translate(String text) throws IOException, InterruptedException {
       return translator.translate(text);
    }
}