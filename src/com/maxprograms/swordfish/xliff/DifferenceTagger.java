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

package com.maxprograms.swordfish.xliff;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.StringTokenizer;
import java.util.Vector;

import com.maxprograms.swordfish.tm.NGrams;


public class DifferenceTagger {

	private int[][] C;
	private Vector<String> X;
	private Vector<String> Y;
	private StringBuffer differenceX;
	private StringBuffer differenceY;

	public static final String START = "\uF000";
	public static final String END = "\uF001";

	private void buildMatrix() {
		for (int i = 0; i < X.size(); i++) {
			C[i][0] = 0;
		}
		for (int j = 0; j < Y.size(); j++) {
			C[0][j] = 0;
		}
		for (int i = 1; i < X.size() + 1; i++) {
			for (int j = 1; j < Y.size() + 1; j++) {
				if (X.get(i - 1).equals(Y.get(j - 1))) {
					C[i][j] = C[i - 1][j - 1] + 1;
				} else {
					C[i][j] = Math.max(C[i][j - 1], C[i - 1][j]);
				}
			}
		}
	}

	public DifferenceTagger(String x, String y) {
		X = buildWordList(x);
		Y = buildWordList(y);
		C = new int[X.size() + 1][Y.size() + 1];

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

		Set<Integer> xValues = new LinkedHashSet<Integer>();
		Set<Integer> yValues = new LinkedHashSet<Integer>();

		for (i = 1; i < X.size() + 1; i++) {
			for (j = 1; j < Y.size() + 1; j++) {
				if (C[i][j] > last) {
					xValues.add(Integer.valueOf(i - 1));
					yValues.add(Integer.valueOf(j - 1));
					last = C[i][j];
					break;
				}
			}
		}

		differenceX = new StringBuffer();
		boolean inDifference = false;
		for (i = 0; i < X.size(); i++) {
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
			differenceX.append(X.get(i));
		}
		if (inDifference) {
			inDifference = false;
			differenceX.append(END);
		}

		differenceY = new StringBuffer();
		for (j = 0; j < Y.size(); j++) {
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
			differenceY.append(Y.get(j));
		}
		if (inDifference) {
			inDifference = false;
			differenceY.append(END);
		}
	}

	private static Vector<String> buildWordList(String src) {
		Vector<String> result = new Vector<String>();
		StringTokenizer tokenizer = new StringTokenizer(src, NGrams.TERM_SEPARATORS, true);
		while (tokenizer.hasMoreElements()) {
			String tk = tokenizer.nextToken();
			String word = "";
			for (int i = 0; i < tk.length(); i++) {
				if (isAsian(tk.charAt(i))) {
					if (!word.equals("")) {
						result.add(word);
						word = "";
					}
					result.add(tk.charAt(i) + "");
				} else {
					word += tk.charAt(i);
				}
			}
			if (!word.equals("")) {
				result.add(word);
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
		if (c >= '\uFF61' && c <= '\uFFDC') {
			// Halfwidth forms
			return true;
		}
		return false;
	}

}
