import type { HiveclawConfig } from "./config-types.js";
import { getChainId, getLatestBlockNumber, readBootstrapContract } from "./chain.js";
import { readHiveRegistrySnapshot } from "./hive-registry.js";
import { runStorageSmoke, type StorageSmokeResult } from "./storage-smoke.js";

export type HiveclawPingResult = {
  chainId: string;
  blockNumber: string;
  chainIdNote?: string;
  bootstrap?: { ok: true; address: string; version: string; ping: string } | { ok: false; address: string; error: string };
  hiveRegistry?: { ok: true; address: string; version: string; nextHiveId: string } | { ok: false; address: string; error: string };
  storage: StorageSmokeResult;
};

/** Ping using an already-resolved config (no env reads). OpenClaw hosts call this after merging gateway JSON. */
export async function runPingWithResolvedConfig(cfg: HiveclawConfig): Promise<HiveclawPingResult> {
  const chainId = await getChainId(cfg.rpcUrl);
  const blockNumber = await getLatestBlockNumber(cfg.rpcUrl);

  let chainIdNote: string | undefined;
  if (cfg.expectedChainId !== undefined && chainId !== BigInt(cfg.expectedChainId)) {
    chainIdNote = `Expected chain id ${cfg.expectedChainId} but RPC reports ${chainId}.`;
  }

  let bootstrap: HiveclawPingResult["bootstrap"];
  if (cfg.bootstrapContract) {
    bootstrap = await readBootstrapContract(cfg.rpcUrl, cfg.bootstrapContract);
  }

  let hiveRegistry: HiveclawPingResult["hiveRegistry"];
  if (cfg.hiveRegistryContract) {
    try {
      const snap = await readHiveRegistrySnapshot(cfg.rpcUrl, cfg.hiveRegistryContract);
      hiveRegistry = {
        ok: true,
        address: cfg.hiveRegistryContract,
        version: snap.version,
        nextHiveId: snap.nextHiveId,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      hiveRegistry = { ok: false, address: cfg.hiveRegistryContract, error: msg };
    }
  }

  const storage = await runStorageSmoke(cfg);

  return {
    chainId: chainId.toString(),
    blockNumber: blockNumber.toString(),
    chainIdNote,
    bootstrap,
    hiveRegistry,
    storage,
  };
}

export function pingSummary(result: HiveclawPingResult): string {
  const lines: string[] = [
    `chainId: ${result.chainId}`,
    `blockNumber: ${result.blockNumber}`,
  ];
  if (result.chainIdNote) lines.push(`warning: ${result.chainIdNote}`);
  if (result.bootstrap) {
    if (result.bootstrap.ok) {
      lines.push(`bootstrap ${result.bootstrap.address}: version=${result.bootstrap.version} ping=${result.bootstrap.ping}`);
    } else {
      lines.push(`bootstrap ${result.bootstrap.address}: ERROR ${result.bootstrap.error}`);
    }
  } else {
    lines.push("bootstrap: (HIVECLAW_BOOTSTRAP_CONTRACT not set)");
  }
  if (result.hiveRegistry) {
    if (result.hiveRegistry.ok) {
      lines.push(
        `hiveRegistry ${result.hiveRegistry.address}: version=${result.hiveRegistry.version} nextHiveId=${result.hiveRegistry.nextHiveId}`,
      );
    } else {
      lines.push(`hiveRegistry ${result.hiveRegistry.address}: ERROR ${result.hiveRegistry.error}`);
    }
  } else {
    lines.push("hiveRegistry: (HIVECLAW_HIVE_REGISTRY_CONTRACT not set)");
  }
  if (result.storage.ok) {
    lines.push(
      `storage: OK root=${result.storage.rootHash} tx=${result.storage.txHash} verified=${result.storage.verified}`,
    );
  } else if (result.storage.skipped) {
    lines.push(`storage: SKIPPED — ${result.storage.reason}`);
  } else {
    lines.push(`storage: FAIL — ${result.storage.reason}${result.storage.detail ? ` (${result.storage.detail})` : ""}`);
  }
  return lines.join("\n");
}
