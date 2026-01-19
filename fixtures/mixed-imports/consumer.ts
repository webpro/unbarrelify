import Calculator, { greet, farewell as sayGoodbye, VERSION } from "./index.ts";
import type { Person } from "./index.ts";

const greeting = greet("World");
console.log(greeting);

const goodbye = sayGoodbye("World");
console.log(goodbye);

console.log(`Version: ${VERSION}`);

const calc = new Calculator();
console.log(`2 + 3 = ${calc.add(2, 3)}`);
console.log(`5 - 2 = ${calc.subtract(5, 2)}`);

const person: Person = {
  name: "Alice",
  age: 30,
};
console.log(`Person: ${person.name}, ${person.age}`);
