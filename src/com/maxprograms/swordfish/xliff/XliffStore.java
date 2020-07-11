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

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.IOException;
import java.lang.System.Logger;
import java.lang.System.Logger.Level;
import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

import javax.xml.parsers.ParserConfigurationException;

import com.maxprograms.swordfish.TmsServer;
import com.maxprograms.xml.Catalog;
import com.maxprograms.xml.Document;
import com.maxprograms.xml.Element;
import com.maxprograms.xml.Indenter;
import com.maxprograms.xml.PI;
import com.maxprograms.xml.SAXBuilder;
import com.maxprograms.xml.XMLOutputter;

import org.json.JSONObject;
import org.mapdb.DB;
import org.mapdb.DBMaker;
import org.mapdb.BTreeMap;
import org.xml.sax.SAXException;

public class XliffStore {

    Logger logger = System.getLogger(XliffStore.class.getName());

    private DB mapdb;
    private BTreeMap<Integer, String> tree;
    private BTreeMap<Integer, String> files;
    private String xliffFile;
    private Document document;

    private int index;

    private String currentFile;
    private String currentUnit;
    private String srcLang;
    private String tgtLang;

    private SAXBuilder builder;

    public XliffStore(String xliffFile)
            throws SAXException, IOException, ParserConfigurationException, URISyntaxException {
        this.xliffFile = xliffFile;
        File xliff = new File(xliffFile);
        File model = new File(xliff.getParentFile(), "model");
        boolean needsLoading = !model.exists();

        try {
            mapdb = DBMaker.newFileDB(model).closeOnJvmShutdown().asyncWriteEnable().make();
            tree = mapdb.getTreeMap("segments");
            files = mapdb.getTreeMap("files");
        } catch (Error ioe) {
            logger.log(Level.ERROR, ioe);
            throw new IOException(ioe.getMessage());
        }
        builder = new SAXBuilder();
        builder.setEntityResolver(new Catalog(getCatalogFile()));
        if (needsLoading) {
            document = builder.build(xliffFile);
            parseDocument();
            mapdb.commit();
            logger.log(Level.INFO, "loadded " + tree.size() + " segments");
        } else {
            logger.log(Level.INFO, "Skipped parsing " + tree.size() + " segments");
        }
    }

    private void parseDocument() {
        index = 0;
        recurse(document.getRootElement());
    }

    private void recurse(Element e) {
        if ("xliff".equals(e.getName())) {
            srcLang = e.getAttributeValue("srcLang");
            tgtLang = e.getAttributeValue("trgLang");
        }
        if ("file".equals(e.getName())) {
            currentFile = e.getAttributeValue("original");
            files.put(currentFile.hashCode(), currentFile);
        }
        if ("unit".equals(e.getName())) {
            currentUnit = e.getAttributeValue("id");
        }
        if ("segment".equals(e.getName())) {
            JSONObject json = new JSONObject();
            json.put("currentFile", currentFile);
            json.put("currentUnit", currentUnit);
            json.put("segment", e.toString());
            tree.put(index++, json.toString());
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

    public List<Element> getSegments(List<String> files, int start, int count, String filterText, String filterLanguage,
            boolean caseSensitiveFilter, boolean filterUntranslated, boolean regExp)
            throws SAXException, IOException, ParserConfigurationException {
        List<Element> result = new ArrayList<>();
        if (filterText.isEmpty()) {
            for (int i = start; i < start + count && i < tree.size(); i++) {
                JSONObject  json = new JSONObject(tree.get(i));
                String string = json.getString("segment");
                byte[] bytes = string.getBytes(StandardCharsets.UTF_8);
                Document d = builder.build(new ByteArrayInputStream(bytes));
                Element segment = d.getRootElement();
                segment.addContent(new PI("currentFile", json.getString("currentFile")));
                segment.addContent(new PI("currentUnit", json.getString("currentUnit")));
                result.add(segment);
            }
        } else {
            // TODO filter segments
        }
        return result;
    }

    public void close() {
        mapdb.commit();
        mapdb.close();
        logger.log(Level.INFO, "Closed store");
    }

    public String getSrcLang() {
        return srcLang;
    }

    public String getTgtLang() {
        return tgtLang;
    }

    private String getCatalogFile() throws IOException {
        File preferences = new File(TmsServer.getWorkFolder(), "preferences.json");
        StringBuilder builder = new StringBuilder();
        try (FileReader reader = new FileReader(preferences)) {
            try (BufferedReader buffer = new BufferedReader(reader)) {
                String line = "";
                while ((line = buffer.readLine()) != null) {
                    builder.append(line);
                }
            }
        }
        JSONObject json = new JSONObject(builder.toString());
        return json.getString("catalog");
    }
}