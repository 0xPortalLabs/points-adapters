type AddressType = "evm" | "svm";

const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const SVM_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]+$/;
const SVM_MIN_LENGTH = 32;
const SVM_MAX_LENGTH = 44;

const isEvmAddress = (address: string): boolean =>
  EVM_ADDRESS_REGEX.test(address);

const isSvmAddress = (address: string): boolean =>
  address.length >= SVM_MIN_LENGTH &&
  address.length <= SVM_MAX_LENGTH &&
  SVM_ADDRESS_REGEX.test(address);

const detectAddressType = (address: string): AddressType | null => {
  if (isEvmAddress(address)) return "evm";
  if (isSvmAddress(address)) return "svm";
  return null;
};

/* Same as `detectAddressType` but throws on unidentified address type. */
const requireAddressType = (address: string): AddressType => {
  const x = detectAddressType(address);
  if (!x)
    throw new Error("Invalid address type, expected one of: ['evm', 'svm']");

  return x;
};

export {
  type AddressType,
  requireAddressType,
  detectAddressType,
  isEvmAddress,
  isSvmAddress,
};
