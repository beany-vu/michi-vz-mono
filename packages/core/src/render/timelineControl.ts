// Built-in play/pause + period scrubber for timeline-enabled charts. Follows
// the ChromeRefs pattern: DOM nodes are created once per mount and mutated in
// place on every sync, never rebuilt per render. Styling lives in CORE_CSS
// (.mv-timeline) and derives from currentColor, so light/dark themes just work.
import { htmlEl } from "../dom";
import type { TimelineController, TimelineState } from "../animation/timeline";

export interface TimelineControlRefs {
  root: HTMLDivElement | null;
  button: HTMLButtonElement | null;
  range: HTMLInputElement | null;
  label: HTMLSpanElement | null;
}

export function createTimelineControlRefs(): TimelineControlRefs {
  return { root: null, button: null, range: null, label: null };
}

/**
 * Show/hide the control for this render. `getController` is a live getter (the
 * engine may recreate the controller when the period list changes) so the
 * wired-once event handlers always reach the current one.
 */
export function applyTimelineControl(
  host: HTMLElement,
  refs: TimelineControlRefs,
  getController: () => TimelineController | null,
  show: boolean
): void {
  if (!show) {
    refs.root?.remove();
    refs.root = null;
    refs.button = null;
    refs.range = null;
    refs.label = null;
    return;
  }
  if (!refs.root) {
    const root = htmlEl("div", { class: "mv-timeline" }) as HTMLDivElement;
    const button = htmlEl("button", {
      class: "mv-timeline-toggle",
      type: "button",
      "aria-label": "Play",
    }) as HTMLButtonElement;
    const range = htmlEl("input", {
      class: "mv-timeline-scrubber",
      type: "range",
      min: "0",
      step: "1",
      "aria-label": "Period",
    }) as HTMLInputElement;
    const label = htmlEl("span", { class: "mv-timeline-period" }) as HTMLSpanElement;
    button.addEventListener("click", () => getController()?.toggle());
    range.addEventListener("input", () => {
      const tl = getController();
      if (tl) {
        tl.pause();
        tl.seek(Number(range.value));
      }
    });
    root.appendChild(button);
    root.appendChild(range);
    root.appendChild(label);
    host.appendChild(root);
    refs.root = root;
    refs.button = button;
    refs.range = range;
    refs.label = label;
  }
}

/** Reflect the controller state onto the control (call after every step/toggle). */
export function syncTimelineControl(
  refs: TimelineControlRefs,
  state: TimelineState | null,
  formatPeriod?: ((period: number | string) => string) | null
): void {
  if (!refs.root || !state) return;
  if (refs.range) {
    refs.range.max = String(Math.max(0, state.periods.length - 1));
    refs.range.value = String(state.index);
  }
  if (refs.label) {
    const period = state.periods[state.index];
    refs.label.textContent =
      period === undefined ? "" : formatPeriod ? formatPeriod(period) : String(period);
  }
  if (refs.button) {
    refs.button.textContent = state.playing ? "❚❚" : "▶";
    refs.button.setAttribute("aria-label", state.playing ? "Pause" : "Play");
    refs.button.setAttribute("aria-pressed", state.playing ? "true" : "false");
  }
}
