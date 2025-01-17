import { bech32 } from 'bech32';

/**
 * Validates if the given address is a Bech32 address with the 'sei' prefix.
 * @param {string} address - The address to validate.
 * @returns {boolean} - True if the address is a valid Bech32 address with the 'sei' prefix, otherwise false.
 */
export function isBech32Address(address) {
  try {
    const decoded = bech32.decode(address);
    const isValid = decoded.prefix === 'sei' && decoded.words.length > 0;
    console.log(`isBech32Address: Address "${address}" validation result: ${isValid}`);
    return isValid;
  } catch (err) {
    console.warn(`isBech32Address: Invalid Bech32 address "${address}". Error: ${err.message}`);
    return false;
  }
}

/**
 * Validates if the given address is a Hex address.
 * @param {string} address - The address to validate.
 * @returns {boolean} - True if the address is a valid Hex address, otherwise false.
 */
export function isHexAddress(address) {
  const isValid = /^0x[a-fA-F0-9]{40}$/.test(address);
  console.log(`isHexAddress: Address "${address}" validation result: ${isValid}`);
  return isValid;
}
