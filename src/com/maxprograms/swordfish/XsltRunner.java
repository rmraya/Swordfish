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

package com.maxprograms.swordfish;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;

import javax.xml.parsers.SAXParserFactory;
import javax.xml.transform.Result;
import javax.xml.transform.Source;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.sax.SAXSource;
import javax.xml.transform.stream.StreamResult;
import javax.xml.transform.stream.StreamSource;

import org.xml.sax.InputSource;
import org.xml.sax.XMLReader;

public class XsltRunner {

    private static final String[] XPATH_LIMIT_PROPERTIES = {
            "jdk.xml.xpathExprGrpLimit",
            "jdk.xml.xpathExprOpLimit",
            "jdk.xml.xpathTotalOpLimit"
    };

    public static void transform(String xmlFile, String xslFile, String outputFile) throws Exception {

        File xmlFileObj = new File(xmlFile);
        File xslFileObj = new File(xslFile);
        File outputFileObj = new File(outputFile);

        String xmlAbsolutePath = xmlFileObj.getAbsolutePath();
        String xslAbsolutePath = xslFileObj.getAbsolutePath();

        // Validate input files exist
        if (!xmlFileObj.exists()) {
            throw new FileNotFoundException("XML file not found: " + xmlAbsolutePath);
        }
        if (!xslFileObj.exists()) {
            throw new FileNotFoundException("XSL file not found: " + xslAbsolutePath);
        }
        // Ensure output directory exists
        File parentDir = outputFileObj.getParentFile();
        if (parentDir != null && !parentDir.exists()) {
            if (!parentDir.mkdirs()) {
                throw new IOException("Failed to create output directory: " + parentDir.getAbsolutePath());
            }
        }

        configureXPathResourceLimits();

        // Create transformer with DTD validation disabled
        TransformerFactory factory = TransformerFactory.newInstance();
        applyXPathLimitAttributes(factory);

        // Configure factory to disable DTD processing
        try {
            factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
            factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
            factory.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
        } catch (Exception e) {
            // Ignore if features are not supported
        }

        // Create non-validating XML reader for XML source
        SAXParserFactory saxFactory = SAXParserFactory.newInstance();
        saxFactory.setValidating(false);
        saxFactory.setNamespaceAware(true);
        try {
            saxFactory.setFeature("http://xml.org/sax/features/external-general-entities", false);
            saxFactory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
            saxFactory.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
        } catch (Exception e) {
            // Ignore if features are not supported
        }

        XMLReader xmlReader = saxFactory.newSAXParser().getXMLReader();
        Source xmlSource = new SAXSource(xmlReader, new InputSource(xmlAbsolutePath));
        Source xslSource = new StreamSource(xslFileObj);

        Transformer transformer = factory.newTransformer(xslSource);
        // set parameters if necessary,
        // e.g. transformer.setParameter("filename", filename);

        Result result = new StreamResult(outputFileObj);
        transformer.transform(xmlSource, result);
    }

    private static void configureXPathResourceLimits() {
        for (String propertyName : XPATH_LIMIT_PROPERTIES) {
            String currentValue = System.getProperty(propertyName);
            if (currentValue == null || currentValue.trim().isEmpty()) {
                // Default to unlimited when the caller does not configure the property.
                System.setProperty(propertyName, "0");
            }
        }
    }

    private static void applyXPathLimitAttributes(TransformerFactory factory) {
        for (String propertyName : XPATH_LIMIT_PROPERTIES) {
            String value = System.getProperty(propertyName);
            if (value != null && !value.trim().isEmpty()) {
                try {
                    factory.setAttribute(propertyName, value.trim());
                } catch (IllegalArgumentException ex) {
                    // Ignore factories that do not understand the attribute.
                }
            }
        }
    }
}
