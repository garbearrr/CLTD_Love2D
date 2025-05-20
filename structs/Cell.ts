import { ENEMY_PRIO } from "./Const";
import { PriorityQueue } from "./PriorityQueue";
import { SpriteFont } from "./SpriteFont";
import { StringColor } from "./StringColor";

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

  private readonly char = new PriorityQueue<{char: IStringColor, p: number, id: number}>((a, b) => a.p > b.p);

  private color = { r: 0, g: 0, b: 0, a: 1 };
  private charColor = { r: 1, g: 1, b: 1, a: 1 }; // default color for the character
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

  pushCharSC(c: IStringColor, priority = -1, id = love.timer.getTime()): this {
    this.char.enqueue({ char: c, p: priority, id});
    return this;
  }

  pushChar(c: string, priority = -1, id = love.timer.getTime()): this {
    return this.pushCharSC(new StringColor(c), priority, id);
  }

  removeAllCharWithPriority(priority: number): void {
    //console.log(`before removal (p=${priority}):`, this.char.size());
    this.char.removeAll(c => c.p === priority);
    //console.log(` after removal (p=${priority}):`, this.char.size());
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
    this.pushCharSC(enemy.icon, ENEMY_PRIO, enemy.id);
    return this;
  }

  removeEnemy(enemy: IBaseEnemy): this {
    this.enemies.delete(enemy.id);
    this.char.remove((c) => c.id === enemy.id);
    return this;
  }

  getNext(): ICell | null {
    return this.next;
  }

  getChar(): IStringColor {
    return this.char.peek()?.char || new StringColor("");
  }

  setCharColor(r: number, g: number, b: number, a: number): this {
    this.charColor = { r, g, b, a };
    return this;
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
    /* love.graphics.setLineWidth(this.w * this.lineWidth);
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
    if (this.lines.right) love.graphics.line(this.x + this.w, this.y + lw2, this.x + this.w, this.y + this.h - lw2); */
  }

  private drawChars() {
      const char = this.char.peek();
      if (!char) return;

      // Find top four chars (if there are any)
      const top = this.char.peekAtFirst(4);
      const chars = [char];
      for(const t of top.slice(1)) {
        if (t.p !== char.p) break;
        chars.push(t);
      }

      const pad = this.charSizeOffset;           //   ≥ 0
      /* ─── 1. shrink the box by the padding  ─── */
      const innerW = this.w - pad * 2;
      const innerH = this.h - pad * 2;

      // If there is only one top char, print over entire cell
      if (chars.length === 1) {
        /* ─── 2. pick a scale that fits the height  ─── */
        const scale = SpriteFont.getScale(this.h - pad*2);

        /* ─── 3. work out the glyph’s real size after scaling  ─── */
        const glyphH = innerH;                     // by construction
        const glyphW = (SpriteFont.CELL_W / SpriteFont.CELL_H) * (this.h - pad*2);         // keep aspect ratio

        // how much empty space remains once the glyph is scaled:
        const spareW  = innerW - glyphW
        // ensure it’s an integer, then half it to centre:
        const offsetX = Math.floor(spareW / 2)

        // final draw coordinate:
        const drawX   = this.x + pad + offsetX
        const drawY   = this.y + pad   // do the same for Y if you need vertical centering

        // DEBUG
        //love.graphics.setColor(1,0,0,1)
        //love.graphics.rectangle("line", drawX, drawY, glyphW, glyphH)

        SpriteFont.print(chars[0].char.valueOf(), drawX, drawY, scale, chars[0].char.charAtIsColor(0) || this.charColor);
      } else {
        // If there are multiple chars print them in order: top left, top right, bottom left, bottom right
        const glyphH = innerH / 2;               // by construction
        const glyphW = SpriteFont.CELL_W / SpriteFont.CELL_H * glyphH;         // keep aspect ratio
        const scale = SpriteFont.getScale(glyphH); // innerH / CELL_H

        const drawX = this.x + pad;
        const drawY = this.y + pad;

        // Top left
        SpriteFont.print(chars[0].char.valueOf(), drawX, drawY, scale, chars[0].char.charAtIsColor(0) || this.charColor);
        // Bottom right
        SpriteFont.print(chars[1].char.valueOf(), drawX + glyphW, drawY + glyphH, scale, chars[1].char.charAtIsColor(0) || this.charColor);

        if (chars.length < 3) return;
        // Top right
        SpriteFont.print(chars[2].char.valueOf(), drawX + glyphW, drawY, scale, chars[2].char.charAtIsColor(0) || this.charColor);
        
        if (chars.length < 4) return;
        // Bottom left
        SpriteFont.print(chars[3].char.valueOf(), drawX, drawY + glyphH, scale, chars[3].char.charAtIsColor(0) || this.charColor);
      }
  }

  draw() {
    // Cell and color
    love.graphics.setColor(this.color.r, this.color.g, this.color.b, this.color.a);
    love.graphics.rectangle("fill", this.x, this.y, this.w, this.h);

    // DEBUG
    //love.graphics.setColor(0,1,0,1)
    //love.graphics.rectangle("line", this.x, this.y, this.w, this.h)

    this.drawLines();
    this.drawChars();
  }
}