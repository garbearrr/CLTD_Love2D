import { ALPHA, COORD_PRIO } from "./Const";
import { Scheduler } from "./Scheduler";
import { StringColor } from "./StringColor";

export abstract class Command {
    private static readonly registry = new Map<string, Command>();

    private readonly showInHelp = true;

    protected constructor(public readonly name: string) {}

    /** Register a singleton instance */
    static register(cmd: Command): void {
        this.registry.set(cmd.name, cmd);
    }

    /** Retrieve by name */
    static get(name: string): Command | undefined {
        return this.registry.get(name);
    }

    abstract execute(cells: Map<string, ICell>, ...args: string[]): string;
}

class Echo extends Command {
    constructor() { super("echo"); }
    execute(_cells: Map<string, ICell>, ...args: string[]): string { return args.join(" "); }
}

Command.register(new Echo());

class Flash extends Command {
    // How long to flash the entire screen
    private readonly FLASH_INTERVAL_SEC = 5;
  
    constructor() { super("flash"); }
    execute(cells: Map<string, ICell>, ..._args: string[]): string {
      // 1. find extents
      let maxI = 0, maxJ = 0;
      cells.forEach(c => { if (c.i > maxI) maxI = c.i; if (c.j > maxJ) maxJ = c.j; });
      const cols = maxI + 1;
      const rows = maxJ + 1;
  
      // 2. build row-major order
      const order: ICell[] = [];
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const cell = cells.get(`${x},${y}` as XCommaY);
          if (cell && !cell.immutable) order.push(cell);
        }
      }
      if (order.length === 0) return "";
  
      // 3. schedule
      const step       = this.FLASH_INTERVAL_SEC / order.length;
      const lifetime   = step * cols;              // time until the cell below lights
      const fadeSteps  = 10;                       // ← change this for smoother/quicker fades
      const fadeInterval = lifetime / fadeSteps;
      const minAlpha    = 0.5; 
      const delta        = 1 - minAlpha;       // how much we actually fade

        order.forEach((c, idx) => {
            const tOn  = idx * step;
            const tOff = tOn + lifetime + fadeInterval;
            const xkey = new StringColor(c.i >= 10 ? ALPHA[c.i - 10] : "" + c.i);
            const ykey = new StringColor(c.j >= 10 ? ALPHA[c.j - 10] : "" + c.j);
          
            // 1) Light this cell
            Scheduler.setTimeout(() => {
              c.pushCharSC(xkey, COORD_PRIO)
               .pushCharSC(ykey, COORD_PRIO);
            }, tOn);
          
            // 2) Fade out over `fadeSteps` notches
            for (let s = 1; s <= fadeSteps; s++) {
                Scheduler.setTimeout(() => {
                  // step linearly from 1 → minAlpha
                  const alpha = 1 - (s / fadeSteps) * delta;
                  xkey.reset().color({ r: 1, g: 1, b: 1, a: alpha });
                  ykey.reset().color({ r: 1, g: 1, b: 1, a: alpha });
                  // re-draw them so the new alpha actually sticks
                  c.removeAllCharWithPriority(COORD_PRIO)
                  c.pushCharSC(xkey, COORD_PRIO)
                  c.pushCharSC(ykey, COORD_PRIO);
                }, tOn + s * fadeInterval);
              }              
          
            // 3) Finally pop it off exactly when the one below lights
            Scheduler.setTimeout(() => {
              c.removeAllCharWithPriority(COORD_PRIO);
            }, tOff);
          });
  
      return "Flashing X,Y";
    }
  }
  
  

Command.register(new Flash());
