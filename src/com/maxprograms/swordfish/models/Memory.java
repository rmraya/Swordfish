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
package com.maxprograms.swordfish.models;

import java.io.Serializable;
import java.text.SimpleDateFormat;
import java.util.Date;

import org.json.JSONObject;

public class Memory implements Serializable, Comparable<Memory> {

	private static final long serialVersionUID = -3800311066779683003L;

	public static final String LOCAL = "Local";
	public static final String REMOTE = "Remote";

	private String id;
	private String name;
	private String project;
	private String subject;
	private String client;
	private String type;
	private String server;
	private String user;
	private String password;
	private Date creationDate;

	public Memory(JSONObject object) {
		this.id = object.getString("id");
		this.name = object.getString("name");
		this.project = object.has("project") ? object.getString("project") : "";
		this.subject = object.has("subject") ? object.getString("subject") : "";
		this.client = object.has("client") ? object.getString("client") : "";
		this.type = object.has("type") ? object.getString("type") : LOCAL;
		this.server = object.has("server") ? object.getString("server") : "";
		this.user = object.has("user") ? object.getString("user") : "";
		this.password = object.has("password") ? object.getString("password") : "";
		this.creationDate = object.has("creationDate") ? new Date(object.getLong("creationDate")) : new Date();
	}

	public JSONObject toJSON() {
		SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		JSONObject json = new JSONObject();
		json.put("id", id);
		json.put("name", name);
		json.put("project", project);
		json.put("subject", subject);
		json.put("client", client);
		json.put("type", type);
		json.put("server", server);
		json.put("user", user);
		json.put("password", password);
		json.put("creationDate", creationDate.getTime());
		json.put("creationString", df.format(creationDate));
		return json;
	}

	public Memory(String id, String name, String project, String subject, String client, String type, String server,
			String user, String password, Date creationDate) {
		this.id = id;
		this.name = name;
		this.project = project;
		this.subject = subject;
		this.client = client;
		this.type = type;
		this.server = server;
		this.user = user;
		this.password = password;
		this.creationDate = creationDate;
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
		return name.compareTo(o.getName());
	}

	@Override
	public boolean equals(Object obj) {
		if (!(obj instanceof Memory)) {
			return false;
		}
		Memory m = (Memory) obj;
		return id.equals(m.getId());
	}

	@Override
	public int hashCode() {
		return id.hashCode();
	}

}
