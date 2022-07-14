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

package com.maxprograms.swordfish.xliff;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Set;
import java.util.SortedSet;
import java.util.TreeSet;

import javax.xml.parsers.ParserConfigurationException;

import org.xml.sax.SAXException;

import com.maxprograms.converters.Join;
import com.maxprograms.converters.Utils;
import com.maxprograms.xml.Document;
import com.maxprograms.xml.Element;
import com.maxprograms.xml.SAXBuilder;
import com.maxprograms.xml.XMLOutputter;

public class Split {

    private Split() {
        // empty for security
    }

    public static List<String> split(String xliff, String outputFolder)
            throws SAXException, IOException, ParserConfigurationException {
        List<String> result = new ArrayList<>();
        SAXBuilder builder = new SAXBuilder();
        Document doc = builder.build(xliff);
        Element root = doc.getRootElement();
        if (!"xliff".equals(root.getName())) {
            throw new IOException("Selected file is not an XLIFF document");
        }
        File folder = new File(outputFolder);
        if (!folder.exists()) {
            Files.createDirectories(folder.toPath());
        }
        String parentFolder = folder.getParentFile().getAbsolutePath();
        SortedSet<String> originals = new TreeSet<>();
        List<Element> files = root.getChildren("file");
        Iterator<Element> it = files.iterator();
        while (it.hasNext()) {
            String original = it.next().getAttributeValue("original");
            if (original.isEmpty()) {
                throw new IOException("<file> without \"original\" attribute");
            }
            originals.add(original);
        }
        String treeRoot = Join.findTreeRoot(originals);
        Iterator<String> ot = originals.iterator();
        XMLOutputter outputter = new XMLOutputter();
        outputter.preserveSpace(true);
        while (ot.hasNext()) {
            String original = ot.next();
            Set<String> skeletons = new HashSet<>();
            Document newDoc = new Document(null, "xliff", null);
            Element newRoot = newDoc.getRootElement();
            newRoot.setAttributes(root.getAttributes());
            for (int i = 0; i < files.size(); i++) {
                Element file = files.get(i);
                if (file.getAttributeValue("original").equals(original)) {
                    file.setAttribute("original", original.substring(treeRoot.length()));
                    Element skeleton = file.getChild("skeleton");
                    String href = skeleton.getAttributeValue("href");
                    if (!skeletons.contains(href) && new File(href).exists()) {
                        skeleton.addContent(Utils.encodeFromFile(new File(href).getAbsolutePath()));
                        skeleton.removeAttribute("href");
                        skeletons.add(href);
                    } else {
                        skeleton.setAttribute("href", Utils.makeRelativePath(parentFolder, href));
                    }
                    newRoot.addContent("\n");
                    newRoot.addContent(file);
                }
            }
            newRoot.addContent("\n");
            File xliffFile = new File(folder, original.substring(treeRoot.length()) + ".xlf");
            result.add(xliffFile.getAbsolutePath());
            try (FileOutputStream out = new FileOutputStream(xliffFile)) {
                outputter.output(newDoc, out);
            }
        }
        return result;
    }
}
