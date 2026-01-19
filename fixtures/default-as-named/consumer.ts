import { vitePluginAstroServer, helperFn } from "./index.ts";

const plugin = vitePluginAstroServer();
console.log(plugin.name, helperFn());
