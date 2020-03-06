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

import org.json.JSONObject;

public class Language implements Serializable, Comparable<Language> {

	private static final long serialVersionUID = -1036298903446869592L;

	private String code;
	private String name;

	public Language(String code, String name) {
		this.code = code;
		this.name = name;
	}

	public Language(JSONObject json) {
		this.code = json.getString("code");
		this.name = json.getString("name");
	}

	public String getCode() {
		return code;
	}

	public String getName() {
		return name;
	}

	public String getDisplayName() {
		if (!code.isEmpty()) {
			return code + " - " + name;
		}
		return name;
	}

	public boolean isBidi() {
		return code.startsWith("ar") || code.startsWith("fa") || code.startsWith("az") || code.startsWith("ur")
				|| code.startsWith("pa-PK") || code.startsWith("ps") || code.startsWith("prs") || code.startsWith("ug")
				|| code.startsWith("he") || code.startsWith("ji") || code.startsWith("yi");
	}

	public boolean isCJK() {
		return code.startsWith("zh") || code.startsWith("ja") || code.startsWith("ko") || code.startsWith("vi");
	}

	@Override
	public int compareTo(Language o) {
		return name.compareTo(o.name);
	}

	@Override
	public String toString() {
		return getDisplayName();
	}

	@Override
	public boolean equals(Object obj) {
		if (!(obj instanceof Language)) {
			return false;
		}
		Language lang = (Language) obj;
		return code.equals(lang.getCode()) && name.equals(lang.getName());
	}

	@Override
	public int hashCode() {
		return code.hashCode();
	}

	public JSONObject toJSON() {
		JSONObject json = new JSONObject();
		json.put("code", code);
		json.put("name", name);
		return json;
	}
}
