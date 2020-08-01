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
	private Date creationDate;

	public Memory(JSONObject object) {
		this.id = object.getString("id");
		this.name = object.getString("name");
		this.project = object.has("project") ? object.getString("project") : "";
		this.subject = object.has("subject") ? object.getString("subject") : "";
		this.client = object.has("client") ? object.getString("client") : "";
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
		json.put("creationDate", creationDate.getTime());
		json.put("creationString", df.format(creationDate));
		return json;
	}

	public Memory(String id, String name, String project, String subject, String client, Date creationDate) {
		this.id = id;
		this.name = name;
		this.project = project;
		this.subject = subject;
		this.client = client;
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
