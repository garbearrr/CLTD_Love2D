import * as utf8 from "utf8";

export class StringColor implements IStringColor {
    colorData: { from: number; to: number; color: Color }[];
    private s: string

    constructor(str: string) {
        this.s = str;
        this.colorData = [];
    }

    valueOf(): string {
        return this.s;
    }

    concat(...args: (string | StringColor)[]): this {
        this.s += args.map((arg) => (typeof arg === "string" ? arg : arg.valueOf())).join("");
        return this;
    }

    color(c: Color): this {
        this.colorData.push({ from: 0, to: this.utf8Length(), color: c });
        return this;
    }

    colorRange(
        start: number,
        end: number,
        c: Color,
        elseColor?: Color
    ): this {
        const s = this.toString();
        const colorData = this.colorData;
        if (elseColor) colorData.push({ from: 0, to: s.length, color: elseColor });
        colorData.push({ from: start, to: end, color: c });
        return this;
    }

    colorize(
        ...ranges: { start: number; end: number; color: Color }[]
    ): this {
        const s = this.toString();
        const colorData = this.colorData;
        for (const { start, end, color } of ranges) {
            colorData.push({ from: start, to: end, color });
        }
        return this;
    }

    charAtIsColor(index: number): Color | undefined {
        for (const { from, to, color } of this.colorData) {
            if (index >= from && index < to) return color;
        }
        return undefined;
    }

    reset(): this {
        this.colorData = [];
        return this;
    }

    utf8Length(): number {
        return utf8.len(this.s) as number;
    }

    toUTF8Array(): string[] {
        const arr: string[] = [];
        for (const [_, codePoint] of utf8.codes(this.s)) {
            arr.push(utf8.char(codePoint));
        }
        return arr;
    }
}