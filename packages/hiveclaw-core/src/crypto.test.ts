import test from "node:test";
import assert from "node:assert/strict";
import { decryptHivePayload, encryptHivePayload, parseHiveKeyHex } from "./crypto.js";

test("hive AES-GCM roundtrip", () => {
  const keyHex =
    "0x0000000000000000000000000000000000000000000000000000000000000001".repeat(1);
  const wrong =
    "0x0101010101010101010101010101010101010101010101010101010101010101";
  const key = parseHiveKeyHex(keyHex);
  const pt = new TextEncoder().encode("hello hive memory α");
  const ct = encryptHivePayload(pt, key);
  assert.notDeepEqual(Buffer.from(ct), Buffer.from(pt));
  assert.deepEqual(decryptHivePayload(ct, key), pt);
  assert.throws(() => decryptHivePayload(ct, parseHiveKeyHex(wrong)));
});
