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

package com.maxprograms.swordfish.models;

import java.nio.charset.StandardCharsets;

import org.json.JSONObject;

public class SourceFile implements Comparable<SourceFile> {

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
		if (json.has("encoding")) {
			this.encoding = json.getString("encoding");
		} else {
			this.encoding = StandardCharsets.UTF_8.name();
		}
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
