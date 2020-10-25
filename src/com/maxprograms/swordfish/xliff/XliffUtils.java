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
import java.util.Map;
import java.util.Vector;

import javax.xml.parsers.ParserConfigurationException;

import com.maxprograms.converters.FileFormats;
import com.maxprograms.swordfish.Constants;
import com.maxprograms.swordfish.TmsServer;
import com.maxprograms.swordfish.tm.TMUtils;
import com.maxprograms.xml.Attribute;
import com.maxprograms.xml.Document;
import com.maxprograms.xml.Element;
import com.maxprograms.xml.SAXBuilder;
import com.maxprograms.xml.TextNode;
import com.maxprograms.xml.XMLNode;

import org.json.JSONArray;
import org.json.JSONObject;
import org.xml.sax.SAXException;

public class XliffUtils {

    public static final String STYLE = "class='highlighted'";
    private static final String NOTXLIFF = "Selected file is not an XLIFF document";
    private static final String NOTSWORDFISH = "Selected file is not a Swordfish project";
    private static int maxTag = 0;

    private XliffUtils() {
        // empty for security
    }

    public static String highlight(String string, String target, boolean caseSensitive) {
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

    public static String highlightSpaces(String text) {
        StringBuilder start = new StringBuilder();
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            if (!isSpace(c)) {
                break;
            }
            start.append(c);
        }
        if (start.length() > 0) {
            text = "<span class='space'>" + start.toString() + "</span>" + text.substring(start.length());
        }
        StringBuilder end = new StringBuilder();
        for (int i = text.length() - 1; i >= 0; i--) {
            char c = text.charAt(i);
            if (!isSpace(c)) {
                break;
            }
            end.append(c);
        }
        if (end.length() > 0) {
            text = text.substring(0, text.length() - end.length()) + "<span class='space'>" + end.toString()
                    + "</span>";
        }
        return text;
    }

    public static boolean isSpace(char c) {
        if (c == '\u00A0') {
            return true;
        }
        return Character.isWhitespace(c);
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
        for (int i = 0; i < currentTags.size(); i++) {
            String tag = currentTags.get(i);
            int start = tag.indexOf("data-ref=\"") + 10;
            int end = tag.indexOf("\"", start);
            String code = tag.substring(start, end);
            result.add(new String[] { code, tag });
        }
        return result;
    }

    public static Element toXliff(String name, Element tuv, JSONObject tags) {
        Element xliff = new Element(name);
        List<XMLNode> newContent = new Vector<>();
        List<XMLNode> content = tuv.getChild("seg").getContent();
        Iterator<XMLNode> it = content.iterator();
        int tag = 1;
        while (it.hasNext()) {
            XMLNode node = it.next();
            if (node.getNodeType() == XMLNode.TEXT_NODE) {
                newContent.add(node);
            }
            if (node.getNodeType() == XMLNode.ELEMENT_NODE) {
                Element e = (Element) node;
                if ("ph".equals(e.getName())) {
                    Element ph = new Element("ph");
                    tag++;
                    ph.setAttribute("id", "ph" + tag);
                    ph.setAttribute("dataRef", "ph" + tag);
                    newContent.add(ph);
                    tags.put("ph" + tag, e.getText());
                }
                if ("bpt".equals(e.getName())) {
                    Element sc = new Element("sc");
                    tag++;
                    sc.setAttribute("id", e.getAttributeValue("i"));
                    sc.setAttribute("dataRef", "sc" + tag);
                    newContent.add(sc);
                    tags.put("sc" + tag, e.getText());
                }
                if ("ept".equals(e.getName())) {
                    Element ec = new Element("ec");
                    tag++;
                    ec.setAttribute("id", e.getAttributeValue("i"));
                    ec.setAttribute("dataRef", "ec" + tag);
                    newContent.add(ec);
                    tags.put("sc" + tag, e.getText());
                }
            }
        }
        xliff.setContent(newContent);
        return xliff;
    }

    public static Element toTu(String key, Element source, Element target, Map<String, String> tags) {
        String creationDate = TMUtils.creationDate();
        Element tu = new Element("tu");
        tu.setAttribute("tuid", key);
        tu.setAttribute("creationtool", Constants.APPNAME);
        tu.setAttribute("creationtoolversion", Constants.VERSION);
        tu.setAttribute("creationdate", creationDate);
        Element tuv = new Element("tuv");
        tuv.setAttribute("xml:lang", source.getAttributeValue("xml:lang"));
        tuv.setAttribute("creationdate", creationDate);
        tu.addContent(tuv);
        Element seg = new Element("seg");
        seg.setContent(toTmx(source, tags));
        tuv.addContent(seg);

        tuv = new Element("tuv");
        tuv.setAttribute("xml:lang", target.getAttributeValue("xml:lang"));
        tuv.setAttribute("creationdate", creationDate);
        tu.addContent(tuv);
        seg = new Element("seg");
        seg.setContent(toTmx(target, tags));
        tuv.addContent(seg);
        return tu;
    }

