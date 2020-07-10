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

import java.io.FileOutputStream;
import java.io.IOException;
import java.lang.System.Logger;
import java.lang.System.Logger.Level;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Vector;

import javax.xml.parsers.ParserConfigurationException;

import com.maxprograms.swordfish.models.Segment;
import com.maxprograms.xml.Catalog;
import com.maxprograms.xml.Document;
import com.maxprograms.xml.Element;
import com.maxprograms.xml.Indenter;
import com.maxprograms.xml.SAXBuilder;
import com.maxprograms.xml.XMLOutputter;

import org.xml.sax.SAXException;

public class XliffStore {

    Logger logger = System.getLogger(XliffStore.class.getName());

    private String xliffFile;
    private Document document;

    private Map<String, Element> files;
    private List<Segment> segments;

    private String currentFile;
    private String currentUnit;
    private String srcLang;
    private String tgtLang;

    public XliffStore(String xliffFile)
            throws SAXException, IOException, ParserConfigurationException, URISyntaxException {
        this.xliffFile = xliffFile;
        SAXBuilder builder = new SAXBuilder();
        builder.setEntityResolver(new Catalog("catalog/catalog.xml")); // TODO make configurable
        document = builder.build(xliffFile);
        parseDocument();
        logger.log(Level.INFO, "loadded " + segments.size() + " segments");
    }

    private void parseDocument() {
        files = new Hashtable<>();
        segments = new Vector<>();
        recurse(document.getRootElement());
    }

    private void recurse(Element e) {
        if ("xliff".equals(e.getName())) {
            srcLang = e.getAttributeValue("srcLang");
            tgtLang = e.getAttributeValue("trgLang");
        }
        if ("file".equals(e.getName())) {
            currentFile = e.getAttributeValue("original");
            files.put(currentFile, e);
        }
        if ("unit".equals(e.getName())) {
            currentUnit = e.getAttributeValue("id");
        }
        if ("segment".equals(e.getName())) {
            segments.add(new Segment(currentFile, currentUnit, e));
        }
        List<Element> children = e.getChildren();
        Iterator<Element> it = children.iterator();
        while (it.hasNext()) {
            recurse(it.next());
        }
    }

    public void saveXliff() throws IOException {
        XMLOutputter outputter = new XMLOutputter();
        outputter.preserveSpace(true);
        Indenter.indent(document.getRootElement(), 2);
        try (FileOutputStream out = new FileOutputStream(xliffFile)) {
            outputter.output(document, out);
        }
    }

    public List<Segment> getSegments(List<String> files, int start, int count, String filterText, String filterLanguage,
            boolean caseSensitiveFilter, boolean filterUntranslated, boolean regExp) {
        List<Segment> result = new ArrayList<>();
        if (filterText.isEmpty()) {
            for (int i = start; i < start + count && i < segments.size(); i++) {
                result.add(segments.get(i));
            }
        } else {
            // TODO filter segments
        }

        return result;
    }

	public void close() {
        xliffFile = "";
        files.clear();
        segments.clear();
        document = null;
    }

    public String getSrcLang() {
        return srcLang;
    }

    public String getTgtLang() {
        return tgtLang;
    }
    
}