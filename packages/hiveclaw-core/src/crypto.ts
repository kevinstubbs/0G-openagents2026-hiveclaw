import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const VERSION = 1;

/** Load a 32-byte symmetric hive key from 64 hex chars (optional 0x prefix). */
export function parseHiveKeyHex(hex: string): Uint8Array {
  const h = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (!/^[0-9a-fA-F]{64}$/.test(h)) {
    throw new Error("hive key must be 32 bytes as hex (64 hex chars, optional 0x)");
  }
  return new Uint8Array(Buffer.from(h, "hex"));
}

/**
 * Binary envelope: `[version:1][iv:12][tag:16][ciphertext]` using AES-256-GCM.
 */
export function encryptHivePayload(plaintext: Uint8Array, key32: Uint8Array): Uint8Array {
  if (key32.length !== 32) throw new Error("hive key must be 32 bytes");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", Buffer.from(key32), iv);
  const ct = Buffer.concat([cipher.update(Buffer.from(plaintext)), cipher.final()]);
  const tag = cipher.getAuthTag();
  return new Uint8Array(Buffer.concat([Buffer.from([VERSION]), iv, tag, ct]));
}

export function decryptHivePayload(blob: Uint8Array, key32: Uint8Array): Uint8Array {
  if (key32.length !== 32) throw new Error("hive key must be 32 bytes");
  if (blob.length < 1 + 12 + 16 + 1) throw new Error("ciphertext too short");
  const buf = Buffer.from(blob);
  const ver = buf.readUInt8(0);
  if (ver !== VERSION) throw new Error(`unsupported hive crypto version ${ver}`);
  const iv = buf.subarray(1, 13);
  const tag = buf.subarray(13, 29);
  const ct = buf.subarray(29);
  const decipher = createDecipheriv("aes-256-gcm", Buffer.from(key32), iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return new Uint8Array(pt);
}