    private static List<XMLNode> toTmx(Element element, Map<String, String> tags) {
        List<XMLNode> result = new Vector<>();
        List<XMLNode> content = element.getContent();
        Iterator<XMLNode> it = content.iterator();
        while (it.hasNext()) {
            XMLNode node = it.next();
            if (node.getNodeType() == XMLNode.TEXT_NODE) {
                result.add(node);
            }
            if (node.getNodeType() == XMLNode.ELEMENT_NODE) {
                Element e = (Element) node;
                if (e.getName().equals("ph")) {
                    Element ph = new Element("ph");
                    String id = e.getAttributeValue("id");
                    ph.setAttribute("x", id);
                    if (tags.containsKey(id)) {
                        ph.setText(tags.get(id));
                    }
                    result.add(ph);
                }
            }
        }
        return result;
    }

    public static JSONObject getProjectDetails(File xliffFile) throws IOException {
        try {
            JSONObject result = new JSONObject();
            SAXBuilder builder = new SAXBuilder();
            Document doc = builder.build(xliffFile);
            Element xliff = doc.getRootElement();
            if (!"xliff".equals(xliff.getName())) {
                throw new IOException(NOTXLIFF);
            }
            if (!"2.0".equals(xliff.getAttributeValue("version"))) {
                throw new IOException(NOTSWORDFISH);
            }
            JSONArray filesArray = new JSONArray();
            List<Element> files = xliff.getChildren("file");
            Iterator<Element> it = files.iterator();
            while (it.hasNext()) {
                Element file = it.next();
                JSONObject fileObject = new JSONObject();
                fileObject.put("file", file.getAttributeValue("original"));
                Element skeleton = file.getChild("skeleton");
                if (skeleton == null) {
                    throw new IOException(NOTSWORDFISH);
                }
                if (!skeleton.getAttributeValue("href").isEmpty()) {
                    throw new IOException(NOTSWORDFISH);
                }
                Element metadata = file.getChild("mda:metadata");
                if (metadata == null) {
                    throw new IOException(NOTSWORDFISH);
                }
                boolean isOpenXLIFF = false;
                List<Element> groups = metadata.getChildren("mda:metaGroup");
                Iterator<Element> gt = groups.iterator();
                while (gt.hasNext()) {
                    Element group = gt.next();
                    if ("tool".equals(group.getAttributeValue("category"))) {
                        List<Element> metaList = group.getChildren("mda:meta");
                        Iterator<Element> mt = metaList.iterator();
                        while (mt.hasNext()) {
                            Element meta = mt.next();
                            if ("tool-id".equals(meta.getAttributeValue("type"))) {
                                isOpenXLIFF = "OpenXLIFF".equals(meta.getText());
                            }
                        }
                    }
                    if ("format".equals(group.getAttributeValue("category"))) {
                        List<Element> metaList = group.getChildren("mda:meta");
                        Iterator<Element> mt = metaList.iterator();
                        while (mt.hasNext()) {
                            Element meta = mt.next();
                            if ("datatype".equals(meta.getAttributeValue("type"))) {
                                fileObject.put("type", FileFormats.getFullName(meta.getText()));
                            }
                        }
                    }
                    if ("PI".equals(group.getAttributeValue("category"))) {
                        List<Element> metaList = group.getChildren("mda:meta");
                        Iterator<Element> mt = metaList.iterator();
                        while (mt.hasNext()) {
                            Element meta = mt.next();
                            if ("encoding".equals(meta.getAttributeValue("type"))) {
                                fileObject.put("encoding", meta.getText());
                            }
                        }
                    }
                }
                if (!isOpenXLIFF) {
                    throw new IOException(NOTSWORDFISH);
                }
                filesArray.put(fileObject);
            }
            result.put("sourceLang", xliff.getAttributeValue("srcLang"));
            result.put("targetLang", xliff.getAttributeValue("trgLang"));
            result.put("files", filesArray);
            return result;
        } catch (SAXException | ParserConfigurationException e) {
            throw new IOException(NOTXLIFF);
        }
    }

    public static String makeSVG(int percentage) {
        double width = percentage * 0.70;
        return "<svg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 0 72 24' width='72' class'stats'>"
                + "<rect x='0' y='0' width='72' height='24' class='statsRect'/><rect x='1' y='1' width='" + width
                + "' height='22' class='statsFiller'/><text x='50%' y='55%' class='statsText'>" + percentage
                + "%</text></svg>";
    }

    public static String clearSpan(String text) {
        int index = text.indexOf("<span");
        while (index != -1) {
            String start = text.substring(0, index);
            int end = text.indexOf('>', index + 1);
            text = start + text.substring(end + 1);
            index = text.indexOf("<span");
        }
        return text.replace("</span>", "");
    }

    public static String pureText(Element e) {
        StringBuilder string = new StringBuilder();
        List<XMLNode> content = e.getContent();
        Iterator<XMLNode> it = content.iterator();
        while (it.hasNext()) {
            XMLNode n = it.next();
            if (n.getNodeType() == XMLNode.TEXT_NODE) {
                TextNode t = (TextNode) n;
                string.append(t.getText());
            }
            if (n.getNodeType() == XMLNode.ELEMENT_NODE) {
                Element el = (Element) n;
                if ("mrk".equals(el.getName()) || "pc".equals(el.getName())) {
                    string.append(pureText(el));
                }
            }
        }
        return string.toString();
    }
}