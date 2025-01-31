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

package com.maxprograms.swordfish;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.lang.System.Logger;
import java.lang.System.Logger.Level;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.sql.SQLException;
import java.text.MessageFormat;
import java.util.Collections;
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

import javax.xml.parsers.ParserConfigurationException;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.xml.sax.SAXException;

import com.maxprograms.languages.Language;
import com.maxprograms.languages.LanguageUtils;
import com.maxprograms.swordfish.models.Memory;
import com.maxprograms.swordfish.tm.ITmEngine;
import com.maxprograms.swordfish.tm.RemoteDatabase;
import com.maxprograms.swordfish.tm.SqliteDatabase;
import com.maxprograms.swordfish.xliff.XliffUtils;
import com.maxprograms.xml.Element;
import com.maxprograms.xml.TextNode;
import com.maxprograms.xml.XMLNode;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

public class MemoriesHandler implements HttpHandler {

	private static Logger logger = System.getLogger(MemoriesHandler.class.getName());

	private static Map<String, ITmEngine> engines;
	private static Map<String, Integer> openCount = new Hashtable<>();
	private static Map<String, JSONObject> openTasks = new Hashtable<>();
	private static Map<String, SqliteDatabase> localEngines = new Hashtable<>();

	@Override
	public void handle(HttpExchange exchange) {
		try {
			String request;
			URI uri = exchange.getRequestURI();
			try (InputStream is = exchange.getRequestBody()) {
				request = TmsServer.readRequestBody(is);
			}
			JSONObject response = processRequest(uri.toString(), request);
			byte[] bytes = response.toString().getBytes(StandardCharsets.UTF_8);
			exchange.sendResponseHeaders(200, bytes.length);
			exchange.getResponseHeaders().add("content-type", "application/json; charset=utf-8");
			try (ByteArrayInputStream stream = new ByteArrayInputStream(bytes)) {
				try (OutputStream os = exchange.getResponseBody()) {
					byte[] array = new byte[2048];
					int read;
					while ((read = stream.read(array)) != -1) {
						os.write(array, 0, read);
					}
				}
			}
		} catch (IOException e) {
			MessageFormat mf = new MessageFormat(Messages.getString("MemoriesHandler.0"));
			logger.log(Level.ERROR, mf.format(new String[] { exchange.getRequestURI().toString() }), e);
		}
	}

	private JSONObject processRequest(String url, String request) {
		JSONObject response = new JSONObject();
		try {
			if ("/memories/create".equals(url)) {
				response = createMemory(request);
			} else if ("/memories/list".equals(url)) {
				response = listMemories();
			} else if ("/memories/delete".equals(url)) {
				response = deleteMemory(request);
			} else if ("/memories/export".equals(url)) {
				response = exportMemory(request);
			} else if ("/memories/import".equals(url)) {
				response = importTMX(request);
			} else if ("/memories/concordance".equals(url)) {
				response = concordanceSearch(request);
			} else if ("/memories/status".equals(url)) {
				response = getProcessStatus(request);
			} else if ("/memories/getLanguages".equals(url)) {
				response = getLanguages(request);
			} else {
				MessageFormat mf = new MessageFormat(Messages.getString("MemoriesHandler.1"));
				response.put(Constants.REASON, mf.format(new String[] { url }));
			}
			if (!response.has(Constants.REASON)) {
				response.put(Constants.STATUS, Constants.SUCCESS);
			} else {
				response.put(Constants.STATUS, Constants.ERROR);
			}
		} catch (Exception j) {
			logger.log(Level.ERROR, j.getMessage(), j);
			response.put(Constants.STATUS, Constants.ERROR);
			response.put(Constants.REASON, j.getMessage());
		}
		return response;
	}

	private static JSONObject getLanguages(String request) {
		JSONObject result = new JSONObject();
		final JSONObject json = new JSONObject(request);
		if (!json.has("memory")) {
			result.put(Constants.REASON, Messages.getString("MemoriesHandler.2"));
			return result;
		}
		final String process = "" + System.currentTimeMillis();
		JSONObject obj = new JSONObject();
		obj.put(Constants.PROGRESS, Constants.PROCESSING);
		openTasks.put(process, obj);
		new Thread(() -> {
			try {
				String memory = json.getString("memory");
				open(memory);
				ITmEngine engine = getEngine(memory);
				JSONArray array = new JSONArray();
				Set<String> langs = engine.getAllLanguages();
				array.put(langs);
				close(memory);
				JSONObject completed = new JSONObject();
				completed.put("languages", array);
				completed.put(Constants.PROGRESS, Constants.COMPLETED);
				openTasks.put(process, completed);
			} catch (IOException | SQLException | URISyntaxException e) {
				logger.log(Level.ERROR, e.getMessage(), e);
				JSONObject error = new JSONObject();
				error.put(Constants.REASON, e.getMessage());
				openTasks.put(process, error);
			}
		}).start();
		result.put("process", process);
		return result;
	}

