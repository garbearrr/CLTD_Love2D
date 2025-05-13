export const ColorEscapes = new Map<string, Color>([
    ["\\B", { r: 0, g: 0, b: 0, a: 1 }],   // black
    ["\\r", { r: 1, g: 0, b: 0, a: 1 }],   // red
    ["\\g", { r: 0, g: 1, b: 0, a: 1 }],   // green
    ["\\y", { r: 1, g: 1, b: 0, a: 1 }],   // yellow
    ["\\b", { r: 0, g: 0, b: 1, a: 1 }],   // blue
    ["\\m", { r: 1, g: 0, b: 1, a: 1 }],   // magenta
    ["\\c", { r: 0, g: 1, b: 1, a: 1 }],   // cyan
    ["\\w", { r: 1, g: 1, b: 1, a: 1 }],   // white
    ["\\G", { r: 0.5, g: 0.5, b: 0.5, a: 1 }], // gray
]);

export const Colors = {
    BLACK:   { r: 0, g: 0, b: 0, a: 1 },
    RED:     { r: 1, g: 0, b: 0, a: 1 },
    GREEN:   { r: 0, g: 1, b: 0, a: 1 },
    YELLOW:  { r: 1, g: 1, b: 0, a: 1 },
    BLUE:    { r: 0, g: 0, b: 1, a: 1 },
    MAGENTA: { r: 1, g: 0, b: 1, a: 1 },
    CYAN:    { r: 0, g: 1, b: 1, a: 1 },
    WHITE:   { r: 1, g: 1, b: 1, a: 1 },
    GRAY:    { r: 0.5, g: 0.5, b: 0.5, a: 1 },
}