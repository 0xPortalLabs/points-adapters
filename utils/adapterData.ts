import type { AdapterExport } from "./adapter.ts";

import * as path from "@std/path";
import { walk } from "@std/fs";

const ADAPTERS_PATH = path.join(import.meta.dirname ?? "", "../", "adapters/");

const getAdapters = async (): Promise<Record<string, AdapterExport>> => {
  const adapters = (
    await Array.fromAsync(
      walk(ADAPTERS_PATH, {
        includeFiles: true,
        includeDirs: false,
      })
    )
  ).map((x) => path.basename(x.path, ".ts"));

  const adapterImports: AdapterExport[] = await Promise.all(
    adapters.map(
      async (adapter) =>
        (
          await import(path.join(ADAPTERS_PATH, `${adapter}.ts`))
        ).default
    )
  );

  return Object.fromEntries(adapters.map((k, i) => [k, adapterImports[i]]));
};

export default await getAdapters();
