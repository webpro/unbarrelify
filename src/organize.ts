import ts from "typescript";
import { printNode } from "./printer.ts";

export function organizeImports(content: string, filePath: string): string {
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest);
  const groups = new Map<string, ts.ImportDeclaration[]>();
  let firstPos = -1;
  let lastEnd = -1;

  for (const stmt of sourceFile.statements) {
    if (!ts.isImportDeclaration(stmt) || !ts.isStringLiteral(stmt.moduleSpecifier)) continue;
    const specifier = stmt.moduleSpecifier.text;
    const group = groups.get(specifier);
    if (group) group.push(stmt);
    else groups.set(specifier, [stmt]);
    if (firstPos === -1) firstPos = stmt.getFullStart();
    lastEnd = stmt.end;
  }

  let needsOrganize = false;
  for (const group of groups.values()) {
    if (group.length > 1) {
      needsOrganize = true;
      break;
    }
  }
  if (!needsOrganize) return content;

  const organized: string[] = [];
  for (const group of groups.values()) {
    // @ts-expect-error testCoalesceImports internal fn
    for (const imp of ts.OrganizeImports.testCoalesceImports(group, false, sourceFile, {})) {
      organized.push(printNode(imp, sourceFile));
    }
  }

  let endPos = lastEnd;
  while (endPos < content.length && (content[endPos] === "\n" || content[endPos] === "\r")) endPos++;

  return content.slice(0, firstPos) + organized.join("\n") + "\n" + content.slice(endPos);
}
