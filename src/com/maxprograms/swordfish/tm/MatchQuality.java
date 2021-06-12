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

package com.maxprograms.swordfish.tm;

public class MatchQuality {

    static final int PENALTY = 2;

    private MatchQuality() {
        // private for security
    }

    private static String lcs(String x, String y) {
        int m = x.length();
        int n = y.length();
        int max = 0;
        int mx = 0;

        // opt[i][j] = length of LCS of x[i..M] and y[j..N]
        int[][] opt = new int[m + 1][n + 1];

        // fill the matrix
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (x.charAt(i - 1) == y.charAt(j - 1)) {
                    opt[i][j] = opt[i - 1][j - 1] + 1;
                    if (opt[i][j] > max) {
                        // remember where the maximum length is
                        max = opt[i][j];
                        mx = i;
                    }
                } else {
                    opt[i][j] = 0;
                }
            }
        }

        // recover the LCS
        StringBuilder result = new StringBuilder();
        while (max > 0) {
            result.insert(0, x.charAt(mx - 1));
            max--;
            mx--;
        }
        return result.toString();
    }

    public static int similarity(String x, String y) {
        int result = 0;
        x = x.trim();
        y = y.trim();
        int longest = Math.max(x.length(), y.length());
        if (longest == 0) {
            return 0;
        }
        String a;
        String b;
        if (x.length() == longest) {
            a = x;
            b = y;
        } else {
            a = y;
            b = x;
        }
        // a is the longest string
        int count = -1;
        int idx;
        String lcs = lcs(a, b);
        while (!lcs.trim().isEmpty() && lcs.length() > longest * PENALTY / 100) {
            count++;
            idx = a.indexOf(lcs);
            a = a.substring(0, idx) + a.substring(idx + lcs.length());
            idx = b.indexOf(lcs);
            b = b.substring(0, idx) + b.substring(idx + lcs.length());
            lcs = lcs(a, b);
        }
        result = 100 * (longest - a.length()) / longest - count * PENALTY;
        if (result < 0) {
            result = 0;
        }
        return result;
    }

}