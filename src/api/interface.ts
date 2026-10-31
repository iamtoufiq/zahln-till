import type { components } from "./schema";

// Wire types shared by every domain. Each domain's interface.ts aliases its own from the same schema.
export type Schemas = components["schemas"];

export type Problem = Schemas["Problem"];
export type Session = Schemas["Session"];
export type User = Schemas["User"];
