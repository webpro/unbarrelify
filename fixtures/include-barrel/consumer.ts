import { includedFn, INCLUDED_CONST } from "./barrel-with-comments.ts";
import type { IncludedType } from "./barrel-with-comments.ts";

const result = includedFn();
const value = INCLUDED_CONST;
const item: IncludedType = { name: "test" };

export { result, value, item };
