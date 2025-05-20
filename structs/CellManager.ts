import { Cell } from "./Cell";
import { Command } from "./Command";
import { IO_PRIO } from "./Const";
import { Colors } from "./Escape";
import { getFont } from "./FontCache";
import { OutputStack } from "./OutputStack";
import { Scheduler } from "./Scheduler";
import { SetStack } from "./SetStack";
import { StringColor } from "./StringColor";

export namespace CellManager {
    const BASE_H = 60;              // Technically font height | always multiple of 2

    const REL_W = 1920;
    const REL_H = 1080;

    const GAME_WIDTH_PCT = 0.95;        // 95% of the window (game + cmd areas)
    const CMD_OFF_PCT  = 0.65;          // 65% in starts the command area
    const MIN_CMD_AREA_CELL_SIZE = 3;   // The command area will be at least this many cells wide

    const FLASH_INTERVAL_SEC = 2;

    const INPUT_LEN_LIMIT = 35; // max length of the input string
    const IO_TEXT_PAD = 0; // offset for the text in the cell

    // Note: If dx and dy are BOTH manipulated the gen path code will need to be tweeked.
    const DIR = [
        { dx:  0, dy: -2 },   // N
        { dx:  2, dy:  0 },   // E
        //{ dx:  0, dy:  2 },   // S
        { dx: -2, dy:  0 }    // W
    ];
    const MIN_MOVES_AFTER_UP = 3; // min moves after going up

    export let startCell: ICell;
    export let endCell: ICell;
    
    /** Global scale relative to BASE_H (1.0 == BASE_H)           */
    let scale = 1.0;
    let cols = 0;
    let rows = 0;

    const gameGrid = new Map<string, ICell>();
    let outputCell: ICell = new Cell(-10, -10, 0, 0, 0, 0);
    let inputCell: ICell = new Cell(-10, -10, 0, 0, 0, 0);
    let cmdOffsetCol = 0;

    // Actual input for processing
    let input = "";

    let OStack = new OutputStack(0, 0);
    // Max commands saved 30
    let CStack = new SetStack<string>(30); 
    let cidx = -1;


    export function rebuild(W: number, H :number): void {
        // 1. Calculate new height with scale
        const newH = Math.floor(BASE_H * scale);

        // 2. Get a new font with the new height
        const fData = getFont(newH);
        const newW = fData.w;

        // 3. Find how many cells can fit vertically without going over REL_H
        const maxRows = Math.floor(REL_H / newH);

        // 4. Find how many cells can fit horizontally without going over REL_W
        //    with respect to GAME_WIDTH_PCT
        const gamePixLimit = REL_W * GAME_WIDTH_PCT;
        const maxCols = Math.floor(gamePixLimit / newW);

        cols = maxCols;
        rows = maxRows;

        // 5. Calculate the cell scale with respect to the actual window size
        //    relative to REL_W and REL_H
        const hRatio = H / REL_H;
        const wRatio = W / REL_W;
        const cellH = Math.floor(newH * hRatio);
        const cellW = Math.floor(newW * wRatio);

        // 6. Center horizontally & vertically
        const offX = Math.floor((W - (cellW * maxCols)) / 2);
        const offY = Math.floor((H - (cellH * maxRows)) / 2);

        // 7. Calculate the cell that starts the command area
        let cmdOff = Math.floor(maxCols * CMD_OFF_PCT);
        // Check the cmdOff area is at least MIN_CMD_AREA_CELL_SIZE wide
        // If it isn't push it to the left
        if (cmdOff < MIN_CMD_AREA_CELL_SIZE) {
            const diff = MIN_CMD_AREA_CELL_SIZE - cmdOff;
            cmdOff = Math.max(0, cmdOff - diff);
        }

        // 8. Clear and rebuild the game grid
        gameGrid.clear();
        for (let i = 0; i < maxCols; ++i) {
            for (let j = 0; j < maxRows; ++j) {
                const x = offX + (cellW * i);
                const y = offY + (cellH * j);
                const C = new Cell(i, j, cellW, cellH, x, y);
                gameGrid.set(C.key, C);

                // Command area border
                if (i === cmdOff && j > 0 && j < maxRows - 1) {
                    C.pushChar("│", IO_PRIO).markBorder();
                    continue;
                }

                // Command text area
                if (i > cmdOff && j > 0 && j < maxRows - 1 && i < maxCols - 1) {
                    C.immutable = true;
                    C.setCharSizeOffset(IO_TEXT_PAD);
                    continue;
                }

                // Screen borders
                if (i === 0 && j === 0)                    C.pushChar("╔", IO_PRIO).markBorder();
                else if (i === cols - 1 && j === 0)        C.pushChar("╗", IO_PRIO).markBorder();
                else if (i === 0 && j === rows - 1)        C.pushChar("╚", IO_PRIO).markBorder();
                else if (i === cols - 1 && j === rows - 1) C.pushChar("╝", IO_PRIO).markBorder();
                else if (j === 0 || j === rows - 1)        C.pushChar("═", IO_PRIO).markBorder();
                else if (i === 0 || i === cols - 1)        C.pushChar("║", IO_PRIO).markBorder();
            }
        }

        const arrowCell = gameGrid.get(`${cmdOff + 1},${maxRows - 2}`);
        arrowCell?.pushChar(">", IO_PRIO).markCursor();
        
        inputCell = gameGrid.get(`${cmdOff + 2},${maxRows - 2}`) || inputCell;
        outputCell = gameGrid.get(`${cmdOff + 1},${maxRows - 4}`) || outputCell;

        OStack = new OutputStack(maxCols - cmdOff - 2, maxRows - 4);
        cmdOffsetCol = cmdOff;

        generateRandomPath(1); // generate a random path
    }

