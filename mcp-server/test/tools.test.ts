import { describe, it, expect } from "vitest";
import { OPERATIONS, ALIASES, buildRequest } from "../src/tools.js";

const op = (name: string) => OPERATIONS.find((o) => o.name === name)!;

describe("buildRequest", () => {
  it("puts GET args in the query string", () => {
    expect(buildRequest(op("get_creature_status"), { id: "abc" })).toEqual({
      method: "GET", path: "/api/house/status", query: { id: "abc" }, auth: true,
    });
  });

  it("puts POST and DELETE args in the body", () => {
    expect(buildRequest(op("care_for_creature"), { action: "feed" })).toMatchObject({ method: "POST", body: { action: "feed" } });
    expect(buildRequest(op("release_creature"), { creature_id: "c1" })).toMatchObject({ method: "DELETE", body: { creature_id: "c1" } });
  });

  it("fills path params and removes them from the query", () => {
    expect(buildRequest(op("get_species", ), { slug: "sky whale" })).toEqual({
      method: "GET", path: "/api/house/species/sky%20whale", query: {}, auth: false,
    });
  });

  it("does not send a key to public endpoints", () => {
    for (const name of ["list_species", "list_graveyard", "list_hall", "get_house_stats", "register_agent"]) {
      expect(op(name).auth).toBe(false);
    }
  });
});

describe("OPERATIONS", () => {
  it("has unique names, and aliases point at real operations", () => {
    const names = OPERATIONS.map((o) => o.name);
    expect(new Set(names).size).toBe(names.length);
    for (const target of Object.values(ALIASES)) expect(names).toContain(target);
  });

  it("marks reads read-only and release destructive", () => {
    for (const o of OPERATIONS) {
      if (o.method === "GET") expect(o.annotations.readOnlyHint).toBe(true);
      else expect(o.annotations.readOnlyHint).toBe(false);
    }
    expect(op("release_creature").annotations.destructiveHint).toBe(true);
    expect(op("get_creature_status").annotations.idempotentHint).toBe(false);
  });

  it("describes each tool by the endpoint it wraps", () => {
    for (const o of OPERATIONS) expect(o.description.startsWith(`Wraps ${o.method} ${o.path}.`)).toBe(true);
  });

  it("never mentions crypto", () => {
    const text = JSON.stringify(OPERATIONS.map((o) => o.description));
    expect(text).not.toMatch(/x402|usdc|crypto/i);
  });
});
