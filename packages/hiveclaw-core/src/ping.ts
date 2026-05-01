import { loadHiveclawConfig, type HiveclawConfig } from "./config.js";
import { getChainId, getLatestBlockNumber, readBootstrapContract } from "./chain.js";
import { runStorageSmoke, type StorageSmokeResult } from "./storage-smoke.js";

export type HiveclawPingResult = {
  chainId: string;
  blockNumber: string;
  chainIdNote?: string;
  bootstrap?: { ok: true; address: string; version: string; ping: string } | { ok: false; address: string; error: string };
  storage: StorageSmokeResult;
};

export async function runPing(overrides?: Partial<HiveclawConfig>): Promise<HiveclawPingResult> {
  const cfg = loadHiveclawConfig(overrides);
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

  const storage = await runStorageSmoke(cfg);

  return {
    chainId: chainId.toString(),
    blockNumber: blockNumber.toString(),
    chainIdNote,
    bootstrap,
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
