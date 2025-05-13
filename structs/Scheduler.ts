// scheduler.ts
export namespace Scheduler {
  // ────────────────────────────────────────────────────────────────────────────
  // Internal bookkeeping
  // ────────────────────────────────────────────────────────────────────────────
  let nextId = 0;

  type Entry = {
    id: number; // handle returned to the caller
    remaining: number; // time left (seconds) until the next fire
    callback: () => void; // user-supplied function
    interval?: number; // present ⇒ this is a repeating timer
  };

  const entries: Entry[] = [];

  // ────────────────────────────────────────────────────────────────────────────
  // Public API – mirrors the browser API
  // ────────────────────────────────────────────────────────────────────────────
  /** One-shot timer (same call pattern as window.setTimeout). */
  export function setTimeout(cb: () => void, delay: number): number {
    const id = nextId++;
    entries.push({ id, remaining: delay, callback: cb });
    return id;
  }

  /** Repeating timer (same call pattern as window.setInterval). */
  export function setInterval(cb: () => void, interval: number): number {
    const id = nextId++;
    entries.push({ id, remaining: interval, callback: cb, interval });
    return id;
  }

  /** Cancels a timer created by setTimeout or setInterval. */
  export function clear(id: number) {
    const idx = entries.findIndex((e) => e.id === id);
    if (idx !== -1) entries.splice(idx, 1);
  }

  // Friendly aliases
  export const clearTimeout = clear;
  export const clearInterval = clear;

  // ────────────────────────────────────────────────────────────────────────────
  // Advance all timers – hook this into Love2D’s update loop once
  // ────────────────────────────────────────────────────────────────────────────
  export function update(dt: number) {
    for (let i = entries.length - 1; i >= 0; --i) {
      const e = entries[i];
      e.remaining -= dt;

      if (e.remaining <= 0) {
        e.callback();

        if (e.interval !== undefined) {
          // Keep the timer alive – carry over any “overshoot” to avoid drift
          e.remaining += e.interval;
        } else {
          // One-shot timer is done
          entries.splice(i, 1);
        }
      }
    }
  }
}
