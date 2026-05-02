import { Indexer, ZgFile } from "@0gfoundation/0g-storage-ts-sdk";
import { JsonRpcProvider, Wallet } from "ethers";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { HiveclawConfig } from "./config.js";

/** Upload arbitrary bytes as a file; returns root hash from indexer (bytes32-compatible hex). */
export async function uploadBlob(
  cfg: Pick<HiveclawConfig, "rpcUrl" | "indexerUrl" | "storagePrivateKey">,
  data: Uint8Array,
): Promise<{ rootHash: string; txHash: string }> {
  const pk = cfg.storagePrivateKey;
  if (!pk) throw new Error("HIVECLAW_STORAGE_PRIVATE_KEY is required for uploads");

  let dir: string | undefined;
  try {
    const provider = new JsonRpcProvider(cfg.rpcUrl);
    const wallet = new Wallet(pk, provider);
    dir = await mkdtemp(join(tmpdir(), "hiveclaw-blob-"));
    const inPath = join(dir, "blob.bin");
    await writeFile(inPath, Buffer.from(data));

    const file = await ZgFile.fromFilePath(inPath);
    try {
      const indexer = new Indexer(cfg.indexerUrl);
      const [uploaded, err] = await indexer.upload(file, cfg.rpcUrl, wallet as never);
      if (err !== null) {
        throw new Error(err.message ?? String(err));
      }
      const rootHash =
        "rootHash" in uploaded ? uploaded.rootHash : uploaded.rootHashes[0]!;
      const txHash = "txHash" in uploaded ? uploaded.txHash : uploaded.txHashes[0]!;
      return { rootHash, txHash };
    } finally {
      await file.close();
    }
  } finally {
    if (dir) await rm(dir, { recursive: true, force: true });
  }
}

/** Download blob bytes by storage root hash. */
export async function downloadBlob(
  cfg: Pick<HiveclawConfig, "indexerUrl">,
  rootHash: string,
): Promise<Uint8Array> {
  let dir: string | undefined;
  try {
    dir = await mkdtemp(join(tmpdir(), "hiveclaw-dl-"));
    const outPath = join(dir, "out.bin");
    const indexer = new Indexer(cfg.indexerUrl);
    const err = await indexer.download(rootHash, outPath, false);
    if (err !== null) throw new Error(err.message ?? String(err));
    const buf = await readFile(outPath);
    return new Uint8Array(buf);
  } finally {
    if (dir) await rm(dir, { recursive: true, force: true });
  }
}

/** Ensure indexer root hash is a 32-byte hex string for HiveRegistry. */
export function rootHashToStoragePointer(rootHash: string): string {
  const h = rootHash.trim();
  if (!/^0x[0-9a-fA-F]{64}$/.test(h)) {
    throw new Error(`storage root hash must be bytes32 hex, got: ${rootHash.slice(0, 20)}…`);
  }
  return h.toLowerCase();
}
