import { Type } from "@sinclair/typebox";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import {
  addressFromPrivateKey,
  getHiveMemory,
  getMemberHives,
  putHiveMemory,
  reflectAndCommitShared,
  resolveHiveKeyHex,
  runPingWithResolvedConfig,
  summarizeMemories,
  type HiveclawConfig,
} from "hiveclaw-core";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { hiveclawConfigFromGateway, type HiveclawPluginConfig } from "./openclaw-config.js";

function requireFullCfg(api: OpenClawPluginApi): HiveclawConfig {
  return hiveclawConfigFromGateway(api);
}

function requireKeys(cfg: HiveclawConfig, hiveId: bigint): { cfg: HiveclawConfig; hiveKey: string } {
  if (!cfg.chainPrivateKey) {
    throw new Error(
      "chainPrivateKey required — set plugins.entries.hiveclaw.config.chainPrivateKey in gateway JSON (e.g. \"${HIVECLAW_CHAIN_PRIVATE_KEY}\")",
    );
  }
  if (!cfg.storagePrivateKey) {
    throw new Error(
      "storagePrivateKey required — set plugins.entries.hiveclaw.config.storagePrivateKey (e.g. \"${HIVECLAW_STORAGE_PRIVATE_KEY}\")",
    );
  }
  if (!cfg.hiveRegistryContract) throw new Error("hiveRegistryContract required in plugin config");
  const hiveKey = resolveHiveKeyHex(hiveId, cfg);
  if (!hiveKey) {
    throw new Error(
      `No hive symmetric key for hiveId ${hiveId} — set defaultHiveKeyHex or hiveKeysJson in plugins.entries.hiveclaw.config`,
    );
  }
  return { cfg, hiveKey };
}

function parseHiveIdArg(
  raw: { hiveId?: number | string; defaultFromConfig?: number | string } | undefined,
  defaultHiveId: string | number | undefined,
): bigint {
  const v = raw?.hiveId ?? defaultHiveId;
  if (v === undefined || v === null || v === "") {
    throw new Error("hiveId is required (or set defaultHiveId in plugin config)");
  }
  return BigInt(String(v));
}

