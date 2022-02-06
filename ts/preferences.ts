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

class Preferences {

    electron = require('electron');

    tabHolder: TabHolder;
    spellcheckTab: Tab;

    srcLangSelect: HTMLSelectElement;
    tgtLangSelect: HTMLSelectElement;
    themeColor: HTMLSelectElement;
    zoomFactor: HTMLSelectElement;

    defaultSRX: HTMLInputElement;
    defaultCatalog: HTMLInputElement;
    paragraphSegmentation: HTMLInputElement;
    acceptUnconfirmed: HTMLInputElement;
    fuzzyTermSearches: HTMLInputElement;
    caseSensitiveSearches: HTMLInputElement;

    enableGoogle: HTMLInputElement;
    googleKey: HTMLInputElement;
    googleSrcLang: HTMLSelectElement;
    googleTgtLang: HTMLSelectElement;
    googleNeural: HTMLInputElement;

    enableAzure: HTMLInputElement;
    azureKey: HTMLInputElement;
    azureSrcLang: HTMLSelectElement;
    azureTgtLang: HTMLSelectElement;

    enableYandex: HTMLInputElement;
    yandexKey: HTMLInputElement;
    yandexSrcLang: HTMLSelectElement;
    yandexTgtLang: HTMLSelectElement;

    enableDeepL: HTMLInputElement;
    deeplKey: HTMLInputElement;
    deeplSrcLang: HTMLSelectElement;
    deeplTgtLang: HTMLSelectElement;

    enableMyMemory: HTMLInputElement;
    myMemoryKey: HTMLInputElement;
    myMemorySrcLang: HTMLSelectElement;
    myMemoryTgtLang: HTMLSelectElement;

    defaultEnglish: HTMLSelectElement;
    defaultPortuguese: HTMLSelectElement;
    defaultSpanish: HTMLSelectElement;

    os: string;

    filtersTable: HTMLTableElement;
    selected: Map<string, string>;

    constructor() {
        this.tabHolder = new TabHolder(document.getElementById('main') as HTMLDivElement, "preferencesHolder");

        let basicTab: Tab = new Tab('basicTab', 'Basic', false);
        basicTab.getLabel().addEventListener('click', () => {
            this.electron.ipcRenderer.send('settings-height', { width: document.body.clientWidth, height: document.body.clientHeight });
        });
        this.tabHolder.addTab(basicTab);
        this.populateBasicTab(basicTab.getContainer());

        let mtTab: Tab = new Tab('mtTab', 'Machine Translation', false);
        mtTab.getLabel().addEventListener('click', () => {
            this.electron.ipcRenderer.send('settings-height', { width: document.body.clientWidth, height: document.body.clientHeight });
        });
        this.tabHolder.addTab(mtTab);
        this.populateMtTab(mtTab.getContainer());

        this.spellcheckTab = new Tab('spellcheckTab', 'Spellchecker', false);
        this.spellcheckTab.getLabel().addEventListener('click', () => {
            this.electron.ipcRenderer.send('settings-height', { width: document.body.clientWidth, height: document.body.clientHeight });
        });
        this.tabHolder.addTab(this.spellcheckTab);

        let advancedTab: Tab = new Tab('advancedTab', 'Advanced', false);
        advancedTab.getLabel().addEventListener('click', () => {
            this.electron.ipcRenderer.send('settings-height', { width: document.body.clientWidth, height: document.body.clientHeight });
        });
        this.tabHolder.addTab(advancedTab);
        this.populateAdvancedTab(advancedTab.getContainer());

        this.tabHolder.selectTab('basicTab');

        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.send('get-languages');
        this.electron.ipcRenderer.on('set-languages', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setLanguages(arg);
        });

