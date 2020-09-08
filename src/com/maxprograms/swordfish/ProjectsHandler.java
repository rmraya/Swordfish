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
import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.SortedSet;
import java.util.TreeSet;
import java.util.zip.DataFormatException;

import javax.xml.parsers.ParserConfigurationException;

import com.maxprograms.converters.Convert;
import com.maxprograms.converters.FileFormats;
import com.maxprograms.converters.Join;
import com.maxprograms.languages.Language;
import com.maxprograms.languages.LanguageUtils;
import com.maxprograms.swordfish.models.Project;
import com.maxprograms.swordfish.models.SourceFile;
import com.maxprograms.swordfish.mt.MT;
import com.maxprograms.swordfish.xliff.Skeletons;
import com.maxprograms.swordfish.xliff.XliffStore;
import com.maxprograms.swordfish.xliff.XliffUtils;
import com.maxprograms.xliff2.Resegmenter;
import com.maxprograms.xliff2.ToXliff2;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.xml.sax.SAXException;

public class ProjectsHandler implements HttpHandler {

	private static Logger logger = System.getLogger(ProjectsHandler.class.getName());
	private static Hashtable<String, Project> projects;
	private static Map<String, String> processes;
	private static boolean firstRun = true;
	protected JSONObject projectsList;

	private String srxFile;
	private String catalogFile;
	private boolean paragraphSegmentation;

