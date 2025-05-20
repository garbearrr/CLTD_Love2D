import { Image, Quad } from "love.graphics";

export namespace SpriteFont {
    /* ──────── constants (unchanged) ──────── */
    const IMAGE_PATH  = "assets/glyph_sheet.png";
    export const CELL_W      = 144;
    export const CELL_H      = 256;
    const SHEET_W     = 16;
    const SHEET_H     = 16;
    const SHEET_X_PAD = 1;
    const SHEET_Y_PAD = 1;
    const SHEET_X     = 0;
    const SHEET_Y     = SHEET_Y_PAD;
    const DEFAULT_CHAR = "?";

    /* ──────── colour helpers ──────── */
    /** Simple RGBA record (values 0–1). */
    const WHITE: Color = { r: 1, g: 1, b: 1, a: 1 };

    /* ──────── state ──────── */
    let image!: Image;
    const quads: Map<string, Quad> = new Map();

    /* ──────── initialisation ──────── */
    export function initialize() {
        image = love.graphics.newImage(IMAGE_PATH);
        image.setFilter("nearest", "nearest"); // no smoothing

        for (const [char, index] of CM.entries()) {
            const x = SHEET_X + ((index % SHEET_W) * (CELL_W + SHEET_X_PAD));
            const y = SHEET_Y + Math.floor(index / SHEET_W) * (CELL_H + SHEET_Y_PAD);
            const [iw, ih] = image.getDimensions();
            const quad = love.graphics.newQuad(x, y, CELL_W, CELL_H, iw, ih);
            quads.set(char, quad);
        }
    }

    /* ──────── internals ──────── */
    function getQuad(char: string): Quad {
        if (quads.has(char)) return quads.get(char)!;
        if (quads.has(DEFAULT_CHAR)) return quads.get(DEFAULT_CHAR)!;
        throw `Quad for character "${char}" not found.`;
    }

    /* ──────── public API ──────── */

    /**
     * Draw a single character.
     * @param char   Character to draw (must exist in CM).
     * @param x,y    Destination in pixels.
     * @param scale  Uniform scale (SpriteFont.getScale(h) is handy).
     * @param col    Optional tint (defaults to white = no tint).
     */
    export function print(
        char: string,
        x: number,
        y: number,
        scale: number,
        col: Color = WHITE
    ) {
        // Preserve the existing colour so we don’t leak tint to caller.
        const [pr, pg, pb, pa] = love.graphics.getColor();
        love.graphics.setColor(col.r, col.g, col.b, col.a ?? 1);

        love.graphics.draw(image, getQuad(char), x, y, 0, scale, scale);

        love.graphics.setColor(pr, pg, pb, pa);
    }

    /** Utility: convert desired pixel height → uniform scale. */
    export function getScale(h: number) {
        return h / CELL_H;
    }
}


