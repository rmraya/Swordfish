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

import java.util.Hashtable;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.StringTokenizer;
import java.util.Vector;

public class NGrams {

	private static final int NGRAMSIZE = 3;
	public static final String SEPARATORS = " \r\n\f\t\u2028\u2029,.;\":<>¿?¡!()[]{}=+-/*\u00AB\u00BB\u201C\u201D\u201E\uFF00"; 
	// allow hyphen in terms
	public static final String TERM_SEPARATORS = " \u00A0\r\n\f\t\u2028\u2029,.;\":<>¿?¡!()[]{}=+/*\u00AB\u00BB\u201C\u201D\u201E\uFF00"; 

	public static int[] getNGrams(String source) {
		String src = source.toLowerCase();
		// src = normalise(src);
		List<String> words = buildWordList(src);
		Map<String, String> table = new Hashtable<>();

		Iterator<String> it = words.iterator();
		while (it.hasNext()) {
			String word = it.next();
			char[] array = word.toCharArray();
			int length = word.length();
			int ngrams = length / NGRAMSIZE;
			if (ngrams * NGRAMSIZE < length) {
				ngrams++;
			}
			for (int i = 0; i < ngrams; i++) {
				String gram = ""; 
				for (int j = 0; j < NGRAMSIZE; j++) {
					if (i * NGRAMSIZE + j < length) {
						char c = array[i * NGRAMSIZE + j];
						gram = gram + c;
					}
				}
				table.put("" + gram.hashCode(), ""); 
			}
		}

		Iterator<String> keys = table.keySet().iterator();
		int[] result = new int[table.size()];
		int idx = 0;
		while (keys.hasNext()) {
			result[idx++] = Integer.parseInt(keys.next());
		}
		return result;
	}

	private static List<String> buildWordList(String src) {
		List<String> result = new Vector<>();
		StringTokenizer tokenizer = new StringTokenizer(src, SEPARATORS);
		while (tokenizer.hasMoreElements()) {
			result.add(tokenizer.nextToken());
		}
		return result;
	}

}