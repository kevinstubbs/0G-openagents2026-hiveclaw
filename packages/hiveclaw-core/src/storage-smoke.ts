import { Indexer, ZgFile } from "@0gfoundation/0g-storage-ts-sdk";
import { JsonRpcProvider, Wallet } from "ethers";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { HiveclawConfig } from "./config.js";

export type StorageSmokeResult =
  | { ok: true; rootHash: string; txHash: string; verified: boolean }
  | { ok: false; skipped?: boolean; reason: string; detail?: string };

/** Tiny upload + download round-trip against 0G Storage (requires a funded key). */
export async function runStorageSmoke(cfg: HiveclawConfig): Promise<StorageSmokeResult> {
  if (!cfg.storagePrivateKey) {
    return {
      ok: false,
      skipped: true,
      reason: "Storage smoke skipped: set HIVECLAW_STORAGE_PRIVATE_KEY to run upload/download proof.",
    };
  }

  let dir: string | undefined;
  try {
    const provider = new JsonRpcProvider(cfg.rpcUrl);
    const wallet = new Wallet(cfg.storagePrivateKey, provider);
    dir = await mkdtemp(join(tmpdir(), "hiveclaw-smoke-"));
    const inPath = join(dir, "in.bin");
    const payload = `hiveclaw phase1 ${Date.now()}`;
    await writeFile(inPath, payload, "utf8");

    const file = await ZgFile.fromFilePath(inPath);
    try {
      const indexer = new Indexer(cfg.indexerUrl);
      // 0g-storage-ts-sdk types reference ethers CommonJS Signer; our Wallet is ESM — runtime is compatible.
      const [uploaded, err] = await indexer.upload(file, cfg.rpcUrl, wallet as never);
      if (err !== null) {
        return {
          ok: false,
          reason: "0G Storage upload failed.",
          detail: err.message ?? String(err),
        };
      }
      const first =
        "rootHash" in uploaded ? uploaded.rootHash : uploaded.rootHashes[0]!;
      const txFirst = "txHash" in uploaded ? uploaded.txHash : uploaded.txHashes[0]!;
      const outPath = join(dir, "out.bin");
      const dlErr = await indexer.download(first, outPath, false);
      if (dlErr !== null) {
        return {
          ok: false,
          reason: "0G Storage download failed.",
          detail: dlErr.message ?? String(dlErr),
        };
      }
      const roundTrip = await readFile(outPath, "utf8");
      return {
        ok: true,
        rootHash: first,
        txHash: txFirst,
        verified: roundTrip === payload,
      };
    } finally {
      await file.close();
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, reason: "Storage smoke error.", detail: msg };
  } finally {
    if (dir) await rm(dir, { recursive: true, force: true });
  }
}
