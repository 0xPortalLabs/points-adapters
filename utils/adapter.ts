import { convertValuesToInt, convertValuesToNormal } from "./object.ts";

type LabelledPoints = { [label: string]: number };
type DetailedData = { [key: string]: string | number };
type LabelledDetailedData = { [label: string]: DetailedData };
type DeprecatedLabels = { [label: string]: number };
type Caip19 = {
  [asset: string]: { amount: bigint; symbol: string; decimals: number };
};
// An adapter exporting a points function (address: string) -> number
// or exporting function (address: string): {label1: number, label2: number, ...}
type AdapterExport<T = object> = {
  fetch: (address: string) => Promise<T>;
  data: (data: T) => DetailedData | LabelledDetailedData;
  total: (data: T) => number | LabelledPoints;
  claimable?: (data: T) => boolean;
  rank?: (data: T) => number;
  reward?: (data: T) => Caip19;
  deprecated?: (data: T) => DeprecatedLabels;
};

type AdapterResult<T = object> = {
  __data: T;
  data: DetailedData | LabelledDetailedData;
  total: number | LabelledPoints;
  claimable?: boolean;
  rank?: number;
  reward?: Caip19;
  deprecated?: DeprecatedLabels;
};

const runAdapter = async (adapter: AdapterExport, address: string) => {
  const data = await adapter.fetch(address);

  const ret: AdapterResult = {
    __data: data,
    data: adapter.data(data),
    total: adapter.total(data),
  };

  if (adapter.claimable) ret.claimable = adapter.claimable(data);
  if (adapter.rank) ret.rank = adapter.rank(data);
  if (adapter.deprecated) ret.deprecated = adapter.deprecated(data);

  ret.data = convertValuesToNormal(ret.data);
  ret.total =
    typeof ret.total !== "object" || !ret.total
      ? parseFloat(String(ret.total)) || 0
      : convertValuesToInt(ret.total);
  ret.claimable = Boolean(ret.claimable);
  ret.rank = Number(ret.rank) || 0;
  ret.deprecated = ret.deprecated ? convertValuesToInt(ret.deprecated) : {};

  return ret;
};

const runAllAdapters = async (
  adapters: Record<string, AdapterExport>,
  address: string
) => {
  const results = await Promise.allSettled(
    Object.values(adapters).map((x) => runAdapter(x, address))
  );

  return Object.fromEntries(
    Object.keys(adapters).map((k, i) => {
      const res = results[i];

      if (res.status === "fulfilled") {
        return [k, res.value];
      } else {
        console.log(`${k} adapter failed with: ${res.reason}`);
        return [k, undefined];
      }
    })
  );
};

// gravity 0xbd3603df246658369c707c30e041a89feb6ee153
// 0x0a66d5927ffc0ee2e38a15f16f8949e697c4f439
// 0x3c2573b002cf51e64ab6d051814648eb3a305363
/*const res = await runAllAdapters("0x0a66d5927ffc0ee2e38a15f16f8949e697c4f439");
console.log("0xbd3603df246658369c707c30e041a89feb6ee153");
const x = Object.fromEntries(
  Object.entries(res).map(([k, v]) => [k, v?.total])
);
console.log(x); */

export {
  type AdapterExport,
  type AdapterResult,
  type DetailedData,
  type LabelledDetailedData,
  type LabelledPoints,
  type DeprecatedLabels,
  runAdapter,
  runAllAdapters,
};
