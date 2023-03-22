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

package com.maxprograms.swordfish.tm;

import java.io.Serializable;
import java.util.Collections;
import java.util.HashSet;
import java.util.Hashtable;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Vector;

public class TU implements Serializable {
	
	private static final long serialVersionUID = 8284934106102485235L;
	
	private Set<String> langs;
	private Map<String, String> props;
	private List<String> notes;
	private String creationdate;
	private Map<String, Tuv> tuvs;

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
