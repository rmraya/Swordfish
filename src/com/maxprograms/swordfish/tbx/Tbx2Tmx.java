package com.maxprograms.swordfish.tbx;

import java.io.FileOutputStream;
import java.io.IOException;
import java.net.URISyntaxException;
import java.util.Iterator;
import java.util.List;

import javax.xml.parsers.ParserConfigurationException;

import com.maxprograms.swordfish.Constants;
import com.maxprograms.swordfish.TmsServer;
import com.maxprograms.xml.Catalog;
import com.maxprograms.xml.Document;
import com.maxprograms.xml.Element;
import com.maxprograms.xml.Indenter;
import com.maxprograms.xml.SAXBuilder;
import com.maxprograms.xml.XMLNode;
import com.maxprograms.xml.XMLOutputter;

import org.xml.sax.SAXException;

public class Tbx2Tmx {

    private Document tmx;
    private Element tmxRoot;
    private Element body;
    private Element currentTU;
    private Element currentTUV;
    private String currentLang;
    private Element currentSeg;
    private boolean inTUV;

    private Tbx2Tmx() {
        tmx = new Document(null, "tmx", "-//LISA OSCAR:1998//DTD for Translation Memory eXchange//EN", "tmx14.dtd");
        tmxRoot = tmx.getRootElement();
        tmxRoot.setAttribute("version", "1.4");
        Element header = new Element("header");
        header.setAttribute("creationtool", Constants.APPNAME);
        header.setAttribute("creationtoolversion", Constants.VERSION);
        header.setAttribute("srclang", "*all*");
        header.setAttribute("adminlang", "en");
        header.setAttribute("datatype", "xml");
        header.setAttribute("o-tmf", "unknown");
        header.setAttribute("segtype", "block");
        tmxRoot.addContent(header);
        body = new Element("body");
        tmxRoot.addContent(body);
    }

    public static void convert(String source, String output)
            throws SAXException, IOException, ParserConfigurationException, URISyntaxException {
        SAXBuilder builder = new SAXBuilder();
        builder.setEntityResolver(new Catalog(TmsServer.getCatalogFile()));
        Document tbx = builder.build(source);

        Tbx2Tmx converter = new Tbx2Tmx();
        converter.recurse(tbx.getRootElement());
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
        if ("termEntry".equals(e.getName()) || "conceptEntry".equals(e.getName())) {
            currentTU = new Element("tu");
            body.addContent(currentTU);
        }
        if ("langSet".equals(e.getName()) || "langSec".equals(e.getName())) {
            currentLang = e.getAttributeValue("xml:lang");
        }
        if ("tig".equals(e.getName()) || "termSec".equals(e.getName())) {
            currentTUV = new Element("tuv");
            currentTUV.setAttribute("xml:lang", currentLang);
            currentTU.addContent(currentTUV);
            inTUV = true;
        }
        if ("term".equals(e.getName())) {
            currentSeg = new Element("seg");
            currentTUV.addContent(currentSeg);
            List<XMLNode> content = e.getContent();
            Iterator<XMLNode> it = content.iterator();
            while (it.hasNext()) {
                XMLNode n = it.next();
                if (n.getNodeType() == XMLNode.TEXT_NODE) {
                    currentSeg.addContent(n);
                }
                if (n.getNodeType() == XMLNode.ELEMENT_NODE) {
                    recurse((Element) n);
                }
            }
            return;
        }
        if ("termNote".equals(e.getName())) {
            String type = e.getAttributeValue("type");
            if (!type.isBlank()) {
                Element prop = new Element("prop");
                prop.setAttribute("tyoe", type);
                prop.setText(e.getText());
                currentTUV.getContent().add(0, prop);
            }
        }
        if ("hi".equals(e.getName())) {
            List<XMLNode> content = e.getContent();
            Iterator<XMLNode> it = content.iterator();
            while (it.hasNext()) {
                XMLNode n = it.next();
                if (n.getNodeType() == XMLNode.TEXT_NODE) {
                    currentSeg.addContent(n);
                }
                if (n.getNodeType() == XMLNode.ELEMENT_NODE) {
                    recurse((Element) n);
                }
            }
            return;
        }
        if ("note".equals(e.getName())) {
            Element note = new Element("note");
            note.setText(e.getText());
            if (inTUV) {
                currentTUV.getContent().add(0, note);
            } else {
                currentTU.getContent().add(0, note);
            }
        }
        List<Element> list = e.getChildren();
        Iterator<Element> it = list.iterator();
        while (it.hasNext()) {
            recurse(it.next());
        }
        if ("tig".equals(e.getName()) || "termSec".equals(e.getName())) {
           inTUV = false;
        }
    }
}
