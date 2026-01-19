import { dirname, join, resolve } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import ts from "typescript";
import { JS_EXT_PATTERN } from "./constants.ts";

interface EntryPointData {
  resolvedPaths: Set<string>;
  sourcePatterns: Set<string>;
}

interface TsConfigDirs {
  outDir?: string;
  rootDir?: string;
}

export function createEntryPointChecker(): (filePath: string) => boolean {
  const pkgCache = new Map<string, Record<string, unknown> | null>();
  const tsconfigCache = new Map<string, TsConfigDirs | null>();
  const entryPointCache = new Map<string, EntryPointData>();

  function readPackageJson(filePath: string): Record<string, unknown> | null {
    const cached = pkgCache.get(filePath);
    if (cached !== undefined) return cached;

    let result: Record<string, unknown> | null = null;
    try {
      result = JSON.parse(readFileSync(filePath, "utf-8"));
    } catch {}

    pkgCache.set(filePath, result);
    return result;
  }

  function readTsConfigDirs(pkgDir: string): TsConfigDirs | null {
    const cached = tsconfigCache.get(pkgDir);
    if (cached !== undefined) return cached;

    const tsconfigPath = join(pkgDir, "tsconfig.json");
    let result: TsConfigDirs | null = null;

    if (existsSync(tsconfigPath)) {
      const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
      if (!configFile.error) {
        const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, pkgDir);
        result = { outDir: parsed.options.outDir, rootDir: parsed.options.rootDir };
      }
    }

    tsconfigCache.set(pkgDir, result);
    return result;
  }

  function collectExportPaths(
    exports: unknown,
    pkgDir: string,
    outDir: string | null,
    rootDir: string,
    data: EntryPointData,
  ): void {
    if (typeof exports === "string") {
      if (exports.includes("*")) return;
      addEntryPoint(resolve(pkgDir, exports), outDir, rootDir, data);
      return;
    }

    if (typeof exports === "object" && exports !== null) {
      for (const value of Object.values(exports)) {
        collectExportPaths(value, pkgDir, outDir, rootDir, data);
      }
    }
  }

  function collectPackageEntryPoints(pkgDir: string, pkg: Record<string, unknown>): EntryPointData {
    const data: EntryPointData = { resolvedPaths: new Set(), sourcePatterns: new Set() };
    const tsconfig = readTsConfigDirs(pkgDir);
    const outDir = tsconfig?.outDir ?? null;
    const rootDir = tsconfig?.rootDir ?? join(pkgDir, "src");

    if (pkg.exports) {
      collectExportPaths(pkg.exports, pkgDir, outDir, rootDir, data);
    }
    if (typeof pkg.main === "string") {
      addEntryPoint(resolve(pkgDir, pkg.main), outDir, rootDir, data);
    }
    if (typeof pkg.module === "string") {
      addEntryPoint(resolve(pkgDir, pkg.module), outDir, rootDir, data);
    }

    return data;
  }

  function getPackageEntryPoints(pkgDir: string): EntryPointData | null {
    const cached = entryPointCache.get(pkgDir);
    if (cached) return cached;

    const pkg = readPackageJson(join(pkgDir, "package.json"));
    if (!pkg) return null;

    const data = collectPackageEntryPoints(pkgDir, pkg);
    entryPointCache.set(pkgDir, data);
    return data;
  }

  return function isPackageEntryPoint(filePath: string): boolean {
    let dir = dirname(filePath);
    while (dir !== dirname(dir)) {
      const data = getPackageEntryPoints(dir);
      if (!data) {
        dir = dirname(dir);
        continue;
      }
      if (data.resolvedPaths.has(filePath)) return true;
      for (const pattern of data.sourcePatterns) {
        if (matchesPattern(filePath, pattern)) return true;
      }
      return false;
    }
    return false;
  };
}

function matchesPattern(filePath: string, pattern: string): boolean {
  const base = filePath.replace(JS_EXT_PATTERN, "");
  return pattern === base + ".*";
}

function addEntryPoint(filePath: string, outDir: string | null, rootDir: string, data: EntryPointData): void {
  data.resolvedPaths.add(filePath);

  if (outDir && filePath.startsWith(outDir + "/")) {
    const relPath = filePath.slice(outDir.length + 1);
    const srcPath = join(rootDir, relPath);
    const base = srcPath.replace(JS_EXT_PATTERN, "");
    data.sourcePatterns.add(base + ".*");
  }
}
