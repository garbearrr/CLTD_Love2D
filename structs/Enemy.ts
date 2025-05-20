import { Scheduler } from "./Scheduler";
import { StringColor } from "./StringColor";

const BLINK_TIME = 0.1; // seconds

export abstract class Enemy implements IBaseEnemy {
    
    parent: ICell; // the cell that contains this enemy
    name = "Unknown";
    icon: IStringColor = new StringColor("?");
    health = 10;
    attack = 0;
    defense = 0;
    speed = 1;
    sColor = { r: 0, g: 0, b: 0, a: 1 };
    eColor = { r: 1, g: 0, b: 0, a: 1 };

    readonly id = love.timer.getTime();
    readonly startingHealth = this.health;

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

        this.timeouts.clear();
        this.parent = null as any;
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
            this.parent?.addEnemy(this);
            this.timeouts.delete("blink");
        }, BLINK_TIME);

        this.timeouts.set("blink", tid);
    }

    public damage(amount: number): void {
        this.health -= amount;
        this.icon.reset().color(this.resolveColor());
        if (this.health <= 0) {
            this.onKill();
            this.destroy();
        }
    }

    private resolveColor(): Color {
        // Interpolate between start and end color based on health
        const ratio = this.health / this.startingHealth;
        return {
            r: this.sColor.r * ratio + this.eColor.r * (1 - ratio),
            g: this.sColor.g * ratio + this.eColor.g * (1 - ratio),
            b: this.sColor.b * ratio + this.eColor.b * (1 - ratio),
            a: 1,
        };
    }

    private onKill(): void {}
}


export class EnemyDefault extends Enemy {
    name = "Default Enemy";
    icon = new StringColor("@");
    speed = 0.2;

    constructor(parent: ICell) {
        super(parent);
    }
}