import {
  getHiveMemory,
  putHiveMemory,
  resolveHiveKeyHex,
  summarizeMemories,
  addressFromPrivateKey,
} from "hiveclaw-core";
import { loadHiveclawConfig } from "hiveclaw-core/load-config";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Server-side summarization: reads hive keys from process.env only (never from client).
 * POST body: hiveId, sharedSegments?, privateSegments?, commitSummaryToShared?, summarySegment?, attachAttestationToMetadataUri?
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      hiveId: string;
      sharedSegments?: string[];
      privateSegments?: string[];
      commitSummaryToShared?: boolean;
      summarySegment?: string;
      attachAttestationToMetadataUri?: boolean;
    };
    const cfg = loadHiveclawConfig();
    const hiveId = BigInt(body.hiveId);
    const hiveKey = resolveHiveKeyHex(hiveId, cfg);
    if (!hiveKey) {
      return NextResponse.json({ error: "Server missing hive key for this id (HIVECLAW_HIVE_KEYS_JSON / HIVECLAW_HIVE_KEY_HEX)" }, { status: 400 });
    }
    if (!cfg.chainPrivateKey) {
      return NextResponse.json({ error: "Server missing HIVECLAW_CHAIN_PRIVATE_KEY for recall" }, { status: 400 });
    }
    if (!cfg.privateComputerBaseUrl) {
      return NextResponse.json({ error: "Missing HIVECLAW_PRIVATE_COMPUTER_URL" }, { status: 400 });
    }
    const agent = addressFromPrivateKey(cfg.chainPrivateKey);
    const blocks: { label: string; text: string }[] = [];
    for (const seg of body.sharedSegments ?? []) {
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
    for (const seg of body.privateSegments ?? []) {
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
      return NextResponse.json({ error: "Provide sharedSegments and/or privateSegments" }, { status: 400 });
    }
    const result = await summarizeMemories({
      baseUrl: cfg.privateComputerBaseUrl,
      apiKey: cfg.privateComputerApiKey,
      blocks,
    });

    let commit: Awaited<ReturnType<typeof putHiveMemory>> | undefined;
    if (body.commitSummaryToShared) {
      let metadataURI = "";
      if (body.attachAttestationToMetadataUri && result.attestation) {
        const compact = JSON.stringify({ v: 1, pc: result.attestation });
        metadataURI = compact.length > 1900 ? `${compact.slice(0, 1897)}...` : compact;
      }
      commit = await putHiveMemory({
        cfg,
        hiveId,
        plaintext: result.summary,
        hiveKeyHex: hiveKey,
        segment: body.summarySegment ?? "summary/rolling",
        scope: "shared",
        agentAddress: agent,
        metadataURI,
      });
    }

    return NextResponse.json({
      summary: result.summary,
      attestation: result.attestation,
      commit,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
