// Should only import from context.ts, NOT from empty.ts
import type { APIContext } from "./index.js";

export const ctx: APIContext = { url: new URL("https://example.com") };
