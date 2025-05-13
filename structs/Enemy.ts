import { Scheduler } from "./Scheduler";

const BLINK_TIME = 0.2; // seconds

export abstract class Enemy implements IBaseEnemy {
    
    parent: ICell; // the cell that contains this enemy
    name = "Unknown";
    icon = "?";
    health = 10;
    attack = 0;
    defense = 0;
    speed = 1;

    readonly id = love.timer.getTime();

    private timeouts: Map<string, number> = new Map();

    constructor(parent: ICell) {
        this.parent = parent;
        this.spawnEnemy(parent);
    }

    public destroy(): void {
        this.parent?.removeEnemy(this);
        for(const timeout of this.timeouts.values()) {
            Scheduler.clear(timeout);
        }
    }

    private spawnEnemy(cell: ICell): void {
        cell.addEnemy(this);
        this.parent = cell;
        this.timeouts.set(
            "move",
            Scheduler.setInterval(() => this.move(), this.speed),
        );
    }

    private move() {
        if (!this.parent) return this.destroy();

        const nextCell = this.parent.getNext();

        if (!nextCell) {
            // TODO: Handle exit
            this.destroy();
            return;
        }

        this.parent.removeEnemy(this);
        this.parent = nextCell;

        // Blink effect
        const tid = Scheduler.setTimeout(() => {
            this.parent.addEnemy(this);
            this.timeouts.delete("blink");
        }, BLINK_TIME);

        this.timeouts.set("blink", tid);
    }
}
