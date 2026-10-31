import type { MenuItem, Prices } from "@/api/orders/interface";
import type { OrderLineInput } from "@/api/orders/interface";

export type Cart = Record<string, number>;

const MAX_QUANTITY = 20;
const MAX_LINES = 20;

export function addItem(cart: Cart, itemId: string): Cart {
  const quantity = cart[itemId] ?? 0;
  if (quantity === 0 && Object.keys(cart).length >= MAX_LINES) return cart;
  return { ...cart, [itemId]: Math.min(quantity + 1, MAX_QUANTITY) };
}

export function removeItem(cart: Cart, itemId: string): Cart {
  const { [itemId]: quantity = 0, ...rest } = cart;
  return quantity > 1 ? { ...rest, [itemId]: quantity - 1 } : rest;
}

export function cartTotals(cart: Cart, menu: MenuItem[]): Prices {
  const prices = new Map(menu.map((item) => [item.id, item.prices]));
  const totals: Prices = { student: 0, staff: 0, guest: 0 };
  for (const [itemId, quantity] of Object.entries(cart)) {
    const price = prices.get(itemId);
    if (!price) continue;
    totals.student += price.student * quantity;
    totals.staff += price.staff * quantity;
    totals.guest += price.guest * quantity;
  }
  return totals;
}

export const toOrderLines = (cart: Cart): OrderLineInput[] =>
  Object.entries(cart).map(([itemId, quantity]) => ({ itemId, quantity }));
