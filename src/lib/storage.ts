import { createMMKV } from "react-native-mmkv";

export const storage = createMMKV({ id: "zahln-till" });

export const kv = {
  get: (key: string) => storage.getString(key),
  set: (key: string, value: string) => storage.set(key, value),
  delete: (key: string) => {
    storage.remove(key);
  },
  keys: () => storage.getAllKeys(),
};

export type KeyValue = typeof kv;
