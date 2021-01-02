/*****************************************************************************
Copyright (c) 2007-2021 - Maxprograms,  http://www.maxprograms.com/

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

package com.maxprograms.swordfish.am;

public class Term implements Comparable<Term> {

    private String source;
    private String target;

    public Term(String source, String target) {
        this.source = source;
        this.target = target;
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
}