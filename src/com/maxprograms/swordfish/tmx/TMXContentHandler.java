/*******************************************************************************
 * Copyright (c) 2007-2022 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/

package com.maxprograms.swordfish.tmx;

import java.io.IOException;
import java.lang.System.Logger;
import java.lang.System.Logger.Level;
import java.sql.SQLException;
import java.util.Deque;
import java.util.concurrent.ConcurrentLinkedDeque;

import org.xml.sax.Attributes;
import org.xml.sax.Locator;
import org.xml.sax.SAXException;

import com.maxprograms.swordfish.tm.ITmEngine;
import com.maxprograms.xml.Catalog;
import com.maxprograms.xml.Document;
import com.maxprograms.xml.Element;
import com.maxprograms.xml.IContentHandler;

class TMXContentHandler implements IContentHandler {

	protected static final Logger logger = System.getLogger(TMXContentHandler.class.getName());

	private Element current;
	private Deque<Element> stack;
	private boolean inCDATA = false;
	private int count;
	private ITmEngine db;
	
	public TMXContentHandler(ITmEngine tmEngine) {
		db = tmEngine;
		stack = new ConcurrentLinkedDeque<>();
	}

	@Override
	public void characters(char[] ch, int start, int length) throws SAXException {
		if (!inCDATA && current != null) {
			current.addContent(new String(ch, start, length));
		}
	}

	@Override
	public void endDocument() throws SAXException {
		stack = null;
	}

	@Override
	public void endElement(String uri, String localName, String qName) throws SAXException {
		if (localName.equals("tu")) {
			try {
				db.storeTu(current);
				if (count % 500 == 0) {
					db.commit();
				}
			} catch (IOException | SQLException e) {
				// ignore
				logger.log(Level.WARNING, "Error storing " + current, e);
			}
			count++;
			current = null;
			stack.clear();
		} else {
			if (!stack.isEmpty()) {
				current = stack.removeFirst();
			}
		}
	}

	@Override
	public void endPrefixMapping(String prefix) throws SAXException {
		// do nothing
	}

	@Override
	public void ignorableWhitespace(char[] ch, int start, int length) throws SAXException {
		// do nothing
	}

	@Override
	public void processingInstruction(String target, String data) throws SAXException {
		// do nothing
	}

	@Override
	public void setDocumentLocator(Locator locator) {
		// do nothing
	}

	@Override
	public void skippedEntity(String name) throws SAXException {
		// do nothing, the entity resolver must support this
	}

	@Override
	public void startDocument() throws SAXException {
		// do nothing
	}

	@Override
	public void startElement(String uri, String localName, String qName, Attributes atts) throws SAXException {
		if (current == null) {
			current = new Element(qName);
			stack.addFirst(current);
		} else {
			Element child = new Element(qName);
			if (!qName.equals("ut")) {
				current.addContent(child);
			}
			stack.addFirst(current);
			current = child;
		}
		for (int i = 0; i < atts.getLength(); i++) {
			current.setAttribute(atts.getQName(i), atts.getValue(i));
		}
	}

	@Override
	public void startPrefixMapping(String prefix, String uri) throws SAXException {
		// do nothing
	}

	@Override
	public void comment(char[] ch, int start, int length) throws SAXException {
		// do nothing
	}

	@Override
	public void endCDATA() throws SAXException {
		inCDATA = false;
	}

	@Override
	public void endDTD() throws SAXException {
		// do nothing
	}

	@Override
	public void endEntity(String arg0) throws SAXException {
		// do nothing, let the EntityResolver handle this
	}

	@Override
	public void startCDATA() throws SAXException {
		inCDATA = true;
	}

	@Override
	public void startDTD(String name, String publicId1, String systemId1) throws SAXException {
		// do nothing
	}

	@Override
	public void startEntity(String arg0) throws SAXException {
		// do nothing, let the EntityResolver handle this
	}

	public int getCount() {
		return count;
	}

	@Override
	public Document getDocument() {
		// do nothing
		return null;
	}

	@Override
	public void setCatalog(Catalog catalog) {
		// do nothing
	}
}
