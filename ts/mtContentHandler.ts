/*******************************************************************************
 * Copyright (c) 2007 - 2025 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/
import { Catalog, ContentHandler, XMLAttribute, XMLElement } from "typesxml";
import { MTManager } from "./mtManager";

export class MTContentHandler implements ContentHandler {

    mtManager: MTManager;
    project: string;
    file: string;
    unit: string;
    segment: string;
    srcLang: string;
    tgtLang: string;

    stack: Array<XMLElement>

    constructor(mtManager: MTManager, project: string) {
        this.mtManager = mtManager;
        this.project = project;
        this.stack = new Array<XMLElement>();
    }

    initialize(): void {
        // do nothing
    }

    setCatalog(catalog: Catalog): void {
        // do nothing
    }

    startDocument(): void {
        // do nothing
    }

    endDocument(): void {
        // do nothing
    }

    xmlDeclaration(version: string, encoding: string, standalone: string): void {
        // do nothing
    }

    startElement(name: string, atts: XMLAttribute[]): void {
        let element: XMLElement = new XMLElement(name);
        atts.forEach(att => {
            element.setAttribute(att);
        });
        if (name === 'xliff') {
            this.srcLang = element.getAttribute('srcLang').getValue();
            this.tgtLang = element.getAttribute('tgtLang').getValue();
            return;
        }
        if (name === 'file') {
            this.file = element.getAttribute('id').getValue();
            return;
        }
        if (name === 'unit') {
            this.unit = element.getAttribute('id').getValue();
            return;
        }
        if (name === 'segment') {
            this.segment = element.getAttribute('id').getValue();
        }
        if (this.stack.length > 0) {
            this.stack[this.stack.length - 1].addElement(element);
        }
        this.stack.push(element);
    }

    endElement(name: string): void {
        if (name === 'xliff' || name === 'file' || name === 'unit') {
            return;
        }
        let e: XMLElement = this.stack.pop();
        if (name === 'segment') {
            this.translate(e);
            this.stack = new Array<XMLElement>();
        }
    }

    internalSubset(declaration: string): void {
        // do nothing
    }

    characters(ch: string): void {
        if (this.stack.length > 0) {
            this.stack[this.stack.length - 1].addString(ch);
        }
    }

    ignorableWhitespace(ch: string): void {
        // do nothing
    }

    comment(ch: string): void {
        // do
    }

    processingInstruction(target: string, data: string): void {
        // do nothing
    }

    startCDATA(): void {
        // do nothing
    }

    endCDATA(): void {
        // do nothing
    }

    startDTD(name: string, publicId: string, systemId: string): void {
        // do nothing
    }

    endDTD(): void {
        // do nothing
    }

    skippedEntity(name: string): void {
        console.log('skippedEntity: ' + name);
    }

    translate(segment: XMLElement): void {
        let source: XMLElement = segment.getChild('source');
        this.mtManager.translateElement(source, this.project, this.file, this.unit, this.segment);
    }
}