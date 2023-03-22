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

import java.io.File;
import java.io.IOException;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.Map;
import java.util.NavigableSet;
import java.util.Set;

import org.mapdb.DB;
import org.mapdb.DBMaker;
import org.mapdb.Fun;

public class FuzzyIndex {

	private Map<String, NavigableSet<Fun.Tuple2<Integer, String>>> maps;
	private Map<String, DB> databases;
	private File folder;

	public FuzzyIndex(File folder) {
		this.folder = folder;
		databases = new Hashtable<>();
		maps = new Hashtable<>();
	}

	NavigableSet<Fun.Tuple2<Integer, String>> getIndex(String lang) throws IOException {
		if (!maps.containsKey(lang)) {
			DB mapdb = null;
			try {
				mapdb = DBMaker.newFileDB(new File(folder, "index_" + lang)).closeOnJvmShutdown().make();
			} catch (Error ioe) {
				throw new IOException(ioe.getMessage());
			}
			NavigableSet<Fun.Tuple2<Integer, String>> multiMap = mapdb.getTreeSet(lang);
			databases.put(lang, mapdb);
			maps.put(lang, multiMap);
		}
		return maps.get(lang);
	}

	public synchronized void commit() {
		Set<String> set = databases.keySet();
		Iterator<String> keys = set.iterator();
		while (keys.hasNext()) {
			String key = keys.next();
			databases.get(key).commit();
		}
	}

	public void rollback() {
		Set<String> set = databases.keySet();
		Iterator<String> keys = set.iterator();
		while (keys.hasNext()) {
			String key = keys.next();
			databases.get(key).rollback();
		}
	}

	public synchronized void close() {
		Set<String> set = databases.keySet();
		Iterator<String> keys = set.iterator();
		while (keys.hasNext()) {
			DB db = databases.get(keys.next());
			db.close();
		}
		databases.clear();
		maps.clear();
	}
}
