export function foo(): string {
  return "foo";
}

export function bar(value: number): number {
  return value * 2;
}

export const CONSTANT = 42;

export interface UtilOptions {
  enabled: boolean;
  name: string;
}
