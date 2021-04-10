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

package com.maxprograms.swordfish.tm;

import java.io.IOException;
import java.sql.SQLException;
import java.util.List;
import java.util.Set;

import javax.xml.parsers.ParserConfigurationException;

import com.maxprograms.xml.Element;

import org.json.JSONArray;
import org.json.JSONObject;
import org.xml.sax.SAXException;

public interface ITmEngine {

	public abstract String getType();

	public abstract void close() throws IOException, SQLException;

	public abstract String getName();

	public abstract int storeTMX(String tmxFile, String project, String customer, String subject)
			throws SAXException, IOException, ParserConfigurationException, SQLException;

	public abstract void exportMemory(String tmxfile, Set<String> langs, String srcLang)
			throws IOException, SAXException, ParserConfigurationException, SQLException;

	public abstract Set<String> getAllClients() throws SQLException, IOException;

	public abstract Set<String> getAllLanguages() throws SQLException, IOException;

	public abstract Set<String> getAllProjects() throws SQLException, IOException;

	public abstract Set<String> getAllSubjects() throws SQLException, IOException;

	public abstract List<Match> searchTranslation(String searchStr, String srcLang, String tgtLang, int similarity,
			boolean caseSensitive) throws IOException, SAXException, ParserConfigurationException, SQLException;

	public abstract List<Element> searchAll(String searchStr, String srcLang, int similarity, boolean caseSensitive)
			throws IOException, SAXException, ParserConfigurationException, SQLException;

	public abstract List<Element> concordanceSearch(String searchStr, String srcLang, int limit, boolean isRegexp,
			boolean caseSensitive) throws IOException, SAXException, ParserConfigurationException, SQLException;

	public abstract void storeTu(Element tu) throws IOException, SQLException;

	public abstract void commit() throws SQLException, IOException;

	public abstract Element getTu(String tuid)
			throws IOException, SAXException, ParserConfigurationException, SQLException;

	public abstract void removeTu(String tuid)
			throws IOException, SAXException, ParserConfigurationException, SQLException;

	public abstract void deleteDatabase() throws IOException, SQLException;

	public abstract JSONArray batchTranslate(JSONObject params)
			throws IOException, SAXException, ParserConfigurationException, SQLException;
}