	private Hashtable<String, XliffStore> projectStores;
	private boolean shouldClose;

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
		if (TmsServer.isDebug()) {
			logger.log(Level.INFO, url);
		}
		JSONObject response = new JSONObject();
		try {
			if ("/projects/create".equals(url)) {
				response = createProject(request);
			} else if ("/projects/list".equals(url)) {
				response = listProjects(request);
			} else if ("/projects/get".equals(url)) {
				response = getProject(request);
			} else if ("/projects/delete".equals(url)) {
				response = deleteProjects(request);
			} else if ("/projects/translations".equals(url)) {
				response = exportTranslations(request);
			} else if ("/projects/export".equals(url)) {
				response = export(request);
			} else if ("/projects/import".equals(url)) {
				response = importXliff(request);
			} else if ("/projects/status".equals(url)) {
				response = getProcessStatus(request);
			} else if ("/projects/close".equals(url)) {
				response = closeProject(request);
			} else if ("/projects/files".equals(url)) {
				response = getProjectFiles(request);
			} else if ("/projects/segments".equals(url)) {
				response = getSegments(request);
			} else if ("/projects/count".equals(url)) {
				response = getSegmentsCount(request);
			} else if ("/projects/save".equals(url)) {
				response = save(request);
			} else if ("/projects/matches".equals(url)) {
				response = getMatches(request);
			} else if ("/projects/machineTranslate".equals(url)) {
				response = machineTranslate(request);
			} else if ("/projects/tmTranslate".equals(url)) {
				response = tmTranslate(request);
			} else if ("/projects/tmTranslateAll".equals(url)) {
				response = tmTranslateAll(request);
			} else if ("/projects/projectMemories".equals(url)) {
				response = getProjectMemories(request);
			} else if ("/projects/setMemory".equals(url)) {
				response = setProjectMemory(request);
			} else if ("/projects/exportTmx".equals(url)) {
				response = exportTMX(request);
			} else if ("/projects/removeTranslations".equals(url)) {
				response = removeTranslations(request);
			} else if ("/projects/unconfirmTranslations".equals(url)) {
				response = unconfirmTranslations(request);
			} else if ("/projects/pseudoTranslate".equals(url)) {
				response = pseudoTranslate(request);
			} else if ("/projects/copyAllSources".equals(url)) {
				response = copyAllSources(request);
			} else if ("/projects/confirmAllTranslations".equals(url)) {
				response = confirmAllTranslations(request);
			} else if ("/projects/acceptAll100Matches".equals(url)) {
				response = acceptAll100Matches(request);
			} else if ("/projects/generateStatistics".equals(url)) {
				response = generateStatistics(request);
			} else if ("/projects/replaceText".equals(url)) {
				response = replaceText(request);
			} else if ("/projects/applyMtAll".equals(url)) {
				response = applyMtAll(request);
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

	private JSONObject getProject(String request) {
		JSONObject json = new JSONObject(request);
		if (!projects.containsKey(json.getString("project"))) {
			JSONObject result = new JSONObject();
			result.put(Constants.REASON, "Project does not exist");
			return result;
		}
		return projects.get(json.getString("project")).toJSON();
	}

	private JSONObject getProjectFiles(String request) {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		if (!projects.containsKey(json.getString("project"))) {
			result.put(Constants.REASON, "Project does not exist");
			return result;
		}
		Project project = projects.get(json.getString("project"));
		JSONArray filesArray = new JSONArray();
		List<SourceFile> files = project.getFiles();
		Iterator<SourceFile> it = files.iterator();
		while (it.hasNext()) {
			filesArray.put(it.next().getFile());
		}
		result.put("files", filesArray);
		return result;
	}

	private JSONObject getProcessStatus(String request) {
		JSONObject json = new JSONObject(request);
		JSONObject result = new JSONObject();
		if (processes == null) {
			processes = new Hashtable<>();
		}
		String status = processes.get(json.getString("process"));
		if (status == null) {
			result.put("progress", Constants.ERROR);
			result.put(Constants.REASON, "Null process");
		} else if (Constants.COMPLETED.equals(status)) {
			result.put("progress", Constants.COMPLETED);
		} else if (Constants.PROCESSING.equals(status)) {
			result.put("progress", Constants.PROCESSING);
		} else {
			result.put("progress", Constants.ERROR);
			result.put(Constants.REASON, status);
		}
		return result;
	}

	private JSONObject exportTranslations(String request) {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		String project = json.getString("project");
		String output = json.getString("output");
		if (projectStores == null) {
			projectStores = new Hashtable<>();
			if (TmsServer.isDebug()) {
				logger.log(Level.INFO, "Created store map");
			}
		}
		shouldClose = false;
		if (!projectStores.containsKey(project)) {
			shouldClose = true;
			try {
				Project prj = projects.get(project);
				XliffStore store = new XliffStore(prj.getXliff(), prj.getSourceLang().getCode(),
						prj.getTargetLang().getCode());
				projectStores.put(project, store);
			} catch (SAXException | IOException | ParserConfigurationException | URISyntaxException | SQLException e) {
				logger.log(Level.ERROR, "Error creating project store", e);
				result.put(Constants.REASON, e.getMessage());
				return result;
			}
		}
		String id = "" + System.currentTimeMillis();
		result.put("process", id);
		if (processes == null) {
			processes = new Hashtable<>();
		}
		processes.put(id, Constants.PROCESSING);
		try {
			Thread thread = new Thread() {
				@Override
				public void run() {
					try {
						projectStores.get(project).exportTranslations(output);
						if (shouldClose) {
							closeProject(request);
						}
						processes.put(id, Constants.COMPLETED);
					} catch (IOException | SAXException | ParserConfigurationException | SQLException e) {
						logger.log(Level.ERROR, e);
						processes.put(id, e.getMessage());
					}
				}
			};
			thread.start();
		} catch (Exception e) {
			logger.log(Level.ERROR, "Error exporting translations", e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject export(String request) {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		String project = json.getString("project");
		String output = json.getString("output");
		if (projectStores == null) {
			projectStores = new Hashtable<>();
			if (TmsServer.isDebug()) {
				logger.log(Level.INFO, "Created store map");
			}
		}
		shouldClose = false;
		if (!projectStores.containsKey(project)) {
			shouldClose = true;
			try {
				Project prj = projects.get(project);
				XliffStore store = new XliffStore(prj.getXliff(), prj.getSourceLang().getCode(),
						prj.getTargetLang().getCode());
				projectStores.put(project, store);
			} catch (SAXException | IOException | ParserConfigurationException | URISyntaxException | SQLException e) {
				logger.log(Level.ERROR, "Error creating project store", e);
				result.put(Constants.REASON, e.getMessage());
				return result;
			}
		}
		String id = "" + System.currentTimeMillis();
		result.put("process", id);
		if (processes == null) {
			processes = new Hashtable<>();
		}
		processes.put(id, Constants.PROCESSING);
		try {
			Thread thread = new Thread() {
				@Override
				public void run() {
					try {
						projectStores.get(project).exportXliff(output);
						if (shouldClose) {
							closeProject(request);
						}
						processes.put(id, Constants.COMPLETED);
					} catch (IOException | SAXException | ParserConfigurationException | SQLException
							| URISyntaxException e) {
						logger.log(Level.ERROR, e);
						processes.put(id, e.getMessage());
					}
				}
			};
			thread.start();
		} catch (Exception e) {
			logger.log(Level.ERROR, "Error exporting translations", e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject exportTMX(String request) {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		String project = json.getString("project");
		String output = json.getString("output");
		if (projectStores == null) {
			projectStores = new Hashtable<>();
			if (TmsServer.isDebug()) {
				logger.log(Level.INFO, "Created store map");
			}
		}
		shouldClose = false;
		if (!projectStores.containsKey(project)) {
			shouldClose = true;
			try {
				Project prj = projects.get(project);
				XliffStore store = new XliffStore(prj.getXliff(), prj.getSourceLang().getCode(),
						prj.getTargetLang().getCode());
				projectStores.put(project, store);
			} catch (SAXException | IOException | ParserConfigurationException | URISyntaxException | SQLException e) {
				logger.log(Level.ERROR, "Error creating project store", e);
				result.put(Constants.REASON, e.getMessage());
				return result;
			}
		}
		String id = "" + System.currentTimeMillis();
		result.put("process", id);
		if (processes == null) {
			processes = new Hashtable<>();
		}
		processes.put(id, Constants.PROCESSING);
		try {
			Thread thread = new Thread() {
				@Override
				public void run() {
					try {
						projectStores.get(project).exportTMX(output);
						if (shouldClose) {
							closeProject(request);
						}
						processes.put(id, Constants.COMPLETED);
					} catch (IOException | SAXException | ParserConfigurationException | SQLException e) {
						logger.log(Level.ERROR, e);
						processes.put(id, e.getMessage());
					}
				}
			};
			thread.start();
		} catch (Exception e) {
			logger.log(Level.ERROR, "Error exporting TMX", e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject deleteProjects(String request) {
		JSONObject result = new JSONObject();
		try {
			JSONObject json = new JSONObject(request);
			JSONArray projects = json.getJSONArray("projects");
			for (int i = 0; i < projects.length(); i++) {
				String project = projects.getString(i);
				if (projectStores != null && projectStores.containsKey(project)) {
					XliffStore store = projectStores.get(project);
					store.close();
					projectStores.remove(project);
				}
				TmsServer.deleteFolder(new File(getWorkFolder(), project).getAbsolutePath());
				removeFromList(project);
			}
			saveProjectsList();
		} catch (IOException | SQLException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private void removeFromList(String id) {
		JSONArray array = projectsList.getJSONArray("projects");
		for (int i = 0; i < array.length(); i++) {
			JSONObject project = array.getJSONObject(i);
			if (project.get("id").equals(id)) {
				array.remove(i);
				break;
			}
		}
	}

	private JSONObject listProjects(String request) {
		JSONObject result = new JSONObject();
		if (projectsList == null) {
			try {
				loadProjectsList();
			} catch (IOException e) {
				logger.log(Level.ERROR, "Error loading project list", e);
				result.put(Constants.REASON, e.getMessage());
				return result;
			}
		}
		JSONArray array = projectsList.getJSONArray("projects");
		for (int i = 0; i < array.length(); i++) {
			int status = array.getJSONObject(i).getInt("status");
			array.getJSONObject(i).put("svg", XliffUtils.makeSVG(status));
		}
		result.put("projects", array);
		return result;
	}

	private void loadProjectsList() throws IOException {
		projects = new Hashtable<>();
		File home = getWorkFolder();
		File list = new File(home, "projects.json");
		if (!list.exists()) {
			JSONObject json = new JSONObject();
			json.put("projects", new JSONArray());
			try (FileOutputStream out = new FileOutputStream(list)) {
				out.write(json.toString(2).getBytes(StandardCharsets.UTF_8));
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
		projectsList = new JSONObject(buffer.toString());
		JSONArray array = projectsList.getJSONArray("projects");
		for (int i = 0; i < array.length(); i++) {
			JSONObject project = array.getJSONObject(i);
			projects.put(project.getString("id"), new Project(project));
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
		byte[] bytes = projectsList.toString(2).getBytes(StandardCharsets.UTF_8);
		try (FileOutputStream out = new FileOutputStream(list)) {
			out.write(bytes);
		}
	}

	private JSONObject getSegments(String request) {
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
		String project = json.getString("project");
		if (project == null) {
			logger.log(Level.ERROR, "Null project requested");
			result.put(Constants.REASON, "Null project requested");
			return result;
		}
		if (projectStores == null) {
			projectStores = new Hashtable<>();
			if (TmsServer.isDebug()) {
				logger.log(Level.INFO, "Created store map");
			}
		}

		if (!projectStores.containsKey(project)) {
			try {
				Project prj = projects.get(project);
				XliffStore store = new XliffStore(prj.getXliff(), prj.getSourceLang().getCode(),
						prj.getTargetLang().getCode());
				projectStores.put(project, store);
			} catch (SAXException | IOException | ParserConfigurationException | URISyntaxException | SQLException e) {
				logger.log(Level.ERROR, "Error creating project store", e);
				result.put(Constants.REASON, e.getMessage());
				return result;
			}
		}
		XliffStore store = projectStores.get(project);
		if (store == null) {
			logger.log(Level.ERROR, "Store is null");
			result.put(Constants.REASON, "Store is null");
			return result;
		}
		String filterText = json.getString("filterText");
		String filterLanguage = json.getString("filterLanguage");
		boolean caseSensitiveFilter = json.getBoolean("caseSensitiveFilter");
		boolean regExp = json.getBoolean("regExp");
		boolean showUntranslated = json.getBoolean("showUntranslated");
		boolean showTranslated = json.getBoolean("showTranslated");
		boolean showConfirmed = json.getBoolean("showConfirmed");
		try {
			List<JSONObject> list = store.getSegments(json.getInt("start"), json.getInt("count"), filterText,
					filterLanguage, caseSensitiveFilter, regExp, showUntranslated, showTranslated, showConfirmed);
			JSONArray array = new JSONArray();
			Iterator<JSONObject> it = list.iterator();
			while (it.hasNext()) {
				array.put(it.next());
			}
			result.put("segments", array);
		} catch (IOException | SAXException | ParserConfigurationException | SQLException | DataFormatException e) {
			logger.log(Level.ERROR, "Error loading segments", e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject getSegmentsCount(String request) {
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
		String project = json.getString("project");
		if (project == null) {
			logger.log(Level.ERROR, "Null project requested");
			result.put(Constants.REASON, "Null project requested");
			return result;
		}
		if (projectStores == null) {
			projectStores = new Hashtable<>();
			if (TmsServer.isDebug()) {
				logger.log(Level.INFO, "Created store map");
			}
		}

		if (!projectStores.containsKey(project)) {
			try {
				Project prj = projects.get(project);
				XliffStore store = new XliffStore(prj.getXliff(), prj.getSourceLang().getCode(),
						prj.getTargetLang().getCode());
				projectStores.put(project, store);
			} catch (SAXException | IOException | ParserConfigurationException | URISyntaxException | SQLException e) {
				logger.log(Level.ERROR, "Error creating project store", e);
				result.put(Constants.REASON, e.getMessage());
				return result;
			}
		}

		XliffStore store = projectStores.get(project);
		if (store == null) {
			logger.log(Level.ERROR, "Store is null");
			result.put(Constants.REASON, "Store is null");
			return result;
		}
		try {
			result.put("count", store.size());
			result.put("statistics", projectStores.get(project).getTranslationStatus());
		} catch (SQLException sql) {
			logger.log(Level.ERROR, "Error retrieving count", sql);
			result.put(Constants.REASON, sql.getMessage());
		}
		return result;
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

		SortedSet<String> filesList = new TreeSet<>();
		for (int i = 0; i < files.length(); i++) {
			filesList.add(files.getJSONObject(i).getString("file"));
		}
		String filesRoot = Join.findTreeRoot(filesList);

		String id = "" + System.currentTimeMillis();
		result.put("process", id);
		if (processes == null) {
			processes = new Hashtable<>();
		}
		processes.put(id, Constants.PROCESSING);
		try {
			loadPreferences();
			String description = json.getString("description");
			String userHome = System.getProperty("user.home");
			if (description.startsWith(userHome)) {
				description = description.substring(userHome.length() + 1);
			}
			Language sourceLang = LanguageUtils.getLanguage(json.getString("srcLang"));
			Language targetLang = LanguageUtils.getLanguage(json.getString("tgtLang"));

			Project p = new Project(id, description, Project.NEW, sourceLang, targetLang, json.getString("client"),
					json.getString("subject"), LocalDate.now());

			File projectFolder = new File(getWorkFolder(), id);
			Files.createDirectories(projectFolder.toPath());
			List<SourceFile> sourceFiles = new ArrayList<>();
			Thread thread = new Thread() {
				@Override
				public void run() {
					try {
						List<String> xliffs = new ArrayList<>();
						for (int i = 0; i < files.length(); i++) {
							JSONObject file = files.getJSONObject(i);
							String fullName = file.getString("file");
							String shortName = fullName.substring(filesRoot.length());
							if (shortName.startsWith("/") || shortName.startsWith("\\")) {
								shortName = shortName.substring(1);
							}
							SourceFile sf = new SourceFile(shortName, FileFormats.getFullName(file.getString("type")),
									file.getString("encoding"));
							sourceFiles.add(sf);

							boolean paragraph = paragraphSegmentation;
							boolean mustResegment = false;
							if (!paragraphSegmentation && !FileFormats.isBilingual(sf.getType())) {
								mustResegment = true;
								paragraph = true;
							}

							File source = new File(fullName);
							File xliff = new File(projectFolder, shortName + ".xlf");
							if (!xliff.getParentFile().exists()) {
								Files.createDirectories(xliff.getParentFile().toPath());
							}
							File skl = new File(projectFolder, shortName + ".skl");

							Map<String, String> params = new HashMap<>();
							params.put("source", source.getAbsolutePath());
							params.put("xliff", xliff.getAbsolutePath());
							params.put("skeleton", skl.getAbsolutePath());
							params.put("format", sf.getType());
							params.put("catalog", catalogFile);
							params.put("srcEncoding", sf.getEncoding());
							params.put("paragraph", paragraph ? "yes" : "no");
							params.put("srxFile", srxFile);
							params.put("srcLang", json.getString("srcLang"));
							params.put("tgtLang", json.getString("tgtLang"));

							List<String> res = Convert.run(params);

							if ("0".equals(res.get(0))) {
								res = ToXliff2.run(xliff, catalogFile);
								if (mustResegment && "0".equals(res.get(0))) {
									res = Resegmenter.run(xliff.getAbsolutePath(), srxFile, json.getString("srcLang"),
											catalogFile);
								}
							}
							if (!"0".equals(res.get(0))) {
								if (TmsServer.isDebug()) {
									logger.log(Level.INFO, "Conversion failed for: " + file.toString(2));
								}
								try {
									TmsServer.deleteFolder(projectFolder.getAbsolutePath());
								} catch (IOException e) {
									logger.log(Level.ERROR, e);
								}
								throw new IOException(res.get(1));
							}
							xliffs.add(xliff.getAbsolutePath());

						}
						if (xliffs.size() > 1) {
							File main = new File(projectFolder, p.getId() + ".xlf");
							Join.join(xliffs, main.getAbsolutePath());
							for (int i = 0; i < xliffs.size(); i++) {
								File x = new File(xliffs.get(i));
								Files.delete(x.toPath());
							}
							p.setXliff(main.getAbsolutePath());
						} else {
							p.setXliff(xliffs.get(0));
						}
						ServicesHandler.addClient(json.getString("client"));
						ServicesHandler.addSubject(json.getString("subject"));
						if (!p.getDescription().endsWith(sourceFiles.get(0).getFile())) {
							ServicesHandler.addProject(p.getDescription());
						}

						p.setFiles(sourceFiles);
						projects.put(id, p);
						projectsList.getJSONArray("projects").put(p.toJSON());
						saveProjectsList();
						processes.put(id, Constants.COMPLETED);
					} catch (IOException | SAXException | ParserConfigurationException e) {
						logger.log(Level.ERROR, e.getMessage(), e);
						processes.put(id, e.getMessage());
					}
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
				while ((line = buffer.readLine()) != null) {
					builder.append(line);
				}
			}
		}
		JSONObject json = new JSONObject(builder.toString());
		srxFile = json.getString("srx");
		catalogFile = json.getString("catalog");
		paragraphSegmentation = json.getBoolean("paragraphSegmentation");
	}

	private static File getWorkFolder() throws IOException {
		File home = TmsServer.getWorkFolder();
		File workFolder = new File(home, "projects");
		if (!workFolder.exists()) {
			Files.createDirectories(workFolder.toPath());
		}
		return workFolder;
	}

	private JSONObject closeProject(String request) {
		JSONObject result = new JSONObject();
		if (projects == null) {
			result.put(Constants.REASON, "Project list not loaded");
			return result;
		}
		if (projectStores == null) {
			result.put(Constants.REASON, "Projects map is null");
			return result;
		}
		JSONObject json = new JSONObject(request);
		String project = json.getString("project");
		if (projectStores.containsKey(project)) {
			try {
				XliffStore prj = projectStores.get(project);
				projectStores.remove(project);
				prj.close();
			} catch (Exception e) {
				logger.log(Level.ERROR, e);
				result.put(Constants.REASON, e.getMessage());
			}
		} else {
			result.put(Constants.REASON, "Project is not open");
		}
		return result;
	}

	private JSONObject save(String request) {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		String project = json.getString("project");
		try {
			result.put("propagated", projectStores.get(project).saveSegment(json));
			result.put("statistics", projectStores.get(project).getTranslationStatus());
			JSONObject status = projectStores.get(project).getTranslationStatus();
			updateProjectStatus(project, status.getInt("percentage"));
		} catch (IOException | SQLException | SAXException | ParserConfigurationException | DataFormatException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private void updateProjectStatus(String projectId, int status) throws IOException {
		JSONArray array = projectsList.getJSONArray("projects");
		for (int i = 0; i < array.length(); i++) {
			JSONObject project = array.getJSONObject(i);
			if (project.getString("id").equals(projectId)) {
				int value = project.getInt("status");
				if (value != status) {
					array.getJSONObject(i).put("status", status);
					projectsList.put("projects", array);
					saveProjectsList();
				}
				break;
			}
		}
	}

	private JSONObject getMatches(String request) {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		String project = json.getString("project");
		try {
			if (projectStores.containsKey(project)) {
				result.put("matches", projectStores.get(project).getTaggedtMatches(json));
			}
		} catch (SQLException | SAXException | IOException | ParserConfigurationException | JSONException
				| DataFormatException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject machineTranslate(String request) {
		JSONObject result = new JSONObject();
		try {
			MT translator = new MT();
			if (!translator.hasEngines()) {
				result.put(Constants.REASON, "MT engines not enabled");
				return result;
			}
			JSONObject json = new JSONObject(request);
			String project = json.getString("project");
			if (projectStores.containsKey(project)) {
				result.put("matches", projectStores.get(project).machineTranslate(json, translator));
			}
		} catch (IOException | SQLException | JSONException | SAXException | ParserConfigurationException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		} catch (InterruptedException e) {
			logger.log(Level.WARNING, "MT interrupted", e);
			Thread.currentThread().interrupt();
		}
		return result;
	}

	private JSONObject tmTranslate(String request) {
		JSONObject result = new JSONObject();
		try {
			JSONObject json = new JSONObject(request);
			String project = json.getString("project");
			if (projectStores.containsKey(project)) {
				result.put("matches", projectStores.get(project).tmTranslate(json));
			}
		} catch (IOException | SQLException | JSONException | SAXException | ParserConfigurationException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject tmTranslateAll(String request) {
		JSONObject result = new JSONObject();
		try {
			JSONObject json = new JSONObject(request);
			String project = json.getString("project");
			String memory = json.getString("memory");
			if (projectStores.containsKey(project)) {
				projectStores.get(project).tmTranslateAll(memory);
			}
		} catch (IOException | SQLException | JSONException | SAXException | ParserConfigurationException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject getProjectMemories(String request) {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		try {
			result.put("memories", MemoriesHandler.getMemories());
			result.put("default", projects.get(json.getString("project")).getMemory());
		} catch (IOException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject setProjectMemory(String request) {
		JSONObject result = new JSONObject();
		try {
			JSONObject json = new JSONObject(request);
			String project = json.getString("project");
			String memory = json.getString("memory");
			projects.get(project).setMemory(memory);
			JSONArray list = projectsList.getJSONArray("projects");
			for (int i = 0; i < list.length(); i++) {
				JSONObject obj = list.getJSONObject(i);
				if (project.equals(obj.getString("id"))) {
					obj.put("memory", memory);
					break;
				}
			}
			saveProjectsList();
		} catch (IOException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject importXliff(String request) {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		String id = "" + System.currentTimeMillis();
		result.put("process", id);
		if (processes == null) {
			processes = new Hashtable<>();
		}
		processes.put(id, Constants.PROCESSING);
		try {
			String description = json.getString("project");
			File xliffFile = new File(json.getString("xliff"));
			if (!xliffFile.exists()) {
				throw new IOException("XLIFF file does not exist");
			}
			Thread thread = new Thread() {
				@Override
				public void run() {
					try {
						JSONObject details = XliffUtils.getProjectDetails(xliffFile);
						Project p = new Project(id, description, Project.NEW,
								LanguageUtils.getLanguage(details.getString("sourceLang")),
								LanguageUtils.getLanguage(details.getString("targetLang")), json.getString("client"),
								json.getString("subject"), LocalDate.now());
						p.setFiles(details.getJSONArray("files"));
						File projectFolder = new File(getWorkFolder(), id);
						Files.createDirectories(projectFolder.toPath());
						File projectXliff = new File(projectFolder, xliffFile.getName());
						Files.copy(xliffFile.toPath(), projectXliff.toPath());
						Skeletons.extractSkeletons(xliffFile, projectXliff);
						p.setXliff(projectXliff.getAbsolutePath());
						XliffStore store = new XliffStore(p.getXliff(), p.getSourceLang().getCode(),
								p.getTargetLang().getCode());
						JSONObject status = store.getTranslationStatus();
						store.close();
						p.setStatus(status.getInt("percentage"));
						ServicesHandler.addClient(json.getString("client"));
						ServicesHandler.addSubject(json.getString("subject"));
						projects.put(id, p);
						projectsList.getJSONArray("projects").put(p.toJSON());
						saveProjectsList();
						processes.put(id, Constants.COMPLETED);
					} catch (IOException | SAXException | ParserConfigurationException | URISyntaxException
							| SQLException e) {
						logger.log(Level.WARNING, e.getMessage(), e);
						processes.put(id, e.getMessage());
					}
				}
			};
			thread.start();
		} catch (IOException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.STATUS, Constants.ERROR);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject removeTranslations(String request) {
		JSONObject result = new JSONObject();
		try {
			JSONObject json = new JSONObject(request);
			String project = json.getString("project");
			if (projectStores.containsKey(project)) {
				projectStores.get(project).removeTranslations();
				JSONObject status = projectStores.get(project).getTranslationStatus();
				result.put("statistics", status);
				updateProjectStatus(project, status.getInt("percentage"));
			}
		} catch (SQLException | JSONException | SAXException | IOException | ParserConfigurationException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject unconfirmTranslations(String request) {
		JSONObject result = new JSONObject();
		try {
			JSONObject json = new JSONObject(request);
			String project = json.getString("project");
			if (projectStores.containsKey(project)) {
				projectStores.get(project).unconfirmTranslations();
				JSONObject status = projectStores.get(project).getTranslationStatus();
				result.put("statistics", status);
				updateProjectStatus(project, status.getInt("percentage"));
			}
		} catch (SQLException | JSONException | IOException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject pseudoTranslate(String request) {
		JSONObject result = new JSONObject();
		try {
			JSONObject json = new JSONObject(request);
			String project = json.getString("project");
			if (projectStores.containsKey(project)) {
				projectStores.get(project).pseudoTranslate();
				JSONObject status = projectStores.get(project).getTranslationStatus();
				result.put("statistics", status);
				updateProjectStatus(project, status.getInt("percentage"));
			}
		} catch (SQLException | JSONException | SAXException | IOException | ParserConfigurationException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject copyAllSources(String request) {
		JSONObject result = new JSONObject();
		try {
			JSONObject json = new JSONObject(request);
			String project = json.getString("project");
			if (projectStores.containsKey(project)) {
				projectStores.get(project).copyAllSources();
				JSONObject status = projectStores.get(project).getTranslationStatus();
				result.put("statistics", status);
				updateProjectStatus(project, status.getInt("percentage"));
			}
		} catch (SQLException | JSONException | SAXException | IOException | ParserConfigurationException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject confirmAllTranslations(String request) {
		JSONObject result = new JSONObject();
		try {
			JSONObject json = new JSONObject(request);
			String project = json.getString("project");
			if (projectStores.containsKey(project)) {
				projectStores.get(project).confirmAllTranslations();
				JSONObject status = projectStores.get(project).getTranslationStatus();
				result.put("statistics", status);
				updateProjectStatus(project, status.getInt("percentage"));
			}
		} catch (SQLException | JSONException | IOException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject acceptAll100Matches(String request) {
		JSONObject result = new JSONObject();
		try {
			JSONObject json = new JSONObject(request);
			String project = json.getString("project");
			if (projectStores.containsKey(project)) {
				projectStores.get(project).acceptAll100Matches();
				JSONObject status = projectStores.get(project).getTranslationStatus();
				result.put("statistics", status);
				updateProjectStatus(project, status.getInt("percentage"));
			}
		} catch (SQLException | JSONException | SAXException | IOException | ParserConfigurationException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject generateStatistics(String request) {
		JSONObject result = new JSONObject();
		try {
			JSONObject json = new JSONObject(request);
			String project = json.getString("project");
			if (projectStores == null) {
				projectStores = new Hashtable<>();
				if (TmsServer.isDebug()) {
					logger.log(Level.INFO, "Created store map");
				}
			}
			shouldClose = false;
			if (!projectStores.containsKey(project)) {
				shouldClose = true;
				try {
					Project prj = projects.get(project);
					XliffStore store = new XliffStore(prj.getXliff(), prj.getSourceLang().getCode(),
							prj.getTargetLang().getCode());
					projectStores.put(project, store);
				} catch (SAXException | IOException | ParserConfigurationException | URISyntaxException
						| SQLException e) {
					logger.log(Level.ERROR, "Error creating project store", e);
					result.put(Constants.REASON, e.getMessage());
					return result;
				}
			}
			String analysis = projectStores.get(project).generateStatistics();
			result.put("analysis", analysis);
			if (shouldClose) {
				closeProject(request);
			}
		} catch (SQLException | JSONException | SAXException | IOException | ParserConfigurationException
				| URISyntaxException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject replaceText(String request) {
		JSONObject result = new JSONObject();
		try {
			JSONObject json = new JSONObject(request);
			String project = json.getString("project");
			if (projectStores.containsKey(project)) {
				projectStores.get(project).replaceText(json);
				JSONObject status = projectStores.get(project).getTranslationStatus();
				result.put("statistics", status);
				updateProjectStatus(project, status.getInt("percentage"));
			}
		} catch (SQLException | JSONException | SAXException | IOException | ParserConfigurationException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject applyMtAll(String request) {
		JSONObject result = new JSONObject();
		try {
			MT translator = new MT();
			if (!translator.hasEngines()) {
				result.put(Constants.REASON, "MT engines not enabled");
				return result;
			}
			String id = "" + System.currentTimeMillis();
			result.put("process", id);
			if (processes == null) {
				processes = new Hashtable<>();
			}
			processes.put(id, Constants.PROCESSING);
			Thread thread = new Thread() {
				@Override
				public void run() {
					try {
						JSONObject json = new JSONObject(request);
						String project = json.getString("project");
						if (projectStores.containsKey(project)) {
							projectStores.get(project).applyMtAll(json, translator);
						}
						processes.put(id, Constants.COMPLETED);
					} catch (InterruptedException e) {
						logger.log(Level.WARNING, "MT interrupted", e);
						processes.put(id, e.getMessage());
						Thread.currentThread().interrupt();
					} catch (IOException | SQLException | JSONException | SAXException
							| ParserConfigurationException e) {
						logger.log(Level.WARNING, e.getMessage(), e);
						processes.put(id, e.getMessage());
					}
				}
			};
			thread.start();
		} catch (IOException | JSONException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}
}
