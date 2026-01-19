export { foo, bar } from "./source.ts";

const CONFIG = {
  version: "1.0.0",
  debug: false,
};

export function getConfig() {
  return CONFIG;
}

let counter = 0;

export function incrementCounter(): number {
  return ++counter;
}

export function getCounter(): number {
  return counter;
}
