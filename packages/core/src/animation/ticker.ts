// Frame clock abstraction shared by every animation driver in core.
// Injectable so tests can advance time deterministically (createManualTicker)
// while production code rides requestAnimationFrame (defaultTicker).

export interface Ticker {
  /** Schedule cb(now) for the next frame; returns a cancel handle. */
  request(cb: (now: number) => void): number;
  cancel(id: number): void;
  now(): number;
}

/** Real rAF/performance.now ticker; falls back to setTimeout/Date.now in
 *  non-DOM environments so importing core never throws during SSR/tests. */
export function defaultTicker(): Ticker {
  const hasRaf =
    typeof requestAnimationFrame === "function" && typeof cancelAnimationFrame === "function";
  const hasPerf = typeof performance !== "undefined" && typeof performance.now === "function";
  if (hasRaf) {
    return {
      request: (cb) => requestAnimationFrame(cb),
      cancel: (id) => cancelAnimationFrame(id),
      now: () => (hasPerf ? performance.now() : Date.now()),
    };
  }
  return {
    request: (cb) =>
      setTimeout(() => cb(hasPerf ? performance.now() : Date.now()), 16) as unknown as number,
    cancel: (id) => clearTimeout(id as unknown as ReturnType<typeof setTimeout>),
    now: () => (hasPerf ? performance.now() : Date.now()),
  };
}

export interface ManualTicker extends Ticker {
  /** Advance the clock by ms and synchronously fire callbacks scheduled
   *  before this tick. Callbacks re-requested during the flush wait for
   *  the next tick, matching rAF semantics. */
  tick(ms: number): void;
}

export function createManualTicker(): ManualTicker {
  let time = 0;
  let nextId = 1;
  let queue: Array<{ id: number; cb: (now: number) => void }> = [];
  return {
    request(cb) {
      const id = nextId++;
      queue.push({ id, cb });
      return id;
    },
    cancel(id) {
      queue = queue.filter((entry) => entry.id !== id);
    },
    now: () => time,
    tick(ms) {
      time += ms;
      const due = queue;
      queue = [];
      for (const entry of due) entry.cb(time);
    },
  };
}
