const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const ALPHABET_MAP = new Map();
for (let i = 0; i < ALPHABET.length; i++) {
  ALPHABET_MAP.set(ALPHABET[i], BigInt(i));
}

export function encodeBase58(buffer) {
  if (!buffer || buffer.length === 0) return "";
  const bytes = Buffer.from(buffer);
  let x = BigInt(0);
  for (let i = 0; i < bytes.length; i++) {
    x = (x << BigInt(8)) + BigInt(bytes[i]);
  }

  let result = "";
  while (x > BigInt(0)) {
    const mod = x % BigInt(58);
    x = x / BigInt(58);
    result = ALPHABET[Number(mod)] + result;
  }

  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    result = "1" + result;
  }
  return result;
}

export function decodeBase58(str) {
  if (!str || str.length === 0) return Buffer.alloc(0);
  let x = BigInt(0);
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const val = ALPHABET_MAP.get(char);
    if (val === undefined) {
      throw new Error(`Invalid Base58 character: ${char}`);
    }
    x = x * BigInt(58) + val;
  }

  const bytes = [];
  while (x > BigInt(0)) {
    bytes.unshift(Number(x & BigInt(0xff)));
    x = x >> BigInt(8);
  }

  for (let i = 0; i < str.length && str[i] === "1"; i++) {
    bytes.unshift(0);
  }
  return Buffer.from(bytes);
}