	private static JSONObject getProcessStatus(String request) {
		JSONObject json = new JSONObject(request);
		if (!json.has("process")) {
			JSONObject error = new JSONObject();
			error.put(Constants.REASON, Messages.getString("MemoriesHandler.3"));
			return error;
		}
		String process = json.getString("process");
		if (openTasks.containsKey(process)) {
			JSONObject status = openTasks.get(process);
			if (localEngines.containsKey(process)) {
				SqliteDatabase engine = localEngines.get(process);
				status.put("imported", engine.getCount());
			}
			return status;
		}
		JSONObject error = new JSONObject();
		MessageFormat mf = new MessageFormat(Messages.getString("MemoriesHandler.4"));
		error.put(Constants.REASON, mf.format(new String[] { process }));
		return error;
	}

	private JSONObject concordanceSearch(String request) {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		if (!json.has("memories")) {
			result.put(Constants.REASON, Messages.getString("MemoriesHandler.5"));
			return result;
		}
		String searchStr = json.getString("searchStr");
		String srcLang = json.getString("srcLang");
		boolean isRegexp = json.getBoolean("regExp");
		boolean caseSensitive = json.getBoolean("caseSensitive");
		int limit = json.getInt("limit");
		JSONArray memoriesArray = json.getJSONArray("memories");
		final String process = "" + System.currentTimeMillis();
		JSONObject obj = new JSONObject();
		obj.put(Constants.PROGRESS, Constants.PROCESSING);
		openTasks.put(process, obj);
		new Thread(() -> {
			try {
				if (isRegexp) {
					try {
						Pattern.compile(searchStr);
					} catch (PatternSyntaxException e) {
						throw new IOException(Messages.getString("MemoriesHandler.6"));
					}
				}
				List<Element> matches = new Vector<>();
				for (int i = 0; i < memoriesArray.length(); i++) {
					String memory = memoriesArray.getString(i);
					open(memory);
					ITmEngine engine = getEngine(memory);
					matches.addAll(engine.concordanceSearch(searchStr, srcLang, limit, isRegexp, caseSensitive));
					close(memory);
				}
				result.put("count", matches.size());
				result.put("html", generateHTML(matches, searchStr, isRegexp, caseSensitive));
				result.put(Constants.PROGRESS, Constants.COMPLETED);
				openTasks.put(process, result);
			} catch (IOException | SAXException | ParserConfigurationException | SQLException | URISyntaxException e) {
				logger.log(Level.ERROR, e.getMessage(), e);
				JSONObject error = new JSONObject();
				error.put(Constants.REASON, e.getMessage());
				openTasks.put(process, error);
			}
		}).start();
		result.put("process", process);
		return result;
	}

	private static JSONObject importTMX(String request) {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		if (!json.has("memory")) {
			result.put(Constants.REASON, Messages.getString("MemoriesHandler.7"));
			return result;
		}
		String memory = json.getString("memory");
		if (!json.has("tmx")) {
			result.put(Constants.REASON, Messages.getString("MemoriesHandler.8"));
			return result;
		}
		File tmx = new File(json.getString("tmx"));
		if (!tmx.exists()) {
			result.put(Constants.REASON, Messages.getString("MemoriesHandler.9"));
			return result;
		}

		final String process = "" + System.currentTimeMillis();
		JSONObject obj = new JSONObject();
		obj.put(Constants.PROGRESS, Constants.PROCESSING);
		openTasks.put(process, obj);
		new Thread(() -> {
			try {
				open(memory);
				ITmEngine engine = getEngine(memory);
				if (engine.getType().equals(SqliteDatabase.class.getName())) {
					localEngines.put(process, (SqliteDatabase) engine);
				}
				String project = json.has("project") ? json.getString("project") : "";
				String client = json.has("client") ? json.getString("client") : "";
				String subject = json.has("subject") ? json.getString("subject") : "";
				try {
					int imported = engine.storeTMX(tmx.getAbsolutePath(), project, client, subject);
					JSONObject completed = new JSONObject();
					completed.put("imported", imported);
					completed.put(Constants.PROGRESS, Constants.COMPLETED);
					openTasks.put(process, completed);
				} catch (Exception e) {
					JSONObject error = new JSONObject();
					error.put(Constants.REASON, e.getMessage());
					openTasks.put(process, error);
					logger.log(Level.ERROR, e.getMessage(), e);
				}
				if (engine.getType().equals(SqliteDatabase.class.getName())) {
					localEngines.remove(process);
				}
				close(memory);
			} catch (IOException | SQLException | URISyntaxException e) {
				logger.log(Level.ERROR, e.getMessage(), e);
				JSONObject error = new JSONObject();
				error.put(Constants.REASON, e.getMessage());
				openTasks.put(process, error);
			}
		}).start();
		result.put("process", process);
		return result;
	}

