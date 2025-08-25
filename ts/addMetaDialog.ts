class AddMeta {

    electron = require('electron');

    segmentData: any;
    editing: boolean = false;

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        this.electron.ipcRenderer.on('set-meta', (event: Electron.IpcRendererEvent, meta: MetaEntry) => {
            this.setMeta(meta);
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-add-metaDialog');
            }
        });
        (document.getElementById('saveMeta') as HTMLButtonElement).addEventListener('click', () => {
            this.saveMeta();
        });
        (document.getElementById('metaType') as HTMLSelectElement).focus();
        setTimeout(() => {
            this.electron.ipcRenderer.send('set-height', { window: 'addMetaDialog', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);

    }

    setMeta(meta: MetaEntry): void {
        (document.getElementById('metaType') as HTMLSelectElement).value = meta.type;
        (document.getElementById('metaValue') as HTMLInputElement).value = meta.value;
        this.editing = true;
    }

    saveMeta(): void {
        let type: string = (document.getElementById('metaType') as HTMLSelectElement).value;
        if (!type) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select type', parent: 'addMetaDialog' });
            return;
        }
        if (!AddMeta.isNMToken(type)) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Invalid type', parent: 'addMetaDialog' });
            return;
        }
        let value: string = (document.getElementById('metaValue') as HTMLInputElement).value;
        if (!value) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select value', parent: 'addMetaDialog' });
            return;
        }
        let entry: MetaEntry = { type: type, value: value };
        if (!this.editing) {
            this.electron.ipcRenderer.send('add-meta', entry);
        } else {
            this.electron.ipcRenderer.send('edit-meta', entry);
        }
    }

    static isNMToken(name: string): boolean {
        if (!name || name.length === 0) {
            return false;
        }
        
        // Pattern for NameStartChar (first character)
        const nameStartCharPattern = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
        
        // Pattern for NameChar (remaining characters)
        const nameCharPattern = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/;
        
        // Check first character against NameStartChar
        if (!nameStartCharPattern.test(name.charAt(0))) {
            return false;
        }
        
        // Check remaining characters against NameChar (if any)
        if (name.length > 1) {
            const remainingChars = name.substring(1);
            if (!nameCharPattern.test(remainingChars)) {
                return false;
            }
        }        
        return true;
    }
}