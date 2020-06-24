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
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.SortedSet;
import java.util.TreeSet;
import java.util.concurrent.ConcurrentHashMap;

import javax.xml.parsers.ParserConfigurationException;

import com.maxprograms.converters.Convert;
import com.maxprograms.converters.FileFormats;
import com.maxprograms.converters.Join;
import com.maxprograms.languages.Language;
import com.maxprograms.languages.LanguageUtils;
import com.maxprograms.swordfish.models.Project;
import com.maxprograms.swordfish.models.SourceFile;
import com.maxprograms.xliff2.Resegmenter;
import com.maxprograms.xliff2.ToXliff2;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import org.json.JSONArray;
import org.json.JSONObject;
import org.xml.sax.SAXException;

public class ProjectsHandler implements HttpHandler {

	private static Logger logger = System.getLogger(ProjectsHandler.class.getName());
	private static ConcurrentHashMap<String, Project> projects;
	private static Map<String, String> processes;
	private static boolean firstRun = true;

	protected JSONObject projectsList;

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
			} else if ("/projects/files".equals(url)) {
				response = getProjectFiles(request);
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

	private JSONObject exportProject(String request) {
		// TODO
		return new JSONObject();
	}

	private JSONObject deleteProject(String request) {
		// TODO
		return new JSONObject();
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
		return projectsList;
	}

	private void loadProjectsList() throws IOException {
		projects = new ConcurrentHashMap<>();
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

	private JSONObject updateProject(String request) {
		// TODO
		return new JSONObject();
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

		conversionError = "";
		converting = true;

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
							if (!FileFormats.XLIFF.equals(sf.getType())) {

								boolean paragraph = false;
								boolean mustResegment = false;
								if (!FileFormats.isBilingual(sf.getType())) {
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
										res = Resegmenter.run(xliff.getAbsolutePath(), srxFile,
												json.getString("srcLang"), catalogFile);
									}
								}
								if (!"0".equals(res.get(0))) {
									logger.log(Level.INFO, "Conversion failed for: " + file.toString(2));
									try {
										TmsServer.deleteFolder(projectFolder.getAbsolutePath());
									} catch (IOException e) {
										logger.log(Level.ERROR, e);
									}
									throw new IOException(res.get(1));
								}
								xliffs.add(xliff.getAbsolutePath());
							}

						}
						if (xliffs.size() > 1) {
							File main = new File(projectFolder, p.getId() + ".xlf");
							Join.join(xliffs, main.getAbsolutePath());
							for (int i=0 ; i<xliffs.size() ; i++) {
								File x = new File(xliffs.get(i));
								Files.delete(x.toPath());
							}
							p.setXliff(main.getAbsolutePath());
						} else {
							p.setXliff(xliffs.get(0));
						}
						
						p.setFiles(sourceFiles);
						projects.put(id, p);
						projectsList.getJSONArray("projects").put(p.toJSON());
						saveProjectsList();
						processes.put(id, Constants.COMPLETED);
					} catch (IOException | SAXException | ParserConfigurationException e) {
						logger.log(Level.ERROR, e.getMessage(), e);
						conversionError = e.getMessage();
						processes.put(id, conversionError);
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
				while ((line = buffer.readLine()) != null) {
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
