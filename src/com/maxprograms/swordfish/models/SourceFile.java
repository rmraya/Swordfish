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
package com.maxprograms.swordfish.models;

import java.io.Serializable;

import org.json.JSONObject;

public class SourceFile implements Serializable, Comparable<SourceFile> {

	private static final long serialVersionUID = -3726822493975520037L;
	private String file;
	private String type;
	private String encoding;

	public SourceFile(String file, String type, String encoding) {
		this.file = file;
		this.type = type;
		this.encoding = encoding;
	}

	public SourceFile(JSONObject json) {
		this.file = json.getString("file");
		this.type = json.getString("type");
		this.encoding = json.getString("encoding");
	}

	public String getFile() {
		return file;
	}

	public void setFile(String file) {
		this.file = file;
	}

	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}

	public String getEncoding() {
		return encoding;
	}

	public void setEncoding(String encoding) {
		this.encoding = encoding;
	}

	public JSONObject toJSON() {
		JSONObject result = new JSONObject();
		result.put("file", file);
		result.put("type", type);
		result.put("encoding", encoding);
		return result;
	}

	@Override
	public int compareTo(SourceFile o) {
		return file.compareTo(o.getFile());
	}

	@Override
	public boolean equals(Object obj) {
		if (!(obj instanceof SourceFile)) {
			return false;
		}
		SourceFile s = (SourceFile) obj;
		return file.equals(s.getFile()) && type.equals(s.getType()) && encoding.equals(s.getEncoding());
	}

	@Override
	public int hashCode() {
		return (file + type + encoding).hashCode();
	}
}
