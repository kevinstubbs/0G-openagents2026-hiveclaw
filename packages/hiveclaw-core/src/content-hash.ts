import { keccak256, toUtf8Bytes } from "ethers";

/** Plaintext bytes → bytes32 content hash stored on-chain (matches Solidity keccak256). */
export function hashPlaintextUtf8(text: string): string {
  return keccak256(toUtf8Bytes(text));
}

export function hashPlaintextBytes(data: Uint8Array): string {
  return keccak256(data);
}
