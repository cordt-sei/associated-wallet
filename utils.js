import { bech32 } from 'bech32';

export function isBech32Address(address) {
  try {
    const decoded = bech32.decode(address);
    return decoded.prefix === 'sei' && decoded.words.length > 0;
  } catch (err) {
    return false; // Invalid Bech32 or checksum fails
  }
}

export function isHexAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
