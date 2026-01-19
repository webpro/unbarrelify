import { helperFn } from "./inner/index.ts";
import type { HelperConfig } from "./inner/index.ts";

const result = helperFn();
const config: HelperConfig = { enabled: true };

export { result, config };
