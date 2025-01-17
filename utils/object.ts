const convertValuesToInt = (
  obj: Record<string, string | number>
): Record<string, number> => {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      typeof v === "number" ? v : parseInt(v, 10),
    ])
  );
};

export { convertValuesToInt };
