/*******************************************************************************
 * Copyright (c) 2023 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/

package com.maxprograms.swordfish.models;

import java.text.SimpleDateFormat;
import java.util.Date;

import com.maxprograms.swordfish.RemoteUtils;

import org.json.JSONObject;

public class Memory implements Comparable<Memory> {

	public static final String LOCAL = "Local";
	public static final String REMOTE = "RemoteTM";

	private String id;
	private String name;
	private String project;
	private String subject;
	private String client;
	private Date creationDate;
	private String type;
	private String server;
	private String user;
	private String password;

	public Memory(JSONObject json) {
		id = json.getString("id");
		name = json.getString("name");
		project = json.has("project") ? json.getString("project") : "";
		subject = json.has("subject") ? json.getString("subject") : "";
		client = json.has("client") ? json.getString("client") : "";
		creationDate = json.has("creationDate") ? new Date(json.getLong("creationDate")) : new Date();
		type = json.has("type") ? json.getString("type") : LOCAL;
		server = json.has("server") ? json.getString("server") : "";
		user = json.has("user") ? json.getString("user") : "";
		password = json.has("password") ? RemoteUtils.fromBase64(json.getString("password")) : "";
	}

	public JSONObject toJSON() {
		SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		JSONObject json = new JSONObject();
		json.put("id", id);
		json.put("name", name);
		json.put("project", project);
		json.put("subject", subject);
		json.put("client", client);
		json.put("creationDate", creationDate.getTime());
		json.put("creationString", df.format(creationDate));
		json.put("type", type);
		json.put("server", server);
		json.put("user", user);
		json.put("password", RemoteUtils.toBase64(password));
		return json;
	}

	public Memory(String id, String name, String project, String subject, String client, Date creationDate, String type,
			String server, String user, String password) {
		this.id = id;
		this.name = name;
		this.project = project;
		this.subject = subject;
		this.client = client;
		this.creationDate = creationDate;
		this.type = type;
		this.server = server;
		this.user = user;
		this.password = password;
	}

	public String getId() {
		return id;
	}

	public String getName() {
		return name;
	}

	public String getProject() {
		return project;
	}

	public void setProject(String project) {
		this.project = project;
	}

	public String getSubject() {
		return subject;
	}

	public void setSubject(String subject) {
		this.subject = subject;
	}

	public String getClient() {
		return client;
	}

	public void setClient(String client) {
		this.client = client;
	}

	public Date getCreationDate() {
		return creationDate;
	}

	public void setCreationDate(Date creationDate) {
		this.creationDate = creationDate;
	}

	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}

	public String getServer() {
		return server;
	}

	public void setServer(String server) {
		this.server = server;
	}

	public String getUser() {
		return user;
	}

	public void setUser(String user) {
		this.user = user;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	@Override
	public int compareTo(Memory o) {
		return name.compareTo(o.name);
	}

	@Override
	public boolean equals(Object obj) {
		if (obj instanceof Memory m) {
			return id.equals(m.getId());
		}
		return false;
	}

	@Override
	public int hashCode() {
		return id.hashCode();
	}

}
