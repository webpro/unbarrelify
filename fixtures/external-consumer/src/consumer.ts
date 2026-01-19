import { AstroError } from "./errors/index.ts";

export function throwError() {
  throw new AstroError("Something went wrong");
}
