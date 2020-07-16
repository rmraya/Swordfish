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

import javax.xml.parsers.ParserConfigurationException;

import com.maxprograms.swordfish.Constants;
import com.maxprograms.swordfish.TmsServer;
import com.maxprograms.tmengine.MatchQuality;
import com.maxprograms.xml.Catalog;
import com.maxprograms.xml.Document;
import com.maxprograms.xml.Element;
import com.maxprograms.xml.Indenter;
import com.maxprograms.xml.SAXBuilder;
import com.maxprograms.xml.TextNode;
import com.maxprograms.xml.XMLNode;
import com.maxprograms.xml.XMLOutputter;

import org.json.JSONArray;
import org.json.JSONObject;
import org.xml.sax.SAXException;

public class XliffStore {

    Logger logger = System.getLogger(XliffStore.class.getName());

    private static final int THRESHOLD = 60;

    private String xliffFile;
    private SAXBuilder builder;
    private Document document;

    private File database;
    private Connection conn;
    private PreparedStatement insertUnit;
    private PreparedStatement insertSegment;
    private PreparedStatement insertMatch;
    private PreparedStatement getMatches;
    private PreparedStatement insertTerm;
    private PreparedStatement getUnitData;
    private PreparedStatement getSource;
    private PreparedStatement getTarget;
    private PreparedStatement updateTarget;
    private Statement stmt;
    private boolean preserve;

    private int index;
    private long nextId;
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

    public XliffStore(String xliffFile, String srcLang, String tgtLang)
            throws SAXException, IOException, ParserConfigurationException, URISyntaxException, SQLException {
        this.xliffFile = xliffFile;
        this.srcLang = srcLang;
        this.tgtLang = tgtLang;
        File xliff = new File(xliffFile);

        database = new File(xliff.getParentFile(), "h2data");
        boolean needsLoading = !database.exists();
        if (!database.exists()) {
            database.mkdirs();
        }
        builder = new SAXBuilder();
        builder.setEntityResolver(new Catalog(getCatalogFile()));

        String url = "jdbc:h2:" + database.getAbsolutePath() + "/db";
        conn = DriverManager.getConnection(url);
        conn.setAutoCommit(false);
        if (needsLoading) {
            logger.log(Level.INFO, "Creating database");
            createTables();
            document = builder.build(xliffFile);
            parseDocument();
            conn.commit();
        }
        getUnitData = conn.prepareStatement("SELECT data FROM units WHERE file=? AND unitId=?");
        getSource = conn.prepareStatement("SELECT source FROM segments WHERE file=? AND unitId=? AND segId=?");
        getTarget = conn.prepareStatement("SELECT target FROM segments WHERE file=? AND unitId=? AND segId=?");
        updateTarget = conn.prepareStatement(
                "UPDATE segments SET target=?, targetText=?, state=? WHERE file=? AND unitId=? AND segId=?");
        insertMatch = conn.prepareStatement(
                "INSERT INTO matches (file, unitId, segId, matchId, origin, type, similarity, source, target) VALUES(?,?,?,?,?,?,?,?,?)");
        getMatches = conn.prepareStatement(
                "SELECT file, unitId, segId, matchId, origin, type, similarity, source, target FROM matches WHERE file=? AND unitId=? AND segId=? ORDER BY similarity DESC");
        stmt = conn.createStatement();
    }

