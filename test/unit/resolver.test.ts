import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { resolveModule, ensureExtension, buildSpecifier } from "../../src/resolver.ts";
import { join } from "node:path";

describe("resolver", () => {
  describe("resolveModule", () => {
    test("resolves relative imports with extension", () => {
      const fromPath = join(process.cwd(), "src/main.ts");
      const result = resolveModule(fromPath, "./types.ts", null);
      assert.ok(result);
      assert.ok(result.endsWith("types.ts"));
    });

    test("resolves relative imports without extension", () => {
      const fromPath = join(process.cwd(), "src/main.ts");
      const result = resolveModule(fromPath, "./types", null);
      assert.ok(result);
      assert.ok(result.endsWith("types.ts"));
    });

    test("preserves node_modules package specifier", () => {
      const fromPath = join(process.cwd(), "src/main.ts");
      const result = resolveModule(fromPath, "typescript", null);
      assert.equal(result, "typescript");
    });

    test("preserves scoped package specifier", () => {
      const fromPath = join(process.cwd(), "src/main.ts");
      const result = resolveModule(fromPath, "oxc-resolver", null);
      assert.equal(result, "oxc-resolver");
    });

    test("returns undefined for non-existent modules", () => {
      const fromPath = join(process.cwd(), "src/main.ts");
      const result = resolveModule(fromPath, "./non-existent-module", null);
      assert.equal(result, undefined);
    });
  });

  describe("ensureExtension", () => {
    test("replaces .ts with specified extension", () => {
      assert.equal(ensureExtension("file.ts", ".js"), "file.js");
    });

    test("replaces .tsx with specified extension", () => {
      assert.equal(ensureExtension("file.tsx", ".js"), "file.js");
    });

    test("replaces .js with specified extension", () => {
      assert.equal(ensureExtension("file.js", ".ts"), "file.ts");
    });

    test("replaces .jsx with specified extension", () => {
      assert.equal(ensureExtension("file.jsx", ".js"), "file.js");
    });

    test("preserves path without matching extension", () => {
      assert.equal(ensureExtension("file.json", ".js"), "file.json");
    });

    test("handles paths with directories", () => {
      assert.equal(ensureExtension("src/utils/helper.ts", ".js"), "src/utils/helper.js");
    });
  });

  describe("buildSpecifier", () => {
    test("generates relative path from same directory", () => {
      const result = buildSpecifier("/project/src/a.ts", "/project/src/b.ts", { ext: ".js" });
      assert.equal(result, "./b.js");
    });

    test("generates relative path from parent directory", () => {
      const result = buildSpecifier("/project/src/a.ts", "/project/src/utils/b.ts", { ext: ".js" });
      assert.equal(result, "./utils/b.js");
    });

    test("generates relative path from child directory", () => {
      const result = buildSpecifier("/project/src/utils/a.ts", "/project/src/b.ts", { ext: ".js" });
      assert.equal(result, "../b.js");
    });

    test("generates relative path across directories", () => {
      const result = buildSpecifier("/project/src/utils/a.ts", "/project/src/helpers/b.ts", { ext: ".js" });
      assert.equal(result, "../helpers/b.js");
    });

    test("applies extension transformation", () => {
      const result = buildSpecifier("/project/src/a.ts", "/project/src/b.tsx", { ext: ".js" });
      assert.equal(result, "./b.js");
    });
  });
});
