"use client";

import {
  fetchMemoryHistory,
  memoryKeyFromString,
  type MemoryCommitView,
} from "hiveclaw-core/hive-registry";
import { useCallback, useState } from "react";

type Props = {
  rpcUrl: string;
  registry: string;
  /** Initial hive id (user can edit). */
  initialHiveId?: string;
};

/** On-chain memoryHistory metadata + server summarize API (reads secrets from env only). */
export function MemoryExplorer({ rpcUrl, registry, initialHiveId = "1" }: Props) {
  const [hiveId, setHiveId] = useState(initialHiveId);
  const [logicalKey, setLogicalKey] = useState("shared/findings/intro");
  const [history, setHistory] = useState<MemoryCommitView[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setErr(null);
    setBusy(true);
    try {
      const mk = memoryKeyFromString(logicalKey);
      const hist = await fetchMemoryHistory(rpcUrl, registry, BigInt(hiveId), mk);
      setHistory(hist);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setHistory(null);
    } finally {
      setBusy(false);
    }
  }, [hiveId, logicalKey, registry, rpcUrl]);

  return (
    <section>
      <h2>Memory explorer</h2>
      <p style={{ fontSize: "0.9rem", opacity: 0.9 }}>
        Loads <code>memoryHistory</code> from HiveRegistry (writer, timestamp, pointer, hash). Decrypt with{" "}
        <code>hiveclaw memory get</code> using your hive key.
      </p>
      <p>
        <label>
          Hive id{" "}
          <input value={hiveId} onChange={(e) => setHiveId(e.target.value)} style={{ width: 100 }} />
        </label>
      </p>
      <p>
        <label>
          Logical key{" "}
          <input
            value={logicalKey}
            onChange={(e) => setLogicalKey(e.target.value)}
            style={{ width: 320 }}
          />
        </label>{" "}
        <button type="button" disabled={busy} onClick={() => void loadHistory()}>
          Load history
        </button>
      </p>
      {history && history.length > 0 ? (
        <div>
          <p>
            <strong>{history.length}</strong> commit(s)
          </p>
          <ul style={{ fontSize: 12, overflow: "auto", maxHeight: 280 }}>
            {history.map((h, i) => (
              <li key={`${h.storagePointer}-${i}`}>
                writer {h.writer} · ts {h.timestamp} · ptr {h.storagePointer.slice(0, 18)}… · hash{" "}
                {h.contentHash.slice(0, 18)}…
              </li>
            ))}
          </ul>
        </div>
      ) : history ? (
        <p>No commits for this key.</p>
      ) : null}
      <hr />
      <h3>Summarize (server)</h3>
      <p style={{ fontSize: "0.85rem", opacity: 0.9 }}>
        Calls <code>/api/summarize</code> — requires server env: hive keys, chain key, storage key, Private Computer URL.
      </p>
      <SummarizeForm hiveId={hiveId} />
      {err ? (
        <p role="alert" style={{ color: "crimson", whiteSpace: "pre-wrap" }}>
          {err}
        </p>
      ) : null}
    </section>
  );
}

type SummarizeApiOk = {
  summary?: string;
  attestation?: unknown;
  commit?: { txHash?: string; logicalPath?: string };
  error?: string;
};

function SummarizeForm({ hiveId }: { hiveId: string }) {
  const [shared, setShared] = useState("findings/intro");
  const [priv, setPriv] = useState("");
  const [commitSummary, setCommitSummary] = useState(false);
  const [summarySegment, setSummarySegment] = useState("summary/rolling");
  const [attestationMeta, setAttestationMeta] = useState(false);
  const [result, setResult] = useState<SummarizeApiOk | null>(null);
  const [busy, setBusy] = useState(false);

  const run = useCallback(async () => {
    setBusy(true);
    setResult(null);
    try {
      const sharedSegments = shared
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const privateSegments = priv
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hiveId,
          sharedSegments,
          privateSegments,
          commitSummaryToShared: commitSummary,
          summarySegment,
          attachAttestationToMetadataUri: attestationMeta,
        }),
      });
      const data = (await res.json()) as SummarizeApiOk;
      if (!res.ok) throw new Error(data.error ?? res.statusText);
      setResult(data);
    } catch (e) {
      setResult({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }, [attestationMeta, commitSummary, hiveId, priv, shared, summarySegment]);

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <label>
        Shared segments (comma-separated, segments under shared/){" "}
        <input value={shared} onChange={(e) => setShared(e.target.value)} style={{ width: "100%" }} />
      </label>
      <label>
        Private segments (comma-separated, segments under private/&lt;your addr&gt;/){" "}
        <input value={priv} onChange={(e) => setPriv(e.target.value)} style={{ width: "100%" }} />
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="checkbox"
          checked={commitSummary}
          onChange={(e) => setCommitSummary(e.target.checked)}
        />
        Commit summary to shared (rolling memory)
      </label>
      {commitSummary ? (
        <>
          <label>
            Summary segment under shared/{" "}
            <input
              value={summarySegment}
              onChange={(e) => setSummarySegment(e.target.value)}
              style={{ width: "100%" }}
            />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={attestationMeta}
              onChange={(e) => setAttestationMeta(e.target.checked)}
            />
            Attach PC attestation JSON to on-chain metadataURI (truncated)
          </label>
        </>
      ) : null}
      <button type="button" disabled={busy} onClick={() => void run()}>
        Summarize via Private Computer (server env)
      </button>
      {result?.error ? (
        <p role="alert" style={{ color: "crimson", whiteSpace: "pre-wrap" }}>
          {result.error}
        </p>
      ) : null}
      {result?.summary != null ? (
        <>
          <pre style={{ fontSize: 12, whiteSpace: "pre-wrap" }}>{result.summary}</pre>
          {result.commit ? (
            <p style={{ fontSize: 12 }}>
              Committed <code>{result.commit.logicalPath}</code> · tx{" "}
              <code>{result.commit.txHash}</code>
            </p>
          ) : null}
          {result.attestation ? (
            <details>
              <summary style={{ cursor: "pointer", fontSize: 13 }}>PC attestation metadata</summary>
              <pre style={{ fontSize: 11, whiteSpace: "pre-wrap", maxHeight: 200, overflow: "auto" }}>
                {JSON.stringify(result.attestation, null, 2)}
              </pre>
            </details>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