export default definePluginEntry({
  id: "hiveclaw",
  name: "HiveClaw",
  description:
    "Encrypted hive memory on 0G: shared + private namespaced keys, HiveRegistry provenance, optional Private Computer summarization.",
  register(api) {
    api.registerTool({
      name: "hiveclaw_ping",
      label: "HiveClaw ping",
      description:
        "Chain + HiveRegistry + 0G storage smoke. Returns JSON (use for health before memory ops).",
      parameters: Type.Object({}),
      async execute() {
        const result = await runPingWithResolvedConfig(hiveclawConfigFromGateway(api));
        const text = JSON.stringify(result, null, 2);
        return { content: [{ type: "text", text }], details: { result } };
      },
    });

    api.registerTool({
      name: "hiveclaw_list_my_hives",
      label: "List hives I belong to",
      description: "Returns hive ids from HiveRegistry.memberHives for the plugin chain wallet address.",
      parameters: Type.Object({}),
      async execute() {
        const cfg = requireFullCfg(api);
        if (!cfg.hiveRegistryContract) throw new Error("hiveRegistryContract not configured");
        if (!cfg.chainPrivateKey) throw new Error("chainPrivateKey not configured");
        const who = addressFromPrivateKey(cfg.chainPrivateKey);
        const ids = await getMemberHives(cfg.rpcUrl, cfg.hiveRegistryContract, who);
        const text = JSON.stringify({ address: who, hiveIds: ids.map((x: bigint) => x.toString()) }, null, 2);
        return { content: [{ type: "text", text }], details: {} };
      },
    });

    const defaultHive = (api.pluginConfig as HiveclawPluginConfig | undefined)?.defaultHiveId;

    api.registerTool({
      name: "remember_shared",
      label: "Remember shared (encrypted commit)",
      description: "Encrypts content with the hive key, uploads to 0G, commitMemory under shared/<segment>.",
      parameters: Type.Object({
        hiveId: Type.Optional(Type.Union([Type.String(), Type.Number()])),
        segment: Type.String({ description: "Path under shared/, e.g. findings/round1" }),
        content: Type.String(),
      }),
      async execute(_id, params) {
        const p = params as { hiveId?: number | string; segment: string; content: string };
        const cfg0 = requireFullCfg(api);
        const hiveId = parseHiveIdArg(p, defaultHive);
        const { cfg, hiveKey } = requireKeys(cfg0, hiveId);
        const agent = addressFromPrivateKey(cfg.chainPrivateKey!);
        const r = await putHiveMemory({
          cfg,
          hiveId,
          plaintext: p.content,
          hiveKeyHex: hiveKey,
          segment: p.segment,
          scope: "shared",
          agentAddress: agent,
        });
        const text = JSON.stringify({ ok: true, ...r }, null, 2);
        return { content: [{ type: "text", text }], details: {} };
      },
    });

    api.registerTool({
      name: "recall_shared",
      label: "Recall shared memory",
      description: "Decrypt latest shared segment after registry lookup.",
      parameters: Type.Object({
        hiveId: Type.Optional(Type.Union([Type.String(), Type.Number()])),
        segment: Type.String(),
      }),
      async execute(_id, params) {
        const p = params as { hiveId?: number | string; segment: string };
        const cfg0 = requireFullCfg(api);
        const hiveId = parseHiveIdArg(p, defaultHive);
        const { cfg, hiveKey } = requireKeys(cfg0, hiveId);
        const agent = addressFromPrivateKey(cfg.chainPrivateKey!);
        const r = await getHiveMemory({
          cfg,
          hiveId,
          hiveKeyHex: hiveKey,
          segment: p.segment,
          scope: "shared",
          agentAddress: agent,
        });
        const text = JSON.stringify({ plaintext: r.plaintext, logicalPath: r.logicalPath, commit: r.commit }, null, 2);
        return { content: [{ type: "text", text }], details: {} };
      },
    });

    api.registerTool({
      name: "remember_private",
      label: "Remember private lane (encrypted commit)",
      description: "Same as shared but stores under private/<your-address>/<segment>. Other members could read on-chain by policy.",
      parameters: Type.Object({
        hiveId: Type.Optional(Type.Union([Type.String(), Type.Number()])),
        segment: Type.String(),
        content: Type.String(),
      }),
      async execute(_id, params) {
        const p = params as { hiveId?: number | string; segment: string; content: string };
        const cfg0 = requireFullCfg(api);
        const hiveId = parseHiveIdArg(p, defaultHive);
        const { cfg, hiveKey } = requireKeys(cfg0, hiveId);
        const agent = addressFromPrivateKey(cfg.chainPrivateKey!);
        const r = await putHiveMemory({
          cfg,
          hiveId,
          plaintext: p.content,
          hiveKeyHex: hiveKey,
          segment: p.segment,
          scope: "private",
          agentAddress: agent,
        });
        const text = JSON.stringify({ ok: true, ...r }, null, 2);
        return { content: [{ type: "text", text }], details: {} };
      },
    });

    api.registerTool({
      name: "recall_private",
      label: "Recall private memory",
      description: "Decrypt latest private lane segment for your wallet address.",
      parameters: Type.Object({
        hiveId: Type.Optional(Type.Union([Type.String(), Type.Number()])),
        segment: Type.String(),
      }),
      async execute(_id, params) {
        const p = params as { hiveId?: number | string; segment: string };
        const cfg0 = requireFullCfg(api);
        const hiveId = parseHiveIdArg(p, defaultHive);
        const { cfg, hiveKey } = requireKeys(cfg0, hiveId);
        const agent = addressFromPrivateKey(cfg.chainPrivateKey!);
        const r = await getHiveMemory({
          cfg,
          hiveId,
          hiveKeyHex: hiveKey,
          segment: p.segment,
          scope: "private",
          agentAddress: agent,
        });
        const text = JSON.stringify({ plaintext: r.plaintext, logicalPath: r.logicalPath, commit: r.commit }, null, 2);
        return { content: [{ type: "text", text }], details: {} };
      },
    });

    api.registerTool({
      name: "summarize_memory",
      label: "Summarize memories (Private Computer)",
      description:
        "Fetches shared and/or private segments by recall, then calls OpenAI-compatible summarization. Optionally commits summary to shared/ via remember_shared.",
      parameters: Type.Object({
        hiveId: Type.Optional(Type.Union([Type.String(), Type.Number()])),
        sharedSegments: Type.Optional(Type.Array(Type.String())),
        privateSegments: Type.Optional(Type.Array(Type.String())),
        commitSummaryToShared: Type.Optional(Type.Boolean()),
        summarySegment: Type.Optional(
          Type.String({ description: "Path under shared/, default summary/rolling" }),
        ),
        attachAttestationToMetadataUri: Type.Optional(Type.Boolean()),
      }),
      async execute(_id, params) {
        const p = params as {
          hiveId?: number | string;
          sharedSegments?: string[];
          privateSegments?: string[];
          commitSummaryToShared?: boolean;
          summarySegment?: string;
          attachAttestationToMetadataUri?: boolean;
        };
        const cfg0 = requireFullCfg(api);
        const hiveId = parseHiveIdArg(p, defaultHive);
        const { cfg, hiveKey } = requireKeys(cfg0, hiveId);
        const agent = addressFromPrivateKey(cfg.chainPrivateKey!);
        const base = cfg.privateComputerBaseUrl;
        if (!base) throw new Error("privateComputerBaseUrl must be set in plugins.entries.hiveclaw.config");

        const blocks: { label: string; text: string }[] = [];
        for (const seg of p.sharedSegments ?? []) {
          const r = await getHiveMemory({
            cfg,
            hiveId,
            hiveKeyHex: hiveKey,
            segment: seg,
            scope: "shared",
            agentAddress: agent,
          });
          blocks.push({ label: `shared:${r.logicalPath}`, text: r.plaintext });
        }
        for (const seg of p.privateSegments ?? []) {
          const r = await getHiveMemory({
            cfg,
            hiveId,
            hiveKeyHex: hiveKey,
            segment: seg,
            scope: "private",
            agentAddress: agent,
          });
          blocks.push({ label: `private:${r.logicalPath}`, text: r.plaintext });
        }
        if (blocks.length === 0) {
          throw new Error("Provide at least one segment in sharedSegments or privateSegments");
        }
        const result = await summarizeMemories({
          baseUrl: base,
          apiKey: cfg.privateComputerApiKey,
          blocks,
        });

        let commitOut: Awaited<ReturnType<typeof putHiveMemory>> | undefined;
        const seg = p.summarySegment ?? "summary/rolling";
        if (p.commitSummaryToShared) {
          let metadataURI = "";
          if (p.attachAttestationToMetadataUri && result.attestation) {
            const compact = JSON.stringify({ v: 1, pc: result.attestation });
            metadataURI = compact.length > 1900 ? `${compact.slice(0, 1897)}...` : compact;
          }
          commitOut = await putHiveMemory({
            cfg,
            hiveId,
            plaintext: result.summary,
            hiveKeyHex: hiveKey,
            segment: seg,
            scope: "shared",
            agentAddress: agent,
            metadataURI,
          });
        }

        const footer = commitOut
          ? `\n\n---\nCommitted to shared/${seg} · tx ${commitOut.txHash}`
          : "";
        return {
          content: [{ type: "text", text: `${result.summary}${footer}` }],
          details: {
            attestation: result.attestation,
            commitSummary: commitOut,
          },
        };
      },
    });

    api.registerTool({
      name: "hiveclaw_reflect",
      label: "Reflect: summarize + commit shared summary",
      description:
        "Runs the reflection loop: recall segments → Private Computer → encrypt + upload + commitMemory to shared/<summarySegment>.",
      parameters: Type.Object({
        hiveId: Type.Optional(Type.Union([Type.String(), Type.Number()])),
        sharedSegments: Type.Optional(Type.Array(Type.String())),
        privateSegments: Type.Optional(Type.Array(Type.String())),
        summarySegment: Type.Optional(Type.String()),
        attachAttestationToMetadataUri: Type.Optional(Type.Boolean()),
      }),
      async execute(_id, params) {
        const p = params as {
          hiveId?: number | string;
          sharedSegments?: string[];
          privateSegments?: string[];
          summarySegment?: string;
          attachAttestationToMetadataUri?: boolean;
        };
        const cfg0 = requireFullCfg(api);
        const hiveId = parseHiveIdArg(p, defaultHive);
        const { cfg, hiveKey } = requireKeys(cfg0, hiveId);
        const agent = addressFromPrivateKey(cfg.chainPrivateKey!);
        const base = cfg.privateComputerBaseUrl;
        if (!base) throw new Error("privateComputerBaseUrl must be set in plugins.entries.hiveclaw.config");

        const out = await reflectAndCommitShared({
          cfg,
          hiveId,
          agentAddress: agent,
          hiveKeyHex: hiveKey,
          sharedSegments: p.sharedSegments ?? [],
          privateSegments: p.privateSegments ?? [],
          summarySegment: p.summarySegment ?? "summary/rolling",
          privateComputerBaseUrl: base,
          privateComputerApiKey: cfg.privateComputerApiKey,
          attachAttestationToMetadataUri: p.attachAttestationToMetadataUri ?? false,
        });

        const text = `${out.summarize.summary}\n\n---\nCommitted · tx ${out.commit.txHash}\nlogical ${out.commit.logicalPath}`;
        return {
          content: [{ type: "text", text }],
          details: {
            attestation: out.summarize.attestation,
            commit: out.commit,
          },
        };
      },
    });
  },
});
