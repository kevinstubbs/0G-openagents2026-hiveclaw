import type { HiveclawConfig } from "./config-types.js";

/** Resolve hive symmetric key: overrides.hiveKeysById?.[id] || env JSON map || single HIVECLAW_HIVE_KEY_HEX. */
export function resolveHiveKeyHex(
  hiveId: bigint,
  cfg: HiveclawConfig,
): string | undefined {
  const map = cfg.hiveKeysById;
  if (map) {
    const k = map[hiveId.toString()];
    if (k) return k;
  }
  return cfg.defaultHiveKeyHex;
}
