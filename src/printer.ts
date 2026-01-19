import ts from "typescript";

const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

export const printNode = (node: ts.Node, sourceFile: ts.SourceFile) =>
  printer.printNode(ts.EmitHint.Unspecified, node, sourceFile);
