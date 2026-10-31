import apiInstance from "@/api/api-instance";
import { ENDPOINTS } from "@/api/endpoints";

import type { Mensa } from "./interface";

/** Every mensa with its tills and menu; the register shows the cashier's own. */
export const getMensas = async (): Promise<Mensa[]> =>
  (await apiInstance.request<{ items: Mensa[] }>("GET", ENDPOINTS.MENSAS)).data.items;
