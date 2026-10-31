import type { Schemas } from "@/api/interface";

export type LocalizedText = Schemas["LocalizedText"];
export type MenuItem = Schemas["MenuItem"];
export type Order = Schemas["Order"];
export type OrderLineInput = Schemas["OrderLineInput"];
export type Prices = Schemas["Prices"];
export type PriceGroup = keyof Prices;
