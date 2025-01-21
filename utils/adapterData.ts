import type { AdapterExport } from "./adapter.ts";

import * as path from "@std/path";
import { walk } from "@std/fs";

const ADAPTERS_PATH = path.join(import.meta.dirname ?? "", "../", "adapters/");

const getAdapters = async (): Promise<Array<string>> => {
  const adapters = (
    await Array.fromAsync(
      walk(ADAPTERS_PATH, {
        includeFiles: true,
        includeDirs: false,
      })
    )
  ).map((x) => path.basename(x.path, ".ts"));

  // TODO: Dynamic imports do not work in deno deploy due to eszip.
  /*
  const adapterImports: AdapterExport[] = await Promise.all(
    adapters.map(
      async (adapter) =>
        (
          await import(path.join(ADAPTERS_PATH, `${adapter}.ts`))
        ).default
    )
  );
  return Object.fromEntries(adapters.map((k, i) => [k, adapterImports[i]]));
  */

  return adapters;
};

export default await getAdapters();
