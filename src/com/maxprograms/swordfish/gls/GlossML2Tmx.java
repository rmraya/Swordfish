/*******************************************************************************
 * Copyright (c) 2007-2026 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/

package com.maxprograms.swordfish.gls;

import java.io.FileOutputStream;
import java.io.IOException;
import java.net.URISyntaxException;
import java.util.Iterator;
import java.util.List;

import javax.xml.parsers.ParserConfigurationException;

import org.xml.sax.SAXException;

import com.maxprograms.swordfish.Constants;
import com.maxprograms.swordfish.TmsServer;
import com.maxprograms.xml.CatalogBuilder;
import com.maxprograms.xml.Document;
import com.maxprograms.xml.Element;
import com.maxprograms.xml.Indenter;
import com.maxprograms.xml.SAXBuilder;
import com.maxprograms.xml.XMLNode;
import com.maxprograms.xml.XMLOutputter;

public class GlossML2Tmx {

    private Document tmx;
    private Element tmxRoot;
    private Element header;
    private Element body;
    private Element currentTU;
    private Element currentTUV;

    private GlossML2Tmx() {
        tmx = new Document(null, "tmx", "-//LISA OSCAR:1998//DTD for Translation Memory eXchange//EN", "tmx14.dtd");
        tmxRoot = tmx.getRootElement();
        tmxRoot.setAttribute("version", "1.4");
        header = new Element("header");
        header.setAttribute("creationtool", Constants.APPNAME);
        header.setAttribute("creationtoolversion", Constants.VERSION);
        header.setAttribute("srclang", "*all*");
        header.setAttribute("adminlang", "en");
        header.setAttribute("datatype", "xml");
        header.setAttribute("o-tmf", "GlossML");
        header.setAttribute("segtype", "block");
        tmxRoot.addContent(header);
        body = new Element("body");
        tmxRoot.addContent(body);
    }

    public static void convert(String source, String output)
            throws SAXException, IOException, ParserConfigurationException, URISyntaxException {
        SAXBuilder builder = new SAXBuilder();
        builder.setEntityResolver(CatalogBuilder.getCatalog(TmsServer.getCatalogFile()));
        Document gls = builder.build(source);

        GlossML2Tmx converter = new GlossML2Tmx();
        converter.recurse(gls.getRootElement());
        converter.export(output);
    }

    private void export(String file) throws IOException {
        try (FileOutputStream out = new FileOutputStream(file)) {
            XMLOutputter outputter = new XMLOutputter();
            outputter.preserveSpace(true);
            Indenter.indent(tmxRoot, 2);
            outputter.output(tmx, out);
        }
    }

    private void recurse(Element e) throws IOException {
        if ("glossary".equals(e.getName()) && e.hasAttribute("srclang")) {
            header.setAttribute("srclang", e.getAttributeValue("srclang"));
        }
        if ("comment".equals(e.getName())) {
            Element note = new Element("note");
            note.setText(e.getText());
            if (currentTU == null) {
                header.addContent(note);
            } else {
                List<XMLNode> content = currentTU.getContent();
                content.add(0, note);
                currentTU.setContent(content);
            }
            return;
        }
        if ("glossentry".equals(e.getName())) {
            currentTU = new Element("tu");
            body.addContent(currentTU);
        }
        if ("langentry".equals(e.getName())) {
            currentTUV = new Element("tuv");
            currentTUV.setAttribute("xml:lang", e.getAttributeValue("xml:lang"));
            currentTU.addContent(currentTUV);
        }
        if ("term".equals(e.getName())) {
            if (currentTUV == null) {
                return;
            }
            Element seg = new Element("seg");
            currentTUV.addContent(seg);
            List<XMLNode> content = e.getContent();
            Iterator<XMLNode> it = content.iterator();
            while (it.hasNext()) {
                XMLNode n = it.next();
                if (n.getNodeType() == XMLNode.TEXT_NODE) {
                    seg.addContent(n);
                }
            }
            return;
        }
        if ("definition".equals(e.getName()) && currentTUV != null) {
            Element prop = new Element("prop");
            prop.setAttribute("type", "definition");
            prop.setText(e.getText());
            List<XMLNode> content = currentTUV.getContent();
            content.add(0, prop);
            currentTUV.setContent(content);
        }
        List<Element> list = e.getChildren();
        Iterator<Element> it = list.iterator();
        while (it.hasNext()) {
            recurse(it.next());
        }
    }
}
