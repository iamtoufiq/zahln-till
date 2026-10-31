import { describe, expect, test } from "vitest";

import type { Mensa } from "@/api/mensas/interface";

import { createMensaCache } from "../mensa-cache";

function memoryKv() {
  const map = new Map<string, string>();
  return {
    get: (k: string) => map.get(k),
    set: (k: string, v: string) => void map.set(k, v),
  };
}

const mensas = [{ id: "campus", name: "Mensa Campus", tills: [], menu: [] }] as unknown as Mensa[];

describe("createMensaCache", () => {
  test("the last menu survives a relaunch", () => {
    const kv = memoryKv();
    createMensaCache(kv).save(mensas);
    expect(createMensaCache(kv).read()).toEqual(mensas);
  });

  test("nothing saved reads as no menu", () => {
    expect(createMensaCache(memoryKv()).read()).toBeUndefined();
  });

  test("an unreadable entry reads as no menu instead of crashing the till", () => {
    const kv = memoryKv();
    kv.set("mensas", "{not json");
    expect(createMensaCache(kv).read()).toBeUndefined();
  });
});
