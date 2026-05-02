import { Type } from "@sinclair/typebox";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { runPing, type HiveclawConfig } from "hiveclaw-core";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";

type HiveclawPluginConfig = {
  rpcUrl?: string;
  indexerUrl?: string;
  bootstrapContract?: string;
  hiveRegistryContract?: string;
  storagePrivateKey?: string;
  expectedChainId?: number;
};

function pluginOverrides(api: OpenClawPluginApi): Partial<HiveclawConfig> {
  const raw = api.pluginConfig as HiveclawPluginConfig | undefined;
  if (!raw) return {};
  return {
    rpcUrl: raw.rpcUrl,
    indexerUrl: raw.indexerUrl,
    bootstrapContract: raw.bootstrapContract,
    hiveRegistryContract: raw.hiveRegistryContract,
    storagePrivateKey: raw.storagePrivateKey,
    expectedChainId: raw.expectedChainId,
  };
}

export default definePluginEntry({
  id: "hiveclaw",
  name: "HiveClaw",
  description: "Hive memory on 0G: chain + storage checks; configure HiveRegistry for Phase 2+.",
  register(api) {
    api.registerTool({
      name: "hiveclaw_ping",
      label: "HiveClaw ping",
      description:
        "Runs HiveClaw connectivity checks: chain id, latest block, optional HiveClawBootstrap reads, optional 0G Storage upload/download smoke. Returns JSON.",
      parameters: Type.Object({}),
      async execute(_id, _params) {
        const result = await runPing(pluginOverrides(api));
        const text = JSON.stringify(result, null, 2);
        return {
          content: [{ type: "text", text }],
          details: { result },
        };
      },
    });
  },
});
