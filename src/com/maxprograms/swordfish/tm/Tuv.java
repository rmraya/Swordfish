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

import java.io.Serializable;
import java.util.Hashtable;
import java.util.Map;

public class Tuv implements Serializable {

	private static final long serialVersionUID = -7241116367216426814L;
	
	private transient String tuid;
	private transient String lang;
	private String segment;
	private String pureText;
	private Map<String,String> props;
	
	public Tuv(String tuid, String lang, String segment, String pureText) {
		this.tuid = tuid;
		this.lang = lang;
		this.segment = segment;
		this.pureText = pureText;
		props = new Hashtable<>();
	}

	public String getTuid() {
		return tuid;
	}

	public String getLang() {
		return lang;
	}
	
	public String getSegment() {
		return segment;
	}
	
	public String getPureText() {
		return pureText;
	}

	public void setKey(String tuid, String lang) {
		this.tuid = tuid;
		this.lang = lang;
	}
	
	public void setProperties(Map<String, String> values) {
		props = values;
	}
	
	public Map<String, String> getProperties() {
		return props;
	}
	
	public String getProperty(String name) {
		return props.get(name);
	}
}
