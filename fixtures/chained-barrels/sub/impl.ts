export function deepFunction(): string {
  return "deep";
}

export function anotherDeep(value: number): number {
  return value * 3;
}

export const DEEP_CONSTANT = 100;

export interface DeepConfig {
  level: number;
  name: string;
}

export type DeepCallback = (value: number) => void;
