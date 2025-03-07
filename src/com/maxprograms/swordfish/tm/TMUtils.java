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

package com.maxprograms.swordfish.tm;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.Reader;
import java.lang.System.Logger;
import java.lang.System.Logger.Level;
import java.nio.charset.StandardCharsets;
import java.text.MessageFormat;
import java.util.Calendar;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;

import javax.xml.parsers.ParserConfigurationException;

import org.xml.sax.SAXException;

import com.maxprograms.xml.Element;
import com.maxprograms.xml.SAXBuilder;
import com.maxprograms.xml.TextNode;
import com.maxprograms.xml.XMLNode;

public class TMUtils {

	private static Logger logger = System.getLogger(TMUtils.class.getName());

	private TMUtils() {
		// private for security
	}

	public static String createId() throws InterruptedException {
		long lng = System.currentTimeMillis();
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
			MessageFormat mf = new MessageFormat(Messages.getString("TMUtils.0"));
			logger.log(Level.WARNING, mf.format(new String[] { tmxDate }));
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
		checkAttributes(e);
		tuv.addContent(e);
		return tuv;
	}

	private static void checkAttributes(Element e) {
		if (e.hasAttribute("x")) {
			String x = e.getAttributeValue("x");
			if (!isNumber(x)) {
				e.setAttribute("x", "" + x.hashCode());
			}
		}
		if (e.hasAttribute("i")) {
			String i = e.getAttributeValue("i");
			if (!isNumber(i)) {
				e.setAttribute("i", "" + i.hashCode());
			}
		}
		List<XMLNode> l = e.getContent();
		Iterator<XMLNode> i = l.iterator();
		while (i.hasNext()) {
			XMLNode o = i.next();
			if (o.getNodeType() == XMLNode.ELEMENT_NODE) {
				checkAttributes((Element) o);
			}
		}
	}

	private static boolean isNumber(String s) {
		try {
			Double.parseDouble(s);
			return true;
		} catch (NumberFormatException e) {
			return false;
		}
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

	public static String getString(Reader reader) throws IOException {
		StringBuilder sb = new StringBuilder();
		char[] array = new char[1024];
		int read = 0;
		while ((read = reader.read(array)) != -1) {
			sb.append(array, 0, read);
		}
		reader.close();
		return sb.toString();
	}
}
