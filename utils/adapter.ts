import type { AddressType } from "./address.ts";

import { convertValuesToInt, convertValuesToNormal } from "./object.ts";
import { detectAddressType } from "./address.ts";

type LabelledPoints = { [label: string]: number };
type DetailedData = { [key: string]: string | number };
type LabelledDetailedData = { [label: string]: DetailedData };
type DeprecatedLabels = { [label: string]: number };
// An adapter exporting a points function (address: string) -> number
// or exporting function (address: string): {label1: number, label2: number, ...}
type AdapterExport<T = object> = {
  fetch: (address: string) => Promise<T>;
  data: (data: T) => DetailedData | LabelledDetailedData;
  total: (data: T) => number | LabelledPoints;
  claimable?: (data: T) => boolean;
  rank?: (data: T) => number;
  deprecated?: (data: T) => DeprecatedLabels;
  supportedAddressTypes: AddressType[];
};

type AdapterResult<T = object> = {
  __data: T;
  data: DetailedData | LabelledDetailedData;
  total: number | LabelledPoints;
  claimable?: boolean;
  rank?: number;
  deprecated?: DeprecatedLabels;
  supportedAddressTypes: AddressType[];
};

const runAdapter = async (adapter: AdapterExport, address: string) => {
  const addressType = detectAddressType(address);
  if (!addressType) {
    throw new Error(
      `Invalid address "${address}".` +
        "Only EVM (0x...) and SVM (base58) addresses are supported."
    );
  }

  const supported = adapter.supportedAddressTypes;
  if (!supported.includes(addressType)) {
    throw new Error(
      `Adapter does not support "${addressType}" addresses.` +
        `Supported types are: ${supported.join(", ")}.`
    );
  }

  const data = await adapter.fetch(address);

  const ret: AdapterResult = {
    __data: data,
    data: adapter.data(data),
    total: adapter.total(data),
    supportedAddressTypes: adapter.supportedAddressTypes,
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
  type LabelledDetailedData,
  type DeprecatedLabels,
  type LabelledPoints,
  type AdapterExport,
  type AdapterResult,
  type DetailedData,
  type AddressType,
  runAdapter,
  detectAddressType,
};
