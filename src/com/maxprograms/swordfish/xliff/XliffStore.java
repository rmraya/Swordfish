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

package com.maxprograms.swordfish.xliff;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.IOException;
import java.lang.System.Logger;
import java.lang.System.Logger.Level;
import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Vector;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;
import java.util.zip.DataFormatException;

import javax.xml.parsers.ParserConfigurationException;

import com.maxprograms.converters.Merge;
import com.maxprograms.converters.TmxExporter;
import com.maxprograms.stats.RepetitionAnalysis;
import com.maxprograms.swordfish.Constants;
import com.maxprograms.swordfish.GlossariesHandler;
import com.maxprograms.swordfish.MemoriesHandler;
import com.maxprograms.swordfish.TmsServer;
import com.maxprograms.swordfish.mt.MT;
import com.maxprograms.swordfish.tm.ITmEngine;
import com.maxprograms.swordfish.tm.Match;
import com.maxprograms.swordfish.tm.MatchQuality;
import com.maxprograms.swordfish.tm.NGrams;
import com.maxprograms.xml.Catalog;
import com.maxprograms.xml.Document;
import com.maxprograms.xml.Element;
import com.maxprograms.xml.Indenter;
import com.maxprograms.xml.SAXBuilder;
import com.maxprograms.xml.TextNode;
import com.maxprograms.xml.XMLNode;
import com.maxprograms.xml.XMLOutputter;
import com.maxprograms.xml.XMLUtils;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.xml.sax.SAXException;

public class XliffStore {

    Logger logger = System.getLogger(XliffStore.class.getName());

    private static final int THRESHOLD = 60;
    private static int MAXTERMLENGTH = 5;

    private String xliffFile;
    private SAXBuilder builder;
    private Document document;

    private File database;
    private Connection conn;
    private PreparedStatement insertFile;
    private PreparedStatement insertUnit;
    private PreparedStatement insertSegment;
    private PreparedStatement insertMatch;
    private PreparedStatement updateMatch;
    private PreparedStatement getMatches;
    private PreparedStatement bestMatch;
    private PreparedStatement insertTerm;
    private PreparedStatement getTerms;
    private PreparedStatement getUnitData;
    private PreparedStatement getSource;
    private PreparedStatement getTarget;
    private PreparedStatement updateTarget;
    private PreparedStatement unitMatches;
    private PreparedStatement unitTerms;
    private PreparedStatement checkTerm;

    private Statement stmt;
    private boolean preserve;

    private static String catalog;
    private static boolean acceptUnconfirmed;
    private static boolean fuzzyTermSearches;
    private static boolean caseSensitiveSearches;

    private int index;
    private int nextId;
    private String currentFile;
    private String currentUnit;
    private String state;
    private boolean translate;
    private int tagCount;

    private String srcLang;
    private String tgtLang;

    private static int tag;
    private Map<String, String> tagsMap;

    private static Pattern pattern;
    private static String lastFilterText;

    public XliffStore(String xliffFile, String sourceLang, String targetLang)
            throws SAXException, IOException, ParserConfigurationException, URISyntaxException, SQLException {

        this.xliffFile = xliffFile;
        srcLang = sourceLang;
        tgtLang = targetLang;

        File xliff = new File(xliffFile);

        database = new File(xliff.getParentFile(), "h2data");
        boolean needsLoading = !database.exists();
        if (!database.exists()) {
            database.mkdirs();
        }
        getPreferences();
        builder = new SAXBuilder();
        builder.setEntityResolver(new Catalog(catalog));

        String url = "jdbc:h2:" + database.getAbsolutePath() + "/db";
        conn = DriverManager.getConnection(url);
        conn.setAutoCommit(false);
        if (needsLoading) {
            if (TmsServer.isDebug()) {
                logger.log(Level.INFO, "Creating database");
            }
            createTables();
        }

        getUnitData = conn.prepareStatement("SELECT data, compressed FROM units WHERE file=? AND unitId=?");
        getSource = conn
                .prepareStatement("SELECT source, sourceText FROM segments WHERE file=? AND unitId=? AND segId=?");
        getTarget = conn.prepareStatement("SELECT target, state FROM segments WHERE file=? AND unitId=? AND segId=?");
        updateTarget = conn.prepareStatement(
                "UPDATE segments SET target=?, targetText=?, state=? WHERE file=? AND unitId=? AND segId=?");
        insertMatch = conn.prepareStatement(
                "INSERT INTO matches (file, unitId, segId, matchId, origin, type, similarity, source, target, data, compressed) VALUES(?,?,?,?,?,?,?,?,?,?,?)");
        updateMatch = conn.prepareStatement(
                "UPDATE matches SET origin=?, type=?, similarity=?, source=?, target=?, data=?, compressed=? WHERE file=? AND unitId=? AND segId=? AND matchId=?");
        getMatches = conn.prepareStatement(
                "SELECT file, unitId, segId, matchId, origin, type, similarity, source, target, data, compressed FROM matches WHERE file=? AND unitId=? AND segId=? ORDER BY similarity DESC");
        bestMatch = conn.prepareStatement(
                "SELECT type, similarity FROM matches WHERE file=? AND unitId=? AND segId=? ORDER BY similarity DESC LIMIT 1");
        insertTerm = conn.prepareStatement(
                "INSERT INTO terms (file, unitId, segId, termid, origin, source, target) VALUES(?,?,?,?,?,?,?)");
        getTerms = conn.prepareStatement(
                "SELECT termid, origin, source, target FROM terms WHERE file=? AND unitId=? AND segId=? ORDER BY source");
        checkTerm = conn
                .prepareStatement("SELECT target FROM terms WHERE file=? AND unitId=? AND segId=? AND termid=?");
        stmt = conn.createStatement();
        if (needsLoading) {
            document = builder.build(xliffFile);
            parseDocument();
            conn.commit();
        }
    }

    private void createTables() throws SQLException {
        String files = "CREATE TABLE files (id VARCHAR(50) NOT NULL, name VARCHAR(350) NOT NULL, PRIMARY KEY(id));";
        String units = "CREATE TABLE units (file VARCHAR(50), " + "unitId VARCHAR(256) NOT NULL, "
                + "data VARCHAR(6000) NOT NULL, compressed CHAR(1) NOT NULL DEFAULT 'N', PRIMARY KEY(file, unitId) );";
        String segments = "CREATE TABLE segments (file VARCHAR(50), unitId VARCHAR(256) NOT NULL, "
                + "segId VARCHAR(256) NOT NULL, type CHAR(1) NOT NULL DEFAULT 'S', state VARCHAR(12) DEFAULT 'initial', child INTEGER, "
                + "translate CHAR(1), tags INTEGER DEFAULT 0, space CHAR(1) DEFAULT 'N', source VARCHAR(6000) NOT NULL, sourceText VARCHAR(6000) NOT NULL, "
                + "target VARCHAR(6000) NOT NULL, targetText VARCHAR(6000) NOT NULL, words INTEGER NOT NULL DEFAULT 0, "
                + "PRIMARY KEY(file, unitId, segId, type) );";
        String matches = "CREATE TABLE matches (file VARCHAR(50), unitId VARCHAR(256) NOT NULL, "
                + "segId VARCHAR(256) NOT NULL, matchId varchar(256), origin VARCHAR(256), type CHAR(2) NOT NULL DEFAULT 'tm', "
                + "similarity INTEGER DEFAULT 0, source VARCHAR(6000) NOT NULL, target VARCHAR(6000) NOT NULL, data VARCHAR(6000) NOT NULL, "
                + "compressed CHAR(1) NOT NULL DEFAULT 'N', PRIMARY KEY(file, unitId, segId, matchid) );";
        String terms = "CREATE TABLE terms (file VARCHAR(50), unitId VARCHAR(256) NOT NULL, "
                + "segId VARCHAR(256) NOT NULL, termid varchar(256),  "
                + "origin VARCHAR(256), source VARCHAR(6000) NOT NULL, target VARCHAR(6000) NOT NULL, "
                + "PRIMARY KEY(file, unitId, segId, termid) );";
        try (Statement stmt = conn.createStatement()) {
            stmt.execute(files);
            stmt.execute(units);
            stmt.execute(segments);
            stmt.execute(matches);
            stmt.execute(terms);
            conn.commit();
        }
    }

