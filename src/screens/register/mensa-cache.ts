import type { Mensa } from "@/api/mensas/interface";
import type { KeyValue } from "@/lib/storage";

const KEY = "mensas";

// The last menu the till loaded, so the register opens without waiting for the network.
export function createMensaCache(kv: Pick<KeyValue, "get" | "set">) {
  return {
    read(): Mensa[] | undefined {
      const raw = kv.get(KEY);
      if (!raw) return undefined;
      try {
        return JSON.parse(raw) as Mensa[];
      } catch {
        return undefined;
      }
    },
    save(mensas: Mensa[]) {
      kv.set(KEY, JSON.stringify(mensas));
    },
  };
}
