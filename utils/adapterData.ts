import type { AdapterExport } from "./adapter.ts";

import * as path from "@std/path";
import { walk } from "@std/fs";

const getAdapters = async (): Promise<{
  [name: string]: AdapterExport;
}> => {
  const adapters = (
    await Array.fromAsync(
      walk(path.join(import.meta.dirname, "../", "adapters"), {
        includeFiles: true,
        includeDirs: false,
      })
    )
  ).map((x) => path.basename(x.path, ".ts"));

  const adapterImports: AdapterExport[] = await Promise.all(
    adapters.map(
      async (adapter) => (await import(`./../adapters/${adapter}.ts`)).default
    )
  );

  return Object.fromEntries(adapters.map((k, i) => [k, adapterImports[i]]));
};

export default await getAdapters();
