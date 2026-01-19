import { utilFn, UTIL_CONST } from "./index.ts";
import { helperFn, HELPER_CONST } from "./index.ts";
import type { UtilType } from "./index.ts";

const result = utilFn();
const helper = helperFn();
const value: UtilType = { value: UTIL_CONST + HELPER_CONST };

export { result, helper, value };
