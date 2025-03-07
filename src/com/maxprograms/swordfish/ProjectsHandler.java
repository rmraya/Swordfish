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
import java.io.FileOutputStream;
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
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.SortedSet;
import java.util.TreeSet;
import java.util.Vector;
import java.util.zip.DataFormatException;

import javax.xml.parsers.ParserConfigurationException;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.xml.sax.SAXException;

import com.maxprograms.converters.Convert;
import com.maxprograms.converters.FileFormats;
import com.maxprograms.converters.Join;
import com.maxprograms.languages.Language;
import com.maxprograms.languages.LanguageUtils;
import com.maxprograms.swordfish.models.Project;
import com.maxprograms.swordfish.models.SourceFile;
import com.maxprograms.swordfish.xliff.Skeletons;
import com.maxprograms.swordfish.xliff.XliffStore;
import com.maxprograms.swordfish.xliff.XliffUtils;
import com.maxprograms.xliff2.Resegmenter;
import com.maxprograms.xliff2.ToXliff2;
import com.maxprograms.xml.CatalogBuilder;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

public class ProjectsHandler implements HttpHandler {

	private static Logger logger = System.getLogger(ProjectsHandler.class.getName());
	private static Map<String, JSONObject> processes = new Hashtable<>();

	private String srxFile;
	private String catalogFile;
	private boolean paragraphSegmentation;

