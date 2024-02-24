/*******************************************************************************
 * Copyright (c) 2007 - 2024 Maxprograms.
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
import java.io.IOException;
import java.io.Reader;
import java.lang.System.Logger;
import java.nio.file.Files;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.text.MessageFormat;

public class DbUpgrade {

	static Logger logger = System.getLogger(DbUpgrade.class.getName());

	private DbUpgrade() {
		// private constructor to prevent instantiation
	}

	public static void main(String[] args) {
		boolean upgradeMemory = false;
		boolean upgradeProject = false;
		String folder = "";
		for (String arg : args) {
			if (arg.equals("-memory")) {
				upgradeMemory = true;
				continue;
			}
			if (arg.equals("-project")) {
				upgradeProject = true;
				continue;
			}
			if (!folder.isEmpty()) {
				folder += " ";
			}
			folder += arg;
		}
		if (folder.isEmpty()) {
			logger.log(Logger.Level.ERROR, Messages.getString("DbUpgrade.0"));
			return;
		}
		if (upgradeProject) {
			try {
				upgradeProject(new File(folder));
			} catch (IOException | SQLException e) {
				logger.log(Logger.Level.ERROR, e);
			}
		}
		if (upgradeMemory) {
			try {
				upgradeMemory(new File(folder));
			} catch (IOException | SQLException e) {
				logger.log(Logger.Level.ERROR, e);
			}
		}
	}

	public static void upgradeProject(File projectFolder) throws IOException, SQLException {
		MessageFormat mf = new MessageFormat(Messages.getString("DbUpgrade.1"));
		logger.log(Logger.Level.INFO, mf.format(new String[] { projectFolder.getName() }));
		File sqliteFolder = new File(projectFolder, "sqlite");
		if (!sqliteFolder.exists()) {
			Files.createDirectories(sqliteFolder.toPath());
		}
		File newDB = new File(sqliteFolder, "database.db");
		File h2Folder = new File(projectFolder, "h2data");
		try (Connection newConn = DriverManager
				.getConnection("jdbc:sqlite:" + newDB.getAbsolutePath().replace('\\', '/'))) {
			newConn.setAutoCommit(false);
			createTables(newConn);
			String url = "jdbc:h2:" + h2Folder.getAbsolutePath() + "/db";
			try (Connection oldConn = DriverManager.getConnection(url)) {
				migrateFiles(oldConn, newConn);
				migrateSegments(oldConn, newConn);
			}
		}
		File backup = new File(projectFolder, "h2db");
		Files.move(h2Folder.toPath(), backup.toPath());
	}

	private static void migrateSegments(Connection oldConn, Connection newConn) throws SQLException, IOException {
		String selectSql = "SELECT file, unitId, segId, type, state, child, translate, tags, space, source, sourceText, target, targetText, words, idx FROM segments";
		String insertSql = "INSERT INTO segments (file, unitId, segId, type, state, child, translate, tags, space, source, sourceText, target, targetText, words, idx) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
		int count = 0;
		try (PreparedStatement newPstmt = newConn.prepareStatement(insertSql)) {
			try (Statement stmt = oldConn.createStatement()) {
				try (ResultSet rs = stmt.executeQuery(selectSql)) {
					while (rs.next()) {
						String file = rs.getString(1);
						String unitId = rs.getString(2);
						String segId = rs.getString(3);
						String type = rs.getString(4);
						String state = rs.getString(5);
						int child = rs.getInt(6);
						String translate = rs.getString(7);
						int tags = rs.getInt(8);
						String space = rs.getString(9);
						String source = getString(rs.getNCharacterStream(10));
						String sourceText = getString(rs.getNCharacterStream(11));
						String target = getString(rs.getNCharacterStream(12));
						String targetText = getString(rs.getNCharacterStream(13));
						int words = rs.getInt(14);
						int idx = rs.getInt(15);
						newPstmt.setString(1, file);
						newPstmt.setString(2, unitId);
						newPstmt.setString(3, segId);
						newPstmt.setString(4, type);
						newPstmt.setString(5, state);
						newPstmt.setInt(6, child);
						newPstmt.setString(7, translate);
						newPstmt.setInt(8, tags);
						newPstmt.setString(9, space);
						newPstmt.setString(10, source);
						newPstmt.setString(11, sourceText);
						newPstmt.setString(12, target);
						newPstmt.setString(13, targetText);
						newPstmt.setInt(14, words);
						newPstmt.setInt(15, idx);
						newPstmt.execute();
						if (count++ % 1000 == 0) {
							newConn.commit();
						}
					}
				}
			}
		}
		newConn.commit();
	}

	private static void migrateFiles(Connection oldConn, Connection newConn) throws SQLException, IOException {
		String selectSql = "SELECT id, name FROM files";
		String insertSql = "INSERT INTO files (id, name) VALUES (?,?)";
		try (PreparedStatement newPstmt = newConn.prepareStatement(insertSql)) {
			try (Statement stmt = oldConn.createStatement()) {
				try (ResultSet rs = stmt.executeQuery(selectSql)) {
					while (rs.next()) {
						String id = rs.getString(1);
						String name = getString(rs.getNCharacterStream(2));
						newPstmt.setString(1, id);
						newPstmt.setString(2, name);
						newPstmt.execute();
					}
				}
			}
		}
		newConn.commit();
	}

	private static void createTables(Connection newConn) throws SQLException {
		String files = """
				CREATE TABLE files (
				    id VARCHAR(50) NOT NULL,
				    name VARCHAR(350) NOT NULL,
				    PRIMARY KEY(id, name)
				    );""";
		String units = """
				CREATE TABLE units (
				    file VARCHAR(50),
				    unitId VARCHAR(256) NOT NULL,
				    data TEXT NOT NULL,
				    compressed CHAR(1) NOT NULL DEFAULT 'N',
				    PRIMARY KEY(file, unitId)
				    );""";
		String segments = """
				CREATE TABLE segments (
				    file VARCHAR(50),
				    unitId VARCHAR(256) NOT NULL,
				    segId VARCHAR(256) NOT NULL,
				    type CHAR(1) NOT NULL DEFAULT 'S',
				    state VARCHAR(12) DEFAULT 'initial',
				    child INTEGER,
				    translate CHAR(1),
				    tags INTEGER DEFAULT 0,
				    space CHAR(1) DEFAULT 'N',
				    source TEXT NOT NULL,
				    sourceText TEXT NOT NULL,
				    target TEXT NOT NULL,
				    targetText TEXT NOT NULL,
				    words INTEGER NOT NULL DEFAULT 0,
				    idx INTEGER,
				    PRIMARY KEY(file, unitId, segId, type)
				);""";
		String matches = """
				CREATE TABLE matches (
				    file VARCHAR(50),
				    unitId VARCHAR(256) NOT NULL,
				    segId VARCHAR(256) NOT NULL,
				    matchId varchar(256),
				    origin VARCHAR(256),
				    type CHAR(2) NOT NULL DEFAULT 'tm',
				    similarity INTEGER DEFAULT 0,
				    source TEXT NOT NULL,
				    target TEXT NOT NULL,
				    data TEXT NOT NULL,
				    compressed CHAR(1) NOT NULL DEFAULT 'N',
				    PRIMARY KEY(file, unitId, segId, matchid)
				    );""";
		String terms = """
				CREATE TABLE terms (
				    file VARCHAR(50),
				    unitId VARCHAR(256) NOT NULL,
				    segId VARCHAR(256) NOT NULL,
				    termid varchar(256),
				    origin VARCHAR(256),
				    source TEXT NOT NULL,
				    target TEXT NOT NULL,
				    PRIMARY KEY(file, unitId, segId, termid)
				    );""";
		String notes = """
				CREATE TABLE notes (
				    file VARCHAR(50),
				    unitId VARCHAR(256) NOT NULL,
				    segId VARCHAR(256) NOT NULL,
				    noteid varchar(256) NOT NULL,
				    note TEXT NOT NULL,
				    PRIMARY KEY(file, unitId, segId, noteid)
				    );""";
		try (Statement create = newConn.createStatement()) {
			create.execute(files);
			create.execute(units);
			create.execute(segments);
			create.execute(matches);
			create.execute(terms);
			create.execute(notes);
		}
		newConn.commit();
	}

	public static void upgradeMemory(File databaseFolder) throws SQLException, IOException {
		MessageFormat mf = new MessageFormat(Messages.getString("DbUpgrade.2"));
		logger.log(Logger.Level.INFO, mf.format(new String[] { databaseFolder.getName() }));
		DriverManager.registerDriver(new org.sqlite.JDBC());
		File newDB = new File(databaseFolder, "database.db");
		try (Connection newConn = DriverManager
				.getConnection("jdbc:sqlite:" + newDB.getAbsolutePath().replace('\\', '/'))) {
			newConn.setAutoCommit(false);
			String sql = """
					CREATE TABLE tuv (
					tuid VARCHAR(256) NOT NULL,
					lang VARCHAR(15) NOT NULL,
					seg TEXT NOT NULL,
					puretext TEXT NOT NULL,
					textlength INTEGER NOT NULL,
					PRIMARY KEY(tuid, lang)
					);""";
			try (Statement stmt = newConn.createStatement()) {
				stmt.execute(sql);
			}
			newConn.commit();

			String url = "jdbc:h2:" + databaseFolder.getAbsolutePath() + "/db";
			try (Connection oldConn = DriverManager.getConnection(url)) {
				String selectSql = "SELECT tuid, lang, seg, puretext, textlength FROM tuv";
				String insertSql = "INSERT INTO tuv (tuid, lang, seg, puretext, textlength) VALUES (?,?,?,?,?)";
				int count = 0;
				try (PreparedStatement newPstmt = newConn.prepareStatement(insertSql)) {
					try (Statement stmt = oldConn.createStatement()) {
						try (ResultSet rs = stmt.executeQuery(selectSql)) {
							while (rs.next()) {
								String tuid = rs.getString(1);
								String lang = rs.getString(2);
								String seg = getString(rs.getNCharacterStream(3));
								String puretext = getString(rs.getNCharacterStream(4));
								int textlength = rs.getInt(5);
								newPstmt.setString(1, tuid);
								newPstmt.setString(2, lang);
								newPstmt.setString(3, seg);
								newPstmt.setString(4, puretext);
								newPstmt.setInt(5, textlength);
								newPstmt.execute();
								if (count++ % 1000 == 0) {
									newConn.commit();
								}
							}
						}
					}
				}
			}
			newConn.commit();
		}
		File oldDb = new File(databaseFolder, "db.mv.db");
		File backup = new File(databaseFolder, "h2db.db");
		Files.move(oldDb.toPath(), backup.toPath());
	}

	public static String getString(Reader reader) throws IOException {
		StringBuilder sb = new StringBuilder();
		char[] array = new char[1024];
		int read = 0;
		while ((read = reader.read(array)) != -1) {
			sb.append(array, 0, read);
		}
		reader.close();
		return sb.toString();
	}
}