    private void createTables() throws SQLException {
        String query1 = "CREATE TABLE units (file VARCHAR(50), " + "unitId VARCHAR(50) NOT NULL, "
                + "data VARCHAR(6000) NOT NULL, PRIMARY KEY(file, unitId) );";
        String query2 = "CREATE TABLE segments (file VARCHAR(50), unitId VARCHAR(50) NOT NULL, "
                + "segId VARCHAR(50) NOT NULL, type CHAR(1) NOT NULL DEFAULT 'S', state VARCHAR(12) DEFAULT 'initial', child INTEGER, "
                + "translate CHAR(1), tags INTEGER DEFAULT 0, space CHAR(1) DEFAULT 'N', source VARCHAR(6000) NOT NULL, sourceText VARCHAR(6000) NOT NULL, "
                + "target VARCHAR(6000) NOT NULL, targetText VARCHAR(6000) NOT NULL, "
                + "PRIMARY KEY(file, unitId, segId, type) );";
        String query3 = "CREATE TABLE matches (file VARCHAR(50), unitId VARCHAR(50) NOT NULL, "
                + "segId VARCHAR(50) NOT NULL, matchId varchar(256), origin VARCHAR(256), type CHAR(2) NOT NULL DEFAULT 'TM', "
                + "similarity FLOAT DEFAULT 0.0, source VARCHAR(6000) NOT NULL, target VARCHAR(6000) NOT NULL, "
                + "PRIMARY KEY(file, unitId, segId, matchid) );";
        String query4 = "CREATE TABLE terms (file VARCHAR(50), unitId VARCHAR(50) NOT NULL, "
                + "segId VARCHAR(50) NOT NULL, termid varchar(256),  "
                + "origin VARCHAR(256), source VARCHAR(6000) NOT NULL, target VARCHAR(6000) NOT NULL, "
                + "PRIMARY KEY(file, unitId, segId, termid) );";
        try (Statement stmt = conn.createStatement()) {
            stmt.execute(query1);
            stmt.execute(query2);
            stmt.execute(query3);
            stmt.execute(query4);
            conn.commit();
        }
    }

    private void parseDocument() throws SQLException {
        nextId = System.currentTimeMillis();
        insertUnit = conn.prepareStatement("INSERT INTO units (file, unitId, data) VALUES (?,?,?)");
        insertSegment = conn.prepareStatement(
                "INSERT INTO segments (file, unitId, segId, type, state, child, translate, tags, space, source, sourceText, target, targetText) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)");
        recurse(document.getRootElement());
        insertUnit.close();
        insertSegment.close();
    }

