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
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

import javax.net.ssl.HttpsURLConnection;

import org.json.JSONArray;
import org.json.JSONObject;

public class RemoteUtils {

    private RemoteUtils() {
        // empty for security
    }

    public static JSONObject remoteDatabases(String request) {
        JSONObject result = new JSONObject();
        JSONObject json = new JSONObject(request);
        try {
            String ticket = getTicket(json.getString("server"), json.getString("user"), json.getString("password"));
            result.put("memories", getRemoteMemories(json.getString("server"), ticket));
            result.put(Constants.STATUS, Constants.OK);
        } catch (IOException e) {
            result.put(Constants.STATUS, Constants.ERROR);
            result.put(Constants.REASON, e.getMessage());
        }
        return result;
    }

    public static JSONArray getRemoteMemories(String server, String ticket) throws IOException {
        URL serverUrl = new URL(server + "/memories");
        HttpsURLConnection connection = (HttpsURLConnection) serverUrl.openConnection();
        connection.setRequestMethod("GET");
        connection.setRequestProperty("Session", ticket);
        connection.setRequestProperty("Accept", "application/json");
        connection.setRequestProperty("Content-Type", "application/json");
        connection.connect();
        StringBuilder sb = new StringBuilder();
        try (InputStream stream = connection.getInputStream()) {
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
            }
        }
        JSONObject result = new JSONObject(sb.toString());
        if (result.getString(Constants.STATUS).equals(Constants.OK)) {
            return result.getJSONArray("memories");
        }
        throw new IOException(result.getString(Constants.REASON));
    }

    public static String getTicket(String server, String user, String password) throws IOException {
        URL serverUrl = new URL(server + "/remote");
        HttpsURLConnection connection = (HttpsURLConnection) serverUrl.openConnection();
        connection.setRequestMethod("GET");
        connection.setRequestProperty("Accept", "application/json");
        connection.setRequestProperty("Content-Type", "application/json");
        connection.setRequestProperty("Authorization", "BASIC " + toBase64(user + ":" + password));
        connection.connect();
        StringBuilder sb = new StringBuilder();
        try (InputStream stream = connection.getInputStream()) {
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
            }
        }
        JSONObject result = new JSONObject(sb.toString());
        if (result.getString(Constants.STATUS).equals(Constants.OK)) {
            return result.getString("ticket");
        }
        throw new IOException(result.getString(Constants.REASON));
    }

    public static String toBase64(String string) {
        return Base64.getEncoder().encodeToString(string.getBytes(StandardCharsets.UTF_8));
    }

    public static String fromBase64(String string) {
        return new String(Base64.getDecoder().decode(string));
    }
}
