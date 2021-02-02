/*****************************************************************************
Copyright (c) 2007-2021 - Maxprograms,  http://www.maxprograms.com/

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
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.Set;
import java.util.TreeMap;

import javax.xml.parsers.ParserConfigurationException;

import com.maxprograms.converters.EncodingResolver;
import com.maxprograms.converters.FileFormats;
import com.maxprograms.languages.Language;
import com.maxprograms.languages.LanguageUtils;
import com.maxprograms.swordfish.mt.MTUtils;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import org.json.JSONArray;
import org.json.JSONObject;
import org.xml.sax.SAXException;

public class ServicesHandler implements HttpHandler {

    private static Logger logger = System.getLogger(ServicesHandler.class.getName());

    private static JSONObject clients;
    private static JSONObject subjects;
    private static JSONObject projects;

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
            logger.log(Level.ERROR, "Error processing service request" + exchange.getRequestURI().toString(), e);
        }
    }

    private JSONObject processRequest(String url, String request) {
        JSONObject result = null;
        try {
            if ("/services/getLanguages".equals(url)) {
                result = getLanguages();
            } else if ("/services/getFileTypes".equals(url)) {
                result = getFileFormats();
            } else if ("/services/getCharsets".equals(url)) {
                result = getCharsets();
            } else if ("/services/getFileType".equals(url)) {
                result = getFileType(request);
            } else if ("/services/getClients".equals(url)) {
                result = getClients();
            } else if ("/services/getSubjects".equals(url)) {
                result = getSubjects();
            } else if ("/services/getProjects".equals(url)) {
                result = getProjects();
            } else if ("/services/getMTLanguages".equals(url)) {
                result = getMTLanguages();
            } else if ("/services/getSpellingLanguages".equals(url)) {
                result = getSpellingLanguages(request);
            } else {
                result = new JSONObject();
                result.put("url", url);
                result.put("request", request);
                result.put(Constants.REASON, "Unknown request");
            }
            if (!result.has(Constants.REASON)) {
                result.put(Constants.STATUS, Constants.SUCCESS);
            } else {
                result.put(Constants.STATUS, Constants.ERROR);
            }
        } catch (Exception j) {
            logger.log(Level.ERROR, j.getMessage(), j);
            result = new JSONObject();
            result.put(Constants.STATUS, Constants.ERROR);
            result.put(Constants.REASON, j.getMessage());
        }
        return result;
    }

    private JSONObject getFileFormats() {
        JSONObject result = new JSONObject();
        JSONArray array = new JSONArray();
        String[] formats = FileFormats.getFormats();
        for (int i = 0; i < formats.length; i++) {
            String format = formats[i];
            JSONObject json = new JSONObject();
            json.put("code", FileFormats.getShortName(format));
            json.put("description", format);
            array.put(json);
        }
        result.put("formats", array);
        return result;
    }

    private JSONObject getCharsets() {
        JSONObject result = new JSONObject();
        JSONArray array = new JSONArray();
        TreeMap<String, Charset> charsets = new TreeMap<>(Charset.availableCharsets());
        Set<String> keys = charsets.keySet();
        Iterator<String> it = keys.iterator();
        while (it.hasNext()) {
            String charset = it.next();
            JSONObject json = new JSONObject();
            json.put("code", charset);
            json.put("description", charsets.get(charset).displayName());
            array.put(json);
        }
        result.put("charsets", array);
        return result;
    }

    private JSONObject getFileType(String request) {
        JSONObject result = new JSONObject();
        JSONObject json = new JSONObject(request);
        JSONArray files = json.getJSONArray("files");
        JSONArray detailsArray = new JSONArray();
        for (int i = 0; i < files.length(); i++) {
            String file = files.getString(i);
            String type = "Unknown";
            String encoding = "Unknown";
            String detected = FileFormats.detectFormat(file);
            if (detected != null) {
                type = FileFormats.getShortName(detected);
                if (type != null) {
                    Charset charset = EncodingResolver.getEncoding(file, detected);
                    if (charset != null) {
                        encoding = charset.name();
                    }
                }
            }
            if (encoding.equals("Unknown")) {
                try {
                    Charset bom = EncodingResolver.getBOM(file);
                    if (bom != null) {
                        encoding = bom.name();
                    }
                } catch (IOException e) {
                    // ignore
                }
            }
            JSONObject details = new JSONObject();
            details.put("file", file);
            details.put("type", type);
            details.put("encoding", encoding);
            detailsArray.put(details);
        }
        result.put("files", detailsArray);
        return result;
    }

    private JSONObject getLanguages() {
        JSONObject result = new JSONObject();
        try {
            List<Language> languages = LanguageUtils.getCommonLanguages();
            JSONArray array = new JSONArray();
            for (int i = 0; i < languages.size(); i++) {
                Language lang = languages.get(i);
                JSONObject json = new JSONObject();
                json.put("code", lang.getCode());
                json.put("description", lang.getDescription());
                array.put(json);
            }
            result.put("languages", array);
        } catch (SAXException | IOException | ParserConfigurationException e) {
            logger.log(Level.ERROR, "Error getting languages", e);
            result.put(Constants.REASON, e.getMessage());
        }
        return result;
    }

    private static JSONObject getMTLanguages() {
        JSONObject result = new JSONObject();
        try {
            result = MTUtils.getMTLanguages();
        } catch (IOException e) {
            logger.log(Level.ERROR, "Error getting MT languages", e);
            result.put(Constants.REASON, e.getMessage());
        }
        return result;
    }

    private static JSONObject getClients() throws IOException {
        if (clients != null) {
            return clients;
        }
        File clientsFile = new File(TmsServer.getWorkFolder(), "clients.json");
        if (!clientsFile.exists()) {
            clients = new JSONObject();
            clients.put("clients", new JSONArray());
            return clients;
        }
        StringBuffer buffer = new StringBuffer();
        try (FileReader input = new FileReader(clientsFile, StandardCharsets.UTF_8)) {
            try (BufferedReader reader = new BufferedReader(input)) {
                String line;
                while ((line = reader.readLine()) != null) {
                    buffer.append(line);
                }
            }
        }
        clients = new JSONObject(buffer.toString());
        return clients;
    }

    private static JSONObject getSubjects() throws IOException {
        if (subjects != null) {
            return subjects;
        }
        File subjectsFile = new File(TmsServer.getWorkFolder(), "subjects.json");
        if (!subjectsFile.exists()) {
            subjects = new JSONObject();
            subjects.put("subjects", new JSONArray());
            return subjects;
        }
        StringBuffer buffer = new StringBuffer();
        try (FileReader input = new FileReader(subjectsFile, StandardCharsets.UTF_8)) {
            try (BufferedReader reader = new BufferedReader(input)) {
                String line;
                while ((line = reader.readLine()) != null) {
                    buffer.append(line);
                }
            }
        }
        subjects = new JSONObject(buffer.toString());
        return subjects;
    }

    private static JSONObject getProjects() throws IOException {
        if (projects != null) {
            return projects;
        }
        File projectsFile = new File(TmsServer.getWorkFolder(), "projects.json");
        if (!projectsFile.exists()) {
            projects = new JSONObject();
            projects.put("projects", new JSONArray());
            try (FileOutputStream out = new FileOutputStream(projectsFile)) {
                out.write(projects.toString().getBytes(StandardCharsets.UTF_8));
            }
            return projects;
        }
        StringBuffer buffer = new StringBuffer();
        try (FileReader input = new FileReader(projectsFile, StandardCharsets.UTF_8)) {
            try (BufferedReader reader = new BufferedReader(input)) {
                String line;
                while ((line = reader.readLine()) != null) {
                    buffer.append(line);
                }
            }
        }
        projects = new JSONObject(buffer.toString());
        return projects;
    }

    public static void addClient(String client) throws IOException {
        if (client == null || client.isEmpty()) {
            return;
        }
        getClients();
        JSONArray array = clients.getJSONArray("clients");
        for (int i = 0; i < array.length(); i++) {
            if (client.equals(array.getString(i))) {
                return;
            }
        }
        clients.put("clients", insertString(client, array));
        File clientsFile = new File(TmsServer.getWorkFolder(), "clients.json");
        try (FileOutputStream out = new FileOutputStream(clientsFile)) {
            out.write(clients.toString().getBytes(StandardCharsets.UTF_8));
        }
    }

    public static void addSubject(String subject) throws IOException {
        if (subject == null || subject.isEmpty()) {
            return;
        }
        getSubjects();
        JSONArray array = subjects.getJSONArray("subjects");
        for (int i = 0; i < array.length(); i++) {
            if (subject.equals(array.getString(i))) {
                return;
            }
        }
        subjects.put("subjects", insertString(subject, array));
        File subjectsFile = new File(TmsServer.getWorkFolder(), "subjects.json");
        try (FileOutputStream out = new FileOutputStream(subjectsFile)) {
            out.write(subjects.toString().getBytes(StandardCharsets.UTF_8));
        }
    }

    public static void addProject(String project) throws IOException {
        if (project == null || project.isEmpty()) {
            return;
        }
        getProjects();
        JSONArray array = projects.getJSONArray("projects");
        for (int i = 0; i < array.length(); i++) {
            if (project.equals(array.getString(i))) {
                return;
            }
        }
        projects.put("projects", insertString(project, array));
        File projectsFile = new File(TmsServer.getWorkFolder(), "projects.json");
        try (FileOutputStream out = new FileOutputStream(projectsFile)) {
            out.write(projects.toString().getBytes(StandardCharsets.UTF_8));
        }
    }

    private static JSONArray insertString(String string, JSONArray array) {
        JSONArray result = new JSONArray();
        List<String> list = new ArrayList<>();
        list.add(string);
        for (int i = 0; i < array.length(); i++) {
            list.add(array.getString(i));
        }
        Collections.sort(list);
        Iterator<String> it = list.iterator();
        while (it.hasNext()) {
            result.put(it.next());
        }
        return result;
    }

    private JSONObject getSpellingLanguages(String request) {
        JSONObject result = new JSONObject();
        try {
            JSONArray array = new JSONArray();
            JSONObject json = new JSONObject(request);
            JSONArray languages = json.getJSONArray("languages");
            for (int i = 0; i < languages.length(); i++) {
                String code = languages.getString(i);
                JSONArray a = new JSONArray();
                a.put(code);
                a.put(LanguageUtils.getLanguage(code));
                array.put(a);
            }
            result.put("languages", array);
        } catch (IOException e) {
            logger.log(Level.ERROR, e);
            result.put(Constants.REASON, e.getMessage());
        }
        return result;
    }
}