import { Scheduler } from "./Scheduler";

/*──────────────────────────── 1. constants ────────────────────────────*/
const DELAY    = 0.25;   // seconds before repeating starts
const INTERVAL = 0.05;   // seconds between repeats

/*──────────────────────────── 2. state ────────────────────────────────*/
type RepeatState = { delayId?: number; repeatId?: number };
const repeating: Record<string, RepeatState> = {};   // keyed by love-key string

/*──────────────────────────── 3. helpers ──────────────────────────────*/
export function startRepeat(key: string, action: () => void) {
    // always do the first action immediately
    action();

    // remember both timer handles so we can cancel them later
    const state: RepeatState = {};
    repeating[key] = state;

    state.delayId = Scheduler.setTimeout(() => {
        state.repeatId = Scheduler.setInterval(action, INTERVAL);
    }, DELAY);
}

export function stopRepeat(key: string) {
    const state = repeating[key];
    if (!state) return;
    if (state.delayId  !== undefined) Scheduler.clear(state.delayId);
    if (state.repeatId !== undefined) Scheduler.clear(state.repeatId);
    delete repeating[key];
}