	private static Map<String, XliffStore> projectStores = new Hashtable<>();

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
		} catch (IOException | JSONException e) {
			MessageFormat mf = new MessageFormat(Messages.getString("ProjectsHandler.0"));
			logger.log(Level.ERROR, mf.format(new String[] { exchange.getRequestURI().toString() }), e);
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
				response = listProjects();
			} else if ("/projects/get".equals(url)) {
				response = getProject(request);
			} else if ("/projects/delete".equals(url)) {
				response = deleteProjects(request);
			} else if ("/projects/translations".equals(url)) {
				response = exportTranslations(request);
			} else if ("/projects/export".equals(url)) {
				response = export(request);
			} else if ("/projects/exportReview".equals(url)) {
				response = exportReview(request);
			} else if ("/projects/importReview".equals(url)) {
				response = importReview(request);
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
			} else if ("/projects/segmentSource".equals(url)) {
				response = getSegmentSource(request);
			} else if ("/projects/setMTMatches".equals(url)) {
				response = setMTMatches(request);
			} else if ("/projects/count".equals(url)) {
				response = getSegmentsCount(request);
			} else if ("/projects/save".equals(url)) {
				response = save(request);
			} else if ("/projects/saveSource".equals(url)) {
				response = saveSource(request);
			} else if ("/projects/matches".equals(url)) {
				response = getMatches(request);
			} else if ("/projects/assembleMatches".equals(url)) {
				response = assembleMatches(request);
			} else if ("/projects/applyAmAll".equals(url)) {
				response = assembleMatchesAll(request);
			} else if ("/projects/removeAssembledMatches".equals(url)) {
				response = removeAssembledMatches(request);
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
			} else if ("/projects/exportMatches".equals((url))) {
				response = exportMatches(request);
			} else if ("/projects/exportTerms".equals((url))) {
				response = exportTerms(request);
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
			} else if ("/projects/exportHtml".equals(url)) {
				response = exportHTML(request);
			} else if ("/projects/replaceText".equals(url)) {
				response = replaceText(request);
			} else if ("/projects/applyMtAll".equals(url)) {
				response = applyMtAll(request);
			} else if ("/projects/acceptAllMT".equals(url)) {
				response = acceptAllMT(request);
			} else if ("/projects/removeMatches".equals(url)) {
				response = removeMatches(request);
			} else if ("/projects/removeMT".equals(url)) {
				response = removeMT(request);
			} else if ("/projects/setGlossary".equals(url)) {
				response = setProjectGlossary(request);
			} else if ("/projects/projectGlossaries".equals(url)) {
				response = getProjectGlossaries(request);
			} else if ("/projects/terms".equals(url)) {
				response = getTerms(request);
			} else if ("/projects/getSegmentTerms".equals(url)) {
				response = getSegmentTerms(request);
			} else if ("/projects/getProjectTerms".equals(url)) {
				response = getProjectTerms(request);
			} else if ("/projects/lockSegment".equals(url)) {
				response = lockSegment(request);
			} else if ("/projects/lockDuplicates".equals(url)) {
				response = lockDuplicates(request);
			} else if ("/projects/unlockAll".equals(url)) {
				response = unlockAll(request);
			} else if ("/projects/analyzeSpaces".equals(url)) {
				response = analyzeSpaces(request);
			} else if ("/projects/fixSpaces".equals(url)) {
				response = fixSpaces(request);
			} else if ("/projects/analyzeTags".equals(url)) {
				response = analyzeTags(request);
			} else if ("/projects/splitSegment".equals(url)) {
				response = splitSegment(request);
			} else if ("/projects/mergeSegment".equals(url)) {
				response = mergeSegment(request);
			} else if ("/projects/getNotes".equals(url)) {
				response = getNotes(request);
			} else if ("/projects/addNote".equals(url)) {
				response = addNote(request);
			} else if ("/projects/removeNote".equals(url)) {
				response = removeNote(request);
			} else {
				MessageFormat mf = new MessageFormat(Messages.getString("ProjectsHandler.1"));
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

	private JSONObject setMTMatches(String request)
			throws JSONException, SQLException, IOException, SAXException, ParserConfigurationException {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		String project = json.getString("project");
		Map<String, Project> projects = getProjects();
		if (!projects.containsKey(project)) {
			MessageFormat mf = new MessageFormat(Messages.getString("ProjectsHandler.2"));
			result.put(Constants.REASON, mf.format(new String[] { project }));
			return result;
		}
		projectStores.get(project).setMTMatches(json);
		return result;
	}

	private JSONObject getProject(String request)
			throws IOException, JSONException, SAXException, ParserConfigurationException {
		JSONObject json = new JSONObject(request);
		Map<String, Project> projects = getProjects();
		if (!projects.containsKey(json.getString("project"))) {
			JSONObject result = new JSONObject();
			MessageFormat mf = new MessageFormat(Messages.getString("ProjectsHandler.2"));
			result.put(Constants.REASON, mf.format(new String[] { json.getString("project") }));
			return result;
		}
		return projects.get(json.getString("project")).toJSON();
	}

	private JSONObject getProjectFiles(String request)
			throws JSONException, IOException, SAXException, ParserConfigurationException {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		Map<String, Project> projects = getProjects();
		if (!projects.containsKey(json.getString("project"))) {
			MessageFormat mf = new MessageFormat(Messages.getString("ProjectsHandler.2"));
			result.put(Constants.REASON, mf.format(new String[] { json.getString("project") }));
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
		JSONObject result = processes.get(json.getString("process"));
		if (result == null) {
			result = new JSONObject();
			result.put(Constants.PROGRESS, Constants.ERROR);
			result.put(Constants.REASON, "Null process");
		}
		return result;
	}

	private JSONObject exportTranslations(String request) {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		String project = json.getString("project");
		String output = json.getString("output");
		if (!projectStores.containsKey(project)) {
			try {
				Map<String, Project> projects = getProjects();
				Project prj = projects.get(project);
				XliffStore store = new XliffStore(prj.getXliff(), prj.getSourceLang().getCode(),
						prj.getTargetLang().getCode());
				projectStores.put(project, store);
			} catch (SAXException | IOException | ParserConfigurationException | URISyntaxException | SQLException e) {
				logger.log(Level.ERROR, Messages.getString("ProjectsHandler.3"), e);
				result.put(Constants.REASON, e.getMessage());
				return result;
			}
		}
		String id = "" + System.currentTimeMillis();
		result.put("process", id);
		JSONObject obj = new JSONObject();
		obj.put(Constants.PROGRESS, Constants.PROCESSING);
		processes.put(id, obj);
		try {
			Thread.ofVirtual().start(() -> {
				try {
					projectStores.get(project).exportTranslations(output);
					obj.put(Constants.PROGRESS, Constants.COMPLETED);
					processes.put(id, obj);
				} catch (Exception e) {
					logger.log(Level.ERROR, e);
					obj.put(Constants.PROGRESS, Constants.ERROR);
					obj.put(Constants.REASON, e.getMessage());
					processes.put(id, obj);
				}
			});
		} catch (Exception e) {
			logger.log(Level.ERROR, Messages.getString("ProjectsHandler.4"), e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject export(String request) {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		String project = json.getString("project");
		String output = json.getString("output");
		if (!projectStores.containsKey(project)) {
			try {
				Map<String, Project> projects = getProjects();
				Project prj = projects.get(project);
				XliffStore store = new XliffStore(prj.getXliff(), prj.getSourceLang().getCode(),
						prj.getTargetLang().getCode());
				projectStores.put(project, store);
			} catch (SAXException | IOException | ParserConfigurationException | URISyntaxException | SQLException e) {
				logger.log(Level.ERROR, Messages.getString("ProjectsHandler.5"), e);
				result.put(Constants.REASON, e.getMessage());
				return result;
			}
		}
		String id = "" + System.currentTimeMillis();
		result.put("process", id);
		JSONObject obj = new JSONObject();
		obj.put(Constants.PROGRESS, Constants.PROCESSING);
		processes.put(id, obj);
		try {
			Thread.ofVirtual().start(() -> {
				try {
					projectStores.get(project).exportXliff(output);
					obj.put(Constants.PROGRESS, Constants.COMPLETED);
					processes.put(id, obj);
				} catch (IOException | SAXException | ParserConfigurationException | SQLException e) {
					logger.log(Level.ERROR, e);
					obj.put(Constants.PROGRESS, Constants.ERROR);
					obj.put(Constants.REASON, e.getMessage());
					processes.put(id, obj);
				}
			});
		} catch (Exception e) {
			logger.log(Level.ERROR, Messages.getString("ProjectsHandler.4"), e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject importReview(String request) {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		String xliff = json.getString("xliff");
		File file = new File(xliff);
		if (!file.exists()) {
			result.put(Constants.STATUS, Constants.ERROR);
			result.put(Constants.REASON, Messages.getString("ProjectsHandler.17"));
			return result;
		}
		try {
			String project = XliffUtils.getProjectId(file);
			if (!project.isEmpty()) {
				if (!projectStores.containsKey(project)) {
					try {
						Map<String, Project> projects = getProjects();
						Project prj = projects.get(project);
						XliffStore store = new XliffStore(prj.getXliff(), prj.getSourceLang().getCode(),
								prj.getTargetLang().getCode());
						projectStores.put(project, store);
					} catch (SAXException | IOException | ParserConfigurationException | URISyntaxException
							| SQLException e) {
						logger.log(Level.ERROR, Messages.getString("ProjectsHandler.5"), e);
						result.put(Constants.REASON, e.getMessage());
						return result;
					}
				}
				String id = "" + System.currentTimeMillis();
				result.put("process", id);
				JSONObject obj = new JSONObject();
				obj.put(Constants.PROGRESS, Constants.PROCESSING);
				processes.put(id, obj);
				try {
					Thread.ofVirtual().start(() -> {
						try {
							projectStores.get(project).importXliff(xliff);
							obj.put(Constants.PROGRESS, Constants.COMPLETED);
							processes.put(id, obj);
						} catch (IOException | SAXException | ParserConfigurationException | SQLException e) {
							logger.log(Level.ERROR, e);
							obj.put(Constants.PROGRESS, Constants.ERROR);
							obj.put(Constants.REASON, e.getMessage());
							processes.put(id, obj);
						}
					});
				} catch (Exception e) {
					logger.log(Level.ERROR, Messages.getString("ProjectsHandler.4"), e);
					result.put(Constants.REASON, e.getMessage());
				}
			} else {
				result.put(Constants.STATUS, Constants.ERROR);
				result.put(Constants.REASON, Messages.getString("ProjectsHandler.18"));
				return result;
			}
		} catch (Exception e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.STATUS, Constants.ERROR);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject exportReview(String request) {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		String project = json.getString("project");
		String output = json.getString("output");
		if (!projectStores.containsKey(project)) {
			try {
				Map<String, Project> projects = getProjects();
				Project prj = projects.get(project);
				XliffStore store = new XliffStore(prj.getXliff(), prj.getSourceLang().getCode(),
						prj.getTargetLang().getCode());
				projectStores.put(project, store);
			} catch (SAXException | IOException | ParserConfigurationException | URISyntaxException | SQLException e) {
				logger.log(Level.ERROR, Messages.getString("ProjectsHandler.5"), e);
				result.put(Constants.REASON, e.getMessage());
				return result;
			}
		}
		String id = "" + System.currentTimeMillis();
		result.put("process", id);
		JSONObject obj = new JSONObject();
		obj.put(Constants.PROGRESS, Constants.PROCESSING);
		processes.put(id, obj);
		try {
			Thread.ofVirtual().start(() -> {
				try {
					projectStores.get(project).exportXliff(output);
					XliffUtils.removeSkeleton(output, project);
					obj.put(Constants.PROGRESS, Constants.COMPLETED);
					processes.put(id, obj);
				} catch (IOException | SAXException | ParserConfigurationException | SQLException e) {
					logger.log(Level.ERROR, e);
					obj.put(Constants.PROGRESS, Constants.ERROR);
					obj.put(Constants.REASON, e.getMessage());
					processes.put(id, obj);
				}
			});
		} catch (Exception e) {
			logger.log(Level.ERROR, Messages.getString("ProjectsHandler.4"), e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject exportTMX(String request) {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		String project = json.getString("project");
		String output = json.getString("output");
		if (!projectStores.containsKey(project)) {
			try {
				Map<String, Project> projects = getProjects();
				Project prj = projects.get(project);
				XliffStore store = new XliffStore(prj.getXliff(), prj.getSourceLang().getCode(),
						prj.getTargetLang().getCode());
				projectStores.put(project, store);
			} catch (SAXException | IOException | ParserConfigurationException | URISyntaxException | SQLException e) {
				logger.log(Level.ERROR, Messages.getString("ProjectsHandler.3"), e);
				result.put(Constants.REASON, e.getMessage());
				return result;
			}
		}
		String id = "" + System.currentTimeMillis();
		result.put("process", id);
		JSONObject obj = new JSONObject();
		obj.put(Constants.PROGRESS, Constants.PROCESSING);
		processes.put(id, obj);
		try {
			new Thread(() -> {
				try {
					Map<String, Project> projects = getProjects();
					Project prj = projects.get(project);
					projectStores.get(project).exportTMX(output, prj.getDescription(), prj.getClient(),
							prj.getSubject());
					obj.put(Constants.PROGRESS, Constants.COMPLETED);
					processes.put(id, obj);
				} catch (IOException | SAXException | ParserConfigurationException | SQLException e) {
					logger.log(Level.ERROR, e);
					obj.put(Constants.PROGRESS, Constants.ERROR);
					obj.put(Constants.REASON, e.getMessage());
					processes.put(id, obj);
				}
			}).start();
		} catch (Exception e) {
			logger.log(Level.ERROR, Messages.getString("ProjectsHandler.6"), e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject exportMatches(String request) {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		String project = json.getString("project");
		String output = json.getString("output");
		if (!projectStores.containsKey(project)) {
			try {
				Map<String, Project> projects = getProjects();
				Project prj = projects.get(project);
				XliffStore store = new XliffStore(prj.getXliff(), prj.getSourceLang().getCode(),
						prj.getTargetLang().getCode());
				projectStores.put(project, store);
			} catch (SAXException | IOException | ParserConfigurationException | URISyntaxException | SQLException e) {
				logger.log(Level.ERROR, Messages.getString("ProjectsHandler.3"), e);
				result.put(Constants.REASON, e.getMessage());
				return result;
			}
		}
		String id = "" + System.currentTimeMillis();
		result.put("process", id);
		JSONObject obj = new JSONObject();
		obj.put(Constants.PROGRESS, Constants.PROCESSING);
		processes.put(id, obj);
		try {
			new Thread(() -> {
				try {
					Map<String, Project> projects = getProjects();
					Project prj = projects.get(project);
					projectStores.get(project).exportMatches(output, prj.getDescription(), prj.getClient(),
							prj.getSubject());
					obj.put(Constants.PROGRESS, Constants.COMPLETED);
					processes.put(id, obj);
				} catch (IOException | SAXException | ParserConfigurationException | SQLException e) {
					logger.log(Level.ERROR, e);
					obj.put(Constants.PROGRESS, Constants.ERROR);
					obj.put(Constants.REASON, e.getMessage());
					processes.put(id, obj);
				}
			}).start();
		} catch (Exception e) {
			logger.log(Level.ERROR, Messages.getString("ProjectsHandler.6"), e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject exportTerms(String request) {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		String project = json.getString("project");
		String output = json.getString("output");
		if (!projectStores.containsKey(project)) {
			try {
				Map<String, Project> projects = getProjects();
				Project prj = projects.get(project);
				XliffStore store = new XliffStore(prj.getXliff(), prj.getSourceLang().getCode(),
						prj.getTargetLang().getCode());
				projectStores.put(project, store);
			} catch (SAXException | IOException | ParserConfigurationException | URISyntaxException | SQLException e) {
				logger.log(Level.ERROR, Messages.getString("ProjectsHandler.3"), e);
				result.put(Constants.REASON, e.getMessage());
				return result;
			}
		}
		String id = "" + System.currentTimeMillis();
		result.put("process", id);
		JSONObject obj = new JSONObject();
		obj.put(Constants.PROGRESS, Constants.PROCESSING);
		processes.put(id, obj);
		try {
			new Thread(() -> {
				try {
					Map<String, Project> projects = getProjects();
					Project prj = projects.get(project);
					projectStores.get(project).exportTerms(output, prj.getDescription(), prj.getSubject());
					obj.put(Constants.PROGRESS, Constants.COMPLETED);
					processes.put(id, obj);
				} catch (IOException | SAXException | ParserConfigurationException | SQLException e) {
					logger.log(Level.ERROR, e);
					obj.put(Constants.PROGRESS, Constants.ERROR);
					obj.put(Constants.REASON, e.getMessage());
					processes.put(id, obj);
				}
			}).start();
		} catch (Exception e) {
			logger.log(Level.ERROR, Messages.getString("ProjectsHandler.6"), e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject deleteProjects(String request) {
		JSONObject result = new JSONObject();
		try {
			JSONObject json = new JSONObject(request);
			JSONArray array = json.getJSONArray("projects");
			Map<String, Project> projects = getProjects();
			for (int i = 0; i < array.length(); i++) {
				String project = array.getString(i);
				if (projectStores.containsKey(project)) {
					XliffStore store = projectStores.get(project);
					store.close();
					projectStores.remove(project);
				}
				TmsServer.deleteFolder(new File(getWorkFolder(), project));
				projects.remove(project);
			}
			saveProjectsList(projects);
		} catch (IOException | SQLException | JSONException | SAXException | ParserConfigurationException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject listProjects() throws IOException, JSONException, SAXException, ParserConfigurationException {
		JSONObject result = new JSONObject();
		JSONArray array = new JSONArray();
		result.put("projects", array);
		Map<String, Project> projects = getProjects();
		if (!projects.isEmpty()) {
			Vector<Project> list = new Vector<>(projects.values());
			for (int i = 0; i < list.size(); i++) {
				Project project = list.get(i);
				int status = project.getStatus();
				JSONObject obj = project.toJSON();
				obj.put("svg", XliffUtils.makeSVG(status));
				array.put(obj);
			}
		}
		return result;
	}

	private static synchronized Map<String, Project> getProjects()
			throws IOException, JSONException, SAXException, ParserConfigurationException {
		Map<String, Project> projects = new Hashtable<>();
		File home = getWorkFolder();
		File list = new File(home, "projects.json");
		if (!list.exists()) {
			JSONObject json = new JSONObject();
			json.put("projects", new JSONArray());
			TmsServer.writeJSON(list, json);
			return projects;
		}
		JSONObject projectsList = TmsServer.readJSON(list);
		JSONArray array = projectsList.getJSONArray("projects");
		for (int i = 0; i < array.length(); i++) {
			Project project = new Project(array.getJSONObject(i));
			projects.put(project.getId(), project);
		}
		return projects;
	}

	private synchronized void saveProjectsList(Map<String, Project> projects) throws IOException {
		JSONObject json = new JSONObject();
		JSONArray array = new JSONArray();
		Iterator<Project> it = projects.values().iterator();
		while (it.hasNext()) {
			array.put(it.next().toJSON());
		}
		json.put("projects", array);
		File home = getWorkFolder();
		File list = new File(home, "projects.json");
		byte[] bytes = json.toString(2).getBytes(StandardCharsets.UTF_8);
		try (FileOutputStream out = new FileOutputStream(list)) {
			out.write(bytes);
		}
	}

	private JSONObject getSegmentSource(String request) {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		String project = json.getString("project");
		if (project == null) {
			logger.log(Level.ERROR, Messages.getString("ProjectsHandler.7"));
			result.put(Constants.REASON, Messages.getString("ProjectsHandler.7"));
			return result;
		}
		if (!projectStores.containsKey(project)) {
			try {
				Map<String, Project> projects = getProjects();
				Project prj = projects.get(project);
				XliffStore store = new XliffStore(prj.getXliff(), prj.getSourceLang().getCode(),
						prj.getTargetLang().getCode());
				projectStores.put(project, store);
			} catch (SAXException | IOException | ParserConfigurationException | URISyntaxException | SQLException e) {
				logger.log(Level.ERROR, Messages.getString("ProjectsHandler.3"), e);
				result.put(Constants.REASON, e.getMessage());
				return result;
			}
		}
		try {
			result = projectStores.get(project).getSegmentSource(json);
		} catch (SQLException | SAXException | IOException | ParserConfigurationException | JSONException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject getSegments(String request) {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		String project = json.getString("project");
		if (project == null) {
			logger.log(Level.ERROR, Messages.getString("ProjectsHandler.7"));
			result.put(Constants.REASON, Messages.getString("ProjectsHandler.7"));
			return result;
		}

		if (!projectStores.containsKey(project)) {
			try {
				Map<String, Project> projects = getProjects();
				Project prj = projects.get(project);
				XliffStore store = new XliffStore(prj.getXliff(), prj.getSourceLang().getCode(),
						prj.getTargetLang().getCode());
				projectStores.put(project, store);
			} catch (SAXException | IOException | ParserConfigurationException | URISyntaxException | SQLException e) {
				logger.log(Level.ERROR, Messages.getString("ProjectsHandler.3"), e);
				result.put(Constants.REASON, e.getMessage());
				return result;
			}
		}
		XliffStore store = projectStores.get(project);
		if (store == null) {
			logger.log(Level.ERROR, Messages.getString("ProjectsHandler.8"));
			result.put(Constants.REASON, Messages.getString("ProjectsHandler.8"));
			return result;
		}
		String filterText = json.getString("filterText");
		String filterLanguage = json.getString("filterLanguage");
		boolean caseSensitiveFilter = json.getBoolean("caseSensitiveFilter");
		boolean regExp = json.getBoolean("regExp");
		boolean showUntranslated = json.getBoolean("showUntranslated");
		boolean showTranslated = json.getBoolean("showTranslated");
		boolean showConfirmed = json.getBoolean("showConfirmed");
		String sortOption = json.getString("sortOption");
		boolean sortDesc = json.getBoolean("sortDesc");
		try {
			List<JSONObject> list = store.getSegments(json.getInt("start"), json.getInt("count"), filterText,
					filterLanguage, caseSensitiveFilter, regExp, showUntranslated, showTranslated, showConfirmed,
					sortOption, sortDesc);
			JSONArray array = new JSONArray();
			Iterator<JSONObject> it = list.iterator();
			while (it.hasNext()) {
				array.put(it.next());
			}
			result.put("segments", array);
		} catch (IOException | SAXException | ParserConfigurationException | DataFormatException | SQLException e) {
			logger.log(Level.ERROR, Messages.getString("ProjectsHandler.9"), e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject getSegmentsCount(String request) {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		String project = json.getString("project");
		if (!projectStores.containsKey(project)) {
			try {
				Map<String, Project> projects = getProjects();
				Project prj = projects.get(project);
				XliffStore store = new XliffStore(prj.getXliff(), prj.getSourceLang().getCode(),
						prj.getTargetLang().getCode());
				projectStores.put(project, store);
			} catch (SAXException | IOException | ParserConfigurationException | URISyntaxException | SQLException e) {
				logger.log(Level.ERROR, Messages.getString("ProjectsHandler.3"), e);
				result.put(Constants.REASON, e.getMessage());
				return result;
			}
		}
		try {
			XliffStore store = projectStores.get(project);
			result.put("count", store.size());
			result.put("statistics", store.getTranslationStatus());
		} catch (SQLException sql) {
			logger.log(Level.ERROR, Messages.getString("ProjectsHandler.10"), sql);
			result.put(Constants.REASON, sql.getMessage());
		}
		return result;
	}

	private JSONObject updateProject(String request) {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		String projectId = json.getString("project");
		if (!projectStores.containsKey(projectId)) {
			try {
				Map<String, Project> projects = getProjects();
				Project prj = projects.get(projectId);
				XliffStore store = new XliffStore(prj.getXliff(), prj.getSourceLang().getCode(),
						prj.getTargetLang().getCode());
				projectStores.put(projectId, store);
			} catch (SAXException | IOException | ParserConfigurationException | URISyntaxException | SQLException e) {
				logger.log(Level.ERROR, Messages.getString("ProjectsHandler.3"), e);
				result.put(Constants.REASON, e.getMessage());
				return result;
			}
		}
		try {
			projectStores.get(json.getString("project")).updateProject(json);
			Map<String, Project> projects = getProjects();
			Project project = projects.get(json.getString("project"));
			project.setDescription(json.getString("description"));
			project.setSourceLang(LanguageUtils.getLanguage(json.getString("srcLang")));
			project.setTargetLang(LanguageUtils.getLanguage(json.getString("tgtLang")));
			project.setClient(json.getString("client"));
			project.setSubject(json.getString("subject"));
			saveProjectsList(projects);
		} catch (IOException | SAXException | ParserConfigurationException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject createProject(String request) {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		JSONArray files = json.getJSONArray("files");

		SortedSet<String> filesList = new TreeSet<>();
		for (int i = 0; i < files.length(); i++) {
			filesList.add(files.getJSONObject(i).getString("file"));
		}
		String filesRoot = Join.findTreeRoot(filesList);

		String id = "" + System.currentTimeMillis();
		result.put("process", id);
		JSONObject obj = new JSONObject();
		obj.put(Constants.PROGRESS, Constants.PROCESSING);
		processes.put(id, obj);
		try {
			loadPreferences();
			String description = json.getString("description");
			String userHome = System.getProperty("user.home");
			if (description.startsWith(userHome)) {
				description = description.substring(userHome.length() + 1);
			}
			Language sourceLang = LanguageUtils.getLanguage(json.getString("srcLang"));
			Language targetLang = LanguageUtils.getLanguage(json.getString("tgtLang"));
			String memory = json.getString("memory");
			boolean applyTM = json.getBoolean("applyTM");
			String glossary = json.getString("glossary");
			boolean searchTerms = json.getBoolean("searchTerms");

			Project p = new Project(id, description, Project.NEW, sourceLang, targetLang, json.getString("client"),
					json.getString("subject"), memory, glossary, LocalDate.now());

			File projectFolder = new File(getWorkFolder(), id);
			Files.createDirectories(projectFolder.toPath());
			List<SourceFile> sourceFiles = new Vector<>();
			new Thread(() -> {
				try {
					List<String> xliffs = new Vector<>();
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
						if (!paragraphSegmentation) {
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
						params.put("xmlfilter", json.getString("xmlfilter"));

						List<String> res = Convert.run(params);

						if ("0".equals(res.get(0))) {
							res = ToXliff2.run(xliff, catalogFile, "2.1");
							if (mustResegment && "0".equals(res.get(0))) {
								res = Resegmenter.run(xliff.getAbsolutePath(), srxFile, json.getString("srcLang"),
										CatalogBuilder.getCatalog(catalogFile));
							}
						}
						if (!"0".equals(res.get(0))) {
							MessageFormat mf = new MessageFormat(Messages.getString("ProjectsHandler.11"));
							logger.log(Level.ERROR, mf.format(new String[] { source.getAbsolutePath() }));
							try {
								TmsServer.deleteFolder(projectFolder);
							} catch (IOException e) {
								logger.log(Level.ERROR, e);
							}
							throw new IOException(mf.format(new String[] { source.getAbsolutePath() }));
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
						ServicesHandler.addProjectName(p.getDescription());
					}
					p.setFiles(sourceFiles);
					Map<String, Project> projects = getProjects();
					projects.put(id, p);
					saveProjectsList(projects);
					if (applyTM) {
						XliffStore store = new XliffStore(p.getXliff(), p.getSourceLang().getCode(),
								p.getTargetLang().getCode());
						store.tmTranslateAll(memory, 0, processes, id);
						store.close();
					}
					if (searchTerms) {
						XliffStore store = new XliffStore(p.getXliff(), p.getSourceLang().getCode(),
								p.getTargetLang().getCode());
						store.getProjectTerms(glossary);
						store.close();
					}
					obj.put(Constants.PROGRESS, Constants.COMPLETED);
					processes.put(id, obj);
				} catch (Exception e) {
					logger.log(Level.ERROR, e.getMessage(), e);
					obj.put(Constants.PROGRESS, Constants.ERROR);
					obj.put(Constants.REASON, e.getMessage());
					processes.put(id, obj);
				}
			}).start();
			result.put(Constants.STATUS, Constants.SUCCESS);
		} catch (IOException | JSONException | SAXException | ParserConfigurationException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.STATUS, Constants.ERROR);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private void loadPreferences() throws IOException {
		JSONObject json = TmsServer.getPreferences();
		srxFile = json.getString("srx");
		catalogFile = json.getString("catalog");
		paragraphSegmentation = json.getBoolean("paragraphSegmentation");
	}

	public static File getWorkFolder() throws IOException {
		File home = TmsServer.getProjectsFolder();
		if (!home.exists()) {
			Files.createDirectories(home.toPath());
		}
		return home;
	}

	private JSONObject closeProject(String request) {
		JSONObject result = new JSONObject();
		if (projectStores == null) {
			result.put(Constants.REASON, Messages.getString("ProjectsHandler.13"));
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
			result.put(Constants.REASON, Messages.getString("ProjectsHandler.14"));
		}
		return result;
	}

	public static synchronized void closeAll() throws SQLException {
		if (projectStores == null) {
			return;
		}
		Set<String> keys = projectStores.keySet();
		Iterator<String> it = keys.iterator();
		while (it.hasNext()) {
			projectStores.get(it.next()).close();
		}
		projectStores.clear();
	}

	private JSONObject save(String request) {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		String project = json.getString("project");
		try {
			result = projectStores.get(project).saveSegment(json);
			JSONObject status = projectStores.get(project).getTranslationStatus();
			result.put("statistics", status);
			updateProjectStatus(project, status.getInt("percentage"));
		} catch (IOException | SQLException | SAXException | ParserConfigurationException | DataFormatException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject saveSource(String request) {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		String project = json.getString("project");
		try {
			projectStores.get(project).saveSource(json);
		} catch (IOException | SQLException | SAXException | ParserConfigurationException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private void updateProjectStatus(String projectId, int status)
			throws IOException, JSONException, SAXException, ParserConfigurationException {
		Map<String, Project> projects = getProjects();
		Project project = projects.get(projectId);
		int value = project.getStatus();
		if (value != status) {
			project.setStatus(status);
			saveProjectsList(projects);
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

	private JSONObject tmTranslate(String request) {
		JSONObject result = new JSONObject();
		try {
			JSONObject json = new JSONObject(request);
			String project = json.getString("project");
			if (projectStores.containsKey(project)) {
				result.put("matches", projectStores.get(project).tmTranslate(json));
			}
		} catch (IOException | SQLException | JSONException | SAXException | DataFormatException
				| ParserConfigurationException | URISyntaxException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject assembleMatches(String request) {
		JSONObject result = new JSONObject();
		try {
			JSONObject json = new JSONObject(request);
			String project = json.getString("project");
			if (projectStores.containsKey(project)) {
				projectStores.get(project).assembleMatches(json);
				result.put("matches", projectStores.get(project).getTaggedtMatches(json));
			}
		} catch (IOException | SQLException | JSONException | SAXException | DataFormatException
				| ParserConfigurationException | URISyntaxException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject assembleMatchesAll(String request) {
		JSONObject result = new JSONObject();
		try {
			JSONObject json = new JSONObject(request);
			String project = json.getString("project");

			if (!projectStores.containsKey(project)) {
				Map<String, Project> projects = getProjects();
				Project prj = projects.get(project);
				XliffStore store = new XliffStore(prj.getXliff(), prj.getSourceLang().getCode(),
						prj.getTargetLang().getCode());
				projectStores.put(project, store);
			}
			String id = "" + System.currentTimeMillis();
			result.put("process", id);
			JSONObject obj = new JSONObject();
			obj.put(Constants.PROGRESS, Constants.PROCESSING);
			processes.put(id, obj);
			Thread.ofVirtual().start(() -> {
				try {
					if (projectStores.containsKey(project)) {
						projectStores.get(project).assembleMatchesAll(json);
					}
					obj.put(Constants.PROGRESS, Constants.COMPLETED);
					processes.put(id, obj);
				} catch (IOException | SQLException | JSONException | SAXException | ParserConfigurationException
						| URISyntaxException e) {
					logger.log(Level.WARNING, e.getMessage(), e);
					obj.put(Constants.PROGRESS, Constants.ERROR);
					obj.put(Constants.REASON, e.getMessage());
					processes.put(id, obj);
				}
			});
		} catch (IOException | SAXException | ParserConfigurationException | URISyntaxException | SQLException e) {
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
			int penalization = json.has("penalization") ? json.getInt("penalization") : 0;
			if (!projectStores.containsKey(project)) {
				Map<String, Project> projects = getProjects();
				Project prj = projects.get(project);
				XliffStore store = new XliffStore(prj.getXliff(), prj.getSourceLang().getCode(),
						prj.getTargetLang().getCode());
				projectStores.put(project, store);
			}
			String id = "" + System.currentTimeMillis();
			result.put("process", id);
			JSONObject obj = new JSONObject();
			obj.put("percentage", 0);
			obj.put(Constants.PROGRESS, Constants.PROCESSING);
			processes.put(id, obj);
			Thread.ofVirtual().start(() -> {
				try {
					obj.put("translated",
							projectStores.get(project).tmTranslateAll(memory, penalization, processes, id));
					obj.put(Constants.PROGRESS, Constants.COMPLETED);
					processes.put(id, obj);
				} catch (JSONException | IOException | SQLException | SAXException | ParserConfigurationException
						| URISyntaxException e) {
					logger.log(Level.WARNING, e.getMessage(), e);
					obj.put(Constants.PROGRESS, Constants.ERROR);
					obj.put(Constants.REASON, e.getMessage());
					processes.put(id, obj);
				}
			});
		} catch (Exception e) {
			logger.log(Level.ERROR, e.getMessage(), e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject getProjectMemories(String request)
			throws JSONException, IOException, SAXException, ParserConfigurationException {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		String projectId = json.getString("project");
		Map<String, Project> projects = getProjects();
		Project project = projects.get(projectId);
		String memory = project.getMemory();
		result.put("default", memory);
		try {
			result.put("memories", MemoriesHandler.getMemoriesList());
		} catch (IOException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject getProjectGlossaries(String request)
			throws JSONException, IOException, SAXException, ParserConfigurationException {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		String projectId = json.getString("project");
		Map<String, Project> projects = getProjects();
		Project project = projects.get(projectId);
		String glossary = project.getGlossary();
		result.put("default", glossary);
		try {
			result.put("glossaries", GlossariesHandler.getGlossariesList());
		} catch (IOException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject setProjectMemory(String request)
			throws JSONException, SAXException, ParserConfigurationException {
		JSONObject result = new JSONObject();
		try {
			JSONObject json = new JSONObject(request);
			String project = json.getString("project");
			String memory = json.getString("memory");
			Map<String, Project> projects = getProjects();
			projects.get(project).setMemory(memory);
			saveProjectsList(projects);
		} catch (IOException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject setProjectGlossary(String request)
			throws JSONException, SAXException, ParserConfigurationException {
		JSONObject result = new JSONObject();
		try {
			JSONObject json = new JSONObject(request);
			String project = json.getString("project");
			String glossary = json.getString("glossary");
			Map<String, Project> projects = getProjects();
			projects.get(project).setMemory(glossary);
			saveProjectsList(projects);
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
		JSONObject obj = new JSONObject();
		obj.put(Constants.PROGRESS, Constants.PROCESSING);
		processes.put(id, obj);
		try {
			String description = json.getString("project");
			File xliffFile = new File(json.getString("xliff"));
			if (!xliffFile.exists()) {
				throw new IOException(Messages.getString("ProjectsHandler.17"));
			}
			new Thread(() -> {
				try {
					JSONObject details = XliffUtils.getProjectDetails(xliffFile);
					Project p = new Project(id, description, Project.NEW,
							LanguageUtils.getLanguage(details.getString("sourceLang")),
							LanguageUtils.getLanguage(details.getString("targetLang")), json.getString("client"),
							json.getString("subject"), json.getString("memory"), json.getString("glossary"),
							LocalDate.now());
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
					Map<String, Project> projects = getProjects();
					projects.put(id, p);
					saveProjectsList(projects);
					obj.put(Constants.PROGRESS, Constants.COMPLETED);
					processes.put(id, obj);
				} catch (IOException | SAXException | ParserConfigurationException | URISyntaxException
						| SQLException e) {
					logger.log(Level.WARNING, e.getMessage(), e);
					obj.put(Constants.PROGRESS, Constants.ERROR);
					obj.put(Constants.REASON, e.getMessage());
					processes.put(id, obj);
				}
			}).start();
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

	private JSONObject removeAssembledMatches(String request) {
		JSONObject result = new JSONObject();
		try {
			JSONObject json = new JSONObject(request);
			String project = json.getString("project");
			if (projectStores.containsKey(project)) {
				projectStores.get(project).removeMatches("am");
			}
		} catch (SQLException | JSONException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject removeMatches(String request) {
		JSONObject result = new JSONObject();
		try {
			JSONObject json = new JSONObject(request);
			String project = json.getString("project");
			if (projectStores.containsKey(project)) {
				projectStores.get(project).removeMatches("tm");
			}
		} catch (SQLException | JSONException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject removeMT(String request) {
		JSONObject result = new JSONObject();
		try {
			JSONObject json = new JSONObject(request);
			String project = json.getString("project");
			if (projectStores.containsKey(project)) {
				projectStores.get(project).removeMatches("mt");
			}
		} catch (SQLException | JSONException e) {
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
		} catch (SQLException | JSONException | IOException | SAXException | ParserConfigurationException e) {
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
			String id = "" + System.currentTimeMillis();
			result.put("process", id);
			JSONObject obj = new JSONObject();
			obj.put(Constants.PROGRESS, Constants.PROCESSING);
			processes.put(id, obj);
			new Thread(() -> {
				try {
					JSONObject json = new JSONObject(request);
					String project = json.getString("project");
					String memory = json.getString("memory");
					if (projectStores.containsKey(project)) {
						projectStores.get(project).confirmAllTranslations(memory);
						JSONObject status = projectStores.get(project).getTranslationStatus();
						obj.put("statistics", status);
						updateProjectStatus(project, status.getInt("percentage"));
					}
					obj.put(Constants.PROGRESS, Constants.COMPLETED);
					processes.put(id, obj);
				} catch (IOException | SQLException | SAXException | ParserConfigurationException
						| URISyntaxException e) {
					logger.log(Level.WARNING, e.getMessage(), e);
					obj.put(Constants.PROGRESS, Constants.ERROR);
					obj.put(Constants.REASON, e.getMessage());
					processes.put(id, obj);
				}
			}).start();
		} catch (JSONException e) {
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
			Map<String, Project> projects = getProjects();
			if (!projectStores.containsKey(project)) {
				try {
					Project prj = projects.get(project);
					XliffStore store = new XliffStore(prj.getXliff(), prj.getSourceLang().getCode(),
							prj.getTargetLang().getCode());
					projectStores.put(project, store);
				} catch (SAXException | IOException | ParserConfigurationException | URISyntaxException
						| SQLException e) {
					logger.log(Level.ERROR, Messages.getString("ProjectsHandler.3"), e);
					result.put(Constants.REASON, e.getMessage());
					return result;
				}
			}
			String analysis = projectStores.get(project).generateStatistics(projects.get(project).getDescription());
			result.put("analysis", analysis);
		} catch (SQLException | JSONException | SAXException | IOException | ParserConfigurationException
				| URISyntaxException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject exportHTML(String request) {
		JSONObject result = new JSONObject();
		try {
			JSONObject json = new JSONObject(request);
			String project = json.getString("project");
			Map<String, Project> projects = getProjects();
			Project prj = projects.get(project);
			if (!projectStores.containsKey(project)) {
				try {
					XliffStore store = new XliffStore(prj.getXliff(), prj.getSourceLang().getCode(),
							prj.getTargetLang().getCode());
					projectStores.put(project, store);
				} catch (SAXException | IOException | ParserConfigurationException | URISyntaxException
						| SQLException e) {
					logger.log(Level.ERROR, Messages.getString("ProjectsHandler.3"), e);
					result.put(Constants.REASON, e.getMessage());
					return result;
				}
			}
			String export = projectStores.get(project).exportHTML(prj.getDescription());
			result.put("export", export);
		} catch (SQLException | IOException | SAXException | ParserConfigurationException e) {
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
		String id = "" + System.currentTimeMillis();
		result.put("process", id);
		JSONObject obj = new JSONObject();
		obj.put(Constants.PROGRESS, Constants.PROCESSING);
		processes.put(id, obj);
		Thread.ofVirtual().start(() -> {
			try {
				JSONObject json = new JSONObject(request);
				String project = json.getString("project");
				if (projectStores.containsKey(project)) {
					projectStores.get(project).applyMtAll(project);
				}
				obj.put(Constants.PROGRESS, Constants.COMPLETED);
				processes.put(id, obj);
			} catch (IOException | SQLException | JSONException | SAXException | ParserConfigurationException e) {
				logger.log(Level.WARNING, e.getMessage(), e);
				obj.put(Constants.PROGRESS, Constants.ERROR);
				obj.put(Constants.REASON, e.getMessage());
				processes.put(id, obj);
			}
		});
		return result;
	}

	private JSONObject acceptAllMT(String request) {
		JSONObject result = new JSONObject();
		try {
			JSONObject json = new JSONObject(request);
			String project = json.getString("project");
			if (projectStores.containsKey(project)) {
				projectStores.get(project).acceptAllMT();
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

	private JSONObject getTerms(String request) {
		JSONObject result = new JSONObject();
		try {
			JSONObject json = new JSONObject(request);
			String project = json.getString("project");
			if (projectStores.containsKey(project)) {
				result.put("terms", projectStores.get(project).getTerms(json));
			}
		} catch (SQLException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject getSegmentTerms(String request) {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		try {
			String project = json.getString("project");
			if (projectStores.containsKey(project)) {
				result.put("terms", projectStores.get(project).getSegmentTerms(json));
			}
		} catch (SQLException | JSONException | IOException | SAXException | ParserConfigurationException
				| URISyntaxException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject getProjectTerms(String request) {
		JSONObject result = new JSONObject();
		final JSONObject json = new JSONObject(request);
		String id = "" + System.currentTimeMillis();
		result.put("process", id);
		JSONObject obj = new JSONObject();
		obj.put(Constants.PROGRESS, Constants.PROCESSING);
		processes.put(id, obj);
		try {
			new Thread(() -> {
				try {
					String project = json.getString("project");
					if (!projectStores.containsKey(project)) {
						Map<String, Project> projects = getProjects();
						Project prj = projects.get(project);
						XliffStore store = new XliffStore(prj.getXliff(), prj.getSourceLang().getCode(),
								prj.getTargetLang().getCode());
						projectStores.put(project, store);
					}
					obj.put("segments", projectStores.get(project).getProjectTerms(json.getString("glossary")));
					obj.put(Constants.PROGRESS, Constants.COMPLETED);
					processes.put(id, obj);
				} catch (SQLException | JSONException | IOException | SAXException | ParserConfigurationException
						| URISyntaxException e) {
					logger.log(Level.ERROR, e);
					result.put(Constants.REASON, e.getMessage());
				}
			}).start();
		} catch (JSONException e) {
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject lockSegment(String request) {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		try {
			String project = json.getString("project");
			if (projectStores.containsKey(project)) {
				projectStores.get(project).lockSegment(json);
			}
		} catch (SQLException | JSONException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject lockDuplicates(String request) {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		try {
			String project = json.getString("project");
			if (projectStores.containsKey(project)) {
				projectStores.get(project).lockDuplicates();
			}
		} catch (SQLException | JSONException | SAXException | IOException | ParserConfigurationException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject unlockAll(String request) {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		try {
			String project = json.getString("project");
			if (projectStores.containsKey(project)) {
				projectStores.get(project).unlockAll();
			}
		} catch (SQLException | JSONException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject analyzeSpaces(String request) {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		try {
			String project = json.getString("project");
			if (projectStores.containsKey(project)) {
				result = projectStores.get(project).analyzeSpaces();
			}
		} catch (SQLException | JSONException | IOException | SAXException | ParserConfigurationException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject fixSpaces(String request) {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		try {
			String project = json.getString("project");
			if (projectStores.containsKey(project)) {
				projectStores.get(project).fixSpaces();
				result = projectStores.get(project).analyzeSpaces();
			}
		} catch (SQLException | JSONException | SAXException | IOException | ParserConfigurationException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject analyzeTags(String request) {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		try {
			String project = json.getString("project");
			if (projectStores.containsKey(project)) {
				result = projectStores.get(project).analyzeTags();
			}
		} catch (SQLException | JSONException | SAXException | IOException | ParserConfigurationException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject splitSegment(String request) {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		try {
			String project = json.getString("project");
			if (projectStores.containsKey(project)) {
				projectStores.get(project).splitSegment(json);
			}
		} catch (SQLException | JSONException | SAXException | IOException | ParserConfigurationException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject mergeSegment(String request) {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		try {
			String project = json.getString("project");
			if (projectStores.containsKey(project)) {
				projectStores.get(project).mergeSegment(json);
			}
		} catch (SQLException | JSONException | SAXException | IOException | ParserConfigurationException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject getNotes(String request) {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		try {
			String project = json.getString("project");
			if (projectStores.containsKey(project)) {
				result.put("notes", projectStores.get(project).getNotes(json.getString("file"), json.getString("unit"),
						json.getString("segment")));
			}
		} catch (SQLException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject addNote(String request) {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		try {
			String project = json.getString("project");
			if (projectStores.containsKey(project)) {
				result.put("notes", projectStores.get(project).addNote(json.getString("file"), json.getString("unit"),
						json.getString("segment"), json.getString("noteText")));
			}
		} catch (SQLException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}

	private JSONObject removeNote(String request) {
		JSONObject result = new JSONObject();
		JSONObject json = new JSONObject(request);
		try {
			String project = json.getString("project");
			if (projectStores.containsKey(project)) {
				result.put("notes", projectStores.get(project).removeNote(json.getString("file"),
						json.getString("unit"), json.getString("segment"), json.getString("noteId")));
			}
		} catch (SQLException e) {
			logger.log(Level.ERROR, e);
			result.put(Constants.REASON, e.getMessage());
		}
		return result;
	}
}