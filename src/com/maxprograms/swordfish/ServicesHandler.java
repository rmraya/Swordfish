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

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.lang.System.Logger;
import java.lang.System.Logger.Level;
import java.net.URI;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.List;

import javax.xml.parsers.ParserConfigurationException;

import com.maxprograms.converters.EncodingResolver;
import com.maxprograms.converters.FileFormats;
import com.maxprograms.languages.Language;
import com.maxprograms.languages.LanguageUtils;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import org.json.JSONArray;
import org.json.JSONObject;
import org.xml.sax.SAXException;

public class ServicesHandler implements HttpHandler {

    private static Logger logger = System.getLogger(ServicesHandler.class.getName());

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
        JSONObject result = new JSONObject();
        try {
            if ("/services/getLanguages".equals(url)) {
                result = getLanguages();
            } else if ("/services/getFileTypes".equals(url)) {
                result = getFileTypes(request);
            } else {
                result.put(Constants.REASON, "Unknown request");
            }

            if (!result.has(Constants.REASON)) {
                result.put(Constants.STATUS, Constants.SUCCESS);
            } else {
                result.put(Constants.STATUS, Constants.ERROR);
            }
        } catch (Exception j) {
            logger.log(Level.ERROR, j.getMessage(), j);
            result.put(Constants.STATUS, Constants.ERROR);
            result.put(Constants.REASON, j.getMessage());
        }
        return result;
    }

    private JSONObject getFileTypes(String request) {
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
}