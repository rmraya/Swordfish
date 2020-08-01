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

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.lang.System.Logger;
import java.lang.System.Logger.Level;
import java.nio.charset.StandardCharsets;
import java.util.Calendar;
import java.util.Date;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;

import javax.xml.parsers.ParserConfigurationException;

import com.maxprograms.xml.Element;
import com.maxprograms.xml.SAXBuilder;
import com.maxprograms.xml.TextNode;
import com.maxprograms.xml.XMLNode;

import org.xml.sax.SAXException;

public class TMUtils {

	private static Logger logger = System.getLogger(TMUtils.class.getName());

	private TMUtils() {
		// private for security
	}

	public static String pureText(Element seg) {
		List<XMLNode> l = seg.getContent();
		Iterator<XMLNode> i = l.iterator();
		StringBuilder text = new StringBuilder();
		while (i.hasNext()) {
			XMLNode o = i.next();
			if (o.getNodeType() == XMLNode.TEXT_NODE) {
				text.append(((TextNode) o).getText());
			} else if (o.getNodeType() == XMLNode.ELEMENT_NODE) {
				String type = ((Element) o).getName();
				// discard all inline elements
				// except <mrk> and <hi>
				if (type.equals("sub") || type.equals("hi")) {
					Element e = (Element) o;
					text.append(pureText(e));
				}
			}
		}
		return text.toString();
	}

	public static String createId() throws InterruptedException {
		Date now = new Date();
		long lng = now.getTime();
		// wait until we are in the next millisecond
		// before leaving to ensure uniqueness
		Thread.sleep(1);
		return "" + lng;
	}

	public static String tmxDate() {
		Calendar calendar = Calendar.getInstance(TimeZone.getTimeZone("GMT"));
		String sec = (calendar.get(Calendar.SECOND) < 10 ? "0" : "") + calendar.get(Calendar.SECOND);
		String min = (calendar.get(Calendar.MINUTE) < 10 ? "0" : "") + calendar.get(Calendar.MINUTE);
		String hour = (calendar.get(Calendar.HOUR_OF_DAY) < 10 ? "0" : "") + calendar.get(Calendar.HOUR_OF_DAY);
		String mday = (calendar.get(Calendar.DATE) < 10 ? "0" : "") + calendar.get(Calendar.DATE);
		String mon = (calendar.get(Calendar.MONTH) < 9 ? "0" : "") + (calendar.get(Calendar.MONTH) + 1);
		String longyear = "" + calendar.get(Calendar.YEAR);

		return longyear + mon + mday + "T" + hour + min + sec + "Z";
	}

	public static long getGMTtime(String tmxDate) {
		Calendar calendar = Calendar.getInstance(TimeZone.getTimeZone("GMT"));
		try {
			int second = Integer.parseInt(tmxDate.substring(13, 15));
			int minute = Integer.parseInt(tmxDate.substring(11, 13));
			int hour = Integer.parseInt(tmxDate.substring(9, 11));
			int date = Integer.parseInt(tmxDate.substring(6, 8));
			int month = Integer.parseInt(tmxDate.substring(4, 6)) - 1;
			int year = Integer.parseInt(tmxDate.substring(0, 4));
			calendar.set(year, month, date, hour, minute, second);
			return calendar.getTimeInMillis();
		} catch (NumberFormatException e) {
			logger.log(Level.WARNING, "Unsupported TMX date: " + tmxDate);
			return 0l;
		}
	}

	public static Element buildTuv(String lang, String seg)
			throws SAXException, IOException, ParserConfigurationException {
		if (!seg.startsWith("<seg>")) {
			seg = "<seg>" + seg + "</seg>";
		}
		Element tuv = new Element("tuv");
		tuv.setAttribute("xml:lang", lang);
		SAXBuilder builder = new SAXBuilder();
		Element e = builder.build(new ByteArrayInputStream(seg.getBytes(StandardCharsets.UTF_8))).getRootElement();
		tuv.addContent(e);
		return tuv;
	}

	public static String creationDate() {
		Calendar calendar = Calendar.getInstance(Locale.US);
		String sec = (calendar.get(Calendar.SECOND) < 10 ? "0" : "") + calendar.get(Calendar.SECOND);
		String min = (calendar.get(Calendar.MINUTE) < 10 ? "0" : "") + calendar.get(Calendar.MINUTE);
		String hour = (calendar.get(Calendar.HOUR_OF_DAY) < 10 ? "0" : "") + calendar.get(Calendar.HOUR_OF_DAY);
		String mday = (calendar.get(Calendar.DATE) < 10 ? "0" : "") + calendar.get(Calendar.DATE);
		String mon = (calendar.get(Calendar.MONTH) < 9 ? "0" : "") + (calendar.get(Calendar.MONTH) + 1);
		String longyear = "" + calendar.get(Calendar.YEAR);

		return longyear + mon + mday + "T" + hour + min + sec + "Z";
	}

	public static String extractText(Element seg) {
		List<XMLNode> l = seg.getContent();
		Iterator<XMLNode> i = l.iterator();
		StringBuilder text = new StringBuilder();
		while (i.hasNext()) {
			XMLNode o = i.next();
			if (o.getNodeType() == XMLNode.TEXT_NODE) {
				text.append(((TextNode) o).getText());
			} else if (o.getNodeType() == XMLNode.ELEMENT_NODE) {
				Element e = (Element) o;
				String type = e.getName();
				// discard all inline elements
				// except <sub> and <hi>
				if (type.equals("sub") || type.equals("hi")) {
					text.append(extractText(e));
				}
			}
		}
		return text.toString();
	}
}
