/*******************************************************************************
 * Copyright (c) 2023 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/

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
import com.maxprograms.swordfish.TmsServer;
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

    public static void extractSkeletons(File xliffFile, File outputFile) throws IOException, SAXException,
            ParserConfigurationException, URISyntaxException {
        File xliffParent = outputFile.getParentFile();
        SAXBuilder builder = new SAXBuilder();
        builder.setEntityResolver(new Catalog(TmsServer.getPreferences().getString("catalog")));
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
                    File skl = new File(xliffParent, file.getAttributeValue("original") + ".skl");
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