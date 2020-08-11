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
import java.util.Iterator;
import java.util.Set;
import java.util.TreeSet;
import java.util.Vector;
import java.util.concurrent.ConcurrentHashMap;

import javax.xml.parsers.ParserConfigurationException;

import com.maxprograms.swordfish.models.Memory;
import com.maxprograms.swordfish.tm.ITmEngine;
import com.maxprograms.swordfish.tm.InternalDatabase;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import org.json.JSONArray;
import org.json.JSONObject;
import org.xml.sax.SAXException;

public class MemoriesHandler implements HttpHandler {

	private static Logger logger = System.getLogger(MemoriesHandler.class.getName());

	private static ConcurrentHashMap<String, Memory> memories;
	private static ConcurrentHashMap<String, ITmEngine> openEngines;
	private static ConcurrentHashMap<String, String[]> openTasks;
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
				response = listMemories(request);
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
			openTasks = new ConcurrentHashMap<>();
		}
		openTasks.put(process, new String[] { Constants.PROCESSING });
		new Thread(() -> {
			try {
				if (memories == null) {
					loadMemoriesList();
				}
				Memory mem = memories.get(json.getString("memory"));
				if (openEngines == null) {
					openEngines = new ConcurrentHashMap<>();
				}
				boolean wasOpen = openEngines.containsKey(mem.getId());
				if (!wasOpen) {
					openMemory(mem.getId());
				}
				ITmEngine engine = openEngines.get(mem.getId());
				JSONArray array = new JSONArray();
				Set<String> langs = engine.getAllLanguages();
				array.put(langs);
				if (!wasOpen) {
					closeMemory(mem.getId());
				}
				JSONObject obj = new JSONObject();
				obj.put("languages", array);
				openTasks.put(process, new String[] { Constants.COMPLETED, obj.toString() });
			} catch (IOException | SQLException e) {
				logger.log(Level.ERROR, e.getMessage(), e);
				openTasks.put(process, new String[] { Constants.ERROR, e.getMessage() });
			}
		}).start();
		result.put("process", process);
		return result;
	}

	private static JSONObject getProcessStatus(String request) {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		if (!json.has("process")) {
			result.put(Constants.REASON, "Missing 'process' parameter");
			return result;
		}
		String process = json.getString("process");
		if (openTasks == null) {
			openTasks = new ConcurrentHashMap<>();
		}
		if (openTasks.containsKey(process)) {
			String[] status = openTasks.get(process);
			result.put("result", status[0]);
			if (Constants.COMPLETED.equals(status[0]) && status.length > 1) {
				result.put("data", new JSONObject(status[1]));
			}
			if (Constants.ERROR.equals(status[0])) {
				result.put(Constants.REASON, status[1]);
			}
		} else {
			result.put("result", Constants.ERROR);
			result.put(Constants.REASON, "No such process: " + process);
		}
		return result;
	}

	private JSONObject concordanceSearch(String request) {
		// TODO Auto-generated method stub
		return new JSONObject();
	}

	private static JSONObject importTMX(String request) {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		if (!json.has("memory")) {
			result.put(Constants.REASON, "Missing 'memory' parameter");
			return result;
		}
		String id = json.getString("memory");

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
			openTasks = new ConcurrentHashMap<>();
		}
		openTasks.put(process, new String[] { Constants.PROCESSING });
		new Thread(() -> {
			try {
				if (openEngines == null) {
					openEngines = new ConcurrentHashMap<>();
				}
				boolean wasOpen = openEngines.containsKey(id);
				if (!wasOpen) {
					openMemory(id);
				}
				ITmEngine engine = openEngines.get(id);
				String project = json.has("project") ? json.getString("project") : "";
				String client = json.has("client") ? json.getString("client") : "";
				String subject = json.has("subject") ? json.getString("subject") : "";
				try {
					int imported = engine.storeTMX(tmx.getAbsolutePath(), project, client, subject);
					logger.log(Level.INFO, "Imported " + imported);
					openTasks.put(process, new String[] { Constants.COMPLETED });
				} catch (Exception e) {
					openTasks.put(process, new String[] { Constants.ERROR, e.getMessage() });
					logger.log(Level.ERROR, e.getMessage(), e);
				}
				if (!wasOpen) {
					closeMemory(id);
				}
			} catch (IOException | SQLException e) {
				logger.log(Level.ERROR, e.getMessage(), e);
				openTasks.put(process, new String[] { Constants.ERROR, e.getMessage() });
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
			openTasks = new ConcurrentHashMap<>();
		}
		openTasks.put(process, new String[] { Constants.PROCESSING });
		new Thread(() -> {
			try {
				if (memories == null) {
					loadMemoriesList();
				}
				Memory mem = memories.get(json.getString("memory"));
				if (openEngines == null) {
					openEngines = new ConcurrentHashMap<>();
				}
				boolean needsClosing = false;
				if (!openEngines.containsKey(mem.getId())) {
					needsClosing = true;
					openMemory(mem.getId());
				}
				ITmEngine engine = openEngines.get(mem.getId());
				File tmx = new File(json.getString("tmx"));
				Set<String> langSet = Collections.synchronizedSortedSet(new TreeSet<>());
				if (json.has("languages")) {
					JSONArray langs = json.getJSONArray("languages");
					for (int i = 0; i < langs.length(); i++) {
						langSet.add(langs.getString(i));
					}
				}
				engine.exportMemory(tmx.getAbsolutePath(), langSet, json.getString("srcLang"));
				if (needsClosing) {
					closeMemory(mem.getId());
				}
				openTasks.put(process, new String[] { Constants.COMPLETED });
			} catch (IOException | SAXException | ParserConfigurationException | SQLException e) {
				logger.log(Level.ERROR, e.getMessage(), e);
				openTasks.put(process, new String[] { Constants.ERROR, e.getMessage() });
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
				openTasks = new ConcurrentHashMap<>();
			}
			openTasks.put(process, new String[] { Constants.PROCESSING });
			new Thread(() -> {
				try {
					JSONArray array = json.getJSONArray("memories");
					for (int i = 0; i < array.length(); i++) {
						Memory mem = memories.get(array.getString(i));
						if (openEngines != null && openEngines.contains(mem.getId())) {
							ITmEngine engine = openEngines.get(mem.getId());
							engine.close();
							openEngines.remove(mem.getId());
						}
						try {
							File wfolder = new File(getWorkFolder(), mem.getId());
							TmsServer.deleteFolder(wfolder.getAbsolutePath());
						} catch (IOException ioe) {
							logger.log(Level.WARNING, "Folder '" + mem.getId() + "' will be deleted on next start");
						}
						memories.remove(mem.getId());
					}
					saveMemoriesList();
					openTasks.put(process, new String[] { Constants.COMPLETED });
				} catch (IOException | SQLException e) {
					logger.log(Level.ERROR, e.getMessage(), e);
					openTasks.put(process, new String[] { Constants.ERROR, e.getMessage() });
				}
			}).start();
		} else {
			result.put(Constants.REASON, "Missing 'memories' parameter");
		}
		return result;
	}

	private static JSONObject listMemories(String request) throws IOException {
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
		memories = new ConcurrentHashMap<>();
		File home = new File(getWorkFolder());
		File list = new File(home, "memories.json");
		if (!list.exists()) {
			return;
		}
		StringBuffer buffer = new StringBuffer();
		try (FileReader input = new FileReader(list)) {
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

	private static void openMemory(String id) throws IOException, SQLException {
		if (memories == null) {
			loadMemoriesList();
		}
		if (openEngines == null) {
			openEngines = new ConcurrentHashMap<>();
		}
		if (openEngines.contains(id)) {
			return;
		}
		openEngines.put(id, new InternalDatabase(id, getWorkFolder()));
	}

	public static void closeMemory(String id) throws IOException, SQLException {
		if (openEngines == null) {
			openEngines = new ConcurrentHashMap<>();
			logger.log(Level.WARNING, "Closing memory when 'openEngine' is null");
		}
		if (!openEngines.contains(id)) {
			return;
		}
		openEngines.get(id).close();
	}

	public static ITmEngine open(String memory) throws IOException, SQLException {
		if (memories == null) {
			loadMemoriesList();
		}
		Memory mem = memories.get(memory);
		if (openEngines == null) {
			openEngines = new ConcurrentHashMap<>();
		}
		boolean wasOpen = openEngines.containsKey(mem.getId());
		if (!wasOpen) {
			openMemory(mem.getId());
		}
		return openEngines.get(mem.getId());
	}

	public static String getName(String memory) throws IOException {
		if (memories == null) {
			loadMemoriesList();
		}
		return memories.get(memory).getName();
	}
}
