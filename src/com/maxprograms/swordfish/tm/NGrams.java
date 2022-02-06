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

import java.util.Hashtable;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.StringTokenizer;
import java.util.Vector;

public class NGrams {

	private NGrams() {
		// private for security
	}

	private static final int NGRAMSIZE = 3;
	public static final String SEPARATORS = " \r\n\f\t\u2028\u2029,.;\":<>¿?¡!()[]{}=+-/*\u00AB\u00BB\u201C\u201D\u201E\uFF00";
	// allow hyphen in terms
	public static final String TERM_SEPARATORS = " \u00A0\r\n\f\t\u2028\u2029,.;\":<>¿?¡!()[]{}=+/*\u00AB\u00BB\u201C\u201D\u201E\uFF00";

	public static int[] getNGrams(String source) {
		String src = source.toLowerCase();
		List<String> words = buildWordList(src, SEPARATORS);
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
				StringBuilder gram = new StringBuilder();
				for (int j = 0; j < NGRAMSIZE; j++) {
					if (i * NGRAMSIZE + j < length) {
						char c = array[i * NGRAMSIZE + j];
						gram.append(c);
					}
				}
				table.put("" + gram.toString().hashCode(), "");
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

	public static List<String> buildWordList(String src, String separator) {
		List<String> result = new Vector<>();
		StringTokenizer tokenizer = new StringTokenizer(src, separator);
		while (tokenizer.hasMoreElements()) {
			result.add(tokenizer.nextToken());
		}
		return result;
	}
}