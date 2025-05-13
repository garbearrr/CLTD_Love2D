import * as utf8 from "utf8";
import { StringColor } from "./StringColor";

export class OutputStack {
    private readonly lineSize: number;
    private readonly maxLines: number;
    public  readonly lines: StringColor[];

    constructor(lineSize: number, maxLines: number) {
        this.lineSize = lineSize;
        this.maxLines = maxLines - 1;
        this.lines    = [];
    }

    /** Adds `line`, wrapping after `lineSize` **characters** (code points). */
    addLine(line: StringColor): void {
        const wrapWidth = this.lineSize;
        const outParts: StringColor[] = [];
        let   part   = new StringColor("");
        let   count  = 0;

        // ---- stream every UTF-8 character exactly once --------------------
        for (const [_, cp] of utf8.codes(line.valueOf())) {   // cp = code point number
            part.concat(utf8.char(cp));
            const preserveColor = line.charAtIsColor(count);
            if (preserveColor) part.colorRange(count, count + 1, preserveColor);
            
            if (++count >= wrapWidth) {
                outParts.push(part);
                part  = new StringColor("");
                count = 0;
            }
        }
        if (part.valueOf() !== "") outParts.push(part);
        // -------------------------------------------------------------------

        this.lines.push(...outParts);
        while (this.lines.length > this.maxLines) this.lines.shift();
    }

    static forEachUTF8(str: string, callback: (s: string) => void): void {
        for (const [_, codePoint] of utf8.codes(str)) {
            callback(utf8.char(codePoint));
        }
    }

    static toUTF8Array(str: string): string[] {
        const arr: string[] = [];
        for (const [_, codePoint] of utf8.codes(str)) {
            arr.push(utf8.char(codePoint));
        }
        return arr;
    }

    getLineSize(): number { return this.lineSize; }
}
