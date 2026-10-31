import { describe, expect, test } from "vitest";

import type { MenuItem } from "@/api/orders/interface";

import { addItem, cartTotals, removeItem, toOrderLines } from "../cart";

const menu = [
  { id: "pasta", prices: { student: 220, staff: 380, guest: 490 } },
  { id: "salad", prices: { student: 150, staff: 250, guest: 320 } },
] as MenuItem[];

describe("cart", () => {
  test("adding an item twice counts two", () => {
    expect(addItem(addItem({}, "pasta"), "pasta")).toEqual({ pasta: 2 });
  });

  test("addItem caps a line at 20", () => {
    let cart = {};
    for (let i = 0; i < 25; i++) cart = addItem(cart, "pasta");
    expect(cart).toEqual({ pasta: 20 });
  });

  test("addItem refuses a 21st line", () => {
    let cart: Record<string, number> = {};
    for (let i = 0; i < 20; i++) cart = addItem(cart, "item" + i);
    expect(addItem(cart, "one-more")).toBe(cart);
  });

  test("removing the last one drops the line", () => {
    expect(removeItem({ pasta: 1, salad: 2 }, "pasta")).toEqual({ salad: 2 });
    expect(removeItem({ salad: 2 }, "salad")).toEqual({ salad: 1 });
  });

  test("cartTotals sums per price group", () => {
    expect(cartTotals({ pasta: 2, salad: 1 }, menu)).toEqual({
      student: 590,
      staff: 1010,
      guest: 1300,
    });
  });

  test("toOrderLines keeps the order items were added in", () => {
    expect(toOrderLines({ salad: 1, pasta: 2 })).toEqual([
      { itemId: "salad", quantity: 1 },
      { itemId: "pasta", quantity: 2 },
    ]);
  });
});
