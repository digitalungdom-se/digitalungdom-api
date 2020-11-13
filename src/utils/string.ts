import { randomBytes } from "crypto";

export function randomBase62String(length: number): string {
  let string = randomBytes(length)
    .toString("base64")
    .replace(/[+.=/]/g, "")
    .substring(0, length);

  while (string.length < length) {
    string = string + randomBase62String(length - string.length);
  }

  return string;
}

export function randomBase58String(digits = 0): string {
  const base58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz".split("");

  let result = "";
  let char;

  while (result.length < digits) {
    char = base58[(Math.random() * 57) >> 0];

    if (result.indexOf(char) === -1) {
      result += char;
    }
    if (result.indexOf("Qm") > -1) {
      result = "";
    }
  }

  return result;
}