    private void recurse(Element e) throws SQLException {
        if ("file".equals(e.getName())) {
            srcLang = e.getAttributeValue("srcLang");
            String tgt = e.getAttributeValue("tgtLang");
            if (!tgt.isEmpty()) {
                tgtLang = tgt;
            }
            currentFile = e.getAttributeValue("id");
            index = 0;
        }
        if ("unit".equals(e.getName())) {
            tagCount = 0;
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
            if (tagCount > 0) {
                insertUnit.setString(1, currentFile);
                insertUnit.setString(2, currentUnit);
                insertUnit.setString(3, data.toString());
                insertUnit.execute();
            }
            // Element matches = e.getChild("mtc:matches");
            // Element glossary = e.getChild("gls:glossary");

            // TODO store matches and terms
        }
        if ("segment".equals(e.getName())) {
            String id = e.getAttributeValue("id");
            if (id.isEmpty()) {
                id = "" + nextId++;
                e.setAttribute("id", id);
            }
            Element source = e.getChild("source");
            source.setAttribute("xml:lang", srcLang);
            boolean sourcePreserve = "preserve".equals(source.getAttributeValue("xml:space", "default"));
            Element target = e.getChild("target");
            if (target == null) {
                target = new Element("target");
                if (sourcePreserve) {
                    target.setAttribute("xml:space", "preserve");
                }
            }
            target.setAttribute("xml:lang", tgtLang);
            String targetText = pureText(target);
            state = e.getAttributeValue("state", targetText.isEmpty() ? "initial" : "translated");

            preserve = preserve | sourcePreserve | "preserve".equals(target.getAttributeValue("xml:space", "default"));
            insertSegment.setString(1, currentFile);
            insertSegment.setString(2, currentUnit);
            insertSegment.setString(3, id);
            insertSegment.setString(4, "S");
            insertSegment.setString(5, state);
            insertSegment.setInt(6, index++);
            insertSegment.setString(7, translate ? "Y" : "N");
            insertSegment.setInt(8, tagCount);
            insertSegment.setString(9, preserve ? "Y" : "N");
            insertSegment.setNString(10, source.toString());
            insertSegment.setNString(11, pureText(source));
            insertSegment.setNString(12, target != null ? target.toString() : "");
            insertSegment.setNString(13, target != null ? targetText : "");
            insertSegment.execute();
        }
        if ("ignorable".equals(e.getName())) {
            String id = e.getAttributeValue("id");
            if (id.isEmpty()) {
                id = "" + nextId++;
                e.setAttribute("id", id);
            }
            Element source = e.getChild("source");
            Element target = e.getChild("target");
            insertSegment.setString(1, currentFile);
            insertSegment.setString(2, currentUnit);
            insertSegment.setString(3, id);
            insertSegment.setString(4, "I");
            insertSegment.setString(5, "");
            insertSegment.setInt(6, index++);
            insertSegment.setString(7, "N");
            insertSegment.setInt(8, tagCount);
            insertSegment.setString(9, preserve ? "Y" : "N");
            insertSegment.setNString(10, source.toString());
            insertSegment.setNString(11, pureText(source));
            insertSegment.setNString(12, target != null ? target.toString() : "");
            insertSegment.setNString(13, target != null ? pureText(target) : "");
            insertSegment.execute();
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

    public synchronized List<JSONObject> getSegments(List<String> filesList, int start, int count, String filterText,
            String filterLanguage, boolean caseSensitiveFilter, boolean filterUntranslated, boolean regExp)
            throws SQLException, SAXException, IOException, ParserConfigurationException {
        List<JSONObject> result = new Vector<>();
        if (filterText.isEmpty()) {
            int index = start;
            String query = "SELECT file, unitId, segId, child, source, target, tags, state, space, translate FROM segments WHERE type='S' ORDER BY file, child LIMIT "
                    + count + " OFFSET " + start + " ";
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
                        getUnitData.setString(1, file);
                        getUnitData.setString(2, unit);
                        String data = "";
                        try (ResultSet rs2 = getUnitData.executeQuery()) {
                            while (rs2.next()) {
                                data = rs2.getString(1);
                            }
                        }
                        tagsData = new JSONObject(data);
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
                    row.put("source", addHtmlTags(source, filterText, caseSensitiveFilter, regExp, tagsData));
                    tag = 1;
                    row.put("target", addHtmlTags(target, filterText, caseSensitiveFilter, regExp, tagsData));
                    result.add(row);
                }
            }
        } else {
            // TODO filter segments
        }
        return result;
    }

    public void close() throws SQLException {
        getUnitData.close();
        getSource.close();
        getTarget.close();
        updateTarget.close();
        insertMatch.close();
        getMatches.close();
        stmt.close();
        conn.commit();
        conn.close();
        conn = null;
        logger.log(Level.INFO, "Closed store");
    }

    public String getSrcLang() {
        return srcLang;
    }

    public String getTgtLang() {
        return tgtLang;
    }

    private String getCatalogFile() throws IOException {
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
        return json.getString("catalog");
    }

    public synchronized JSONArray saveSegment(JSONObject json)
            throws IOException, SQLException, SAXException, ParserConfigurationException {
        JSONArray result = new JSONArray();
        String file = json.getString("file");
        String unit = json.getString("unit");
        String segment = json.getString("segment");
        String translation = json.getString("translation").replace("&nbsp;", "\u00A0");

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

        updateTarget(file, unit, segment, target, pureTarget);

        if (!pureTarget.isBlank()) {
            result = propagate(source, target, pureTarget);
        }
        conn.commit();
        return result;
    }

    private void updateTarget(String file, String unit, String segment, Element target, String pureTarget)
            throws SQLException {
        updateTarget.setNString(1, target.toString());
        updateTarget.setNString(2, pureTarget);
        updateTarget.setString(3, pureTarget.isBlank() ? Constants.INITIAL : Constants.TRANSLATED);
        updateTarget.setString(4, file);
        updateTarget.setString(5, unit);
        updateTarget.setString(6, segment);
        updateTarget.executeUpdate();
    }

