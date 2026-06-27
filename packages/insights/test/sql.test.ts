import { describe, it, expect } from "vitest";
import { aggregate, type Row } from "../src/sql";

const rows: Row[] = [
  { region: "EU", sales: 10 },
  { region: "EU", sales: 20 },
  { region: "US", sales: 5 },
];

describe("sql aggregate (pure fallback)", () => {
  it("group-by sum", () => {
    const out = aggregate(rows, { groupBy: "region", measures: { total: { col: "sales", fn: "sum" } } });
    expect(out.find((r) => r.region === "EU")!.total).toBe(30);
    expect(out.find((r) => r.region === "US")!.total).toBe(5);
  });

  it("count + avg with orderBy desc + limit", () => {
    const out = aggregate(rows, {
      groupBy: "region",
      measures: { n: { col: "sales", fn: "count" }, avg: { col: "sales", fn: "avg" } },
      orderBy: { key: "avg", dir: "desc" },
      limit: 1,
    });
    expect(out).toHaveLength(1);
    expect(out[0].region).toBe("EU"); // EU avg 15 > US avg 5
    expect(out[0].n).toBe(2);
    expect(out[0].avg).toBe(15);
  });

  it("where filter (no groupBy → single aggregate row)", () => {
    const out = aggregate(rows, {
      where: (r) => Number(r.sales) >= 10,
      measures: { total: { col: "sales", fn: "sum" }, mx: { col: "sales", fn: "max" } },
    });
    expect(out).toHaveLength(1);
    expect(out[0].total).toBe(30);
    expect(out[0].mx).toBe(20);
  });
});