        this.electron.ipcRenderer.on('set-mt-languages', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setMtLanguages(arg);
        });

        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
        });
        this.electron.ipcRenderer.on('set-preferences', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setPreferences(arg);
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => { KeyboardHandler.keyListener(event); });
        document.getElementById('browseSRX').addEventListener('click', () => {
            this.electron.ipcRenderer.send('browse-srx');
        });
        document.getElementById('browseCatalog').addEventListener('click', () => {
            this.electron.ipcRenderer.send('browse-catalog');
        });
        document.getElementById('save').addEventListener('click', () => {
            this.savePreferences();
        });
        this.electron.ipcRenderer.on('get-height', () => {
            this.electron.ipcRenderer.send('settings-height', { width: document.body.clientWidth, height: document.body.clientHeight });
        });
        this.electron.ipcRenderer.on('set-srx', (event: Electron.IpcRendererEvent, arg: string) => {
            this.defaultSRX.value = arg;
        });
        this.electron.ipcRenderer.on('set-catalog', (event: Electron.IpcRendererEvent, arg: string) => {
            this.defaultCatalog.value = arg;
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-preferences');
            }
        });
        this.selected = new Map<string, string>();
        this.electron.ipcRenderer.send('get-xmlFilters');
        this.electron.ipcRenderer.on('xmlFilters', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setFilters(arg);
        });
        this.electron.ipcRenderer.send('settings-height', { width: document.body.clientWidth, height: document.body.clientHeight });
    }

    setPreferences(arg: any): void {
        this.themeColor.value = arg.theme;
        this.srcLangSelect.value = arg.srcLang;
        this.tgtLangSelect.value = arg.tgtLang;
        this.zoomFactor.value = arg.zoomFactor;
        this.defaultSRX.value = arg.srx;
        this.defaultCatalog.value = arg.catalog;
        this.acceptUnconfirmed.checked = arg.acceptUnconfirmed;
        this.paragraphSegmentation.checked = arg.paragraphSegmentation;
        this.fuzzyTermSearches.checked = arg.fuzzyTermSearches;
        this.caseSensitiveSearches.checked = arg.caseSensitiveSearches;

        this.enableGoogle.checked = arg.google.enabled;
        this.googleKey.value = arg.google.apiKey;
        this.googleSrcLang.value = arg.google.srcLang;
        this.googleTgtLang.value = arg.google.tgtLang;
        this.googleNeural.checked = arg.google.neural;
        this.googleKey.disabled = !arg.google.enabled;
        this.googleSrcLang.disabled = !arg.google.enabled;
        this.googleTgtLang.disabled = !arg.google.enabled;
        this.googleNeural.disabled = !arg.google.enabled;
        this.enableGoogle.addEventListener('change', () => {
            this.googleKey.disabled = !this.enableGoogle.checked;
            this.googleSrcLang.disabled = !this.enableGoogle.checked;
            this.googleTgtLang.disabled = !this.enableGoogle.checked;
            this.googleNeural.disabled = !this.enableGoogle.checked;
        });

        this.enableAzure.checked = arg.azure.enabled;
        this.azureKey.value = arg.azure.apiKey;
        this.azureSrcLang.value = arg.azure.srcLang;
        this.azureTgtLang.value = arg.azure.tgtLang;
        this.azureKey.disabled = !arg.azure.enabled;
        this.azureSrcLang.disabled = !arg.azure.enabled;
        this.azureTgtLang.disabled = !arg.azure.enabled;
        this.enableAzure.addEventListener('change', () => {
            this.azureKey.disabled = !this.enableAzure.checked;
            this.azureSrcLang.disabled = !this.enableAzure.checked;
            this.azureTgtLang.disabled = !this.enableAzure.checked;
        });

        this.enableYandex.checked = arg.yandex.enabled;
        this.yandexKey.value = arg.yandex.apiKey;
        this.yandexSrcLang.value = arg.yandex.srcLang;
        this.yandexTgtLang.value = arg.yandex.tgtLang;
        this.yandexKey.disabled = !arg.yandex.enabled;
        this.yandexSrcLang.disabled = !arg.yandex.enabled;
        this.yandexTgtLang.disabled = !arg.yandex.enabled;
        this.enableYandex.addEventListener('change', () => {
            this.yandexKey.disabled = !this.enableYandex.checked;
            this.yandexSrcLang.disabled = !this.enableYandex.checked;
            this.yandexTgtLang.disabled = !this.enableYandex.checked;
        });

        this.enableDeepL.checked = arg.deepl.enabled;
        this.deeplKey.value = arg.deepl.apiKey;
        this.deeplSrcLang.value = arg.deepl.srcLang;
        this.deeplTgtLang.value = arg.deepl.tgtLang;
        this.deeplKey.disabled = !arg.deepl.enabled;
        this.deeplSrcLang.disabled = !arg.deepl.enabled;
        this.deeplTgtLang.disabled = !arg.deepl.enabled;
        this.enableDeepL.addEventListener('change', () => {
            this.deeplKey.disabled = !this.enableDeepL.checked;
            this.deeplSrcLang.disabled = !this.enableDeepL.checked;
            this.deeplTgtLang.disabled = !this.enableDeepL.checked;
        });

        this.enableMyMemory.checked = arg.myMemory.enabled;
        this.myMemoryKey.value = arg.myMemory.apiKey;
        this.myMemorySrcLang.value = arg.myMemory.srcLang;
        this.myMemoryTgtLang.value = arg.myMemory.tgtLang;
        this.myMemoryKey.disabled = !arg.myMemory.enabled;
        this.myMemorySrcLang.disabled = !arg.myMemory.enabled;
        this.myMemoryTgtLang.disabled = !arg.myMemory.enabled;
        this.enableMyMemory.addEventListener('change', () => {
            this.myMemoryKey.disabled = !this.enableMyMemory.checked;
            this.myMemorySrcLang.disabled = !this.enableMyMemory.checked;
            this.myMemoryTgtLang.disabled = !this.enableMyMemory.checked;
        });

        this.os = arg.os;
        this.populateSpellcheckTab(this.spellcheckTab.getContainer(), arg.spellchecker);
    }

    setLanguages(arg: any): void {
        let languageOptions = this.getOptions(arg.languages)

        this.srcLangSelect.innerHTML = languageOptions;
        this.tgtLangSelect.innerHTML = languageOptions;

        this.myMemorySrcLang.innerHTML = languageOptions;
        this.myMemoryTgtLang.innerHTML = languageOptions;

        this.electron.ipcRenderer.send('get-mt-languages');
    }

    savePreferences(): void {
        if (this.enableGoogle.checked && this.googleKey.value === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Enter Google API key', parent: 'preferences' });
            return;
        }
        if (this.enableGoogle.checked && (this.googleSrcLang.value === 'none' || this.googleTgtLang.value === 'none')) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select Google languages', parent: 'preferences' });
            return;
        }

        if (this.enableAzure.checked && this.azureKey.value === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Enter Azure API key', parent: 'preferences' });
            return;
        }
        if (this.enableAzure.checked && (this.azureSrcLang.value === 'none' || this.azureTgtLang.value === 'none')) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select Azure languages', parent: 'preferences' });
            return;
        }

        if (this.enableYandex.checked && this.yandexKey.value === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Enter Yandex API key', parent: 'preferences' });
            return;
        }
        if (this.enableYandex.checked && (this.yandexSrcLang.value === 'none' || this.yandexTgtLang.value === 'none')) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select Yandex languages', parent: 'preferences' });
            return;
        }

        if (this.enableDeepL.checked && this.deeplKey.value === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Enter DeepL API key', parent: 'preferences' });
            return;
        }
        if (this.enableDeepL.checked && (this.deeplSrcLang.value === 'none' || this.deeplTgtLang.value === 'none')) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select DeepL languages', parent: 'preferences' });
            return;
        }

        if (this.enableMyMemory.checked && this.myMemoryKey.value === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Enter MyMemory API key', parent: 'preferences' });
            return;
        }
        if (this.enableMyMemory.checked && (this.myMemorySrcLang.value === 'none' || this.myMemoryTgtLang.value === 'none')) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select MyMemory languages', parent: 'preferences' });
            return;
        }

        let prefs: any = {
            srcLang: this.srcLangSelect.value,
            tgtLang: this.tgtLangSelect.value,
            theme: this.themeColor.value,
            zoomFactor: this.zoomFactor.value,
            catalog: this.defaultCatalog.value,
            srx: this.defaultSRX.value,
            paragraphSegmentation: this.paragraphSegmentation.checked,
            acceptUnconfirmed: this.acceptUnconfirmed.checked,
            fuzzyTermSearches: this.fuzzyTermSearches.checked,
            caseSensitiveSearches: this.caseSensitiveSearches.checked,
            google: {
                enabled: this.enableGoogle.checked,
                apiKey: this.googleKey.value,
                srcLang: this.googleSrcLang.value,
                tgtLang: this.googleTgtLang.value,
                neural: this.googleNeural.checked
            },
            azure: {
                enabled: this.enableAzure.checked,
                apiKey: this.azureKey.value,
                srcLang: this.azureSrcLang.value,
                tgtLang: this.azureTgtLang.value
            },
            yandex: {
                enabled: this.enableYandex.checked,
                apiKey: this.yandexKey.value,
                srcLang: this.yandexSrcLang.value,
                tgtLang: this.yandexTgtLang.value
            },
            deepl: {
                enabled: this.enableDeepL.checked,
                apiKey: this.deeplKey.value,
                srcLang: this.deeplSrcLang.value,
                tgtLang: this.deeplTgtLang.value
            },
            myMemory: {
                enabled: this.enableMyMemory.checked,
                apiKey: this.myMemoryKey.value,
                srcLang: this.myMemorySrcLang.value,
                tgtLang: this.myMemoryTgtLang.value
            },
            spellchecker: {
                defaultEnglish: 'en-US',
                defaultPortuguese: 'pt-BR',
                defaultSpanish: 'es'
            }
        }
        if (this.os !== 'darwin') {
            prefs.spellchecker = {
                defaultEnglish: this.defaultEnglish.value,
                defaultPortuguese: this.defaultPortuguese.value,
                defaultSpanish: this.defaultSpanish.value
            }
        }
        this.electron.ipcRenderer.send('save-preferences', prefs);
    }

    populateBasicTab(container: HTMLDivElement): void {
        let langsTable: HTMLTableElement = document.createElement('table');
        langsTable.classList.add('fill_width');
        container.appendChild(langsTable);

        let tr: HTMLTableRowElement = document.createElement('tr');
        langsTable.appendChild(tr);

        let td: HTMLTableCellElement = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('noWrap');
        tr.appendChild(td);

        let srcLangLabel: HTMLLabelElement = document.createElement('label');
        srcLangLabel.setAttribute('for', 'srcLangSelect');
        srcLangLabel.innerText = 'Default Source Language';
        td.appendChild(srcLangLabel);

        td = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('fill_width');
        tr.appendChild(td);

        this.srcLangSelect = document.createElement('select');
        this.srcLangSelect.classList.add('table_select');
        this.srcLangSelect.id = 'srcLangSelect';
        td.appendChild(this.srcLangSelect);

        tr = document.createElement('tr');
        langsTable.appendChild(tr);

        td = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('noWrap');
        tr.appendChild(td);

        let tgtLangLabel: HTMLLabelElement = document.createElement('label');
        tgtLangLabel.setAttribute('for', 'tgtLangSelect');
        tgtLangLabel.innerText = 'Default Target Language';
        td.appendChild(tgtLangLabel);

        td = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('fill_width');
        tr.appendChild(td);

        this.tgtLangSelect = document.createElement('select');
        this.tgtLangSelect.classList.add('table_select');
        this.tgtLangSelect.id = 'tgtLangSelect';
        td.appendChild(this.tgtLangSelect);

        tr = document.createElement('tr');
        langsTable.appendChild(tr);

        td = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('noWrap');
        tr.appendChild(td);

        let themeLabel: HTMLLabelElement = document.createElement('label');
        themeLabel.setAttribute('for', 'themeColor');
        themeLabel.innerText = 'Theme';
        td.appendChild(themeLabel);

        td = document.createElement('td');
        td.classList.add('middle');
        tr.appendChild(td);

        this.themeColor = document.createElement('select');
        this.themeColor.id = 'themeColor';
        this.themeColor.innerHTML = '<option value="system">System Default</option>' +
            '<option value="dark">Dark</option>' +
            '<option value="light">Light</option>'
        td.appendChild(this.themeColor);

        tr = document.createElement('tr');
        langsTable.appendChild(tr);

        td = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('noWrap');
        tr.appendChild(td);

        let zoomLabel: HTMLLabelElement = document.createElement('label');
        zoomLabel.setAttribute('for', 'zoomFactor');
        zoomLabel.innerText = 'Font Size';
        td.appendChild(zoomLabel);

        td = document.createElement('td');
        td.classList.add('middle');
        tr.appendChild(td);

        this.zoomFactor = document.createElement('select');
        this.zoomFactor.id = 'zoomFactor';
        this.zoomFactor.innerHTML =
            '<option value="0.8">Small</option>' +
            '<option value="1.0">Medium</option>' +
            '<option value="1.2">Large</option>' +
            '<option value="1.4">Very Large</option>' +
            '<option value="1.8">Extra Large</option>'
        td.appendChild(this.zoomFactor);
    }

    populateSpellcheckTab(container: HTMLDivElement, spellchecker: any): void {
        if (this.os === 'darwin') {
            let macDiv = document.createElement('div');
            macDiv.style.padding = '8px'
            macDiv.innerHTML =
                '<p>By default, macOS automatically detects the language the user is typing in and adjusts its internal spellchecker accordingly.</p>' +
                '<p>Follow these steps to select a specific language for spellchecking: </p>' +
                '<ul><li>Open "System Preferences" application</li>' +
                '<li>Select the "Keyboard" option' +
                '<li>Select the "Text" tab</li>' +
                '<li>Select your preferred language in the "Spelling" drop-down list</li></ul>';
            container.appendChild(macDiv);
            return;
        }

        let langsTable: HTMLTableElement = document.createElement('table');
        langsTable.classList.add('fill_width');
        container.appendChild(langsTable);

        let tr: HTMLTableRowElement = document.createElement('tr');
        langsTable.appendChild(tr);

        let td: HTMLTableCellElement = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('noWrap');
        tr.appendChild(td);

        let englishLabel: HTMLLabelElement = document.createElement('label');
        englishLabel.innerText = 'Default English Variant';
        englishLabel.setAttribute('for', 'defaultEnglish');
        td.appendChild(englishLabel);

        td = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('fill_width');
        tr.appendChild(td);

        this.defaultEnglish = document.createElement('select');
        this.defaultEnglish.id = 'defaultEnglish';
        this.defaultEnglish.classList.add('table_select');
        this.defaultEnglish.innerHTML = '<option value="en-AU">English (Australia)</option>' +
            '<option value="en-CA">English (Canada)</option>' +
            '<option value="en-GB">English (United Kingdom)</option>' +
            '<option value="en-US">English (United States)</option>';
        td.appendChild(this.defaultEnglish);

        tr = document.createElement('tr');
        langsTable.appendChild(tr);

        td = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('noWrap');
        tr.appendChild(td);

        let portugueseLabel: HTMLLabelElement = document.createElement('label');
        portugueseLabel.innerText = 'Default Portuguese Variant';
        portugueseLabel.setAttribute('for', 'defaultPortuguese');
        td.appendChild(portugueseLabel);

        td = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('fill_width');
        tr.appendChild(td);

        this.defaultPortuguese = document.createElement('select');
        this.defaultPortuguese.id = 'defaultPortuguese';
        this.defaultPortuguese.classList.add('table_select');
        this.defaultPortuguese.innerHTML = '<option value="pt-BR">Portuguese (Brazil)</option>' +
            '<option value="pt-PT">Portuguese (Portugal)</option>';
        td.appendChild(this.defaultPortuguese);

        tr = document.createElement('tr');
        langsTable.appendChild(tr);

        td = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('noWrap');
        tr.appendChild(td);

        let spanishLabel: HTMLLabelElement = document.createElement('label');
        spanishLabel.innerText = 'Default Spanish Variant';
        spanishLabel.setAttribute('for', 'defaultSpanish');
        td.appendChild(spanishLabel);

        td = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('fill_width');
        tr.appendChild(td);

        this.defaultSpanish = document.createElement('select');
        this.defaultSpanish.id = 'defaultSpanish';
        this.defaultSpanish.classList.add('table_select');
        this.defaultSpanish.innerHTML = '<option value="es">Spanish</option>' +
            '<option value="es-419">Spanish (Latin America and the Caribbean)</option>' +
            '<option value="es-AR">Spanish (Argentina)</option>' +
            '<option value="es-ES">Spanish (Spain)</option>' +
            '<option value="es-MX">Spanish (Mexico)</option>' +
            '<option value="es-US">Spanish (United States)</option>';
        td.appendChild(this.defaultSpanish);

        let languagesButton = document.createElement('button');
        languagesButton.innerText = 'Available Spellchecker Languages';
        languagesButton.style.marginTop = '10px';
        languagesButton.style.marginLeft = '8px';
        languagesButton.addEventListener('click', () => {
            this.electron.ipcRenderer.send('show-spellchecker-langs');
            languagesButton.blur();
        });
        container.appendChild(languagesButton);

        this.defaultEnglish.value = spellchecker.defaultEnglish;
        this.defaultPortuguese.value = spellchecker.defaultPortuguese;
        this.defaultSpanish.value = spellchecker.defaultSpanish;
    }

    populateAdvancedTab(container: HTMLDivElement): void {
        container.style.paddingTop = '10px';

        let div: HTMLDivElement = document.createElement('div');
        div.style.margin = '0px 4px';
        container.appendChild(div);

        let advHolder: TabHolder = new TabHolder(div, 'advHolder');

        let generalTab: Tab = new Tab('generalTab', 'General', false);
        generalTab.getLabel().addEventListener('click', () => {
            this.electron.ipcRenderer.send('settings-height', { width: document.body.clientWidth, height: document.body.clientHeight });
        });
        advHolder.addTab(generalTab);
        this.populateAdvGeneralTab(generalTab.getContainer());

        let xmlTab: Tab = new Tab('xmlTab', 'XML Filter', false);
        xmlTab.getLabel().addEventListener('click', () => {
            this.electron.ipcRenderer.send('settings-height', { width: document.body.clientWidth, height: document.body.clientHeight });
        });
        advHolder.addTab(xmlTab);
        this.populateXmlFilterTab(xmlTab.getContainer());
    }

    populateAdvGeneralTab(container: HTMLDivElement): void {
        let table: HTMLTableElement = document.createElement('table');
        table.classList.add('fill_width');
        container.appendChild(table);

        let tr: HTMLTableRowElement = document.createElement('tr');
        table.appendChild(tr);

        let td: HTMLTableCellElement = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('noWrap');
        tr.appendChild(td);

        let srxLabel: HTMLLabelElement = document.createElement('label');
        srxLabel.setAttribute('for', 'defaultSRX');
        srxLabel.innerText = 'Default SRX File';
        td.appendChild(srxLabel);

        td = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('fill_width');
        tr.appendChild(td);

        this.defaultSRX = document.createElement('input');
        this.defaultSRX.id = 'defaultSRX';
        this.defaultSRX.type = 'text';
        this.defaultSRX.classList.add('fill_width');
        td.appendChild(this.defaultSRX);

        td = document.createElement('td');
        td.classList.add('middle');
        td.innerHTML = '<button id="browseSRX" class="dark">Browse...</button>';
        tr.appendChild(td);

        let row1: HTMLDivElement = document.createElement('div');
        row1.classList.add('row');
        row1.classList.add('middle');
        container.appendChild(row1);

        this.paragraphSegmentation = document.createElement('input');
        this.paragraphSegmentation.type = 'checkbox';
        this.paragraphSegmentation.id = 'paragraphSegmentation';
        row1.appendChild(this.paragraphSegmentation);

        let paragraphLabel: HTMLLabelElement = document.createElement('label');
        paragraphLabel.innerText = 'Use Paragraph Segmentation';
        paragraphLabel.setAttribute('for', 'paragraphSegmentation');
        paragraphLabel.style.marginTop = '4px';
        row1.appendChild(paragraphLabel);

        let row2: HTMLDivElement = document.createElement('div');
        row2.classList.add('row');
        row2.classList.add('middle');
        container.appendChild(row2);

        this.acceptUnconfirmed = document.createElement('input');
        this.acceptUnconfirmed.type = 'checkbox';
        this.acceptUnconfirmed.id = 'acceptUnconfirmed';
        row2.appendChild(this.acceptUnconfirmed)

        let unconfirmedLabel: HTMLLabelElement = document.createElement('label');
        unconfirmedLabel.innerText = 'Include Unconfirmed Segments when Exporting Translation';
        unconfirmedLabel.setAttribute('for', 'acceptUnconfirmed');
        unconfirmedLabel.style.marginTop = '4px';
        row2.appendChild(unconfirmedLabel);

        let row3: HTMLDivElement = document.createElement('div');
        row3.classList.add('row');
        row3.classList.add('middle');
        container.appendChild(row3);

        this.fuzzyTermSearches = document.createElement('input');
        this.fuzzyTermSearches.type = 'checkbox';
        this.fuzzyTermSearches.id = 'fuzzyTermSearches';
        row3.appendChild(this.fuzzyTermSearches);

        let fuzzyTermsLabel: HTMLLabelElement = document.createElement('label');
        fuzzyTermsLabel.innerText = 'Fuzzy Term Searches';
        fuzzyTermsLabel.setAttribute('for', 'fuzzyTermSearches');
        fuzzyTermsLabel.style.marginTop = '4px';
        row3.appendChild(fuzzyTermsLabel);

        let row4: HTMLDivElement = document.createElement('div');
        row4.classList.add('row');
        row4.classList.add('middle');
        container.appendChild(row4);

        this.caseSensitiveSearches = document.createElement('input');
        this.caseSensitiveSearches.type = 'checkbox';
        this.caseSensitiveSearches.id = 'caseSensitiveSearches';
        row4.appendChild(this.caseSensitiveSearches);

        let caseSensitiveLabel: HTMLLabelElement = document.createElement('label');
        caseSensitiveLabel.innerText = 'Case Sensitive Term Searches';
        caseSensitiveLabel.setAttribute('for', 'caseSensitiveSearches');
        caseSensitiveLabel.style.marginTop = '4px';
        row4.appendChild(caseSensitiveLabel);

    }

    populateXmlFilterTab(container: HTMLDivElement): void {
        let catalogTable: HTMLTableElement = document.createElement('table');
        catalogTable.classList.add('fill_width');
        container.appendChild(catalogTable);

        let tr: HTMLTableRowElement = document.createElement('tr');
        catalogTable.appendChild(tr);

        let td: HTMLTableCellElement = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('noWrap');
        tr.appendChild(td);

        let catalogLabel: HTMLLabelElement = document.createElement('label');
        catalogLabel.setAttribute('for', 'defaultCatalog');
        catalogLabel.innerText = 'Default Catalog';
        td.appendChild(catalogLabel);

        td = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('fill_width');
        tr.appendChild(td);

        this.defaultCatalog = document.createElement('input');
        this.defaultCatalog.id = 'defaultCatalog';
        this.defaultCatalog.type = 'text';
        this.defaultCatalog.classList.add('fill_width');
        td.appendChild(this.defaultCatalog);

        td = document.createElement('td');
        td.classList.add('middle');
        td.innerHTML = '<button id="browseCatalog" class="dark">Browse...</button>';
        tr.appendChild(td);

        let header: HTMLParagraphElement = document.createElement('p');
        header.innerText = 'XML Filter Configuration Files:';
        header.style.marginLeft = '8px';
        container.appendChild(header);

        let tableDiv: HTMLDivElement = document.createElement('div');
        tableDiv.style.height = '200px';
        tableDiv.style.margin = '8px';
        tableDiv.style.width = 'calc(100% - 18px)';
        tableDiv.classList.add('divContainer');
        tableDiv.classList.add('bordered');
        container.appendChild(tableDiv);

        this.filtersTable = document.createElement('table');
        this.filtersTable.classList.add('stripes');
        this.filtersTable.classList.add('discover');
        tableDiv.appendChild(this.filtersTable);

        let buttonArea: HTMLDivElement = document.createElement('div');
        buttonArea.classList.add('fill_width');
        buttonArea.classList.add('butonArea');
        container.appendChild(buttonArea);

        let addButton: HTMLButtonElement = document.createElement('button');
        addButton.innerText = 'Add';
        addButton.addEventListener('click', () => {
            this.addFilter();
        });
        buttonArea.appendChild(addButton);

        let editButton: HTMLButtonElement = document.createElement('button');
        editButton.innerText = 'Edit';
        editButton.addEventListener('click', () => {
            this.editFilter();
        });
        buttonArea.appendChild(editButton);

        let removeButton: HTMLButtonElement = document.createElement('button');
        removeButton.innerText = 'Remove';
        removeButton.addEventListener('click', () => {
            this.removeFilters();
        });
        buttonArea.appendChild(removeButton);

        let importButton: HTMLButtonElement = document.createElement('button');
        importButton.innerText = 'Import';
        importButton.addEventListener('click', () => {
            this.electron.ipcRenderer.send('import-xmlFilter');
        });
        buttonArea.appendChild(importButton);

        let exportButton: HTMLButtonElement = document.createElement('button');
        exportButton.innerText = 'Export';
        exportButton.addEventListener('click', () => {
            this.exportFilters();
        });
        buttonArea.appendChild(exportButton);
    }

    populateMtTab(container: HTMLDivElement): void {
        container.style.paddingTop = '10px';

        let div: HTMLDivElement = document.createElement('div');
        div.style.margin = '0px 4px';
        container.appendChild(div);

        let mtHolder: TabHolder = new TabHolder(div, 'mtHolder');

        let googleTab: Tab = new Tab('googleTab', 'Google', false);
        googleTab.getLabel().addEventListener('click', () => {
            this.electron.ipcRenderer.send('settings-height', { width: document.body.clientWidth, height: document.body.clientHeight });
        });
        mtHolder.addTab(googleTab);
        this.populateGoogleTab(googleTab.getContainer());

        let azureTab: Tab = new Tab('azureTab', 'Microsoft Azure', false);
        azureTab.getLabel().addEventListener('click', () => {
            this.electron.ipcRenderer.send('settings-height', { width: document.body.clientWidth, height: document.body.clientHeight });
        });
        mtHolder.addTab(azureTab);
        this.populateAzureTab(azureTab.getContainer());

        let yandexTab: Tab = new Tab('yandexTab', 'Yandex', false);
        yandexTab.getLabel().addEventListener('click', () => {
            this.electron.ipcRenderer.send('settings-height', { width: document.body.clientWidth, height: document.body.clientHeight });
        });
        mtHolder.addTab(yandexTab);
        this.populateYandexTab(yandexTab.getContainer());

        let deeplTab: Tab = new Tab('deeplTab', 'DeepL', false);
        deeplTab.getLabel().addEventListener('click', () => {
            this.electron.ipcRenderer.send('settings-height', { width: document.body.clientWidth, height: document.body.clientHeight });
        });
        mtHolder.addTab(deeplTab);
        this.populateDeeplTab(deeplTab.getContainer());

        let myMemoryTab: Tab = new Tab('myMemoryTab', 'MyMemory', false);
        myMemoryTab.getLabel().addEventListener('click', () => {
            this.electron.ipcRenderer.send('settings-height', { width: document.body.clientWidth, height: document.body.clientHeight });
        });
        mtHolder.addTab(myMemoryTab);
        this.populateMyMemoryTab(myMemoryTab.getContainer());
    }

    populateGoogleTab(container: HTMLDivElement): void {
        container.style.paddingTop = '10px';

        let googlelDiv: HTMLDivElement = document.createElement('div');
        googlelDiv.classList.add('middle');
        googlelDiv.classList.add('row');
        googlelDiv.style.paddingLeft = '4px';
        googlelDiv.innerHTML = '<input type="checkbox" id="enableGoogle"><label for="enableGoogle" style="padding-top:4px;">Enable Google Cloud Translation</label>';
        container.appendChild(googlelDiv);

        let langsTable: HTMLTableElement = document.createElement('table');
        langsTable.classList.add('fill_width');
        container.appendChild(langsTable);

        let tr: HTMLTableRowElement = document.createElement('tr');
        langsTable.appendChild(tr);

        let td: HTMLTableCellElement = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('noWrap');
        td.innerHTML = '<label for="googleKey">API Key</label>'
        tr.appendChild(td);

        td = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('fill_width');
        td.innerHTML = '<input type="text" id="googleKey" class="table_input"/>';
        tr.appendChild(td);

        tr = document.createElement('tr');
        langsTable.appendChild(tr);

        td = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('noWrap');
        td.innerHTML = '<label for="googleSrcLang">Source Language</label>';
        tr.appendChild(td);

        td = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('fill_width');
        td.innerHTML = '<select id="googleSrcLang" class="table_select"></select>';
        tr.appendChild(td);

        tr = document.createElement('tr');
        langsTable.appendChild(tr);

        td = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('noWrap');
        td.innerHTML = '<label for="googleTgtLang">Target Language</label>';
        tr.appendChild(td);

        td = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('fill_width');
        td.innerHTML = '<select id="googleTgtLang" class="table_select"></select>';
        tr.appendChild(td);

        let neuralDiv: HTMLDivElement = document.createElement('div');
        neuralDiv.classList.add('middle');
        neuralDiv.classList.add('row');
        neuralDiv.style.paddingLeft = '4px';
        neuralDiv.innerHTML = '<input type="checkbox" id="googleNeural"><label for="googleNeural" style="padding-top:4px;">Use Neural Machine Translation (NMT)</label>';
        container.appendChild(neuralDiv);

        this.enableGoogle = document.getElementById('enableGoogle') as HTMLInputElement;
        this.googleKey = document.getElementById('googleKey') as HTMLInputElement;
        this.googleSrcLang = document.getElementById('googleSrcLang') as HTMLSelectElement;
        this.googleTgtLang = document.getElementById('googleTgtLang') as HTMLSelectElement;
        this.googleNeural = document.getElementById('googleNeural') as HTMLInputElement;
    }

    populateAzureTab(container: HTMLDivElement): void {
        container.style.paddingTop = '10px';

        let azureDiv: HTMLDivElement = document.createElement('div');
        azureDiv.classList.add('middle');
        azureDiv.classList.add('row');
        azureDiv.style.paddingLeft = '4px';
        azureDiv.innerHTML = '<input type="checkbox" id="enableAzure"><label for="enableAzure" style="padding-top:4px;">Enable Azure Translator Text API</label>';
        container.appendChild(azureDiv);

        let langsTable: HTMLTableElement = document.createElement('table');
        langsTable.classList.add('fill_width');
        container.appendChild(langsTable);

        let tr: HTMLTableRowElement = document.createElement('tr');
        langsTable.appendChild(tr);

        let td: HTMLTableCellElement = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('noWrap');
        td.innerHTML = '<label for="azureKey">API Key</label>'
        tr.appendChild(td);

        td = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('fill_width');
        td.innerHTML = '<input type="text" id="azureKey" class="table_input"/>';
        tr.appendChild(td);

        tr = document.createElement('tr');
        langsTable.appendChild(tr);

        td = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('noWrap');
        td.innerHTML = '<label for="azureSrcLang">Source Language</label>';
        tr.appendChild(td);

        td = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('fill_width');
        td.innerHTML = '<select id="azureSrcLang" class="table_select"></select>';
        tr.appendChild(td);

        tr = document.createElement('tr');
        langsTable.appendChild(tr);

        td = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('noWrap');
        td.innerHTML = '<label for="azureTgtLang">Target Language</label>';
        tr.appendChild(td);

        td = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('fill_width');
        td.innerHTML = '<select id="azureTgtLang" class="table_select"></select>';
        tr.appendChild(td);

        this.enableAzure = document.getElementById('enableAzure') as HTMLInputElement;
        this.azureKey = document.getElementById('azureKey') as HTMLInputElement;
        this.azureSrcLang = document.getElementById('azureSrcLang') as HTMLSelectElement;
        this.azureTgtLang = document.getElementById('azureTgtLang') as HTMLSelectElement;
    }

    populateYandexTab(container: HTMLDivElement): void {
        container.style.paddingTop = '10px';

        let yandexDiv: HTMLDivElement = document.createElement('div');
        yandexDiv.classList.add('middle');
        yandexDiv.classList.add('row');
        yandexDiv.style.paddingLeft = '4px';
        yandexDiv.innerHTML = '<input type="checkbox" id="enableYandex"><label for="enableYandex" style="padding-top:4px;">Enable Yandex Translate API</label>';
        container.appendChild(yandexDiv);

        let langsTable: HTMLTableElement = document.createElement('table');
        langsTable.classList.add('fill_width');
        container.appendChild(langsTable);

        let tr: HTMLTableRowElement = document.createElement('tr');
        langsTable.appendChild(tr);

        let td: HTMLTableCellElement = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('noWrap');
        td.innerHTML = '<label for="yandexKey">API Key</label>'
        tr.appendChild(td);

        td = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('fill_width');
        td.innerHTML = '<input type="text" id="yandexKey" class="table_input"/>';
        tr.appendChild(td);

        tr = document.createElement('tr');
        langsTable.appendChild(tr);

        td = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('noWrap');
        td.innerHTML = '<label for="yandexSrcLang">Source Language</label>';
        tr.appendChild(td);

        td = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('fill_width');
        td.innerHTML = '<select id="yandexSrcLang" class="table_select"></select>';
        tr.appendChild(td);

        tr = document.createElement('tr');
        langsTable.appendChild(tr);

        td = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('noWrap');
        td.innerHTML = '<label for="yandexTgtLang">Target Language</label>';
        tr.appendChild(td);

        td = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('fill_width');
        td.innerHTML = '<select id="yandexTgtLang" class="table_select"></select>';
        tr.appendChild(td);

        this.enableYandex = document.getElementById('enableYandex') as HTMLInputElement;
        this.yandexKey = document.getElementById('yandexKey') as HTMLInputElement;
        this.yandexSrcLang = document.getElementById('yandexSrcLang') as HTMLSelectElement;
        this.yandexTgtLang = document.getElementById('yandexTgtLang') as HTMLSelectElement;
    }

    populateDeeplTab(container: HTMLDivElement): void {
        container.style.paddingTop = '10px';

        let deeplDiv: HTMLDivElement = document.createElement('div');
        deeplDiv.classList.add('middle');
        deeplDiv.classList.add('row');
        deeplDiv.style.paddingLeft = '4px';
        deeplDiv.innerHTML = '<input type="checkbox" id="enableDeepL"><label for="enableDeepL" style="padding-top:4px;">Enable DeepL API</label>';
        container.appendChild(deeplDiv);

        let langsTable: HTMLTableElement = document.createElement('table');
        langsTable.classList.add('fill_width');
        container.appendChild(langsTable);

        let tr: HTMLTableRowElement = document.createElement('tr');
        langsTable.appendChild(tr);

        let td: HTMLTableCellElement = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('noWrap');
        td.innerHTML = '<label for="deeplKey">API Key</label>'
        tr.appendChild(td);

        td = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('fill_width');
        td.innerHTML = '<input type="text" id="deeplKey" class="table_input"/>';
        tr.appendChild(td);

        tr = document.createElement('tr');
        langsTable.appendChild(tr);

        td = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('noWrap');
        td.innerHTML = '<label for="deeplSrcLang">Source Language</label>';
        tr.appendChild(td);

        td = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('fill_width');
        td.innerHTML = '<select id="deeplSrcLang" class="table_select"></select>';
        tr.appendChild(td);

        tr = document.createElement('tr');
        langsTable.appendChild(tr);

        td = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('noWrap');
        td.innerHTML = '<label for="deeplTgtLang">Target Language</label>';
        tr.appendChild(td);

        td = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('fill_width');
        td.innerHTML = '<select id="deeplTgtLang" class="table_select"></select>';
        tr.appendChild(td);

        this.enableDeepL = document.getElementById('enableDeepL') as HTMLInputElement;
        this.deeplKey = document.getElementById('deeplKey') as HTMLInputElement;
        this.deeplSrcLang = document.getElementById('deeplSrcLang') as HTMLSelectElement;
        this.deeplTgtLang = document.getElementById('deeplTgtLang') as HTMLSelectElement;
    }

    populateMyMemoryTab(container: HTMLDivElement): void {
        container.style.paddingTop = '10px';

        let myMemoryDiv: HTMLDivElement = document.createElement('div');
        myMemoryDiv.classList.add('middle');
        myMemoryDiv.classList.add('row');
        myMemoryDiv.style.paddingLeft = '4px';
        myMemoryDiv.innerHTML = '<input type="checkbox" id="enableMyMemory"><label for="enableMyMemory" style="padding-top:4px;">Enable MyMemory API</label>';
        container.appendChild(myMemoryDiv);

        let langsTable: HTMLTableElement = document.createElement('table');
        langsTable.classList.add('fill_width');
        container.appendChild(langsTable);

        let tr: HTMLTableRowElement = document.createElement('tr');
        langsTable.appendChild(tr);

        let td: HTMLTableCellElement = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('noWrap');
        td.innerHTML = '<label for="myMemoryKey">API Key</label>'
        tr.appendChild(td);

        td = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('fill_width');
        td.innerHTML = '<input type="text" id="myMemoryKey" class="table_input"/>';
        tr.appendChild(td);

        tr = document.createElement('tr');
        langsTable.appendChild(tr);

        td = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('noWrap');
        td.innerHTML = '<label for="myMemorySrcLang">Source Language</label>';
        tr.appendChild(td);

        td = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('fill_width');
        td.innerHTML = '<select id="myMemorySrcLang" class="table_select"></select>';
        tr.appendChild(td);

        tr = document.createElement('tr');
        langsTable.appendChild(tr);

        td = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('noWrap');
        td.innerHTML = '<label for="myMemoryTgtLang">Target Language</label>';
        tr.appendChild(td);

        td = document.createElement('td');
        td.classList.add('middle');
        td.classList.add('fill_width');
        td.innerHTML = '<select id="myMemoryTgtLang" class="table_select"></select>';
        tr.appendChild(td);

        this.enableMyMemory = document.getElementById('enableMyMemory') as HTMLInputElement;
        this.myMemoryKey = document.getElementById('myMemoryKey') as HTMLInputElement;
        this.myMemorySrcLang = document.getElementById('myMemorySrcLang') as HTMLSelectElement;
        this.myMemoryTgtLang = document.getElementById('myMemoryTgtLang') as HTMLSelectElement;
    }

    setMtLanguages(arg: any): void {
        this.googleSrcLang.innerHTML = this.getOptions(arg.google.srcLangs);
        this.googleTgtLang.innerHTML = this.getOptions(arg.google.tgtLangs);

        this.azureSrcLang.innerHTML = this.getOptions(arg.azure.srcLangs);
        this.azureTgtLang.innerHTML = this.getOptions(arg.azure.tgtLangs);

        this.yandexSrcLang.innerHTML = this.getOptions(arg.yandex.srcLangs);
        this.yandexTgtLang.innerHTML = this.getOptions(arg.yandex.tgtLangs);

        this.deeplSrcLang.innerHTML = this.getOptions(arg.deepl.srcLangs);
        this.deeplTgtLang.innerHTML = this.getOptions(arg.deepl.tgtLangs);


        this.electron.ipcRenderer.send('get-preferences');

        this.googleNeural.addEventListener('change', (event: InputEvent) => {
            let src = this.googleSrcLang.value;
            let tgt = this.googleTgtLang.value;
            if (this.googleNeural.checked) {
                this.googleSrcLang.innerHTML = this.getOptions(arg.google.nmtSrcLangs);
                this.googleTgtLang.innerHTML = this.getOptions(arg.google.nmtTgtLangs);
            } else {
                this.googleSrcLang.innerHTML = this.getOptions(arg.google.srcLangs);
                this.googleTgtLang.innerHTML = this.getOptions(arg.google.tgtLangs);
            }
            this.googleSrcLang.value = src;
            this.googleTgtLang.value = tgt;
        });

        // TODO check Yandex directions
    }

    getOptions(array: any[]): string {
        let languageOptions = '<option value="none">Select Language</option>';
        for (let i = 0; i < array.length; i++) {
            let lang = array[i];
            languageOptions = languageOptions + '<option value="' + lang.code + '">' + lang.description + '</option>';
        }
        return languageOptions;
    }

    setFilters(json: any): void {
        this.filtersTable.innerHTML = '';
        let files: string[] = json.files;
        for (let i = 0; i < files.length; i++) {
            let row: HTMLTableRowElement = document.createElement('tr');
            this.filtersTable.appendChild(row);
            let col1: HTMLTableCellElement = document.createElement('td');
            col1.classList.add('middle');
            row.appendChild(col1);
            let check: HTMLInputElement = document.createElement('input');
            check.id = 'ck_' + files[i];
            check.type = 'checkbox';
            col1.appendChild(check);
            row.addEventListener('click', (event: MouseEvent) => {
                this.clicked(row, files[i], check);
            });
            let col2 = document.createElement('td');
            col2.classList.add('fill_width');
            col2.innerText = files[i];
            row.appendChild(col2);
        }
        this.selected.clear();
    }

    clicked(row: HTMLTableRowElement, file: string, checkbox: HTMLInputElement): void {
        let isSelected: boolean = this.selected.has(file);
        if (!isSelected) {
            this.selected.set(file, file);
            row.classList.add('selected');
        } else {
            this.selected.delete(file);
            row.classList.remove('selected');
        }
        checkbox.checked = !isSelected;
    }

    addFilter(): void {
        this.electron.ipcRenderer.send('show-addXmlConfiguration');
    }

    editFilter(): void {
        if (this.selected.size === 0) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select configuration file', parent: 'preferences' });
            return;
        }
        if (this.selected.size !== 1) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select one configuration file', parent: 'preferences' });
            return;
        }
        let it: IterableIterator<[string, string]> = this.selected.entries();
        let first: IteratorResult<[string, string]> = it.next();
        this.electron.ipcRenderer.send('edit-filterConfig', { file: this.selected.get(first.value[0]) });
    }

    removeFilters(): void {
        if (this.selected.size === 0) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select configuration file', parent: 'preferences' });
            return;
        }
        let selectedFiles: string[] = [];
        for (let key of this.selected.keys()) {
            selectedFiles.push(key);
        }
        this.electron.ipcRenderer.send('remove-xmlFilters', { files: selectedFiles });
    }

    exportFilters(): void {
        if (this.selected.size === 0) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select configuration file', parent: 'preferences' });
            return;
        }
        let selectedFiles: string[] = [];
        for (let key of this.selected.keys()) {
            selectedFiles.push(key);
        }
        this.electron.ipcRenderer.send('export-xmlFilters', { files: selectedFiles });
    }
}

new Preferences();
