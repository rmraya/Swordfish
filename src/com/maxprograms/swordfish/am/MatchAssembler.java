/*****************************************************************************
Copyright (c) 2007-2020 - Maxprograms,  http://www.maxprograms.com/

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

package com.maxprograms.swordfish.am;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import javax.xml.parsers.ParserConfigurationException;

import com.maxprograms.languages.Language;
import com.maxprograms.languages.LanguageUtils;
import com.maxprograms.swordfish.Constants;
import com.maxprograms.swordfish.tm.ITmEngine;
import com.maxprograms.swordfish.tm.Match;
import com.maxprograms.swordfish.tm.MatchQuality;
import com.maxprograms.swordfish.tm.NGrams;
import com.maxprograms.swordfish.tm.TMUtils;
import com.maxprograms.swordfish.xliff.DifferenceTagger;
import com.maxprograms.swordfish.xliff.XliffStore;
import com.maxprograms.swordfish.xliff.XliffUtils;
import com.maxprograms.xml.Document;
import com.maxprograms.xml.Element;
import com.maxprograms.xml.SAXBuilder;
import com.maxprograms.xml.XMLUtils;

import org.json.JSONObject;
import org.xml.sax.SAXException;

public class MatchAssembler {

    private static final String START = "<span class='difference'>";
    private static final String END = "</span>";

    private static SAXBuilder builder;

    public static Match assembleMatch(Element segmentSource, String textOnly, List<Match> tmMatches,
            ITmEngine glossEngine, String srcLang, String tgtLang)
            throws IOException, ParserConfigurationException, SAXException, SQLException {
        List<Match> result = new ArrayList<>();

        String pureText = textOnly.trim();
        Set<String> visited = new HashSet<>();
        int mrkId = 1;

        for (int i = 0; i < tmMatches.size(); i++) {
            Match match = tmMatches.get(i);
            Element source = XliffUtils.toXliff("source", match.getSource(), new JSONObject());
            Element target = XliffUtils.toXliff("target", match.getTarget(), new JSONObject());
            String pureSource = XliffUtils.pureText(source).trim();

            if (visited.contains(pureSource)) {
                continue;
            }
            visited.add(pureSource);

            String pureTarget = XliffUtils.pureText(target);

            DifferenceTagger tagger = new DifferenceTagger(pureText, pureSource);
            String taggedSrc = tagger.getXDifferences();
            String taggedTgt = tagger.getYDifferences();

            int srcDiffs = countDiffs(taggedSrc);
            int tgtDiffs = countDiffs(taggedTgt);

            if (srcDiffs == tgtDiffs) {

                int srcStart = taggedSrc.indexOf(START);
                int srcEnd = taggedSrc.indexOf(END);
                int tgtStart = taggedTgt.indexOf(START);
                int tgtEnd = taggedTgt.indexOf(END);

                for (int j = 0; j < srcDiffs; j++) {
                    // get the difference in source and match source
                    String srcDiff = taggedSrc.substring(srcStart + START.length(), srcEnd);
                    String tgtDiff = taggedTgt.substring(tgtStart + START.length(), tgtEnd);

                    if (isNumeric(srcDiff) && isNumeric(tgtDiff)) {
                        // if difference is a numeric expression
                        if (countInstances(pureTarget, tgtDiff) == 1 && countInstances(pureSource, tgtDiff) == 1) {
                            pureSource = pureSource.replace(tgtDiff, "<mrk type=\"term\" id=\"mrk" + mrkId
                                    + "\" value=\"auto-translation\">" + srcDiff + "</mrk>");
                            pureTarget = pureTarget.replace(tgtDiff, "<mrk type=\"term\" id=\"mrk" + mrkId
                                    + "\" value=\"auto-translation\">" + srcDiff + "</mrk>");
                            mrkId++;
                        }
                    } else if (isEmail(srcDiff) && isEmail(tgtDiff)) {
                        // if difference is an email address
                        if (countInstances(pureTarget, tgtDiff) == 1 && countInstances(pureSource, tgtDiff) == 1) {
                            pureSource = pureSource.replace(tgtDiff, "<mrk type=\"term\" id=\"mrk" + mrkId
                                    + "\" value=\"auto-translation\">" + srcDiff + "</mrk>");
                            pureTarget = pureTarget.replace(tgtDiff, "<mrk type=\"term\" id=\"mrk" + mrkId
                                    + "\" value=\"auto-translation\">" + srcDiff + "</mrk>");
                            mrkId++;
                        }
                    } else {
                        // difference may be term
                        List<Match> tgtList = glossEngine.searchTranslation(tgtDiff, srcLang, tgtLang, 100, true);
                        List<Match> srcList = glossEngine.searchTranslation(srcDiff, srcLang, tgtLang, 100, true);

                        if (!srcList.isEmpty() && !tgtList.isEmpty()) {
                            String tgtTerm = tgtList.get(0).getTarget().getText();
                            String srcTerm = srcList.get(0).getTarget().getText();
                            String origSource = srcList.get(0).getSource().getText();

                            pureSource = pureSource.replace(tgtDiff, "<mrk type=\"term\" id=\"mrk" + mrkId
                                    + "\" value=\"" + XMLUtils.cleanText(srcTerm) + "\">" + srcDiff + "</mrk>");
                            pureTarget = pureTarget.replace(tgtTerm, "<mrk type=\"term\" id=\"mrk" + mrkId
                                    + "\" value=\"" + XMLUtils.cleanText(origSource) + "\">" + srcTerm + "</mrk>");
                            mrkId++;
                        }
                    }
                    srcStart = taggedSrc.indexOf(START);
                    srcEnd = taggedSrc.indexOf(END);
                    tgtStart = taggedTgt.indexOf(START);
                    tgtEnd = taggedTgt.indexOf(END);
                }

                if (!pureSource.equals(XliffUtils.pureText(source))) {
                    Element newSource = buildElement("<source>" + pureSource + "</source>");
                    Element newTarget = buildElement("<target>" + pureTarget + "</target>");

                    int similarity = MatchQuality.similarity(pureText, XliffUtils.pureText(newSource));
                    Map<String, String> properties = new HashMap<>();
                    properties.put("creationdate", TMUtils.creationDate());
                    properties.put("creationtool", Constants.APPNAME);
                    properties.put("creationtoolversion", Constants.VERSION);

                    Match newMatch = new Match(newSource, newTarget, similarity, "Auto", properties);
                    result.add(newMatch);
                }
            }
        }

        if (result.isEmpty()) {
            Language sourceLanguage = LanguageUtils.getLanguage(srcLang);
            List<String> words = sourceLanguage.isCJK() ? XliffStore.cjkWordList(pureText, NGrams.TERM_SEPARATORS)
                    : NGrams.buildWordList(pureText, NGrams.TERM_SEPARATORS);
            List<Term> terms = new ArrayList<>();
            for (int i = 0; i < words.size(); i++) {
                StringBuilder termBuilder = new StringBuilder();
                for (int length = 0; length < XliffStore.MAXTERMLENGTH; length++) {
                    if (i + length < words.size()) {
                        if (!sourceLanguage.isCJK()) {
                            termBuilder.append(' ');
                        }
                        termBuilder.append(words.get(i + length));
                        String term = termBuilder.toString().trim();
                        if (!visited.contains(term)) {
                            visited.add(term);
                            List<Match> res = glossEngine.searchTranslation(term, srcLang, tgtLang, 100, true);
                            if (!res.isEmpty()) {
                                Match m = res.get(0);
                                terms.add(new Term(m.getSource().getText(), m.getTarget().getText()));
                            }
                        }
                    }
                }
            }
            Collections.sort(terms);
            Iterator<Term> it = terms.iterator();
            String target = pureText;
            Map<String, String> replacements = new ConcurrentHashMap<>();
            while (it.hasNext()) {
                Term t = it.next();
                String key = "%%%" + mrkId + "%%%";
                String mrk = "<mrk type=\"term\" id=\"mrk" + mrkId + "\" value=\"" + XMLUtils.cleanText(t.getSource())
                        + "\">" + t.getTarget() + "</mrk>";
                target = target.replace(t.getSource(), key);
                replacements.put(key, mrk);
                mrkId++;
            }
            if (!target.equals(pureText)) {
                Set<String> keys = replacements.keySet();
                Iterator<String> k = keys.iterator();
                while (k.hasNext()) {
                    String key = k.next();
                    String mrk = replacements.get(key);
                    target = target.replace(key, mrk);
                }
                Element newSource = buildElement("<source>" + pureText + "</source>");
                Element newTarget = buildElement("<target>" + target + "</target>");

                Map<String, String> properties = new HashMap<>();
                properties.put("creationdate", TMUtils.creationDate());
                properties.put("creationtool", Constants.APPNAME);
                properties.put("creationtoolversion", Constants.VERSION);

                Match newMatch = new Match(newSource, newTarget, 0, "Auto", properties);
                result.add(newMatch);
            }
        }

        if (!result.isEmpty()) {
            Collections.sort(result);
            return result.get(0);
        }
        return null;
    }

    private static int countInstances(String sentence, String phrase) {
        int result = 0;
        int index = sentence.indexOf(phrase);
        while (index != -1) {
            result++;
            index = sentence.indexOf(phrase, index + phrase.length());
        }
        return result;
    }

    private static Element buildElement(String string) throws SAXException, IOException, ParserConfigurationException {
        if (builder == null) {
            builder = new SAXBuilder();
        }
        Document doc = builder.build(new ByteArrayInputStream(string.getBytes(StandardCharsets.UTF_8)));
        return doc.getRootElement();
    }

    private static int countDiffs(String string) {
        int result = 0;
        int index = string.indexOf(START);
        while (index != -1) {
            result++;
            index = string.indexOf(START, index + 2);
        }
        return result;
    }

    public static boolean isNumeric(String string) {
        boolean numeric = true;
        for (int i = 0; i < string.length(); i++) {
            char c = string.charAt(i);
            if ("0123456789()+-./*,=#%<>$\u00A2\u00A3\u00A4\u00A5\u20A0\u20A1\u20AC".indexOf(c) == -1
                    && !Character.isWhitespace(c)) {
                numeric = false;
                break;
            }
        }
        return numeric;
    }

    public static boolean isEmail(String string) {
        return string.matches("\\s*\\w+([-+.]\\w)*@\\w+([-.]\\w+)*\\.\\w+([-.]\\w+)*\\s*");
    }
}
