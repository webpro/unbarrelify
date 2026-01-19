import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCliArgs } from "../../src/cli.ts";

test("parseCliArgs: returns correct defaults", () => {
  const result = parseCliArgs([]);
  assert.equal(result.cwd, ".");
  assert.equal(result.files, undefined);
  assert.deepEqual(result.skip, []);
  assert.deepEqual(result.barrel, []);
  assert.deepEqual(result.only, []);
  assert.equal(result.ext, undefined);
  assert.equal(result.write, false);
  assert.equal(result.check, false);
  assert.equal(result.unsafeNamespace, false);
  assert.equal(result.organizeImports, false);
  assert.equal(result.help, false);
});

test("parseCliArgs: parses all options", () => {
  const result = parseCliArgs([
    "--only",
    "./src/index.ts",
    "--cwd",
    "./src",
    "--files",
    "**/*.tsx",
    "--skip",
    "**/index.ts",
    "--barrel",
    "**/barrel.ts",
    "--ext",
    ".js",
    "--write",
    "--check",
    "--unsafe-namespace",
    "--organize-imports",
    "--help",
  ]);
  assert.deepEqual(result.only, ["./src/index.ts"]);
  assert.equal(result.cwd, "./src");
  assert.deepEqual(result.files, ["**/*.tsx"]);
  assert.deepEqual(result.skip, ["**/index.ts"]);
  assert.deepEqual(result.barrel, ["**/barrel.ts"]);
  assert.equal(result.ext, ".js");
  assert.equal(result.write, true);
  assert.equal(result.check, true);
  assert.equal(result.organizeImports, true);
  assert.equal(result.unsafeNamespace, true);
  assert.equal(result.help, true);
});

test("parseCliArgs: short flags work", () => {
  const result = parseCliArgs([
    "-o",
    "./index.ts",
    "-c",
    "./lib",
    "-f",
    "**/*.js",
    "-s",
    "**/public.ts",
    "-b",
    "**/extra.ts",
    "-e",
    ".mjs",
    "-w",
    "-h",
  ]);
  assert.deepEqual(result.only, ["./index.ts"]);
  assert.equal(result.cwd, "./lib");
  assert.deepEqual(result.files, ["**/*.js"]);
  assert.deepEqual(result.skip, ["**/public.ts"]);
  assert.deepEqual(result.barrel, ["**/extra.ts"]);
  assert.equal(result.ext, ".mjs");
  assert.equal(result.write, true);
  assert.equal(result.help, true);
});

test("parseCliArgs: handles multiple values for repeatable options", () => {
  const result = parseCliArgs([
    "--files",
    "src/**/*.ts",
    "--files",
    "lib/**/*.ts",
    "--skip",
    "**/a.ts",
    "--skip",
    "**/b.ts",
    "--barrel",
    "**/c.ts",
    "--barrel",
    "**/d.ts",
  ]);
  assert.deepEqual(result.files, ["src/**/*.ts", "lib/**/*.ts"]);
  assert.deepEqual(result.skip, ["**/a.ts", "**/b.ts"]);
  assert.deepEqual(result.barrel, ["**/c.ts", "**/d.ts"]);
});

test("parseCliArgs: throws on unknown option", () => {
  assert.throws(() => parseCliArgs(["--unknown-option"]));
});

test("parseCliArgs: throws on positional arguments", () => {
  assert.throws(() => parseCliArgs(["./src/index.ts"]));
});
