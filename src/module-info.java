/*******************************************************************************
 * Copyright (c) 2007 - 2025 Maxprograms.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 1.0 which accompanies this distribution,
 * and is available at https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors: Maxprograms - initial API and implementation
 *******************************************************************************/

module swordfish {

	exports com.maxprograms.swordfish;
	exports com.maxprograms.swordfish.models;
	exports com.maxprograms.swordfish.tm;

	opens com.maxprograms.swordfish to mapdb;
	opens com.maxprograms.swordfish.models to mapdb;
	opens com.maxprograms.swordfish.xliff to mapdb;

	requires mapdb;
	requires jsoup;
	requires java.base;
	requires java.xml;
	requires java.sql;
	requires java.net.http;
	requires transitive bcp47j;
	requires transitive openxliff;
	requires transitive xmljava;
	requires transitive jdk.httpserver;
	requires transitive json;
	requires java.logging;
	requires org.xerial.sqlitejdbc;
}