
import { CellManager } from "structs/CellManager";
import { EnemyDefault } from "structs/Enemy";
import { startRepeat, stopRepeat } from "structs/KeyRepeater";
import { Scheduler } from "structs/Scheduler";
import { SpriteFont } from "structs/SpriteFont";
import { Util } from "structs/Util";

//
// 1) Configure LÖVE before anything else
//
love.conf = (t) => {
    t.console = true; // enable debug console
    t.window.title = "CLTD";
    t.window.resizable = true;
    t.window.minwidth = 400;
    t.window.minheight = 300;
    t.window.vsync = 0;
};

//
// 2) On load: set font, window size & initialize CellManager
//
love.load = () => {
    // set a DOS-style bitmap font from your assets
    // love.graphics.setFont(DOS_FONT);

    // initial window size (can still be resized at runtime)
    love.window.setMode(800, 600, {
        resizable: true
    });

    // build your grid now that font & window are ready
    CellManager.initialize();
    SpriteFont.initialize();

    new EnemyDefault(CellManager.startCell);
};

//
// 3) Every frame, update timers & cells
//
love.update = (dt: number) => {
    Scheduler.update(dt);
};

//
// 4) Every frame, draw the cells (and divider line, etc.)
//
love.draw = () => {
    CellManager.draw();
};

//
// 5) Input: press Space or “f” to flash the board
//
love.keypressed = (key: string) => {

    /* BACKSPACE handling ----------------------------------------------------*/
    if (key === "backspace") {
        startRepeat(key, () => CellManager.removeCharFromInput());
        return;
    }

    if (key === "up") {
        startRepeat(key, () => CellManager.seekCommand(1));
        return;
    }
    if (key === "down") {
        startRepeat(key, () => CellManager.seekCommand(-1));
        return;
    }

    if (key === "return")            { CellManager.executeCmd();            return; }
    if (key === "`")                 { CellManager.flashAll(0.5);           return; }
    if (key === "space")             { CellManager.addCharToInput(" ");     return; }
    if (Util.String.isAlnum(key))    { CellManager.addCharToInput(key);     return; }
};

/* stop repeating as soon as the key is released -----------------------------*/
love.keyreleased = (key: string) => {
    stopRepeat(key);
};

love.resize = (w: number, h: number) => {
    CellManager.rebuild(w, h);
}