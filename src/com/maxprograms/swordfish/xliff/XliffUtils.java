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

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

import com.maxprograms.swordfish.TmsServer;
import com.maxprograms.xml.Attribute;
import com.maxprograms.xml.Element;

public class XliffUtils {

    public static final String STYLE = "class='highlighted'";
    private static int maxTag =0;

    private XliffUtils() {
        // empty for security
    }

    protected static String highlight(String string, String target, boolean caseSensitive) {
        String result = string;
        int start = -1;
        String replacement = "<span " + STYLE + ">" + target + "</span>";
        if (caseSensitive) {
            start = result.indexOf(target);
        } else {
            start = result.toLowerCase().indexOf(target.toLowerCase());
            replacement = "<span " + STYLE + ">" + result.substring(start, start + target.length()) + "</span>";
        }
        while (start != -1) {
            result = result.substring(0, start) + replacement + result.substring(start + target.length());
            start = start + replacement.length();
            if (caseSensitive) {
                start = result.indexOf(target, start);
            } else {
                start = result.toLowerCase().indexOf(target.toLowerCase(), start);
                if (start != -1) {
                    replacement = "<span " + STYLE + ">" + result.substring(start, start + target.length()) + "</span>";
                }
            }
        }
        return result;
    }

    public static void checkSVG(int tag) throws IOException {
        if (tag <= maxTag) {
            return;
        }
        File folder = new File(TmsServer.getWorkFolder(), "images");
        if (!folder.exists()) {
            Files.createDirectories(folder.toPath());
        }
        File f = new File(folder, tag + ".svg");
        if (!f.exists()) {
            int width = 16;
            if (tag >= 10) {
                width = 22;
            }
            if (tag >= 100) {
                width = 28;
            }
            String svg = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
                    + "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"" + (width + 1)
                    + "px\" height=\"17px\" version=\"1.1\"><g>" + "<rect style=\"fill:#009688\" width=\"" + width
                    + "px\" height=\"16px\" x=\"1\" y=\"1\" rx=\"3\" ry=\"3\" />"
                    + "<text style=\"font-size:12px;font-style:normal;font-weight:normal;text-align:center;font-family:sans-serif;\" x=\"6\" y=\"14\" fill=\"#ffffff\" fill-opacity=\"1\">\n"
                    + "<tspan>" + tag + "</tspan></text></g></svg>";
            try (FileOutputStream out = new FileOutputStream(f)) {
                out.write(svg.getBytes(StandardCharsets.UTF_8));
            }
            maxTag = tag;
        }
    }

    public static String cleanAngles(String string) {
        String res = string.replace("&", "&amp;");
        res = res.replace("<", "\u200B\u2039");
        res = res.replace(">", "\u200B\u203A");
        return res;
    }

    public static String getHeader(Element e) {
        StringBuilder result = new StringBuilder();
        result.append('<');
        result.append(e.getName());
        List<Attribute> atts = e.getAttributes();
        Iterator<Attribute> it = atts.iterator();
        while (it.hasNext()) {
            Attribute a = it.next();
            result.append(' ');
            result.append(a.getName());
            result.append("=\"");
            result.append(unquote(cleanString(a.getValue())));
            result.append("\"");
        }
        result.append('>');
        return result.toString();
    }

    public static String getTail(Element e) {
        return "</" + e.getName() + ">";
    }

    public static String cleanString(String string) {
        return string.replace("&", "&amp;").replace("<", "&lt;");
    }

    public static String cleanQuote(String string) {
        return string.replace("\"", "&quot;");
    }

    public static String unquote(String string) {
        return string.replaceAll("\"", "\u200B\u2033");
    }

    public static List<String[]> harvestTags(String source) {
        List<String[]> result = new ArrayList<>();
        int index = source.indexOf("<img ");
        int tagNumber = 1;
        List<String> currentTags = new ArrayList<>();
        while (index >= 0) {
            String start = source.substring(0, index);
            String rest = source.substring(index + 1);
            int end = rest.indexOf('>');
            String tag = '<' + rest.substring(0, end) + ">";
            currentTags.add(tag);
            source = start + "[[" + tagNumber++ + "]]" + rest.substring(end + 1);
            index = source.indexOf("<img ");
        }
        for (int i=0 ; i<currentTags.size() ; i++) {
            String tag = currentTags.get(i);
            int start = tag.indexOf("data-ref=\"") + 10;
            int end = tag.indexOf("\"", start);
            String code = tag.substring(start, end);
            result.add(new String[]{code, tag});
        }
        return result;
    }
}