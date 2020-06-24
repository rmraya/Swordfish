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

package com.maxprograms.swordfish.models;

import com.maxprograms.swordfish.Utils;
import com.maxprograms.xml.Element;

public class Segment implements Comparable<Segment> {

    private String file;
    private String unit;
    private String id;
    private Element source;
    private String srcLang;
    private Element target;
    private String tgtLang;

    public Segment(String file, String unit, Element e, String srcLang, String tgtLang) {
        this.file = file;
        this.unit = unit;
        id = e.getAttributeValue("id");
        source = e.getChild("source");
        this.srcLang = srcLang;
        target = e.getChild("target");
        this.tgtLang = tgtLang;
    }

    public String getFile() {
        return file;
    }

    public String getUnit() {
        return unit;
    }

    public String getId() {
        return id;
    }

    @Override
    public int compareTo(Segment o) {
        return (file + unit + id).compareTo(o.getFile() + o.getUnit() + o.getId());
    }

    public String toHTML() {
        StringBuilder html = new StringBuilder();
        html.append("<tr id=\"");
        html.append(id);
        html.append("\"><td class='fixed'><input type='checkbox' class='rowCheck'></td><td class='fixed'>");
        html.append(id);
        html.append("</td>");
        html.append("<td lang=\"");
        html.append(srcLang);
        html.append("\"");
        if (Utils.isBiDi(srcLang)) {
            html.append(" dir='rtl'");
        }
        html.append('>');
        html.append(getHTML(source));
        html.append("</td>");
        
        html.append("<td lang=\"");
        html.append(tgtLang);
        html.append("\"");
        if (Utils.isBiDi(tgtLang)) {
            html.append(" dir='rtl'");
        }
        html.append('>');
        html.append(getHTML(target));
        html.append("</td>");

        html.append("</tr>");
        return html.toString();
    }

    public String getHTML(Element e) {
        if (e == null) {
            return "";
        }
        return e.getText(); // TODO
    }
}