/* eslint-disable @typescript-eslint/no-unused-vars */
// Consumer imports foo from barrel, but bar directly from utils
// After rewrite, both should come from utils and be merged into one import
import { foo } from "./index.ts";
import { bar } from "./utils.ts";

const a = foo();
const b = bar();
