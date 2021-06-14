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
import java.io.DataOutputStream;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.lang.System.Logger;
import java.lang.System.Logger.Level;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.sql.SQLException;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import org.json.JSONObject;

public class TmsServer implements HttpHandler {

	private static Logger logger = System.getLogger(TmsServer.class.getName());
	private HttpServer server;
	private static boolean debug;
	private static File workDir;

	public TmsServer(Integer port) throws IOException {
		server = HttpServer.create(new InetSocketAddress(port), 0);
	}

	public static void main(String[] args) {
		String port = "8070";
		for (int i = 0; i < args.length; i++) {
			String arg = args[i];
			if (arg.equals("-version")) {
				logger.log(Level.INFO, () -> "Version: " + Constants.VERSION + " Build: " + Constants.BUILD);
				return;
			}
			if (arg.equals("-port") && (i + 1) < args.length) {
				port = args[i + 1];
			}
			if (arg.equals("-debug")) {
				debug = true;
			}
		}
		try {
			TmsServer instance = new TmsServer(Integer.valueOf(port));
			instance.run();
		} catch (Exception e) {
			logger.log(Level.ERROR, "Server error", e);
		}
	}

	private void run() {
		server.createContext("/projects", new ProjectsHandler());
		server.createContext("/memories", new MemoriesHandler());
		server.createContext("/glossaries", new GlossariesHandler());
		server.createContext("/services", new ServicesHandler());
		server.createContext("/", this);
		server.setExecutor(new ThreadPoolExecutor(4, 8, 30, TimeUnit.SECONDS, new ArrayBlockingQueue<>(100)));
		server.start();
		if (debug) {
			logger.log(Level.INFO, "TMS server started");
		}
	}

	@Override
	public void handle(HttpExchange t) throws IOException {
		JSONObject obj = new JSONObject();
		try {
			String request = "";
			try (InputStream is = t.getRequestBody()) {
				request = readRequestBody(is);
			}
			if (request.isBlank()) {
				throw new IOException("Empty request");
			}
			if (debug) {
				logger.log(Level.INFO, request);
			}
			String response = "";
			JSONObject json = new JSONObject(request);
			String command = json.getString("command");
			switch (command) {
				case "version":
					obj.put("tool", "TMSServer");
					obj.put("version", Constants.VERSION);
					obj.put("build", Constants.BUILD);
					obj.put(Constants.STATUS, Constants.OK);
					response = obj.toString();
					break;
				case "stop":
					if (debug) {
						logger.log(Level.INFO, "Stopping server");
					}
					closeAll();
					obj.put(Constants.STATUS, Constants.OK);
					response = obj.toString();
					break;
				default:
					obj.put(Constants.STATUS, Constants.ERROR);
					obj.put(Constants.REASON, "Unknown command");
					obj.put("received", json.toString());
					response = obj.toString();
			}
			if (debug) {
				logger.log(Level.INFO, response);
			}
			t.getResponseHeaders().add("content-type", "application/json; charset=utf-8");
			byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
			t.sendResponseHeaders(200, bytes.length);
			try (DataOutputStream stream = new DataOutputStream(t.getResponseBody())) {
				stream.writeBytes(response);
			}
			if ("stop".equals(command)) {
				server.stop(0);
				System.exit(0);
			}
		} catch (IOException | SQLException e) {
			logger.log(Level.ERROR, e);
			obj.put(Constants.STATUS, Constants.ERROR);
			obj.put(Constants.REASON, e.getMessage());
			String message = obj.toString();
			t.sendResponseHeaders(200, message.getBytes(StandardCharsets.UTF_8).length);
			try (DataOutputStream stream = new DataOutputStream(t.getResponseBody())) {
				stream.writeBytes(message);
			}
		}
	}

	private void closeAll() throws IOException, SQLException {
		MemoriesHandler.closeAll();
		ProjectsHandler.closeAll();
		GlossariesHandler.closeAll();
	}

	protected static String readRequestBody(InputStream is) throws IOException {
		StringBuilder request = new StringBuilder();
		try (BufferedReader rd = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
			String line;
			while ((line = rd.readLine()) != null) {
				request.append(line);
			}
		}
		return request.toString();
	}

	public static File getWorkFolder() throws IOException {
		if (workDir == null) {
			String os = System.getProperty("os.name").toLowerCase();
			if (os.startsWith("mac")) {
				workDir = new File(System.getProperty("user.home") + "/Library/Application Support/Swordfish/");
			} else if (os.startsWith("windows")) {
				workDir = new File(System.getenv("AppData") + "\\Swordfish\\");
			} else {
				workDir = new File(System.getProperty("user.home") + "/.config/Swordfish/");
			}
			if (!workDir.exists()) {
				Files.createDirectories(workDir.toPath());
			}
		}
		return workDir;
	}

	public static void deleteFolder(String folder) throws IOException {
		File f = new File(folder);
		if (f.isDirectory()) {
			String[] list = f.list();
			for (int i = 0; i < list.length; i++) {
				deleteFolder(new File(f, list[i]).getAbsolutePath());
			}
		}
		Files.delete(f.toPath());
	}

	public static boolean isDebug() {
		return debug;
	}

	public static String getCatalogFile() throws IOException {
		File preferences = new File(getWorkFolder(), "preferences.json");
		StringBuilder builder = new StringBuilder();
		try (FileReader reader = new FileReader(preferences, StandardCharsets.UTF_8)) {
			try (BufferedReader buffer = new BufferedReader(reader)) {
				String line = "";
				while ((line = buffer.readLine()) != null) {
					builder.append(line);
				}
			}
		}
		JSONObject json = new JSONObject(builder.toString());
		return json.getString("catalog");
	}
}
