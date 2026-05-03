import type { HiveclawConfig } from "hiveclaw-core";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";

/** Matches gateway `plugins.entries.hiveclaw.config` (OpenClaw resolves `${ENV}` before injection). */
export type HiveclawPluginConfig = {
  rpcUrl?: string;
  indexerUrl?: string;
  bootstrapContract?: string;
  hiveRegistryContract?: string;
  storagePrivateKey?: string;
  chainPrivateKey?: string;
  expectedChainId?: number;
  defaultHiveKeyHex?: string;
  hiveKeysJson?: string;
  defaultHiveId?: number | string;
  privateComputerBaseUrl?: string;
  privateComputerApiKey?: string;
};

const DEFAULT_RPC_URL = "https://evmrpc-testnet.0g.ai";
const DEFAULT_INDEXER_URL = "https://indexer-storage-testnet-turbo.0g.ai";

/**
 * Build a full HiveclawConfig from OpenClaw plugin API only — **no `process.env`**.
 * Secrets and URLs must come from gateway JSON (`plugins.entries.hiveclaw.config`), typically
 * using `"${HIVECLAW_CHAIN_PRIVATE_KEY}"` so OpenClaw substitutes from the shell environment.
 */
export function hiveclawConfigFromGateway(api: OpenClawPluginApi): HiveclawConfig {
  const raw = api.pluginConfig as HiveclawPluginConfig | undefined;
  let hiveKeysById: Record<string, string> | undefined;
  if (raw?.hiveKeysJson) {
    try {
      hiveKeysById = JSON.parse(raw.hiveKeysJson) as Record<string, string>;
    } catch {
      hiveKeysById = undefined;
    }
  }

  return {
    rpcUrl: raw?.rpcUrl ?? DEFAULT_RPC_URL,
    indexerUrl: raw?.indexerUrl ?? DEFAULT_INDEXER_URL,
    bootstrapContract: raw?.bootstrapContract,
    hiveRegistryContract: raw?.hiveRegistryContract,
    chainPrivateKey: raw?.chainPrivateKey,
    storagePrivateKey: raw?.storagePrivateKey,
    expectedChainId: raw?.expectedChainId,
    defaultHiveKeyHex: raw?.defaultHiveKeyHex,
    hiveKeysById,
    privateComputerBaseUrl: raw?.privateComputerBaseUrl,
    privateComputerApiKey: raw?.privateComputerApiKey,
  };
}
