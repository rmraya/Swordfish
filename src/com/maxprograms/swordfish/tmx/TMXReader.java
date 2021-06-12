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

package com.maxprograms.swordfish.tmx;

import java.io.IOException;
import java.net.URL;

import javax.xml.parsers.ParserConfigurationException;

import org.xml.sax.SAXException;

import com.maxprograms.swordfish.tm.ITmEngine;
import com.maxprograms.xml.SAXBuilder;

public class TMXReader {

	private SAXBuilder builder;
	private TMXContentHandler handler;

	public TMXReader(ITmEngine database) {
		handler = new TMXContentHandler(database);
		builder = new SAXBuilder();
		builder.setEntityResolver(new TMXResolver());
		builder.setContentHandler(handler);
	}

	public void parse(URL url) throws IOException, SAXException, ParserConfigurationException {
		builder.build(url);
	}

	public int getCount() {
		return handler.getCount();
	}
}