	private static JSONObject exportMemory(String request) {
		JSONObject result = new JSONObject();
		final JSONObject json = new JSONObject(request);
		if (!json.has("memory")) {
			result.put(Constants.REASON, Messages.getString("MemoriesHandler.11"));
			return result;
		}
		if (!json.has("tmx")) {
			result.put(Constants.REASON, Messages.getString("MemoriesHandler.12"));
			return result;
		}
		if (!json.has("srcLang")) {
			json.put("srcLang", "*all*");
		}
		final String process = "" + System.currentTimeMillis();
		JSONObject obj = new JSONObject();
		obj.put(Constants.PROGRESS, Constants.PROCESSING);
		openTasks.put(process, obj);
		new Thread(() -> {
			try {
				String memory = json.getString("memory");
				open(memory);
				ITmEngine engine = getEngine(memory);
				File tmx = new File(json.getString("tmx"));
				Set<String> langSet = Collections.synchronizedSortedSet(new TreeSet<>());
				if (json.has("languages")) {
					JSONArray langs = json.getJSONArray("languages");
					for (int i = 0; i < langs.length(); i++) {
						langSet.add(langs.getString(i));
					}
				} else {
					langSet = engine.getAllLanguages();
				}
				engine.exportMemory(tmx.getAbsolutePath(), langSet, json.getString("srcLang"));
				close(memory);
				JSONObject completed = new JSONObject();
				completed.put(Constants.PROGRESS, Constants.COMPLETED);
				openTasks.put(process, completed);
			} catch (IOException | SAXException | ParserConfigurationException | SQLException | JSONException
					| URISyntaxException e) {
				logger.log(Level.ERROR, e.getMessage(), e);
				JSONObject error = new JSONObject();
				error.put(Constants.REASON, e.getMessage());
				openTasks.put(process, error);
			}
		}).start();
		result.put("process", process);
		return result;
	}

	private static JSONObject deleteMemory(String request) {
		JSONObject result = new JSONObject();
		final JSONObject json = new JSONObject(request);
		if (json.has("memories")) {
			final String process = "" + System.currentTimeMillis();
			result.put("process", process);
			JSONObject obj = new JSONObject();
			obj.put(Constants.PROGRESS, Constants.PROCESSING);
			openTasks.put(process, obj);
			new Thread(() -> {
				try {
					Map<String, Memory> memories = getMemories();
					JSONArray array = json.getJSONArray("memories");
					for (int i = 0; i < array.length(); i++) {
						String id = array.getString(i);
						Memory memory = memories.get(id);
						close(id);
						if (memory.getType().equals(Memory.LOCAL)) {
							deleteMemoryFolder(id);
						}
						memories.remove(id);
					}
					saveMemoriesList(memories);
					JSONObject completed = new JSONObject();
					completed.put(Constants.PROGRESS, Constants.COMPLETED);
					openTasks.put(process, completed);
				} catch (IOException | SQLException | URISyntaxException e) {
					logger.log(Level.ERROR, e.getMessage(), e);
					JSONObject error = new JSONObject();
					error.put(Constants.REASON, e.getMessage());
					openTasks.put(process, error);
				}
			}).start();
		} else {
			result.put(Constants.REASON, Messages.getString("MemoriesHandler.13"));
		}
		return result;
	}

