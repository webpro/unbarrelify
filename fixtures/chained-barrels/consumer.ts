import { deepFunction, anotherDeep, DEEP_CONSTANT } from "./index.ts";
import type { DeepConfig, DeepCallback } from "./index.ts";

const result = deepFunction();
const tripled = anotherDeep(10);
const value = DEEP_CONSTANT;

const config: DeepConfig = {
  level: 3,
  name: "chained",
};

const callback: DeepCallback = (v) => console.log(v);

export { result, tripled, value, config, callback };
