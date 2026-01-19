import { join, resolve, dirname, ScriptTarget, ModuleKind } from "./index.ts";

const fullPath = join("/home", "user", "documents");
const absolutePath = resolve(".", "src", "index.ts");
const dir = dirname("/home/user/file.txt");

const target = ScriptTarget.Latest;
const moduleKind = ModuleKind.ESNext;

export { fullPath, absolutePath, dir, target, moduleKind };