    private JSONArray propagate(Element source, Element target, String pureTarget)
            throws SQLException, SAXException, IOException, ParserConfigurationException {
        JSONArray result = new JSONArray();
        String dummySource = dummyTagger(source);
        String query = "SELECT file, unitId, segId, source, state, tags, space FROM segments WHERE translate='Y' AND type='S' AND state <> 'final' ";
        try (ResultSet rs = stmt.executeQuery(query)) {
            while (rs.next()) {
                Element candidate = buildElement(rs.getNString(4));
                String dummy = dummyTagger(candidate);
                int similarity = MatchQuality.similarity(dummySource, dummy);
                if (similarity > THRESHOLD) {
                    String file = rs.getString(1);
                    String unit = rs.getString(2);
                    String segment = rs.getString(3);
                    String state = rs.getString(5);
                    int tags = rs.getInt(6);
                    boolean preserve = "Y".equals(rs.getString(7));
                    if (similarity == 100 && Constants.INITIAL.equals(state)) {
                        JSONObject tagsData = new JSONObject();
                        if (tags > 0) {
                            getUnitData.setString(1, file);
                            getUnitData.setString(2, unit);
                            String data = "";
                            try (ResultSet rs2 = getUnitData.executeQuery()) {
                                while (rs2.next()) {
                                    data = rs2.getString(1);
                                }
                            }
                            tagsData = new JSONObject(data);
                        }

                        tagsMap = new Hashtable<>();
                        tag = 1;
                        addHtmlTags(candidate, "", false, false, tagsData);

                        JSONObject row = new JSONObject();
                        row.put("file", file);
                        row.put("unit", unit);
                        row.put("segment", segment);
                        tag = 1;
                        String translation = addHtmlTags(target, "", false, false, tagsData);
                        row.put("target", translation);
                        result.put(row);

                        Element translated = buildElement("<target>" + translation + "</target>");
                        translated.setAttribute("xml:lang", tgtLang);
                        translated.setAttribute("xml:space", preserve ? "preserve" : "default");
                        translated.setContent(target.getContent());
                        updateTarget(file, unit, segment, translated, pureText(translated));
                    }
                    inserMatch(file, unit, segment, "Self", "TM", similarity, source, target);
                }
            }
        }
        return result;
    }

    private synchronized void inserMatch(String file, String unit, String segment, String origin, String type,
            int similarity, Element source, Element target) throws SQLException {
        String matchId = "" + pureText(source).hashCode();
        JSONArray matches = getMatches(file, unit, segment);
        for (int i = 0; i < matches.length(); i++) {
            JSONObject match = matches.getJSONObject(i);
            if (match.getString("matchId").equals(matchId)) {
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
                match.put("similarity", rs.getFloat(7));
                match.put("source", rs.getNString(8));
                match.put("target", rs.getNString(9));
                result.put(match);
            }
        }
        return result;
    }

    private String dummyTagger(Element e) {
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
                    string.append('{');
                    string.append(dummy++);
                    string.append('}');
                    string.append(dummyTagger(el));
                    string.append('{');
                    string.append(dummy++);
                    string.append('}');
                } else if ("cp".equals(el.getName())) {
                    // TODO handle codepoint tags
                } else {
                    string.append('{');
                    string.append(dummy++);
                    string.append('}');
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

    private String addHtmlTags(Element seg, String filterText, boolean caseSensitive, boolean regExp,
            JSONObject originalData) throws IOException {
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
                    text.append(addHtmlTags(e, filterText, caseSensitive, regExp, originalData));
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
                    // TODO handle codepoint tags
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
                    // TODO handle codepoint tags
                } else {
                    result.put(e.getAttributeValue("id"), e.toString());
                }
            }
        }
        return result;
    }
}