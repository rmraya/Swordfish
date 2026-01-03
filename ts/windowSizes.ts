/*******************************************************************************
 * Copyright (c) 2007-2026 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/

import { existsSync, readFileSync, writeFileSync } from "fs";

export class Rect {

    width: number;
    height: number;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }
}

export class Sizes {

    file: string;
    sizes: Map<string, Rect>;

    constructor(file: string) {
        this.file = file;
        this.sizes = new Map<string, Rect>();
        if (existsSync(file)) {
            try {
                let data: Buffer = readFileSync(file);
                let json = JSON.parse(data.toString());
                for (const [key, value] of Object.entries(json)) {
                    this.sizes.set(key, new Rect((value as any).width, (value as any).height));
                }
            } catch (err: any) {
                if (err instanceof Error) {
                    console.error(err.message);
                    return;
                }
                console.log(err);
            }
        }
    }

    setSize(window: string, width: number, height: number): void {
        const size = new Rect(width, height);
        this.sizes.set(window, size);
        let text: string = '{';
        this.sizes.forEach((value: Rect, key: string) => {
            text = text + '"' + key + '": {"width":' + value.width + ', "height":' + value.height + '},';
        });
        text = text.substring(0, text.length - 1) + '}'
        let json = JSON.parse(text);
        writeFileSync(this.file, JSON.stringify(json, null, 2));
    }

    hasSize(window: string): boolean {
        return this.sizes.has(window);
    }

    getSize(window: string): Rect | undefined {
        if (this.sizes.has(window)) {
            return this.sizes.get(window);
        }
        return undefined;
    }

}