const CM = new Map<string, number>([
    ["☺", 0],
    ["☻", 1],
    ["♥", 2],
    ["♦", 3],
    ["♣", 4],
    ["♠", 5],
    ["•", 6],
    ["◘", 7],
    ["○", 8],
    ["◙", 9],
    ["♂", 10],
    ["♀", 11],
    ["♪", 12],
    ["♫", 13],
    ["☼", 14],
    ["►", 15],
    ["◄", 16],
    ["↕", 17],
    ["‼", 18],
    ["¶", 19],
    ["§", 20],
    ["▬", 21],
    ["↨", 22],
    ["↑", 23],
    ["↓", 24],
    ["→", 25],
    ["←", 26],
    ["∟", 27],
    ["↔", 28],
    ["▲", 29],
    ["▼", 30],
    ["!", 31],
    [`"`, 32],
    ["#", 33],
    ["$", 34],
    ["%", 35],
    ["&", 36],
    ["'", 37],
    ["(", 38],
    [")", 39],
    ["*", 40],
    ["+", 41],
    [",", 42],
    ["-", 43],
    [".", 44],
    ["/", 45],
    ["0", 46],
    ["1", 47],
    ["2", 48],
    ["3", 49],
    ["4", 50],
    ["5", 51],
    ["6", 52],
    ["7", 53],
    ["8", 54],
    ["9", 55],
    [":", 56],
    [";", 57],
    ["<", 58],
    ["=", 59],
    [">", 60],
    ["?", 61],
    ["@", 62],
    ["A", 63],
    ["B", 64],
    ["C", 65],
    ["D", 66],
    ["E", 67],
    ["F", 68],
    ["G", 69],
    ["H", 70],
    ["I", 71],
    ["J", 72],
    ["K", 73],
    ["L", 74],
    ["M", 75],
    ["N", 76],
    ["O", 77],
    ["P", 78],
    ["Q", 79],
    ["R", 80],
    ["S", 81],
    ["T", 82],
    ["U", 83],
    ["V", 84],
    ["W", 85],
    ["X", 86],
    ["Y", 87],
    ["Z", 88],
    ["[", 89],
    ["\\", 90],
    ["]", 91],
    ["^", 92],
    ["_", 93],
    ["`", 94],
    ["a", 95],
    ["b", 96],
    ["c", 97],
    ["d", 98],
    ["e", 99],
    ["f", 100],
    ["g", 101],
    ["h", 102],
    ["i", 103],
    ["j", 104],
    ["k", 105],
    ["l", 106],
    ["m", 107],
    ["n", 108],
    ["o", 109],
    ["p", 110],
    ["q", 111],
    ["r", 112],
    ["s", 113],
    ["t", 114],
    ["u", 115],
    ["v", 116],
    ["w", 117],
    ["x", 118],
    ["y", 119],
    ["z", 120],
    ["{", 121],
    ["|", 122],
    ["}", 123],
    ["~", 124],
    ["⌂", 125],
    [" ", 126],
    ["¡", 127],
    ["¢", 128],
    ["£", 129],
    ["¥", 130],
    ["ª", 131],
    ["«", 132],
    ["¬", 133],
    ["°", 134],
    ["±", 135],
    ["²", 136],
    ["µ", 137],
    ["·", 138],
    ["º", 139],
    ["»", 140],
    ["¼", 141],
    ["½", 142],
    ["¿", 143],
    ["Ä", 144],
    ["Å", 145],
    ["Æ", 146],
    ["Ç", 147],
    ["È", 148],
    ["Ñ", 149],
    ["Ö", 150],
    ["Ü", 151],
    ["ß", 152],
    ["à", 153],
    ["á", 154],
    ["â", 155],
    ["ä", 156],
    ["å", 157],
    ["æ", 158],
    ["ç", 159],
    ["è", 160],
    ["é", 161],
    ["ê", 162],
    ["ë", 163],
    ["ì", 164],
    ["í", 165],
    ["î", 166],
    ["ï", 167],
    ["ñ", 168],
    ["ò", 169],
    ["ó", 170],
    ["ô", 171],
    ["ö", 172],
    ["÷", 173],
    ["ù", 174],
    ["ú", 175],
    ["û", 176],
    ["ü", 177],
    ["ÿ", 178],
    ["ƒ", 179],
    ["Γ", 180],
    ["Θ", 181],
    ["Σ", 182],
    ["Φ", 183],
    ["Ω", 184],
    ["α", 185],
    ["δ", 186],
    ["ε", 187],
    ["π", 188],
    ["σ", 189],
    ["τ", 190],
    ["φ", 191],
    ["∩", 192],
    ["₧", 193],
    ["∙", 194],
    ["√", 195],
    ["∞", 196],
    ["∏", 197],
    ["≈", 198],
    ["≡", 199],
    ["≤", 200],
    ["≥", 201],
    ["⌐", 202],
    ["⌠", 203],
    ["⌡", 204],
    ["─", 205],
    ["│", 206],
    ["┌", 207],
    ["┐", 208],
    ["└", 209],
    ["┘", 210],
    ["├", 211],
    ["┤", 212],
    ["┬", 213],
    ["┴", 214],
    ["┼", 215],
    ["═", 216],
    ["║", 217],
    ["╒", 218],
    ["╓", 219],
    ["╔", 220],
    ["╕", 221],
    ["╖", 222],
    ["╗", 223],
    ["╘", 224],
    ["╙", 225],
    ["╚", 226],
    ["╛", 227],
    ["╜", 228],
    ["╝", 229],
    ["╞", 230],
    ["╟", 231],
    ["╠", 232],
    ["╡", 233],
    ["╢", 234],
    ["╣", 235],
    ["╤", 236],
    ["╥", 237],
    ["╦", 238],
    ["╧", 239],
    ["╨", 240],
    ["╩", 241],
    ["╪", 242],
    ["╫", 243],
    ["╬", 244],
    ["▀", 245],
    ["▄", 246],
    ["█", 247],
    ["▌", 248],
    ["▐", 249],
    ["░", 250],
    ["▒", 251],
    ["▓", 252],
    ["■", 253],
]);