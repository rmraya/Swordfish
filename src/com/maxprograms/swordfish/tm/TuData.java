/*******************************************************************************
 * Copyright (c) 2007-2022 Maxprograms.
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
import java.util.List;
import java.util.Map;
import java.util.Set;

public class TuData implements Serializable {

	private static final long serialVersionUID = -4527612217830153690L;
	private Set<String> langs;
	private Map<String, String> props;
	private List<String> notes;
	private String creationdate;

	public TuData(String creationdate, Set<String> langs, Map<String, String> props, List<String> notes) {
		this.creationdate = creationdate;
		this.langs = langs;
		this.props = props;
		this.notes = notes;
	}

	public String getCreationDate() {
		return creationdate;
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
}
