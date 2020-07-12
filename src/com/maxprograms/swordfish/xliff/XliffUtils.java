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
import java.lang.System.Logger;
import java.lang.System.Logger.Level;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.maxprograms.swordfish.Constants;
import com.maxprograms.swordfish.TmsServer;
import com.maxprograms.swordfish.Utils;
import com.maxprograms.xml.Attribute;
import com.maxprograms.xml.Element;
import com.maxprograms.xml.TextNode;
import com.maxprograms.xml.XMLNode;

public class XliffUtils {

   

    public static final String STYLE = "class='highlighted'";

    private static int maxTag;
    private static int tag;
    private static HashMap<String, String> tags;
    private static Pattern pattern;
    private static String lastFilterText;

    private XliffUtils() {
        // empty for security
    }

    public static String pureText(Element seg, boolean clearTags, String filterText, boolean caseSensitive,
            boolean regExp) throws IOException {

        if (seg == null) {
            return "";
        }
        if (clearTags) {
            if (tags != null) {
                tags.clear();
                tags = null;
            }
            tags = new HashMap<>();
            tag = 1;
        }
        List<XMLNode> list = seg.getContent();
        Iterator<XMLNode> it = list.iterator();
        StringBuilder text = new StringBuilder();
        while (it.hasNext()) {
            XMLNode o = it.next();
            if (o.getNodeType() == XMLNode.TEXT_NODE) {
                if (filterText == null || filterText.isEmpty()) {
                    text.append(cleanString(((TextNode) o).getText()));
                } else {
                    if (regExp) {
                        if (pattern == null || !filterText.equals(lastFilterText)) {
                            pattern = Pattern.compile(filterText);
                            lastFilterText = filterText;
                        }
                        String s = ((TextNode) o).getText();
                        Matcher matcher = pattern.matcher(s);
                        if (matcher.find()) {
                            StringBuilder sb = new StringBuilder();
                            do {
                                int start = matcher.start();
                                int end = matcher.end();
                                sb.append(cleanString(s.substring(0, start)));
                                sb.append("<span " + STYLE + ">");
                                sb.append(cleanString(s.substring(start, end)));
                                sb.append("</span>");
                                s = s.substring(end);
                                matcher = pattern.matcher(s);
                            } while (matcher.find());
                            sb.append(cleanString(s));
                            text.append(sb.toString());
                        } else {
                            text.append(cleanString(s));
                        }
                    } else {
                        String s = cleanString(((TextNode) o).getText());
                        String t = cleanString(filterText);
                        if (caseSensitive) {
                            if (s.indexOf(t) != -1) {
                                text.append(highlight(s, t, caseSensitive));
                            } else {
                                text.append(s);
                            }
                        } else {
                            if (s.toLowerCase().indexOf(t.toLowerCase()) != -1) {
                                text.append(highlight(s, t, caseSensitive));
                            } else {
                                text.append(s);
                            }
                        }
                    }
                }
            } else if (o.getNodeType() == XMLNode.ELEMENT_NODE) {
                // empty: <cp>, <ph>, <sc>, <ec>, <sm> and <em>.
                // paired: <pc>, <mrk>,
                Element e = (Element) o;
                String type = e.getName();
                if (type.equals("pc")) {
                    checkSVG();
                    String header = getHeader(e);
                    tags.put("[[" + tag + "]]", header);
                    text.append("<img src='");
                    text.append(TmsServer.getWorkFolder().toURI().toURL().toString());
                    text.append("images/");
                    text.append(tag++);
                    text.append(".svg' align='bottom' alt='' title=\"");
                    text.append(unquote(cleanAngles(header)));
                    text.append("\"/>");
                    text.append(pureText(e, false, filterText, caseSensitive, regExp));
                    checkSVG();
                    String tail = getTail(e);
                    tags.put("[[" + tag + "]]", tail);
                    text.append("<img src='");
                    text.append(TmsServer.getWorkFolder().toURI().toURL().toString());
                    text.append("images/");
                    text.append(tag++);
                    text.append(".svg' align='bottom' alt='' title=\"");
                    text.append(unquote(cleanAngles(tail)));
                    text.append("\"/>");
                } else if (type.equals("mrk")) {
                    text.append("<span " + STYLE + ">");
                    text.append(e.getText());
                    text.append("</span>");
                } else {
                    checkSVG();
                    String element = e.toString();
                    tags.put("[[" + tag + "]]", element);
                    text.append("<img src='");
                    text.append(TmsServer.getWorkFolder().toURI().toURL().toString());
                    text.append("images/");
                    text.append(tag++);
                    text.append(".svg' align='bottom' alt='' title=\"");
                    text.append(unquote(cleanAngles(element)));
                    text.append("\"/>");
                }
            }
        }
        return text.toString();
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

    public static void resetTags() {
        maxTag = 0;
    }

    private static void checkSVG() throws IOException {
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

    private static String cleanAngles(String string) {
        String res = string.replace("&", "&amp;");
        res = res.replace("<", "\u200B\u2039");
        res = res.replace(">", "\u200B\u203A");
        return res;
    }

    private static String getHeader(Element e) {
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

    private static String getTail(Element e) {
        return "</" + e.getName() + ">";
    }

    public static String cleanString(String string) {
        return string.replace("&", "&amp;").replace("<", "&lt;");
    }

    public static String cleanQuote(String string) {
        return string.replace("\"", "&quot;");
    }

    private static String unquote(String string) {
        return string.replaceAll("\"", "\u200B\u2033");
    }


    public static String toHTML(int index, Element seg, boolean clearTags, String filterText,
            boolean caseSensitive, boolean regExp) {
        String status = seg.getAttributeValue("state", Constants.INITIAL);
        StringBuilder html = new StringBuilder();
        Element source = seg.getChild("source");
        String srcLang = source.getAttributeValue("xml:lang");
        Element target = seg.getChild("target");
        String tgtLang = ""; 
        if (target != null) {
            tgtLang = target.getAttributeValue("xml:lang");
        }
        html.append("<tr data-id=\"");
        html.append(seg.getAttributeValue("id"));
        html.append("\" data-file=\"");
        html.append(cleanString(seg.getPI("currentFile").get(0).getData()));
        html.append("\" data-unit=\"");
        html.append(cleanString(seg.getPI("currentUnit").get(0).getData()));
        html.append("\"><td class='middle center noWrap ");
        html.append(status);
        html.append("'>");
        html.append(index);
        html.append("</td>");
        html.append("<td class='source' lang=\"");
        html.append(srcLang);
        html.append("\"");
        if (Utils.isBiDi(srcLang)) {
            html.append(" dir='rtl'");
        }
        html.append('>');
        html.append(getHTML(source, clearTags, filterText, caseSensitive, regExp));
        html.append("</td>");
        html.append("<td class='middle'><input type='checkbox' class='rowCheck'></td>");
        html.append("<td class='target' lang=\"");
        html.append(tgtLang);
        html.append("\"");
        if (Utils.isBiDi(tgtLang)) {
            html.append(" dir='rtl'");
        }
        html.append('>');
        html.append(getHTML(target, clearTags, filterText, caseSensitive, regExp));
        html.append("</td>");

        html.append("</tr>");
        return html.toString();
    }

    private static String getHTML(Element e, boolean clearTags, String filterText, boolean caseSensitive, boolean regExp) {
        if (e == null) {
            return "";
        }
        try {
            String tagged = XliffUtils.pureText(e, clearTags, filterText, caseSensitive, regExp);
            return tagged;
        } catch (IOException e1) {
            Logger logger = System.getLogger(XliffUtils.class.getName());
            logger.log(Level.ERROR, e1);
        }
        return e.getText(); 
    }
}