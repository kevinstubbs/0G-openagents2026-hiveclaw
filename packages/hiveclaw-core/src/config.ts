export type HiveclawConfig = {
  rpcUrl: string;
  indexerUrl: string;
  bootstrapContract: string | undefined;
  /** Phase 2: `HiveRegistry` (on-chain hives, members, memory commits). */
  hiveRegistryContract: string | undefined;
  /** Local signer for CLI chain transactions (create hive, members, etc.). Never commit. */
  chainPrivateKey: string | undefined;
  storagePrivateKey: string | undefined;
  expectedChainId: number | undefined;
  /** Optional default symmetric hive key (32-byte hex) when per-hive map misses. */
  defaultHiveKeyHex: string | undefined;
  /** hive id string → 32-byte hex key for encryption. */
  hiveKeysById: Record<string, string> | undefined;
  /** Private Computer OpenAI-compatible base URL. */
  privateComputerBaseUrl: string | undefined;
  /** API key for Private Computer (Bearer / standard OpenAI auth). */
  privateComputerApiKey: string | undefined;
};

function readEnv(key: string): string | undefined {
  const v = process.env[key];
  if (v === undefined || v === "") return undefined;
  return v;
}

function parseHiveKeysJson(raw: string | undefined): Record<string, string> | undefined {
  if (!raw || raw.trim() === "") return undefined;
  try {
    const o = JSON.parse(raw) as Record<string, string>;
    return typeof o === "object" && o !== null ? o : undefined;
  } catch {
    return undefined;
  }
}

/** Merge process.env with optional overrides (e.g. OpenClaw plugin config). */
export function loadHiveclawConfig(overrides?: Partial<HiveclawConfig>): HiveclawConfig {
  const expectedRaw = overrides?.expectedChainId ?? readEnv("HIVECLAW_EXPECTED_CHAIN_ID");
  let expectedChainId: number | undefined;
  if (expectedRaw !== undefined) {
    const n = typeof expectedRaw === "number" ? expectedRaw : Number.parseInt(String(expectedRaw), 10);
    if (!Number.isNaN(n)) expectedChainId = n;
  }

  return {
    rpcUrl:
      overrides?.rpcUrl ??
      readEnv("HIVECLAW_RPC_URL") ??
      readEnv("NEXT_PUBLIC_HIVECLAW_RPC_URL") ??
      "https://evmrpc-testnet.0g.ai",
    indexerUrl:
      overrides?.indexerUrl ??
      readEnv("HIVECLAW_INDEXER_URL") ??
      readEnv("NEXT_PUBLIC_HIVECLAW_INDEXER_URL") ??
      "https://indexer-storage-testnet-turbo.0g.ai",
    bootstrapContract:
      overrides?.bootstrapContract ??
      readEnv("HIVECLAW_BOOTSTRAP_CONTRACT") ??
      readEnv("NEXT_PUBLIC_HIVECLAW_BOOTSTRAP_CONTRACT"),
    hiveRegistryContract:
      overrides?.hiveRegistryContract ??
      readEnv("HIVECLAW_HIVE_REGISTRY_CONTRACT") ??
      readEnv("NEXT_PUBLIC_HIVECLAW_HIVE_REGISTRY_CONTRACT"),
    chainPrivateKey:
      overrides?.chainPrivateKey ?? readEnv("HIVECLAW_CHAIN_PRIVATE_KEY") ?? readEnv("PRIVATE_KEY"),
    storagePrivateKey: overrides?.storagePrivateKey ?? readEnv("HIVECLAW_STORAGE_PRIVATE_KEY"),
    expectedChainId,
    defaultHiveKeyHex:
      overrides?.defaultHiveKeyHex ??
      readEnv("HIVECLAW_HIVE_KEY_HEX") ??
      readEnv("HIVECLAW_DEFAULT_HIVE_KEY_HEX"),
    hiveKeysById:
      overrides?.hiveKeysById ??
      parseHiveKeysJson(readEnv("HIVECLAW_HIVE_KEYS_JSON")),
    privateComputerBaseUrl:
      overrides?.privateComputerBaseUrl ??
      readEnv("HIVECLAW_PRIVATE_COMPUTER_URL") ??
      readEnv("PRIVATE_COMPUTER_URL"),
    privateComputerApiKey:
      overrides?.privateComputerApiKey ??
      readEnv("HIVECLAW_PRIVATE_COMPUTER_API_KEY") ??
      readEnv("PRIVATE_COMPUTER_API_KEY"),
  };
}
