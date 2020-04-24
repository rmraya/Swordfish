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

import java.io.IOException;
import java.io.Serializable;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Iterator;
import java.util.List;

import com.maxprograms.languages.Language;
import com.maxprograms.languages.LanguageUtils;

import org.json.JSONArray;
import org.json.JSONObject;

public class Project implements Serializable, Comparable<Project> {

	private static final long serialVersionUID = -7301458245016833998L;

	public static final int NEW = 0;
	public static final int INPROGRESS = 1;
	public static final int COMPLETED = 2;

	private String id;
	private String description;
	private int status;
	private String client;
	private String subject;
	private Language sourceLang;
	private Language targetLang;
	private Date creationDate;
	private Date dueDate;
	private Date finishDate;
	private List<SourceFile> files;
	private List<Memory> memories;
	private List<Glossary> glossaries;

	public Project(String id, String description, int status, Language sourceLang, Language targetLang, String client,
			String subject, Date creationDate, Date dueDate, Date finishDate) {
		this.id = id;
		this.description = description;
		this.status = status;
		this.sourceLang = sourceLang;
		this.targetLang = targetLang;
		this.client = client;
		this.subject = subject;
		this.creationDate = creationDate;
		this.dueDate = dueDate;
		this.finishDate = finishDate;
	}

	public Project(String json) throws IOException {
		JSONObject object = new JSONObject(json);
		this.id = object.getString("id");
		this.description = object.getString("description");
		this.sourceLang = LanguageUtils.getLanguage(object.getString("sourceLang"));
		this.targetLang = LanguageUtils.getLanguage(object.getString("targetLang"));
		this.client = object.has("client") ? object.getString("client") : "";
		this.subject = object.has("subject") ? object.getString("subject") : "";
		this.creationDate = new Date(object.getLong("creationDate"));
		this.dueDate = new Date(object.getLong("dueDate"));
		if (object.has("finishDate")) {
			this.finishDate = new Date(object.getLong("finishDate"));
		}
	}

	public String toJSON() {
		SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		JSONObject json = new JSONObject();
		json.put("id", id);
		json.put("description", description);
		json.put("sourceLang", sourceLang.getCode());
		json.put("targetLang", targetLang.getCode());
		json.put("client", client);
		json.put("subject", subject);
		json.put("creationDate", creationDate.getTime());
		json.put("creationString", df.format(creationDate));
		json.put("dueDate", dueDate.getTime());
		json.put("dueDateString", df.format(dueDate));
		if (finishDate != null) {
			json.put("finishDate", finishDate.getTime());
			json.put("finishDateString", df.format(finishDate));
		}
		JSONArray filesArray = new JSONArray();
		Iterator<SourceFile> it = files.iterator();
		while (it.hasNext()) {
			filesArray.put(it.next().toJSON());
		}
		json.put("files", filesArray);
		return json.toString(2);
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public int getStatus() {
		return status;
	}

	public void setStatus(int status) {
		this.status = status;
	}

	public Language getSourceLang() {
		return sourceLang;
	}

	public void setSourceLang(Language sourceLang) {
		this.sourceLang = sourceLang;
	}

	public Language getTargetLang() {
		return targetLang;
	}

	public void setTargetLang(Language targetLang) {
		this.targetLang = targetLang;
	}

	public Date getCreationDate() {
		return creationDate;
	}

	public void setCreationDate(Date creationDate) {
		this.creationDate = creationDate;
	}

	public Date getDueDate() {
		return dueDate;
	}

	public void setDueDate(Date dueDate) {
		this.dueDate = dueDate;
	}

	public Date getFinishDate() {
		return finishDate;
	}

	public void setFinishDate(Date finishDate) {
		this.finishDate = finishDate;
	}

	public List<SourceFile> getFiles() {
		return files;
	}

	public void setFiles(List<SourceFile> files) {
		this.files = files;
	}

	public List<Memory> getMemories() {
		return memories;
	}

	public void setMemories(List<Memory> memories) {
		this.memories = memories;
	}

	public List<Glossary> getGlossaries() {
		return glossaries;
	}

	public void setGlossaries(List<Glossary> glossaries) {
		this.glossaries = glossaries;
	}

	@Override
	public int compareTo(Project o) {
		return creationDate.compareTo(o.getCreationDate());
	}

	@Override
	public boolean equals(Object obj) {
		if (!(obj instanceof Project)) {
			return false;
		}
		Project p = (Project) obj;
		return id.equals(p.getId());
	}

	@Override
	public int hashCode() {
		return id.hashCode();
	}
}
