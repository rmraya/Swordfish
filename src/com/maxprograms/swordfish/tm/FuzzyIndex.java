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
	
	private Map<String, NavigableSet<Fun.Tuple2<Integer,String>>> maps;
	private Map<String, DB> databases;
	private File folder;

	public FuzzyIndex(File folder) {
		this.folder = folder;
		databases = new Hashtable<>();
		maps = new Hashtable<>();
	}
	
	NavigableSet<Fun.Tuple2<Integer,String>> getIndex(String lang) throws IOException {
		if (!maps.containsKey(lang)) {
			DB mapdb = null;
			try {
				mapdb = DBMaker.newFileDB(new File(folder, "index_" + lang)).closeOnJvmShutdown().asyncWriteEnable().make(); 
			} catch (Error ioe) {
				throw new IOException(ioe.getMessage());
			}
			NavigableSet<Fun.Tuple2<Integer,String>> multiMap = mapdb.getTreeSet(lang);
			databases.put(lang, mapdb);
			maps.put(lang, multiMap);
		}
		return maps.get(lang);
	}

	synchronized public void commit() {
		Iterator<String> keys = databases.keySet().iterator();
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

	synchronized public void close() {
		Iterator<String> keys = databases.keySet().iterator();
		while (keys.hasNext()) {
			String key = keys.next();
			maps.remove(key);
			DB db = databases.get(key);
			databases.remove(key);
			db.close();
		}
	}
}
