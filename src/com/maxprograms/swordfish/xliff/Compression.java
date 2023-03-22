/*******************************************************************************
 * Copyright (c) 2023 Maxprograms.
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

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.zip.DataFormatException;
import java.util.zip.Deflater;
import java.util.zip.Inflater;

public class Compression {

    private Compression() {
        // private for security
    }

    public static String compress(String string) {
        ByteArrayOutputStream array = new ByteArrayOutputStream();
        byte[] buffer = new byte[2048];
        Deflater compresser = new Deflater();
        compresser.setInput(string.getBytes(StandardCharsets.UTF_8));
        compresser.finish();
        int read;
        while ((read = compresser.deflate(buffer)) > 0) {
            array.write(buffer, 0, read);
        }
        compresser.end();
        return Base64.getEncoder().encodeToString(array.toByteArray());
    }

    public static String decompress(String string) throws DataFormatException {
        byte[] bytes = Base64.getDecoder().decode(string);
        ByteArrayOutputStream array = new ByteArrayOutputStream();
        Inflater decompresser = new Inflater();
        decompresser.setInput(bytes);
        byte[] buffer = new byte[2048];
        int read;
        while ((read = decompresser.inflate(buffer)) > 0) {
            array.write(buffer, 0, read);
        }
        decompresser.end();
        return array.toString(StandardCharsets.UTF_8);
    }
}