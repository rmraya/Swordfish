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

const _p = require("electron");

class Preferences {

    constructor() {
        _p.ipcRenderer.send('get-theme');
        _p.ipcRenderer.send('get-languages');
        _p.ipcRenderer.on('set-languages', (event, arg) => {
            this.setLanguages(arg);
        });
        _p.ipcRenderer.on('set-theme', (event, arg) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
        });
        _p.ipcRenderer.on('set-preferences', (event, arg) => {
            (document.getElementById('themeColor') as HTMLSelectElement).value = arg.theme;
            (document.getElementById('srcLangSelect') as HTMLSelectElement).value = arg.srcLang;
            (document.getElementById('tgtLangSelect') as HTMLSelectElement).value = arg.tgtLang;
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                window.close();
            }
            if (event.key === 'Enter') {
                this.savePreferences();
            }
        });
        document.getElementById('save').addEventListener('click', () => {
            this.savePreferences();
        });
        _p.ipcRenderer.on('get-height', () => {
            let body: HTMLBodyElement = document.getElementById('body') as HTMLBodyElement;
            _p.ipcRenderer.send('settings-height', { width: body.clientWidth, height: body.clientHeight });
        });
    }

    setLanguages(arg: any): void {
        var array = arg.languages;
        var languageOptions = '<option value="none">Select Language</option>';
        for (let i = 0; i < array.length; i++) {
            var lang = array[i];
            languageOptions = languageOptions + '<option value="' + lang.code + '">' + lang.description + '</option>';
        }
        document.getElementById('srcLangSelect').innerHTML = languageOptions;
        document.getElementById('tgtLangSelect').innerHTML = languageOptions;
        _p.ipcRenderer.send('get-preferences');
    }

    savePreferences() {
        var prefs: any = {
            srcLang: (document.getElementById('srcLangSelect') as HTMLSelectElement).value,
            tgtLang: (document.getElementById('tgtLangSelect') as HTMLSelectElement).value,
            theme: (document.getElementById('themeColor') as HTMLSelectElement).value
        }
        _p.ipcRenderer.send('save-preferences', prefs);
    }
}

new Preferences();




