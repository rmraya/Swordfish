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
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import com.maxprograms.converters.Convert;
import com.maxprograms.converters.FileFormats;
import com.maxprograms.languages.Language;
import com.maxprograms.languages.LanguageUtils;
import com.maxprograms.swordfish.models.Project;
import com.maxprograms.swordfish.models.SourceFile;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import org.json.JSONArray;
import org.json.JSONObject;

public class ProjectsHandler implements HttpHandler {

	private static Logger logger = System.getLogger(ProjectsHandler.class.getName());
	private static ConcurrentHashMap<String, Project> projects;
	private static boolean firstRun = true;

	protected boolean converting;
	protected String conversionError = "";
	private String srxFile;
	private String catalogFile;
	@Override
	public void handle(HttpExchange exchange) throws IOException {
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
			logger.log(Level.ERROR, "Error processing projects " + exchange.getRequestURI().toString(), e);
		}
	}

	private JSONObject processRequest(String url, String request) {
		JSONObject response = new JSONObject();
		try {
			if ("/projects/create".equals(url)) {
				response = createProject(request);
			} else if ("/projects/update".equals(url)) {
				response = updateProject(request);
			} else if ("/projects/list".equals(url)) {
				response = listProjects(request);
			} else if ("/projects/delete".equals(url)) {
				response = deleteProject(request);
			} else if ("/projects/export".equals(url)) {
				response = exportProject(request);
			} else if ("/projects/status".equals(url)) {
				response = getProcessStatus(request);
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

	private JSONObject getProcessStatus(String request) {
		return null;
	}

	private JSONObject exportProject(String request) {
		return null;
	}

	private JSONObject deleteProject(String request) {
		return null;
	}

	private JSONObject listProjects(String request) {
		JSONObject result = new JSONObject();
		JSONArray array = new JSONArray();
		result.put("projects", array);
		if (projects == null) {
			try {
				loadProjectsList();
			} catch (IOException e) {
				logger.log(Level.ERROR, "Error loading project list", e);
				result.put(Constants.REASON, e.getMessage());
				return result;
			}
		}
		List<Project> list = new ArrayList<>();
		list.addAll(projects.values());
		Collections.sort(list);
		Iterator<Project> it = list.iterator();
		while (it.hasNext()) {
			Project p = it.next();
			array.put(new JSONObject(p.toJSON()));
		}
		return result;
	}

	private void loadProjectsList() throws IOException {
		projects = new ConcurrentHashMap<>();
		File home = getWorkFolder();
		File list = new File(home, "projects.json");
		if (!list.exists()) {
			try (FileOutputStream out = new FileOutputStream(list)) {
				out.write("{\"projects\":[]}".getBytes(StandardCharsets.UTF_8));
			}
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
		JSONArray array = json.getJSONArray("projects");
		for (int i = 0; i < array.length(); i++) {
			JSONObject project = array.getJSONObject(i);
			projects.put(project.getString("id"), new Project(project.toString()));
		}
		if (firstRun) {
			firstRun = false;
			new Thread(() -> {
				try {
					File[] filesList = home.listFiles();
					for (int i = 0; i < filesList.length; i++) {
						if (filesList[i].isDirectory() && !projects.containsKey(filesList[i].getName())) {
							TmsServer.deleteFolder(filesList[i].getAbsolutePath());
						}
					}
				} catch (IOException e) {
					logger.log(Level.WARNING, "Error deleting folder", e);
				}
			}).start();
		}
	}

	private synchronized void saveProjectsList() throws IOException {
		File home = getWorkFolder();
		File list = new File(home, "projects.json");
		try (FileOutputStream out = new FileOutputStream(list)) {
			out.write("{\"projects\":[".getBytes(StandardCharsets.UTF_8));
			Enumeration<String> keys = projects.keys();
			boolean first = true;
			while (keys.hasMoreElements()) {
				if (!first) {
					out.write(",\n".getBytes(StandardCharsets.UTF_8));
				}
				String key = keys.nextElement();
				out.write(projects.get(key).toJSON().toString().getBytes(StandardCharsets.UTF_8));
				first = false;
			}
			out.write("]}".getBytes(StandardCharsets.UTF_8));
		}
	}

	private JSONObject updateProject(String request) {
		return null;
	}

	private JSONObject createProject(String request) {
		JSONObject result = new JSONObject();
		if (projects == null) {
			try {
				loadProjectsList();
			} catch (IOException e) {
				logger.log(Level.ERROR, "Error loading project list", e);
				result.put(Constants.REASON, e.getMessage());
				return result;
			}
		}
		JSONObject json = new JSONObject(request);
		JSONArray files = json.getJSONArray("files");
		conversionError = "";
		converting = true;

		String id = "" + System.currentTimeMillis();
		try {
			loadPreferences();
			Language sourceLang = LanguageUtils.getLanguage(json.getString("srcLang"));
			Language targetLang = LanguageUtils.getLanguage(json.getString("tgtLang"));

			Date dueDate = new Date();

			Project p = new Project(id, json.getString("description"), Project.NEW, sourceLang, targetLang,
					json.getString("client"), json.getString("subject"), new Date(), dueDate, null);

			File projectFolder = new File(getWorkFolder(), id);
			Files.createDirectories(projectFolder.toPath());
			List<SourceFile> sourceFiles = new ArrayList<>();
			Thread thread = new Thread() {
				@Override
				public void run() {
					try {
						for (int i = 0; i < files.length(); i++) {
							JSONObject file = files.getJSONObject(i);
							SourceFile sf = new SourceFile(file.getString("file"), FileFormats.getFullName(file.getString("type")),
									file.getString("encoding"));
							sourceFiles.add(sf);

							if (!FileFormats.XLIFF.equals(file.getString("type"))) {
								File source = new File(file.getString("file"));
								File xliff = new File(projectFolder, source.getName() + ".xlf");
								File skl = new File(projectFolder, source.getName() + ".skl");
								Map<String, String> params = new HashMap<>();
								params.put("source", source.getAbsolutePath());
								params.put("xliff", xliff.getAbsolutePath());
								params.put("skeleton", skl.getAbsolutePath());
								params.put("format", sf.getType());
								params.put("catalog", catalogFile);
								params.put("srcEncoding", sf.getEncoding());
								params.put("paragraph", "no");
								params.put("srxFile", srxFile);
								params.put("srcLang", json.getString("srcLang"));
								params.put("tgtLang", json.getString("tgtLang"));
								List<String> res = Convert.run(params);
								if (!"0".equals(res.get(0))) {
									logger.log(Level.INFO, file.toString(2));
									throw new IOException(res.get(1));
								}
							}

						}
						p.setFiles(sourceFiles);
						projects.put(id, p);
						saveProjectsList();
					} catch (IOException e) {
						logger.log(Level.ERROR, e.getMessage(), e);
						conversionError = e.getMessage();
					}
					converting = false;
				}
			};
			thread.start();
			result.put(Constants.STATUS, Constants.SUCCESS);
		} catch (IOException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.STATUS, Constants.ERROR);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private void loadPreferences() throws IOException {
		File preferences = new File(TmsServer.getWorkFolder(), "preferences.json");
		StringBuilder builder = new StringBuilder();
		try (FileReader reader = new FileReader(preferences)) {
			try (BufferedReader buffer = new BufferedReader(reader)) {
				String line = "";
				while((line = buffer.readLine()) != null) {
					builder.append(line);
				}
			}
		}
		JSONObject json = new JSONObject(builder.toString());
		srxFile = json.getString("srx");
		catalogFile = json.getString("catalog");
	}

	private static File getWorkFolder() throws IOException {
		File home = TmsServer.getWorkFolder();
		File workFolder = new File(home, "projects");
		if (!workFolder.exists()) {
			Files.createDirectories(workFolder.toPath());
		}
		return workFolder;
	}
}
