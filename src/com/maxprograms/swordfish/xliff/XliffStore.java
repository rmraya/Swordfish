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

package com.maxprograms.swordfish.xliff;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
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
import java.util.HashMap;
import java.util.HashSet;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.Vector;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;
import java.util.zip.DataFormatException;

import javax.xml.parsers.ParserConfigurationException;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.jsoup.Jsoup;
import org.sqlite.Function;
import org.xml.sax.SAXException;

import com.maxprograms.converters.Join;
import com.maxprograms.converters.Merge;
import com.maxprograms.languages.Language;
import com.maxprograms.languages.LanguageUtils;
import com.maxprograms.stats.RepetitionAnalysis;
import com.maxprograms.stats.SvgStats;
import com.maxprograms.swordfish.Constants;
import com.maxprograms.swordfish.GlossariesHandler;
import com.maxprograms.swordfish.MemoriesHandler;
import com.maxprograms.swordfish.TmsServer;
import com.maxprograms.swordfish.am.MatchAssembler;
import com.maxprograms.swordfish.am.Term;
import com.maxprograms.swordfish.tm.ITmEngine;
import com.maxprograms.swordfish.tm.Match;
import com.maxprograms.swordfish.tm.MatchQuality;
import com.maxprograms.swordfish.tm.NGrams;
import com.maxprograms.swordfish.tm.TMUtils;
import com.maxprograms.xliff2.FromXliff2;
import com.maxprograms.xml.CatalogBuilder;
import com.maxprograms.xml.Document;
import com.maxprograms.xml.Element;
import com.maxprograms.xml.Indenter;
import com.maxprograms.xml.PI;
import com.maxprograms.xml.SAXBuilder;
import com.maxprograms.xml.TextNode;
import com.maxprograms.xml.XMLDeclaration;
import com.maxprograms.xml.XMLNode;
import com.maxprograms.xml.XMLOutputter;
import com.maxprograms.xml.XMLUtils;

public class XliffStore {

	Logger logger = System.getLogger(XliffStore.class.getName());

	public static final int THRESHOLD = 60;
	public static final int MAXTERMLENGTH = 5;
	public static final int BATCHSIZE = 100;

	public static final String SVG_BLANK = "<svg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 0 24 24' width='24'></svg>";
	public static final String SVG_UNTRANSLATED = "<svg xmlns:svg='http://www.w3.org/2000/svg' height='24' viewBox='0 0 24 24' width='24' version='1.1'><path d='M 19,5 V 19 H 5 V 5 H 19 M 19,3 H 5 C 3.9,3 3,3.9 3,5 v 14 c 0,1.1 0.9,2 2,2 h 14 c 1.1,0 2,-0.9 2,-2 V 5 C 21,3.9 20.1,3 19,3 Z' /></svg>";
	public static final String SVG_TRANSLATED = "<svg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 0 24 24' width='24'><g><path d='M19,5v14H5V5H19 M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3L19,3z'/><path d='M14,17H7v-2h7V17z M17,13H7v-2h10V13z M17,9H7V7h10V9z'/></g></svg>";
	public static final String SVG_FINAL = "<svg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 0 24 24' width='24'><path d='M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM17.99 9l-1.41-1.42-6.59 6.59-2.58-2.57-1.42 1.41 4 3.99z'/></svg>";
	public static final String SVG_LOCK = "<svg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 0 24 24' width='24'><path d='M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z'/></svg>";

	private String xliffFile;
	private SAXBuilder builder;
	private Document document;

	private File database;
	private Connection conn;
	private PreparedStatement insertFile;
	private PreparedStatement insertUnit;
	private PreparedStatement insertSegmentStmt;
	private PreparedStatement insertMatch;
	private PreparedStatement updateMatch;
	private PreparedStatement getMatches;
	private PreparedStatement bestMatch;
	private PreparedStatement insertTerm;
	private PreparedStatement getTerms;
	private PreparedStatement getUnitData;
	private PreparedStatement getSource;
	private PreparedStatement getTargetStmt;
	private PreparedStatement updateTargetStmt;
	private PreparedStatement unitMatches;
	private PreparedStatement unitTerms;
	private PreparedStatement unitNotes;
	private PreparedStatement checkTerm;
	private PreparedStatement getNotesStmt;
	private PreparedStatement insertNoteStmt;
	private PreparedStatement getSegment;
	private PreparedStatement getChild;
	private PreparedStatement getContext;

	private Statement stmt;
	private boolean preserve;

	private static String catalog;
	private static boolean acceptUnconfirmed;
	private static boolean fuzzyTermSearches;
	private static boolean caseSensitiveTermSearches;
	private static boolean caseSensitiveMatches;
	private static boolean autoConfirm;

	private int index;
	private int nextId;
	private String currentFile;
	private String currentUnit;
	private String state;
	private int tagCount;

	private String srcLang;
	private String tgtLang;

	private int tag;
	private Map<String, String> tagsMap;
	private Map<String, Element> notesMap;

	private static Pattern pattern;
	private static String lastFilterText;

