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
		mapdb = DBMaker.newFileDB(new File(folder, "tudata")).closeOnJvmShutdown().make();
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
