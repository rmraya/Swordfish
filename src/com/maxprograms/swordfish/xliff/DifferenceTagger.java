/*******************************************************************************
 * Copyright (c) 2007-2021 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/

package com.maxprograms.swordfish.xliff;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.StringTokenizer;
import java.util.Vector;

import com.maxprograms.swordfish.tm.NGrams;

public class DifferenceTagger {

	private int[][] matrix;
	private Vector<String> xVector;
	private Vector<String> yVector;
	private StringBuffer differenceX;
	private StringBuffer differenceY;

	public static final String START = "\uF000";
	public static final String END = "\uF001";

	private void buildMatrix() {
		for (int i = 0; i < xVector.size(); i++) {
			matrix[i][0] = 0;
		}
		for (int j = 0; j < yVector.size(); j++) {
			matrix[0][j] = 0;
		}
		for (int i = 1; i < xVector.size() + 1; i++) {
			for (int j = 1; j < yVector.size() + 1; j++) {
				if (xVector.get(i - 1).equals(yVector.get(j - 1))) {
					matrix[i][j] = matrix[i - 1][j - 1] + 1;
				} else {
					matrix[i][j] = Math.max(matrix[i][j - 1], matrix[i - 1][j]);
				}
			}
		}
	}

	public DifferenceTagger(String x, String y) {
		xVector = buildWordList(x);
		yVector = buildWordList(y);
		matrix = new int[xVector.size() + 1][yVector.size() + 1];

		buildMatrix();
		difference();
	}

	public String getYDifferences() {
		String difference = differenceY.toString().replaceAll(END + "\\s" + START, " ");
		difference = difference.replace(START, "<span class='difference'>");
		difference = difference.replace(END, "</span>");
		return difference;
	}

	public String getXDifferences() {
		String difference = differenceX.toString().replaceAll(END + "\\s" + START, " ");
		difference = difference.replace(START, "<span class='difference'>");
		difference = difference.replace(END, "</span>");
		return difference;
	}

	private void difference() {
		int i = 1;
		int j = 1;
		int last = 0;

		Set<Integer> xValues = new LinkedHashSet<>();
		Set<Integer> yValues = new LinkedHashSet<>();

		for (i = 1; i < xVector.size() + 1; i++) {
			for (j = 1; j < yVector.size() + 1; j++) {
				if (matrix[i][j] > last) {
					xValues.add(Integer.valueOf(i - 1));
					yValues.add(Integer.valueOf(j - 1));
					last = matrix[i][j];
					break;
				}
			}
		}

		differenceX = new StringBuffer();
		boolean inDifference = false;
		for (i = 0; i < xVector.size(); i++) {
			if (!xValues.contains(Integer.valueOf(i))) {
				if (!inDifference) {
					inDifference = true;
					differenceX.append(START);
				}
			} else {
				if (inDifference) {
					inDifference = false;
					differenceX.append(END);
				}
			}
			differenceX.append(xVector.get(i));
		}
		if (inDifference) {
			inDifference = false;
			differenceX.append(END);
		}

		differenceY = new StringBuffer();
		for (j = 0; j < yVector.size(); j++) {
			if (!yValues.contains(Integer.valueOf(j))) {
				if (!inDifference) {
					inDifference = true;
					differenceY.append(START);
				}
			} else {
				if (inDifference) {
					inDifference = false;
					differenceY.append(END);
				}
			}
			differenceY.append(yVector.get(j));
		}
		if (inDifference) {
			differenceY.append(END);
		}
	}

	private static Vector<String> buildWordList(String src) {
		Vector<String> result = new Vector<>();
		StringTokenizer tokenizer = new StringTokenizer(src, NGrams.TERM_SEPARATORS, true);
		while (tokenizer.hasMoreElements()) {
			String tk = tokenizer.nextToken();
			StringBuilder word = new StringBuilder();
			for (int i = 0; i < tk.length(); i++) {
				if (isAsian(tk.charAt(i))) {
					if (word.length() != 0) {
						result.add(word.toString());
						word.setLength(0);
					}
					result.add(tk.charAt(i) + "");
				} else {
					word.append(tk.charAt(i));
				}
			}
			if (word.length() != 0) {
				result.add(word.toString());
			}
		}
		return result;
	}

	private static boolean isAsian(char c) {
		if (c >= '\u0E01' && c <= '\u05EB') {
			// Thai
			return true;
		}
		if (c >= '\u0E81' && c <= '\u0EDD') {
			// Lao
			return true;
		}
		if (c >= '\u0F00' && c <= '\u0FB9') {
			// Tibetan
			return true;
		}
		if (c >= '\uAC00' && c <= '\uFFDC') {
			// Korean
			return true;
		}
		if (c >= '\u3041' && c <= '\u3357') {
			// Japanese
			return true;
		}
		if (c >= '\u3105' && c <= '\u3125') {
			// Chinese BOPOMOFO
			return true;
		}
		if (c >= '\u4E00' && c <= '\uFA2D') {
			// CJK Ideographs
			return true;
		}
		if (c >= '\u3000' && c <= '\u303F') {
			// CJK Punctuation
			return true;
		}
		if (c >= '\u3190' && c <= '\u33FE') {
			// Ideographic Symbols
			return true;
		}
		if (c >= '\uFE30' && c <= '\uFE4F') {
			// CJK Compatibility forms
			return true;
		}
		return (c >= '\uFF61' && c <= '\uFFDC');
		// Halfwidth forms
	}

}