	public XliffStore(String xliffFile, String sourceLang, String targetLang)
			throws SAXException, IOException, ParserConfigurationException, URISyntaxException, SQLException {

		this.xliffFile = xliffFile;
		srcLang = sourceLang;
		tgtLang = targetLang;

		File xliff = new File(xliffFile);

		if (new File(xliff.getParentFile(), "h2data").exists()) {
			MessageFormat mf = new MessageFormat(Messages.getString("XliffStore.0"));
			throw new IOException(mf.format(new String[] { xliff.getParentFile().getName() }));
		}

		database = new File(xliff.getParentFile(), "sqlite");
		boolean needsLoading = !database.exists();
		if (!database.exists()) {
			database.mkdirs();
		}
		getPreferences();
		builder = new SAXBuilder();
		builder.setEntityResolver(CatalogBuilder.getCatalog(catalog));

		DriverManager.registerDriver(new org.sqlite.JDBC());
		conn = DriverManager
				.getConnection("jdbc:sqlite:" + database.getAbsolutePath().replace('\\', '/') + "/database.db");
		conn.setAutoCommit(false);
		Function.create(conn, "REGEXP", new Function() {
			@Override
			protected void xFunc() throws SQLException {
				String expression = value_text(0);
				String value = value_text(1);
				if (value == null) {
					value = "";
				}
				Pattern pat = Pattern.compile(expression);
				result(pat.matcher(value).find() ? 1 : 0);
			}
		});
		if (needsLoading) {
			createTables();
		}

		// check if chars column exists in segments table

		String sql = "PRAGMA table_info(segments);";
		boolean charsExists = false;
		try (Statement st = conn.createStatement()) {
			try (ResultSet rs = st.executeQuery(sql)) {
				while (rs.next()) {
					if ("chars".equals(rs.getString(2))) {
						charsExists = true;
						break;
					}
				}
			}
		}
		if (!charsExists) {
			sql = "ALTER TABLE segments ADD COLUMN chars INTEGER DEFAULT 0;";
			try (Statement st = conn.createStatement()) {
				st.execute(sql);
			}
			conn.commit();
			sql = "UPDATE segments SET chars = ? WHERE sourceText = ?;";
			try (PreparedStatement prep = conn.prepareStatement(sql)) {
				sql = "SELECT sourceText FROM segments WHERE type='S';";
				try (Statement st = conn.createStatement()) {
					try (ResultSet rs = st.executeQuery(sql)) {
						while (rs.next()) {
							String sourceText = rs.getString(1);
							int chars = sourceText.length() - spaces(sourceText);
							prep.setInt(1, chars);
							prep.setString(2, sourceText);
							prep.execute();
						}
					}
				}
			}
			conn.commit();
		}

		getUnitData = conn.prepareStatement("SELECT data, compressed FROM units WHERE file=? AND unitId=?");
		getSource = conn.prepareStatement(
				"SELECT source, sourceText, state, translate FROM segments WHERE file=? AND unitId=? AND segId=?");
		getTargetStmt = conn
				.prepareStatement("SELECT target, state FROM segments WHERE file=? AND unitId=? AND segId=?");
		updateTargetStmt = conn.prepareStatement(
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
		getNotesStmt = conn.prepareStatement("SELECT noteId, note FROM notes WHERE file=? AND unitId=? AND segId=?");
		getSegment = conn.prepareStatement("SELECT source, target FROM segments WHERE file=? AND unitId=? AND segId=?");
		getChild = conn.prepareStatement("SELECT child FROM segments WHERE file=? AND unitId=? AND segId=?");
		getContext = conn.prepareStatement("SELECT unitId, segId FROM segments WHERE file=? AND child=?");
		stmt = conn.createStatement();
		if (needsLoading) {
			document = builder.build(xliffFile);
			parseDocument();
			conn.commit();
			indexSegments();
		}
	}

	private void createTables() throws SQLException {
		String files = """
				CREATE TABLE files (
				    id VARCHAR(50) NOT NULL,
				    name VARCHAR(350) NOT NULL,
				    PRIMARY KEY(id, name)
				    );""";
		String units = """
				CREATE TABLE units (
				    file VARCHAR(50),
				    unitId VARCHAR(256) NOT NULL,
				    data TEXT NOT NULL,
				    compressed CHAR(1) NOT NULL DEFAULT 'N',
				    PRIMARY KEY(file, unitId)
				    );""";
		String segments = """
				CREATE TABLE segments (
				    file VARCHAR(50),
				    unitId VARCHAR(256) NOT NULL,
				    segId VARCHAR(256) NOT NULL,
				    type CHAR(1) NOT NULL DEFAULT 'S',
				    state VARCHAR(12) DEFAULT 'initial',
				    child INTEGER,
				    translate CHAR(1),
				    tags INTEGER DEFAULT 0,
				    space CHAR(1) DEFAULT 'N',
				    source TEXT NOT NULL,
				    sourceText TEXT NOT NULL,
				    target TEXT NOT NULL,
				    targetText TEXT NOT NULL,
				    words INTEGER NOT NULL DEFAULT 0,
				    idx INTEGER,
				    PRIMARY KEY(file, unitId, segId, type)
				);""";
		String matches = """
				CREATE TABLE matches (
				    file VARCHAR(50),
				    unitId VARCHAR(256) NOT NULL,
				    segId VARCHAR(256) NOT NULL,
				    matchId varchar(256),
				    origin VARCHAR(256),
				    type CHAR(2) NOT NULL DEFAULT 'tm',
				    similarity INTEGER DEFAULT 0,
				    source TEXT NOT NULL,
				    target TEXT NOT NULL,
				    data TEXT NOT NULL,
				    compressed CHAR(1) NOT NULL DEFAULT 'N',
				    PRIMARY KEY(file, unitId, segId, matchid)
				    );""";
		String terms = """
				CREATE TABLE terms (
				    file VARCHAR(50),
				    unitId VARCHAR(256) NOT NULL,
				    segId VARCHAR(256) NOT NULL,
				    termid varchar(256),
				    origin VARCHAR(256),
				    source TEXT NOT NULL,
				    target TEXT NOT NULL,
				    PRIMARY KEY(file, unitId, segId, termid)
				    );""";
		String notes = """
				CREATE TABLE notes (
				    file VARCHAR(50),
				    unitId VARCHAR(256) NOT NULL,
				    segId VARCHAR(256) NOT NULL,
				    noteid varchar(256) NOT NULL,
				    note TEXT NOT NULL,
				    PRIMARY KEY(file, unitId, segId, noteid)
				    );""";
		try (Statement create = conn.createStatement()) {
			create.execute(files);
			create.execute(units);
			create.execute(segments);
			create.execute(matches);
			create.execute(terms);
			create.execute(notes);
		}
		conn.commit();
	}

	private void parseDocument() throws SQLException, IOException {
		insertFile = conn.prepareStatement("INSERT INTO files (id, name) VALUES (?,?)");
		insertUnit = conn.prepareStatement("INSERT INTO units (file, unitId, data, compressed) VALUES (?,?,?,?)");
		insertSegmentStmt = conn.prepareStatement(
				"INSERT INTO segments (file, unitId, segId, type, state, child, translate, tags, space, source, sourceText, target, targetText, words, chars) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
		insertNoteStmt = conn
				.prepareStatement("INSERT INTO notes (file, unitId, segId, noteId, note) values (?,?,?,?,?)");
		recurse(document.getRootElement());
		insertFile.close();
		insertUnit.close();
		insertNoteStmt.close();
		insertSegmentStmt.close();
	}

	private void recurse(Element e) throws SQLException, IOException {
		if ("file".equals(e.getName())) {
			currentFile = e.getAttributeValue("id");
			insertFile.setString(1, currentFile);
			insertFile.setString(2, e.getAttributeValue("original"));
			insertFile.execute();
			index = 0;
		}
		if ("unit".equals(e.getName())) {
			tagCount = 0;
			nextId = 0;
			currentUnit = e.getAttributeValue("id");
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

			notesMap = new Hashtable<>();
			Element notes = e.getChild("notes");
			if (notes != null) {
				List<Element> n = notes.getChildren("note");
				Iterator<Element> nit = n.iterator();
				while (nit.hasNext()) {
					Element note = nit.next();
					if (note.hasAttribute("mtc:ref")) {
						String segId = note.getAttributeValue("mtc:ref");
						if (segId.startsWith("#")) {
							segId = segId.substring(1);
						}
						insertNote(currentFile, currentUnit, segId, note);
					} else {
						notesMap.put(note.getAttributeValue("id"), note);
					}
				}
			}
			if (tagCount > 0) {
				String dataString = data.toString();
				insertUnit.setString(1, currentFile);
				insertUnit.setString(2, currentUnit);
				insertUnit.setString(3, dataString);
				insertUnit.setString(4, "N");
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
						if (segId.startsWith("#")) {
							segId = segId.substring(1);
						}
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
				if (source.hasAttribute("xml:space")) {
					target.setAttribute("xml:space", source.getAttributeValue("xml:space"));
				}
			}

			List<String> segmentNotes = new Vector<>();
			if (!notesMap.isEmpty()) {
				segmentNotes.addAll(harvestNotes(source));
				source = FromXliff2.removeComments(source);
				segmentNotes.addAll(harvestNotes(target));
				target = FromXliff2.removeComments(target);
			}

			state = e.getAttributeValue("state",
					XliffUtils.pureText(target).isEmpty() ? Constants.INITIAL : Constants.TRANSLATED);
			String subState = e.getAttributeValue("subState");
			boolean translate = true;
			if ("openxliff:locked".equals(subState)) {
				translate = false;
			}
			preserve = preserve || sourcePreserve
					|| "preserve".equals(target.getAttributeValue("xml:space", "default"));

			insertSegment(currentFile, currentUnit, id, "S", translate, source, target);
			for (int i = 0; i < segmentNotes.size(); i++) {
				String noteId = segmentNotes.get(i);
				Element note = notesMap.get(noteId);
				insertNote(currentFile, currentUnit, id, note);
			}
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

	private List<String> harvestNotes(Element element) {
		List<String> result = new Vector<>();
		if ("mrk".equals(element.getName()) && "comment".equals(element.getAttributeValue("type"))) {
			if (element.hasAttribute("ref")) {
				String ref = element.getAttributeValue("ref");
				result.add(ref.substring(ref.indexOf('=') + 1));
			}
			if (element.hasAttribute("value")) {
				Element note = new Element("note");
				note.setText(element.getAttributeValue("value"));
				String id = "" + (result.size() + 100);
				note.setAttribute("id", id);
				notesMap.put(id, note);
				result.add(id);
			}
		}
		List<Element> children = element.getChildren();
		Iterator<Element> it = children.iterator();
		while (it.hasNext()) {
			result.addAll(harvestNotes(it.next()));
		}
		return result;
	}

	private synchronized void insertSegment(String file, String unit, String segment, String type, boolean translate,
			Element source, Element target) throws SQLException {
		String pureSource = XliffUtils.pureText(source);
		insertSegmentStmt.setString(1, file);
		insertSegmentStmt.setString(2, unit);
		insertSegmentStmt.setString(3, segment);
		insertSegmentStmt.setString(4, type);
		insertSegmentStmt.setString(5, state);
		insertSegmentStmt.setInt(6, index++);
		insertSegmentStmt.setString(7, translate ? "Y" : "N");
		insertSegmentStmt.setInt(8, tagCount);
		insertSegmentStmt.setString(9, preserve ? "Y" : "N");
		insertSegmentStmt.setString(10, source.toString());
		insertSegmentStmt.setString(11, pureSource);
		insertSegmentStmt.setString(12, (target != null ? target.toString() : ""));
		insertSegmentStmt.setString(13, (target != null ? XliffUtils.pureText(target) : ""));
		insertSegmentStmt.setInt(14, type.equals("S") ? RepetitionAnalysis.wordCount(pureSource, srcLang) : 0);
		insertSegmentStmt.setInt(15, type.equals("S") ? (pureSource.length() - spaces(pureSource)) : 0);
		insertSegmentStmt.execute();
	}

	private int spaces(String text) {
		int count = 0;
		for (int i = 0; i < text.length(); i++) {
			if (Character.isWhitespace(text.charAt(i))) {
				count++;
			}
		}
		return count;
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
		if (segment.startsWith("#")) {
			segment = segment.substring(1);
		}
		String type = match.getAttributeValue("type", Constants.TM);
		String origin = match.getAttributeValue("origin");
		int similarity = Math.round(Float.parseFloat(match.getAttributeValue("matchQuality", "0.0")));

		insertMatch(file, unit, segment, origin, type, similarity, source, target, tagsData);
	}

	private void insertNote(String file, String unit, String segId, Element note) throws SQLException {
		insertNoteStmt.setString(1, file);
		insertNoteStmt.setString(2, unit);
		insertNoteStmt.setString(3, segId);
		insertNoteStmt.setString(4, note.getAttributeValue("id", unit));
		insertNoteStmt.setString(5, note.getText());
		insertNoteStmt.execute();
	}

	public int size() throws SQLException {
		int count = 0;
		String sql = "SELECT count(*) FROM segments WHERE type='S'";
		try (ResultSet rs = stmt.executeQuery(sql)) {
			while (rs.next()) {
				count = rs.getInt(1);
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
			boolean showConfirmed, String sortOption, boolean sortDesc)
			throws SQLException, SAXException, IOException, ParserConfigurationException, DataFormatException {
		List<JSONObject> result = new Vector<>();
		StringBuilder queryBuilder = new StringBuilder();
		queryBuilder.append(
				"SELECT file, unitId, segId, child, source, target, tags, state, space, translate, idx FROM segments WHERE type='S'");
		if (!filterText.isEmpty()) {
			if (regExp) {
				try {
					Pattern.compile(filterText);
				} catch (PatternSyntaxException e) {
					throw new IOException("Invalid regular expression");
				}
				if ("source".equals(filterLanguage)) {
					queryBuilder.append(" AND sourceText REGEXP '");
				} else {
					queryBuilder.append(" AND targetText REGEXP '");
				}
				queryBuilder.append(filterText);
				queryBuilder.append("'");
			} else {
				if (caseSensitiveFilter) {
					if ("source".equals(filterLanguage)) {
						queryBuilder.append(" AND sourceText GLOB '*");
					} else {
						queryBuilder.append(" AND targetText GLOB '*");
					}
				} else {
					if ("source".equals(filterLanguage)) {
						queryBuilder.append(" AND sourceText LIKE '%");
					} else {
						queryBuilder.append(" AND targetText LIKE '%");
					}
				}
				queryBuilder.append(escape(filterText));
				queryBuilder.append(caseSensitiveFilter ? "*'" : "%'");
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
		}
		if (sortOption.equals("none")) {
			queryBuilder.append(" ORDER BY file, child ");
		}
		if (sortOption.equals("source")) {
			queryBuilder.append(" ORDER BY sourceText");
		}
		if (sortOption.equals("target")) {
			queryBuilder.append(" ORDER BY targetText");
		}
		if (sortOption.equals("status")) {
			queryBuilder.append(" ORDER BY state");
		}
		if (sortDesc) {
			queryBuilder.append(" DESC ");
		}
		queryBuilder.append(" LIMIT ");
		queryBuilder.append(count);
		queryBuilder.append(" OFFSET ");
		queryBuilder.append(start);
		try (ResultSet rs = stmt.executeQuery(queryBuilder.toString())) {
			while (rs.next()) {
				String file = rs.getString(1);
				String unit = rs.getString(2);
				String segId = rs.getString(3);
				String src = rs.getString(5);
				String tgt = rs.getString(6);
				int tags = rs.getInt(7);
				String segState = rs.getString(8);
				boolean segPreserve = "Y".equals(rs.getString(9));
				boolean segTranslate = "Y".equals(rs.getString(10));
				int idx = rs.getInt(11);

				JSONObject tagsData = new JSONObject();
				if (tags > 0) {
					tagsData = getUnitData(file, unit);
				}
				Element source = XliffUtils.buildElement(src);

				Element target = new Element("target");
				if (source.hasAttribute("xml:space")) {
					target.setAttribute("xml:space", source.getAttributeValue("xml:space"));
				}
				if (tgt != null && !tgt.isBlank()) {
					target = XliffUtils.buildElement(tgt);
				}

				boolean checkErrors = segTranslate
						&& (segState.equals("final") || (segState.equals("translated") && acceptUnconfirmed));

				boolean tagErrors = false;
				boolean spaceErrors = false;
				if (checkErrors) {
					tagErrors = hasTagErrors(source, target);
					spaceErrors = hasSpaceErrors(source, target);
				}
				tagsMap = new Hashtable<>();
				JSONObject row = new JSONObject();
				row.put("index", idx);
				row.put("file", file);
				row.put("unit", unit);
				row.put("segment", segId);
				row.put("state", segState);
				row.put("translate", segTranslate);
				row.put("preserve", segPreserve);
				tag = 1;
				row.put("source", addHtmlTags(source, filterText, caseSensitiveFilter, regExp, tagsData, segPreserve));
				tag = 1;
				row.put("target", addHtmlTags(target, filterText, caseSensitiveFilter, regExp, tagsData, segPreserve));
				row.put("match", getBestMatch(file, unit, segId));
				row.put("hasNotes", hasNotes(file, unit, segId));
				row.put("tagErrors", tagErrors);
				row.put("spaceErrors", spaceErrors);
				result.add(row);
			}
		}
		return result;
	}

	private boolean hasNotes(String file, String unit, String segId) throws SQLException {
		boolean result = false;
		getNotesStmt.setString(1, file);
		getNotesStmt.setString(2, unit);
		getNotesStmt.setString(3, segId);
		try (ResultSet rs = getNotesStmt.executeQuery()) {
			while (rs.next()) {
				result = true;
			}
		}
		return result;
	}

	public JSONArray getNotes(String file, String unit, String segId) throws SQLException {
		JSONArray array = new JSONArray();
		getNotesStmt.setString(1, file);
		getNotesStmt.setString(2, unit);
		getNotesStmt.setString(3, segId);
		try (ResultSet rs = getNotesStmt.executeQuery()) {
			while (rs.next()) {
				JSONObject note = new JSONObject();
				note.put("id", rs.getString(1));
				note.put("note", rs.getString(2));
				array.put(note);
			}
		}
		return array;
	}

	public JSONArray addNote(String file, String unit, String segId, String noteText) throws SQLException {
		String sql = "SELECT noteId FROM notes WHERE file=? AND unitId=? AND segId=?";
		int maxId = 0;
		try (PreparedStatement prep = conn.prepareStatement(sql)) {
			prep.setString(1, file);
			prep.setString(2, unit);
			prep.setString(3, segId);
			try (ResultSet rs = prep.executeQuery()) {
				while (rs.next()) {
					String id = rs.getString(1);
					try {
						int number = Integer.parseInt(id);
						if (number > maxId) {
							maxId = number;
						}
					} catch (NumberFormatException e) {
						// ignore
					}
				}
			}
		}
		sql = "INSERT INTO notes (file, unitId, segId, noteId, note) values (?,?,?,?,?)";
		try (PreparedStatement prep = conn.prepareStatement(sql)) {
			prep.setString(1, file);
			prep.setString(2, unit);
			prep.setString(3, segId);
			prep.setString(4, "" + (maxId + 1));
			prep.setString(5, noteText);
			prep.executeUpdate();
		}
		conn.commit();
		JSONArray array = new JSONArray();
		getNotesStmt.setString(1, file);
		getNotesStmt.setString(2, unit);
		getNotesStmt.setString(3, segId);
		try (ResultSet rs = getNotesStmt.executeQuery()) {
			while (rs.next()) {
				JSONObject note = new JSONObject();
				note.put("id", rs.getString(1));
				note.put("note", rs.getString(2));
				array.put(note);
			}
		}
		return array;
	}

	public JSONArray removeNote(String file, String unit, String segId, String noteId) throws SQLException {
		String sql = "DELETE FROM notes WHERE file=? AND unitId=? AND segId=? AND noteId=?";
		try (PreparedStatement prep = conn.prepareStatement(sql)) {
			prep.setString(1, file);
			prep.setString(2, unit);
			prep.setString(3, segId);
			prep.setString(4, noteId);
			prep.executeUpdate();
		}
		conn.commit();
		JSONArray array = new JSONArray();
		getNotesStmt.setString(1, file);
		getNotesStmt.setString(2, unit);
		getNotesStmt.setString(3, segId);
		try (ResultSet rs = getNotesStmt.executeQuery()) {
			while (rs.next()) {
				JSONObject note = new JSONObject();
				note.put("id", rs.getString(1));
				note.put("note", rs.getString(2));
				array.put(note);
			}
		}
		return array;
	}

	private boolean hasTagErrors(Element source, Element target) {
		List<String> sourceTags = tagsList(source);
		List<String> targetTags = tagsList(target);
		if (sourceTags.size() != targetTags.size()) {
			return true;
		}
		for (int i = 0; i < sourceTags.size(); i++) {
			if (!sourceTags.get(i).equals(targetTags.get(i))) {
				return true;
			}
		}
		return false;
	}

	private boolean hasSpaceErrors(Element source, Element target) {
		String[] sourceSpaces = getSpaces(source);
		String[] targetSpaces = getSpaces(target);
		return !(sourceSpaces[0].equals(targetSpaces[0]) && sourceSpaces[1].equals(targetSpaces[1]));
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
		if (type.isEmpty() || Constants.MT.equals(type) || Constants.AM.equals(type)) {
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
		getTargetStmt.close();
		updateTargetStmt.close();
		insertMatch.close();
		updateMatch.close();
		getMatches.close();
		bestMatch.close();
		insertTerm.close();
		getTerms.close();
		checkTerm.close();
		getNotesStmt.close();
		getSegment.close();
		getChild.close();
		getContext.close();
		stmt.close();
		conn.commit();
		conn.close();
	}

	public String getSrcLang() {
		return srcLang;
	}

	public String getTgtLang() {
		return tgtLang;
	}

	private static void getPreferences() throws IOException {
		JSONObject json = TmsServer.getPreferences();
		acceptUnconfirmed = json.getBoolean("acceptUnconfirmed");
		caseSensitiveTermSearches = json.getBoolean("caseSensitiveSearches");
		caseSensitiveMatches = true;
		if (json.has("caseSensitiveMatches")) {
			caseSensitiveMatches = json.getBoolean("caseSensitiveMatches");
		}
		fuzzyTermSearches = json.getBoolean("fuzzyTermSearches");
		if (json.has("autoConfirm")) {
			autoConfirm = json.getBoolean("autoConfirm");
		} else {
			autoConfirm = false;
		}
		catalog = json.getString("catalog");
	}

	public synchronized JSONObject saveSegment(JSONObject json)
			throws IOException, SQLException, SAXException, ParserConfigurationException, DataFormatException {

		JSONObject result = new JSONObject();

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
		boolean wasFinal = false;
		boolean translatable = true;
		try (ResultSet rs = getSource.executeQuery()) {
			while (rs.next()) {
				src = rs.getString(1);
				wasFinal = rs.getString(3).equals("final");
				translatable = rs.getString(4).equals("Y");
			}
		}
		Element source = XliffUtils.buildElement(src);

		Map<String, String> tags = getTags(source);

		translation = XliffUtils.clearHTML(translation);

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
		Element translated = XliffUtils.buildElement("<target>" + translation + "</target>");
		Element target = getTarget(file, unit, segment);
		boolean unchanged = target.getContent().equals(translated.getContent());

		target.setContent(translated.getContent());
		String pureTarget = XliffUtils.pureText(target);
		JSONArray propagated = new JSONArray();
		updateTarget(file, unit, segment, target, pureTarget, confirm);
		if (confirm && !pureTarget.isBlank() && (!unchanged || !wasFinal)) {
			propagated = propagate(source, target);
		}
		result.put("propagated", propagated);

		boolean checkErrors = translatable && (confirm || !pureTarget.isEmpty());

		boolean tagErrors = false;
		boolean spaceErrors = false;
		if (checkErrors) {
			tagErrors = hasTagErrors(source, target);
			spaceErrors = hasSpaceErrors(source, target);
		}

		result.put("tagErrors", tagErrors);
		result.put("spaceErrors", spaceErrors);

		JSONObject originalData = getUnitData(file, unit);
		tag = 1;
		tagsMap = new Hashtable<>();
		result.put("target", addHtmlTags(target, originalData));

		if (!memory.equals(Constants.NONE) && !pureTarget.isBlank() && confirm) {
			new Thread(() -> {
				try {
					StringBuilder key = new StringBuilder();
					key.append(xliffFile.hashCode());
					key.append('-');
					key.append(file);
					key.append('-');
					key.append(unit);
					key.append('-');
					key.append(segment);
					String[] context = getSurroundingSegments(file, unit, segment);
					MemoriesHandler.open(memory);
					ITmEngine engine = MemoriesHandler.getEngine(memory);
					engine.storeTu(XliffUtils.toTu(key.toString(), source, target, tags, srcLang, tgtLang, context));
					engine.commit();
					MemoriesHandler.close(memory);
				} catch (IOException | SQLException | URISyntaxException e) {
					logger.log(Level.ERROR, e);
				}
			}).start();
		}
		return result;
	}

	private String[] getSurroundingSegments(String file, String unit, String segment) throws SQLException {
		String[] result = new String[2];
		int child = -1;
		getChild.setString(1, file);
		getChild.setString(2, unit);
		getChild.setString(3, segment);
		try (ResultSet rs = getChild.executeQuery()) {
			while (rs.next()) {
				child = rs.getInt(1);
			}
		}
		if (child == -1) {
			return result;
		}
		if (child > 0) {
			String prevUnitId = "";
			String prevSegId = "";
			getContext.setString(1, file);
			getContext.setInt(2, child - 1);
			try (ResultSet rs = getContext.executeQuery()) {
				while (rs.next()) {
					prevUnitId = rs.getString(1);
					prevSegId = rs.getString(2);
				}
			}
			StringBuilder key = new StringBuilder();
			key.append(xliffFile.hashCode());
			key.append('-');
			key.append(file);
			key.append('-');
			key.append(prevUnitId);
			key.append('-');
			key.append(prevSegId);
			result[0] = key.toString();
		}
		String nextUnitId = "";
		String nextSegId = "";
		getContext.setString(1, file);
		getContext.setInt(2, child + 1);
		try (ResultSet rs = getContext.executeQuery()) {
			while (rs.next()) {
				nextUnitId = rs.getString(1);
				nextSegId = rs.getString(2);
			}
		}
		if (!nextUnitId.isEmpty()) {
			StringBuilder key = new StringBuilder();
			key.append(xliffFile.hashCode());
			key.append('-');
			key.append(file);
			key.append('-');
			key.append(nextUnitId);
			key.append('-');
			key.append(nextSegId);
			result[1] = key.toString();
		}
		return result;
	}

	public synchronized void saveSource(JSONObject json)
			throws IOException, SQLException, SAXException, ParserConfigurationException {
		String file = json.getString("file");
		String unit = json.getString("unit");
		String segment = json.getString("segment");
		String newSource = json.getString("newSource").replace("&nbsp;", "\u00A0").replace("<br>", "\n");

		String src = "";
		String pureSource = "";
		getSource.setString(1, file);
		getSource.setString(2, unit);
		getSource.setString(3, segment);
		try (ResultSet rs = getSource.executeQuery()) {
			while (rs.next()) {
				src = rs.getString(1);
				pureSource = rs.getString(2);
			}
		}
		Element source = XliffUtils.buildElement(src);

		Map<String, String> tags = getTags(source);

		newSource = XliffUtils.clearHTML(newSource);

		List<String[]> list = XliffUtils.harvestTags(newSource);
		if (!list.isEmpty()) {
			for (int i = 0; i < list.size(); i++) {
				String code = list.get(i)[0];
				String img = list.get(i)[1];
				if (tags.containsKey(code)) {
					newSource = replace(newSource, img, tags.get(code));
				} else {
					newSource = replace(newSource, img, "");
				}
			}
		}
		Element updated = XliffUtils.buildElement("<source>" + newSource + "</source>");
		if (source.getContent().equals(updated.getContent())) {
			return;
		}

		source.setContent(updated.getContent());
		pureSource = XliffUtils.pureText(source);

		String sql = "UPDATE segments SET source=?, sourceText=? WHERE file=? AND unitId=? AND segId=?";
		try (PreparedStatement prep = conn.prepareStatement(sql)) {
			prep.setString(1, source.toString());
			prep.setString(2, pureSource);
			prep.setString(3, file);
			prep.setString(4, unit);
			prep.setString(5, segment);
			prep.executeUpdate();
		}
	}

	public synchronized JSONObject getTranslationStatus() throws SQLException {
		JSONObject result = new JSONObject();
		int total = 0;
		int translated = 0;
		int confirmed = 0;
		int segments = 0;
		String sql = "SELECT SUM(words), COUNT(*) FROM segments WHERE type='S'";
		try (ResultSet rs = stmt.executeQuery(sql)) {
			while (rs.next()) {
				total = rs.getInt(1);
				segments = rs.getInt(2);
			}
		}
		sql = "SELECT SUM(words) FROM segments WHERE state='final' AND type='S'";
		try (ResultSet rs = stmt.executeQuery(sql)) {
			while (rs.next()) {
				confirmed = rs.getInt(1);
			}
		}
		sql = "SELECT SUM(words) FROM segments WHERE state <> 'initial' AND type='S'";
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

		MessageFormat mf = new MessageFormat(
				Messages.getString("XliffStore.3"));
		result.put("text", mf.format(new String[] { "" + segments, "" + total, "" + translated, "" + confirmed }));
		result.put("svg", XliffUtils.makeSVG(percentage));
		return result;
	}

	private synchronized void updateTarget(String file, String unit, String segment, Element target, String pureTarget,
			boolean confirm) throws SQLException {
		String segState = pureTarget.isBlank() ? Constants.INITIAL : Constants.TRANSLATED;
		if (confirm) {
			segState = Constants.FINAL;
		}
		updateTargetStmt.setString(1, target.toString());
		updateTargetStmt.setString(2, pureTarget);
		updateTargetStmt.setString(3, segState);
		updateTargetStmt.setString(4, file);
		updateTargetStmt.setString(5, unit);
		updateTargetStmt.setString(6, segment);
		updateTargetStmt.executeUpdate();
		conn.commit();
	}

	private JSONArray propagate(Element source, Element target)
			throws SQLException, SAXException, IOException, ParserConfigurationException, DataFormatException {
		JSONArray result = new JSONArray();
		String dummySource = dummyTagger(source);
		String query = "SELECT file, unitId, segId, source, state, tags, space FROM segments WHERE translate='Y' AND type='S' AND state <> 'final' ";
		try (ResultSet rs = stmt.executeQuery(query)) {
			while (rs.next()) {
				Element candidate = XliffUtils.buildElement(rs.getString(4));
				int differences = tagDifferences(source, candidate);
				String dummy = dummyTagger(candidate);
				int similarity = MatchQuality.similarity(dummySource, dummy) - differences;
				if (similarity > THRESHOLD) {
					String file = rs.getString(1);
					String unit = rs.getString(2);
					String segment = rs.getString(3);
					Element sourceElement = XliffUtils.buildElement(rs.getString(4));
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
						row.put("status", autoConfirm ? Constants.FINAL : Constants.TRANSLATED);
						result.put(row);

						Element translated = XliffUtils.buildElement("<target>" + translation + "</target>");
						translated.setAttribute("xml:space", preserve ? "preserve" : "default");
						translated.setContent(target.getContent());
						if (!translated.getChildren().isEmpty()) {
							translated = fixTags(sourceElement, source, target);
						}
						updateTarget(file, unit, segment, translated, XliffUtils.pureText(translated), autoConfirm);
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
		String matchId = "" + XliffUtils.pureText(source).hashCode() * origin.hashCode();
		if (Constants.MT.equals(type)) {
			matchId = origin;
		}
		JSONArray matches = getMatches(file, unit, segment);
		String data = "";
		if (!source.getChildren().isEmpty() || !target.getChildren().isEmpty()) {
			List<String> added = new Vector<>();
			Element originalData = new Element("originalData");
			List<Element> children = source.getChildren();
			Iterator<Element> it = children.iterator();
			while (it.hasNext()) {
				Element e = it.next();
				if ("mrk".equals(e.getName()) || "pc".equals(e.getName()) || "cp".equals(e.getName())) {
					continue;
				}
				String dataRef = e.getAttributeValue("dataRef");
				if (!added.contains(dataRef) && tagsData.has(dataRef)) {
					Element d = new Element("data");
					d.setAttribute("id", dataRef);
					d.setText(tagsData.getString(dataRef));
					originalData.addContent(d);
					added.add(dataRef);
					continue;
				}
				e.removeAttribute("dataRef");
			}
			children = target.getChildren();
			it = children.iterator();
			while (it.hasNext()) {
				Element e = it.next();
				if ("mrk".equals(e.getName()) || "pc".equals(e.getName()) || "cp".equals(e.getName())) {
					continue;
				}
				String dataRef = e.getAttributeValue("dataRef");
				if (added.contains(dataRef)) {
					continue;
				}
				if (!added.contains(dataRef) && tagsData.has(dataRef)) {
					Element d = new Element("data");
					d.setAttribute("id", dataRef);
					d.setText(tagsData.getString(dataRef));
					originalData.addContent(d);
					added.add(dataRef);
					continue;
				}
				e.removeAttribute("dataRef");
			}
			data = originalData.toString();
		}
		for (int i = 0; i < matches.length(); i++) {
			JSONObject match = matches.getJSONObject(i);
			if (match.getString("matchId").equals(matchId)) {
				updateMatch.setString(1, origin);
				updateMatch.setString(2, type);
				updateMatch.setInt(3, similarity);
				updateMatch.setString(4, source.toString());
				updateMatch.setString(5, target.toString());
				updateMatch.setString(6, data);
				updateMatch.setString(7, "N");
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
		insertMatch.setString(8, source.toString());
		insertMatch.setString(9, target.toString());
		insertMatch.setString(10, data);
		insertMatch.setString(11, "N");
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
				match.put("source", rs.getString(8));
				match.put("srcLang", srcLang);
				match.put("target", rs.getString(9));
				match.put("tgtLang", tgtLang);
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
					// empty - special case
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
					// empty: <ph>, <sc>, <ec>, <sm> and <em>.
					String key = e.getName() + e.getAttributeValue("id");
					if (!tagsMap.containsKey(key)) {
						String dataRef = e.getAttributeValue("dataRef");
						if (dataRef.isEmpty()) {
							dataRef = e.getAttributeValue("id");
						}
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
						tagsMap.put(key, sb.toString());
					}
					text.append(tagsMap.get(key));
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
				text.append(inline2html((Element) o, originalData));
			}
		}
		return preserve ? XliffUtils.highlightSpaces(text.toString()) : text.toString().trim();
	}

	private String inline2html(Element e, JSONObject originalData) throws IOException {
		// empty: <cp>, <ph>, <sc>, <ec>, <sm> and <em>.
		// paired: <pc>, <mrk>,
		StringBuilder text = new StringBuilder();
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
			List<XMLNode> content = e.getContent();
			Iterator<XMLNode> it = content.iterator();
			while (it.hasNext()) {
				XMLNode node = it.next();
				if (node.getNodeType() == XMLNode.TEXT_NODE) {
					String s = ((TextNode) node).getText();
					text.append(XMLUtils.cleanText(s));
				}
				if (node.getNodeType() == XMLNode.ELEMENT_NODE) {
					text.append(inline2html((Element) node, originalData));
				}
			}
			if (!tagsMap.containsKey("/pc" + id)) {
				XliffUtils.checkSVG(tag);
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
				sb.append(XliffUtils.unquote(XliffUtils.cleanAngles("</pc>")));
				sb.append("\"/>");
				tagsMap.put("/pc" + id, sb.toString());
			}
			text.append(tagsMap.get("/pc" + id));
		} else if (type.equals("mrk")) {
			String id = e.getAttributeValue("id");
			boolean isTerm = e.getAttributeValue("type").equals("term");
			if (!isTerm) {
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
			} else {
				text.append("<span " + XliffUtils.STYLE + " title=\"" + e.getAttributeValue("value") + "\">");
			}
			List<XMLNode> content = e.getContent();
			Iterator<XMLNode> it = content.iterator();
			while (it.hasNext()) {
				XMLNode node = it.next();
				if (node.getNodeType() == XMLNode.TEXT_NODE) {
					String s = ((TextNode) node).getText();
					text.append(XMLUtils.cleanText(s));
				}
				if (node.getNodeType() == XMLNode.ELEMENT_NODE) {
					text.append(inline2html((Element) node, originalData));
				}
			}
			text.append("</span>");
			if (!isTerm) {
				if (!tagsMap.containsKey("/mrk" + id)) {
					XliffUtils.checkSVG(tag);
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
					sb.append(XliffUtils.unquote(XliffUtils.cleanAngles("</mrk>")));
					sb.append("\"/>");
					tagsMap.put("/mrk" + id, sb.toString());
				}
				text.append(tagsMap.get("/mrk" + id));
			}
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
		} else if ("ph".equals(type)) {
			String id = e.getAttributeValue("id");
			if (!tagsMap.containsKey("ph" + id)) {
				XliffUtils.checkSVG(tag);
				String title = originalData.has(id) ? originalData.getString(id) : e.toString();
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
				sb.append(XliffUtils.unquote(XliffUtils.cleanAngles(title)));
				sb.append("\"/>");
				tagsMap.put("ph" + id, sb.toString());
			}
			text.append(tagsMap.get("ph" + id));
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
					Map<String, String> map = getTags(e);
					result.putAll(map);
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
				String src = rs.getString(1);
				originalSource = XliffUtils.buildElement(src);
			}
		}
		List<Element> originalTags = originalSource.getChildren();
		String dummySource = dummyTagger(originalSource);

		getMatches.setString(1, file);
		getMatches.setString(2, unit);
		getMatches.setString(3, segment);
		try (ResultSet rs = getMatches.executeQuery()) {
			while (rs.next()) {
				tag = 1;
				JSONObject match = new JSONObject();
				match.put("file", file);
				match.put("unit", unit);
				match.put("segment", segment);
				match.put("matchId", rs.getString(4));
				match.put("origin", rs.getString(5));
				match.put("type", rs.getString(6));
				match.put("similarity", rs.getInt(7));
				match.put("srcLang", srcLang);
				match.put("tgtLang", tgtLang);

				String src = rs.getString(8);
				Element source = XliffUtils.buildElement(src);
				String tgt = rs.getString(9);
				Element target = XliffUtils.buildElement(tgt);

				List<Element> sourceTags = source.getChildren();
				List<Element> targetTags = target.getChildren();

				for (int i = 0; i < sourceTags.size(); i++) {
					Element sourceTag = sourceTags.get(i);
					for (int j = 0; j < targetTags.size(); j++) {
						Element targetTag = targetTags.get(j);
						if (sourceTag.equals(targetTag) && i < originalTags.size()) {
							targetTag.clone(originalTags.get(i));
						}
					}
					if (i < originalTags.size()) {
						sourceTag.clone(originalTags.get(i));
					}
				}

				tagsMap = new Hashtable<>();
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
				match.put("target", addHtmlTags(target, originalData));
				result.put(match);
			}
		}
		return result;
	}

	public void exportXliff(String output)
			throws SAXException, IOException, ParserConfigurationException, SQLException {
		updateXliff();
		File projectFolder = new File(xliffFile).getParentFile();
		File tempFolder = new File(projectFolder, "tmp");
		if (tempFolder.exists()) {
			TmsServer.deleteFolder(tempFolder);
		}
		List<String> files = Split.split(xliffFile, tempFolder.getAbsolutePath());
		File tempFile = File.createTempFile("joined", ".xlf", tempFolder);
		Join.join(files, tempFile.getAbsolutePath());
		File outputFile = new File(output);
		if (outputFile.exists()) {
			Files.delete(outputFile.toPath());
		}
		Files.copy(tempFile.toPath(), outputFile.toPath());
		Files.delete(tempFile.toPath());
		TmsServer.deleteFolder(tempFolder);
	}

	public void importXliff(String input) throws SAXException, IOException, ParserConfigurationException, SQLException {
		Document doc = builder.build(input);
		recurseImporting(doc.getRootElement());
	}

	private void recurseImporting(Element e) throws SQLException {
		if ("file".equals(e.getName())) {
			String original = e.getAttributeValue("original");
			String sql = "SELECT id FROM files WHERE name=?";
			try (PreparedStatement st = conn.prepareStatement(sql)) {
				st.setString(1, original);
				try (ResultSet rs = st.executeQuery()) {
					if (rs.next()) {
						currentFile = rs.getString(1);
					}
				}
			}
		}
		if ("unit".equals(e.getName())) {
			currentUnit = e.getAttributeValue("id");
		}
		if ("segment".equals(e.getName())) {
			String id = e.getAttributeValue("id");
			Element target = e.getChild("target");
			if (target != null) {
				state = e.getAttributeValue("state");
				String pureTarget = XliffUtils.pureText(target);
				updateTarget(currentFile, currentUnit, id, target, pureTarget, Constants.FINAL.equals(state));
			}
		}
		List<Element> children = e.getChildren();
		Iterator<Element> it = children.iterator();
		while (it.hasNext()) {
			recurseImporting(it.next());
		}
	}

	public void exportTMX(String output, String description, String client, String subject)
			throws SQLException, SAXException, IOException, ParserConfigurationException {
		Element d = new Element("prop");
		d.setAttribute("type", "project");
		d.setText(description);
		Element c = null;
		if (!client.isBlank()) {
			c = new Element("prop");
			c.setAttribute("type", "customer");
			c.setText(client);
		}
		Element s = null;
		if (!subject.isBlank()) {
			s = new Element("prop");
			s.setAttribute("type", "subject");
			s.setText(subject);
		}
		try (FileOutputStream out = new FileOutputStream(output)) {
			writeTmxHeader(out);
			String sql = "SELECT file, unitId, segId, source, target FROM segments WHERE type='S' AND state='final' ORDER BY file, unitId, segId";
			try (ResultSet rs = stmt.executeQuery(sql)) {
				while (rs.next()) {
					String file = rs.getString(1);
					String unit = rs.getString(2);
					String segment = rs.getString(3);

					StringBuilder key = new StringBuilder();
					key.append(xliffFile.hashCode());
					key.append('-');
					key.append(file);
					key.append('-');
					key.append(unit);
					key.append('-');
					key.append(segment);

					String src = rs.getString(4);
					Element source = XliffUtils.buildElement(src);
					String tgt = rs.getString(5);
					Element target = XliffUtils.buildElement(tgt);

					Map<String, String> tags = getTags(source);
					String[] context = getSurroundingSegments(file, unit, segment);

					Element tuv = XliffUtils.toTu(key.toString(), source, target, tags, srcLang, tgtLang, context);
					tuv.getContent().add(0, d);
					if (c != null) {
						tuv.getContent().add(0, c);
					}
					if (s != null) {
						tuv.getContent().add(0, s);
					}
					Indenter.indent(tuv, 2);
					writeString(out, tuv.toString());
				}
			}
			writeString(out, "</body>\n");
			writeString(out, "</tmx>\n");
		}
	}

	public void exportMatches(String output, String description, String client, String subject)
			throws SQLException, SAXException, IOException, ParserConfigurationException {
		Element d = new Element("prop");
		d.setAttribute("type", "project");
		d.setText(description);
		Element c = null;
		if (!client.isBlank()) {
			c = new Element("prop");
			c.setAttribute("type", "customer");
			c.setText(client);
		}
		Element s = null;
		if (!subject.isBlank()) {
			s = new Element("prop");
			s.setAttribute("type", "subject");
			s.setText(subject);
		}
		try (FileOutputStream out = new FileOutputStream(output)) {
			writeTmxHeader(out);
			String sql = "SELECT file, unitId, segId, source, target FROM matches WHERE type='tm' ORDER BY file, unitId, segId";
			try (ResultSet rs = stmt.executeQuery(sql)) {
				while (rs.next()) {
					String file = rs.getString(1);
					String unit = rs.getString(2);
					String segment = rs.getString(3);

					StringBuilder key = new StringBuilder();
					key.append(xliffFile.hashCode());
					key.append('-');
					key.append(file);
					key.append('-');
					key.append(unit);
					key.append('-');
					key.append(segment);

					String src = rs.getString(4);
					Element source = XliffUtils.buildElement(src);
					String tgt = rs.getString(5);
					Element target = XliffUtils.buildElement(tgt);

					Map<String, String> tags = getTags(source);
					String[] context = getSurroundingSegments(file, unit, segment);

					Element tuv = XliffUtils.toTu(key.toString(), source, target, tags, srcLang, tgtLang, context);
					tuv.getContent().add(0, d);
					if (c != null) {
						tuv.getContent().add(0, c);
					}
					if (s != null) {
						tuv.getContent().add(0, s);
					}
					Indenter.indent(tuv, 2);
					writeString(out, tuv.toString());
				}
			}
			writeString(out, "</body>\n");
			writeString(out, "</tmx>\n");
		}
	}

	public void exportTerms(String output, String description, String subject) throws SQLException, IOException {
		Element descrip = null;
		if (!subject.isBlank()) {
			descrip = new Element("descrip");
			descrip.setAttribute("type", "subjectField");
			descrip.setText(subject);
		}
		try (FileOutputStream out = new FileOutputStream(output)) {
			XMLDeclaration decl = new XMLDeclaration("1.0", "UTF-8", null);
			writeString(out, decl.toString() + "\n");
			PI model = new PI("xml-model",
					"href=\"urn:iso:std:iso:30042:ed-2\" schematypens=\"http://relaxng.org/ns/structure/1.0\"");
			writeString(out, model.toString() + "\n");
			Element tbx = new Element("tbx");
			tbx.setAttribute("type", "TBX-Basic");
			tbx.setAttribute("style", "dca");
			tbx.setAttribute("xml:lang", srcLang);
			tbx.setAttribute("xmlns", "urn:iso:std:iso:30042:ed-2");
			writeString(out, tbx.getHead() + "\n");
			Element tbxHeader = new Element("tbxHeader");
			Element fileDesc = new Element("fileDesc");
			tbxHeader.addContent(fileDesc);
			Element sourceDesc = new Element("sourceDesc");
			fileDesc.addContent(sourceDesc);
			Element p = new Element("p");
			p.setText(description);
			sourceDesc.addContent(p);
			Indenter.indent(tbxHeader, 2);
			writeString(out, tbxHeader.toString() + "\n");
			Element text = new Element("text");
			writeString(out, text.getHead() + "\n");
			Element body = new Element("body");
			writeString(out, body.getHead() + "\n");

			String sql = "SELECT DISTINCT source, target FROM terms";
			long now = System.currentTimeMillis();
			try (ResultSet rs = stmt.executeQuery(sql)) {
				while (rs.next()) {
					Element conceptEntry = new Element("conceptEntry");
					conceptEntry.setAttribute("id", "c" + now++);
					if (descrip != null) {
						conceptEntry.addContent(descrip);
					}
					Element langSec = new Element("langSec");
					langSec.setAttribute("xml:lang", srcLang);
					conceptEntry.addContent(langSec);
					Element termSec = new Element("termSec");
					langSec.addContent(termSec);
					Element term = new Element("term");
					term.setText(rs.getString(1));
					termSec.addContent(term);

					Element langSec2 = new Element("langSec");
					langSec2.setAttribute("xml:lang", tgtLang);
					conceptEntry.addContent(langSec2);
					Element termSec2 = new Element("termSec");
					langSec2.addContent(termSec2);
					Element term2 = new Element("term");
					term2.setText(rs.getString(2));
					termSec2.addContent(term2);
					Indenter.indent(conceptEntry, 2);
					writeString(out, conceptEntry.toString() + "\n");
				}
			}
			writeString(out, body.getTail() + "\n");
			writeString(out, text.getTail() + "\n");
			writeString(out, tbx.getTail());
		}
	}

	private void writeTmxHeader(FileOutputStream out) throws IOException {
		writeString(out, "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
		writeString(out,
				"<!DOCTYPE tmx PUBLIC \"-//LISA OSCAR:1998//DTD for Translation Memory eXchange//EN\" \"tmx14.dtd\" >\n");
		writeString(out, "<tmx version=\"1.4\">\n");
		writeString(out,
				"<header creationtool=\"" + Constants.APPNAME + "\" creationtoolversion=\"" + Constants.VERSION
						+ "\" srclang=\"" + srcLang + "\" "
						+ " adminlang=\"en\" datatype=\"xml\" o-tmf=\"unknown\" segtype=\"block\" creationdate=\""
						+ TMUtils.creationDate() + "\"/>\n");
		writeString(out, "<body>\n");
	}

	public void exportTranslations(String output)
			throws SAXException, IOException, ParserConfigurationException, SQLException {
		updateXliff();
		getPreferences();
		File adjusted = reviewStates();
		List<String> result = Merge.merge(adjusted.getAbsolutePath(), output, catalog, acceptUnconfirmed);
		if (!"0".equals(result.get(0))) {
			throw new IOException(result.get(1));
		}
		Files.delete(adjusted.toPath());
	}

	private File reviewStates() throws SAXException, IOException, ParserConfigurationException {
		File xliff = new File(xliffFile);
		File adjusted = new File(xliff.getParentFile(), "adjusted.xlf");
		document = builder.build(xliffFile);
		recurseStates(document.getRootElement());
		XMLOutputter outputter = new XMLOutputter();
		outputter.preserveSpace(true);
		Indenter.indent(document.getRootElement(), 2);
		try (FileOutputStream out = new FileOutputStream(adjusted)) {
			outputter.output(document, out);
		}
		return adjusted;
	}

	private void recurseStates(Element e) {
		if ("segment".equals(e.getName())) {
			if ("initial".equals(e.getAttributeValue("state"))) {
				Element source = e.getChild("source");
				Element target = e.getChild("target");
				if (target == null) {
					target = new Element("target");
					if ("preserve".equals(source.getAttributeValue("xml:space", "default"))) {
						target.setAttribute("xml:space", "preserve");
					}
					e.addContent(target);
				}
				target.setContent(source.getContent());
			}
			return;
		}
		if ("ignorable".equals(e.getName())) {
			Element target = e.getChild("target");
			if (target == null) {
				Element source = e.getChild("source");
				target = new Element("target");
				if ("preserve".equals(source.getAttributeValue("xml:space", "default"))) {
					target.setAttribute("xml:space", "preserve");
				}
				target.setContent(source.getContent());
				e.addContent(target);
			}
			return;
		}
		List<Element> children = e.getChildren();
		Iterator<Element> it = children.iterator();
		while (it.hasNext()) {
			recurseStates(it.next());
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
		unitNotes = conn
				.prepareStatement("SELECT segId, noteId, note FROM notes WHERE file=? AND unitId=? ORDER BY segId");
		recurseUpdating(document.getRootElement());
		unitTerms.close();
		unitMatches.close();
		unitNotes.close();
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
			Element glossary = getUnitTerms(currentFile, currentUnit);
			if (glossary != null) {
				insertGlossary(e, glossary);
			}
			Element matches = getUnitMatches(currentFile, currentUnit);
			Map<String, Element> matchesData = new HashMap<>();
			if (matches != null) {
				List<Element> matchesList = matches.getChildren("mtc:match");
				Iterator<Element> it = matchesList.iterator();
				while (it.hasNext()) {
					Element match = it.next();
					Element originalData = match.getChild("originalData");
					if (originalData != null) {
						List<Element> dataList = originalData.getChildren("data");
						for (int i = 0; i < dataList.size(); i++) {
							Element data = dataList.get(i);
							matchesData.put(data.getAttributeValue("id"), data);
						}
					}
				}
				insertMatches(e, matches);
			}
			if (!matchesData.isEmpty()) {
				Element originalData = e.getChild("originalData");
				if (originalData == null) {
					originalData = new Element("originalData");
					insertOriginalData(e, originalData);
				}
				Map<String, Element> oldData = new HashMap<>();
				List<Element> dataList = originalData.getChildren("data");
				for (int i = 0; i < dataList.size(); i++) {
					Element data = dataList.get(i);
					oldData.put(data.getAttributeValue("id"), data);
				}
				Set<String> keys = matchesData.keySet();
				Iterator<String> it = keys.iterator();
				while (it.hasNext()) {
					String key = it.next();
					if (!oldData.containsKey(key)) {
						oldData.put(key, matchesData.get(key));
						originalData.addContent(matchesData.get(key));
					}
				}
			}
			Element notes = getUnitNotes(currentFile, currentUnit);
			if (notes != null) {
				insertNotes(e, notes);
			}
		}
		if ("segment".equals(e.getName())) {
			String id = e.getAttributeValue("id");
			Element source = e.getChild("source");
			Element target = e.getChild("target");
			if (target == null) {
				target = new Element("target");
				if (source.hasAttribute("xml:space")) {
					target.setAttribute("xml:space", source.getAttributeValue("xml:space"));
				}
				e.addContent(target);
			}
			Element updated = getTarget(currentFile, currentUnit, id);
			target.setContent(updated.getContent());
			String st = getState(currentFile, currentUnit, id);
			boolean translate = isTranslatable(currentFile, currentUnit, id);
			if (Constants.INITIAL.equals(st) && !target.getContent().isEmpty()) {
				st = Constants.TRANSLATED;
				logger.log(Level.WARNING, Messages.getString("XliffStore.4"));
			}
			JSONArray notesArray = getNotes(currentFile, currentUnit, id);
			if (notesArray.length() > 0) {
				target = FromXliff2.removeComments(target);
				for (int i = 0; i < notesArray.length(); i++) {
					JSONObject json = notesArray.getJSONObject(i);
					String noteId = json.getString("id");
					Element mrk = new Element("mrk");
					mrk.setAttribute("id", "tn" + noteId);
					mrk.setAttribute("type", "comment");
					mrk.setAttribute("ref", "#n=" + noteId);
					mrk.setContent(target.getContent());
					List<XMLNode> content = new Vector<>();
					content.add(mrk);
					target.setContent(content);
				}
			}
			e.setAttribute("state", st);
			if (translate) {
				e.removeAttribute("subState");
			} else {
				e.setAttribute("subState", "openxliff:locked");
			}
			if (Constants.INITIAL.equals(st) && target.getContent().isEmpty()) {
				e.removeChild(target);
			}
		}
		if ("ignorable".equals(e.getName())) {
			Element source = e.getChild("source");
			Element target = e.getChild("target");
			if (target == null) {
				target = new Element("target");
				if (source.hasAttribute("xml:space")) {
					target.setAttribute("xml:space", source.getAttributeValue("xml:space"));
				}
				e.addContent(target);
			}
			target.setContent(source.getContent());
		}
		List<Element> children = e.getChildren();
		Iterator<Element> it = children.iterator();
		while (it.hasNext()) {
			recurseUpdating(it.next());
		}
	}

	private void insertOriginalData(Element unit, Element originalData) {
		List<XMLNode> newContent = new Vector<>();
		boolean added = false;
		List<XMLNode> oldContent = unit.getContent();
		Iterator<XMLNode> it = oldContent.iterator();
		while (it.hasNext()) {
			XMLNode node = it.next();
			if (node.getNodeType() == XMLNode.ELEMENT_NODE) {
				Element e = (Element) node;
				if ("segment".equals(e.getName()) || "ignorable".equals(e.getName()) && !added) {
					newContent.add(originalData);
					added = true;
				}
				newContent.add(node);
			} else {
				newContent.add(node);
			}
		}
		unit.setContent(newContent);
	}

	private void insertMatches(Element unit, Element matches) {
		Element old = unit.getChild("mtc:matches");
		if (old != null) {
			unit.removeChild(old);
		}
		unit.getContent().add(0, matches);
	}

	private void insertNotes(Element unit, Element notes) {
		Element old = unit.getChild("notes");
		if (old != null) {
			unit.removeChild(old);
		}
		boolean added = false;
		List<XMLNode> newContent = new Vector<>();
		List<XMLNode> oldContent = unit.getContent();
		Iterator<XMLNode> it = oldContent.iterator();
		while (it.hasNext()) {
			XMLNode node = it.next();
			if (node.getNodeType() == XMLNode.ELEMENT_NODE) {
				Element e = (Element) node;
				if (e.getNamespace().isEmpty() && !added) {
					newContent.add(notes);
					added = true;
				}
				newContent.add(node);
			} else {
				newContent.add(node);
			}
		}
		unit.setContent(newContent);
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
				match.setAttribute("ref", "#" + rs.getString(3));
				match.setAttribute("origin", rs.getString(5));
				match.setAttribute("type", rs.getString(6));
				match.setAttribute("matchQuality", "" + rs.getInt(7));
				Element originalData = new Element("originalData");
				String data = rs.getString(10);
				if (!data.isEmpty()) {
					originalData = XliffUtils.buildElement(data);
					List<Element> newData = new Vector<>();
					List<Element> oldData = originalData.getChildren();
					Iterator<Element> it = oldData.iterator();
					while (it.hasNext()) {
						Element d = it.next();
						if (!d.getContent().isEmpty()) {
							newData.add(d);
						}
					}
					originalData.setChildren(newData);
					if (!newData.isEmpty()) {
						match.addContent(originalData);
					}
				}
				Set<String> dataRefs = new HashSet<>();
				Iterator<Element> it = originalData.getChildren().iterator();
				while (it.hasNext()) {
					dataRefs.add(it.next().getAttributeValue("id"));
				}
				match.addContent(XliffUtils.buildElement(rs.getString(8)));
				match.addContent(XliffUtils.buildElement(rs.getString(9)));
				removeMissingReferences(match.getChild("source"), dataRefs);
				removeMissingReferences(match.getChild("target"), dataRefs);
				matches.addContent(match);
			}
		}
		return matches.getChildren("mtc:match").isEmpty() ? null : matches;
	}

	private void removeMissingReferences(Element child, Set<String> references) {
		List<Element> tags = child.getChildren();
		Iterator<Element> it = tags.iterator();
		while (it.hasNext()) {
			Element e = it.next();
			String dataRef = e.getAttributeValue("dataRef");
			if (!dataRef.isEmpty() && !references.contains(dataRef)) {
				e.removeAttribute("dataRef");
			}
		}
	}

	private Element getUnitNotes(String file, String unit) throws SQLException {
		Element notes = new Element("notes");
		unitNotes.setString(1, file);
		unitNotes.setString(2, unit);
		try (ResultSet rs = unitNotes.executeQuery()) {
			while (rs.next()) {
				Element note = new Element("note");
				note.setAttribute("id", rs.getString(2));
				note.setText(rs.getString(3));
				notes.addContent(note);
			}
		}
		return notes.getChildren().isEmpty() ? null : notes;
	}

	private Element getUnitTerms(String file, String unit) throws SQLException {
		Element glossary = new Element("gls:glossary");
		unitTerms.setString(1, file);
		unitTerms.setString(2, unit);
		try (ResultSet rs = unitTerms.executeQuery()) {
			while (rs.next()) {
				Element entry = new Element("gls:glossEntry");
				entry.setAttribute("ref", "#" + rs.getString(3));
				glossary.addContent(entry);

				Element term = new Element("gls:term");
				term.setAttribute("source", rs.getString(5));
				term.setText(rs.getString(6));
				entry.addContent(term);

				Element translation = new Element("gls:translation");
				translation.setText(rs.getString(7));
				entry.addContent(translation);
			}
		}
		return glossary.getChildren().isEmpty() ? null : glossary;
	}

	public void assembleMatches(JSONObject json)
			throws SAXException, IOException, ParserConfigurationException, SQLException, URISyntaxException {
		String file = json.getString("file");
		String unit = json.getString("unit");
		String segment = json.getString("segment");

		String pure = "";
		getSource.setString(1, file);
		getSource.setString(2, unit);
		getSource.setString(3, segment);
		try (ResultSet rs = getSource.executeQuery()) {
			while (rs.next()) {
				pure = rs.getString(2);
			}
		}

		String memory = json.getString("memory");
		MemoriesHandler.open(memory);
		ITmEngine tmEngine = MemoriesHandler.getEngine(memory);
		List<Match> tmMatches = tmEngine.searchTranslation(pure, srcLang, tgtLang, 60, false);
		MemoriesHandler.close(memory);

		String glossary = json.getString("glossary");
		GlossariesHandler.openGlossary(glossary);
		ITmEngine glossEngine = GlossariesHandler.getEngine(glossary);

		Match match = MatchAssembler.assembleMatch(pure, tmMatches, glossEngine, srcLang, tgtLang);
		if (match != null) {
			Element matchSource = match.getSource();
			matchSource.setAttribute("xml:lang", srcLang);
			Element matchTarget = match.getTarget();
			matchTarget.setAttribute("xml:lang", tgtLang);
			insertMatch(file, unit, segment, "Auto", Constants.AM, match.getSimilarity(), matchSource, matchTarget,
					new JSONObject());
			conn.commit();
		}
		GlossariesHandler.closeGlossary(glossary);
	}

	public void assembleMatchesAll(JSONObject json)
			throws IOException, SQLException, SAXException, ParserConfigurationException, URISyntaxException {

		String memory = json.getString("memory");
		MemoriesHandler.open(memory);
		ITmEngine tmEngine = MemoriesHandler.getEngine(memory);

		String glossary = json.getString("glossary");
		GlossariesHandler.openGlossary(glossary);
		ITmEngine glossEngine = GlossariesHandler.getEngine(glossary);

		String sql = "SELECT file, unitId, segId, sourceText FROM segments WHERE state <> 'final'";
		try (ResultSet rs = stmt.executeQuery(sql)) {
			while (rs.next()) {
				String file = rs.getString(1);
				String unit = rs.getString(2);
				String segment = rs.getString(3);
				String pure = rs.getString(4);
				try {
					List<Match> tmMatches = tmEngine.searchTranslation(pure, srcLang, tgtLang, 60, false);
					Match match = MatchAssembler.assembleMatch(pure, tmMatches, glossEngine, srcLang, tgtLang);
					if (match != null) {
						Element matchSource = match.getSource();
						matchSource.setAttribute("xml:lang", srcLang);
						Element matchTarget = match.getTarget();
						matchTarget.setAttribute("xml:lang", tgtLang);
						insertMatch(file, unit, segment, "Auto", Constants.AM, match.getSimilarity(), matchSource,
								matchTarget, new JSONObject());
						conn.commit();
					}
				} catch (IOException | ParserConfigurationException | SAXException | SQLException ex) {
					// Ignore errors in individual segments
					JSONObject errorSegment = new JSONObject();
					errorSegment.put("file", file);
					errorSegment.put("unit", unit);
					errorSegment.put("segment", segment);
					MessageFormat mf = new MessageFormat(Messages.getString("XliffStore.5"));
					logger.log(Level.WARNING, mf.format(new String[] { ex.getMessage(), errorSegment.toString() }));
				}
			}
		}
		MemoriesHandler.close(memory);
		GlossariesHandler.closeGlossary(glossary);
	}

	public JSONArray tmTranslate(JSONObject json) throws SAXException, IOException, ParserConfigurationException,
			SQLException, DataFormatException, URISyntaxException {
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
				src = rs.getString(1);
				pure = rs.getString(2);
			}
		}
		Element original = XliffUtils.buildElement(src);
		String memoryName = MemoriesHandler.getName(memory);
		MemoriesHandler.open(memory);
		ITmEngine engine = MemoriesHandler.getEngine(memory);
		List<Match> matches = engine.searchTranslation(pure, srcLang, tgtLang, 60, caseSensitiveMatches);
		for (int i = 0; i < matches.size(); i++) {
			Match m = matches.get(i);
			XliffUtils.setTags(new JSONObject());
			Element matchSource = XliffUtils.toXliff(segment, i, "source", m.getSource());
			matchSource.setAttribute("xml:lang", srcLang);
			Element matchTarget = XliffUtils.toXliff(segment, i, "target", m.getTarget());
			matchTarget.setAttribute("xml:lang", tgtLang);
			JSONObject obj = new JSONObject();
			obj.put("dataRef", XliffUtils.getTags());
			int similarity = m.getSimilarity() - tagDifferences(original, matchSource);
			insertMatch(file, unit, segment, memoryName, Constants.TM, similarity, matchSource, matchTarget, obj);
			conn.commit();
		}
		MemoriesHandler.close(memory);
		return getTaggedtMatches(json);
	}

	public int tmTranslateAll(String memory, int penalization, Map<String, JSONObject> processes, String processId)
			throws IOException, SQLException, SAXException, ParserConfigurationException, URISyntaxException {
		String memoryName = MemoriesHandler.getName(memory);
		MemoriesHandler.open(memory);
		ITmEngine engine = MemoriesHandler.getEngine(memory);
		String sql = "SELECT COUNT(*) FROM segments WHERE type = 'S' AND state <> 'final'";
		int total = 0;
		try (ResultSet rs = stmt.executeQuery(sql)) {
			while (rs.next()) {
				total = rs.getInt(1);
			}
		}
		if (total == 0) {
			return 0;
		}
		int processed = 0;
		int offset = 0;
		do {
			processed += translateBatch(offset, engine, memoryName, penalization);
			int percentage = Math.round(offset * 100f / total);
			if (percentage == 100) {
				percentage = 99;
			}
			processes.get(processId).put("percentage", percentage);
			offset += BATCHSIZE;
		} while (offset < total);
		MemoriesHandler.close(memory);
		return processed;
	}

	private synchronized int translateBatch(int offset, ITmEngine engine, String memoryName, int penalization)
			throws IOException, SQLException, SAXException, ParserConfigurationException, URISyntaxException {
		StringBuilder sb = new StringBuilder();
		sb.append(
				"SELECT file, unitId, segId, source, sourceText, target FROM segments WHERE type = 'S' AND state <> 'final' LIMIT ");
		sb.append(BATCHSIZE);
		sb.append(" OFFSET ");
		sb.append(offset);
		JSONObject params = new JSONObject();
		JSONArray array = new JSONArray();
		try (Statement prepared = conn.createStatement()) {
			try (ResultSet rs = prepared.executeQuery(sb.toString())) {
				params.put("srcLang", srcLang);
				params.put("tgtLang", tgtLang);
				params.put("caseSensitiveMatches", caseSensitiveMatches);
				while (rs.next()) {
					String file = rs.getString(1);
					String unit = rs.getString(2);
					String segment = rs.getString(3);
					String pure = rs.getString(5);
					JSONObject json = new JSONObject();
					json.put("file", file);
					json.put("unit", unit);
					json.put("segment", segment);
					json.put("pure", pure);
					array.put(json);
					if (array.length() == BATCHSIZE) {
						break;
					}
				}
				params.put("segments", array);
			}
		}
		JSONArray translations = engine.batchTranslate(params);
		return storeMatches(translations, memoryName, penalization);
	}

	private int storeMatches(JSONArray translations, String memoryName, int penalization)
			throws SAXException, IOException, ParserConfigurationException, SQLException {
		int count = 0;
		for (int i = 0; i < translations.length(); i++) {
			JSONObject json = translations.getJSONObject(i);
			JSONArray matches = json.getJSONArray("matches");
			if (matches.length() > 0) {
				String file = json.getString("file");
				String unit = json.getString("unit");
				String segment = json.getString("segment");

				getSegment.setString(1, file);
				getSegment.setString(2, unit);
				getSegment.setString(3, segment);
				try (ResultSet rs = getSegment.executeQuery()) {
					while (rs.next()) {
						String src = rs.getString(1);
						String tgt = rs.getString(2);
						Element original = XliffUtils.buildElement(src);
						if (tgt == null || tgt.isEmpty()) {
							tgt = "<target xml:lang=\"" + tgtLang + "\"/>";
						}
						Element originalTarget = XliffUtils.buildElement(tgt);
						boolean updated = false;
						for (int j = 0; j < matches.length(); j++) {
							Match m = new Match(matches.getJSONObject(j));
							XliffUtils.setTags(new JSONObject());
							Element matchSource = XliffUtils.toXliff(segment, j, "source", m.getSource());
							matchSource.setAttribute("xml:lang", srcLang);
							Element matchTarget = XliffUtils.toXliff(segment, j, "target", m.getTarget());
							matchTarget.setAttribute("xml:lang", tgtLang);
							int similarity = m.getSimilarity() - tagDifferences(original, matchSource) - penalization;
							insertMatch(file, unit, segment, memoryName, Constants.TM, similarity, matchSource,
									matchTarget, XliffUtils.getTags());
							if (similarity == 100 && originalTarget.getContent().isEmpty() && !updated) {
								if (!matchTarget.getChildren().isEmpty()) {
									matchTarget = fixTags(original, matchSource, matchTarget);
								}
								updateTarget(file, unit, segment, matchTarget, XliffUtils.pureText(matchTarget), false);
								updated = true;
							}
						}
					}
				}
				conn.commit();
				count++;
			}
		}
		return count;
	}

	private Element fixTags(Element source, Element matchSource, Element matchTarget) {
		List<Element> sourceTags = source.getChildren();
		List<Element> matchSourceTags = matchSource.getChildren();
		List<Element> matchTargetTags = matchTarget.getChildren();
		for (int i = 0; i < matchTargetTags.size(); i++) {
			Element targetTag = matchTargetTags.get(i);
			for (int j = 0; j < matchSourceTags.size(); j++) {
				Element sourceTag = matchSourceTags.get(j);
				if (sourceTag.equals(targetTag)) {
					if (j < sourceTags.size()) {
						Element originalTag = sourceTags.get(j);
						targetTag.clone(originalTag);
					}
					break;
				}
			}
		}
		return matchTarget;
	}

	public void removeTranslations() throws SQLException, SAXException, IOException, ParserConfigurationException {
		String sql = "SELECT file, unitId, segId, source FROM segments WHERE type='S' AND translate='Y' and targetText<>'' ";
		try (ResultSet rs = stmt.executeQuery(sql)) {
			while (rs.next()) {
				String file = rs.getString(1);
				String unit = rs.getString(2);
				String segment = rs.getString(3);
				String src = rs.getString(4);
				Element source = XliffUtils.buildElement(src);
				Element target = new Element("target");
				if (source.hasAttribute("xml:space")) {
					target.setAttribute("xml:space", source.getAttributeValue("xml:space"));
				}
				updateTarget(file, unit, segment, target, "", false);
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
				String src = rs.getString(4);

				Element source = XliffUtils.buildElement(src);
				Element target = pseudoTranslate(source);
				String pureTarget = XliffUtils.pureText(target);

				updateTarget(file, unit, segment, target, pureTarget, false);
			}
		}
	}

	private Element pseudoTranslate(Element source) {
		Element target = new Element("target");
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
				String src = rs.getString(4);

				Element source = XliffUtils.buildElement(src);
				Element target = new Element("target");
				if (source.hasAttribute("xml:space")) {
					target.setAttribute("xml:space", source.getAttributeValue("xml:space"));
				}
				target.setContent(source.getContent());
				String pureTarget = XliffUtils.pureText(target);

				updateTarget(file, unit, segment, target, pureTarget, false);
			}
		}
	}

	public void confirmAllTranslations(String memory)
			throws SQLException, SAXException, IOException, ParserConfigurationException, URISyntaxException {
		if (memory.equals(Constants.NONE)) {
			stmt.execute("UPDATE segments SET state='final' WHERE type='S' AND targetText<>'' AND translate='Y' ");
			conn.commit();
			return;
		}
		MemoriesHandler.open(memory);
		ITmEngine engine = MemoriesHandler.getEngine(memory);
		String sql = "SELECT file, unitId, segId FROM segments WHERE state<>'final' AND type='S' AND targetText<>'' AND translate='Y'";
		try (ResultSet rs = stmt.executeQuery(sql)) {
			try (PreparedStatement updateSegment = conn
					.prepareStatement("UPDATE segments SET state='final' WHERE file=? AND unitId=? AND segId=?")) {

				while (rs.next()) {
					String file = rs.getString(1);
					String unit = rs.getString(2);
					String segment = rs.getString(3);

					updateSegment.setString(1, file);
					updateSegment.setString(2, unit);
					updateSegment.setString(3, segment);
					updateSegment.executeUpdate();

					getSegment.setString(1, file);
					getSegment.setString(2, unit);
					getSegment.setString(3, segment);

					try (ResultSet rs2 = getSegment.executeQuery()) {
						while (rs2.next()) {
							Element source = XliffUtils.buildElement(rs2.getString(1));
							Element target = XliffUtils.buildElement(rs2.getString(2));
							Map<String, String> tags = getTags(source);
							String[] context = getSurroundingSegments(file, unit, segment);
							StringBuilder key = new StringBuilder();
							key.append(xliffFile.hashCode());
							key.append('-');
							key.append(file);
							key.append('-');
							key.append(unit);
							key.append('-');
							key.append(segment);
							engine.storeTu(
									XliffUtils.toTu(key.toString(), source, target, tags, srcLang, tgtLang, context));
						}
					}
				}
			}
		}
		MemoriesHandler.close(memory);
		conn.commit();
	}

	public void acceptAll100Matches() throws SQLException, SAXException, IOException, ParserConfigurationException {
		String sql = "SELECT file, unitId, segId, source FROM segments WHERE type='S' AND (state='initial' OR targetText='') AND translate='Y' ";
		try (ResultSet rs = stmt.executeQuery(sql)) {
			try (PreparedStatement perfectMatches = conn.prepareStatement(
					"SELECT source, target FROM matches WHERE file=? AND unitId=? AND segId=? AND type='tm' AND similarity=100 LIMIT 1")) {
				while (rs.next()) {
					String file = rs.getString(1);
					String unit = rs.getString(2);
					String segment = rs.getString(3);
					String src = rs.getString(4);
					Element originalSource = XliffUtils.buildElement(src);

					perfectMatches.setString(1, file);
					perfectMatches.setString(2, unit);
					perfectMatches.setString(3, segment);
					try (ResultSet rs2 = perfectMatches.executeQuery()) {
						while (rs2.next()) {
							Element source = XliffUtils.buildElement(rs2.getString(1));
							String tgt = rs2.getString(2);
							Element target = XliffUtils.buildElement(tgt);
							target.setAttribute("xml:lang", tgtLang);
							if (originalSource.hasAttribute("xml:space")) {
								target.setAttribute("xml:space", originalSource.getAttributeValue("xml:space"));
							}
							String pureTarget = XliffUtils.pureText(target);
							if (!target.getChildren().isEmpty()) {
								target = fixTags(originalSource, source, target);
							}
							updateTarget(file, unit, segment, target, pureTarget, false);
						}
					}
				}
			}
		}
	}

	public String generateStatistics(String projectName)
			throws SQLException, SAXException, IOException, ParserConfigurationException, URISyntaxException {
		getPreferences();
		updateXliff();
		File file = new File(xliffFile);

		Map<String, JSONObject> map = new HashMap<>();
		Map<String, Set<String>> filesMap = new HashMap<>();

		String sql = "SELECT file, SUM(words), SUM(chars), COUNT(*) FROM segments WHERE type='S' GROUP BY file";
		try (ResultSet rs = stmt.executeQuery(sql)) {
			while (rs.next()) {
				String fileId = rs.getString(1);
				JSONObject json = new JSONObject();
				int words = rs.getInt(2);
				int chars = rs.getInt(3);
				int segments = rs.getInt(4);
				json.put("file", fileId);
				json.put("words", words);
				json.put("chars", chars);
				json.put("segments", segments);
				map.put(fileId, json);
			}
		}

		sql = "SELECT id, name FROM files";
		try (ResultSet rs = stmt.executeQuery(sql)) {
			while (rs.next()) {
				String id = rs.getString(1);
				String name = rs.getString(2);
				map.get(id).put("name", name);
				if (filesMap.containsKey(name)) {
					Set<String> ids = filesMap.get(name);
					ids.add(id);
					filesMap.put(name, ids);
				} else {
					Set<String> ids = new TreeSet<>();
					ids.add(id);
					filesMap.put(name, ids);
				}
			}
		}

		sql = "SELECT file, SUM(words), SUM(chars), COUNT(*) FROM segments WHERE type = 'S' AND targettext = '' GROUP BY file";
		try (ResultSet rs = stmt.executeQuery(sql)) {
			while (rs.next()) {
				String fileId = rs.getString(1);
				int untranslated = rs.getInt(2);
				int untranslatedChars = rs.getInt(3);
				int untranslatedSegments = rs.getInt(4);
				map.get(fileId).put("untranslated", untranslated);
				map.get(fileId).put("untranslatedChars", untranslatedChars);
				map.get(fileId).put("untranslatedSegments", untranslatedSegments);
			}
		}

		sql = "SELECT file, SUM(words), SUM(chars), COUNT(*) FROM segments WHERE type = 'S' AND targettext <> '' GROUP BY file";
		try (ResultSet rs = stmt.executeQuery(sql)) {
			while (rs.next()) {
				String fileId = rs.getString(1);
				int translated = rs.getInt(2);
				int translatedChars = rs.getInt(3);
				int translatedSegments = rs.getInt(4);
				map.get(fileId).put("translated", translated);
				map.get(fileId).put("translatedChars", translatedChars);
				map.get(fileId).put("translatedSegments", translatedSegments);
			}
		}

		sql = "SELECT file, SUM(words), SUM(chars), COUNT(*) FROM segments WHERE type = 'S' AND state = 'final' GROUP BY file";
		try (ResultSet rs = stmt.executeQuery(sql)) {
			while (rs.next()) {
				String fileId = rs.getString(1);
				int confirmed = rs.getInt(2);
				int confirmedChars = rs.getInt(3);
				int confirmedSegments = rs.getInt(4);
				map.get(fileId).put("confirmed", confirmed);
				map.get(fileId).put("confirmedChars", confirmedChars);
				map.get(fileId).put("confirmedSegments", confirmedSegments);
			}
		}

		Map<String, JSONObject> statusMap = new HashMap<>();
		Set<String> currentFileSegments = null;
		Set<String> otherFileSegments = new TreeSet<>();

		sql = "SELECT MAX(similarity) FROM matches WHERE file = ? AND unitid = ? AND segid = ?";
		try (PreparedStatement st = conn.prepareStatement(sql)) {
			String currentFileId = "";
			JSONObject json = null;
			sql = "SELECT file, unitid, segid, source, words,tags FROM segments WHERE type = 'S' ORDER BY file, unitid, segid";
			try (ResultSet rs = stmt.executeQuery(sql)) {
				while (rs.next()) {
					String fileId = rs.getString(1);
					String unitId = rs.getString(2);
					String segId = rs.getString(3);
					String source = rs.getString(4);
					int words = rs.getInt(5);
					int tags = rs.getInt(6);
					if (!currentFileId.equals(fileId)) {
						json = new JSONObject();
						json.put("newSegments", 0);
						json.put("100Segments", 0);
						json.put("95Segments", 0);
						json.put("85Segments", 0);
						json.put("75Segments", 0);
						json.put("50Segments", 0);
						json.put("intRepSegment", 0);
						json.put("extRepSegment", 0);
						json.put("newWords", 0);
						json.put("100Words", 0);
						json.put("95Words", 0);
						json.put("85Words", 0);
						json.put("75Words", 0);
						json.put("50Words", 0);
						json.put("tags", 0);
						json.put("intRep", 0);
						json.put("extRep", 0);
						statusMap.put(fileId, json);
						currentFileId = fileId;
						if (currentFileSegments != null) {
							otherFileSegments.addAll(currentFileSegments);
						}
						currentFileSegments = new TreeSet<>();
					}
					json.put("tags", json.getInt("tags") + tags);
					st.setString(1, fileId);
					st.setString(2, unitId);
					st.setString(3, segId);
					int max = 0;
					try (ResultSet rs2 = st.executeQuery()) {
						while (rs2.next()) {
							max = rs2.getInt(1);
						}
					}
					if (max < 50) {
						if (currentFileSegments.contains(source)) {
							json.put("intRepSegment", json.getInt("intRepSegment") + 1);
							json.put("intRep", json.getInt("intRep") + words);
						} else if (otherFileSegments.contains(source)) {
							json.put("extRepSegment", json.getInt("extRepSegment") + 1);
							json.put("extRep", json.getInt("extRep") + words);
						} else {
							json.put("newSegments", json.getInt("newSegments") + 1);
							json.put("newWords", json.getInt("newWords") + words);
						}
					}
					currentFileSegments.add(source);
					if (max == 100) {
						json.put("100Segments", json.getInt("100Segments") + 1);
						json.put("100Words", json.getInt("100Words") + words);
					}
					if (max >= 95 && max <= 99) {
						json.put("95Segments", json.getInt("95Segments") + 1);
						json.put("95Words", json.getInt("95Words") + words);
					}
					if (max >= 85 && max <= 94) {
						json.put("85Segments", json.getInt("85Segments") + 1);
						json.put("85Words", json.getInt("85Words") + words);
					}
					if (max >= 75 && max <= 84) {
						json.put("75Segments", json.getInt("75Segments") + 1);
						json.put("75Words", json.getInt("75Words") + words);
					}
					if (max >= 50 && max <= 74) {
						json.put("50Segments", json.getInt("50Segments") + 1);
						json.put("50Words", json.getInt("50Words") + words);
					}
				}
			}
		}

		sql = "SELECT file, SUM(words), SUM(chars), COUNT(*) FROM segments WHERE type = 'S' AND translate = 'N' GROUP BY file";
		try (ResultSet rs = stmt.executeQuery(sql)) {
			while (rs.next()) {
				String fileId = rs.getString(1);
				int locked = rs.getInt(2);
				int lockedChars = rs.getInt(3);
				int confirmedSegments = rs.getInt(4);
				map.get(fileId).put("locked", locked);
				map.get(fileId).put("lockedChars", lockedChars);
				map.get(fileId).put("lockedSegments", confirmedSegments);
			}
		}

		Set<String> keys = map.keySet();
		Iterator<String> it = keys.iterator();
		while (it.hasNext()) {
			String key = it.next();
			JSONObject json = map.get(key);
			if (!json.has("untranslated")) {
				json.put("untranslated", 0);
				map.put(key, json);
			}
			if (!json.has("translated")) {
				json.put("translated", 0);
				map.put(key, json);
			}
			if (!json.has("translatedChars")) {
				json.put("translatedChars", 0);
				map.put(key, json);
			}
			if (!json.has("confirmed")) {
				json.put("confirmed", 0);
				map.put(key, json);
			}
			if (!json.has("confirmedChars")) {
				json.put("confirmedChars", 0);
				map.put(key, json);
			}
			if (!json.has("translatedSegments")) {
				json.put("translatedSegments", 0);
				map.put(key, json);
			}
			if (!json.has("untranslatedSegments")) {
				json.put("untranslatedSegments", 0);
				map.put(key, json);
			}
			if (!json.has("untranslatedChars")) {
				json.put("untranslatedChars", 0);
				map.put(key, json);
			}
			if (!json.has("confirmedSegments")) {
				json.put("confirmedSegments", 0);
				map.put(key, json);
			}
			if (!json.has("locked")) {
				json.put("locked", 0);
				map.put(key, json);
			}
			if (!json.has("lockedChars")) {
				json.put("lockedChars", 0);
				map.put(key, json);
			}
			if (!json.has("lockedSegments")) {
				json.put("lockedSegments", 0);
				map.put(key, json);
			}
		}

		String css = "";
		try (InputStream is = XliffStore.class.getResourceAsStream("styles.css")) {
			StringBuffer sb = new StringBuffer();
			try (InputStreamReader reader = new InputStreamReader(is, StandardCharsets.UTF_8)) {
				try (BufferedReader br = new BufferedReader(reader)) {
					String line;
					while ((line = br.readLine()) != null) {
						if (!sb.isEmpty()) {
							sb.append("\n");
						}
						sb.append(line);
					}
				}
			}
			css = sb.toString();
		}

		File log = new File(file.getAbsolutePath() + ".log.html");
		try (FileOutputStream out = new FileOutputStream(log)) {

			writeString(out, "<!DOCTYPE html>\n");
			writeString(out, "<html>\n");
			writeString(out, "<head>\n");
			writeString(out, "  <meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\" />\n");
			writeString(out, "  <title>Project Statistics</title>\n");
			writeString(out, "  <style type=\"text/css\">\n");
			writeString(out, css);
			writeString(out, "  </style>\n");
			writeString(out, "</head>\n");
			writeString(out, "<body>\n");

			writeString(out, "<h1>" + XMLUtils.cleanText(projectName) + "</h1>\n");

			Set<String> files = new TreeSet<>();
			files.addAll(filesMap.keySet());
			it = files.iterator();
			int count = 1;

			int projectNew = 0;
			int project100 = 0;
			int project95 = 0;
			int project85 = 0;
			int project75 = 0;
			int project50 = 0;
			int projectIntRep = 0;
			int projectExtRep = 0;

			writeString(out, "<hr>\n");
			writeString(out, "<h2>" + Messages.getString("XliffStore.6") + "</h2>\n");
			writeString(out, "<h3>" + Messages.getString("XliffStore.7") + "</h3>\n");

			writeString(out, "<table>\n");
			writeString(out, "<tr><th>#</th><th>" + Messages.getString("XliffStore.8") + "</th><th>"
					+ Messages.getString("XliffStore.9")
					+ "</th><th>100%</th><th>95%&nbsp;-&nbsp;99%</th><th>85%&nbsp;-&nbsp;94%</th><th>75%&nbsp;-&nbsp;84%</th><th>50%&nbsp;-&nbsp;74%</th><th>"
					+ Messages.getString("XliffStore.10") + "</th><th>" + Messages.getString("XliffStore.11")
					+ "</th><th>" + Messages.getString("XliffStore.12") + "</th></tr>\n");
			while (it.hasNext()) {
				String fileName = it.next();
				Set<String> set = filesMap.get(fileName);
				Iterator<String> st = set.iterator();

				int newSegments = 0;
				int intRep = 0;
				int extRep = 0;
				int segments100 = 0;
				int segments95 = 0;
				int segments85 = 0;
				int segments75 = 0;
				int segments50 = 0;

				while (st.hasNext()) {
					String key = st.next();
					JSONObject json = statusMap.get(key);
					newSegments += json.getInt("newSegments");
					intRep += json.getInt("intRepSegment");
					extRep += json.getInt("extRepSegment");
					segments100 += json.getInt("100Segments");
					segments95 += json.getInt("95Segments");
					segments85 += json.getInt("85Segments");
					segments75 += json.getInt("75Segments");
					segments50 += json.getInt("50Segments");
				}
				writeString(out, "<tr>");
				writeString(out, "<td class='center'>" + count++ + "</td>");
				writeString(out, "<td class='left'>" + XMLUtils.cleanText(fileName) + "</td>");
				writeString(out, "<td>" + newSegments + "</td>");
				writeString(out, "<td>" + segments100 + "</td>");
				writeString(out, "<td>" + segments95 + "</td>");
				writeString(out, "<td>" + segments85 + "</td>");
				writeString(out, "<td>" + segments75 + "</td>");
				writeString(out, "<td>" + segments50 + "</td>");
				writeString(out, "<td>" + intRep + "</td>");
				writeString(out, "<td>" + extRep + "</td>");
				writeString(out, "<td class='total'>" + (newSegments + segments100 + segments95 + segments85
						+ segments75 + segments50 + intRep + extRep) + "</td>");
				writeString(out, "</tr>\n");
				projectNew += newSegments;
				project100 += segments100;
				project95 += segments95;
				project85 += segments85;
				project75 += segments75;
				project50 += segments50;
				projectIntRep += intRep;
				projectExtRep += extRep;
			}
			writeString(out, "<tr>");
			writeString(out, "<td class='total'>&nbsp;</td>");
			writeString(out, "<td class='center total'>" + Messages.getString("XliffStore.12") + "</td>");
			writeString(out, "<td class='total'>" + projectNew + "</td>");
			writeString(out, "<td class='total'>" + project100 + "</td>");
			writeString(out, "<td class='total'>" + project95 + "</td>");
			writeString(out, "<td class='total'>" + project85 + "</td>");
			writeString(out, "<td class='total'>" + project75 + "</td>");
			writeString(out, "<td class='total'>" + project50 + "</td>");
			writeString(out, "<td class='total'>" + projectIntRep + "</td>");
			writeString(out, "<td class='total'>" + projectExtRep + "</td>");
			writeString(out, "<td class='total'>" + (projectNew + project100 + project95 + project85 + project75
					+ project50 + projectIntRep + projectExtRep) + "</td>");
			writeString(out, "</tr>\n");
			writeString(out, "</table>\n");

			it = files.iterator();
			count = 1;

			projectNew = 0;
			project100 = 0;
			project95 = 0;
			project85 = 0;
			project75 = 0;
			project50 = 0;
			projectIntRep = 0;
			projectExtRep = 0;
			int projectTags = 0;
			writeString(out, "<h3>" + Messages.getString("XliffStore.13") + "</h3>\n");

			writeString(out, "<table>\n");
			writeString(out, "<tr><th>#</th><th>" + Messages.getString("XliffStore.8") + "</th><th>"
					+ Messages.getString("XliffStore.9")
					+ "</th><th>100%</th><th>95%&nbsp;-&nbsp;99%</th><th>85%&nbsp;-&nbsp;94%</th><th>75%&nbsp;-&nbsp;84%</th><th>50%&nbsp;-&nbsp;74%</th><th>"
					+ "Int.&nbsp;Rep." + "</th><th>" + Messages.getString("XliffStore.16") + "</th><th>"
					+ Messages.getString("XliffStore.17") + "</th><th>" + Messages.getString("XliffStore.12")
					+ "</th></tr>\n");
			while (it.hasNext()) {
				String fileName = it.next();
				Set<String> set = filesMap.get(fileName);
				Iterator<String> st = set.iterator();

				int newSegments = 0;
				int intRep = 0;
				int extRep = 0;
				int segments100 = 0;
				int segments95 = 0;
				int segments85 = 0;
				int segments75 = 0;
				int segments50 = 0;
				int tags = 0;

				while (st.hasNext()) {
					String key = st.next();
					JSONObject json = statusMap.get(key);
					newSegments += json.getInt("newWords");
					intRep += json.getInt("intRep");
					extRep += json.getInt("extRep");
					segments100 += json.getInt("100Words");
					segments95 += json.getInt("95Words");
					segments85 += json.getInt("85Words");
					segments75 += json.getInt("75Words");
					segments50 += json.getInt("50Words");
					tags += json.getInt("tags");
				}
				writeString(out, "<tr>");
				writeString(out, "<td class='center'>" + count++ + "</td>");
				writeString(out, "<td class='left'>" + XMLUtils.cleanText(fileName) + "</td>");
				writeString(out, "<td>" + newSegments + "</td>");
				writeString(out, "<td>" + segments100 + "</td>");
				writeString(out, "<td>" + segments95 + "</td>");
				writeString(out, "<td>" + segments85 + "</td>");
				writeString(out, "<td>" + segments75 + "</td>");
				writeString(out, "<td>" + segments50 + "</td>");
				writeString(out, "<td>" + intRep + "</td>");
				writeString(out, "<td>" + extRep + "</td>");
				writeString(out, "<td>" + tags + "</td>");
				writeString(out, "<td class='total'>" + (newSegments + segments100 + segments95 + segments85
						+ segments75 + segments50 + intRep + extRep) + "</td>");
				writeString(out, "</tr>\n");
				projectNew += newSegments;
				project100 += segments100;
				project95 += segments95;
				project85 += segments85;
				project75 += segments75;
				project50 += segments50;
				projectIntRep += intRep;
				projectExtRep += extRep;
				projectTags += tags;
			}
			writeString(out, "<tr>");
			writeString(out, "<td class='total'>&nbsp;</td>");
			writeString(out, "<td class='center total'>" + Messages.getString("XliffStore.12") + "</td>");
			writeString(out, "<td class='total'>" + projectNew + "</td>");
			writeString(out, "<td class='total'>" + project100 + "</td>");
			writeString(out, "<td class='total'>" + project95 + "</td>");
			writeString(out, "<td class='total'>" + project85 + "</td>");
			writeString(out, "<td class='total'>" + project75 + "</td>");
			writeString(out, "<td class='total'>" + project50 + "</td>");
			writeString(out, "<td class='total'>" + projectIntRep + "</td>");
			writeString(out, "<td class='total'>" + projectExtRep + "</td>");
			writeString(out, "<td class='total'>" + projectTags + "</td>");
			writeString(out, "<td class='total'>" + (projectNew + project100 + project95 + project85 + project75
					+ project50 + projectIntRep + projectExtRep) + "</td>");
			writeString(out, "</tr>\n");
			writeString(out, "</table>\n");

			writeString(out,
					"<p><b>" + Messages.getString("XliffStore.18") + "</b> " + Messages.getString("XliffStore.19")
							+ "<br><b>" + Messages.getString("XliffStore.20") + "</b> "
							+ Messages.getString("XliffStore.21")
							+ "</p>");

			it = files.iterator();
			count = 1;
			int projectSegments = 0;
			int projectTranslatedSegments = 0;
			int projectUntranslatedSegments = 0;
			int projectConfirmedSegments = 0;

			writeString(out, "<hr>\n");
			writeString(out, "<h2>" + Messages.getString("XliffStore.22") + "</h2>\n");
			writeString(out, "<h3>" + Messages.getString("XliffStore.7") + "</h3>\n");

			writeString(out, "<table>\n");
			writeString(out,
					"<tr><th>#</th><th>" + Messages.getString("XliffStore.8") + "</th><th>"
							+ Messages.getString("XliffStore.25") + "</th><th>" + Messages.getString("XliffStore.26")
							+ "</th><th>" + Messages.getString("XliffStore.27") + "</th><th>"
							+ Messages.getString("XliffStore.28") + "</th><th>" + Messages.getString("XliffStore.12")
							+ "</th></tr>\n");
			while (it.hasNext()) {
				String fileName = it.next();
				Set<String> set = filesMap.get(fileName);
				Iterator<String> st = set.iterator();
				int fileSegments = 0;
				int fileTranslated = 0;
				int fileUntranslated = 0;
				int fileConfirmed = 0;
				while (st.hasNext()) {
					String key = st.next();
					JSONObject json = map.get(key);
					fileSegments += json.getInt("segments");
					fileTranslated += json.getInt("translatedSegments");
					fileUntranslated += json.getInt("untranslatedSegments");
					fileConfirmed += json.getInt("confirmedSegments");
				}
				writeString(out, "<tr>");
				writeString(out, "<td class='center'>" + count++ + "</td>");
				writeString(out, "<td class='left'>" + XMLUtils.cleanText(fileName) + "</td>");
				writeString(out, "<td>" + fileUntranslated + "</td>");
				writeString(out, "<td>" + fileTranslated + "</td>");
				writeString(out, "<td>" + (fileSegments - fileConfirmed) + "</td>");
				writeString(out, "<td>" + fileConfirmed + "</td>");
				writeString(out, "<td class='total'>" + fileSegments + "</td>");
				writeString(out, "</tr>\n");
				projectSegments += fileSegments;
				projectTranslatedSegments += fileTranslated;
				projectUntranslatedSegments += fileUntranslated;
				projectConfirmedSegments += fileConfirmed;

			}
			writeString(out, "<tr>");
			writeString(out, "<td class='total'>&nbsp;</td>");
			writeString(out, "<td class='center total'>Total</td>");
			writeString(out, "<td class='total'>" + projectUntranslatedSegments + "</td>");
			writeString(out, "<td class='total'>" + projectTranslatedSegments + "</td>");
			writeString(out, "<td class='total'>" + (projectSegments - projectConfirmedSegments) + "</td>");
			writeString(out, "<td class='total'>" + projectConfirmedSegments + "</td>");
			writeString(out, "<td class='total'>" + projectSegments + "</td>");
			writeString(out, "</tr>\n");
			writeString(out, "</table>\n");

			writeString(out, "<h3>" + Messages.getString("XliffStore.29") + "</h3>\n");

			count = 1;
			int projectWords = 0;
			int projectTranslated = 0;
			int projectUntranslated = 0;
			int projectConfirmed = 0;

			writeString(out, "<table>\n");
			writeString(out,
					"<tr><th>#</th><th>" + Messages.getString("XliffStore.8") + "</th><th>"
							+ Messages.getString("XliffStore.25") + "</th><th>" + Messages.getString("XliffStore.26")
							+ "</th><th>" + Messages.getString("XliffStore.27") + "</th><th>"
							+ Messages.getString("XliffStore.28") + "</th><th>" + Messages.getString("XliffStore.12")
							+ "</th></tr>\n");
			it = files.iterator();
			while (it.hasNext()) {
				String fileName = it.next();
				Set<String> set = filesMap.get(fileName);
				Iterator<String> st = set.iterator();
				int fileWords = 0;
				int fileUntranslated = 0;
				int fileTranslated = 0;
				int fileConfirmed = 0;
				while (st.hasNext()) {
					String key = st.next();
					JSONObject json = map.get(key);
					fileWords += json.getInt("words");
					fileTranslated += json.getInt("translated");
					fileUntranslated += json.getInt("untranslated");
					fileConfirmed += json.getInt("confirmed");
				}
				writeString(out, "<tr>");
				writeString(out, "<td class='center'>" + count++ + "</td>");
				writeString(out, "<td class='left'>" + XMLUtils.cleanText(fileName) + "</td>");
				writeString(out, "<td>" + fileUntranslated + "</td>");
				writeString(out, "<td>" + fileTranslated + "</td>");
				writeString(out, "<td>" + (fileWords - fileConfirmed) + "</td>");
				writeString(out, "<td>" + fileConfirmed + "</td>");
				writeString(out, "<td class='total'>" + fileWords + "</td>");
				writeString(out, "</tr>\n");
				projectWords += fileWords;
				projectTranslated += fileTranslated;
				projectUntranslated += fileUntranslated;
				projectConfirmed += fileConfirmed;
			}
			writeString(out, "<tr>");
			writeString(out, "<td class='total'>&nbsp;</td>");
			writeString(out, "<td class='center total'>Total</td>");
			writeString(out, "<td class='total'>" + projectUntranslated + "</td>");
			writeString(out, "<td class='total'>" + projectTranslated + "</td>");
			writeString(out, "<td class='total'>" + (projectWords - projectConfirmed) + "</td>");
			writeString(out, "<td class='total'>" + projectConfirmed + "</td>");
			writeString(out, "<td class='total'>" + projectWords + "</td>");
			writeString(out, "</tr>\n");
			writeString(out, "</table>\n");

			writeString(out, "<h3>" + Messages.getString("XliffStore.46") + "</h3>\n");

			count = 1;
			projectWords = 0;
			projectTranslated = 0;
			projectUntranslated = 0;
			projectConfirmed = 0;

			writeString(out, "<table>\n");
			writeString(out,
					"<tr><th>#</th><th>" + Messages.getString("XliffStore.8") + "</th><th>"
							+ Messages.getString("XliffStore.25") + "</th><th>" + Messages.getString("XliffStore.26")
							+ "</th><th>" + Messages.getString("XliffStore.27") + "</th><th>"
							+ Messages.getString("XliffStore.28") + "</th><th>" + Messages.getString("XliffStore.12")
							+ "</th></tr>\n");
			it = files.iterator();
			while (it.hasNext()) {
				String fileName = it.next();
				Set<String> set = filesMap.get(fileName);
				Iterator<String> st = set.iterator();
				int fileChars = 0;
				int fileUntranslated = 0;
				int fileTranslated = 0;
				int fileConfirmed = 0;
				while (st.hasNext()) {
					String key = st.next();
					JSONObject json = map.get(key);
					fileChars += json.getInt("chars");
					fileTranslated += json.getInt("translatedChars");
					fileUntranslated += json.getInt("untranslatedChars");
					fileConfirmed += json.getInt("confirmedChars");
				}
				writeString(out, "<tr>");
				writeString(out, "<td class='center'>" + count++ + "</td>");
				writeString(out, "<td class='left'>" + XMLUtils.cleanText(fileName) + "</td>");
				writeString(out, "<td>" + fileUntranslated + "</td>");
				writeString(out, "<td>" + fileTranslated + "</td>");
				writeString(out, "<td>" + (fileChars - fileConfirmed) + "</td>");
				writeString(out, "<td>" + fileConfirmed + "</td>");
				writeString(out, "<td class='total'>" + fileChars + "</td>");
				writeString(out, "</tr>\n");
				projectWords += fileChars;
				projectTranslated += fileTranslated;
				projectUntranslated += fileUntranslated;
				projectConfirmed += fileConfirmed;
			}
			writeString(out, "<tr>");
			writeString(out, "<td class='total'>&nbsp;</td>");
			writeString(out, "<td class='center total'>Total</td>");
			writeString(out, "<td class='total'>" + projectUntranslated + "</td>");
			writeString(out, "<td class='total'>" + projectTranslated + "</td>");
			writeString(out, "<td class='total'>" + (projectWords - projectConfirmed) + "</td>");
			writeString(out, "<td class='total'>" + projectConfirmed + "</td>");
			writeString(out, "<td class='total'>" + projectWords + "</td>");
			writeString(out, "</tr>\n");
			writeString(out, "</table>\n");

			SvgStats svgStats = new SvgStats();
			svgStats.analyse(xliffFile, catalog);

			Element matchesSvg = svgStats.generateMatchesSvg();
			Element translatedSvg = svgStats.generateTranslatedSvg();
			Element approvedSvg = svgStats.generateApprovedSvg();

			writeString(out, "<h3>" + Messages.getString("XliffStore.35") + "</h3>\n");
			writeString(out, translatedSvg.toString());
			writeString(out, "\n<br>\n");

			writeString(out, "<h3>" + Messages.getString("XliffStore.36") + "</h3>\n");
			writeString(out, approvedSvg.toString());
			writeString(out, "\n<br>\n");

			writeString(out, "<h3>" + Messages.getString("XliffStore.37") + "</h3>\n");
			writeString(out, matchesSvg.toString());
			writeString(out, "\n<br>\n");

			writeString(out, "</body>\n");
			writeString(out, "</html>\n");
		}
		return log.getAbsolutePath();
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
			queryBuilder.append(" targetText REGEXP '");
			queryBuilder.append(searchText);
			queryBuilder.append("' ");
		} else {
			queryBuilder.append(caseSensitive ? "targetText GLOB '*" : "targetText LIKE '%");
			queryBuilder.append(escape(searchText));
			queryBuilder.append(caseSensitive ? "*" : "%'");
		}
		queryBuilder.append(" AND translate='Y'");
		try (ResultSet rs = stmt.executeQuery(queryBuilder.toString())) {
			while (rs.next()) {
				String file = rs.getString(1);
				String unit = rs.getString(2);
				String segment = rs.getString(3);
				String tgt = rs.getString(4);

				Element target = XliffUtils.buildElement(tgt);
				target = replaceText(target, searchText, replaceText, isRegExp);
				String pureTarget = XliffUtils.pureText(target);
				updateTarget(file, unit, segment, target, pureTarget, false);
			}
		}
	}

	private String escape(String string) {
		return string.replace("'", "''").replace("%", "\\%").replace("_", "\\_");
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

	public void applyMtAll(String projectId)
			throws SQLException, SAXException, IOException, ParserConfigurationException {
		File projectFolder = new File(TmsServer.getProjectsFolder(), projectId);
		try (FileOutputStream out = new FileOutputStream(new File(projectFolder, "applymt.xlf"))) {
			String oldFile = "";
			String oldUnit = "";
			out.write(("<xliff srcLang=\"" + this.srcLang + "\" tgtLang=\"" + this.tgtLang + "\">\n")
					.getBytes(StandardCharsets.UTF_8));
			String sql = "SELECT file, unitId, segId, source FROM segments WHERE type='S' AND (state='initial' OR targetText='') AND translate='Y' ";
			try (ResultSet rs = stmt.executeQuery(sql)) {
				while (rs.next()) {
					String file = rs.getString(1);
					String unit = rs.getString(2);
					String segment = rs.getString(3);
					String sourceText = rs.getString(4);

					Element matchSource = XliffUtils.buildElement(sourceText);

					if (!oldFile.equals(file)) {
						if (!oldFile.isEmpty()) {
							out.write("</file>\n".getBytes(StandardCharsets.UTF_8));
						}
						oldFile = file;
						out.write(("<file id=\"" + file + "\">\n").getBytes(StandardCharsets.UTF_8));
					}
					if (!oldUnit.equals(unit)) {
						if (!oldUnit.isEmpty()) {
							out.write("</unit>\n".getBytes(StandardCharsets.UTF_8));
						}
						oldUnit = unit;
						out.write(("<unit id=\"" + unit + "\">\n").getBytes(StandardCharsets.UTF_8));
					}
					Element seg = new Element("segment");
					seg.setAttribute("id", segment);
					seg.addContent(matchSource);
					out.write(seg.toString().getBytes(StandardCharsets.UTF_8));
					out.write("\n".getBytes(StandardCharsets.UTF_8));
				}
				out.write("</unit>\n".getBytes(StandardCharsets.UTF_8));
				out.write("</file>\n".getBytes(StandardCharsets.UTF_8));
				out.write(("</xliff>").getBytes(StandardCharsets.UTF_8));
			}
		}
	}

	public void acceptAllMT() throws SQLException, SAXException, IOException, ParserConfigurationException {
		String sql = "SELECT file, unitId, segId, source FROM segments WHERE type='S' AND (state='initial' OR targetText='') AND translate='Y' ";
		try (ResultSet rs = stmt.executeQuery(sql)) {
			try (PreparedStatement mtMatches = conn.prepareStatement(
					"SELECT target FROM matches WHERE file=? AND unitId=? AND segId=? AND type='mt' LIMIT 1")) {
				while (rs.next()) {
					String file = rs.getString(1);
					String unit = rs.getString(2);
					String segment = rs.getString(3);
					String src = rs.getString(4);

					mtMatches.setString(1, file);
					mtMatches.setString(2, unit);
					mtMatches.setString(3, segment);
					try (ResultSet rs2 = mtMatches.executeQuery()) {
						while (rs2.next()) {
							Element source = XliffUtils.buildElement(src);
							String tgt = rs2.getString(1);
							Element target = XliffUtils.buildElement(tgt);
							if (source.hasAttribute("xml:space")) {
								target.setAttribute("xml:space", source.getAttributeValue("xml:space"));
							}
							String pureTarget = XliffUtils.pureText(target);
							updateTarget(file, unit, segment, target, pureTarget, false);
						}
					}
				}
			}
		}
	}

	public void removeMatches(String type) throws SQLException {
		try (PreparedStatement prep = conn.prepareStatement("DELETE FROM matches WHERE type=?")) {
			prep.setString(1, type);
			prep.execute();
		}
		conn.commit();
	}

	public JSONArray getTerms(JSONObject json) throws SQLException {
		JSONArray result = new JSONArray();
		getTerms.setString(1, json.getString("file"));
		getTerms.setString(2, json.getString("unit"));
		getTerms.setString(3, json.getString("segment"));
		try (ResultSet rs = getTerms.executeQuery()) {
			while (rs.next()) {
				JSONObject obj = new JSONObject();
				obj.put("termId", rs.getString(1));
				obj.put("origin", rs.getString(2));
				obj.put("source", rs.getString(3));
				obj.put("target", rs.getString(4));
				obj.put("srcLang", srcLang);
				obj.put("tgtLang", tgtLang);
				result.put(obj);
			}
		}
		return sortTerms(result);
	}

	public JSONArray getSegmentTerms(JSONObject json)
			throws SQLException, IOException, SAXException, ParserConfigurationException, URISyntaxException {
		JSONArray result = new JSONArray();

		getPreferences();
		int similarity = fuzzyTermSearches ? 70 : 100;

		String sourceText = "";
		getSource.setString(1, json.getString("file"));
		getSource.setString(2, json.getString("unit"));
		getSource.setString(3, json.getString("segment"));
		try (ResultSet rs = getSource.executeQuery()) {
			while (rs.next()) {
				sourceText = rs.getString(2);
			}
		}
		Language sourceLanguage = LanguageUtils.getLanguage(srcLang);
		List<String> words = sourceLanguage.isCJK() ? cjkWordList(sourceText, NGrams.TERM_SEPARATORS)
				: NGrams.buildWordList(sourceText, NGrams.TERM_SEPARATORS);

		List<Term> terms = new Vector<>();

		String glossary = json.getString("glossary");
		GlossariesHandler.openGlossary(glossary);
		String glossaryName = GlossariesHandler.getGlossaryName(glossary);
		ITmEngine engine = GlossariesHandler.getEngine(glossary);
		Map<String, String> visited = new Hashtable<>();
		for (int i = 0; i < words.size(); i++) {
			StringBuilder termBuilder = new StringBuilder();
			for (int length = 0; length < MAXTERMLENGTH; length++) {
				if (i + length < words.size()) {
					if (!sourceLanguage.isCJK()) {
						termBuilder.append(' ');
					}
					termBuilder.append(words.get(i + length));
					String term = termBuilder.toString().trim();
					if (!visited.containsKey(term)) {
						visited.put(term, "");
						List<Element> res = engine.searchAll(term, srcLang, similarity, caseSensitiveTermSearches);
						List<Term> array = parseMatches(res, glossaryName);
						for (int h = 0; h < array.size(); h++) {
							Term candidate = array.get(h);
							if (!terms.contains(candidate)) {
								terms.add(candidate);
								result.put(candidate.toJSON());
								saveTerm(json.getString("file"), json.getString("unit"), json.getString("segment"),
										glossaryName, candidate.getSource(), candidate.getTarget());
							}
						}
					}
				}
			}
		}
		GlossariesHandler.closeGlossary(glossary);
		return sortTerms(result);
	}

	private JSONArray sortTerms(JSONArray array) {
		if (array.length() == 0) {
			return array;
		}
		JSONArray result = new JSONArray();
		List<Term> terms = new Vector<>();
		for (int i = 0; i < array.length(); i++) {
			terms.add(new Term(array.getJSONObject(i)));
		}
		// sort ignoring term length
		Collections.sort(terms, (Term o1, Term o2) -> o1.getSource().compareToIgnoreCase(o2.getSource()));
		Iterator<Term> it = terms.iterator();
		while (it.hasNext()) {
			Term term = it.next();
			result.put(term.toJSON());
		}
		return result;
	}

	public int getProjectTerms(String glossary)
			throws IOException, SQLException, SAXException, ParserConfigurationException, URISyntaxException {
		getPreferences();
		Language sourceLanguage = LanguageUtils.getLanguage(srcLang);
		int similarity = fuzzyTermSearches ? 70 : 100;
		GlossariesHandler.openGlossary(glossary);
		String glossaryName = GlossariesHandler.getGlossaryName(glossary);
		ITmEngine engine = GlossariesHandler.getEngine(glossary);
		int count = 0;
		try (PreparedStatement segIterator = conn.prepareStatement(
				"SELECT file, unitId, segId, sourceText FROM segments WHERE type='S' AND translate='Y' ")) {
			try (ResultSet set = segIterator.executeQuery()) {
				while (set.next()) {
					String file = set.getString(1);
					String unit = set.getString(2);
					String segment = set.getString(3);
					String sourceText = set.getString(4);
					List<String> words = sourceLanguage.isCJK() ? cjkWordList(sourceText, NGrams.TERM_SEPARATORS)
							: NGrams.buildWordList(sourceText, NGrams.TERM_SEPARATORS);
					Map<String, String> visited = new Hashtable<>();
					boolean added = false;
					for (int i = 0; i < words.size(); i++) {
						StringBuilder termBuilder = new StringBuilder();
						for (int length = 0; length < MAXTERMLENGTH; length++) {
							if (i + length < words.size()) {
								if (!sourceLanguage.isCJK()) {
									termBuilder.append(' ');
								}
								termBuilder.append(words.get(i + length));
								String term = termBuilder.toString().trim();
								if (!visited.containsKey(term)) {
									visited.put(term, "");
									List<Element> res = engine.searchAll(term, srcLang, similarity,
											caseSensitiveTermSearches);
									List<Term> array = parseMatches(res, glossaryName);
									for (int h = 0; h < array.size(); h++) {
										Term candidate = array.get(h);
										saveTerm(file, unit, segment, glossaryName, candidate.getSource(),
												candidate.getTarget());
										added = true;
									}
								}
							}
						}
					}
					if (added) {
						count++;
					}
				}
			}
		}
		GlossariesHandler.closeGlossary(glossary);
		return count;
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
			insertTerm.setString(6, source);
			insertTerm.setString(7, target);
			insertTerm.execute();
			conn.commit();
		}
	}

	private List<Term> parseMatches(List<Element> matches, String glossaryName) {
		List<Term> result = new Vector<>();
		for (int i = 0; i < matches.size(); i++) {
			Map<String, String> map = new Hashtable<>();
			Element tu = matches.get(i);
			List<Element> tuvs = tu.getChildren("tuv");
			Iterator<Element> it = tuvs.iterator();
			while (it.hasNext()) {
				Element tuv = it.next();
				map.put(tuv.getAttributeValue("xml:lang"), MemoriesHandler.pureText(tuv.getChild("seg")));
			}
			if (map.containsKey(tgtLang)) {
				Term term = new Term(map.get(srcLang), map.get(tgtLang), srcLang, tgtLang, glossaryName);
				result.add(term);
			}
		}
		return result;
	}

	public void lockSegment(JSONObject json) throws SQLException {
		String sql = "SELECT translate FROM segments WHERE file=? AND unitId=? AND segId=?";
		String segTranslate = "";
		try (PreparedStatement st = conn.prepareStatement(sql)) {
			st.setString(1, json.getString("file"));
			st.setString(2, json.getString("unit"));
			st.setString(3, json.getString("segment"));
			try (ResultSet rs = st.executeQuery()) {
				while (rs.next()) {
					segTranslate = rs.getString(1);
				}
			}
		}
		sql = "UPDATE segments SET translate=? WHERE file=? AND unitId=? AND segId=?";
		try (PreparedStatement st = conn.prepareStatement(sql)) {
			st.setString(1, segTranslate.equals("Y") ? "N" : "Y");
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
					Element source = XliffUtils.buildElement(rs.getString(4));
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

	public JSONObject analyzeSpaces() throws SQLException, IOException, SAXException, ParserConfigurationException {
		getPreferences();
		JSONObject result = new JSONObject();
		JSONArray errors = new JSONArray();
		int idx = 0;
		String sql = "SELECT file, unitId, segId, child, source, target, targetText, translate FROM segments WHERE type='S' ORDER BY file, child ";
		try (ResultSet rs = stmt.executeQuery(sql)) {
			while (rs.next()) {
				idx++;
				boolean segTranslate = rs.getString(8).equals("Y");
				if (!segTranslate) {
					continue;
				}
				String targetText = rs.getString(7);
				if (targetText.isEmpty()) {
					continue;
				}
				String source = rs.getString(5);
				String target = rs.getString(6);
				String[] sourceSpaces = getSpaces(XliffUtils.buildElement(source));
				String[] targetSpaces = getSpaces(XliffUtils.buildElement(target));
				boolean initial = !sourceSpaces[0].equals(targetSpaces[0]);
				boolean trailing = !sourceSpaces[1].equals(targetSpaces[1]);
				if (initial || trailing) {
					JSONObject error = new JSONObject();
					error.put("file", rs.getString(1));
					error.put("unit", rs.getString(2));
					error.put("segment", rs.getString(3));
					String type = "";
					if (initial) {
						type = Messages.getString("XliffStore.41");
					}
					if (trailing) {
						type = Messages.getString("XliffStore.40");
					}
					if (initial && trailing) {
						type = Messages.getString("XliffStore.39");
					}
					error.put("type", type);
					error.put("index", idx);
					errors.put(error);
				}
			}
		}
		result.put("errors", errors);
		return result;
	}

	public void fixSpaces() throws SQLException, IOException, SAXException, ParserConfigurationException {
		getPreferences();
		String sql = "SELECT file, unitId, segId, child, source, target, targetText, translate FROM segments WHERE type='S' ORDER BY file, child ";
		try (ResultSet rs = stmt.executeQuery(sql)) {
			sql = "UPDATE segments SET target=?, targetText=?, state=? WHERE file=? AND unitId=? AND segId=?";
			try (PreparedStatement fixStmt = conn.prepareStatement(sql)) {
				while (rs.next()) {
					boolean segTranslate = rs.getString(8).equals("Y");
					if (!segTranslate) {
						continue;
					}
					String targetText = rs.getString(7);
					if (targetText.isEmpty()) {
						continue;
					}
					String source = rs.getString(5);
					String target = rs.getString(6);
					Element src = XliffUtils.buildElement(source);
					Element tgt = XliffUtils.buildElement(target);
					String[] sourceSpaces = getSpaces(src);
					String[] targetSpaces = getSpaces(tgt);
					boolean initial = !sourceSpaces[0].equals(targetSpaces[0]);
					boolean trailing = !sourceSpaces[1].equals(targetSpaces[1]);
					if (initial || trailing) {
						if (initial) {
							try {
								tgt = fixInitialSpaces(src, tgt);
							} catch (Exception e) {
								System.out.println(src.toString());
								System.out.println(tgt.toString());
							}
						}
						if (trailing) {
							tgt = fixTrailingSpaces(src, tgt);
						}
						targetText = XliffUtils.pureText(tgt);
						fixStmt.setString(1, tgt.toString());
						fixStmt.setString(2, targetText);
						fixStmt.setString(3, targetText.isEmpty() ? Constants.INITIAL : Constants.TRANSLATED);
						fixStmt.setString(4, rs.getString(1));
						fixStmt.setString(5, rs.getString(2));
						fixStmt.setString(6, rs.getString(3));
						fixStmt.executeUpdate();
						conn.commit();
					}
				}
			}
		}
	}

	private Element fixInitialSpaces(Element source, Element target) {
		List<XMLNode> srcContent = source.getContent();
		boolean srcStartsWithTag = srcContent.get(0).getNodeType() == XMLNode.ELEMENT_NODE;
		String initial = "";
		for (int i = 0; i < srcContent.size(); i++) {
			XMLNode node = srcContent.get(i);
			if (node.getNodeType() == XMLNode.TEXT_NODE) {
				String text = ((TextNode) node).getText();
				for (int j = 0; j < text.length(); j++) {
					char c = text.charAt(j);
					if (!Character.isWhitespace(c)) {
						break;
					}
					initial += c;
				}
				break;
			}
		}
		List<XMLNode> tgtContent = target.getContent();
		boolean tgtStartsWithTag = tgtContent.get(0).getNodeType() == XMLNode.ELEMENT_NODE;
		XMLNode firstNode = null;
		String newText = "";
		for (int i = 0; i < tgtContent.size(); i++) {
			XMLNode node = tgtContent.get(i);
			if (node.getNodeType() == XMLNode.TEXT_NODE) {
				firstNode = node;
				String oldText = ((TextNode) node).getText();
				int j = 0;
				for (; j < oldText.length(); j++) {
					char c = oldText.charAt(j);
					if (!Character.isWhitespace(c)) {
						break;
					}
				}
				newText = oldText.substring(j);
				node = new TextNode(newText);
				tgtContent.set(i, node);
				break;
			}
		}
		int idx = tgtContent.indexOf(firstNode);
		if (!srcStartsWithTag && tgtStartsWithTag) {
			// source starts with text and target starts with tag
			// move spaces before tag
			TextNode node = new TextNode(initial);
			tgtContent.add(0, node);
		} else {
			TextNode node = (TextNode) tgtContent.get(idx);
			((TextNode) node).setText(initial + newText);
			tgtContent.set(idx, node);
		}
		target.setContent(tgtContent);
		return target;
	}

	private Element fixTrailingSpaces(Element source, Element target) {
		List<XMLNode> srcContent = source.getContent();
		boolean srcEndsWithTag = srcContent.get(srcContent.size() - 1).getNodeType() == XMLNode.ELEMENT_NODE;
		String ending = "";
		for (int i = srcContent.size() - 1; i >= 0; i--) {
			XMLNode node = srcContent.get(i);
			if (node.getNodeType() == XMLNode.TEXT_NODE) {
				String text = ((TextNode) node).getText();
				for (int j = text.length() - 1; j >= 0; j--) {
					char c = text.charAt(j);
					if (!Character.isWhitespace(c)) {
						break;
					}
					ending = c + ending;
				}
				break;
			}
		}
		List<XMLNode> tgtContent = target.getContent();
		boolean tgtEndsWithTag = tgtContent.get(tgtContent.size() - 1).getNodeType() == XMLNode.ELEMENT_NODE;
		String newText = "";
		int h = tgtContent.size() - 1;
		XMLNode lastNode = null;
		for (; h >= 0; h--) {
			XMLNode node = tgtContent.get(h);
			if (node.getNodeType() == XMLNode.TEXT_NODE) {
				lastNode = node;
				String oldText = ((TextNode) node).getText();
				int j = oldText.length() - 1;
				for (; j >= 0; j--) {
					char c = oldText.charAt(j);
					if (!Character.isWhitespace(c)) {
						break;
					}
				}
				newText = oldText.substring(0, j + 1);
				break;
			}
		}
		int idx = tgtContent.indexOf(lastNode);
		if (!srcEndsWithTag && tgtEndsWithTag) {
			// source ends with text and target ends with tag
			// move spaces behing tag
			lastNode = tgtContent.get(idx);
			((TextNode) lastNode).setText(newText);
			tgtContent.set(idx, lastNode);
			TextNode node = new TextNode(ending);
			tgtContent.add(node);
		} else {
			lastNode = tgtContent.get(idx);
			((TextNode) lastNode).setText(newText + ending);
			tgtContent.set(idx, lastNode);
		}
		target.setContent(tgtContent);
		return target;
	}

	private String[] getSpaces(Element source) {
		List<XMLNode> srcContent = source.getContent();
		String initial = "";
		boolean textFound = false;
		for (int i = 0; i < srcContent.size(); i++) {
			XMLNode node = srcContent.get(i);
			if (node.getNodeType() == XMLNode.TEXT_NODE && !textFound) {
				String text = ((TextNode) node).getText();
				for (int j = 0; j < text.length(); j++) {
					char c = text.charAt(j);
					if (!Character.isWhitespace(c)) {
						textFound = true;
						break;
					}
					initial += c;
				}
				break;
			}
		}
		String ending = "";
		textFound = false;
		for (int i = srcContent.size() - 1; i >= 0; i--) {
			XMLNode node = srcContent.get(i);
			if (node.getNodeType() == XMLNode.TEXT_NODE && !textFound) {
				String text = ((TextNode) node).getText();
				for (int j = text.length() - 1; j >= 0; j--) {
					char c = text.charAt(j);
					if (!Character.isWhitespace(c)) {
						textFound = true;
						break;
					}
					ending = c + ending;
				}
				break;
			}
		}
		return new String[] { initial, ending };
	}

	public JSONObject analyzeTags() throws SQLException, SAXException, IOException, ParserConfigurationException {
		getPreferences();
		JSONObject result = new JSONObject();
		JSONArray errors = new JSONArray();
		int idx = 0;
		String sql = "SELECT file, unitId, segId, child, source, target, state, translate FROM segments WHERE type='S' ORDER BY file, child ";
		try (ResultSet rs = stmt.executeQuery(sql)) {
			while (rs.next()) {
				idx++;
				boolean segTranslate = rs.getString(8).equals("Y");
				String segState = rs.getString(7);
				if (!segTranslate || Constants.INITIAL.equals(segState)) {
					continue;
				}
				String sourceText = rs.getString(5);
				Element source = XliffUtils.buildElement(sourceText);
				String targetText = rs.getString(6);
				Element target = XliffUtils.buildElement(targetText);

				List<String> sourceTags = tagsList(source);
				List<String> targetTags = tagsList(target);
				if (sourceTags.size() > targetTags.size()) {
					JSONObject error = new JSONObject();
					error.put("file", rs.getString(1));
					error.put("unit", rs.getString(2));
					error.put("segment", rs.getString(3));
					error.put("type", Messages.getString("XliffStore.38"));
					error.put("index", idx);
					errors.put(error);
					continue;
				}
				if (sourceTags.size() < targetTags.size()) {
					JSONObject error = new JSONObject();
					error.put("file", rs.getString(1));
					error.put("unit", rs.getString(2));
					error.put("segment", rs.getString(3));
					error.put("type", Messages.getString("XliffStore.42"));
					error.put("index", idx);
					errors.put(error);
					continue;
				}
				if (sourceTags.size() == targetTags.size()) {
					boolean skip = false;
					for (int i = 0; i < sourceTags.size(); i++) {
						String srcTag = sourceTags.get(i);
						boolean found = false;
						for (int j = 0; j < targetTags.size(); j++) {
							String tgtTag = targetTags.get(j);
							if (srcTag.equals(tgtTag)) {
								found = true;
								break;
							}
						}
						if (!found) {
							JSONObject error = new JSONObject();
							error.put("file", rs.getString(1));
							error.put("unit", rs.getString(2));
							error.put("segment", rs.getString(3));
							error.put("type", Messages.getString("XliffStore.43"));
							error.put("index", idx);
							errors.put(error);
							skip = true;
						}
					}
					if (!skip) {
						for (int i = 0; i < sourceTags.size(); i++) {
							if (!sourceTags.get(i).equals(targetTags.get(i))) {
								JSONObject error = new JSONObject();
								error.put("file", rs.getString(1));
								error.put("unit", rs.getString(2));
								error.put("segment", rs.getString(3));
								error.put("type", Messages.getString("XliffStore.44"));
								error.put("index", idx);
								errors.put(error);
								break;
							}
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

	public static List<String> cjkWordList(String string, String separator) {
		List<String> result = new Vector<>();
		StringBuilder word = new StringBuilder();
		for (int i = 0; i < string.length(); i++) {
			char c = string.charAt(i);
			if (Character.isIdeographic(c)) {
				if (word.length() != 0) {
					result.add(word.toString());
					word.setLength(0);
				}
				result.add("" + c);
				continue;
			}
			if (separator.indexOf(c) != -1) {
				if (word.length() != 0) {
					result.add(word.toString());
					word.setLength(0);
				}
			} else {
				word.append(c);
			}
		}
		if (word.length() != 0) {
			result.add(word.toString());
		}
		return result;
	}

	public String exportHTML(String title)
			throws SQLException, IOException, SAXException, ParserConfigurationException {
		File output = new File(xliffFile + ".html");
		try (FileOutputStream out = new FileOutputStream(output)) {
			writeString(out, "<html>\n");
			writeString(out, "<head>\n");
			writeString(out, "<meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\" />\n");
			writeString(out, "<title>" + XMLUtils.cleanText(title) + "</title>\n");
			writeString(out, "<style>\n");
			writeString(out, " * {font-family: sans-serif, Helvetica, Arial;}\n");
			writeString(out, " table {border-collapse: collapse; width: 100%; border-top: 1px solid #cfd8dc;}\n");
			writeString(out, " tr {border-bottom: 1px solid #cfd8dc;}\n");
			writeString(out, " td {padding: 4px;}\n");
			writeString(out, " .center {text-align: center;}\n");
			writeString(out, " .orange {border-right: 3px solid #f57c00;}\n");
			writeString(out, " .green {border-right: 3px solid #009688;}\n");
			writeString(out, " .grey {border-right: 3px solid #cfd8dc;}\n");
			writeString(out, " .preserve {white-space: pre-wrap;}\n");
			writeString(out, " .space {background: #7abff7; border-radius: 2px;}\n");
			writeString(out, " .text {width: 49%;}\n");
			writeString(out,
					" .tag {background: #009688; color: #efefef; font-size: 0.8em; padding-left: 4px; padding-right: 4px; border-radius: 2px; vertical-align: text-top;}\n");
			writeString(out,
					" .highlighted {color: #efefef; background-color: #0078d4; padding-left: 2px; padding-right: 2px; font-size: 0.9em; }");
			writeString(out, "</style>\n");
			writeString(out, "</head>\n");
			writeString(out, "<body>\n");
			writeString(out, "<h2>" + XMLUtils.cleanText(title) + "</h2>\n");
			writeString(out, "<table>\n");
			writeString(out, "<tr>\n");
			writeString(out, "<th>#</th>\n");
			writeString(out, "<th>" + LanguageUtils.getLanguage(srcLang).toString() + "</th>\n");
			writeString(out, "<th>" + SVG_BLANK + "</th>\n");
			writeString(out, "<th>" + LanguageUtils.getLanguage(tgtLang).toString() + "</th>\n");
			writeString(out, "</tr>\n");

			String sourceDir = LanguageUtils.isBiDi(srcLang) ? " dir=\"rtl\"" : "";
			String targetDir = LanguageUtils.isBiDi(tgtLang) ? " dir=\"rtl\"" : "";

			try (ResultSet rs = stmt.executeQuery(
					"SELECT source, target, state, space, translate, file, child FROM segments WHERE type='S' ORDER BY file, child")) {
				int count = 1;
				JSONObject tagsData = new JSONObject();
				while (rs.next()) {
					String src = rs.getString(1);
					String tgt = rs.getString(2);
					String segState = rs.getString(3);
					boolean segPreserve = "Y".equals(rs.getString(4));
					boolean locked = "N".equals(rs.getString(5));
					Element source = XliffUtils.buildElement(src);
					Element target = XliffUtils.buildElement(tgt);
					String box = SVG_BLANK;
					String border = "grey";
					if (segState.equals("translated")) {
						border = "orange";
						box = SVG_TRANSLATED;
					}
					if (segState.equals("final")) {
						border = "green";
						box = SVG_FINAL;
					}
					if (locked) {
						box = SVG_LOCK;
					}
					String space = segPreserve ? "preserve" : "";
					tagsMap = new Hashtable<>();
					tag = 1;

					writeString(out, "<tr>\n");
					writeString(out, "<td class=\"center " + border + "\"> " + count++ + "</td>\n");
					writeString(out,
							"<td class=\"text " + space + " " + border + "\"" + sourceDir + ">"
									+ XliffUtils.highlightSpaces(
											removeSvg(addHtmlTags(source, "", false, false, tagsData, segPreserve)))
									+ "</td>\n");
					writeString(out, "<td class=\"center " + border + "\"> " + box + "</td>\n");
					writeString(out,
							"<td class=\"text " + space + "\"" + targetDir + ">"
									+ XliffUtils.highlightSpaces(
											removeSvg(addHtmlTags(target, "", false, false, tagsData, segPreserve)))
									+ "</td>\n");
					writeString(out, "</tr>\n");
				}
			}
			writeString(out, "</table>\n");
			writeString(out, "</body>\n");
			writeString(out, "</html>");
		}
		return output.getAbsolutePath();
	}

	private static void writeString(FileOutputStream out, String string) throws IOException {
		out.write(string.getBytes(StandardCharsets.UTF_8));
	}

	private static String removeSvg(String segment) {
		if (segment.isEmpty()) {
			return segment;
		}
		int index = segment.indexOf("<img ");
		while (index != -1) {
			int end = segment.indexOf(">", index) + 1;
			String start = segment.substring(0, index);
			String img = segment.substring(index, end);
			String tag = "<span class=\"tag\">" + parseImg(img) + "</span>";
			String rest = segment.substring(end);
			segment = start + tag + rest;
			index = segment.indexOf("<img ");
		}
		return segment;
	}

	private static String parseImg(String img) {
		org.jsoup.nodes.Document doc = Jsoup.parse(img, StandardCharsets.UTF_8.name());
		org.jsoup.nodes.Element e = doc.body().getElementsByTag("img").first();
		String src = e.attr("src");
		File svg = new File(src);
		String name = svg.getName();
		return name.substring(0, name.indexOf('.'));
	}

	public void splitSegment(JSONObject json)
			throws SQLException, SAXException, IOException, ParserConfigurationException {

		currentFile = json.getString("file");
		currentUnit = json.getString("unit");
		String segmentId = json.getString("segment");
		int offset = json.getInt("offset");

		Element unit = null;
		Element segment = null;
		document = builder.build(xliffFile);
		List<Element> files = document.getRootElement().getChildren("file");
		for (int i = 0; i < files.size(); i++) {
			Element file = files.get(i);
			if (file.getAttributeValue("id").equals(currentFile)) {
				List<Element> units = file.getChildren("unit");
				for (int j = 0; j < units.size(); j++) {
					unit = units.get(j);
					if (unit.getAttributeValue("id").equals(currentUnit)) {
						List<Element> segments = unit.getChildren("segment");
						for (int k = 0; k < segments.size(); k++) {
							segment = segments.get(k);
							if (segment.getAttributeValue("id").equals(segmentId)) {
								break;
							}
						}
						break;
					}
				}
				break;
			}
		}

		List<Element> segs = unit.getChildren("segment");
		Iterator<Element> tt = segs.iterator();
		while (tt.hasNext()) {
			Element seg = tt.next();
			seg.removeChild("target");
			Element target = getTarget(currentFile, currentUnit, seg.getAttributeValue("id"));
			seg.setAttribute("state", getState(currentFile, currentUnit, seg.getAttributeValue("id")));
			seg.addContent(target);
		}

		Element oldSource = segment.getChild("source");
		List<XMLNode> list1 = new Vector<>();
		List<XMLNode> list2 = new Vector<>();
		List<XMLNode> currentList = list1;
		int visited = 0;
		List<XMLNode> sourceContent = oldSource.getContent();
		Iterator<XMLNode> it = sourceContent.iterator();
		while (it.hasNext()) {
			XMLNode node = it.next();
			if (node.getNodeType() == XMLNode.TEXT_NODE) {
				TextNode textNode = (TextNode) node;
				String text = textNode.getText();
				int length = text.length();
				if (length >= offset - visited && offset - visited > 0) {
					String left = text.substring(0, offset - visited);
					String right = text.substring(offset - visited);
					currentList.add(new TextNode(left));
					currentList = list2;
					currentList.add(new TextNode(right));
				} else {
					currentList.add(node);
				}
				visited = visited + length;
			}
			if (node.getNodeType() == XMLNode.ELEMENT_NODE) {
				Element e = (Element) node;
				if ("mrk".equals(e.getName())) {
					String text = e.getText();
					int length = text.length();
					if (length >= offset - visited && offset - visited > 0) {
						throw new IOException(Messages.getString("XliffStore.45"));
					} else {
						visited = visited + length;
					}
				}
				currentList.add(node);
			}
		}

		Element oldTarget = getTarget(currentFile, currentUnit, segmentId);
		String pureTarget = XliffUtils.pureText(oldTarget);

		Element source1 = new Element("source");
		source1.setAttribute("xml:space", oldSource.getAttributeValue("xml:space", "default"));
		source1.setContent(list1);

		Element segment1 = new Element("segment");
		segment1.setAttribute("id", segmentId + "-1");
		segment1.setAttribute("state", pureTarget.isEmpty() ? Constants.INITIAL : Constants.TRANSLATED);
		segment1.addContent(source1);
		segment1.addContent(oldTarget);

		Element source2 = new Element("source");
		source2.setAttribute("xml:space", oldSource.getAttributeValue("xml:space", "default"));
		source2.setContent(list2);

		Element target2 = new Element("target");
		if (oldSource.hasAttribute("xml:space")) {
			target2.setAttribute("xml:space", oldSource.getAttributeValue("xml:space"));
		}

		Element segment2 = new Element("segment");
		segment2.setAttribute("id", segmentId + "-2");
		segment2.setAttribute("state", Constants.INITIAL);
		segment2.addContent(source2);
		segment2.addContent(target2);

		List<Element> oldContent = unit.getChildren();
		List<XMLNode> newContent = new Vector<>();

		unit.removeChild("mtc:matches");
		unit.removeChild("gls:glossary");

		Iterator<Element> ot = oldContent.iterator();
		while (ot.hasNext()) {
			Element child = ot.next();
			if ("segment".equals(child.getName()) && segmentId.equals(child.getAttributeValue("id"))) {
				newContent.add(segment1);
				newContent.add(segment2);
			} else {
				newContent.add(child);
			}
		}
		unit.setContent(newContent);
		Indenter.indent(unit, 2);

		String sql = "SELECT MIN(child) FROM segments WHERE file=? AND unitId=?";
		index = 0;

		try (PreparedStatement prep = conn.prepareStatement(sql)) {
			prep.setString(1, currentFile);
			prep.setString(2, currentUnit);
			try (ResultSet rs = prep.executeQuery()) {
				while (rs.next()) {
					index = rs.getInt(1);
				}
			}
		}

		deleteUnitSegments(currentFile, currentUnit);

		sql = "UPDATE segments SET child = child + 1 WHERE file = '" + currentFile + "' AND child >= " + index;
		stmt.execute(sql);

		sql = "INSERT INTO segments (file, unitId, segId, type, state, child, translate, tags, space, source, sourceText, target, targetText, words) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
		insertSegmentStmt = conn.prepareStatement(sql);

		List<Element> segments = unit.getChildren();
		for (int i = 0; i < segments.size(); i++) {
			Element e = segments.get(i);
			if ("segment".equals(e.getName())) {
				String id = e.getAttributeValue("id");
				Element source = e.getChild("source");
				boolean sourcePreserve = "preserve".equals(source.getAttributeValue("xml:space", "default"));
				Element target = e.getChild("target");
				state = e.getAttributeValue("state",
						XliffUtils.pureText(target).isEmpty() ? Constants.INITIAL : Constants.TRANSLATED);
				preserve = preserve || sourcePreserve
						|| "preserve".equals(target.getAttributeValue("xml:space", "default"));

				insertSegment(currentFile, currentUnit, id, "S", true, source, target);
			}
			if ("ignorable".equals(e.getName())) {
				String id = e.getAttributeValue("id");
				state = "";
				insertSegment(currentFile, currentUnit, id, "I", false, e.getChild("source"), e.getChild("target"));
			}
		}
		insertSegmentStmt.close();
		conn.commit();
		indexSegments();
		saveXliff();
	}

	private void deleteUnitSegments(String file, String unit) throws SQLException {
		String sql = "DELETE FROM segments WHERE file=? AND unitId=?";
		try (PreparedStatement prep = conn.prepareStatement(sql)) {
			prep.setString(1, file);
			prep.setString(2, unit);
			prep.execute();
		}
	}

	private void deleteSegment(String file, String unit, String segment) throws SQLException {
		String sql = "DELETE FROM segments WHERE file=? AND unitId=? AND segId=?";
		try (PreparedStatement prep = conn.prepareStatement(sql)) {
			prep.setString(1, file);
			prep.setString(2, unit);
			prep.setString(3, segment);
			prep.execute();
		}

		sql = "DELETE FROM matches WHERE file=? AND unitId=? AND segId=?";
		try (PreparedStatement prep = conn.prepareStatement(sql)) {
			prep.setString(1, file);
			prep.setString(2, unit);
			prep.setString(3, segment);
			prep.execute();
		}

		sql = "DELETE FROM terms WHERE file=? AND unitId=? AND segId=?";
		try (PreparedStatement prep = conn.prepareStatement(sql)) {
			prep.setString(1, file);
			prep.setString(2, unit);
			prep.setString(3, segment);
			prep.execute();
		}
	}

	public void mergeSegment(JSONObject json)
			throws SAXException, IOException, ParserConfigurationException, SQLException {

		currentFile = json.getString("file");
		currentUnit = json.getString("unit");
		String segmentId = json.getString("segment");

		Element unit = null;
		Element segment = null;
		document = builder.build(xliffFile);
		List<Element> files = document.getRootElement().getChildren("file");
		for (int i = 0; i < files.size(); i++) {
			Element file = files.get(i);
			if (file.getAttributeValue("id").equals(currentFile)) {
				List<Element> units = file.getChildren("unit");
				for (int j = 0; j < units.size(); j++) {
					unit = units.get(j);
					if (unit.getAttributeValue("id").equals(currentUnit)) {
						List<Element> segments = unit.getChildren("segment");
						for (int k = 0; k < segments.size(); k++) {
							segment = segments.get(k);
							if (segment.getAttributeValue("id").equals(segmentId)) {
								break;
							}
						}
						break;
					}
				}
				break;
			}
		}

		List<Element> segs = unit.getChildren("segment");
		Iterator<Element> tt = segs.iterator();
		while (tt.hasNext()) {
			Element seg = tt.next();
			seg.removeChild("target");
			Element target = getTarget(currentFile, currentUnit, seg.getAttributeValue("id"));
			seg.setAttribute("state", getState(currentFile, currentUnit, seg.getAttributeValue("id")));
			seg.addContent(target);
		}

		String sql = "SELECT MIN(child) FROM segments WHERE file=? AND unitId=?";
		index = 0;

		try (PreparedStatement prep = conn.prepareStatement(sql)) {
			prep.setString(1, currentFile);
			prep.setString(2, currentUnit);
			try (ResultSet rs = prep.executeQuery()) {
				while (rs.next()) {
					index = rs.getInt(1);
				}
			}
		}

		List<Element> oldContent = unit.getChildren();
		List<XMLNode> newContent = new Vector<>();

		String deletedId = null;
		boolean adding = false;
		Iterator<Element> ot = oldContent.iterator();
		while (ot.hasNext()) {
			Element child = ot.next();
			if ("segment".equals(child.getName())) {
				if (!adding) {
					newContent.add(child);
				} else {
					segment.getChild("source").addContent(child.getChild("source").getContent());
					segment.getChild("target").addContent(child.getChild("target").getContent());
					deletedId = child.getAttributeValue("id");
					deleteSegment(currentFile, currentUnit, deletedId);
					adding = false;
				}
				if (segmentId.equals(child.getAttributeValue("id"))) {
					adding = true;
				}
			} else if ("ignorable".equals(child.getName())) {
				if (!adding) {
					newContent.add(child);
				} else {
					segment.getChild("source").addContent(child.getChild("source").getContent());
					Element target = child.getChild("target");
					if (target != null) {
						segment.getChild("target").addContent(target.getContent());
					}
				}
			} else {
				newContent.add(child);
			}
		}
		unit.setContent(newContent);
		if (deletedId != null) {
			Element matches = unit.getChild("mtc:matches");
			if (matches != null) {
				Iterator<Element> it = matches.getChildren().iterator();
				while (it.hasNext()) {
					Element match = it.next();
					if (match.getAttributeValue("ref").equals("#" + deletedId)) {
						match.setAttribute("ref", "#" + deletedId);
					}
				}
			}
			Element terms = unit.getChild("gls:glossary");
			if (terms != null) {
				Iterator<Element> it = terms.getChildren().iterator();
				while (it.hasNext()) {
					Element term = it.next();
					if (term.getAttributeValue("ref").equals("#" + deletedId)) {
						term.setAttribute("ref", "#" + deletedId);
					}
				}
			}
		}
		Indenter.indent(unit, 2);

		deleteUnitSegments(currentFile, currentUnit);

		sql = "INSERT INTO segments (file, unitId, segId, type, state, child, translate, tags, space, source, sourceText, target, targetText, words) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
		insertSegmentStmt = conn.prepareStatement(sql);

		List<Element> segments = unit.getChildren();
		for (int i = 0; i < segments.size(); i++) {
			Element e = segments.get(i);
			if ("segment".equals(e.getName())) {
				String id = e.getAttributeValue("id");
				Element source = e.getChild("source");
				boolean sourcePreserve = "preserve".equals(source.getAttributeValue("xml:space", "default"));
				Element target = e.getChild("target");
				if (target == null) {
					target = new Element("target");
					if (source.hasAttribute("xml:space")) {
						target.setAttribute("xml:space", source.getAttributeValue("xml:space"));
					}
				}
				state = e.getAttributeValue("state",
						XliffUtils.pureText(target).isEmpty() ? Constants.INITIAL : Constants.TRANSLATED);
				preserve = preserve || sourcePreserve
						|| "preserve".equals(target.getAttributeValue("xml:space", "default"));

				insertSegment(currentFile, currentUnit, id, "S", true, source, target);
			}
			if ("ignorable".equals(e.getName())) {
				String id = e.getAttributeValue("id");
				state = "";
				insertSegment(currentFile, currentUnit, id, "I", false, e.getChild("source"), e.getChild("target"));
			}
		}

		insertSegmentStmt.close();
		conn.commit();
		indexSegments();
		saveXliff();
	}

	private Element getTarget(String file, String unit, String segment)
			throws SQLException, SAXException, IOException, ParserConfigurationException {
		getTargetStmt.setString(1, file);
		getTargetStmt.setString(2, unit);
		getTargetStmt.setString(3, segment);
		String tgt = "";
		try (ResultSet rs = getTargetStmt.executeQuery()) {
			while (rs.next()) {
				tgt = rs.getString(1);
				state = rs.getString(2);
			}
		}
		if (tgt == null || tgt.isEmpty()) {
			return new Element("target");
		}
		return XliffUtils.buildElement(tgt);
	}

	private String getState(String file, String unit, String segment) throws SQLException {
		getTargetStmt.setString(1, file);
		getTargetStmt.setString(2, unit);
		getTargetStmt.setString(3, segment);
		String result = "";
		try (ResultSet rs = getTargetStmt.executeQuery()) {
			while (rs.next()) {
				result = rs.getString(2);
			}
		}
		return result;
	}

	private boolean isTranslatable(String file, String unit, String segment) throws SQLException {
		getSource.setString(1, file);
		getSource.setString(2, unit);
		getSource.setString(3, segment);
		boolean translate = true;
		try (ResultSet rs = getSource.executeQuery()) {
			while (rs.next()) {
				translate = rs.getString(4).equals("Y");
			}
		}
		return translate;
	}

	private void indexSegments() throws SQLException {
		int idx = 0;
		String update = "UPDATE segments SET idx=? WHERE file=? AND unitID=? AND segId=?";
		try (PreparedStatement prep = conn.prepareStatement(update)) {
			try (Statement st = conn.createStatement()) {
				String sql = "SELECT file, unitId, segId, child FROM segments WHERE type='S' ORDER BY file, child";
				try (ResultSet rs = st.executeQuery(sql)) {
					while (rs.next()) {
						prep.setInt(1, idx++);
						prep.setString(2, rs.getString(1));
						prep.setString(3, rs.getString(2));
						prep.setString(4, rs.getString(3));
						prep.executeUpdate();
					}
				}
			}
		}
		conn.commit();
	}

	public JSONObject getSegmentSource(JSONObject json)
			throws JSONException, SQLException, SAXException, IOException, ParserConfigurationException {
		getSource.setString(1, json.getString("file"));
		getSource.setString(2, json.getString("unit"));
		getSource.setString(3, json.getString("segment"));
		String src = "";
		try (ResultSet rs = getSource.executeQuery()) {
			while (rs.next()) {
				src = rs.getString(1);
			}
		}
		Element source = XliffUtils.buildElement(src);
		String plainText = XliffUtils.pureText(source);
		JSONObject result = new JSONObject();
		result.put("source", source.toString());
		result.put("plainText", "<source>" + plainText + "</source>");
		return result;
	}

	public void setMTMatches(JSONObject json)
			throws SQLException, IOException, JSONException, SAXException, ParserConfigurationException {
		String file = json.getString("file");
		String unit = json.getString("unit");
		String segment = json.getString("segment");
		JSONArray translations = json.getJSONArray("translations");
		for (int i = 0; i < translations.length(); i++) {
			JSONObject translation = translations.getJSONObject(i);
			Element source = XliffUtils.buildElement(translation.getString("source"));
			Element target = XliffUtils.buildElement(translation.getString("target"));
			String origin = translation.getString("origin");
			insertMatch(file, unit, segment, origin, Constants.MT, 0, source, target, new JSONObject());
		}
	}

	public void updateProject(JSONObject json) throws SAXException, IOException, ParserConfigurationException {
		if (!srcLang.equals(json.getString("srcLang")) || !tgtLang.equals(json.getString("tgtLang"))) {
			srcLang = json.getString("srcLang");
			tgtLang = json.getString("tgtLang");
			document = builder.build(xliffFile);
			document.getRootElement().setAttribute("srcLang", srcLang);
			document.getRootElement().setAttribute("trgLang", tgtLang);
			saveXliff();
		}
	}
}