	private static void deleteMemoryFolder(String id) {
		try {
			File wfolder = new File(getWorkFolder(), id);
			TmsServer.deleteFolder(wfolder);
		} catch (IOException ioe) {
			MessageFormat mf = new MessageFormat(Messages.getString("MemoriesHandler.14"));
			logger.log(Level.WARNING, mf.format(new String[] { id }));
		}
	}

	protected static JSONObject listMemories() throws IOException {
		JSONObject result = new JSONObject();
		JSONArray array = new JSONArray();
		result.put("memories", array);
		Map<String, Memory> memories = getMemories();
		if (!memories.isEmpty()) {
			Vector<Memory> vector = new Vector<>();
			vector.addAll(memories.values());
			Collections.sort(vector);
			Iterator<Memory> it = vector.iterator();
			while (it.hasNext()) {
				Memory m = it.next();
				array.put(m.toJSON());
			}
		}
		return result;
	}

	public static JSONArray getMemoriesList() throws IOException {
		JSONArray result = new JSONArray();
		Map<String, Memory> memories = getMemories();
		Vector<Memory> vector = new Vector<>();
		vector.addAll(memories.values());
		Collections.sort(vector);
		Iterator<Memory> it = vector.iterator();
		while (it.hasNext()) {
			Memory m = it.next();
			JSONArray array = new JSONArray();
			array.put(m.getId());
			array.put(m.getName());
			result.put(array);
		}
		return result;
	}

	private static JSONObject createMemory(String request) throws IOException, SQLException, URISyntaxException {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		if (!json.has("id")) {
			json.put("id", "" + System.currentTimeMillis());
		}
		if (!json.has("creationDate")) {
			json.put("creationDate", System.currentTimeMillis());
		}
		Memory mem = new Memory(json);
		ITmEngine engine = new SqliteDatabase(mem.getId(), getWorkFolder());
		engine.close();
		Map<String, Memory> memories = getMemories();
		memories.put(mem.getId(), mem);
		ServicesHandler.addClient(json.getString("client"));
		ServicesHandler.addSubject(json.getString("subject"));
		ServicesHandler.addProjectName(json.getString("project"));
		saveMemoriesList(memories);
		return result;
	}

	private static synchronized Map<String, Memory> getMemories() throws IOException {
		Map<String, Memory> memories = new Hashtable<>();
		engines = new Hashtable<>();
		File home = new File(getWorkFolder());
		File list = new File(home, "memories.json");
		if (!list.exists()) {
			JSONObject json = new JSONObject();
			TmsServer.writeJSON(list, json);
			return memories;
		}
		JSONObject json = TmsServer.readJSON(list);
		Set<String> keys = json.keySet();
		Iterator<String> it = keys.iterator();
		while (it.hasNext()) {
			String key = it.next();
			JSONObject obj = json.getJSONObject(key);
			memories.put(key, new Memory(obj));
		}
		return memories;
	}

	private static synchronized void saveMemoriesList(Map<String, Memory> memories) throws IOException {
		JSONObject json = new JSONObject();
		Set<String> keys = memories.keySet();
		Iterator<String> it = keys.iterator();
		while (it.hasNext()) {
			String key = it.next();
			Memory m = memories.get(key);
			json.put(key, m.toJSON());
		}
		File home = new File(getWorkFolder());
		File list = new File(home, "memories.json");
		TmsServer.writeJSON(list, json);
	}

	public static String getWorkFolder() throws IOException {
		File home = TmsServer.getMemoriesFolder();
		if (!home.exists()) {
			Files.createDirectories(home.toPath());
		}
		return home.getAbsolutePath();
	}

	public static synchronized void open(String id) throws IOException, SQLException, URISyntaxException {
		if (!engines.containsKey(id)) {
			Map<String, Memory> memories = getMemories();
			Memory memory = memories.get(id);
			ITmEngine engine = memory.getType().equals(Memory.LOCAL) ? new SqliteDatabase(id, getWorkFolder())
					: new RemoteDatabase(memory.getServer(), memory.getUser(), memory.getPassword(), id);
			engines.put(id, engine);
			openCount.put(id, 0);
		}
		int count = openCount.get(id);
		openCount.put(id, count + 1);
	}

	public static synchronized void close(String id) throws IOException, SQLException, URISyntaxException {
		if (engines != null && engines.containsKey(id)) {
			int count = openCount.get(id);
			if (count > 1) {
				openCount.put(id, count - 1);
				return;
			}
			engines.get(id).close();
			engines.remove(id);
			openCount.remove(id);
		}
	}

