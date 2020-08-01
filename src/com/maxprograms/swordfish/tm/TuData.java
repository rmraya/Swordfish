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
	private String userid;

	public TuData(String userid, String creationdate, Set<String> langs, Map<String,String> props, List<String> notes) {
		this.userid = userid;
		this.creationdate = creationdate;
		this.langs = langs;
		this.props = props;
		this.notes = notes;
	}
		
	public String getUser() {
		return userid;
	}
	
	public String getCreationDate() {
		return creationdate;
	}
	
	public Set<String> getLangs() {
		return langs;
	}
	
	public Map<String,String> getProps() {
		return props;
	}
	
	public List<String> getNotes() {
		return notes;
	}
}
