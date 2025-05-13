import { getFont } from "./FontCache";
import { PriorityQueue } from "./PriorityQueue";
import { SpriteFont } from "./SpriteFont";

// src/Cell.ts
export class Cell implements ICell {
  readonly i: number;
  readonly j: number;
  readonly key: XCommaY;

  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  
  public immutable = false;
  public border = false;
  public cursor = false;

  private readonly char = new PriorityQueue<{char: string, p: number}>((a, b) => a.p > b.p);

  private color = { r: 0, g: 0, b: 0, a: 1 };
  private charColor = { r: 1, g: 1, b: 1, a: 1 };
  private charSizeOffset = 0; // cell height + this offset

  private lines = {
    hcenter: false,
    vcenter: false,
    top: false,
    bottom: false,
    left: false,
    right: false,
  }
  private lineWidth = 0.3; // percentage of cell width
  private lineColor = { r: 1, g: 1, b: 1, a: 1 };

  private next: ICell | null = null;
  private last: ICell | null = null;

  private enemies: Map<number, IBaseEnemy> = new Map();

  constructor(i: number, j: number, w: number, h: number, x: number, y: number) {
    this.i = i;
    this.j = j;
    this.w = w;
    this.h = h;
    this.x = x;
    this.y = y;
    this.key = `${i},${j}` as XCommaY;
  }

  setColor(r: number, g: number, b: number, a: number): this {
    this.color = { r, g, b, a };
    return this;
  }

  pushChar(c: string, priority = -1): this {
    this.char.enqueue({ char: c, p: priority });
    return this;
  }

  setCharColor(r: number, g: number, b: number, a = 1): this {
    this.charColor = { r, g, b, a };
    return this;
  }

  removeAllCharWithPriority(priority: number): void {
    this.char.removeAll((c) => c.p === priority);
  }

  clearChars(): this {
    this.char.clear();
    return this;
  }

  clearNext(): this {
    this.next = null;
    return this;
  }

  clearLast(): this {
    this.last = null;
    return this;
  }

  clearWalls(): this {
    this.lines = {
      hcenter: false,
      vcenter: false,
      top: false,
      bottom: false,
      left: false,
      right: false,
    };
    return this;
  }

  setCharSizeOffset(offset: number): this {
    this.charSizeOffset = Math.round(offset);
    return this;
  }

  setNext(c: ICell | null): this {
    this.next = c;
    return this;
  }

  setLast(c: ICell | null): this {
    this.last = c;
    return this;
  }

  setWalls(opts: { hcenter?: boolean; vcenter?: boolean; top?: boolean; bottom?: boolean; left?: boolean; right?: boolean; }): this {
    this.lines = { ...this.lines, ...opts };
    return this;
  }

  addEnemy(enemy: IBaseEnemy): this {
    this.enemies.set(enemy.id, enemy);
    return this;
  }

  removeEnemy(enemy: IBaseEnemy): this {
    this.enemies.delete(enemy.id);
    return this;
  }

  getNext(): ICell | null {
    return this.next;
  }

  getChar(): string {
    return this.char.peek()?.char || "";
  }

  markBorder(): this {
    this.border = true;
    this.immutable = true;
    return this;
  }

  markCursor(): this {
    this.cursor = true;
    this.immutable = true;
    return this;
  }

  private drawLines() {
    love.graphics.setLineWidth(this.w * this.lineWidth);
    love.graphics.setLineJoin("none");
    love.graphics.setColor(this.lineColor.r, this.lineColor.g, this.lineColor.b, this.lineColor.a);

    // Draw lines account for linewidth when centering
    const lw = this.w * this.lineWidth;
    const lw2 = lw / 2;
    if (this.lines.hcenter) love.graphics.line(this.x + lw2, this.y + this.h / 2, this.x + this.w - lw2, this.y + this.h / 2);
    if (this.lines.vcenter) love.graphics.line(this.x + this.w / 2, this.y + lw2, this.x + this.w / 2, this.y + this.h - lw2);
    if (this.lines.top) love.graphics.line(this.x + lw2, this.y, this.x + this.w - lw2, this.y);
    if (this.lines.bottom) love.graphics.line(this.x + lw2, this.y + this.h, this.x + this.w - lw2, this.y + this.h);
    if (this.lines.left) love.graphics.line(this.x, this.y + lw2, this.x, this.y + this.h - lw2);
    if (this.lines.right) love.graphics.line(this.x + this.w, this.y + lw2, this.x + this.w, this.y + this.h - lw2);
  }

  draw() {
    // Cell and color
    love.graphics.setColor(this.color.r, this.color.g, this.color.b, this.color.a);
    love.graphics.rectangle("fill", this.x, this.y, this.w, this.h);

    this.drawLines();

    // Character inside the cell (enemy)
    const char = this.char.peek();
    if (!char) return;

    // Get up to top 4 chars with the same priority
    const top = this.char.peekAtFirst(4);
    const chars = [char];
    for(const t of top.slice(1)) {
      if (t.p !== char.p) break;
      chars.push(t);
    }

    // If there is only one top char, print over entire cell
    if (chars.length === 1) {
        /* ─── 1. shrink the box by the padding  ─── */
        const pad = this.charSizeOffset;           //   ≥ 0
        const innerW = this.w - pad * 2;
        const innerH = this.h - pad * 2;

        /* ─── 2. pick a scale that fits the height  ─── */
        const scale = SpriteFont.getScale(innerH); // innerH / CELL_H

        /* ─── 3. work out the glyph’s real size after scaling  ─── */
        const glyphH = innerH;                     // by construction
        const glyphW = SpriteFont.CELL_W / SpriteFont.CELL_H * glyphH;         // keep aspect ratio

        /* ─── 4. centre it inside the padded box  ─── */
        const drawX = this.x + pad + (innerW - glyphW) / 2;
        const drawY = this.y + pad;                // already centred vertically

        SpriteFont.print(chars[0].char, drawX, drawY, scale, this.charColor);
    }
    // Otherwise we will divide the char size by 4 and print in the order: top left, bottom right, top right, bottom left
    else {
/*       const textW      = f.font.getWidth(chars[0].char);
      const textH      = Math.floor((this.h + this.charSizeOffset) / 4);                         // height ≈ font size

      // helpers to centre a glyph inside a quadrant
      const quadW      = this.w / 2;
      const quadH      = this.h / 2;
      const cx         = (qx: number) => this.x + qx * quadW + (quadW - textW) / 2;
      const cy         = (qy: number) => this.y + qy * quadH + (quadH - textH) / 2;

      // order: TL, BR, TR, BL ──────────────
      const targets: [number, number][] = [
        [0, 0],   // top-left
        [1, 1],   // bottom-right
        [1, 0],   // top-right
        [0, 1],   // bottom-left
      ];

      for (let i = 0; i < chars.length && i < targets.length; ++i) {
        const [qx, qy] = targets[i];
        love.graphics.print(chars[i].char, cx(qx), cy(qy));
      } */
    }
  }
}