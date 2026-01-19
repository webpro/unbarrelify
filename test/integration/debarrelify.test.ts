import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { unbarrelify } from "../../src/main.ts";
import { copyFixture, read } from "./helpers.ts";

describe("unbarrelify integration tests", () => {
  describe("simple-barrel fixture", () => {
    test("detects and removes simple barrel file", async (t) => {
      const fixtureDir = await copyFixture(t, "simple-barrel");

      const result = await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        ext: ".js",
        write: true,
      });

      assert.ok(result.deleted.length > 0);
      const deletedBarrel = result.deleted.find((f) => f.endsWith("index.ts"));
      assert.ok(deletedBarrel);
      assert.ok(!existsSync(join(fixtureDir, "index.ts")));
    });

    test("rewrites imports in consumer file to point to source", async (t) => {
      const fixtureDir = await copyFixture(t, "simple-barrel");

      const result = await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        ext: ".js",
        write: true,
      });

      assert.ok(result.modified.length > 0);
      const modifiedConsumer = result.modified.find((f) => f.endsWith("consumer.ts"));
      assert.ok(modifiedConsumer);

      const consumerContent = await read(join(fixtureDir, "consumer.ts"));

      assert.ok(
        consumerContent.includes("./utils.js") || consumerContent.includes("'./utils.js'"),
        "Consumer should import from utils.js",
      );
      assert.ok(!consumerContent.includes("./index"));
    });

    test("preserves named imports correctly", async (t) => {
      const fixtureDir = await copyFixture(t, "simple-barrel");

      await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        ext: ".js",
        write: true,
      });

      const consumerContent = await read(join(fixtureDir, "consumer.ts"));

      assert.ok(consumerContent.includes("foo"));
      assert.ok(consumerContent.includes("bar"));
      assert.ok(consumerContent.includes("CONSTANT"));
    });

    test("preserves type imports correctly", async (t) => {
      const fixtureDir = await copyFixture(t, "simple-barrel");

      await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        ext: ".js",
        write: true,
      });

      const consumerContent = await read(join(fixtureDir, "consumer.ts"));

      assert.ok(consumerContent.includes("UtilOptions"));
      assert.ok(consumerContent.includes("import type"));
    });

    test("preserves comments in consumer files", async (t) => {
      const fixtureDir = await copyFixture(t, "simple-barrel");

      await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        ext: ".js",
        write: true,
      });

      const consumerContent = await read(join(fixtureDir, "consumer.ts"));

      assert.ok(consumerContent.includes("Consumer file"));
      assert.ok(consumerContent.includes("/**"));

      assert.ok(consumerContent.includes("// Use the imported"));
    });
  });

  describe("chained-barrels fixture", () => {
    test("resolves through chain of barrel files", async (t) => {
      const fixtureDir = await copyFixture(t, "chained-barrels");

      const result = await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        ext: ".js",
        write: true,
      });

      assert.ok(result.deleted.length >= 2);
      const deletedOuterBarrel = result.deleted.find((f) => f.endsWith("/index.ts") && !f.includes("/sub/"));
      const deletedInnerBarrel = result.deleted.find((f) => f.endsWith("sub/index.ts"));
      assert.ok(deletedOuterBarrel);
      assert.ok(deletedInnerBarrel);
    });

    test("rewrites imports to ultimate source file", async (t) => {
      const fixtureDir = await copyFixture(t, "chained-barrels");

      await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        ext: ".js",
        write: true,
      });

      const consumerContent = await read(join(fixtureDir, "consumer.ts"));

      assert.ok(
        consumerContent.includes("./sub/impl.js") || consumerContent.includes("'./sub/impl.js'"),
        "Consumer should import from sub/impl.js (ultimate source)",
      );
      assert.ok(!consumerContent.includes("./index"));
      assert.ok(!consumerContent.includes("./sub/index"));
    });

    test("preserves all imported symbols through chain", async (t) => {
      const fixtureDir = await copyFixture(t, "chained-barrels");

      await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        ext: ".js",
        write: true,
      });

      const consumerContent = await read(join(fixtureDir, "consumer.ts"));

      assert.ok(consumerContent.includes("deepFunction"));
      assert.ok(consumerContent.includes("anotherDeep"));
      assert.ok(consumerContent.includes("DEEP_CONSTANT"));
      assert.ok(consumerContent.includes("DeepConfig"));
      assert.ok(consumerContent.includes("DeepCallback"));
    });
  });

  describe("mixed-imports fixture", () => {
    test("handles mixed import types (named, default, aliased)", async (t) => {
      const fixtureDir = await copyFixture(t, "mixed-imports");

      const result = await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        ext: ".js",
        write: true,
      });

      const deletedBarrel = result.deleted.find((f) => f.endsWith("index.ts"));
      assert.ok(deletedBarrel);

      const modifiedConsumer = result.modified.find((f) => f.endsWith("consumer.ts"));
      assert.ok(modifiedConsumer);
    });

    test("rewrites imports to correct source files", async (t) => {
      const fixtureDir = await copyFixture(t, "mixed-imports");

      await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        ext: ".js",
        write: true,
      });

      const consumerContent = await read(join(fixtureDir, "consumer.ts"));

      assert.ok(consumerContent.includes("./a.js"));
      assert.ok(consumerContent.includes("./b.js"));
      assert.ok(!consumerContent.includes("./index"));
    });

    test("preserves aliased imports", async (t) => {
      const fixtureDir = await copyFixture(t, "mixed-imports");

      await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        ext: ".js",
        write: true,
      });

      const consumerContent = await read(join(fixtureDir, "consumer.ts"));

      assert.ok(
        consumerContent.includes("farewell") && consumerContent.includes("sayGoodbye"),
        "Should preserve aliased import (farewell as sayGoodbye)",
      );
    });

    test("preserves default imports", async (t) => {
      const fixtureDir = await copyFixture(t, "mixed-imports");

      await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        ext: ".js",
        write: true,
      });

      const consumerContent = await read(join(fixtureDir, "consumer.ts"));

      assert.ok(consumerContent.includes("Calculator"));
    });

    test("preserves type imports", async (t) => {
      const fixtureDir = await copyFixture(t, "mixed-imports");

      await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        ext: ".js",
        write: true,
      });

      const consumerContent = await read(join(fixtureDir, "consumer.ts"));

      assert.ok(consumerContent.includes("Person"));
      assert.ok(consumerContent.includes("import type"));
    });
  });

  describe("type-imports fixture", () => {
    test("handles type-only imports correctly", async (t) => {
      const fixtureDir = await copyFixture(t, "type-imports");

      const result = await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        ext: ".js",
        write: true,
      });

      const deletedBarrel = result.deleted.find((f) => f.endsWith("index.ts"));
      assert.ok(deletedBarrel);

      const modifiedConsumer = result.modified.find((f) => f.endsWith("consumer.ts"));
      assert.ok(modifiedConsumer);
    });

    test("rewrites type imports to source file", async (t) => {
      const fixtureDir = await copyFixture(t, "type-imports");

      await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        ext: ".js",
        write: true,
      });

      const consumerContent = await read(join(fixtureDir, "consumer.ts"));

      assert.ok(consumerContent.includes("./types.js"));
      assert.ok(!consumerContent.includes("./index"));
    });

    test("preserves type-only modifier on imports", async (t) => {
      const fixtureDir = await copyFixture(t, "type-imports");

      await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        ext: ".js",
        write: true,
      });

      const consumerContent = await read(join(fixtureDir, "consumer.ts"));

      assert.ok(consumerContent.includes("import type"));
    });

    test("preserves all type imports", async (t) => {
      const fixtureDir = await copyFixture(t, "type-imports");

      await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        ext: ".js",
        write: true,
      });

      const consumerContent = await read(join(fixtureDir, "consumer.ts"));

      assert.ok(consumerContent.includes("User"));
      assert.ok(consumerContent.includes("UserId"));
      assert.ok(consumerContent.includes("UserRole"));
      assert.ok(consumerContent.includes("Result"));
      assert.ok(consumerContent.includes("Repository"));
      assert.ok(consumerContent.includes("UserWithRole"));
    });

    test("preserves enum imports (runtime values)", async (t) => {
      const fixtureDir = await copyFixture(t, "type-imports");

      await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        ext: ".js",
        write: true,
      });

      const consumerContent = await read(join(fixtureDir, "consumer.ts"));

      assert.ok(consumerContent.includes("Status"));
      assert.ok(consumerContent.includes("Priority"));
    });
  });

  describe("external-reexport fixture", () => {
    test("detects barrel file with external re-exports", async (t) => {
      const fixtureDir = await copyFixture(t, "external-reexport");

      const result = await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        ext: ".js",
        write: true,
      });

      const deletedBarrel = result.deleted.find((f) => f.endsWith("index.ts"));
      assert.ok(deletedBarrel);
    });

    test("handles external package re-exports - rewrites consumer imports", async (t) => {
      const fixtureDir = await copyFixture(t, "external-reexport");

      const result = await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        ext: ".js",
        write: true,
      });

      const deletedBarrel = result.deleted.find((f) => f.endsWith("index.ts"));
      assert.ok(deletedBarrel);

      const modifiedConsumer = result.modified.find((f) => f.endsWith("consumer.ts"));
      if (modifiedConsumer) {
        const consumerContent = await read(join(fixtureDir, "consumer.ts"));
        assert.ok(consumerContent.includes("node:path"));
        assert.ok(consumerContent.includes("typescript"));
        assert.ok(!consumerContent.includes("./index"));
      }
    });

    test("preserves all imported symbols from external packages", async (t) => {
      const fixtureDir = await copyFixture(t, "external-reexport");

      await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        ext: ".js",
        write: true,
      });

      const consumerContent = await read(join(fixtureDir, "consumer.ts"));

      assert.ok(consumerContent.includes("join"));
      assert.ok(consumerContent.includes("resolve"));
      assert.ok(consumerContent.includes("dirname"));

      assert.ok(consumerContent.includes("ScriptTarget"));
      assert.ok(consumerContent.includes("ModuleKind"));
    });
  });

  describe("external-star-reexport fixture", () => {
    test("handles star re-export from external package", async (t) => {
      const fixtureDir = await copyFixture(t, "external-star-reexport");

      const result = await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        ext: ".js",
        write: true,
      });

      const deletedBarrel = result.deleted.find((f) => f.endsWith("index.ts"));
      assert.ok(deletedBarrel);

      const modifiedConsumer = result.modified.find((f) => f.endsWith("consumer.ts"));
      assert.ok(modifiedConsumer);
    });

    test("rewrites imports to external package specifier", async (t) => {
      const fixtureDir = await copyFixture(t, "external-star-reexport");

      await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        ext: ".js",
        write: true,
      });

      const consumerContent = await read(join(fixtureDir, "consumer.ts"));

      assert.ok(consumerContent.includes("node:path"));
      assert.ok(!consumerContent.includes("./index"));
    });

    test("preserves all imported symbols from star re-export", async (t) => {
      const fixtureDir = await copyFixture(t, "external-star-reexport");

      await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        ext: ".js",
        write: true,
      });

      const consumerContent = await read(join(fixtureDir, "consumer.ts"));

      assert.ok(consumerContent.includes("join"));
      assert.ok(consumerContent.includes("resolve"));
      assert.ok(consumerContent.includes("dirname"));
    });
  });

  describe("dry-run mode", () => {
    test("does not modify files in dry-run mode", async (t) => {
      const fixtureDir = await copyFixture(t, "simple-barrel");

      const originalConsumer = await read(join(fixtureDir, "consumer.ts"));
      const originalIndex = await read(join(fixtureDir, "index.ts"));

      const result = await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        ext: ".js",
        write: false,
      });

      assert.ok(result.modified.length > 0);
      assert.ok(result.deleted.length > 0);

      const afterConsumer = await read(join(fixtureDir, "consumer.ts"));
      const afterIndex = await read(join(fixtureDir, "index.ts"));

      assert.equal(afterConsumer, originalConsumer);
      assert.equal(afterIndex, originalIndex);
      assert.ok(existsSync(join(fixtureDir, "index.ts")));
    });
  });

  describe("result structure", () => {
    test("returns correct modified and deleted arrays", async (t) => {
      const fixtureDir = await copyFixture(t, "simple-barrel");

      const result = await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        ext: ".js",
        write: true,
      });

      assert.ok(Array.isArray(result.modified));
      assert.ok(Array.isArray(result.deleted));

      assert.ok(
        result.modified.some((f) => f.endsWith("consumer.ts")),
        "modified should contain consumer.ts",
      );

      assert.ok(
        result.deleted.some((f) => f.endsWith("index.ts")),
        "deleted should contain index.ts",
      );

      assert.ok(
        !result.deleted.some((f) => f.endsWith("utils.ts")),
        "deleted should not contain utils.ts (source file)",
      );
    });
  });

  describe("default-as-named fixture", () => {
    test("handles export { default as name } pattern", async (t) => {
      const fixtureDir = await copyFixture(t, "default-as-named");

      const result = await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        ext: ".js",
        write: true,
      });

      const deletedBarrel = result.deleted.find((f) => f.endsWith("index.ts"));
      assert.ok(deletedBarrel);

      const modifiedConsumer = result.modified.find((f) => f.endsWith("consumer.ts"));
      assert.ok(modifiedConsumer);
    });

    test("rewrites aliased default export to default import syntax", async (t) => {
      const fixtureDir = await copyFixture(t, "default-as-named");

      await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        ext: ".js",
        write: true,
      });

      const consumerContent = await read(join(fixtureDir, "consumer.ts"));

      assert.ok(
        consumerContent.includes("import vitePluginAstroServer"),
        "Should have default import for vitePluginAstroServer",
      );
      assert.ok(
        !consumerContent.includes("{ vitePluginAstroServer }"),
        "Should NOT have named import for vitePluginAstroServer (it's a default export)",
      );
      assert.ok(consumerContent.includes("./source.js"));
      assert.ok(!consumerContent.includes("./index"));
    });

    test("preserves regular named exports alongside aliased default", async (t) => {
      const fixtureDir = await copyFixture(t, "default-as-named");

      await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        ext: ".js",
        write: true,
      });

      const consumerContent = await read(join(fixtureDir, "consumer.ts"));

      assert.ok(consumerContent.includes("helperFn"));
    });
  });

  describe("named-as-default fixture", () => {
    test("handles export { name as default } pattern", async (t) => {
      const fixtureDir = await copyFixture(t, "named-as-default");

      const result = await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        ext: ".js",
        write: true,
      });

      const deletedBarrel = result.deleted.find((f) => f.endsWith("index.ts"));
      assert.ok(deletedBarrel);

      const modifiedConsumer = result.modified.find((f) => f.endsWith("consumer.ts"));
      assert.ok(modifiedConsumer);
    });

    test("rewrites named-as-default export to named import syntax", async (t) => {
      const fixtureDir = await copyFixture(t, "named-as-default");

      await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        ext: ".js",
        write: true,
      });

      const consumerContent = await read(join(fixtureDir, "consumer.ts"));

      assert.ok(consumerContent.includes("myFunction"));
      assert.ok(consumerContent.includes("./source.js"));
      assert.ok(!consumerContent.includes("./index"));
    });

    test("preserves regular named exports alongside named-as-default", async (t) => {
      const fixtureDir = await copyFixture(t, "named-as-default");

      await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        ext: ".js",
        write: true,
      });

      const consumerContent = await read(join(fixtureDir, "consumer.ts"));

      assert.ok(consumerContent.includes("helperValue"));
    });
  });

  describe("preserved barrels", () => {
    test("preserves barrel marked as public export in package.json", async (t) => {
      const fixtureDir = await copyFixture(t, "public-export");

      const result = await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        ext: ".js",
        write: false,
      });

      assert.equal(result.modified.length, 0);
      assert.equal(result.deleted.length, 0);

      const preservedBarrel = result.preserved.find((k) => k.path.includes("src/index.ts"));
      assert.ok(preservedBarrel);
      assert.equal(preservedBarrel?.reason, "skip");
    });

    test("rewrites namespace import to point to source file", async (t) => {
      const fixtureDir = await copyFixture(t, "namespace-import");

      const result = await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        ext: ".js",
        write: true,
      });

      assert.ok(result.deleted.some((f) => f.includes("lib/index.ts")));

      assert.ok(result.modified.some((f) => f.includes("consumer.ts")));

      const consumerContent = await read(join(fixtureDir, "consumer.ts"));
      assert.ok(consumerContent.includes("./lib/utils.js"));
      assert.ok(
        !consumerContent.includes("./lib/index") &&
          !consumerContent.includes('./lib"') &&
          !consumerContent.includes("./lib'"),
      );
    });

    test("preserves barrel when namespace import has multiple sources", async (t) => {
      const fixtureDir = await copyFixture(t, "namespace-multi-source");

      const result = await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        ext: ".js",
        write: false,
      });

      assert.ok(!result.deleted.some((f) => f.includes("index.ts")));

      const preservedBarrel = result.preserved.find((k) => k.path.includes("index.ts"));
      assert.ok(preservedBarrel);
      assert.equal(preservedBarrel?.reason, "namespace-import");
      assert.ok(preservedBarrel?.consumers?.length === 1);
      assert.ok(preservedBarrel?.consumers?.[0].includes("consumer.ts"));
    });

    test("preserves barrel for namespace import but rewrites named imports from other consumers", async (t) => {
      const fixtureDir = await copyFixture(t, "namespace-mixed-consumers");

      const result = await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        ext: ".js",
        write: true,
      });

      assert.ok(!result.deleted.some((f) => f.includes("index.ts")));
      assert.ok(existsSync(join(fixtureDir, "index.ts")));

      const preservedBarrel = result.preserved.find((k) => k.path.includes("index.ts"));
      assert.ok(preservedBarrel);
      assert.equal(preservedBarrel?.reason, "namespace-import");
      assert.ok(preservedBarrel?.consumers?.some((c) => c.includes("ns-consumer.ts")));

      assert.ok(result.modified.some((f) => f.includes("named-consumer.ts")));

      const namedConsumerContent = await read(join(fixtureDir, "named-consumer.ts"));
      assert.ok(!namedConsumerContent.includes("./index"));
      assert.ok(namedConsumerContent.includes("./utils.js"));
      assert.ok(namedConsumerContent.includes("./helpers.js"));

      const nsConsumerContent = await read(join(fixtureDir, "ns-consumer.ts"));
      assert.ok(nsConsumerContent.includes("./index"));
    });
  });

  describe("single-file mode", () => {
    test("processes only the specified barrel file", async (t) => {
      const fixtureDir = await copyFixture(t, "single-file-mode");

      const result = await unbarrelify({
        cwd: fixtureDir,
        only: ["index.ts"],
        ext: ".js",
        write: true,
      });

      assert.ok(result.deleted.some((f) => f.endsWith("index.ts")));
      assert.ok(result.modified.some((f) => f.endsWith("consumer.ts")));
    });

    test("rewrites imports to point to source files", async (t) => {
      const fixtureDir = await copyFixture(t, "single-file-mode");

      await unbarrelify({
        cwd: fixtureDir,
        only: ["index.ts"],
        ext: ".js",
        write: true,
      });

      const consumerContent = await read(join(fixtureDir, "consumer.ts"));

      assert.ok(consumerContent.includes("./utils.js"));
      assert.ok(consumerContent.includes("./helpers.js"));
      assert.ok(!consumerContent.includes("./index"));
    });

    test("reports non-barrel file correctly", async (t) => {
      const fixtureDir = await copyFixture(t, "single-file-mode");

      const result = await unbarrelify({
        cwd: fixtureDir,
        only: ["utils.ts"],
        ext: ".js",
        write: false,
      });

      assert.equal(result.modified.length, 0);
      assert.equal(result.deleted.length, 0);
    });
  });

  describe("skip option", () => {
    test("skips barrel files matching --skip pattern", async (t) => {
      const fixtureDir = await copyFixture(t, "skip-barrel");

      const result = await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: ["**/index.ts"],
        ext: ".js",
        write: false,
      });

      assert.ok(!result.deleted.some((f) => f.endsWith("index.ts")));
      assert.equal(result.modified.length, 0);
    });
  });

  describe("include option", () => {
    test("treats non-barrel files as barrels when matching --include pattern", async (t) => {
      const fixtureDir = await copyFixture(t, "include-barrel");

      const result = await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        barrel: ["**/barrel-with-comments.ts"],
        ext: ".js",
        write: true,
      });

      assert.ok(result.deleted.some((f) => f.endsWith("barrel-with-comments.ts")));
      assert.ok(result.modified.some((f) => f.endsWith("consumer.ts")));
    });

    test("rewrites imports from included barrel-like files", async (t) => {
      const fixtureDir = await copyFixture(t, "include-barrel");

      await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        barrel: ["**/barrel-with-comments.ts"],
        ext: ".js",
        write: true,
      });

      const consumerContent = await read(join(fixtureDir, "consumer.ts"));

      assert.ok(consumerContent.includes("./source.js"));
      assert.ok(!consumerContent.includes("barrel-with-comments"));
    });

    test("does not process non-barrel files without --include", async (t) => {
      const fixtureDir = await copyFixture(t, "include-barrel");

      const result = await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        barrel: [],
        ext: ".js",
        write: false,
      });

      assert.ok(!result.deleted.some((f) => f.endsWith("barrel-with-comments.ts")));
    });
  });

  describe("unsafe-namespace option", () => {
    test("rewrites namespace imports from multi-source barrels when --unsafe-namespace is enabled", async (t) => {
      const fixtureDir = await copyFixture(t, "namespace-mixed-consumers");

      const result = await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        ext: ".js",
        write: true,
        unsafeNamespace: true,
      });

      assert.ok(result.deleted.some((f) => f.includes("index.ts")));
      assert.ok(!existsSync(join(fixtureDir, "index.ts")));

      assert.ok(result.modified.some((f) => f.includes("ns-consumer.ts")));
      assert.ok(result.modified.some((f) => f.includes("named-consumer.ts")));

      const nsConsumerContent = await read(join(fixtureDir, "ns-consumer.ts"));
      assert.ok(!nsConsumerContent.includes("./index"));
      assert.ok(nsConsumerContent.includes("./utils.js"));
      assert.ok(nsConsumerContent.includes("./helpers.js"));
      assert.ok(nsConsumerContent.includes("const lib"));
      assert.ok(
        nsConsumerContent.includes("foo") && nsConsumerContent.includes("bar"),
        "Should have identifiers in const object",
      );
    });

    test("does not rewrite namespace imports without --unsafe-namespace", async (t) => {
      const fixtureDir = await copyFixture(t, "namespace-mixed-consumers");

      const result = await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        ext: ".js",
        write: true,
        unsafeNamespace: false,
      });

      assert.ok(!result.deleted.some((f) => f.includes("index.ts")));
      assert.ok(existsSync(join(fixtureDir, "index.ts")));

      assert.ok(!result.modified.some((f) => f.includes("ns-consumer.ts")));

      assert.ok(result.modified.some((f) => f.includes("named-consumer.ts")));
    });
  });

  describe("esm-js fixture", () => {
    test("detects and removes JS barrel file", async (t) => {
      const fixtureDir = await copyFixture(t, "esm-js");

      const result = await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.js"],
        skip: [],
        write: true,
      });

      assert.ok(result.deleted.length > 0);
      assert.ok(result.deleted.some((f) => f.endsWith("index.js")));
      assert.ok(!existsSync(join(fixtureDir, "index.js")));
    });

    test("rewrites JS imports to point to source", async (t) => {
      const fixtureDir = await copyFixture(t, "esm-js");

      const result = await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.js"],
        skip: [],
        write: true,
      });

      assert.ok(result.modified.some((f) => f.endsWith("consumer.js")));

      const consumerContent = await read(join(fixtureDir, "consumer.js"));
      assert.ok(consumerContent.includes("./utils.js"));
      assert.ok(!consumerContent.includes("./index.js"));
    });
  });

  describe("package-entry-point fixture", () => {
    test("preserves barrel listed in package.json#exports", async (t) => {
      const fixtureDir = await copyFixture(t, "package-entry-point");

      const result = await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        write: true,
      });

      assert.ok(!result.deleted.some((f) => f.includes("gen/index.ts")));
      assert.ok(existsSync(join(fixtureDir, "packages/icons/gen/index.ts")));
      assert.ok(result.preserved.some((p) => p.path.includes("gen/index.ts")));
    });

    test("preserves subpath exports", async (t) => {
      const fixtureDir = await copyFixture(t, "package-entry-point");

      const result = await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        write: true,
      });

      assert.ok(!result.deleted.some((f) => f.includes("gen/utils.ts")));
      assert.ok(existsSync(join(fixtureDir, "packages/icons/gen/utils.ts")));
      assert.ok(!result.modified.some((f) => f.includes("utils-consumer.ts")));

      const content = await read(join(fixtureDir, "app/utils-consumer.ts"));
      assert.ok(content.includes("gen/utils.ts"));
    });

    test("does not rewrite imports pointing to package entry point", async (t) => {
      const fixtureDir = await copyFixture(t, "package-entry-point");

      const result = await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        write: true,
      });

      assert.ok(!result.modified.some((f) => f.includes("consumer.ts")));

      const consumerContent = await read(join(fixtureDir, "app/consumer.ts"));
      assert.ok(consumerContent.includes("gen/index.ts"));
      assert.ok(!consumerContent.includes("gen/icons.ts"));
    });
  });

  describe("default-multi-source fixture", () => {
    test("rewrites default import to first matching source only", async (t) => {
      const fixtureDir = await copyFixture(t, "default-multi-source");

      const result = await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        write: true,
      });

      assert.ok(result.deleted.length > 0);
      assert.ok(result.modified.length > 0);

      const consumerContent = await read(join(fixtureDir, "consumer.ts"));
      assert.ok(consumerContent.includes('import LoadingBar from "./LoadingBar"'));
      assert.ok(!consumerContent.includes("useLoadingBar"));
    });

    test("does not create duplicate default imports", async (t) => {
      const fixtureDir = await copyFixture(t, "default-multi-source");

      await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        write: true,
      });

      const consumerContent = await read(join(fixtureDir, "consumer.ts"));
      const importMatches = consumerContent.match(/^import LoadingBar/gm);
      assert.equal(importMatches?.length, 1);
    });
  });

  describe("default-as-alias fixture", () => {
    test("rewrites { default as X } to default import with alias name", async (t) => {
      const fixtureDir = await copyFixture(t, "default-as-alias");

      const result = await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        write: true,
      });

      assert.ok(result.deleted.length > 0);
      assert.ok(result.modified.length > 0);

      const consumerContent = await read(join(fixtureDir, "consumer.ts"));
      assert.ok(consumerContent.includes('import ChatComposer from "./Composer"'));
      assert.ok(!consumerContent.includes("default as"));
      assert.ok(!consumerContent.includes("import type from"));
    });
  });

  describe("external-consumer fixture", () => {
    test("preserves barrels with non-TS consumers", async (t) => {
      const fixtureDir = await copyFixture(t, "external-consumer");

      const result = await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        write: true,
      });

      const preservedBarrel = result.preserved.find((p) => p.path.includes("errors/index.ts"));
      assert.ok(preservedBarrel);
      assert.equal(preservedBarrel.reason, "non-ts-import");
      assert.ok(preservedBarrel.consumers?.some((c) => c.endsWith(".astro")));
    });

    test("rewrites TS consumers but preserves barrel for non-TS consumers", async (t) => {
      const fixtureDir = await copyFixture(t, "external-consumer");

      const result = await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        write: true,
      });

      const modifiedConsumer = result.modified.find((f) => f.endsWith("consumer.ts"));
      assert.ok(modifiedConsumer);

      const consumerContent = await read(join(fixtureDir, "src/consumer.ts"));
      assert.ok(consumerContent.includes("./errors/errors"));
      assert.ok(!consumerContent.includes("./errors/index"));

      const barrelExists = await read(join(fixtureDir, "src/errors/index.ts")).then(
        () => true,
        () => false,
      );
      assert.ok(barrelExists);
    });
  });

  describe("organize-imports fixture", () => {
    test("merges duplicate imports from same module", async (t) => {
      const fixtureDir = await copyFixture(t, "organize-imports");

      const result = await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        write: true,
        organizeImports: true,
      });

      assert.ok(result.modified.some((f) => f.endsWith("consumer.ts")));

      const consumerContent = await read(join(fixtureDir, "consumer.ts"));

      assert.ok(consumerContent.includes("foo") && consumerContent.includes("bar"));
      assert.ok(!consumerContent.includes("./index"));

      const importLines = consumerContent.split("\n").filter((line) => line.startsWith("import "));
      const utilsImports = importLines.filter((line) => line.includes("./utils"));
      assert.equal(utilsImports.length, 1);
    });

    test("does not duplicate leading comments", async (t) => {
      const fixtureDir = await copyFixture(t, "organize-imports");

      await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        write: true,
        organizeImports: true,
      });

      const consumerContent = await read(join(fixtureDir, "consumer.ts"));

      const eslintCommentCount = (consumerContent.match(/eslint-disable/g) || []).length;
      assert.equal(eslintCommentCount, 1);
    });

    test("preserves file when organizeImports is false", async (t) => {
      const fixtureDir = await copyFixture(t, "organize-imports");

      const result = await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        write: true,
        organizeImports: false,
      });

      assert.ok(result.modified.some((f) => f.endsWith("consumer.ts")));

      const consumerContent = await read(join(fixtureDir, "consumer.ts"));

      const importLines = consumerContent.split("\n").filter((line) => line.startsWith("import "));
      const utilsImports = importLines.filter((line) => line.includes("./utils"));
      assert.equal(utilsImports.length, 2);
    });
  });

  describe("barrel-imports-barrel fixture", () => {
    test("preserves outer barrel (non-TS consumer) and inner barrel it depends on", async (t) => {
      const fixtureDir = await copyFixture(t, "barrel-imports-barrel");

      const result = await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        write: true,
      });

      const preservedOuter = result.preserved.find((p) => p.path.includes("outer/index.ts"));
      assert.ok(preservedOuter);
      assert.equal(preservedOuter.reason, "non-ts-import");

      const preservedInner = result.preserved.find((p) => p.path.includes("inner/index.ts"));
      assert.ok(preservedInner);
    });

    test("rewrites regular TS consumer but keeps both barrels", async (t) => {
      const fixtureDir = await copyFixture(t, "barrel-imports-barrel");

      const result = await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        write: true,
      });

      const modifiedConsumer = result.modified.find((f) => f.endsWith("consumer.ts"));
      assert.ok(modifiedConsumer);

      const consumerContent = await read(join(fixtureDir, "src/consumer.ts"));
      assert.ok(consumerContent.includes("./inner/impl"));
      assert.ok(!consumerContent.includes("./inner/index"));

      const innerBarrelExists = await read(join(fixtureDir, "src/inner/index.ts")).then(
        () => true,
        () => false,
      );
      assert.ok(innerBarrelExists);

      const outerBarrelExists = await read(join(fixtureDir, "src/outer/index.ts")).then(
        () => true,
        () => false,
      );
      assert.ok(outerBarrelExists);
    });
  });

  describe("specifier-extras fixture", () => {
    test("preserves webpack loader prefix in rewritten imports", async (t) => {
      const fixtureDir = await copyFixture(t, "specifier-extras");

      const result = await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        write: true,
      });

      assert.ok(result.modified.some((f) => f.endsWith("consumer.ts")));
      assert.ok(result.deleted.some((f) => f.endsWith("index.ts")));

      const consumerContent = await read(join(fixtureDir, "consumer.ts"));
      assert.ok(consumerContent.includes('from "!!type-loader!./utils"'));
    });

    test("preserves query suffix in imports (not rewritten but kept intact)", async (t) => {
      const fixtureDir = await copyFixture(t, "specifier-extras");

      await unbarrelify({
        cwd: fixtureDir,
        files: ["**/*.ts"],
        skip: [],
        write: true,
      });

      const consumerContent = await read(join(fixtureDir, "consumer.ts"));
      assert.ok(consumerContent.includes('./utils?raw"'));
    });
  });
});
