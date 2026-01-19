import { join, resolve, dirname } from "./index.ts";

const fullPath = join("/home", "user", "documents");
const absolutePath = resolve(".", "src", "index.ts");
const dir = dirname("/home/user/file.txt");

export { fullPath, absolutePath, dir };
