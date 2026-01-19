/**
 * Consumer file - imports from the barrel file (index.ts).
 * After unbarrelify runs, these imports should be rewired to point directly to utils.ts.
 */
import { foo, bar, CONSTANT } from "./index.ts";
import type { UtilOptions } from "./index.ts";

// Use the imported functions and values
const result = foo();
const doubled = bar(21);
const value = CONSTANT;

const options: UtilOptions = {
  enabled: true,
  name: "test",
};

export { result, doubled, value, options };
