import { COORD_PRIO } from "./Const";
import { Scheduler } from "./Scheduler";

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
    private readonly FLASH_INTERVAL_SEC = 2;

    constructor() { super("flash"); }
    execute(cells: Map<string, ICell>, ...args: string[]): string {
        const lifetime = args.length > 0 ? Math.max(0, parseFloat(args[0])) : 1.5;

        /* 1. find the grid extents so we can traverse diagonally */
        let maxI = 0, maxJ = 0;
        cells.forEach(c => { if (c.i > maxI) maxI = c.i; if (c.j > maxJ) maxJ = c.j; });
        const cols = maxI + 1;
        const rows = maxJ + 1;

        /* 2. collect cells in diagonal order (south-west → north-east) */
        const order: ICell[] = [];
        for (let d = 0; d < cols + rows - 1; ++d) {
            for (let i = 0; i <= d; ++i) {
                const j = d - i;
                const cell = cells.get(`${i},${j}` as XCommaY);
                if (cell && !cell.immutable) order.push(cell);
            }
        }

        if (order.length === 0) return "";             // nothing to flash

        /* 3. schedule colour swaps with a small phase shift */
        const step = this.FLASH_INTERVAL_SEC / order.length;
        order.forEach((c, idx) => {
            const t = idx * step;
            Scheduler.setTimeout(() => c.pushChar(c.i+"", COORD_PRIO).pushChar(c.j+"", COORD_PRIO), t);          // on
            Scheduler.setTimeout(() => c.removeAllCharWithPriority(COORD_PRIO), t + lifetime); // off
        });

        return "Flashing Cell Coords";     // command produces no textual output
    }
}

Command.register(new Flash());