	public static synchronized void closeAll() throws IOException, SQLException, URISyntaxException {
		Set<String> keys = engines.keySet();
		Iterator<String> it = keys.iterator();
		while (it.hasNext()) {
			engines.get(it.next()).close();
		}
		engines.clear();
	}

	public static ITmEngine getEngine(String id) throws IOException, SQLException, URISyntaxException {
		if (!engines.containsKey(id)) {
			open(id);
		}
		return engines.get(id);
	}

	public static String getName(String id) throws IOException {
		Map<String, Memory> memories = getMemories();
		return memories.get(id).getName();
	}

	private String generateHTML(List<Element> matches, String searchStr, boolean isRegexp, boolean caseSensitive)
			throws IOException, SAXException, ParserConfigurationException {
		StringBuilder builder = new StringBuilder();
		builder.append("<table class='stripes'><tr>");
		List<Language> languages = getLanguages(matches);
		Iterator<Language> st = languages.iterator();
		while (st.hasNext()) {
			builder.append("<th>");
			builder.append(st.next().getDescription());
			builder.append("</th>");
		}
		builder.append("</tr>");
		for (int i = 0; i < matches.size(); i++) {
			builder.append("<tr>");
			builder.append(parseTU(matches.get(i), languages, searchStr, isRegexp, caseSensitive));
			builder.append("</tr>");
		}
		builder.append("</table>");
		return builder.toString();
	}

	private String parseTU(Element element, List<Language> languages, String searchStr, boolean isRegexp,
			boolean caseSensitive) throws SAXException, IOException, ParserConfigurationException {
		StringBuilder builder = new StringBuilder();
		Map<String, Element> map = new Hashtable<>();
		List<Element> tuvs = element.getChildren("tuv");
		Iterator<Element> it = tuvs.iterator();
		while (it.hasNext()) {
			Element tuv = it.next();
			map.put(tuv.getAttributeValue("xml:lang"), tuv);
		}
		for (int i = 0; i < languages.size(); i++) {
			Language lang = languages.get(i);
			builder.append("<td ");
			if (lang.isBiDi()) {
				builder.append("dir='rtl'");
			}
			builder.append(" lang='");
			builder.append(lang.getCode());
			builder.append("'>");
			if (map.containsKey(lang.getCode())) {
				Element seg = map.get(lang.getCode()).getChild("seg");
				builder.append(highlight(pureText(seg), searchStr, isRegexp, caseSensitive));
			} else {
				builder.append("&nbsp;");
			}
			builder.append("</td>");
		}
		return builder.toString();
	}

	private String highlight(String pureText, String searchStr, boolean regExp, boolean caseSensitive) {
		StringBuilder text = new StringBuilder();
		if (regExp) {
			Pattern pattern = Pattern.compile(searchStr);
			String s = pureText;
			Matcher matcher = pattern.matcher(s);
			if (matcher.find()) {
				StringBuilder sb = new StringBuilder();
				do {
					int start = matcher.start();
					int end = matcher.end();
					sb.append(XliffUtils.cleanString(s.substring(0, start)));
					sb.append("<span class='highlighted'>");
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
			String s = XliffUtils.cleanString(pureText);
			String t = XliffUtils.cleanString(searchStr);
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
		return text.toString();
	}

	public static List<Language> getLanguages(List<Element> matches)
			throws IOException, SAXException, ParserConfigurationException {
		Set<Language> set = new TreeSet<>();
		Iterator<Element> it = matches.iterator();
		while (it.hasNext()) {
			Element tu = it.next();
			List<Element> tuvs = tu.getChildren("tuv");
			Iterator<Element> tv = tuvs.iterator();
			while (tv.hasNext()) {
				Element tuv = tv.next();
				set.add(LanguageUtils.getLanguage(tuv.getAttributeValue("xml:lang")));
			}
		}
		List<Language> result = new Vector<>();
		result.addAll(set);
		return result;
	}

	public static String pureText(Element e) {
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
				if ("hi".equals(el.getName()) || "sub".equals(el.getName())) {
					string.append(pureText(el));
				}
			}
		}
		return string.toString();
	}

	protected static void addMemory(Memory memory) throws IOException {
		Map<String, Memory> memories = getMemories();
		memories.put(memory.getId(), memory);
		saveMemoriesList(memories);
	}
}
