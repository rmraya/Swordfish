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
import { existsSync, readFileSync, writeFile } from "fs";

export class Point {

    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

export class Locations {

    file: string;
    locations: Map<string, Point>;

    constructor(file: string) {
        this.file = file;
        this.locations = new Map<string, Point>();
        if (existsSync(file)) {
            try {
                let data: Buffer = readFileSync(file);
                let json: any = JSON.parse(data.toString());
                for (const [key, value] of Object.entries(json)) {
                    this.locations.set(key, new Point((value as any).x, (value as any).y));
                }
            } catch (err: any) {
                console.log(err);
            }
        }
    }

    hasLocation(window: string): boolean {
        return this.locations.has(window);
    }

    setLocation(window: string, x: number, y: number): void {
        let point: Point = new Point(x, y);
        this.locations.set(window, point);
        let text: string = '{';
        this.locations.forEach((value: Point, key: string) => {
            text = text + '\"' + key + '\": {\"x\":' + value.x + ', \"y\":' + value.y + '},';
        });
        text = text.substring(0, text.length - 1) + '}'
        let json = JSON.parse(text);
        writeFile(this.file, JSON.stringify(json), (err: Error) => {
            if (err) throw err;
        });
    }

    getLocation(window: string): Point {
        if (this.locations.has(window)) {
            return this.locations.get(window);
        }
        return null;
    }
}