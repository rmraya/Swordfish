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