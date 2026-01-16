/*******************************************************************************
 * Copyright (c) 2008-2023 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/
package com.maxprograms.swordfish.tm;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.lang.System.Logger;
import java.lang.System.Logger.Level;
import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.text.MessageFormat;
import java.util.Collections;
import java.util.Enumeration;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.NavigableSet;
import java.util.Set;
import java.util.TreeSet;
import java.util.Vector;
import java.util.regex.Pattern;

import javax.xml.parsers.ParserConfigurationException;

import org.json.JSONArray;
import org.json.JSONObject;
import org.mapdb.Fun;
import org.mapdb.Fun.Tuple2;
import org.sqlite.Function;
import org.xml.sax.SAXException;

import com.maxprograms.languages.LanguageUtils;
import com.maxprograms.swordfish.Constants;
import com.maxprograms.swordfish.TmsServer;
import com.maxprograms.swordfish.tmx.TMXReader;
import com.maxprograms.xml.Element;
import com.maxprograms.xml.Indenter;
import com.maxprograms.xml.XMLUtils;

public class SqliteDatabase implements ITmEngine {

    Logger logger = System.getLogger(SqliteDatabase.class.getName());

    private String dbname;
    private File databaseFolder;
    private File database;
    private Connection conn;
    private PreparedStatement storeTUV;
    private PreparedStatement searchTUV;
    private PreparedStatement deleteTUV;
    private TuDatabase tuDb;
    private FuzzyIndex fuzzyIndex;
    private long next;
    private String currProject;
    private String currSubject;
    private String currCustomer;
    private FileOutputStream output;
    private String creationId;

    private TMXReader reader;

    public SqliteDatabase(String dbname, String workFolder) throws IOException, SQLException {
        this.dbname = dbname;
        JSONObject json = TmsServer.getPreferences();
        creationId = json.getString("userName");
        File wfolder = new File(workFolder);
        databaseFolder = new File(wfolder, dbname);
        if (!databaseFolder.exists()) {
            Files.createDirectories(databaseFolder.toPath());
        }
        if (new File(databaseFolder, "db.db").exists()) {
            MessageFormat mf = new MessageFormat(Messages.getString("SqliteDatabase.0"));
            throw new IOException(mf.format(new String[] { databaseFolder.getName() }));
        }
        database = new File(databaseFolder, "database.db");
        boolean sqliteNeedsCreation = !database.exists();
        DriverManager.registerDriver(new org.sqlite.JDBC());
        conn = DriverManager.getConnection("jdbc:sqlite:" + database.getAbsolutePath().replace('\\', '/'));
        conn.setAutoCommit(false);
        Function.create(conn, "REGEXP", new Function() {
            @Override
            protected void xFunc() throws SQLException {
                String expression = value_text(0);
                String value = value_text(1);
                if (value == null)
                    value = "";

                Pattern pattern = Pattern.compile(expression);
                result(pattern.matcher(value).find() ? 1 : 0);
            }
        });
        if (sqliteNeedsCreation) {
            createTables();
        }
        storeTUV = conn.prepareStatement("INSERT INTO tuv (tuid, lang, seg, puretext, textlength) VALUES (?,?,?,?,?)");
        searchTUV = conn.prepareStatement("SELECT textlength FROM tuv WHERE tuid=? AND lang=?");
        deleteTUV = conn.prepareStatement("DELETE FROM tuv WHERE tuid=? AND lang=?");
        try {
            tuDb = new TuDatabase(databaseFolder);
        } catch (Exception e) {
            logger.log(Level.ERROR, e.getMessage(), e);
            MessageFormat mf = new MessageFormat(Messages.getString("SqliteDatabase.1"));
            throw new IOException(mf.format(new String[] { dbname }));
        }
        try {
            fuzzyIndex = new FuzzyIndex(databaseFolder);
        } catch (Exception e) {
            logger.log(Level.ERROR, e.getMessage(), e);
            MessageFormat mf = new MessageFormat(Messages.getString("SqliteDatabase.2"));
            throw new IOException(mf.format(new String[] { dbname }));
        }
    }

    private void createTables() throws SQLException {
        String sql = """
                CREATE TABLE tuv (
                tuid VARCHAR(256) NOT NULL,
                lang VARCHAR(15) NOT NULL,
                seg TEXT NOT NULL,
                puretext TEXT NOT NULL,
                textlength INTEGER NOT NULL,
                PRIMARY KEY(tuid, lang)
                );""";
        try (Statement stmt = conn.createStatement()) {
            stmt.execute(sql);
        }
        conn.commit();
    }

    @Override
    public JSONArray batchTranslate(JSONObject params)
            throws IOException, SAXException, ParserConfigurationException, SQLException, URISyntaxException {
        JSONArray result = new JSONArray();
        String srcLang = params.getString("srcLang");
        String tgtLang = params.getString("tgtLang");
        JSONArray segments = params.getJSONArray("segments");
        boolean caseSensitiveMatches = params.getBoolean("caseSensitiveMatches");
        for (int i = 0; i < segments.length(); i++) {
            JSONObject json = segments.getJSONObject(i);
            List<Match> matches = searchTranslation(json.getString("pure"), srcLang, tgtLang, 60, caseSensitiveMatches);
            JSONArray array = new JSONArray();
            for (int j = 0; j < matches.size(); j++) {
                array.put(matches.get(j).toJSON());
            }
            json.put("matches", array);
            result.put(json);
        }
        return result;
    }

    @Override
    public void close() throws IOException, SQLException, URISyntaxException {
        storeTUV.close();
        deleteTUV.close();
        searchTUV.close();
        conn.commit();
        conn.close();
        fuzzyIndex.commit();
        fuzzyIndex.close();
        tuDb.commit();
        tuDb.close();
    }

    @Override
    public void commit() throws SQLException, IOException, URISyntaxException {
        conn.commit();
        fuzzyIndex.commit();
        tuDb.commit();
    }

    @Override
    public List<Element> concordanceSearch(String searchStr, String srcLang, int limit, boolean isRegexp,
            boolean caseSensitive) throws SQLException, SAXException, IOException, ParserConfigurationException {
        List<Element> result = new Vector<>();
        Vector<String> candidates = new Vector<>();
        if (isRegexp) {
            try (PreparedStatement stmt = conn
                    .prepareStatement("SELECT tuid, puretext FROM tuv WHERE lang=? AND puretext REGEXP ? LIMIT ?")) {
                stmt.setString(1, srcLang);
                stmt.setString(2, searchStr);
                stmt.setInt(3, limit);
                try (ResultSet rs = stmt.executeQuery()) {
                    while (rs.next()) {
                        candidates.add(rs.getString(1));
                    }
                }
            }
        } else {
            String sql = caseSensitive ? "SELECT tuid, puretext FROM tuv WHERE lang=? AND puretext GLOB ? LIMIT ?"
                    : "SELECT tuid, puretext FROM tuv WHERE lang=? AND puretext LIKE ? LIMIT ?";
            String escaped = searchStr.replace("%", "\\%").replace("_", "\\_");
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, srcLang);
                stmt.setString(2, caseSensitive ? "*" + escaped + "*" : "%" + escaped + "%");
                stmt.setInt(3, limit);
                try (ResultSet rs = stmt.executeQuery()) {
                    while (rs.next()) {
                        candidates.add(rs.getString(1));
                    }
                }
            }
        }

        Iterator<String> it = candidates.iterator();
        while (it.hasNext()) {
            String tuid = it.next();
            Element tu = getTu(tuid);
            result.add(tu);
        }
        return result;
    }

    @Override
    public void deleteDatabase() throws IOException {
        TmsServer.deleteFolder(databaseFolder);
    }

    private void writeString(String string) throws IOException {
        output.write(string.getBytes(StandardCharsets.UTF_8));
    }

    private void writeHeader(String srcLang) throws IOException {
        writeString("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        writeString(
                "<!DOCTYPE tmx PUBLIC \"-//LISA OSCAR:1998//DTD for Translation Memory eXchange//EN\" \"tmx14.dtd\" >\n");
        writeString("<tmx version=\"1.4\">\n");
        writeString("<header creationtool=\"" + Constants.APPNAME + "\" creationtoolversion=\"" + Constants.VERSION
                + "\" srclang=\"" + srcLang + "\" "
                + " adminlang=\"en\" datatype=\"xml\" o-tmf=\"unknown\" segtype=\"block\" creationdate=\""
                + TMUtils.creationDate() + "\"/>\n");
    }

    @Override
    public void exportMemory(String tmxfile, Set<String> langs, String srcLang) throws IOException, SQLException {
        output = new FileOutputStream(tmxfile);
        writeHeader(srcLang);
        writeString("<body>\n");
        try (PreparedStatement stmt = conn.prepareStatement("SELECT lang, seg FROM tuv WHERE tuid=?")) {
            try (Statement tus = conn.createStatement()) {
                try (ResultSet tuKeys = tus.executeQuery("SELECT DISTINCT TUID from TUV")) {
                    while (tuKeys.next()) {
                        String tuid = tuKeys.getString(1);
                        Element tu = tuDb.getTu(tuid);
                        stmt.setString(1, tuid);
                        int count = 0;
                        try (ResultSet rs = stmt.executeQuery()) {
                            while (rs.next()) {
                                String lang = rs.getString(1);
                                String seg = rs.getString(2);
                                if (seg.equals("<seg></seg>") || !langs.contains(lang)) {
                                    continue;
                                }
                                try {
                                    Element tuv = TMUtils.buildTuv(lang, seg);
                                    tu.addContent(tuv);
                                    count++;
                                } catch (Exception e) {
                                    logger.log(Level.ERROR, Messages.getString("SqliteDatabase.3"), e);
                                    logger.log(Level.INFO, "seg: " + seg);
                                }
                            }
                        }
                        if (count >= 2) {
                            Indenter.indent(tu, 2);
                            writeString(tu.toString() + "\n");
                        }
                    }
                }
            }
        }
        writeString("</body>\n");
        writeString("</tmx>\n");
        output.close();
    }

    @Override
    public Set<String> getAllClients() throws SQLException, IOException, URISyntaxException {
        return tuDb.getCustomers();
    }

    @Override
    public Set<String> getAllLanguages() throws SQLException, IOException, URISyntaxException {
        Set<String> result = Collections.synchronizedSortedSet(new TreeSet<>());
        try (Statement stmt = conn.createStatement()) {
            try (ResultSet rs = stmt.executeQuery("SELECT DISTINCT lang FROM tuv")) {
                while (rs.next()) {
                    result.add(rs.getString(1));
                }
            }
        }
        return result;
    }

    @Override
    public Set<String> getAllProjects() throws SQLException, IOException, URISyntaxException {
        return tuDb.getProjects();
    }

    @Override
    public Set<String> getAllSubjects() throws SQLException, IOException, URISyntaxException {
        return tuDb.getSubjects();
    }

    @Override
    public String getName() {
        return dbname;
    }

    @Override
    public Element getTu(String tuid)
            throws IOException, SAXException, ParserConfigurationException, SQLException {
        Element tu = tuDb.getTu(tuid);
        try (PreparedStatement stmt = conn.prepareStatement("SELECT lang, seg FROM tuv WHERE tuid=?")) {
            stmt.setString(1, tuid);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    String lang = rs.getString(1);
                    String seg = rs.getString(2);
                    if (seg.equals("<seg></seg>")) {
                        continue;
                    }
                    Element tuv = TMUtils.buildTuv(lang, seg);
                    tu.addContent(tuv);
                }
            }
        }
        return tu;
    }

    @Override
    public String getType() {
        return SqliteDatabase.class.getName();
    }

    @Override
    public void removeTu(String tuid)
            throws IOException, SAXException, ParserConfigurationException, SQLException, URISyntaxException {
        Element tu = getTu(tuid);
        List<Element> tuvs = tu.getChildren("tuv");
        Iterator<Element> it = tuvs.iterator();
        while (it.hasNext()) {
            Element tuv = it.next();
            String lang = LanguageUtils.normalizeCode(tuv.getAttributeValue("xml:lang"));
            delete(tuid, lang);
        }
        tuDb.remove(tuid);
        commit();
    }

    private void delete(String tuid, String lang) throws SQLException {
        deleteTUV.setString(1, tuid);
        deleteTUV.setString(2, lang);
        deleteTUV.execute();
    }

    @Override
    public List<Element> searchAll(String searchStr, String srcLang, int similarity, boolean caseSensitive)
            throws IOException, SAXException, ParserConfigurationException, SQLException {
        List<Element> result = new Vector<>();

        int[] ngrams = NGrams.getNGrams(searchStr);
        int size = ngrams.length;
        if (size == 0) {
            return result;
        }
        int min = size * similarity / 100;
        int max = size * (200 - similarity) / 100;

        int minLength = searchStr.length() * similarity / 100;
        int maxLength = searchStr.length() * (200 - similarity) / 100;

        Map<String, Integer> candidates = new Hashtable<>();
        try (PreparedStatement stmt = conn.prepareStatement(
                "SELECT puretext FROM tuv WHERE lang=? AND tuid=? AND textlength>=? AND textlength<=?")) {
            stmt.setString(1, srcLang);
            stmt.setInt(3, minLength);
            stmt.setInt(4, maxLength);

            NavigableSet<Fun.Tuple2<Integer, String>> index = fuzzyIndex.getIndex(srcLang);
            for (int i = 0; i < ngrams.length; i++) {
                Iterable<String> keys = Fun.filter(index, ngrams[i]);
                Iterator<String> it = keys.iterator();
                while (it.hasNext()) {
                    String tuid = it.next();
                    if (candidates.containsKey(tuid)) {
                        int count = candidates.get(tuid);
                        candidates.put(tuid, count + 1);
                    } else {
                        candidates.put(tuid, 1);
                    }
                }
            }
            Set<String> tuids = candidates.keySet();
            Iterator<String> it = tuids.iterator();
            while (it.hasNext()) {
                String tuid = it.next();
                int count = candidates.get(tuid);
                if (count >= min && count <= max) {
                    stmt.setString(2, tuid);
                    try (ResultSet rs = stmt.executeQuery()) {
                        while (rs.next()) {
                            String pure = rs.getString(1);
                            int distance;
                            if (caseSensitive) {
                                distance = MatchQuality.similarity(searchStr, pure);
                            } else {
                                distance = MatchQuality.similarity(searchStr.toLowerCase(), pure.toLowerCase());
                            }
                            if (distance >= similarity) {
                                Element tu = getTu(tuid);
                                result.add(tu);
                            }
                        }
                    }
                }
            }
        }
        return result;
    }

    @Override
    public List<Match> searchTranslation(String searchStr, String srcLang, String tgtLang, int similarity,
            boolean caseSensitive) throws SAXException, IOException, ParserConfigurationException, SQLException {
        // search for TUs with a given source and target language
        List<Match> result = new Vector<>();

        int[] ngrams = null;
        ngrams = NGrams.getNGrams(searchStr);
        int size = ngrams.length;
        if (size == 0) {
            return result;
        }
        int min = size * similarity / 100;
        int max = size * (200 - similarity) / 100;

        int minLength = searchStr.length() * similarity / 100;
        int maxLength = searchStr.length() * (200 - similarity) / 100;

        Hashtable<String, Integer> candidates = new Hashtable<>();
        try (PreparedStatement stmt = conn.prepareStatement(
                "SELECT puretext, seg, textlength FROM tuv WHERE lang=? AND tuid=? AND textlength>=? AND textlength<=?")) {
            stmt.setString(1, srcLang);
            stmt.setInt(3, minLength);
            stmt.setInt(4, maxLength);

            try (PreparedStatement stmt2 = conn.prepareStatement("SELECT lang, seg FROM tuv WHERE tuid=? AND lang=?")) {
                stmt2.setString(2, tgtLang);

                NavigableSet<Fun.Tuple2<Integer, String>> index = fuzzyIndex.getIndex(srcLang);
                for (int i = 0; i < ngrams.length; i++) {
                    Iterable<String> keys = Fun.filter(index, ngrams[i]);
                    Iterator<String> it = keys.iterator();
                    while (it.hasNext()) {
                        String tuid = it.next();
                        if (candidates.containsKey(tuid)) {
                            int count = candidates.get(tuid);
                            candidates.put(tuid, count + 1);
                        } else {
                            candidates.put(tuid, 1);
                        }
                    }
                }
                Enumeration<String> tuids = candidates.keys();
                while (tuids.hasMoreElements()) {
                    String tuid = tuids.nextElement();
                    int count = candidates.get(tuid);
                    if (count >= min && count <= max) {
                        stmt.setString(2, tuid);
                        stmt2.setString(1, tuid);
                        try (ResultSet rs = stmt.executeQuery()) {
                            while (rs.next()) {
                                String pure = rs.getString(1);
                                String srcSeg = rs.getString(2);
                                int distance;
                                if (caseSensitive) {
                                    distance = MatchQuality.similarity(searchStr, pure);
                                } else {
                                    distance = MatchQuality.similarity(searchStr.toLowerCase(), pure.toLowerCase());
                                }
                                if (distance >= similarity) {
                                    boolean tgtFound = false;
                                    Element target = null;
                                    try (ResultSet rs2 = stmt2.executeQuery()) {
                                        while (rs2.next()) {
                                            String lang = rs2.getString(1);
                                            String seg = rs2.getString(2);
                                            target = TMUtils.buildTuv(lang, seg);
                                            tgtFound = true;
                                        }
                                    }
                                    if (tgtFound) {
                                        Element source = TMUtils.buildTuv(srcLang, srcSeg);
                                        Map<String, String> propsMap = new Hashtable<>();
                                        Element tu = getTu(tuid);
                                        List<Element> props = tu.getChildren("prop");
                                        Iterator<Element> pt = props.iterator();
                                        while (pt.hasNext()) {
                                            Element prop = pt.next();
                                            propsMap.put(prop.getAttributeValue("type"), prop.getText());
                                        }
                                        Match match = new Match(tuid, source, target, distance, dbname, propsMap);
                                        result.add(match);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        Collections.sort(result);
        return result;
    }

    @Override
    public int storeTMX(String tmxFile, String project, String customer, String subject)
            throws SAXException, IOException, ParserConfigurationException, SQLException, URISyntaxException {
        int imported = 0;
        next = 0l;
        if (customer == null) {
            customer = "";
        }
        if (subject == null) {
            subject = "";
        }
        if (project == null) {
            project = "";
        }
        currProject = project;
        currSubject = subject;
        currCustomer = customer;

        reader = new TMXReader(this);
        reader.parse(new File(tmxFile).toURI().toURL());
        imported = reader.getCount();
        commit();
        return imported;
    }

    @Override
    public void storeTu(Element tu) throws IOException, SQLException, URISyntaxException {
        Set<String> tuLangs = Collections.synchronizedSortedSet(new TreeSet<>());
        List<Element> tuvs = tu.getChildren("tuv");
        String tuid = tu.getAttributeValue("tuid");
        if (tuid.isEmpty()) {
            tuid = nextId();
            tu.setAttribute("tuid", tuid);
        }
        Element oldTu = tuDb.getTu(tuid);
        tu.setAttribute("creationdate",
                oldTu.hasAttribute("creationdate") ? oldTu.getAttributeValue("creationdate") : TMUtils.creationDate());
        tu.setAttribute("creationid",
                oldTu.hasAttribute("creationid") ? oldTu.getAttributeValue("creationid") : creationId);

        Hashtable<String, String> props = new Hashtable<>();
        List<Element> properties = tu.getChildren("prop");
        Iterator<Element> kt = properties.iterator();
        while (kt.hasNext()) {
            Element prop = kt.next();
            props.put(prop.getAttributeValue("type"), prop.getText());
        }
        if (currSubject != null && !currSubject.isEmpty() && !props.containsKey("subject")) {
            Element prop = new Element("prop");
            prop.setAttribute("type", "subject");
            prop.setText(XMLUtils.cleanText(currSubject));
            List<Element> content = tu.getChildren();
            content.add(0, prop);
            tu.setChildren(content);
            props.put(prop.getAttributeValue("type"), prop.getText());
        }
        String sub = props.get("subject");
        if (sub != null) {
            tuDb.storeSubject(sub);
        }
        if (currCustomer != null && !currCustomer.isEmpty() && !props.containsKey("customer")) {
            Element prop = new Element("prop");
            prop.setAttribute("type", "customer");
            prop.setText(XMLUtils.cleanText(currCustomer));
            List<Element> content = tu.getChildren();
            content.add(0, prop);
            tu.setChildren(content);
            props.put(prop.getAttributeValue("type"), prop.getText());
        }
        String cust = props.get("customer");
        if (cust != null) {
            tuDb.storeCustomer(cust);
        }
        if (currProject != null && !currProject.isEmpty() && !props.containsKey("project")) {
            Element prop = new Element("prop");
            prop.setAttribute("type", "project");
            prop.setText(XMLUtils.cleanText(currProject));
            List<Element> content = tu.getChildren();
            content.add(0, prop);
            tu.setChildren(content);
            props.put(prop.getAttributeValue("type"), prop.getText());
        }
        String proj = props.get("project");
        if (proj != null) {
            tuDb.storeProject(proj);
        }

        storeTUV.setString(1, tuid);

        Iterator<Element> it = tuvs.iterator();
        while (it.hasNext()) {
            Element tuv = it.next();
            String lang = LanguageUtils.normalizeCode(tuv.getAttributeValue("xml:lang"));
            if (lang != null && !tuLangs.contains(lang)) {
                if (exists(tuid, lang)) {
                    delete(tuid, lang);
                    tu.setAttribute("changedate", TMUtils.creationDate());
                    tu.setAttribute("changeid", creationId);
                }
                Element seg = tuv.getChild("seg");
                String puretext = TMUtils.extractText(seg);
                if (puretext.isEmpty()) {
                    continue;
                }
                storeTUV.setString(2, lang);
                storeTUV.setString(3, seg.toString());
                storeTUV.setString(4, puretext);
                storeTUV.setInt(5, puretext.length());
                storeTUV.execute();
                tuLangs.add(lang);

                tuDb.store(tuid, tu);

                int[] ngrams = NGrams.getNGrams(puretext);
                NavigableSet<Fun.Tuple2<Integer, String>> index = fuzzyIndex.getIndex(lang);
                for (int i = 0; i < ngrams.length; i++) {
                    Tuple2<Integer, String> entry = Fun.t2(ngrams[i], tuid);
                    if (!index.contains(entry)) {
                        index.add(entry);
                    }
                }
            }
        }
    }

    private String nextId() {
        if (next == 0l) {
            next = System.currentTimeMillis();
        }
        return "" + next++;
    }

    private boolean exists(String tuid, String lang) throws SQLException {
        searchTUV.setString(1, tuid);
        searchTUV.setString(2, lang);
        boolean found = false;
        try (ResultSet rs = searchTUV.executeQuery()) {
            while (rs.next()) {
                found = true;
            }
        }
        return found;
    }

    public int getCount() {
        if (reader != null) {
            return reader.getCount();
        }
        return 0;
    }
}
