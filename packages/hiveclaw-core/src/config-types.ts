/** Resolved HiveClaw settings (from env, CLI, or OpenClaw gateway JSON). No `process.env` here — see `config.ts` / `openclaw-config` for loading. */
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
