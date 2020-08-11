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