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

package com.maxprograms.swordfish;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.lang.System.Logger;
import java.lang.System.Logger.Level;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.sql.SQLException;
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

import com.maxprograms.languages.Language;
import com.maxprograms.languages.LanguageUtils;
import com.maxprograms.swordfish.models.Memory;
import com.maxprograms.swordfish.tm.ITmEngine;
import com.maxprograms.swordfish.tm.InternalDatabase;
import com.maxprograms.swordfish.tm.RemoteDatabase;
import com.maxprograms.swordfish.xliff.XliffUtils;
import com.maxprograms.xml.Element;
import com.maxprograms.xml.TextNode;
import com.maxprograms.xml.XMLNode;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import org.json.JSONArray;
import org.json.JSONObject;
import org.xml.sax.SAXException;

public class MemoriesHandler implements HttpHandler {

	private static Logger logger = System.getLogger(MemoriesHandler.class.getName());

	private static Map<String, Memory> memories;
	private static Map<String, ITmEngine> engines;
	private static Map<String, JSONObject> openTasks;
	private static boolean firstRun = true;

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
			logger.log(Level.ERROR, "Error processing memory " + exchange.getRequestURI().toString(), e);
		}
	}

	private JSONObject processRequest(String url, String request) {
		if (TmsServer.isDebug()) {
			logger.log(Level.INFO, url);
		}
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
				response.put(Constants.REASON, "Unknown request");
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
			result.put(Constants.REASON, "Missing 'memory' parameter");
			return result;
		}
		final String process = "" + System.currentTimeMillis();
		if (openTasks == null) {
			openTasks = new Hashtable<>();
		}
		JSONObject obj = new JSONObject();
		obj.put(Constants.PROGRESS, Constants.PROCESSING);
		openTasks.put(process, obj);
		new Thread(() -> {
			try {
				if (memories == null) {
					loadMemoriesList();
				}
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
			} catch (IOException | SQLException e) {
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
			error.put(Constants.REASON, "Missing 'process' parameter");
			return error;
		}
		String process = json.getString("process");
		if (openTasks == null) {
			openTasks = new Hashtable<>();
		}
		if (openTasks.containsKey(process)) {
			return openTasks.get(process);
		}
		JSONObject error = new JSONObject();
		error.put(Constants.REASON, "No such process: " + process);
		return error;
	}

	private JSONObject concordanceSearch(String request) {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		if (!json.has("memories")) {
			result.put(Constants.REASON, "Missing 'memories' parameter");
			return result;
		}
		String searchStr = json.getString("searchStr");
		String srcLang = json.getString("srcLang");
		boolean isRegexp = json.getBoolean("regExp");
		boolean caseSensitive = json.getBoolean("caseSensitive");
		int limit = json.getInt("limit");
		JSONArray memoriesArray = json.getJSONArray("memories");
		final String process = "" + System.currentTimeMillis();
		if (openTasks == null) {
			openTasks = new Hashtable<>();
		}
		JSONObject obj = new JSONObject();
		obj.put(Constants.PROGRESS, Constants.PROCESSING);
		openTasks.put(process, obj);
		new Thread(() -> {
			try {
				if (isRegexp) {
					try {
						Pattern.compile(searchStr);
					} catch (PatternSyntaxException e) {
						throw new IOException("Invalid regular expression");
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
			} catch (IOException | SAXException | ParserConfigurationException | SQLException e) {
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
			result.put(Constants.REASON, "Missing 'memory' parameter");
			return result;
		}
		String memory = json.getString("memory");
		if (!json.has("tmx")) {
			result.put(Constants.REASON, "Missing 'tmx' parameter");
			return result;
		}
		File tmx = new File(json.getString("tmx"));
		if (!tmx.exists()) {
			result.put(Constants.REASON, "TMX file does not exist");
			return result;
		}

		final String process = "" + System.currentTimeMillis();
		if (openTasks == null) {
			openTasks = new Hashtable<>();
		}
		JSONObject obj = new JSONObject();
		obj.put(Constants.PROGRESS, Constants.PROCESSING);
		openTasks.put(process, obj);
		new Thread(() -> {
			try {
				open(memory);
				ITmEngine engine = getEngine(memory);
				String project = json.has("project") ? json.getString("project") : "";
				String client = json.has("client") ? json.getString("client") : "";
				String subject = json.has("subject") ? json.getString("subject") : "";
				try {
					int imported = engine.storeTMX(tmx.getAbsolutePath(), project, client, subject);
					if (TmsServer.isDebug()) {
						logger.log(Level.INFO, "Imported " + imported);
					}
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
				close(memory);
			} catch (IOException | SQLException e) {
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
			result.put(Constants.REASON, "Missing 'memory' parameter");
			return result;
		}
		if (!json.has("tmx")) {
			result.put(Constants.REASON, "Missing 'tmx' parameter");
			return result;
		}
		if (!json.has("srcLang")) {
			json.put("srcLang", "*all*");
		}
		final String process = "" + System.currentTimeMillis();
		if (openTasks == null) {
			openTasks = new Hashtable<>();
		}
		JSONObject obj = new JSONObject();
		obj.put(Constants.PROGRESS, Constants.PROCESSING);
		openTasks.put(process, obj);
		new Thread(() -> {
			try {
				if (memories == null) {
					loadMemoriesList();
				}
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
			} catch (IOException | SAXException | ParserConfigurationException | SQLException e) {
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
			if (openTasks == null) {
				openTasks = new Hashtable<>();
			}
			JSONObject obj = new JSONObject();
			obj.put(Constants.PROGRESS, Constants.PROCESSING);
			openTasks.put(process, obj);
			new Thread(() -> {
				try {
					JSONArray array = json.getJSONArray("memories");
					for (int i = 0; i < array.length(); i++) {
						String id = array.getString(i);
						Memory memory = memories.get(id);
						close(id);
						if (memory.getType().equals(Memory.LOCAL)) {
							try {
								File wfolder = new File(getWorkFolder(), id);
								TmsServer.deleteFolder(wfolder.getAbsolutePath());
							} catch (IOException ioe) {
								logger.log(Level.WARNING, "Folder '" + id + "' will be deleted on next start");
							}
						}
						memories.remove(id);
					}
					saveMemoriesList();
					JSONObject completed = new JSONObject();
					completed.put(Constants.PROGRESS, Constants.COMPLETED);
					openTasks.put(process, completed);
				} catch (IOException | SQLException e) {
					logger.log(Level.ERROR, e.getMessage(), e);
					JSONObject error = new JSONObject();
					error.put(Constants.REASON, e.getMessage());
					openTasks.put(process, error);
				}
			}).start();
		} else {
			result.put(Constants.REASON, "Missing 'memories' parameter");
		}
		return result;
	}

	private static JSONObject listMemories() throws IOException {
		JSONObject result = new JSONObject();
		JSONArray array = new JSONArray();
		result.put("memories", array);
		if (memories == null) {
			loadMemoriesList();
		}
		Vector<Memory> vector = new Vector<>();
		vector.addAll(memories.values());
		Collections.sort(vector);
		Iterator<Memory> it = vector.iterator();
		while (it.hasNext()) {
			Memory m = it.next();
			array.put(m.toJSON());
		}
		return result;
	}

	public static JSONArray getMemories() throws IOException {
		JSONArray result = new JSONArray();
		if (memories == null) {
			loadMemoriesList();
		}
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

	private static JSONObject createMemory(String request) throws IOException, SQLException {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		if (!json.has("id")) {
			json.put("id", "" + System.currentTimeMillis());
		}
		if (!json.has("creationDate")) {
			json.put("creationDate", System.currentTimeMillis());
		}
		Memory mem = new Memory(json);
		InternalDatabase engine = new InternalDatabase(mem.getId(), getWorkFolder());
		engine.close();
		if (memories == null) {
			loadMemoriesList();
		}
		memories.put(mem.getId(), mem);
		ServicesHandler.addClient(json.getString("client"));
		ServicesHandler.addSubject(json.getString("subject"));
		ServicesHandler.addProject(json.getString("project"));
		saveMemoriesList();
		return result;
	}

	private static synchronized void loadMemoriesList() throws IOException {
		memories = new Hashtable<>();
		engines = new Hashtable<>();
		File home = new File(getWorkFolder());
		File list = new File(home, "memories.json");
		if (!list.exists()) {
			return;
		}
		StringBuffer buffer = new StringBuffer();
		try (FileReader input = new FileReader(list, StandardCharsets.UTF_8)) {
			try (BufferedReader reader = new BufferedReader(input)) {
				String line;
				while ((line = reader.readLine()) != null) {
					buffer.append(line);
				}
			}
		}
		JSONObject json = new JSONObject(buffer.toString());
		Set<String> keys = json.keySet();
		Iterator<String> it = keys.iterator();
		while (it.hasNext()) {
			String key = it.next();
			JSONObject obj = json.getJSONObject(key);
			memories.put(key, new Memory(obj));
		}
		if (firstRun) {
			firstRun = false;
			new Thread(() -> {
				try {
					File[] filesList = home.listFiles();
					for (int i = 0; i < filesList.length; i++) {
						if (filesList[i].isDirectory() && !memories.containsKey(filesList[i].getName())) {
							TmsServer.deleteFolder(filesList[i].getAbsolutePath());
						}
					}
				} catch (IOException e) {
					logger.log(Level.WARNING, "Error deleting folder", e);
				}
			}).start();
		}
	}

	private static synchronized void saveMemoriesList() throws IOException {
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
		try (FileOutputStream out = new FileOutputStream(list)) {
			out.write(json.toString(2).getBytes(StandardCharsets.UTF_8));
		}
	}

	public static String getWorkFolder() throws IOException {
		File home = TmsServer.getWorkFolder();
		File workFolder = new File(home, "memories");
		if (!workFolder.exists()) {
			Files.createDirectories(workFolder.toPath());
		}
		return workFolder.getAbsolutePath();
	}

	public static synchronized void open(String id) throws IOException, SQLException {
		if (memories == null) {
			loadMemoriesList();
		}
		if (!engines.containsKey(id)) {
			Memory memory = memories.get(id);
			ITmEngine engine = memory.getType().equals(Memory.LOCAL) ? new InternalDatabase(id, getWorkFolder())
					: new RemoteDatabase(memory.getServer(), memory.getUser(), memory.getPassword(), id);
			engines.put(id, engine);
		}
	}

	public static synchronized void close(String id) throws IOException, SQLException {
		if (engines != null && engines.containsKey(id)) {
			engines.get(id).close();
			engines.remove(id);
		}
	}

	public static synchronized void closeAll() throws IOException, SQLException {
		Set<String> keys = engines.keySet();
		Iterator<String> it = keys.iterator();
		while (it.hasNext()) {
			engines.get(it.next()).close();
		}
		engines.clear();
		if (TmsServer.isDebug()) {
			logger.log(Level.INFO, "Memories closed");
		}
	}

	public static ITmEngine getEngine(String id) throws IOException, SQLException {
		if (memories == null) {
			loadMemoriesList();
		}
		if (!engines.containsKey(id)) {
			open(id);
		}
		return engines.get(id);
	}

	public static String getName(String id) throws IOException {
		if (memories == null) {
			loadMemoriesList();
		}
		return memories.get(id).getName();
	}

	private String generateHTML(List<Element> matches, String searchStr, boolean isRegexp, boolean caseSensitive)
			throws IOException {
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
			boolean caseSensitive) {
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

	public static List<Language> getLanguages(List<Element> matches) throws IOException {
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
		if (memories == null) {
			loadMemoriesList();
		}
		memories.put(memory.getId(), memory);
		saveMemoriesList();
	}
}
