import { startCase } from "lodash-es";

const convertValuesToInt = (
  obj: Record<string, string | number>
): Record<string, number> => {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      typeof v === "number" ? v : parseFloat(v),
    ])
  );
};

const convertValuesToNormal = <T extends string | number | Record<string, T>>(
  obj: Record<string, T | Record<string, T>>
): Record<string, string | number> => {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([_k, v]) => v !== undefined)
      .map(([k, v]) => [
        k,
        typeof v === "string" && !isNaN(Number(v))
          ? Number(v)
          : typeof v === "number"
            ? v
            : v && typeof v === "object" && !Array.isArray(v)
              ? convertValuesToNormal(v)
              : v,
      ])
  ) as Record<string, string | number>;
};

const convertKeysToStartCase = <T>(
  obj: Record<string, T>
): Record<string, T> => {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      startCase(k),
      v && typeof v === "object" && !Array.isArray(v)
        ? convertKeysToStartCase(v)
        : v,
    ])
  );
};

export { convertValuesToNormal, convertValuesToInt, convertKeysToStartCase };
