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

package com.maxprograms.swordfish.am;

import org.json.JSONObject;

public class Term implements Comparable<Term> {

    private String source;
    private String target;
    private String srcLang;
    private String tgtLang;
    private String origin;

    public Term(String source, String target, String srcLang, String tgtLang, String origin) {
        this.source = source;
        this.target = target;
        this.srcLang = srcLang;
        this.tgtLang = tgtLang;
        this.origin = origin;
    }

    public Term(JSONObject json) {
        this.source = json.getString("source");
        this.target = json.getString("target");
        this.srcLang = json.getString("srcLang");
        this.tgtLang = json.getString("tgtLang");
        this.origin = json.getString("origin");
    }

    @Override
    public boolean equals(Object o) {
        if (!(o instanceof Term)) {
            return false;
        }
        Term t = (Term) o;
        return t.getSource().equals(source) && t.getTarget().equals(target);
    }

    @Override
    public int hashCode() {
        return source.hashCode() + target.hashCode();
    }

    @Override
    public int compareTo(Term o) {
        if (source.length() > o.source.length()) {
            return -1;
        }
        if (source.length() < o.source.length()) {
            return 1;
        }
        return source.compareToIgnoreCase(o.getSource());
    }

    public String getSource() {
        return source;
    }

    public String getTarget() {
        return target;
    }

    public String getSrcLang() {
        return srcLang;
    }

    public void setSrcLang(String srcLang) {
        this.srcLang = srcLang;
    }

    public String getTgtLang() {
        return tgtLang;
    }

    public void setTgtLang(String tgtLang) {
        this.tgtLang = tgtLang;
    }

    public void setOrigin(String origin) {
        this.origin = origin;
    }

    public String getOrigin() {
        return origin;
    }

    public JSONObject toJSON() {
        JSONObject json = new org.json.JSONObject();
        json.put("source", source);
        json.put("target", target);
        json.put("srcLang", srcLang);
        json.put("tgtLang", tgtLang);
        json.put("origin", origin);
        return json;
    }
}