// CellManager.ts
import { Font } from "love.graphics";
import { Cell }      from "./Cell";
import { getFont }   from "./FontCache";
import { Scheduler } from "./Scheduler";

export namespace CellManager {
/*──────────────────────────── CONFIG ────────────────────────────*/
const BASE_W = 38;                    // DOS VGA aspect
const BASE_H = 68;

const GAME_WIDTH_PCT = 0.62;          // 62 % of the window
const CMD_WIDTH_PCT  = 0.30;          // 30 %
/* remaining 8 % becomes outer margins */

const CMD_COLS_FIXED = 40;            // command pane cell matrix never changes
const CMD_ROWS_FIXED = 25;

const FLASH_INTERVAL_SEC = 2;

/*──────────────────────────── STATE ─────────────────────────────*/
const gameGrid = new Map<string, ICell>();
const cmdGrid  = new Map<string, ICell>();

let rows = CMD_ROWS_FIXED;            // game grid rows (changes on zoom)
let cols = 40;                        // game grid cols (changes on zoom)

let cellW = 0, cellH = 0;             // pixel size of ONE cell
let font!: Font;
let ascent = 0;

let offX = 0, offY = 0;               // outer margins for centring

/*───────────────────── SCALE & LAYOUT HELPERS ───────────────────*/

/** pick the largest integer pixel-scale that lets **both** panes fit */
function chooseScale(winW: number, winH: number): number {
  const sFromHeight = winH / (BASE_H * Math.max(rows, CMD_ROWS_FIXED));

  const gamePixLimit = winW * GAME_WIDTH_PCT;
  const cmdPixLimit  = winW * CMD_WIDTH_PCT;

  const sFromGameWidth = gamePixLimit / (cols * BASE_W);
  const sFromCmdWidth  = cmdPixLimit  / (CMD_COLS_FIXED * BASE_W);

  return Math.floor(
    Math.min(sFromHeight, sFromGameWidth, sFromCmdWidth)
  );
}

/** width in pixels reserved for each pane (never changes after init) */
function panePixelWidths(winW: number) {
  return {
    game: winW * GAME_WIDTH_PCT,
    cmd : winW * CMD_WIDTH_PCT,
  };
}

/*───────────────────────── REBUILD GRIDS ───────────────────────*/
export function rebuild(winW: number, winH: number): void {
  /* 1 ─ pixel scale */
  const scale = Math.max(1, chooseScale(winW, winH));
  cellW = BASE_W * scale;
  cellH = BASE_H * scale;

  /* 2 ─ bitmap font exactly that tall */
  const pixH = Math.max(1, Math.floor(cellH));
  ({ font, ascent } = getFont(pixH));

  /* 3 ─ pixel rects for both panes  */
  const wPct = panePixelWidths(winW);
  const gamePixW = Math.min(wPct.game, cols * cellW);
  const cmdPixW  = Math.min(wPct.cmd , CMD_COLS_FIXED * cellW);

  /* 4 ─ centre horizontally & vertically */
  offX = (winW - (gamePixW + cmdPixW)) / 2;
  offY = (winH - cellH * Math.max(rows, CMD_ROWS_FIXED)) / 2;

  /* 5 ─ (re)build GAME grid */
  gameGrid.clear();
  for (let j = 0; j < rows; ++j) {
    for (let i = 0; i < cols; ++i) {
      /* const c = new Cell(i, j, cellW, cellH, font, ascent);
      gameGrid.set(c.key, c);

      if (i === 0 && j === 0)                    c.setChar("╔").immutable = true;
      else if (i === cols - 1 && j === 0)        c.setChar("╗").immutable = true;
      else if (i === 0 && j === rows - 1)        c.setChar("╚").immutable = true;
      else if (i === cols - 1 && j === rows - 1) c.setChar("╝").immutable = true;
      else if (j === 0 || j === rows - 1)        c.setChar("═").immutable = true;
      else if (i === 0 || i === cols - 1)        c.setChar("║").immutable = true; */
    }
  }

  /* 6 ─ (re)build COMMAND pane   — starts exactly one cell right of game */
  cmdGrid.clear();
  const cmdI0 = cols;
  for (let j = 0; j < CMD_ROWS_FIXED; ++j) {
    /* for (let i = 0; i < CMD_COLS_FIXED; ++i) {
      const c = new Cell(cmdI0 + i, j, cellW, cellH, font, ascent);
      cmdGrid.set(c.key, c);

      if (i === 0 && j === 0)                                c.setChar("╔").immutable = true;
      else if (i === CMD_COLS_FIXED - 1 && j === 0)          c.setChar("╗").immutable = true;
      else if (i === 0 && j === CMD_ROWS_FIXED - 1)          c.setChar("╚").immutable = true;
      else if (i === CMD_COLS_FIXED - 1 && j === CMD_ROWS_FIXED - 1)
                                                             c.setChar("╝").immutable = true;
      else if (j === 0 || j === CMD_ROWS_FIXED - 1)          c.setChar("═").immutable = true;
      else if (i === 0 || i === CMD_COLS_FIXED - 1)          c.setChar("║").immutable = true;
    } */
  }

  love.window.setTitle(
    `Game ${cols}×${rows} | Cmd ${CMD_COLS_FIXED}×${CMD_ROWS_FIXED} | cell ${cellW}×${cellH}`
  );
}

/*────────────────── FLASH ANIMATION (unchanged) ─────────────────*/
export function flashAll(lifetime: number): void {
  const order: ICell[] = [];
  for (let d = 0; d < cols + rows - 1; ++d)
    for (let i = 0; i <= d; ++i) {
      const j = d - i;
      if (i < cols && j < rows) {
        const c = gameGrid.get(`${i},${j}`);
        if (c && !c.immutable) order.push(c);
      }
    }

  const step = FLASH_INTERVAL_SEC / order.length;
  order.forEach((c, idx) => {
    const t = idx * step;
    Scheduler.setTimeout(() => c.setColor(1, 1, 1, 1), t);
    Scheduler.setTimeout(() => c.setColor(0, 0, 0, 1), t + lifetime);
  });
}

/*──────────────────────── PUBLIC API ───────────────────────────*/
export function initialize(): void {
  /* guarantee the very first scale & column count fit */
  const winW = love.graphics.getWidth();
  const winH = love.graphics.getHeight();

  /* pick an initial column count that fills nearly the full width-quota */
  const scale0 = Math.floor(winH / (BASE_H * rows));
  cellW        = BASE_W * scale0;
  const gamePixLimit = winW * GAME_WIDTH_PCT;
  cols = Math.max(1, Math.floor(gamePixLimit / cellW));

  rebuild(winW, winH);
}

export function draw(): void {
  love.graphics.push();
  love.graphics.translate(offX, offY);

  for (const c of gameGrid.values()) c.draw();
  for (const c of cmdGrid.values())  c.draw();

  love.graphics.pop();
}

export function addZoom(step: number): void {
  if (step > 0) { rows += 1; cols += 1; }
  else if (step < 0 && rows > 1 && cols > 1) { rows -= 1; cols -= 1; }

  rebuild(love.graphics.getWidth(), love.graphics.getHeight());
}

export function resize(w: number, h: number): void {
  rebuild(w, h);
}
}
