/* import { Shader, Canvas } from "love.graphics";
import { Scheduler } from "./Scheduler";
import { scanlines, warpFrag } from "shaders/crt";
import { Cell } from "./Cell";
import { PathGen } from "./PathGenerator";
import { Text } from "./Text";

export namespace CellManager {
  const SCALE_FACTOR = 1;
  const FONT_HEIGHT_DIVISOR = 20; // screenH / FONT_HEIGHT_DIVISOR => base font sizing
  const FLASH_INTERVAL_SEC = 2;
  const LINE_PLACEMENT_RATIO = 0.65;

  const BORDER_MARGIN_RATIO = 1 / 3; // cellW/3, cellH/3
  const BORDER_RADIUS_RATIO = 0.5; // cellH * BORDER_RADIUS_RATIO
  const BORDER_LINE_WIDTH_RATIO = 0.5; // cellH * BORDER_LINE_WIDTH_RATIO

  const WALL_LINE_WIDTH_RATIO = 0.1; // cellH * WALL_LINE_WIDTH_RATIO

  const DIVIDER_LINE_THICKNESS_RATIO = 0.5; // cellH/2

  const WARP_CURVATURE: [number, number] = [0.15, 0.15];
  const WARP_BLUR_AMOUNT = 0;

  const MAZE_RIVER = 0.8; // river parameter for maze generation

  // grid state
  const cells = new Map<XCommaY, Cell>();
  let cols: number, rows: number, cellW: number, cellH: number;
  let compositeCanvas: Canvas, warpCanvas: Canvas;
  let crtShader: Shader, warpShader: Shader;

  let dividerCol: number;

  export function rebuildGrid(screenW: number, screenH: number) {
    // recreate render targets
    compositeCanvas = love.graphics.newCanvas(screenW, screenH);
    warpCanvas = love.graphics.newCanvas(screenW, screenH);

    // choose font size based on new height
    const approxFontSize = Math.floor(
      (screenH / FONT_HEIGHT_DIVISOR) * SCALE_FACTOR
    );
    const font = love.graphics.newFont(Text.FONT_PATH, approxFontSize);
    love.graphics.setFont(font);

    // measure glyph and compute base cell size
    const glyphW = font.getWidth("M");
    const glyphH = font.getHeight();
    const baseW = glyphW * SCALE_FACTOR;
    const baseH = glyphH * SCALE_FACTOR;

    // compute number of cells
    cols = Math.max(1, Math.floor(screenW / baseW));
    rows = Math.max(1, Math.floor(screenH / baseH));
    cellW = screenW / cols;
    cellH = screenH / rows;

    // rebuild map of cells
    cells.clear();
    dividerCol = Math.floor(LINE_PLACEMENT_RATIO * cols);
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const c = new Cell(i, j, cellW, cellH);
        // mark border or divider cells immutable
        if (
          i === 0 ||
          j === 0 ||
          i === cols - 1 ||
          j === rows - 1 ||
          i >= dividerCol
        ) {
          c.immutable = true;
        }
        cells.set(c.key, c);
      }
    }
  }

  /**
   * Generates a non‐overlapping random path from the bottom (row = rows-2)
   * to the top (row = 1), confined to columns [1 … dividerCol-1].  Builds
   * `wallLines` as the mid‐cell segments that surround the path.
   * @returns The root of the path
   
  export function generateRandomPath(): ICell | undefined {
    // clear any previous path marks & next-links
    for (const c of cells.values()) {
      c.clearNext();
      c.clearLast();
      c.clearWalls();
    }

    // 1. carve in a region inset by 1 cell on every side
    const pad = 1;
    const leftCols = (dividerCol - pad) - pad;  // = dividerCol - 2
    const leftRows = (rows - pad) - pad;        // = rows - 2

    // 2. Gen random leftCols x leftRows path with a river parameter
    const path = PathGen.generateMaze(leftCols, leftRows, MAZE_RIVER);
    
    if (path.solution.length < 1) return;
    const root = cells.get(`${path.solution[0].x+1},${path.solution[0].y+1}`);
    root?.setWalls({ top: true, left: true, right: true, bottom: true }); // mark the entrance cell

    // 3. Mark the path cells and walls
    for (let i = 1; i < path.solution.length; i++) {
      const prevPt = path.solution[i - 1];
      const curPt = path.solution[i];

      const last = cells.get(`${prevPt.x + 1},${prevPt.y + 1}`);
      const cur = cells.get(`${curPt.x + 1},${curPt.y + 1}`);

      last?.setNext(cur || null);
      cur?.setLast(last || null);

      // Set all current's walls except for the incoming one
      cur?.setWalls({ top: true, left: true, right: true, bottom: true });
      // Check which wall to remove
      if (prevPt.x < curPt.x) {
        last?.setWalls({ right: false });
        cur?.setWalls({ left: false });
      } else if (prevPt.x > curPt.x) {
        last?.setWalls({ left: false });
        cur?.setWalls({ right: false });
      } else if (prevPt.y < curPt.y) {
        last?.setWalls({ bottom: false });
        cur?.setWalls({ top: false });
      } else if (prevPt.y > curPt.y) {
        last?.setWalls({ top: false });
        cur?.setWalls({ bottom: false });
      }
    }

    return root;
  }

  // Initialize grid and shaders
  export function initialize(): void {
    crtShader = love.graphics.newShader(scanlines);
    warpShader = love.graphics.newShader(warpFrag);

    // send warp parameters
    warpShader.send("curvature", WARP_CURVATURE);
    warpShader.send("blurAmount", WARP_BLUR_AMOUNT);

    rebuildGrid(love.graphics.getWidth(), love.graphics.getHeight());

    // hook resize
    love.resize = (w: number, h: number) => rebuildGrid(w, h);
  }

  export function update(dt: number): void {
    Scheduler.update(dt);
  }

  export function draw(): void {
    const lg = love.graphics;

    // 1) Composite pass: draw cells + border + divider
    lg.setCanvas(compositeCanvas);
    lg.clear();
    for (const c of cells.values()) c.draw();

    // draw border
    lg.setColor(1, 1, 1, 1);
    lg.setLineWidth(cellH * BORDER_LINE_WIDTH_RATIO);
    lg.rectangle(
      "line",
      cellW * BORDER_MARGIN_RATIO,
      cellH * BORDER_MARGIN_RATIO,
      lg.getWidth() - 2 * (cellW * BORDER_MARGIN_RATIO),
      lg.getHeight() - 2 * (cellH * BORDER_MARGIN_RATIO),
      cellH * BORDER_RADIUS_RATIO,
      cellH * BORDER_RADIUS_RATIO
    );

    // draw divider
    lg.line(
      lg.getWidth() * LINE_PLACEMENT_RATIO,
      cellH * DIVIDER_LINE_THICKNESS_RATIO,
      lg.getWidth() * LINE_PLACEMENT_RATIO,
      lg.getHeight() - cellH * DIVIDER_LINE_THICKNESS_RATIO
    );
    lg.setCanvas();

    // 2) Warp pass
    //lg.setShader(warpShader);
    //lg.setCanvas(warpCanvas);
    lg.clear();
    lg.draw(
      compositeCanvas,
      0,
      0,
      0,
      lg.getWidth() / compositeCanvas.getWidth(),
      lg.getHeight() / compositeCanvas.getHeight()
    );
    lg.setShader();
    lg.setCanvas();

    // 3) CRT pass
    //lg.setShader(crtShader);
    lg.draw(
      warpCanvas,
      0,
      0,
      0,
      lg.getWidth() / warpCanvas.getWidth(),
      lg.getHeight() / warpCanvas.getHeight()
    );
    lg.setShader();
  }

  export function flashAll(lifetimeSec: number): void {
    const order: Cell[] = [];
    for (let d = 0; d < cols + rows - 1; d++) {
      for (let i = 0; i <= d; i++) {
        const j = d - i;
        if (i < cols && j < rows) {
          const c = cells.get(`${i},${j}`);
          if (c && !c.immutable) order.push(c);
        }
      }
    }
    const step = FLASH_INTERVAL_SEC / order.length;
    order.forEach((cell, idx) => {
      const start = idx * step;
      Scheduler.setTimeout(() => cell.setColor(1, 1, 1, 1), start);
      Scheduler.setTimeout(
        () => cell.setColor(0, 0, 0, 1),
        start + lifetimeSec
      );
    });
  }

  export function getCell(i: number, j: number) {
    return cells.get(`${i},${j}`);
  }
}
 */