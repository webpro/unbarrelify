import { dirname, join } from "node:path";
import { existsSync } from "node:fs";
import ts from "typescript";
import type { PathAliases } from "./types.ts";
import { JS_EXT_PATTERN } from "./constants.ts";
import { createEntryPointChecker } from "./entry.ts";

export interface ProjectConfig {
  aliases: PathAliases | null;
  files: string[];
  isPackageEntryPoint: (filePath: string) => boolean;
}

export function initProjectConfig(cwd: string): ProjectConfig {
  const tsconfigPath = findTsConfig(cwd);
  const parsed = tsconfigPath ? parseTsConfig(tsconfigPath) : null;
  const tsconfigDir = tsconfigPath ? dirname(tsconfigPath) : null;

  const aliases = parsed && tsconfigDir ? extractPathAliases(parsed, tsconfigDir) : null;
  const files = parsed?.fileNames ?? [];
  const isPackageEntryPoint = createEntryPointChecker();

  return { aliases, files, isPackageEntryPoint };
}

function findTsConfig(startDir: string): string | null {
  let dir = startDir;
  while (dir !== dirname(dir)) {
    const tsconfigPath = join(dir, "tsconfig.json");
    if (existsSync(tsconfigPath)) return tsconfigPath;
    dir = dirname(dir);
  }
  return null;
}

function parseTsConfig(tsconfigPath: string): ts.ParsedCommandLine | null {
  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  if (configFile.error) return null;

  return ts.parseJsonConfigFileContent(configFile.config, ts.sys, dirname(tsconfigPath));
}

function extractPathAliases(parsed: ts.ParsedCommandLine, tsconfigDir: string): PathAliases | null {
  const paths = parsed.options.paths;
  if (!paths) return null;

  return {
    baseUrl: parsed.options.baseUrl ?? tsconfigDir,
    paths,
  };
}

export function getExtensionFromSpecifier(specifier: string): string | null {
  const match = specifier.match(JS_EXT_PATTERN);
  return match ? match[0] : null;
}

export function tryMapToAlias(absolutePath: string, aliases: PathAliases, originalSpecifier: string): string | null {
  const originalUsedAlias = !originalSpecifier.startsWith(".") && !originalSpecifier.startsWith("/");
  if (!originalUsedAlias) return null;

  const sortedPatterns = Object.entries(aliases.paths).sort((a, b) => {
    const aPrefix = a[0].replace(/\*.*$/, "");
    const bPrefix = b[0].replace(/\*.*$/, "");
    return bPrefix.length - aPrefix.length;
  });

  for (const [pattern, targets] of sortedPatterns) {
    const patternRegex = new RegExp(`^${pattern.replace(/\*/g, "(.*)")}$`);
    const match = originalSpecifier.match(patternRegex);

    if (match && targets.length > 0) {
      const targetPattern = targets[0];
      const targetBase = targetPattern.replace(/\*.*$/, "");
      const resolvedTargetBase = join(aliases.baseUrl, targetBase);

      if (absolutePath.startsWith(resolvedTargetBase)) {
        const relativePart = absolutePath.slice(resolvedTargetBase.length);
        const withoutExt = relativePart.replace(JS_EXT_PATTERN, "");
        const aliasBase = pattern.replace(/\*.*$/, "");
        return aliasBase + withoutExt;
      }
    }
  }

  return null;
}
