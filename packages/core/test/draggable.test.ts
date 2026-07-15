import { describe, it, expect, vi, afterEach } from "vitest";
import { makeSvgGroupDraggable } from "../src/render/svg/draggable";

// makeSvgGroupDraggable attaches document-level pointermove/pointerup listeners on
// pointerdown and removes them on pointerup. The leak: if the chart is destroyed or
// re-rendered mid-drag, those document listeners (capturing the now-detached group)
// stay attached forever. The fix returns a dispose() that detaches them. These tests
// lock BOTH the drag feature (must not break) and the no-leak contract.

const SVGNS = "http://www.w3.org/2000/svg";

function makeGroup(): SVGGElement {
  const svg = document.createElementNS(SVGNS, "svg");
  const g = document.createElementNS(SVGNS, "g");
  svg.appendChild(g);
  document.body.appendChild(svg);
  return g;
}

// Count the document pointer listeners the draggable adds/removes (call-through spy),
// filtered to the two event types it uses so unrelated listeners do not pollute counts.
function spyDocPointer() {
  const add = vi.spyOn(document, "addEventListener");
  const rm = vi.spyOn(document, "removeEventListener");
  const isPointer = (c: unknown[]): boolean => c[0] === "pointermove" || c[0] === "pointerup";
  return {
    added: (): number => add.mock.calls.filter(isPointer).length,
    removed: (): number => rm.mock.calls.filter(isPointer).length,
    restore: (): void => {
      add.mockRestore();
      rm.mockRestore();
    },
  };
}

const down = (el: Element, x = 10, y = 10): boolean =>
  el.dispatchEvent(new MouseEvent("pointerdown", { clientX: x, clientY: y, bubbles: true }));
const move = (x: number, y: number): boolean =>
  document.dispatchEvent(new MouseEvent("pointermove", { clientX: x, clientY: y }));
const up = (): boolean => document.dispatchEvent(new MouseEvent("pointerup", {}));

afterEach(() => {
  up(); // end any drag left dangling by a failing test, so listeners do not bleed across tests
  document.body.innerHTML = "";
});

describe("makeSvgGroupDraggable", () => {
  it("applies the initial offset and sets a grab cursor", () => {
    const g = makeGroup();
    makeSvgGroupDraggable(g, { offset: { x: 12, y: 34 }, onMove: () => {} });
    expect(g.style.transform).toBe("translate(12px, 34px)");
    expect(g.style.cursor).toBe("grab");
  });

  it("returns a dispose function", () => {
    const g = makeGroup();
    const dispose = makeSvgGroupDraggable(g, { offset: { x: 0, y: 0 }, onMove: () => {} });
    expect(typeof dispose).toBe("function");
  });

  it("drags: pointermove updates the transform, pointerup reports the new offset", () => {
    const g = makeGroup();
    let moved: { x: number; y: number } | null = null;
    const states: boolean[] = [];
    makeSvgGroupDraggable(g, {
      offset: { x: 0, y: 0 },
      onMove: (o) => {
        moved = o;
      },
      onDragStateChange: (d) => {
        states.push(d);
      },
    });
    down(g, 100, 100);
    expect(states).toEqual([true]);
    move(130, 150); // +30, +50
    expect(g.style.transform).toBe("translate(30px, 50px)");
    expect(g.style.cursor).toBe("grabbing");
    up();
    expect(states).toEqual([true, false]);
    expect(moved).toEqual({ x: 30, y: 50 });
    expect(g.style.cursor).toBe("grab");
  });

  it("a completed drag (down then up) leaves NO document pointer listeners attached", () => {
    const g = makeGroup();
    const spy = spyDocPointer();
    makeSvgGroupDraggable(g, { offset: { x: 0, y: 0 }, onMove: () => {} });
    down(g);
    expect(spy.added()).toBe(2); // pointermove + pointerup
    up();
    expect(spy.removed()).toBe(2); // both removed
    spy.restore();
  });

  it("ignores a stray pointermove when no drag is in progress", () => {
    const g = makeGroup();
    makeSvgGroupDraggable(g, { offset: { x: 5, y: 5 }, onMove: () => {} });
    move(200, 200);
    expect(g.style.transform).toBe("translate(5px, 5px)"); // unchanged
  });

  // ---- the leak + its fix ----

  it("dispose() mid-drag removes the document pointer listeners (no leak)", () => {
    const g = makeGroup();
    const spy = spyDocPointer();
    const dispose = makeSvgGroupDraggable(g, { offset: { x: 0, y: 0 }, onMove: () => {} });
    down(g); // drag in progress -> document listeners attached
    expect(spy.added()).toBe(2);
    dispose();
    expect(spy.removed()).toBe(2); // dispose detached them
    spy.restore();
  });

  it("after dispose() mid-drag, a stray document pointermove no longer moves the group", () => {
    const g = makeGroup();
    const dispose = makeSvgGroupDraggable(g, { offset: { x: 0, y: 0 }, onMove: () => {} });
    down(g, 0, 0);
    dispose();
    const frozen = g.style.transform;
    move(999, 999); // a leaked listener would re-apply a transform here
    expect(g.style.transform).toBe(frozen);
  });

  it("dispose() is idempotent and safe when never dragged", () => {
    const g = makeGroup();
    const dispose = makeSvgGroupDraggable(g, { offset: { x: 0, y: 0 }, onMove: () => {} });
    expect(() => {
      dispose();
      dispose();
    }).not.toThrow();
  });

  it("after dispose(), a fresh pointerdown does not start a drag", () => {
    const g = makeGroup();
    const spy = spyDocPointer();
    const dispose = makeSvgGroupDraggable(g, { offset: { x: 0, y: 0 }, onMove: () => {} });
    dispose();
    down(g);
    expect(spy.added()).toBe(0); // group pointerdown listener removed by dispose
    spy.restore();
  });
});
