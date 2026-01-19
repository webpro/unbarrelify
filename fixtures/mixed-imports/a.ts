export function greet(name: string): string {
  return `Hello, ${name}!`;
}

export function farewell(name: string): string {
  return `Goodbye, ${name}!`;
}

export const VERSION = "1.0.0";

export interface Person {
  name: string;
  age: number;
}
