/*******************************************************************************
 * Copyright (c) 2007 - 2025 Maxprograms.
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

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Vector;

import javax.xml.parsers.ParserConfigurationException;

import org.json.JSONArray;
import org.json.JSONObject;
import org.xml.sax.SAXException;

import com.maxprograms.converters.FileFormats;
import com.maxprograms.swordfish.Constants;
import com.maxprograms.swordfish.TmsServer;
import com.maxprograms.swordfish.tm.TMUtils;
import com.maxprograms.xml.Document;
import com.maxprograms.xml.Element;
import com.maxprograms.xml.Indenter;
import com.maxprograms.xml.SAXBuilder;
import com.maxprograms.xml.TextNode;
import com.maxprograms.xml.XMLNode;
import com.maxprograms.xml.XMLOutputter;

public class XliffUtils {

	public static final String STYLE = "class='highlighted'";
	private static final String NOTXLIFF = Messages.getString("XliffUtils.0");
	private static final String NOTSWORDFISH = Messages.getString("XliffUtils.1");
	private static final String NOTSHARED = Messages.getString("XliffUtils.2");
	private static int maxTag = 0;
	private static JSONObject tags;

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
			File tagColors = new File(folder, "tagColors.json");
			JSONObject colors = new JSONObject();
			colors.put("background", "#009688");
			colors.put("foreground", "#ffffff");
			try (FileOutputStream out = new FileOutputStream(tagColors)) {
				out.write(colors.toString(2).getBytes(StandardCharsets.UTF_8));
			}
		}
		File f = new File(folder, tag + ".svg");
		if (!f.exists()) {
			File colorsFile = new File(folder, "tagColors.json");
			if (!colorsFile.exists()) {
				JSONObject colors = new JSONObject();
				colors.put("background", "#009688");
				colors.put("foreground", "#ffffff");
				try (FileOutputStream out = new FileOutputStream(colorsFile)) {
					out.write(colors.toString(2).getBytes(StandardCharsets.UTF_8));
				}
			}
			JSONObject colors = TmsServer.readJSON(colorsFile);
			int width = 16;
			if (tag >= 10) {
				width = 22;
			}
			if (tag >= 100) {
				width = 28;
			}
			String svg = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
					+ "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"" + (width + 1)
					+ "px\" height=\"17px\" version=\"1.1\"><g><rect style=\"fill:" + colors.getString("background")
					+ "\" width=\"" + width
					+ "px\" height=\"16px\" x=\"1\" y=\"1\" rx=\"3\" ry=\"3\" />"
					+ "<text style=\"font-size:12px;font-style:normal;font-weight:normal;text-align:center;font-family:sans-serif;\" x=\"6\" y=\"14\" fill=\""
					+ colors.getString("foreground") + "\" fill-opacity=\"1\">\n"
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

	public static String cleanString(String string) {
		return string.replace("&", "&amp;").replace("<", "&lt;");
	}

	public static String cleanQuote(String string) {
		return string.replace("\"", "&quot;");
	}

	public static String unquote(String string) {
		return string.replace("\"", "\u200B\u2033");
	}

	public static List<String[]> harvestTags(String source) {
		List<String[]> result = new Vector<>();
		int index = source.indexOf("<img ");
		int tagNumber = 1;
		List<String> currentTags = new Vector<>();
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

	public static void setTags(JSONObject json) {
		tags = json;
	}

	public static JSONObject getTags() {
		return tags;
	}

	public static Element toXliff(String segId, int match, String name, Element tuv) {
		Element xliff = new Element(name);
		List<XMLNode> newContent = new Vector<>();
		List<XMLNode> content = tuv.getChild("seg").getContent();
		Map<String, String> pairs = new HashMap<>();
		Iterator<XMLNode> it = content.iterator();
		int tag = 0;
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
					ph.setAttribute("id", segId + "_" + match + "_ph" + tag);
					ph.setAttribute("dataRef", segId + "_" + match + "_ph" + tag);
					newContent.add(ph);
					tags.put(segId + "_" + match + "_ph" + tag, e.getText());
				}
				if ("bpt".equals(e.getName())) {
					Element sc = new Element("sc");
					tag++;
					sc.setAttribute("id", segId + "_" + match + "_sc" + tag);
					sc.setAttribute("dataRef", segId + "_" + match + "_sc" + tag);
					newContent.add(sc);
					tags.put(segId + "_" + match + "_sc" + tag, e.getText());
					pairs.put(e.getAttributeValue("i"), segId + "_" + match + "_sc" + tag);
				}
				if ("ept".equals(e.getName())) {
					Element ec = new Element("ec");
					tag++;
					ec.setAttribute("dataRef", segId + "_" + match + "_ec" + tag);
					ec.setAttribute("startRef", pairs.get(e.getAttributeValue("i")));
					newContent.add(ec);
					tags.put(segId + "_" + match + "_ec" + tag, e.getText());
				}
			}
		}
		xliff.setContent(newContent);
		return xliff;
	}

	public static Element toTu(String key, Element source, Element target, Map<String, String> tags, String srcLang,
			String tgtLang, String[] context) {
		String creationDate = TMUtils.creationDate();
		Element tu = new Element("tu");
		tu.setAttribute("tuid", key);
		tu.setAttribute("creationtool", Constants.APPNAME);
		tu.setAttribute("creationtoolversion", Constants.VERSION);
		tu.setAttribute("creationdate", creationDate);
		if (context[0] != null) {
			Element prop = new Element("prop");
			prop.setAttribute("type", "prev-" + srcLang + "-" + tgtLang);
			prop.setText(context[0]);
			tu.addContent(prop);
		}
		if (context[1] != null) {
			Element prop = new Element("prop");
			prop.setAttribute("type", "next-" + srcLang + "-" + tgtLang);
			prop.setText(context[1]);
			tu.addContent(prop);
		}
		Element tuv = new Element("tuv");
		tuv.setAttribute("xml:lang", srcLang);
		tuv.setAttribute("creationdate", creationDate);
		tu.addContent(tuv);
		Element seg = new Element("seg");
		seg.setContent(toTmx(source, tags));
		tuv.addContent(seg);

		tuv = new Element("tuv");
		tuv.setAttribute("xml:lang", tgtLang);
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
				if ("ph".equals(e.getName())) {
					Element ph = new Element("ph");
					String id = e.getAttributeValue("id");
					ph.setAttribute("x", "" + id.hashCode());
					if (tags.containsKey(id)) {
						ph.setText(tags.get(id));
					}
					result.add(ph);
				}
				if ("pc".equals(e.getName())) {
					Element head = new Element("ph");
					head.setText("<pc id\"" + e.getAttributeValue("id") + "\">");
					result.add(head);
					result.addAll(e.getContent());
					Element tail = new Element("ph");
					tail.setText("</pc>");
					result.add(tail);
				}
				if ("mrk".equals(e.getName())) {
					result.addAll(toTmx(e, tags));
				}
			}
		}
		return result;
	}

	public static String getProjectId(File xliffFile) throws IOException {
		try {
			String projectId = "";
			SAXBuilder builder = new SAXBuilder();
			Document doc = builder.build(xliffFile);
			Element xliff = doc.getRootElement();
			if (!"xliff".equals(xliff.getName())) {
				throw new IOException(NOTXLIFF);
			}
			if (!xliff.getAttributeValue("version").startsWith("2.")) {
				throw new IOException(NOTSHARED);
			}
			Element file = xliff.getChild("file");
			Element metadata = file.getChild("mda:metadata");
			if (metadata == null) {
				throw new IOException(NOTSHARED);
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
							isOpenXLIFF = com.maxprograms.converters.Constants.TOOLID.equals(meta.getText());
						}
					}
				}
				if ("project".equals(group.getAttributeValue("category"))) {
					List<Element> metaList = group.getChildren("mda:meta");
					Iterator<Element> mt = metaList.iterator();
					while (mt.hasNext()) {
						Element meta = mt.next();
						if ("id".equals(meta.getAttributeValue("type"))) {
							projectId = meta.getText();
						}
					}
				}
			}
			if (!isOpenXLIFF) {
				throw new IOException(NOTSHARED);
			}
			return projectId;
		} catch (SAXException | ParserConfigurationException e) {
			throw new IOException(NOTXLIFF);
		}
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
			if (!xliff.getAttributeValue("version").startsWith("2.")) {
				throw new IOException(NOTSWORDFISH);
			}
			Set<String> originals = new HashSet<>();
			JSONArray filesArray = new JSONArray();
			List<Element> files = xliff.getChildren("file");
			Iterator<Element> it = files.iterator();
			while (it.hasNext()) {
				Element file = it.next();
				String original = file.getAttributeValue("original");
				if (!originals.contains(original)) {
					JSONObject fileObject = new JSONObject();
					fileObject.put("file", original);
					Element skeleton = file.getChild("skeleton");
					if (skeleton == null) {
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
									isOpenXLIFF = com.maxprograms.converters.Constants.TOOLID.equals(meta.getText());
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
						if ("project".equals(group.getAttributeValue("category"))) {
							List<Element> metaList = group.getChildren("mda:meta");
							Iterator<Element> mt = metaList.iterator();
							while (mt.hasNext()) {
								Element meta = mt.next();
								if ("id".equals(meta.getAttributeValue("type"))) {
									fileObject.put("project", meta.getText());
								}
							}
						}
					}
					if (!isOpenXLIFF) {
						throw new IOException(NOTSWORDFISH);
					}
					filesArray.put(fileObject);
					originals.add(original);
				}
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

	public static String clearHTML(String text) {
		int index = text.indexOf("<font");
		while (index != -1) {
			String start = text.substring(0, index);
			int end = text.indexOf('>', index + 1);
			text = start + text.substring(end + 1);
			index = text.indexOf("<font");
		}
		text = text.replace("</font>", "");
		index = text.indexOf("<span");
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
					List<XMLNode> list = el.getContent();
					for (int i = 0; i < list.size(); i++) {
						XMLNode node = list.get(i);
						if (node.getNodeType() == XMLNode.TEXT_NODE) {
							TextNode t = (TextNode) node;
							string.append(t.getText());
						}
						if (node.getNodeType() == XMLNode.ELEMENT_NODE) {
							string.append(pureText((Element) node));
						}
					}
				}
			}
		}
		return string.toString();
	}

	public static Element buildElement(String string) throws SAXException, IOException, ParserConfigurationException {
		SAXBuilder builder = new SAXBuilder();
		Document doc = builder.build(new ByteArrayInputStream(string.getBytes(StandardCharsets.UTF_8)));
		return doc.getRootElement();
	}

	public static void removeSkeleton(String output, String project)
			throws IOException, SAXException, ParserConfigurationException {
		SAXBuilder builder = new SAXBuilder();
		Document doc = builder.build(new File(output));
		Element root = doc.getRootElement();
		recurseRemoving(root, project);
		try (FileOutputStream out = new FileOutputStream(new File(output))) {
			XMLOutputter outputter = new XMLOutputter();
			outputter.preserveSpace(true);
			outputter.output(doc, out);
		}
	}

	private static void recurseRemoving(Element e, String project) {
		if ("xliff".equals(e.getName())) {
			e.setAttribute("version", "2.0");
		}
		if ("file".equals(e.getName())) {
			e.removeChild("skeleton");
			e.setAttribute("canResegment", "no");
			Element metaData = e.getChild("mda:metadata");
			Element metaGroup = new Element("mda:metaGroup");
			metaGroup.setAttribute("category", "project");
			Element meta = new Element("mda:meta");
			meta.setAttribute("type", "id");
			meta.setText(project);
			metaGroup.addContent(meta);
			metaData.addContent(metaGroup);
			Indenter.indent(e, 2);
			return;
		}
		List<Element> children = e.getChildren();
		Iterator<Element> it = children.iterator();
		while (it.hasNext()) {
			recurseRemoving(it.next(), project);
		}
	}
}