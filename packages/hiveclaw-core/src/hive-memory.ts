import type { HiveclawConfig } from "./config-types.js";
import { hashPlaintextUtf8 } from "./content-hash.js";
import { decryptHivePayload, encryptHivePayload, parseHiveKeyHex } from "./crypto.js";
import { commitMemory, getLatestMemory, memoryKeyFromString, type MemoryCommitView } from "./hive-registry.js";
import { privateLogicalPath, sharedLogicalPath } from "./memory-paths.js";
import { downloadBlob, rootHashToStoragePointer, uploadBlob } from "./storage-blob.js";

export type PutHiveMemoryInput = {
  cfg: HiveclawConfig;
  hiveId: bigint;
  /** UTF-8 payload committed as plaintext hash on-chain. */
  plaintext: string;
  /** 32-byte hex hive symmetric key. */
  hiveKeyHex: string;
  /** Relative segment after shared/ or private/.../ */
  segment: string;
  scope: "shared" | "private";
  agentAddress: string;
  keyVersion?: bigint;
  metadataURI?: string;
};

export async function putHiveMemory(input: PutHiveMemoryInput): Promise<{
  txHash: string;
  memoryKeyHex: string;
  logicalPath: string;
  rootHash: string;
  contentHash: string;
}> {
  const keyVersion = input.keyVersion ?? 0n;
  const metadataURI = input.metadataURI ?? "";
  const logicalPath =
    input.scope === "shared"
      ? sharedLogicalPath(input.segment)
      : privateLogicalPath(input.agentAddress, input.segment);
  const memKey = memoryKeyFromString(logicalPath);
  const hiveKey = parseHiveKeyHex(input.hiveKeyHex);
  const ptBytes = new TextEncoder().encode(input.plaintext);
  const ciphertext = encryptHivePayload(ptBytes, hiveKey);
  const contentHash = hashPlaintextUtf8(input.plaintext);

  const { rootHash } = await uploadBlob(input.cfg, ciphertext);
  const pointer = rootHashToStoragePointer(rootHash);

  const reg = input.cfg.hiveRegistryContract;
  const pk = input.cfg.chainPrivateKey;
  if (!reg) throw new Error("hiveRegistryContract required");
  if (!pk) throw new Error("chainPrivateKey required for commitMemory");

  const tx = await commitMemory(
    input.cfg.rpcUrl,
    reg,
    pk,
    input.hiveId,
    memKey,
    pointer,
    contentHash,
    keyVersion,
    metadataURI,
  );
  const receipt = await tx.wait();
  if (!receipt) throw new Error("commit not mined");
  return {
    txHash: receipt.hash,
    memoryKeyHex: memKey,
    logicalPath,
    rootHash,
    contentHash,
  };
}

export type GetHiveMemoryInput = {
  cfg: HiveclawConfig;
  hiveId: bigint;
  hiveKeyHex: string;
  /** Same segment used for put. */
  segment: string;
  scope: "shared" | "private";
  agentAddress: string;
};

export async function getHiveMemory(input: GetHiveMemoryInput): Promise<{
  plaintext: string;
  commit: MemoryCommitView;
  logicalPath: string;
}> {
  const logicalPath =
    input.scope === "shared"
      ? sharedLogicalPath(input.segment)
      : privateLogicalPath(input.agentAddress, input.segment);
  const memKey = memoryKeyFromString(logicalPath);
  const reg = input.cfg.hiveRegistryContract;
  if (!reg) throw new Error("hiveRegistryContract required");

  const commit = await getLatestMemory(input.cfg.rpcUrl, reg, input.hiveId, memKey);
  if (!commit.storagePointer || commit.storagePointer === "0x0000000000000000000000000000000000000000000000000000000000000000") {
    throw new Error(`no memory registered for path ${logicalPath}`);
  }

  const hiveKey = parseHiveKeyHex(input.hiveKeyHex);
  const blob = await downloadBlob(input.cfg, commit.storagePointer);
  const pt = decryptHivePayload(blob, hiveKey);
  const plaintext = new TextDecoder().decode(pt);
  const h = hashPlaintextUtf8(plaintext);
  if (h.toLowerCase() !== commit.contentHash.toLowerCase()) {
    throw new Error("content hash mismatch after decrypt — wrong hive key or tampered blob");
  }
  return { plaintext, commit, logicalPath };
}

/** Low-level: commit already encrypted blob + known hash (advanced). */
export async function putEncryptedMemoryRaw(input: {
  cfg: HiveclawConfig;
  hiveId: bigint;
  memoryKeyHex: string;
  ciphertext: Uint8Array;
  plaintextUtf8ForHash: string;
}): Promise<{ txHash: string; rootHash: string }> {
  const contentHash = hashPlaintextUtf8(input.plaintextUtf8ForHash);
  const { rootHash } = await uploadBlob(input.cfg, input.ciphertext);
  const pointer = rootHashToStoragePointer(rootHash);
  const reg = input.cfg.hiveRegistryContract;
  const pk = input.cfg.chainPrivateKey;
  if (!reg || !pk) throw new Error("registry + chainPrivateKey required");
  const tx = await commitMemory(
    input.cfg.rpcUrl,
    reg,
    pk,
    input.hiveId,
    input.memoryKeyHex,
    pointer,
    contentHash,
    0n,
    "",
  );
  const receipt = await tx.wait();
  if (!receipt) throw new Error("commit not mined");
  return { txHash: receipt.hash, rootHash };
}
