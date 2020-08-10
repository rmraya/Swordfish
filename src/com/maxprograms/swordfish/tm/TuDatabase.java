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

import java.io.File;
import java.util.Set;
import java.util.Vector;

import com.maxprograms.xml.Element;

import org.mapdb.DB;
import org.mapdb.DBMaker;
import org.mapdb.HTreeMap;

public class TuDatabase {

	private DB mapdb;
	private HTreeMap<Integer, Element> tumap;
	private Set<String> projects;
	private Set<String> subjects;
	private Set<String> customers;

	public TuDatabase(File folder) {
		mapdb = DBMaker.newFileDB(new File(folder, "tudata")).closeOnJvmShutdown().asyncWriteEnable().make();
		tumap = mapdb.getHashMap("tuvmap");
		projects = mapdb.getHashSet("projects");
		subjects = mapdb.getHashSet("subjects");
		customers = mapdb.getHashSet("customers");
	}

	public synchronized void commit() {
		mapdb.commit();
	}

	public void compact() {
		mapdb.compact();
	}

	public synchronized void close() {
		mapdb.close();
	}

	public synchronized void store(String tuid, Element tu) {
		tu.removeChild("tuv");
		if (tu.getChildren().isEmpty()) {
			tu.setContent(new Vector<>());
		}
		tumap.put(tuid.hashCode(), tu);
	}

	public Element getTu(String tuid) {
		return tumap.get(tuid.hashCode());
	}

	public void rollback() {
		mapdb.rollback();
	}

	public void storeSubject(String sub) {
		subjects.add(sub);
	}

	public void storeCustomer(String cust) {
		customers.add(cust);
	}

	public void storeProject(String proj) {
		projects.add(proj);
	}

	public Set<String> getCustomers() {
		return customers;
	}

	public Set<String> getProjects() {
		return projects;
	}

	public Set<String> getSubjects() {
		return subjects;
	}

	public Set<Integer> getKeys() {
		return tumap.keySet();
	}

	public Element getTu(Integer hashCode) {
		return tumap.get(hashCode);
	}

	public void remove(String tuid) {
		tumap.remove(tuid.hashCode());
	}
}
