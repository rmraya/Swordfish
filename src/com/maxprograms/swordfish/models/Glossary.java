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
import java.util.Date;

public class Glossary implements Serializable, Comparable<Glossary> {

	private static final long serialVersionUID = 1721716907236009071L;

	private String id;
	private String name;
	private String project;
	private String subject;
	private String client;
	private Date creationDate;
	private String comment;
	
	public Glossary(String id, String name, String project, String subject, String client, Date creationDate, String comment) {
		this.id = id;
		this.name = name;
		this.project = project;
		this.subject = subject;
		this.client = client;
		this.creationDate = creationDate;
		this.comment = comment;
	}
	
	public String getId() {
		return id;
	}
	
	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
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

	public String getComment() {
		return comment;
	}

	public void setComment(String comment) {
		this.comment = comment;
	}

	
	@Override
	public int compareTo(Glossary o) {
		return name.compareTo(o.name);
	}
	
	@Override
	public boolean equals(Object obj) {
		if (!(obj instanceof Glossary)) {
			return false;
		}
		Glossary m = (Glossary)obj;
		return id.equals(m.getId());
	}

	@Override
	public int hashCode() {
		return id.hashCode();
	}
}
