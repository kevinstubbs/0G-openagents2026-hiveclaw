import type { HiveclawConfig } from "./config.js";
import { getHiveMemory, putHiveMemory } from "./hive-memory.js";
import { summarizeMemories, type SummarizeResult } from "./summarize.js";

export type ReflectAndCommitInput = {
  cfg: HiveclawConfig;
  hiveId: bigint;
  agentAddress: string;
  hiveKeyHex: string;
  sharedSegments: string[];
  privateSegments: string[];
  /** Logical segment under `shared/` where the summary is stored (e.g. `summary/rolling`). */
  summarySegment: string;
  privateComputerBaseUrl: string;
  privateComputerApiKey: string | undefined;
  /** When true, compact JSON attestation is stored in `metadataURI` on-chain (truncated). */
  attachAttestationToMetadataUri?: boolean;
};

export type ReflectAndCommitOutput = {
  summarize: SummarizeResult;
  commit: {
    txHash: string;
    memoryKeyHex: string;
    logicalPath: string;
    rootHash: string;
    contentHash: string;
  };
};

/**
 * Reflection loop: recall selected segments → Private Computer summarize → **remember_shared** summary blob + registry commit.
 */
export async function reflectAndCommitShared(input: ReflectAndCommitInput): Promise<ReflectAndCommitOutput> {
  const blocks: { label: string; text: string }[] = [];
  for (const seg of input.sharedSegments) {
    const r = await getHiveMemory({
      cfg: input.cfg,
      hiveId: input.hiveId,
      hiveKeyHex: input.hiveKeyHex,
      segment: seg,
      scope: "shared",
      agentAddress: input.agentAddress,
    });
    blocks.push({ label: `shared:${r.logicalPath}`, text: r.plaintext });
  }
  for (const seg of input.privateSegments) {
    const r = await getHiveMemory({
      cfg: input.cfg,
      hiveId: input.hiveId,
      hiveKeyHex: input.hiveKeyHex,
      segment: seg,
      scope: "private",
      agentAddress: input.agentAddress,
    });
    blocks.push({ label: `private:${r.logicalPath}`, text: r.plaintext });
  }
  if (blocks.length === 0) {
    throw new Error("reflect: provide at least one shared or private segment");
  }

  const summarize = await summarizeMemories({
    baseUrl: input.privateComputerBaseUrl,
    apiKey: input.privateComputerApiKey,
    blocks,
    instruction:
      "Produce a concise rolling hive summary for other agents. Preserve factual claims; note uncertainty.",
  });

  let metadataURI = "";
  if (input.attachAttestationToMetadataUri && summarize.attestation) {
    const compact = JSON.stringify({ v: 1, pc: summarize.attestation });
    metadataURI = compact.length > 1900 ? `${compact.slice(0, 1897)}...` : compact;
  }

  const commit = await putHiveMemory({
    cfg: input.cfg,
    hiveId: input.hiveId,
    plaintext: summarize.summary,
    hiveKeyHex: input.hiveKeyHex,
    segment: input.summarySegment,
    scope: "shared",
    agentAddress: input.agentAddress,
    metadataURI,
  });

  return { summarize, commit };
}
