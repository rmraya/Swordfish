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

import org.xml.sax.EntityResolver;
import org.xml.sax.InputSource;
import org.xml.sax.SAXException;

public class TMXResolver implements EntityResolver {

	@Override
	public InputSource resolveEntity(String publicId, String systemId) throws SAXException, IOException {

		if (publicId != null) {
			if (publicId.equals("-//LISA OSCAR:1998//DTD for Translation Memory eXchange//EN")) {
				URL url = TMXResolver.class.getResource("tmx14.dtd");
				return new InputSource(url.openStream());
			}
			if (publicId.equals("http://www.lisa.org/tmx14")) {
				URL url = TMXResolver.class.getResource("tmx14.dtd");
				return new InputSource(url.openStream());
			}
			if (publicId.equals("http://www.lisa.org/tmx")) {
				URL url = TMXResolver.class.getResource("tmx13.dtd");
				return new InputSource(url.openStream());
			}
		}
		if (systemId != null) {
			if (systemId.toLowerCase().endsWith("tmx14.dtd")) {
				URL url = TMXResolver.class.getResource("tmx14.dtd");
				return new InputSource(url.openStream());
			}
			if (systemId.toLowerCase().endsWith("tmx13.dtd")) {
				URL url = TMXResolver.class.getResource("tmx13.dtd");
				return new InputSource(url.openStream());
			}
			if (systemId.toLowerCase().endsWith("tmx12.dtd")) {
				URL url = TMXResolver.class.getResource("tmx12.dtd");
				return new InputSource(url.openStream());
			}
			if (systemId.toLowerCase().endsWith("tmx11.dtd")) {
				URL url = TMXResolver.class.getResource("tmx11.dtd");
				return new InputSource(url.openStream());
			}
		}
		return null;
	}

}
