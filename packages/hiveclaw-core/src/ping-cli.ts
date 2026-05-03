import type { HiveclawConfig } from "./config-types.js";
import { loadHiveclawConfig } from "./config.js";
import { runPingWithResolvedConfig, type HiveclawPingResult } from "./ping-resolved.js";

/** CLI / dashboard: merge env + optional overrides, then ping. Not used by the OpenClaw plugin bundle. */
export async function runPing(overrides?: Partial<HiveclawConfig>): Promise<HiveclawPingResult> {
  return runPingWithResolvedConfig(loadHiveclawConfig(overrides));
}