  /**
   * Carve a single winding corridor between a random start on the bottom edge
   * and a random end on the top edge, with `padding` cells of margin on all sides.
   * If padding=0 the path may touch the very outer wall.
   */
  export function generateRandomPath(padding: number): void {
    const pathPoints: Point[] = [];
  
    // 1) clamp & compute carve‐area bounds
    padding = Math.max(0, padding);
    const minX = padding + 1;
    const maxX = cmdOffsetCol - padding - 1;
    const minY = padding + 1;
    const maxY = rows - padding - 2;
  
    // 2) pick random start on bottom
    let curX = love.math.random(minX, maxX);
    let curY = maxY;
    pathPoints.push({ x: curX, y: curY });
  
    // persistent state
    let lastDir = { dx: 0, dy: 0 };
    let horizMovesRemaining = 0;
  
    // 3) carve until we hit the padding line
    while (curY > minY) {
      // 3a) all valid moves under your basic rules
      let candidates = DIR.filter(d => {
        if (d.dy > 0) return false;                          // no down
        if (d.dy < 0 && lastDir.dy < 0) return false;        // no two ups in a row
        if (d.dx !== 0 && (curX + d.dx < minX || curX + d.dx > maxX)) return false; // oob horiz
        if (lastDir.dx !== 0 && d.dx !== 0 && d.dx + lastDir.dx === 0) return false; // no backtrack
        return true;
      });
  
      // 3b) if we owe horizontal moves, try to do them
      if (horizMovesRemaining > 0) {
        // filter down to horizontal candidates
        const horizCand = candidates.filter(d => d.dx !== 0);
        if (horizCand.length > 0) {
          candidates = horizCand;
        } else {
          // **no** horizontal possible: force one up, reset debt
          const up = DIR.find(d => d.dy < 0);
          if (up) {
            candidates = [up];
            horizMovesRemaining = 0;
          }
        }
      }
  
      // 3c) pick your move
      if (candidates.length === 0) {
        throw "generateRandomPath: no moves left—breaking early.";
        break;
      }
      const d = candidates[love.math.random(0, candidates.length - 1)];
  
      // if this *is* an up move, enqueue your next horizontals
      if (d.dy < 0) horizMovesRemaining = MIN_MOVES_AFTER_UP;
  
      // 3d) carve through the “in‐betweens”
      if (d.dx === 0) {
        // vertical
        const step = Math.sign(d.dy);
        for (let y = curY + step; y !== curY + d.dy + step; y += step) {
          pathPoints.push({ x: curX, y });
        }
      } else {
        // horizontal
        const step = Math.sign(d.dx);
        for (let x = curX + step; x !== curX + d.dx + step; x += step) {
          pathPoints.push({ x, y: curY });
        }
        horizMovesRemaining = Math.max(0, horizMovesRemaining - 1);
      }
  
      // 3e) perform the jump and record it
      curX += d.dx;
      curY += d.dy;
      pathPoints.push({ x: curX, y: curY });
      lastDir = d;
    }
  
    // 4) finally, link cells (skipping outside padding)
    let lastCell: ICell | undefined;
    for (const { x, y } of pathPoints) {
      if (y < minY) continue;
      const cell = gameGrid.get(`${x},${y}`);
      if (!cell) continue;
      cell.setColor(1, 1, 1, 1);
      cell.setCharColor(0, 0, 0, 1);
      cell.immutable = true;
      if (lastCell) {
        lastCell.setNext(cell);
        cell.setLast(lastCell);
      }
      lastCell = cell;
      if (!startCell) startCell = cell;
    }

    endCell = lastCell || startCell;
  }
  

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

