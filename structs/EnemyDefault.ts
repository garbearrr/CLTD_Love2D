import { Enemy } from "./Enemy";

export class EnemyDefault extends Enemy {

    name = "Default Enemy";
    icon = "@";

    constructor(parent: ICell) {
        super(parent);
    }
}