    private void parseDocument() throws SQLException {
        insertFile = conn.prepareStatement("INSERT INTO files (id, name) VALUES (?,?)");
        insertUnit = conn.prepareStatement("INSERT INTO units (file, unitId, data, compressed) VALUES (?,?,?,?)");
        insertSegment = conn.prepareStatement(
                "INSERT INTO segments (file, unitId, segId, type, state, child, translate, tags, space, source, sourceText, target, targetText, words) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
        recurse(document.getRootElement());
        insertFile.close();
        insertUnit.close();
        insertSegment.close();
    }

    private void recurse(Element e) throws SQLException {
        if ("file".equals(e.getName())) {
            currentFile = e.getAttributeValue("id");
            insertFile.setString(1, currentFile);
            insertFile.setNString(2, e.getAttributeValue("original"));
            insertFile.execute();
            index = 0;
        }
        if ("unit".equals(e.getName())) {
            tagCount = 0;
            nextId = 0;
            currentUnit = e.getAttributeValue("id");
            translate = e.getAttributeValue("translate", "yes").equals("yes");
            preserve = "preserve".equals(e.getAttributeValue("xml:space", "default"));
            JSONObject data = new JSONObject();

            Element originalData = e.getChild("originalData");
            if (originalData != null) {
                List<Element> list = originalData.getChildren();
                for (int i = 0; i < list.size(); i++) {
                    Element d = list.get(i);
                    data.put(d.getAttributeValue("id"), d.getText());
                    tagCount++;
                }
            }
            Element matches = e.getChild("mtc:matches");
            if (matches != null) {
                List<Element> m = matches.getChildren("mtc:match");
                Iterator<Element> mit = m.iterator();
                while (mit.hasNext()) {
                    insertMatch(currentFile, currentUnit, mit.next());
                }
            }
            if (tagCount > 0) {
                String dataString = data.toString();
                insertUnit.setString(1, currentFile);
                insertUnit.setString(2, currentUnit);
                if (dataString.length() > 6000) {
                    insertUnit.setString(3, Compression.compress(dataString));
                    insertUnit.setString(4, "Y");
                } else {
                    insertUnit.setString(3, dataString);
                    insertUnit.setString(4, "N");
                }
                insertUnit.execute();
            }
            Element glossary = e.getChild("gls:glossary");
            if (glossary != null) {
                List<Element> entries = glossary.getChildren("gls:glossEntry");
                Iterator<Element> it = entries.iterator();
                while (it.hasNext()) {
                    Element glossEntry = it.next();
                    if (glossEntry.hasAttribute("ref")) {
                        String segId = glossEntry.getAttributeValue("ref");
                        Element term = glossEntry.getChild("gls:term");
                        String source = term.getText();
                        String origin = term.getAttributeValue("source");
                        Element translation = glossEntry.getChild("gls:translation");
                        if (translation != null) {
                            String target = translation.getText();
                            saveTerm(currentFile, currentUnit, segId, origin, source, target);
                        }
                    }
                }
            }
        }
        if ("segment".equals(e.getName())) {
            String id = e.getAttributeValue("id");
            if (id.isEmpty()) {
                id = "s" + nextId++;
                e.setAttribute("id", id);
            }
            Element source = e.getChild("source");
            boolean sourcePreserve = "preserve".equals(source.getAttributeValue("xml:space", "default"));
            Element target = e.getChild("target");
            if (target == null) {
                target = new Element("target");
                if (sourcePreserve) {
                    target.setAttribute("xml:space", "preserve");
                }
            }
            state = e.getAttributeValue("state", pureText(target).isEmpty() ? "initial" : "translated");
            preserve = preserve || sourcePreserve
                    || "preserve".equals(target.getAttributeValue("xml:space", "default"));

            insertSegment(currentFile, currentUnit, id, "S", translate, source, target);
        }
        if ("ignorable".equals(e.getName())) {
            String id = e.getAttributeValue("id");
            if (id.isEmpty()) {
                id = "i" + nextId++;
                e.setAttribute("id", id);
            }
            insertSegment(currentFile, currentUnit, id, "I", false, e.getChild("source"), e.getChild("target"));
        }
        List<Element> children = e.getChildren();
        Iterator<Element> it = children.iterator();
        while (it.hasNext()) {
            recurse(it.next());
        }
        if ("file".equals(e.getName())) {
            conn.commit();
        }
    }

    private synchronized void insertSegment(String file, String unit, String segment, String type, boolean translate,
            Element source, Element target) throws SQLException {
        source.setAttribute("xml:lang", srcLang);
        if (target != null) {
            target.setAttribute("xml:lang", tgtLang);
        }
        String pureSource = pureText(source);
        insertSegment.setString(1, file);
        insertSegment.setString(2, unit);
        insertSegment.setString(3, segment);
        insertSegment.setString(4, type);
        insertSegment.setString(5, state);
        insertSegment.setInt(6, index++);
        insertSegment.setString(7, translate ? "Y" : "N");
        insertSegment.setInt(8, tagCount);
        insertSegment.setString(9, preserve ? "Y" : "N");
        insertSegment.setNString(10, source.toString());
        insertSegment.setNString(11, pureSource);
        insertSegment.setNString(12, target != null ? target.toString() : "");
        insertSegment.setNString(13, target != null ? pureText(target) : "");
        insertSegment.setInt(14, type.equals("S") ? RepetitionAnalysis.wordCount(pureSource, srcLang) : 0);
        insertSegment.execute();
    }

    private void insertMatch(String file, String unit, Element match) throws SQLException {
        Element originalData = match.getChild("originalData");
        Element source = match.getChild("source");
        Element target = match.getChild("target");
        JSONObject tagsData = new JSONObject();
        if (originalData != null) {
            List<Element> list = originalData.getChildren();
            for (int i = 0; i < list.size(); i++) {
                Element d = list.get(i);
                tagsData.put(d.getAttributeValue("id"), d.getText());
            }
        }
        String segment = match.getAttributeValue("ref");
        String type = match.getAttributeValue("type", Constants.TM);
        String origin = match.getAttributeValue("origin");
        int similarity = Math.round(Float.parseFloat(match.getAttributeValue("similarity", "0.0")));

        insertMatch(file, unit, segment, origin, type, similarity, source, target, tagsData);
    }

    public int size() throws SQLException {
        int count = 0;
        String sql = "SELECT count(*) FROM segments WHERE type='S'";
        try (Statement stmt = conn.createStatement()) {
            try (ResultSet rs = stmt.executeQuery(sql)) {
                while (rs.next()) {
                    count = rs.getInt(1);
                }
            }
        }
        return count;
    }

    public void saveXliff() throws IOException {
        XMLOutputter outputter = new XMLOutputter();
        outputter.preserveSpace(true);
        Indenter.indent(document.getRootElement(), 2);
        try (FileOutputStream out = new FileOutputStream(xliffFile)) {
            outputter.output(document, out);
        }
    }

    public synchronized List<JSONObject> getSegments(int start, int count, String filterText, String filterLanguage,
            boolean caseSensitiveFilter, boolean regExp, boolean showUntranslated, boolean showTranslated,
            boolean showConfirmed)
            throws SQLException, SAXException, IOException, ParserConfigurationException, DataFormatException {
        List<JSONObject> result = new Vector<>();
        int index = start;
        String query = "SELECT file, unitId, segId, child, source, target, tags, state, space, translate FROM segments WHERE type='S' ORDER BY file, child LIMIT "
                + count + " OFFSET " + start;
        if (!filterText.isEmpty()) {
            StringBuilder queryBuilder = new StringBuilder(
                    "SELECT file, unitId, segId, child, source, target, tags, state, space, translate FROM segments WHERE type='S'");
            if (regExp) {
                try {
                    Pattern.compile(filterText);
                } catch (PatternSyntaxException e) {
                    throw new IOException("Invalid regular expression");
                }
                queryBuilder.append(" AND REGEXP_LIKE(");
                if ("source".equals(filterLanguage)) {
                    queryBuilder.append("sourceText,'");
                } else {
                    queryBuilder.append("targetText,'");
                }
                queryBuilder.append(filterText);
                if (caseSensitiveFilter) {
                    queryBuilder.append("','c')");
                } else {
                    queryBuilder.append("','i')");
                }
            } else {
                if (caseSensitiveFilter) {
                    if ("source".equals(filterLanguage)) {
                        queryBuilder.append(" AND sourceText LIKE '%");
                    } else {
                        queryBuilder.append(" AND targetText LIKE '%");
                    }
                } else {
                    if ("source".equals(filterLanguage)) {
                        queryBuilder.append(" AND sourceText ILIKE '%");
                    } else {
                        queryBuilder.append(" AND targetText ILIKE '%");
                    }
                }
                queryBuilder.append(filterText);
                queryBuilder.append("%'");
            }
            if (!showUntranslated) {
                queryBuilder.append(" AND state <> 'initial'");
            }
            if (!showTranslated) {
                queryBuilder.append(" AND state <> 'translated'");
            }
            if (!showConfirmed) {
                queryBuilder.append(" AND state <> 'final'");
            }
            queryBuilder.append(" ORDER BY file, child LIMIT ");
            queryBuilder.append(count);
            queryBuilder.append(" OFFSET ");
            queryBuilder.append(start);
            query = queryBuilder.toString();
        }
        try (ResultSet rs = stmt.executeQuery(query)) {
            while (rs.next()) {
                String file = rs.getString(1);
                String unit = rs.getString(2);
                String segId = rs.getString(3);
                String src = rs.getNString(5);
                String tgt = rs.getNString(6);
                int tags = rs.getInt(7);
                String state = rs.getString(8);
                boolean preserve = "Y".equals(rs.getString(9));
                boolean translate = "Y".equals(rs.getString(10));

                JSONObject tagsData = new JSONObject();
                if (tags > 0) {
                    tagsData = getUnitData(file, unit);
                }
                Element source = buildElement(src);

                Element target = new Element("target");
                if (tgt != null && !tgt.isBlank()) {
                    target = buildElement(tgt);
                }

                tagsMap = new Hashtable<>();
                JSONObject row = new JSONObject();
                row.put("index", index++);
                row.put("file", file);
                row.put("unit", unit);
                row.put("segment", segId);
                row.put("state", state);
                row.put("translate", translate);
                row.put("preserve", preserve);
                tag = 1;
                row.put("source", addHtmlTags(source, filterText, caseSensitiveFilter, regExp, tagsData, preserve));
                tag = 1;
                row.put("target", addHtmlTags(target, filterText, caseSensitiveFilter, regExp, tagsData, preserve));
                row.put("match", getBestMatch(file, unit, segId));
                result.add(row);
            }
        }
        return result;
    }

    private synchronized int getBestMatch(String file, String unit, String segment) throws SQLException {
        String type = "";
        int similarity = 0;
        bestMatch.setString(1, file);
        bestMatch.setString(2, unit);
        bestMatch.setString(3, segment);
        try (ResultSet rs = bestMatch.executeQuery()) {
            while (rs.next()) {
                type = rs.getString(1);
                similarity = rs.getInt(2);
            }
        }
        if (type.isEmpty() || Constants.MT.equals(type)) {
            return 0;
        }
        return similarity;
    }

    private synchronized JSONObject getUnitData(String file, String unit) throws SQLException, DataFormatException {
        getUnitData.setString(1, file);
        getUnitData.setString(2, unit);
        String data = "";
        boolean compressed = false;
        try (ResultSet rs = getUnitData.executeQuery()) {
            while (rs.next()) {
                data = rs.getString(1);
                compressed = "Y".equals(rs.getString(2));
            }
        }
        if (data.isEmpty()) {
            return new JSONObject();
        }
        if (compressed) {
            return new JSONObject(Compression.decompress(data));
        }
        return new JSONObject(data);
    }

    public void close() throws SQLException {
        getUnitData.close();
        getSource.close();
        getTarget.close();
        updateTarget.close();
        insertMatch.close();
        updateMatch.close();
        getMatches.close();
        bestMatch.close();
        insertTerm.close();
        getTerms.close();
        checkTerm.close();
        stmt.close();
        conn.commit();
        conn.close();
        if (TmsServer.isDebug()) {
            logger.log(Level.INFO, "Closed store");
        }
    }

    public String getSrcLang() {
        return srcLang;
    }

    public String getTgtLang() {
        return tgtLang;
    }

    private static void getPreferences() throws IOException {
        File preferences = new File(TmsServer.getWorkFolder(), "preferences.json");
        StringBuilder builder = new StringBuilder();
        try (FileReader reader = new FileReader(preferences)) {
            try (BufferedReader buffer = new BufferedReader(reader)) {
                String line = "";
                while ((line = buffer.readLine()) != null) {
                    builder.append(line);
                }
            }
        }
        JSONObject json = new JSONObject(builder.toString());
        acceptUnconfirmed = json.getBoolean("acceptUnconfirmed");
        caseSensitiveSearches = json.getBoolean("caseSensitiveSearches");
        fuzzyTermSearches = json.getBoolean("fuzzyTermSearches");
        catalog = json.getString("catalog");
    }

    public synchronized JSONArray saveSegment(JSONObject json)
            throws IOException, SQLException, SAXException, ParserConfigurationException, DataFormatException {

        JSONArray result = new JSONArray();
        String file = json.getString("file");
        String unit = json.getString("unit");
        String segment = json.getString("segment");
        String translation = json.getString("translation").replace("&nbsp;", "\u00A0").replace("<br>", "\n");
        boolean confirm = json.getBoolean("confirm");
        String memory = json.getString("memory");

        String src = "";
        getSource.setString(1, file);
        getSource.setString(2, unit);
        getSource.setString(3, segment);
        try (ResultSet rs = getSource.executeQuery()) {
            while (rs.next()) {
                src = rs.getNString(1);
            }
        }
        Element source = buildElement(src);

        Map<String, String> tags = getTags(source);

        translation = XliffUtils.clearSpan(translation);

        List<String[]> list = XliffUtils.harvestTags(translation);
        if (!list.isEmpty()) {
            for (int i = 0; i < list.size(); i++) {
                String code = list.get(i)[0];
                String img = list.get(i)[1];
                if (tags.containsKey(code)) {
                    translation = replace(translation, img, tags.get(code));
                } else {
                    translation = replace(translation, img, "");
                }
            }
        }
        Element translated = buildElement("<target>" + translation + "</target>");

        String tgt = "";
        getTarget.setString(1, file);
        getTarget.setString(2, unit);
        getTarget.setString(3, segment);
        try (ResultSet rs = getTarget.executeQuery()) {
            while (rs.next()) {
                tgt = rs.getNString(1);
            }
        }

        Element target = buildElement(tgt);
        target.setContent(translated.getContent());
        String pureTarget = pureText(target);

        updateTarget(file, unit, segment, target, pureTarget, confirm);
        if (confirm && !pureTarget.isBlank()) {
            result = propagate(source, target, pureTarget);
        }
        if (!memory.equals(Constants.NONE)) {
            Thread thread = new Thread() {
                @Override
                public void run() {
                    try {
                        StringBuilder key = new StringBuilder();
                        key.append(xliffFile.hashCode());
                        key.append('-');
                        key.append(file);
                        key.append('-');
                        key.append(unit);
                        key.append('-');
                        key.append(segment);
                        MemoriesHandler.openMemory(memory);
                        ITmEngine engine = MemoriesHandler.getEngine(memory);
                        engine.storeTu(XliffUtils.toTu(key.toString(), source, target, tags));
                        MemoriesHandler.closeMemory(memory);
                    } catch (IOException | SQLException e) {
                        logger.log(Level.ERROR, e);
                    }
                }
            };
            thread.start();
        }
        return result;
    }

    public synchronized JSONObject getTranslationStatus() throws SQLException {
        JSONObject result = new JSONObject();
        int total = 0;
        int translated = 0;
        int confirmed = 0;
        int segments = 0;
        String sql = "SELECT SUM(words), COUNT(*) FROM segments";
        try (ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                total = rs.getInt(1);
                segments = rs.getInt(2);
            }
        }
        sql = "SELECT SUM(words) FROM segments WHERE state='final'";
        try (ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                confirmed = rs.getInt(1);
            }
        }
        sql = "SELECT SUM(words) FROM segments WHERE state <> 'initial'";
        try (ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                translated = rs.getInt(1);
            }
        }
        int percentage = 0;
        if (total != 0) {
            percentage = Math.round(confirmed * 100f / total);
        }

        result.put("segments", segments);
        result.put("total", total);
        result.put("translated", translated);
        result.put("confirmed", confirmed);
        result.put("percentage", percentage);
        result.put("text", "Segments: " + segments + "\u00A0\u00A0\u00A0Words: " + total
                + "\u00A0\u00A0\u00A0Translated: " + translated + "\u00A0\u00A0\u00A0Confirmed: " + confirmed);
        result.put("svg", XliffUtils.makeSVG(percentage));
        return result;
    }

    private synchronized void updateTarget(String file, String unit, String segment, Element target, String pureTarget,
            boolean confirm) throws SQLException {
        String state = pureTarget.isBlank() ? Constants.INITIAL : Constants.TRANSLATED;
        if (confirm) {
            state = Constants.FINAL;
        }
        updateTarget.setNString(1, target.toString());
        updateTarget.setNString(2, pureTarget);
        updateTarget.setString(3, state);
        updateTarget.setString(4, file);
        updateTarget.setString(5, unit);
        updateTarget.setString(6, segment);
        updateTarget.executeUpdate();
        conn.commit();
    }

    private JSONArray propagate(Element source, Element target, String pureTarget)
            throws SQLException, SAXException, IOException, ParserConfigurationException, DataFormatException {
        JSONArray result = new JSONArray();
        String dummySource = dummyTagger(source);
        String query = "SELECT file, unitId, segId, source, state, tags, space FROM segments WHERE translate='Y' AND type='S' AND state <> 'final' ";
        try (ResultSet rs = stmt.executeQuery(query)) {
            while (rs.next()) {
                Element candidate = buildElement(rs.getNString(4));
                int differences = tagDifferences(source, candidate);
                String dummy = dummyTagger(candidate);
                int similarity = MatchQuality.similarity(dummySource, dummy) - differences;
                if (similarity > THRESHOLD) {
                    String file = rs.getString(1);
                    String unit = rs.getString(2);
                    String segment = rs.getString(3);
                    int tags = rs.getInt(6);
                    JSONObject tagsData = new JSONObject();
                    if (tags > 0) {
                        tagsData = getUnitData(file, unit);
                    }
                    if (similarity == 100 && Constants.INITIAL.equals(state)) {
                        tagsMap = new Hashtable<>();
                        tag = 1;
                        addHtmlTags(candidate, "", false, false, tagsData, true);

                        JSONObject row = new JSONObject();
                        row.put("file", file);
                        row.put("unit", unit);
                        row.put("segment", segment);
                        row.put("match", 100);
                        tag = 1;
                        String translation = addHtmlTags(target, "", false, false, tagsData, true);
                        row.put("target", translation);
                        result.put(row);

                        Element translated = buildElement("<target>" + translation + "</target>");
                        translated.setAttribute("xml:lang", tgtLang);
                        translated.setAttribute("xml:space", preserve ? "preserve" : "default");
                        translated.setContent(target.getContent());
                        updateTarget(file, unit, segment, translated, pureText(translated), false);
                    }
                    insertMatch(file, unit, segment, "Self", Constants.TM, similarity, source, target, tagsData);
                    conn.commit();
                    int best = getBestMatch(file, unit, segment);
                    JSONObject row = new JSONObject();
                    row.put("file", file);
                    row.put("unit", unit);
                    row.put("segment", segment);
                    row.put("match", best);
                    result.put(row);
                }
            }
        }
        return result;
    }

    private int tagDifferences(Element source, Element candidate) {
        int a = source.getChildren().size();
        int b = candidate.getChildren().size();
        if (a > b) {
            return a - b;
        }
        return b - a;
    }

    private synchronized void insertMatch(String file, String unit, String segment, String origin, String type,
            int similarity, Element source, Element target, JSONObject tagsData) throws SQLException {
        String matchId = "" + pureText(source).hashCode() * origin.hashCode();
        if (Constants.MT.equals(type)) {
            matchId = origin;
        }
        JSONArray matches = getMatches(file, unit, segment);
        String data = "";
        boolean compressed = false;
        if (!source.getChildren().isEmpty() || !target.getChildren().isEmpty()) {
            List<String> added = new Vector<>();
            Element originalData = new Element("originalData");
            List<Element> children = source.getChildren();
            Iterator<Element> it = children.iterator();
            while (it.hasNext()) {
                Element tag = it.next();
                if ("mrk".equals(tag.getName()) || "pc".equals(tag.getName()) || "cp".equals(tag.getName())) {
                    continue;
                }
                String dataRef = tag.getAttributeValue("dataRef");
                if (!added.contains(dataRef) && tagsData.has(dataRef)) {
                    Element d = new Element("data");
                    d.setAttribute("id", dataRef);
                    d.setText(tagsData.getString("dataRef"));
                    originalData.addContent(d);
                    added.add(dataRef);
                } else {
                    tag.removeAttribute("dataRef");
                }
            }
            children = target.getChildren();
            it = children.iterator();
            while (it.hasNext()) {
                Element tag = it.next();
                if ("mrk".equals(tag.getName()) || "pc".equals(tag.getName()) || "cp".equals(tag.getName())) {
                    continue;
                }
                String dataRef = tag.getAttributeValue("dataRef");
                if (!added.contains(dataRef) && tagsData.has(dataRef)) {
                    Element d = new Element("data");
                    d.setAttribute("id", dataRef);
                    d.setText(tagsData.getString("dataRef"));
                    originalData.addContent(d);
                    added.add(dataRef);
                } else {
                    tag.removeAttribute("dataRef");
                }
            }
            data = originalData.toString();
            if (data.length() > 6000) {
                data = Compression.compress(data);
                compressed = true;
            }
        }
        for (int i = 0; i < matches.length(); i++) {
            JSONObject match = matches.getJSONObject(i);
            if (match.getString("matchId").equals(matchId)) {
                updateMatch.setString(1, origin);
                updateMatch.setString(2, type);
                updateMatch.setInt(3, similarity);
                updateMatch.setNString(4, source.toString());
                updateMatch.setNString(5, target.toString());
                updateMatch.setString(6, data);
                updateMatch.setString(7, compressed ? "Y" : "N");
                updateMatch.setString(8, file);
                updateMatch.setString(9, unit);
                updateMatch.setString(10, segment);
                updateMatch.setString(11, matchId);
                updateMatch.execute();
                return;
            }
        }
        insertMatch.setString(1, file);
        insertMatch.setString(2, unit);
        insertMatch.setString(3, segment);
        insertMatch.setString(4, matchId);
        insertMatch.setString(5, origin);
        insertMatch.setString(6, type);
        insertMatch.setInt(7, similarity);
        insertMatch.setNString(8, source.toString());
        insertMatch.setNString(9, target.toString());
        insertMatch.setString(10, data);
        insertMatch.setString(11, compressed ? "Y" : "N");
        insertMatch.execute();
    }

    private JSONArray getMatches(String file, String unit, String segment) throws SQLException {
        JSONArray result = new JSONArray();
        getMatches.setString(1, file);
        getMatches.setString(2, unit);
        getMatches.setString(3, segment);
        try (ResultSet rs = getMatches.executeQuery()) {
            while (rs.next()) {
                JSONObject match = new JSONObject();
                match.put("file", file);
                match.put("unit", unit);
                match.put("segment", segment);
                match.put("matchId", rs.getString(4));
                match.put("origin", rs.getString(5));
                match.put("type", rs.getString(6));
                match.put("similarity", rs.getInt(7));
                match.put("source", rs.getNString(8));
                match.put("target", rs.getNString(9));
                result.put(match);
            }
        }
        return result;
    }

    private String dummyTagger(Element e) {
        if (e == null) {
            return "";
        }
        int dummy = 1;
        StringBuilder string = new StringBuilder();
        List<XMLNode> content = e.getContent();
        Iterator<XMLNode> it = content.iterator();
        while (it.hasNext()) {
            XMLNode n = it.next();
            if (n.getNodeType() == XMLNode.TEXT_NODE) {
                TextNode t = (TextNode) n;
                string.append(t.getText());
            }
            if (n.getNodeType() == XMLNode.ELEMENT_NODE) {
                Element el = (Element) n;
                if ("mrk".equals(el.getName()) || "pc".equals(el.getName())) {
                    string.append((char) (0xF300 + dummy++));
                    string.append(dummyTagger(el));
                    string.append((char) (0xF300 + dummy++));
                } else {
                    string.append((char) (0xF300 + dummy++));
                }
            }
        }
        return string.toString();
    }

    private String pureText(Element e) {
        StringBuilder string = new StringBuilder();
        List<XMLNode> content = e.getContent();
        Iterator<XMLNode> it = content.iterator();
        while (it.hasNext()) {
            XMLNode n = it.next();
            if (n.getNodeType() == XMLNode.TEXT_NODE) {
                TextNode t = (TextNode) n;
                string.append(t.getText());
            }
            if (n.getNodeType() == XMLNode.ELEMENT_NODE) {
                Element el = (Element) n;
                if ("mrk".equals(el.getName()) || "pc".equals(el.getName())) {
                    string.append(pureText(el));
                }
            }
        }
        return string.toString();
    }

    private String addHtmlTags(Element seg, JSONObject originalData) throws IOException {
        if (seg == null) {
            return "";
        }
        List<XMLNode> list = seg.getContent();
        Iterator<XMLNode> it = list.iterator();
        StringBuilder text = new StringBuilder();
        while (it.hasNext()) {
            XMLNode o = it.next();
            if (o.getNodeType() == XMLNode.TEXT_NODE) {
                text.append(XliffUtils.cleanString(((TextNode) o).getText()));
            } else if (o.getNodeType() == XMLNode.ELEMENT_NODE) {
                // empty: <cp>, <ph>, <sc>, <ec>, <sm> and <em>.
                // paired: <pc>, <mrk>,
                Element e = (Element) o;
                String type = e.getName();
                if (type.equals("pc")) {
                    String id = e.getAttributeValue("id");
                    if (!tagsMap.containsKey("pc" + id)) {
                        XliffUtils.checkSVG(tag);
                        String header = XliffUtils.getHeader(e);
                        StringBuilder sb = new StringBuilder();
                        sb.append("<img data-ref='");
                        sb.append(id);
                        sb.append("' src='");
                        sb.append(TmsServer.getWorkFolder().toURI().toURL().toString());
                        sb.append("images/");
                        sb.append(tag++);
                        sb.append(".svg' align='bottom' alt='' title=\"");
                        sb.append(XliffUtils.unquote(XliffUtils.cleanAngles(header)));
                        sb.append("\"/>");
                        tagsMap.put("pc" + id, sb.toString());
                    }
                    text.append(tagsMap.get("pc" + id));
                    text.append(addHtmlTags(e, originalData));
                    if (!tagsMap.containsKey("/pc" + id)) {
                        XliffUtils.checkSVG(tag);
                        String tail = "</pc>";
                        StringBuilder sb = new StringBuilder();
                        sb.append("<img data-ref='/");
                        sb.append(e.getAttributeValue("id"));
                        sb.append("' src='");
                        sb.append(TmsServer.getWorkFolder().toURI().toURL().toString());
                        sb.append("images/");
                        sb.append(tag++);
                        sb.append(".svg' align='bottom' alt='' title=\"");
                        sb.append(XliffUtils.unquote(XliffUtils.cleanAngles(tail)));
                        sb.append("\"/>");
                        tagsMap.put("/pc" + id, sb.toString());
                    }
                    text.append("/" + tagsMap.get(e.getName() + id));
                } else if (type.equals("mrk")) {
                    String id = e.getAttributeValue("id");
                    if (!tagsMap.containsKey("mrk" + id)) {
                        XliffUtils.checkSVG(tag);
                        String header = XliffUtils.getHeader(e);
                        StringBuilder sb = new StringBuilder();
                        sb.append("<img data-ref='");
                        sb.append(id);
                        sb.append("' src='");
                        sb.append(TmsServer.getWorkFolder().toURI().toURL().toString());
                        sb.append("images/");
                        sb.append(tag++);
                        sb.append(".svg' align='bottom' alt='' title=\"");
                        sb.append(XliffUtils.unquote(XliffUtils.cleanAngles(header)));
                        sb.append("\"/>");
                        tagsMap.put("mrk" + id, sb.toString());
                    }
                    text.append(tagsMap.get(e.getName() + id));
                    text.append("<span " + XliffUtils.STYLE + ">");
                    text.append(e.getText());
                    text.append("</span>");
                    if (!tagsMap.containsKey("/mrk" + id)) {
                        XliffUtils.checkSVG(tag);
                        String tail = "</mrk>";
                        StringBuilder sb = new StringBuilder();
                        sb.append("<img data-ref='/");
                        sb.append(e.getAttributeValue("id"));
                        sb.append("' src='");
                        sb.append(TmsServer.getWorkFolder().toURI().toURL().toString());
                        sb.append("images/");
                        sb.append(tag++);
                        sb.append(".svg' align='bottom' alt='' title=\"");
                        sb.append(XliffUtils.unquote(XliffUtils.cleanAngles(tail)));
                        sb.append("\"/>");
                        tagsMap.put("/mrk" + id, sb.toString());
                    }
                    text.append(tagsMap.get("/mrk" + id));
                } else if (type.equals("cp")) {
                    String hex = "cp" + e.getAttributeValue("hex");
                    if (!tagsMap.containsKey(hex)) {
                        XliffUtils.checkSVG(tag);
                        StringBuilder sb = new StringBuilder();
                        sb.append("<img data-ref='");
                        sb.append(hex);
                        sb.append("' src='");
                        sb.append(TmsServer.getWorkFolder().toURI().toURL().toString());
                        sb.append("images/");
                        sb.append(tag++);
                        sb.append(".svg' align='bottom' alt='' title=\"");
                        sb.append(XliffUtils.unquote(XliffUtils.cleanAngles(e.toString())));
                        sb.append("\"/>");
                        tagsMap.put(hex, sb.toString());
                    }
                    text.append(tagsMap.get(hex));
                } else {
                    String dataRef = e.getAttributeValue("dataRef");
                    if (!tagsMap.containsKey(dataRef)) {
                        XliffUtils.checkSVG(tag);
                        StringBuilder sb = new StringBuilder();
                        sb.append("<img data-ref='");
                        sb.append(dataRef);
                        sb.append("' src='");
                        sb.append(TmsServer.getWorkFolder().toURI().toURL().toString());
                        sb.append("images/");
                        sb.append(tag++);
                        sb.append(".svg' align='bottom' alt='' title=\"");
                        String title = "";
                        if (originalData.has(dataRef)) {
                            title = originalData.getString(dataRef);
                        }
                        sb.append(XliffUtils.unquote(XliffUtils.cleanAngles(title)));
                        sb.append("\"/>");
                        tagsMap.put(dataRef, sb.toString());
                    }
                    text.append(tagsMap.get(dataRef));
                }
            }
        }
        return text.toString();
    }

    private String addHtmlTags(Element seg, String filterText, boolean caseSensitive, boolean regExp,
            JSONObject originalData, boolean preserve) throws IOException {
        if (seg == null) {
            return "";
        }
        List<XMLNode> list = seg.getContent();
        Iterator<XMLNode> it = list.iterator();
        StringBuilder text = new StringBuilder();
        while (it.hasNext()) {
            XMLNode o = it.next();
            if (o.getNodeType() == XMLNode.TEXT_NODE) {
                if (filterText == null || filterText.isEmpty()) {
                    text.append(XliffUtils.cleanString(((TextNode) o).getText()));
                } else {
                    if (regExp) {
                        if (pattern == null || !filterText.equals(lastFilterText)) {
                            pattern = Pattern.compile(filterText);
                            lastFilterText = filterText;
                        }
                        String s = ((TextNode) o).getText();
                        Matcher matcher = pattern.matcher(s);
                        if (matcher.find()) {
                            StringBuilder sb = new StringBuilder();
                            do {
                                int start = matcher.start();
                                int end = matcher.end();
                                sb.append(XliffUtils.cleanString(s.substring(0, start)));
                                sb.append("<span " + XliffUtils.STYLE + ">");
                                sb.append(XliffUtils.cleanString(s.substring(start, end)));
                                sb.append("</span>");
                                s = s.substring(end);
                                matcher = pattern.matcher(s);
                            } while (matcher.find());
                            sb.append(XliffUtils.cleanString(s));
                            text.append(sb.toString());
                        } else {
                            text.append(XliffUtils.cleanString(s));
                        }
                    } else {
                        String s = XliffUtils.cleanString(((TextNode) o).getText());
                        String t = XliffUtils.cleanString(filterText);
                        if (caseSensitive) {
                            if (s.indexOf(t) != -1) {
                                text.append(XliffUtils.highlight(s, t, caseSensitive));
                            } else {
                                text.append(s);
                            }
                        } else {
                            if (s.toLowerCase().indexOf(t.toLowerCase()) != -1) {
                                text.append(XliffUtils.highlight(s, t, caseSensitive));
                            } else {
                                text.append(s);
                            }
                        }
                    }
                }
            } else if (o.getNodeType() == XMLNode.ELEMENT_NODE) {
                // empty: <cp>, <ph>, <sc>, <ec>, <sm> and <em>.
                // paired: <pc>, <mrk>,
                Element e = (Element) o;
                String type = e.getName();
                if (type.equals("pc")) {
                    String id = e.getAttributeValue("id");
                    if (!tagsMap.containsKey("pc" + id)) {
                        XliffUtils.checkSVG(tag);
                        String header = XliffUtils.getHeader(e);
                        StringBuilder sb = new StringBuilder();
                        sb.append("<img data-ref='");
                        sb.append(id);
                        sb.append("' data-id='");
                        sb.append(tag);
                        sb.append("' src='");
                        sb.append(TmsServer.getWorkFolder().toURI().toURL().toString());
                        sb.append("images/");
                        sb.append(tag++);
                        sb.append(".svg' align='bottom' alt='' title=\"");
                        sb.append(XliffUtils.unquote(XliffUtils.cleanAngles(header)));
                        sb.append("\"/>");
                        tagsMap.put("pc" + id, sb.toString());
                    }
                    text.append(tagsMap.get("pc" + id));
                    text.append(addHtmlTags(e, filterText, caseSensitive, regExp, originalData, preserve));
                    if (!tagsMap.containsKey("/pc" + id)) {
                        XliffUtils.checkSVG(tag);
                        String tail = "</pc>";
                        StringBuilder sb = new StringBuilder();
                        sb.append("<img data-ref='/");
                        sb.append(e.getAttributeValue("id"));
                        sb.append("' data-id='");
                        sb.append(tag);
                        sb.append("' src='");
                        sb.append(TmsServer.getWorkFolder().toURI().toURL().toString());
                        sb.append("images/");
                        sb.append(tag++);
                        sb.append(".svg' align='bottom' alt='' title=\"");
                        sb.append(XliffUtils.unquote(XliffUtils.cleanAngles(tail)));
                        sb.append("\"/>");
                        tagsMap.put("/pc" + id, sb.toString());
                    }
                    text.append("/" + tagsMap.get(e.getName() + id));
                } else if (type.equals("mrk")) {
                    String id = e.getAttributeValue("id");
                    if (!tagsMap.containsKey("mrk" + id)) {
                        XliffUtils.checkSVG(tag);
                        String header = XliffUtils.getHeader(e);
                        StringBuilder sb = new StringBuilder();
                        sb.append("<img data-ref='");
                        sb.append(id);
                        sb.append("' data-id='");
                        sb.append(tag);
                        sb.append("' src='");
                        sb.append(TmsServer.getWorkFolder().toURI().toURL().toString());
                        sb.append("images/");
                        sb.append(tag++);
                        sb.append(".svg' align='bottom' alt='' title=\"");
                        sb.append(XliffUtils.unquote(XliffUtils.cleanAngles(header)));
                        sb.append("\"/>");
                        tagsMap.put("mrk" + id, sb.toString());
                    }
                    text.append(tagsMap.get(e.getName() + id));
                    text.append("<span " + XliffUtils.STYLE + ">");
                    text.append(e.getText());
                    text.append("</span>");
                    if (!tagsMap.containsKey("/mrk" + id)) {
                        XliffUtils.checkSVG(tag);
                        String tail = "</mrk>";
                        StringBuilder sb = new StringBuilder();
                        sb.append("<img data-ref='/");
                        sb.append(e.getAttributeValue("id"));
                        sb.append("' data-id='");
                        sb.append(tag);
                        sb.append("' src='");
                        sb.append(TmsServer.getWorkFolder().toURI().toURL().toString());
                        sb.append("images/");
                        sb.append(tag++);
                        sb.append(".svg' align='bottom' alt='' title=\"");
                        sb.append(XliffUtils.unquote(XliffUtils.cleanAngles(tail)));
                        sb.append("\"/>");
                        tagsMap.put("/mrk" + id, sb.toString());
                    }
                    text.append(tagsMap.get("/mrk" + id));
                } else if (type.equals("cp")) {
                    String hex = "cp" + e.getAttributeValue("hex");
                    if (!tagsMap.containsKey(hex)) {
                        XliffUtils.checkSVG(tag);
                        StringBuilder sb = new StringBuilder();
                        sb.append("<img data-ref='");
                        sb.append(hex);
                        sb.append("' data-id='");
                        sb.append(tag);
                        sb.append("' src='");
                        sb.append(TmsServer.getWorkFolder().toURI().toURL().toString());
                        sb.append("images/");
                        sb.append(tag++);
                        sb.append(".svg' align='bottom' alt='' title=\"");
                        sb.append(XliffUtils.unquote(XliffUtils.cleanAngles(e.toString())));
                        sb.append("\"/>");
                        tagsMap.put(hex, sb.toString());
                    }
                    text.append(tagsMap.get(hex));
                } else {
                    String dataRef = e.getAttributeValue("dataRef");
                    if (!tagsMap.containsKey(dataRef)) {
                        XliffUtils.checkSVG(tag);
                        StringBuilder sb = new StringBuilder();
                        sb.append("<img data-ref='");
                        sb.append(dataRef);
                        sb.append("' data-id='");
                        sb.append(tag);
                        sb.append("' src='");
                        sb.append(TmsServer.getWorkFolder().toURI().toURL().toString());
                        sb.append("images/");
                        sb.append(tag++);
                        sb.append(".svg' align='bottom' alt='' title=\"");
                        String title = "";
                        if (originalData.has(dataRef)) {
                            title = originalData.getString(dataRef);
                        }
                        sb.append(XliffUtils.unquote(XliffUtils.cleanAngles(title)));
                        sb.append("\"/>");
                        tagsMap.put(dataRef, sb.toString());
                    }
                    text.append(tagsMap.get(dataRef));
                }
            }
        }
        return preserve ? XliffUtils.highlightSpaces(text.toString()) : text.toString().trim();
    }

    private String replace(String source, String target, String replacement) {
        int start = source.indexOf(target);
        while (start != -1) {
            source = source.substring(0, start) + replacement + source.substring(start + target.length());
            start += replacement.length();
            start = source.indexOf(target, start);
        }
        return source;
    }

    private Element buildElement(String string) throws SAXException, IOException, ParserConfigurationException {
        Document doc = builder.build(new ByteArrayInputStream(string.getBytes(StandardCharsets.UTF_8)));
        return doc.getRootElement();
    }

    private Map<String, String> getTags(Element root) {
        Map<String, String> result = new Hashtable<>();
        List<XMLNode> content = root.getContent();
        Iterator<XMLNode> it = content.iterator();
        while (it.hasNext()) {
            XMLNode node = it.next();
            if (node.getNodeType() == XMLNode.ELEMENT_NODE) {
                Element e = (Element) node;
                if ("mrk".equals(e.getName()) || "pc".equals(e.getName())) {
                    result.put(e.getAttributeValue("id"), XliffUtils.getHeader(e));
                    result.put("/" + e.getAttributeValue("id"), XliffUtils.getTail(e));
                } else if ("cp".equals(e.getName())) {
                    result.put("cp" + e.getAttributeValue("hex"), e.toString());
                } else {
                    result.put(e.getAttributeValue("id"), e.toString());
                }
            }
        }
        return result;
    }

    public synchronized JSONArray getTaggedtMatches(JSONObject json)
            throws SQLException, SAXException, IOException, ParserConfigurationException, DataFormatException {
        JSONArray result = new JSONArray();

        String file = json.getString("file");
        String unit = json.getString("unit");
        String segment = json.getString("segment");

        JSONObject originalData = getUnitData(file, unit);
        Element originalSource = null;

        getSource.setString(1, file);
        getSource.setString(2, unit);
        getSource.setString(3, segment);
        try (ResultSet rs = getSource.executeQuery()) {
            while (rs.next()) {
                String src = rs.getNString(1);
                // originalSource = dummyTagger(buildElement(src));
                originalSource = buildElement(src);
            }
        }
        String dummySource = dummyTagger(originalSource);

        getMatches.setString(1, file);
        getMatches.setString(2, unit);
        getMatches.setString(3, segment);
        try (ResultSet rs = getMatches.executeQuery()) {
            while (rs.next()) {
                JSONObject match = new JSONObject();
                match.put("file", file);
                match.put("unit", unit);
                match.put("segment", segment);
                match.put("matchId", rs.getString(4));
                match.put("origin", rs.getString(5));
                match.put("type", rs.getString(6));
                match.put("similarity", rs.getInt(7));

                String src = rs.getNString(8);
                Element source = buildElement(src);
                String taggedSource = addHtmlTags(source, originalData);

                List<String[]> tags = XliffUtils.harvestTags(taggedSource);
                for (int i = 0; i < tags.size(); i++) {
                    taggedSource = taggedSource.replace(tags.get(i)[1], "" + (char) (0xF300 + (i + 1)));
                }

                DifferenceTagger tagger = new DifferenceTagger(dummySource, taggedSource);
                String tagged = tagger.getYDifferences();
                for (int i = 0; i < tags.size(); i++) {
                    tagged = tagged.replace("" + (char) (0xF300 + (i + 1)), tags.get(i)[1]);
                }

                match.put("source", tagged);

                String tgt = rs.getNString(9);
                Element target = buildElement(tgt);
                match.put("target", addHtmlTags(target, "", false, false, originalData, true));
                result.put(match);
            }
        }
        return result;
    }

    public void exportXliff(String output)
            throws SAXException, IOException, ParserConfigurationException, SQLException, URISyntaxException {
        updateXliff();
        Skeletons.embedSkeletons(xliffFile, output);
    }

    public void exportTMX(String output) throws SQLException, SAXException, IOException, ParserConfigurationException {
        updateXliff();
        getPreferences();
        TmxExporter.export(xliffFile, output, catalog);
    }

    public void exportTranslations(String output)
            throws SAXException, IOException, ParserConfigurationException, SQLException {
        updateXliff();
        getPreferences();
        List<String> result = Merge.merge(xliffFile, output, catalog, acceptUnconfirmed);
        if (!"0".equals(result.get(0))) {
            throw new IOException(result.get(1));
        }
    }

    public void updateXliff() throws SQLException, SAXException, IOException, ParserConfigurationException {
        document = builder.build(xliffFile);
        document.getRootElement().setAttribute("xmlns:mtc", "urn:oasis:names:tc:xliff:matches:2.0");
        document.getRootElement().setAttribute("xmlns:gls", "urn:oasis:names:tc:xliff:glossary:2.0");
        unitMatches = conn.prepareStatement(
                "SELECT file, unitId, segId, matchId, origin, type, similarity, source, target, data, compressed FROM matches WHERE file=? AND unitId=? ORDER BY segId, similarity DESC");
        unitTerms = conn.prepareStatement(
                "SELECT file, unitId, segId, termId, origin, source, target FROM terms WHERE file=? AND unitId=? ORDER BY segId");
        recurseUpdating(document.getRootElement());
        unitTerms.close();
        unitMatches.close();
        saveXliff();
    }

    private void recurseUpdating(Element e)
            throws SQLException, SAXException, IOException, ParserConfigurationException {
        if ("file".equals(e.getName())) {
            currentFile = e.getAttributeValue("id");
            index = 0;
        }
        if ("unit".equals(e.getName())) {
            tagCount = 0;
            currentUnit = e.getAttributeValue("id");
            translate = e.getAttributeValue("translate", "yes").equals("yes");
            Element glossary = getUnitTerms(currentFile, currentUnit);
            if (glossary != null) {
                insertGlossary(e, glossary);
            }
            Element matches = getUnitMatches(currentFile, currentUnit);
            if (matches != null) {
                insertMatches(e, matches);
            }
        }
        if ("segment".equals(e.getName())) {
            String id = e.getAttributeValue("id");
            Element target = e.getChild("target");
            if (target == null) {
                target = new Element("target");
                target.setAttribute("xml:lang", tgtLang);
                e.addContent(target);
            }
            String tgt = "";
            getTarget.setString(1, currentFile);
            getTarget.setString(2, currentUnit);
            getTarget.setString(3, id);
            String state = "";
            try (ResultSet rs = getTarget.executeQuery()) {
                while (rs.next()) {
                    tgt = rs.getNString(1);
                    state = rs.getString(2);
                }
            }
            Element updated = buildElement(tgt);
            target.setContent(updated.getContent());
            e.setAttribute("state", state);
        }
        List<Element> children = e.getChildren();
        Iterator<Element> it = children.iterator();
        while (it.hasNext()) {
            recurseUpdating(it.next());
        }
    }

    private void insertMatches(Element unit, Element matches) {
        Element old = unit.getChild("mtc:matches");
        if (old != null) {
            unit.removeChild(old);
        }
        unit.getContent().add(0, matches);
    }

    private void insertGlossary(Element unit, Element terms) {
        Element old = unit.getChild("gls:glossary");
        if (old != null) {
            unit.removeChild(old);
        }
        unit.getContent().add(0, terms);
    }

    private Element getUnitMatches(String file, String unit)
            throws SQLException, SAXException, IOException, ParserConfigurationException {
        Element matches = new Element("mtc:matches");
        unitMatches.setString(1, file);
        unitMatches.setString(2, unit);
        try (ResultSet rs = unitMatches.executeQuery()) {
            while (rs.next()) {
                Element match = new Element("mtc:match");
                match.setAttribute("ref", rs.getString(3));
                match.setAttribute("id", rs.getString(4));
                match.setAttribute("origin", rs.getString(5));
                match.setAttribute("type", rs.getString(6));
                match.setAttribute("similarity", "" + rs.getInt(7));
                match.addContent(buildElement(rs.getNString(8)));
                match.addContent(buildElement(rs.getNString(9)));
                matches.addContent(match);
            }
        }
        return matches.getChildren().isEmpty() ? null : matches;
    }

    private Element getUnitTerms(String file, String unit)
            throws SQLException, SAXException, IOException, ParserConfigurationException {
        Element glossary = new Element("gls:glossary");
        unitTerms.setString(1, file);
        unitTerms.setString(2, unit);
        try (ResultSet rs = unitTerms.executeQuery()) {
            while (rs.next()) {
                Element entry = new Element("gls:glossEntry");
                entry.setAttribute("ref", rs.getString(3));
                entry.setAttribute("id", rs.getString(4));
                glossary.addContent(entry);

                Element term = new Element("gls:term");
                term.setAttribute("source", rs.getString(5));
                term.setText(rs.getNString(6));
                entry.addContent(term);

                Element translation = new Element("gls:translation");
                translation.setText(rs.getNString(7));
                entry.addContent(translation);
            }
        }
        return glossary.getChildren().isEmpty() ? null : glossary;
    }

    public JSONArray machineTranslate(JSONObject json, MT translator)
            throws SQLException, IOException, InterruptedException, SAXException, ParserConfigurationException {
        JSONArray result = new JSONArray();

        String file = json.getString("file");
        String unit = json.getString("unit");
        String segment = json.getString("segment");

        String sourceText = "";
        getSource.setString(1, file);
        getSource.setString(2, unit);
        getSource.setString(3, segment);
        try (ResultSet rs = getSource.executeQuery()) {
            while (rs.next()) {
                sourceText = rs.getNString(2);
            }
        }
        Element source = buildElement("<source>" + XMLUtils.cleanText(sourceText) + "</source>");
        JSONObject tagsData = new JSONObject();
        List<JSONObject> translations = translator.translate(sourceText);
        Iterator<JSONObject> it = translations.iterator();
        while (it.hasNext()) {
            JSONObject translation = it.next();
            String origin = translation.getString("key");
            source.setAttribute("xml:lang", translation.getString("srcLang"));
            String targetText = "<target>" + XMLUtils.cleanText(translation.getString("target")) + "</target>";
            Element target = buildElement(targetText);
            target.setAttribute("xml:lang", translation.getString("tgtLang"));
            insertMatch(file, unit, segment, origin, Constants.MT, 0, source, target, tagsData);

            JSONObject match = new JSONObject();
            match.put("file", file);
            match.put("unit", unit);
            match.put("segment", segment);
            match.put("matchId", origin);
            match.put("origin", origin);
            match.put("type", Constants.MT);
            match.put("similarity", 0);
            match.put("source", sourceText);
            match.put("target", translation.getString("target"));
            result.put(match);
        }
        conn.commit();
        return result;
    }

    public JSONArray tmTranslate(JSONObject json)
            throws SAXException, IOException, ParserConfigurationException, SQLException {
        String file = json.getString("file");
        String unit = json.getString("unit");
        String segment = json.getString("segment");
        String memory = json.getString("memory");

        String src = "";
        String pure = "";
        getSource.setString(1, file);
        getSource.setString(2, unit);
        getSource.setString(3, segment);
        try (ResultSet rs = getSource.executeQuery()) {
            while (rs.next()) {
                src = rs.getNString(1);
                pure = rs.getNString(2);
            }
        }
        Element original = buildElement(src);
        MemoriesHandler.openMemory(memory);
        ITmEngine engine = MemoriesHandler.getEngine(memory);
        List<Match> matches = engine.searchTranslation(pure, srcLang, tgtLang, 60, false);
        Iterator<Match> it = matches.iterator();
        while (it.hasNext()) {
            Match m = it.next();
            JSONObject tags = new JSONObject();
            Element source = XliffUtils.toXliff("source", m.getSource(), tags);
            source.setAttribute("xml:lang", srcLang);
            Element target = XliffUtils.toXliff("target", m.getTarget(), tags);
            target.setAttribute("xml:lang", tgtLang);
            JSONObject obj = new JSONObject();
            obj.put("dataRef", tags);
            int similarity = m.getSimilarity() - tagDifferences(original, source);
            insertMatch(file, unit, segment, MemoriesHandler.getName(memory), Constants.TM, similarity, source, target,
                    obj);
            conn.commit();
        }
        MemoriesHandler.closeMemory(memory);
        return getMatches(file, unit, segment);
    }

    public void tmTranslateAll(String memory)
            throws IOException, SQLException, SAXException, ParserConfigurationException {
        MemoriesHandler.openMemory(memory);
        ITmEngine engine = MemoriesHandler.getEngine(memory);
        String sql = "SELECT file, unitId, segId, source, sourceText FROM segments WHERE state <> 'final'";
        try (ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                String file = rs.getString(1);
                String unit = rs.getString(2);
                String segment = rs.getString(3);
                String src = rs.getNString(4);
                String pure = rs.getNString(5);
                Element original = buildElement(src);
                List<Match> matches = engine.searchTranslation(pure, srcLang, tgtLang, 60, false);
                Iterator<Match> it = matches.iterator();
                while (it.hasNext()) {
                    Match m = it.next();
                    JSONObject tags = new JSONObject();
                    Element source = XliffUtils.toXliff("source", m.getSource(), tags);
                    source.setAttribute("xml:lang", srcLang);
                    Element target = XliffUtils.toXliff("target", m.getTarget(), tags);
                    target.setAttribute("xml:lang", tgtLang);
                    JSONObject obj = new JSONObject();
                    obj.put("dataRef", tags);
                    int similarity = m.getSimilarity() - tagDifferences(original, source);
                    insertMatch(file, unit, segment, MemoriesHandler.getName(memory), Constants.TM, similarity, source,
                            target, obj);
                    conn.commit();
                }
            }
        }
        MemoriesHandler.closeMemory(memory);
    }

    public static String getCatalog() throws IOException {
        if (catalog == null) {
            getPreferences();
        }
        return catalog;
    }

    public void removeTranslations() throws SQLException, SAXException, IOException, ParserConfigurationException {
        String sql = "SELECT file, unitId, segId, source FROM segments WHERE type='S' AND translate='Y' and targetText<>'' ";
        try (ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                String file = rs.getString(1);
                String unit = rs.getString(2);
                String segment = rs.getString(3);
                String src = rs.getNString(4);

                Element source = buildElement(src);
                Element target = new Element("target");
                target.setAttribute("xml:lang", tgtLang);
                if (source.hasAttribute("xml:space")) {
                    target.setAttribute("xml:space", source.getAttributeValue("xml:space"));
                }
                String pureTarget = "";

                updateTarget(file, unit, segment, target, pureTarget, false);
            }
        }
    }

    public void unconfirmTranslations() throws SQLException {
        stmt.execute("UPDATE segments SET state='initial' WHERE type='S' AND targetText='' AND translate='Y' ");
        stmt.execute("UPDATE segments SET state='translated' WHERE type='S' AND targetText <> '' AND translate='Y' ");
        conn.commit();
    }

    public void pseudoTranslate() throws SQLException, SAXException, IOException, ParserConfigurationException {
        String sql = "SELECT file, unitId, segId, source FROM segments WHERE type='S' AND (state='initial' OR targetText='') AND translate='Y' ";
        try (ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                String file = rs.getString(1);
                String unit = rs.getString(2);
                String segment = rs.getString(3);
                String src = rs.getNString(4);

                Element source = buildElement(src);
                Element target = pseudoTranslate(source);
                String pureTarget = pureText(target);

                updateTarget(file, unit, segment, target, pureTarget, false);
            }
        }
    }

    private Element pseudoTranslate(Element source) {
        Element target = new Element("target");
        target.setAttribute("xml:lang", tgtLang);
        if (source.hasAttribute("xml:space")) {
            target.setAttribute("xml:space", source.getAttributeValue("xml:space"));
        }
        List<XMLNode> content = source.getContent();
        Iterator<XMLNode> it = content.iterator();
        while (it.hasNext()) {
            XMLNode node = it.next();
            if (node.getNodeType() == XMLNode.TEXT_NODE) {
                TextNode t = (TextNode) node;
                target.addContent(pseudoTranslate(t.getText()));
            }
            if (node.getNodeType() == XMLNode.ELEMENT_NODE) {
                Element e = (Element) node;
                if ("g".equals(e.getName())) {
                    e.setText(pseudoTranslate(e.getText()));
                }
                target.addContent(e);
            }
        }
        return target;
    }

    private String pseudoTranslate(String text) {
        String result = text.replace('a', '\u00E3');
        result = result.replace('e', '\u00E8');
        result = result.replace('i', '\u00EE');
        result = result.replace('o', '\u00F4');
        result = result.replace('A', '\u00C4');
        result = result.replace('E', '\u00CB');
        result = result.replace('I', '\u00CF');
        result = result.replace('O', '\u00D5');
        result = result.replace('U', '\u00D9');
        return result;
    }

    public void copyAllSources() throws SQLException, SAXException, IOException, ParserConfigurationException {
        String sql = "SELECT file, unitId, segId, source FROM segments WHERE type='S' AND (state='initial' OR targetText='') AND translate='Y' ";
        try (ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                String file = rs.getString(1);
                String unit = rs.getString(2);
                String segment = rs.getString(3);
                String src = rs.getNString(4);

                Element source = buildElement(src);
                Element target = new Element("target");
                target.setAttribute("xml:lang", tgtLang);
                if (source.hasAttribute("xml:space")) {
                    target.setAttribute("xml:space", source.getAttributeValue("xml:space"));
                }
                target.setContent(source.getContent());
                String pureTarget = pureText(target);

                updateTarget(file, unit, segment, target, pureTarget, false);
            }
        }
    }

    public void confirmAllTranslations() throws SQLException {
        stmt.execute("UPDATE segments SET state='final' WHERE type='S' AND targetText<>'' AND translate='Y' ");
        conn.commit();
    }

    public void acceptAll100Matches() throws SQLException, SAXException, IOException, ParserConfigurationException {
        PreparedStatement perfectMatches = conn.prepareStatement(
                "SELECT target FROM matches WHERE file=? AND unitId=? AND segId=? AND type='tm' AND similarity=100 LIMIT 1");
        String sql = "SELECT file, unitId, segId, source FROM segments WHERE type='S' AND (state='initial' OR targetText='') AND translate='Y' ";
        try (ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                String file = rs.getString(1);
                String unit = rs.getString(2);
                String segment = rs.getString(3);
                String src = rs.getNString(4);

                perfectMatches.setString(1, file);
                perfectMatches.setString(2, unit);
                perfectMatches.setString(3, segment);
                try (ResultSet rs2 = perfectMatches.executeQuery()) {
                    while (rs2.next()) {
                        Element source = buildElement(src);
                        String tgt = rs2.getNString(1);
                        Element target = buildElement(tgt);
                        target.setAttribute("xml:lang", tgtLang);
                        if (source.hasAttribute("xml:space")) {
                            target.setAttribute("xml:space", source.getAttributeValue("xml:space"));
                        }
                        String pureTarget = pureText(target);
                        updateTarget(file, unit, segment, target, pureTarget, false);
                    }
                }
            }
        }
    }

    public String generateStatistics()
            throws SQLException, SAXException, IOException, ParserConfigurationException, URISyntaxException {
        getCatalog();
        updateXliff();
        RepetitionAnalysis instance = new RepetitionAnalysis();
        instance.analyse(xliffFile, catalog);
        return new File(xliffFile).getAbsolutePath() + ".log.html";
    }

    public void replaceText(JSONObject json)
            throws SQLException, SAXException, IOException, ParserConfigurationException {
        String searchText = json.getString("searchText");
        String replaceText = json.getString("replaceText");
        boolean isRegExp = json.getBoolean("regExp");
        boolean caseSensitive = json.getBoolean("caseSensitive");
        StringBuilder queryBuilder = new StringBuilder();
        queryBuilder.append("SELECT file, unitId, segId, target FROM segments WHERE type='S' AND ");
        if (isRegExp) {
            try {
                Pattern.compile(searchText);
            } catch (PatternSyntaxException e) {
                throw new IOException("Invalid regular expression");
            }
            queryBuilder.append("REGEXP_LIKE(targetText, '");
            queryBuilder.append(searchText);
            queryBuilder.append(caseSensitive ? "', 'c')" : "', 'i')");
        } else {
            queryBuilder.append(caseSensitive ? "targetText LIKE '%" : "targetText ILIKE '%");
            queryBuilder.append(searchText);
            queryBuilder.append("%'");
        }
        queryBuilder.append(" AND translate='Y'");
        try (ResultSet rs = stmt.executeQuery(queryBuilder.toString())) {
            while (rs.next()) {
                String file = rs.getString(1);
                String unit = rs.getString(2);
                String segment = rs.getString(3);
                String tgt = rs.getNString(4);

                Element target = buildElement(tgt);
                target = replaceText(target, searchText, replaceText, isRegExp);
                String pureTarget = pureText(target);
                updateTarget(file, unit, segment, target, pureTarget, false);
            }
        }
    }

    private Element replaceText(Element target, String searchText, String replaceText, boolean isRegExp) {
        List<XMLNode> newContent = new Vector<>();
        List<XMLNode> content = target.getContent();
        Iterator<XMLNode> it = content.iterator();
        while (it.hasNext()) {
            XMLNode node = it.next();
            if (node.getNodeType() == XMLNode.TEXT_NODE) {
                String text = ((TextNode) node).getText();
                text = isRegExp ? text.replaceAll(searchText, replaceText) : text.replace(searchText, replaceText);
                newContent.add(new TextNode(text));
            }
            if (node.getNodeType() == XMLNode.ELEMENT_NODE) {
                Element e = (Element) node;
                if ("mrk".equals(e.getName()) || "g".equals(e.getName())) {
                    e = replaceText(e, searchText, replaceText, isRegExp);
                }
                newContent.add(e);
            }
        }
        target.setContent(newContent);
        return target;
    }

    public void applyMtAll(JSONObject json, MT translator) throws SQLException, JSONException, SAXException,
            IOException, ParserConfigurationException, InterruptedException {
        String sql = "SELECT file, unitId, segId, sourceText FROM segments WHERE type='S' AND (state='initial' OR targetText='') AND translate='Y' ";
        try (ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                String file = rs.getString(1);
                String unit = rs.getString(2);
                String segment = rs.getString(3);
                String sourceText = rs.getNString(4);

                Element source = buildElement("<source>" + XMLUtils.cleanText(sourceText) + "</source>");

                JSONObject tagsData = new JSONObject();
                List<JSONObject> translations = translator.translate(sourceText);
                Iterator<JSONObject> it = translations.iterator();
                while (it.hasNext()) {
                    JSONObject translation = it.next();
                    String origin = translation.getString("key");
                    source.setAttribute("xml:lang", translation.getString("srcLang"));
                    String targetText = "<target>" + XMLUtils.cleanText(translation.getString("target")) + "</target>";
                    Element target = buildElement(targetText);
                    target.setAttribute("xml:lang", translation.getString("tgtLang"));
                    insertMatch(file, unit, segment, origin, Constants.MT, 0, source, target, tagsData);
                }
                conn.commit();
            }
        }
    }

    public void acceptAllMT() throws SQLException, SAXException, IOException, ParserConfigurationException {
        PreparedStatement mtMatches = conn.prepareStatement(
                "SELECT target FROM matches WHERE file=? AND unitId=? AND segId=? AND type='mt' LIMIT 1");
        String sql = "SELECT file, unitId, segId, source FROM segments WHERE type='S' AND (state='initial' OR targetText='') AND translate='Y' ";
        try (ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                String file = rs.getString(1);
                String unit = rs.getString(2);
                String segment = rs.getString(3);
                String src = rs.getNString(4);

                mtMatches.setString(1, file);
                mtMatches.setString(2, unit);
                mtMatches.setString(3, segment);
                try (ResultSet rs2 = mtMatches.executeQuery()) {
                    while (rs2.next()) {
                        Element source = buildElement(src);
                        String tgt = rs2.getNString(1);
                        Element target = buildElement(tgt);
                        target.setAttribute("xml:lang", tgtLang);
                        if (source.hasAttribute("xml:space")) {
                            target.setAttribute("xml:space", source.getAttributeValue("xml:space"));
                        }
                        String pureTarget = pureText(target);
                        updateTarget(file, unit, segment, target, pureTarget, false);
                    }
                }
            }
        }
    }

    public void removeMatches() throws SQLException {
        stmt.execute("DELETE FROM matches WHERE type='tm' ");
        conn.commit();
    }

    public void removeMT() throws SQLException {
        stmt.execute("DELETE FROM matches WHERE type='mt' ");
        conn.commit();
    }

    public JSONArray getTerms(JSONObject json) throws JSONException, SQLException {
        JSONArray result = new JSONArray();
        getTerms.setString(1, json.getString("file"));
        getTerms.setString(2, json.getString("unit"));
        getTerms.setString(3, json.getString("segment"));
        try (ResultSet rs = getTerms.executeQuery()) {
            while (rs.next()) {
                JSONObject obj = new JSONObject();
                obj.put("termId", rs.getString(1));
                obj.put("origin", rs.getString(2));
                obj.put("source", rs.getNString(3));
                obj.put("target", rs.getNString(4));
                result.put(obj);
            }
        }
        return result;
    }

    public JSONArray getSegmentTerms(JSONObject json)
            throws SQLException, IOException, SAXException, ParserConfigurationException {
        JSONArray result = new JSONArray();

        getPreferences();
        int similarity = fuzzyTermSearches ? 70 : 100;

        String sourceText = "";
        getSource.setString(1, json.getString("file"));
        getSource.setString(2, json.getString("unit"));
        getSource.setString(3, json.getString("segment"));
        try (ResultSet rs = getSource.executeQuery()) {
            while (rs.next()) {
                sourceText = rs.getNString(2);
            }
        }
        List<String> words = NGrams.buildWordList(sourceText, NGrams.TERM_SEPARATORS);

        String glossary = json.getString("glossary");
        boolean closeGlossary = false;
        if (!GlossariesHandler.isOpen(glossary)) {
            GlossariesHandler.openGlossary(glossary);
            closeGlossary = true;
        }
        String glossaryName = GlossariesHandler.getGlossaryName(glossary);
        ITmEngine engine = GlossariesHandler.getEngine(glossary);
        Map<String, String> visited = new Hashtable<>();
        for (int i = 0; i < words.size(); i++) {
            String term = "";
            for (int length = 0; length < MAXTERMLENGTH; length++) {
                if (i + length < words.size()) {
                    term = term + " " + words.get(i + length);
                    if (!visited.containsKey(term.trim())) {
                        visited.put(term.trim(), "");
                        List<Element> res = engine.searchAll(term.trim(), srcLang, similarity, caseSensitiveSearches);
                        for (int j = 0; j < res.size(); j++) {
                            JSONArray array = parseMatches(res);
                            for (int h = 0; h < array.length(); h++) {
                                JSONObject match = array.getJSONObject(h);
                                match.put("origin", glossaryName);
                                result.put(match);
                                saveTerm(json.getString("file"), json.getString("unit"), json.getString("segment"),
                                        glossaryName, match.getString("source"), match.getString("target"));
                            }
                        }
                    }
                }
            }
        }
        if (closeGlossary) {
            GlossariesHandler.closeGlossary(glossary);
        }
        return result;
    }

    public void getProjectTerms(JSONObject json)
            throws IOException, SQLException, SAXException, ParserConfigurationException {
        getPreferences();
        int similarity = fuzzyTermSearches ? 70 : 100;
        String glossary = json.getString("glossary");
        boolean closeGlossary = false;
        if (!GlossariesHandler.isOpen(glossary)) {
            GlossariesHandler.openGlossary(glossary);
            closeGlossary = true;
        }
        String glossaryName = GlossariesHandler.getGlossaryName(glossary);
        ITmEngine engine = GlossariesHandler.getEngine(glossary);
        try (PreparedStatement segIterator = conn.prepareStatement(
                "SELECT file, unitId, segId, sourceText FROM segments WHERE type='S' AND translate='Y' ")) {
            try (ResultSet set = segIterator.executeQuery()) {
                while (set.next()) {
                    String file = set.getString(1);
                    String unit = set.getString(2);
                    String segment = set.getString(3);
                    String sourceText = set.getNString(4);

                    List<String> words = NGrams.buildWordList(sourceText, NGrams.TERM_SEPARATORS);

                    Map<String, String> visited = new Hashtable<>();
                    for (int i = 0; i < words.size(); i++) {
                        String term = "";
                        for (int length = 0; length < MAXTERMLENGTH; length++) {
                            if (i + length < words.size()) {
                                term = term + " " + words.get(i + length);
                                if (!visited.containsKey(term.trim())) {
                                    visited.put(term.trim(), "");
                                    List<Element> res = engine.searchAll(term.trim(), srcLang, similarity,
                                            caseSensitiveSearches);
                                    for (int j = 0; j < res.size(); j++) {
                                        JSONArray array = parseMatches(res);
                                        for (int h = 0; h < array.length(); h++) {
                                            JSONObject match = array.getJSONObject(h);
                                            match.put("origin", glossaryName);
                                            saveTerm(file, unit, segment, glossaryName, match.getString("source"),
                                                    match.getString("target"));
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        if (closeGlossary) {
            GlossariesHandler.closeGlossary(glossary);
        }
    }

    private void saveTerm(String file, String unit, String segment, String origin, String source, String target)
            throws SQLException {
        boolean found = false;
        checkTerm.setString(1, file);
        checkTerm.setString(2, unit);
        checkTerm.setString(3, segment);
        checkTerm.setString(4, "" + (source + origin).hashCode());
        try (ResultSet rs = checkTerm.executeQuery()) {
            while (rs.next()) {
                found = true;
            }
        }
        if (!found) {
            insertTerm.setString(1, file);
            insertTerm.setString(2, unit);
            insertTerm.setString(3, segment);
            insertTerm.setString(4, "" + (source + origin).hashCode());
            insertTerm.setString(5, origin);
            insertTerm.setNString(6, source);
            insertTerm.setNString(7, target);
            insertTerm.execute();
            conn.commit();
        }
    }

    private JSONArray parseMatches(List<Element> matches) throws IOException {
        JSONArray result = new JSONArray();
        for (int i = 0; i < matches.size(); i++) {
            Map<String, String> map = new Hashtable<>();
            Element element = matches.get(i);
            List<Element> tuvs = element.getChildren("tuv");
            Iterator<Element> it = tuvs.iterator();
            while (it.hasNext()) {
                Element tuv = it.next();
                map.put(tuv.getAttributeValue("xml:lang"), MemoriesHandler.pureText(tuv.getChild("seg")));
            }
            if (map.containsKey(tgtLang)) {
                JSONObject obj = new JSONObject();
                obj.put("source", map.get(srcLang));
                obj.put("target", map.get(tgtLang));
                result.put(obj);
            }
        }
        return result;
    }

    public void lockSegment(JSONObject json) throws SQLException {
        String sql = "SELECT translate FROM segments WHERE file=? AND unitId=? AND segId=?";
        String translate = "";
        try (PreparedStatement st = conn.prepareStatement(sql)) {
            st.setString(1, json.getString("file"));
            st.setString(2, json.getString("unit"));
            st.setString(3, json.getString("segment"));
            try (ResultSet rs = st.executeQuery()) {
                while (rs.next()) {
                    translate = rs.getString(1);
                }
            }
        }
        sql = "UPDATE segments SET translate=? WHERE file=? AND unitId=? AND segId=?";
        try (PreparedStatement st = conn.prepareStatement(sql)) {
            st.setString(1, translate.equals("Y") ? "N" : "Y");
            st.setString(2, json.getString("file"));
            st.setString(3, json.getString("unit"));
            st.setString(4, json.getString("segment"));
            st.executeUpdate();
            conn.commit();
        }
    }

    public void unlockAll() throws SQLException {
        stmt.executeUpdate("UPDATE segments SET translate='Y' WHERE type='S' AND translate='N' ");
        conn.commit();
    }

    public void lockDuplicates() throws SQLException, SAXException, IOException, ParserConfigurationException {
        String sql = "UPDATE segments SET translate='N' WHERE file=? AND unitId=? AND segId=?";
        try (PreparedStatement lockStmt = conn.prepareStatement(sql)) {
            Element currentSource = new Element("source");
            sql = "SELECT file, unitId, segId, source FROM segments WHERE type='S' ORDER BY source, file, unitId, segId";
            try (ResultSet rs = stmt.executeQuery(sql)) {
                while (rs.next()) {
                    Element source = buildElement(rs.getNString(4));
                    if (source.equals(currentSource)) {
                        lockStmt.setString(1, rs.getString(1));
                        lockStmt.setString(2, rs.getString(2));
                        lockStmt.setString(3, rs.getString(3));
                        lockStmt.executeUpdate();
                        conn.commit();
                    } else {
                        currentSource = source;
                    }
                }
            }
        }
    }

    public JSONObject analyzeSpaces() throws SQLException {
        JSONObject result = new JSONObject();
        JSONArray errors = new JSONArray();
        int index = 0;
        String sql = "SELECT file, unitId, segId, child, sourceText, targetText, state, translate FROM segments WHERE type='S' ORDER BY file, child ";
        try (ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                index++;
                boolean translate = rs.getString(8).equals("Y");
                if (!translate) {
                    continue;
                }
                boolean isFinal = rs.getString(7).equals("final");
                if (!isFinal) {
                    continue;
                }
                String sourceText = rs.getNString(5);
                String targetText = rs.getNString(6);
                int[] sourceSpaces = countSpaces(sourceText);
                int[] targetSpaces = countSpaces(targetText);
                boolean initial = sourceSpaces[0] != targetSpaces[0];
                boolean trailing = sourceSpaces[1] != targetSpaces[1];
                if (initial || trailing) {
                    JSONObject error = new JSONObject();
                    error.put("file", rs.getString(1));
                    error.put("unit", rs.getString(2));
                    error.put("segment", rs.getString(3));
                    String type = "";
                    if (initial) {
                        type = "Initial";
                    }
                    if (trailing) {
                        type = "Trailing";
                    }
                    if (initial && trailing) {
                        type = "Initial - Trailing";
                    }
                    error.put("type", type);
                    error.put("index", index);
                    errors.put(error);
                }
            }
        }
        result.put("errors", errors);
        return result;
    }

    private int[] countSpaces(String text) {
        int start = 0;
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            if (!Character.isWhitespace(c)) {
                break;
            }
            start++;
        }
        int end = 0;
        for (int i = text.length() - 1; i >= 0; i--) {
            char c = text.charAt(i);
            if (!Character.isWhitespace(c)) {
                break;
            }
            end++;
        }
        return new int[] { start, end };
    }

    public JSONObject analyzeTags() throws SQLException, SAXException, IOException, ParserConfigurationException {
        JSONObject result = new JSONObject();
        JSONArray errors = new JSONArray();
        int index = 0;
        String sql = "SELECT file, unitId, segId, child, source, target, state, translate FROM segments WHERE type='S' ORDER BY file, child ";
        try (ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                index++;
                boolean translate = rs.getString(8).equals("Y");
                if (!translate) {
                    continue;
                }
                boolean isFinal = rs.getString(7).equals("final");
                if (!isFinal) {
                    continue;
                }
                String sourceText = rs.getNString(5);
                Element source = buildElement(sourceText);
                String targetText = rs.getNString(6);
                Element target = buildElement(targetText);

                List<String> sourceTags = tagsList(source);
                List<String> targetTags = tagsList(target);
                if (sourceTags.size() > targetTags.size()) {
                    JSONObject error = new JSONObject();
                    error.put("file", rs.getString(1));
                    error.put("unit", rs.getString(2));
                    error.put("segment", rs.getString(3));
                    error.put("type", "Missing Tags");
                    error.put("index", index);
                    errors.put(error);
                }
                if (sourceTags.size() < targetTags.size()) {
                    JSONObject error = new JSONObject();
                    error.put("file", rs.getString(1));
                    error.put("unit", rs.getString(2));
                    error.put("segment", rs.getString(3));
                    error.put("type", "Extra Tags");
                    error.put("index", index);
                    errors.put(error);
                }
                if (sourceTags.size() == targetTags.size()) {
                    for (int i = 0; i < sourceTags.size(); i++) {
                        if (!sourceTags.get(i).equals(targetTags.get(i))) {
                            JSONObject error = new JSONObject();
                            error.put("file", rs.getString(1));
                            error.put("unit", rs.getString(2));
                            error.put("segment", rs.getString(3));
                            error.put("type", "Tags in wrong order");
                            error.put("index", index);
                            errors.put(error);
                            break;
                        }
                    }
                }
            }
        }
        result.put("errors", errors);
        return result;
    }

    private List<String> tagsList(Element root) {
        List<String> result = new Vector<>();
        List<XMLNode> content = root.getContent();
        Iterator<XMLNode> it = content.iterator();
        while (it.hasNext()) {
            XMLNode node = it.next();
            if (node.getNodeType() == XMLNode.ELEMENT_NODE) {
                Element e = (Element) node;
                if ("mrk".equals(e.getName()) || "pc".equals(e.getName())) {
                    result.add(XliffUtils.getHeader(e));
                    result.add(XliffUtils.getTail(e));
                } else {
                    result.add(e.toString());
                }
            }
        }
        return result;
    }
}