    export function initialize(): void {
        const W = love.graphics.getWidth();
        const H = love.graphics.getHeight();

        rebuild(W, H);
    }

    export function draw(): void {
        for (const cell of gameGrid.values()) {
            cell.draw();
        }
    }

    export function resize(w: number, h: number): void {
        rebuild(w, h);
    }

    export function addCharToInput(c: string): void {
        if (input.length >= INPUT_LEN_LIMIT) return;
        input += c;
        renderInputRow();
    }

    function renderInputRow(): void {
        const row   = inputCell.j;
        const start = inputCell.i;
        const end   = cols - 2;
        const width = end - start + 1;
    
        /* clear */
        for (let i = start; i <= end; ++i) {
            gameGrid.get(`${i},${row}`)?.removeAllCharWithPriority(IO_PRIO);
        }
    
        /* slice + repaint */
        const slice = input.slice(-width);
        for (let i = 0; i < slice.length; ++i) {
            gameGrid.get(`${start + i},${row}`)?.pushChar(slice[i], IO_PRIO);
        }
    }
    
    export function removeCharFromInput(count = 1): void {
        if (input.length === 0) return;
        input = input.slice(0, -count);
        renderInputRow();
    }

    export function executeCmd(): void {
        cidx = -1; // reset the command index

        // 1. get the command
        const cmd = input.trim();
        if (cmd === "") return; // nothing to do

        // 2. clear the input area
        removeCharFromInput(input.length);

        // 3. add the command to the output stack
        const output = `>${cmd}`;
        const res = (
            output.length > OStack.getLineSize()
            ? output.slice(0, OStack.getLineSize() - 1) + "→"
            : output
        );

        // Accounting for the color escape sequence (output.length - 2 and OStack.getLineSize() + 1)
        OStack.addLine(new StringColor(res).color(Colors.GRAY));

        // 4. execute the command
        const tokens = cmd.split(" ");
        const command = tokens.shift()!;
        const result = Command.get(command)?.execute(gameGrid, ...tokens);
        OStack.addLine(result ? new StringColor(result) : new StringColor(`Command not found`).color(Colors.RED));

        // 5. reset the input string
        input = "";

        // 6. write the output stack to the output area
        writeStackToOutput();

        // 7. add the command to the command stack
        CStack.push(cmd);
    }

    function writeStackToOutput(): void {
        /* ── geometry ---------------------------------------------------------- */
        const startCol = outputCell.i;
        const endCol   = cols - 2;
        const width    = endCol - startCol + 1;
    
        const firstRow = outputCell.j;   // bottom-most printable line
        const topRow   = 1;              // top border is row 0
    
        /* ── 1. clear the rectangle ------------------------------------------- */
        for (let j = firstRow; j >= topRow; --j)
            for (let i = startCol; i <= endCol; ++i)
                gameGrid.get(`${i},${j}`)?.removeAllCharWithPriority(IO_PRIO);
    
        /* ── 2. paint the stack, newest line at the bottom --------------------- */
        const DEFAULT = { r: 1, g: 1, b: 1, a: 1 };
    
        let row = firstRow;
        const stack = OStack.lines;
    
        for (let k = stack.length - 1; k >= 0 && row >= topRow; --k) {
            const entry = stack[k].toUTF8Array();
            if (stack[k].valueOf() === "\n") { --row; continue; }        // explicit blank line
    
            let col = 0;                                    // column in the grid
    
            /* scan the line byte-by-byte so we can peek ahead */
            for (let i = 0; i < entry.length && col < width; ) {
                const pen = stack[k].charAtIsColor(i) || DEFAULT;
                /* ── printable character ------------------------------------- */
                const cell = gameGrid.get(`${startCol + col},${row}`);
                cell?.pushChar(entry[i], IO_PRIO);
                cell?.setCharColor(pen.r, pen.g, pen.b, pen.a);
    
                ++col;
                ++i;
            }
    
            --row;              // move to the line above
        }

    }

    export function seekCommand(inc = 1) {
        const stack = CStack.size();
        if (stack === 0) return; // nothing to do

        cidx += inc;
        if (cidx < 0) {
            cidx = -1;
            removeCharFromInput(input.length);
            return;
        }
        else if (cidx >= stack) cidx = stack - 1;

        const cmd = CStack.itemAt(cidx);
        if (cmd) {
            removeCharFromInput(input.length);
            for (let i = 0; i < cmd.length; ++i) {
                addCharToInput(cmd[i]);
            }
        }
    }
}
