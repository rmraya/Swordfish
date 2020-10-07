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
import java.net.URISyntaxException;
import java.util.Iterator;
import java.util.List;
import java.util.Vector;

import javax.xml.parsers.ParserConfigurationException;

import com.maxprograms.converters.Utils;
import com.maxprograms.xml.Catalog;
import com.maxprograms.xml.Document;
import com.maxprograms.xml.Element;
import com.maxprograms.xml.SAXBuilder;
import com.maxprograms.xml.XMLOutputter;

import org.xml.sax.SAXException;

public class Skeletons {

    private Skeletons() {
        // private for security
    }

    public static void embedSkeletons(String xliffFile, String outputFile)
            throws SAXException, IOException, ParserConfigurationException, URISyntaxException {
        SAXBuilder builder = new SAXBuilder();
        builder.setEntityResolver(new Catalog(XliffStore.getCatalog()));
        Document doc = builder.build(xliffFile);
        Element xliff = doc.getRootElement();
        List<Element> files = xliff.getChildren("file");
        Iterator<Element> it = files.iterator();
        while (it.hasNext()) {
            Element file = it.next();
            Element skeleton = file.getChild("skeleton");
            if (skeleton != null) {
                String href = skeleton.getAttributeValue("href");
                if (!href.isEmpty()) {
                    File skl = new File(href);
                    skeleton.addContent(Utils.encodeFromFile(skl.getAbsolutePath()));
                    skeleton.removeAttribute("href");
                }
            }
        }
        try (FileOutputStream out = new FileOutputStream(outputFile)) {
            XMLOutputter outputter = new XMLOutputter();
            outputter.preserveSpace(true);
            outputter.output(doc, out);
        }
    }

    public static void extractSkeletons(File xliffFile, File outputFile) throws IOException, SAXException,
            ParserConfigurationException, URISyntaxException {
        File xliffParent = outputFile.getParentFile();
        SAXBuilder builder = new SAXBuilder();
        builder.setEntityResolver(new Catalog(XliffStore.getCatalog()));
        Document doc = builder.build(xliffFile);
        Element xliff = doc.getRootElement();
        List<Element> files = xliff.getChildren("file");
        Iterator<Element> it = files.iterator();
        while (it.hasNext()) {
            Element file = it.next();
            Element skeleton = file.getChild("skeleton");
            if (skeleton != null) {
                String href = skeleton.getAttributeValue("href");
                if (href.isEmpty()) {
                    File skl = File.createTempFile("file", ".skl", xliffParent);
                    Utils.decodeToFile(skeleton.getText(), skl.getAbsolutePath());
                    skeleton.setAttribute("href", skl.getAbsolutePath());
                    skeleton.setContent(new Vector<>());
                }
            }
        }
        try (FileOutputStream out = new FileOutputStream(outputFile)) {
            XMLOutputter outputter = new XMLOutputter();
            outputter.preserveSpace(true);
            outputter.output(doc, out);
        }
    }
}