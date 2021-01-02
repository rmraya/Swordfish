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

package com.maxprograms.swordfish.tm;

import java.util.Collections;
import java.util.HashSet;
import java.util.Hashtable;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Vector;

public class TU {
	private Set<String> langs;
	private Map<String, String> props;
	private List<String> notes;
	private String creationdate;
	Map<String, Tuv> tuvs;

	public TU() {
		langs = Collections.synchronizedSet(new HashSet<>());
		props = new Hashtable<>();
		notes = new Vector<>();
		tuvs = new Hashtable<>();
	}

	public void setData(TuData data) {
		langs = data.getLangs();
		props = data.getProps();
		notes = data.getNotes();
		creationdate = data.getCreationDate();
	}

	public void setProps(Map<String, String> values) {
		props = values;
		if (creationdate != null && props != null) {
			props.put("creationdate", creationdate);
		}
	}

	public String getCreationDate() {
		return creationdate;
	}

	public void setCreationDate(String value) {
		creationdate = value;
		if (props != null) {
			props.put("creationdate", value);
		}
	}

	public Set<String> getLangs() {
		return langs;
	}

	public Map<String, String> getProps() {
		return props;
	}

	public List<String> getNotes() {
		return notes;
	}

	public void addTuv(String lang, Tuv tuv) {
		langs.add(lang);
		tuvs.put(lang, tuv);
	}

	public void setProperty(String name, String value) {
		props.put(name, value);
	}

	public void setLangs(Set<String> set) {
		langs = set;
	}

	public void setTuvs(Map<String, Tuv> values) {
		tuvs = values;
	}

	public Tuv getTuv(String lang) {
		return tuvs.get(lang);
	}

	public String getProperty(String name) {
		return props.get(name);
	}

	public Map<String, Tuv> getTuvs() {
		return tuvs;
	}

	public void setNotes(List<String> notes) {
		this.notes = notes;
	}
}
