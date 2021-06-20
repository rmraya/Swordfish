/*******************************************************************************
 * Copyright (c) 2007-2021 Maxprograms.
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
import java.io.StringReader;
import java.lang.System.Logger;
import java.lang.System.Logger.Level;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.text.MessageFormat;
import java.util.Calendar;
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

import javax.xml.parsers.ParserConfigurationException;

import com.maxprograms.languages.LanguageUtils;
import com.maxprograms.swordfish.Constants;
import com.maxprograms.swordfish.MemoriesHandler;
import com.maxprograms.swordfish.TmsServer;
import com.maxprograms.swordfish.tmx.TMXReader;
import com.maxprograms.xml.Element;
import com.maxprograms.xml.Indenter;
import com.maxprograms.xml.XMLUtils;

import org.json.JSONArray;
import org.json.JSONObject;
import org.mapdb.Fun;
import org.mapdb.Fun.Tuple2;
import org.xml.sax.SAXException;

public class InternalDatabase implements ITmEngine {

	protected static final Logger logger = System.getLogger(InternalDatabase.class.getName());

	private String dbname;
	private Connection conn;
	private PreparedStatement storeTUV;
	private PreparedStatement deleteTUV;
	private PreparedStatement searchTUV;
	private String currProject;
	private String currSubject;
	private String currCustomer;
	private FileOutputStream output;
	private String creationDate;
	private FuzzyIndex fuzzyIndex;
	private TuDatabase tuDb;
	private File database;
	private long next;

	public InternalDatabase(String dbname, String workFolder) throws SQLException, IOException {
		this.dbname = dbname;
		creationDate = TMUtils.tmxDate();

		File wfolder = new File(workFolder);
		database = new File(wfolder, dbname);
		boolean exists = database.exists();
		if (!exists) {
			database.mkdirs();
		}
		String url = "jdbc:h2:" + database.getAbsolutePath() + "/db";
		conn = DriverManager.getConnection(url);

		if (!exists) {
			createTable();
			logger.log(Level.INFO, "H2 database created");
		}

		boolean needsUpgrade = false;
		try (Statement stmt = conn.createStatement()) {
			String sql = "SELECT TYPE_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='TUV' AND COLUMN_NAME='SEG'";
			try (ResultSet rs = stmt.executeQuery(sql)) {
				while (rs.next()) {
					needsUpgrade = !rs.getString(1).equalsIgnoreCase("CLOB");
				}
			}
		}
		if (needsUpgrade) {
			String s1 = "ALTER TABLE TUV ALTER COLUMN SEG SET DATA TYPE CLOB";
			String s2 = "ALTER TABLE TUV ALTER COLUMN PURETEXT SET DATA TYPE CLOB";
			try (Statement upgrade = conn.createStatement()) {
				upgrade.execute(s1);
				upgrade.execute(s2);
				conn.commit();
			}
		}

		storeTUV = conn.prepareStatement("INSERT INTO tuv (tuid, lang, seg, puretext, textlength) VALUES (?,?,?,?,?)");
		searchTUV = conn.prepareStatement("SELECT textlength FROM tuv WHERE tuid=? AND lang=?");
		deleteTUV = conn.prepareStatement("DELETE FROM tuv WHERE tuid=? AND lang=?");
		try {
			tuDb = new TuDatabase(database);
		} catch (Exception e) {
			logger.log(Level.ERROR, e.getMessage(), e);
			MessageFormat mf = new MessageFormat("TU storage of database {0} is damaged");
			throw new IOException(mf.format(new String[] { dbname }));
		}
		try {
			fuzzyIndex = new FuzzyIndex(database);
		} catch (Exception e) {
			logger.log(Level.ERROR, e.getMessage(), e);
			MessageFormat mf = new MessageFormat("Fuzzy index of database {0} is damaged");
			throw new IOException(mf.format(new String[] { dbname }));
		}
	}

	private void createTable() throws SQLException {
		String sql = "CREATE TABLE tuv (tuid VARCHAR(256) NOT NULL, lang VARCHAR(15) NOT NULL, seg CLOB NOT NULL, puretext CLOB NOT NULL, textlength INTEGER NOT NULL, PRIMARY KEY(tuid, lang));";
		try (Statement stmt = conn.createStatement()) {
			stmt.execute(sql);
		}
		conn.commit();
	}

	@Override
	public synchronized void close() throws SQLException {
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
	public String getName() {
		return dbname;
	}

	private void startTransaction() throws SQLException {
		conn.setAutoCommit(false);
	}

	@Override
	public synchronized void commit() throws SQLException {
		conn.commit();
		fuzzyIndex.commit();
		tuDb.commit();
	}

	@Override
	public int storeTMX(String tmxFile, String project, String customer, String subject)
			throws SQLException, IOException, SAXException, ParserConfigurationException {
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
		creationDate = TMUtils.creationDate();

		startTransaction();

		TMXReader reader = new TMXReader(this);
		reader.parse(new File(tmxFile).toURI().toURL());
		imported = reader.getCount();

		commit();
		return imported;
	}

	@Override
	public void exportMemory(String tmxfile, Set<String> langs, String srcLang) throws IOException, SQLException {
		output = new FileOutputStream(tmxfile);
		writeHeader(srcLang);
		writeString("<body>\n");

		try (PreparedStatement stmt = conn.prepareStatement("SELECT lang, seg FROM tuv WHERE tuid=?")) {
			Set<Integer> set = tuDb.getKeys();
			Iterator<Integer> it = set.iterator();
			while (it.hasNext()) {
				Element t = tuDb.getTu(it.next());
				Element tu = new Element("tu");
				tu.clone(t);
				String tuid = tu.getAttributeValue("tuid");
				stmt.setString(1, tuid);
				int count = 0;
				try (ResultSet rs = stmt.executeQuery()) {
					while (rs.next()) {
						String lang = rs.getString(1);
						String seg = TMUtils.getString(rs.getNCharacterStream(2));
						if (seg.equals("<seg></seg>") || !langs.contains(lang)) {
							continue;
						}
						try {
							Element tuv = TMUtils.buildTuv(lang, seg);
							tu.addContent(tuv);
							count++;
						} catch (Exception e) {
							logger.log(Level.ERROR, "Error building tuv", e);
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

		writeString("</body>\n");
		writeString("</tmx>\n");
		output.close();
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
	public Set<String> getAllClients() {
		return tuDb.getCustomers();
	}

	@Override
	public Set<String> getAllLanguages() throws SQLException {
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
	public Set<String> getAllProjects() {
		return tuDb.getProjects();
	}

	@Override
	public Set<String> getAllSubjects() {
		return tuDb.getSubjects();
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
						try (ResultSet rs = stmt.executeQuery()) {
							while (rs.next()) {
								String pure = TMUtils.getString(rs.getNCharacterStream(1));
								String srcSeg = TMUtils.getString(rs.getNCharacterStream(2));
								int distance;
								if (caseSensitive) {
									distance = MatchQuality.similarity(searchStr, pure);
								} else {
									distance = MatchQuality.similarity(searchStr.toLowerCase(), pure.toLowerCase());
								}
								if (distance >= similarity) {
									stmt2.setString(1, tuid);
									stmt2.setString(2, tgtLang);
									boolean tgtFound = false;
									Element target = null;
									try (ResultSet rs2 = stmt2.executeQuery()) {
										while (rs2.next()) {
											String lang = rs2.getString(1);
											String seg = TMUtils.getString(rs2.getNCharacterStream(2));
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
										Match match = new Match(source, target, distance, dbname, propsMap);
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
			String sql = caseSensitive ? "SELECT tuid, puretext FROM tuv WHERE lang=? AND puretext LIKE ? LIMIT ?"
					: "SELECT tuid, puretext FROM tuv WHERE lang=? AND puretext ILIKE ? LIMIT ?";
					String escaped = searchStr.replace("%", "\\%").replace("_", "\\_");
					try (PreparedStatement stmt = conn.prepareStatement(sql)) {
				stmt.setString(1, srcLang);
				stmt.setString(2, "%" + escaped + "%");
				stmt.setInt(3, limit);
				try (ResultSet rs = stmt.executeQuery()) {
					while (rs.next()) {
						candidates.add(rs.getString(1));
					}
				}
			}
		}

		try (PreparedStatement stmt2 = conn.prepareStatement("SELECT lang, seg FROM tuv WHERE tuid=?")) {
			Iterator<String> it = candidates.iterator();
			while (it.hasNext()) {
				String tuid = it.next();
				Element tu = tuDb.getTu(tuid);
				if (tu == null) {
					throw new IOException("Memory has broken segments");
				}
				stmt2.setString(1, tuid);
				try (ResultSet rs2 = stmt2.executeQuery()) {
					while (rs2.next()) {
						String lang = rs2.getString(1);
						String seg = TMUtils.getString(rs2.getNCharacterStream(2));
						Element tuv = TMUtils.buildTuv(lang, seg);
						tu.addContent(tuv);
					}
				}
				result.add(tu);
			}
		}
		return result;
	}

	@Override
	public synchronized void storeTu(Element tu) throws SQLException, IOException {
		Set<String> tuLangs = Collections.synchronizedSortedSet(new TreeSet<>());
		List<Element> tuvs = tu.getChildren("tuv");
		String tuid = tu.getAttributeValue("tuid");
		if (tuid.isEmpty()) {
			tuid = nextId();
			tu.setAttribute("tuid", tuid);
		}

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
		if (tu.getAttributeValue("creationdate").isEmpty()) {
			tu.setAttribute("creationdate", creationDate);
		}
		if (tu.getAttributeValue("creationid").isEmpty()) {
			tu.setAttribute("creationid", System.getProperty("user.name"));
		}

		storeTUV.setString(1, tuid);

		Iterator<Element> it = tuvs.iterator();
		while (it.hasNext()) {
			Element tuv = it.next();
			String lang = LanguageUtils.normalizeCode(tuv.getAttributeValue("xml:lang"));
			if (lang != null && !tuLangs.contains(lang)) {
				if (exists(tuid, lang)) {
					delete(tuid, lang);
				}
				Element seg = tuv.getChild("seg");
				String puretext = TMUtils.extractText(seg);
				if (puretext.length() < 1) {
					continue;
				}
				storeTUV.setString(2, lang);
				storeTUV.setNCharacterStream(3, new StringReader(seg.toString()));
				storeTUV.setNCharacterStream(4, new StringReader(puretext));
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
			next = Calendar.getInstance().getTimeInMillis();
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

	private void delete(String tuid, String lang) throws SQLException {
		deleteTUV.setString(1, tuid);
		deleteTUV.setString(2, lang);
		deleteTUV.execute();
	}

	public void setProject(String project) throws SQLException {
		String query = "UPDATE databases SET project=? WHERE dbname=?";
		try (PreparedStatement stmt = conn.prepareStatement(query)) {
			stmt.setString(1, project);
			stmt.setString(2, dbname);
			stmt.execute();
		}
	}

	public void setCustomer(String customer) throws SQLException {
		String query = "UPDATE databases SET client=? WHERE dbname=?";
		try (PreparedStatement stmt = conn.prepareStatement(query)) {
			stmt.setString(1, customer);
			stmt.setString(2, dbname);
			stmt.execute();
		}
	}

	public void setSubject(String subject) throws SQLException {
		String query = "UPDATE databases SET subject=? WHERE dbname=?";
		try (PreparedStatement stmt = conn.prepareStatement(query)) {
			stmt.setString(1, subject);
			stmt.setString(2, dbname);
			stmt.execute();
		}
	}

	public void setCreationDate(String date) {
		creationDate = date;
	}

	@Override
	public Element getTu(String tuid) throws SQLException, SAXException, IOException, ParserConfigurationException {
		Element tu = tuDb.getTu(tuid);
		try (PreparedStatement stmt = conn.prepareStatement("SELECT lang, seg FROM tuv WHERE tuid=?")) {
			stmt.setString(1, tuid);
			try (ResultSet rs = stmt.executeQuery()) {
				while (rs.next()) {
					String lang = rs.getString(1);
					String seg = TMUtils.getString(rs.getNCharacterStream(2));
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
	public void removeTu(String tuid) throws IOException, SQLException {
		Element tu = tuDb.getTu(tuid);
		if (tu != null) {
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
	}

	@Override
	public String getType() {
		return InternalDatabase.class.getName();
	}

	@Override
	public void deleteDatabase() throws IOException, SQLException {
		TmsServer.deleteFolder(new File(MemoriesHandler.getWorkFolder(), dbname).getAbsolutePath());
	}

	@Override
	public List<Element> searchAll(String searchStr, String srcLang, int similarity, boolean caseSensitive)
			throws IOException, SAXException, ParserConfigurationException, SQLException {
		List<Element> result = new Vector<>();

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
			Enumeration<String> tuids = candidates.keys();
			while (tuids.hasMoreElements()) {
				String tuid = tuids.nextElement();
				int count = candidates.get(tuid);
				if (count >= min && count <= max) {
					stmt.setString(2, tuid);
					try (ResultSet rs = stmt.executeQuery()) {
						while (rs.next()) {
							String pure = TMUtils.getString(rs.getNCharacterStream(1));
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
	public JSONArray batchTranslate(JSONObject params)
			throws IOException, SAXException, ParserConfigurationException, SQLException {
		JSONArray result = new JSONArray();
		String srcLang = params.getString("srcLang");
		String tgtLang = params.getString("tgtLang");
		JSONArray segments = params.getJSONArray("segments");
		for (int i = 0; i < segments.length(); i++) {
			JSONObject json = segments.getJSONObject(i);
			List<Match> matches = searchTranslation(json.getString("pure"), srcLang, tgtLang, 60, false);
			JSONArray array = new JSONArray();
			for (int j = 0; j < matches.size(); j++) {
				array.put(matches.get(j).toJSON());
			}
			json.put("matches", array);
			result.put(json);
		}
		return result;
	}

}
