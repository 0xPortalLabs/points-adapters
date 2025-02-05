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

const convertValuesToNormal = (
  obj: Record<string, string | number | undefined>
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
          : v,
      ])
  ) as Record<string, string | number>;
};

export { convertValuesToNormal, convertValuesToInt };
