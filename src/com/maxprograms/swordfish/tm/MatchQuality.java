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

public class MatchQuality {

    static final int PENALTY = 2;

    private MatchQuality() {
        // private for security
    }

    private static String lcs(String x, String y) {
        String result = "";
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
        while (max > 0) {
            result = x.charAt(mx - 1) + result;
            max--;
            mx--;
        }

        return result;
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
        while (!lcs.trim().equals("") && lcs.length() > longest * PENALTY / 100) {
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