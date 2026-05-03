"use client";

import {
  fetchMemoryHistory,
  memoryKeyFromString,
  type MemoryCommitView,
} from "hiveclaw-core/hive-registry";
import { useCallback, useState, type ReactNode } from "react";
import { C } from "@/components/landing/colors";
import { Card } from "@/components/landing/primitives";

type Props = {
  rpcUrl: string;
  registry: string;
  /** Initial hive id (user can edit). */
  initialHiveId?: string;
};

function MemoryPanelSection({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: ReactNode;
}) {
  return (
    <Card accent={accent}>
      <h2
        style={{
          fontFamily: "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif",
          fontWeight: 700,
          fontSize: 18,
          color: C.text,
          margin: "0 0 16px",
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </h2>
      <div style={{ display: "grid", gap: "1rem" }}>{children}</div>
    </Card>
  );
}

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

  const subtle = { fontFamily: "var(--font-inter), Inter, sans-serif", fontSize: 14, color: C.muted, margin: 0 };
  const row = { display: "flex", flexWrap: "wrap" as const, gap: "0.65rem", alignItems: "center" };

  return (
    <div className="hc-dashboard-tools" style={{ display: "grid", gap: "1.25rem" }}>
      <MemoryPanelSection title="Memory explorer" accent={C.green}>
        <p style={subtle}>
          Loads <code className="hc-dashboard-code">memoryHistory</code> from HiveRegistry (writer, timestamp, pointer,
          hash). Decrypt with <code className="hc-dashboard-code">hiveclaw memory get</code> using your hive key.
        </p>
        <p style={row}>
          <label style={{ ...row, gap: 8 }}>
            <span style={{ fontWeight: 600, color: C.text }}>Hive id</span>
            <input value={hiveId} onChange={(e) => setHiveId(e.target.value)} style={{ width: 100 }} />
          </label>
        </p>
        <p style={row}>
          <label style={{ ...row, gap: 8, flex: 1, minWidth: 200 }}>
            <span style={{ fontWeight: 600, color: C.text }}>Logical key</span>
            <input
              value={logicalKey}
              onChange={(e) => setLogicalKey(e.target.value)}
              style={{ flex: 1, minWidth: 200, maxWidth: 400 }}
            />
          </label>
          <button type="button" disabled={busy} onClick={() => void loadHistory()}>
            Load history
          </button>
        </p>
        {history && history.length > 0 ? (
          <div
            style={{
              padding: "14px 16px",
              borderRadius: 12,
              background: C.bgAlt,
              border: `1px solid ${C.border}`,
            }}
          >
            <p style={{ fontFamily: "var(--font-inter), Inter, sans-serif", fontSize: 14, color: C.text, margin: "0 0 10px" }}>
              <strong>{history.length}</strong> <span style={{ color: C.muted }}>commit(s)</span>
            </p>
            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                fontFamily: "var(--font-jetbrains), 'JetBrains Mono', monospace",
                fontSize: 12,
                color: C.muted,
                lineHeight: 1.55,
                overflow: "auto",
                maxHeight: 280,
              }}
            >
              {history.map((h, i) => (
                <li key={`${h.storagePointer}-${i}`}>
                  writer {h.writer} · ts {h.timestamp} · ptr {h.storagePointer.slice(0, 18)}… · hash{" "}
                  {h.contentHash.slice(0, 18)}…
                </li>
              ))}
            </ul>
          </div>
        ) : history ? (
          <p style={subtle}>No commits for this key.</p>
        ) : null}
      </MemoryPanelSection>

      <MemoryPanelSection title="Summarize (server)" accent={C.orange}>
        <p style={subtle}>
          Calls <code className="hc-dashboard-code">/api/summarize</code> — requires server env: hive keys, chain key,
          storage key, Private Computer URL.
        </p>
        <SummarizeForm hiveId={hiveId} />
        {err ? (
          <p role="alert" style={{ color: C.red, whiteSpace: "pre-wrap", fontSize: 14, margin: 0 }}>
            {err}
          </p>
        ) : null}
      </MemoryPanelSection>
    </div>
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
    <div style={{ display: "grid", gap: 12 }}>
      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: C.text }}>Shared segments (comma-separated)</span>
        <input value={shared} onChange={(e) => setShared(e.target.value)} style={{ width: "100%" }} />
      </label>
      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: C.text }}>Private segments (comma-separated)</span>
        <input value={priv} onChange={(e) => setPriv(e.target.value)} style={{ width: "100%" }} />
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: C.text }}>
        <input
          type="checkbox"
          checked={commitSummary}
          onChange={(e) => setCommitSummary(e.target.checked)}
        />
        Commit summary to shared (rolling memory)
      </label>
      {commitSummary ? (
        <>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 600, fontSize: 13, color: C.text }}>Summary segment under shared/</span>
            <input
              value={summarySegment}
              onChange={(e) => setSummarySegment(e.target.value)}
              style={{ width: "100%" }}
            />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: C.text }}>
            <input
              type="checkbox"
              checked={attestationMeta}
              onChange={(e) => setAttestationMeta(e.target.checked)}
            />
            Attach PC attestation JSON to on-chain metadataURI (truncated)
          </label>
        </>
      ) : null}
      <div>
        <button type="button" disabled={busy} onClick={() => void run()}>
          Summarize via Private Computer (server env)
        </button>
      </div>
      {result?.error ? (
        <p role="alert" style={{ color: C.red, whiteSpace: "pre-wrap", fontSize: 14, margin: 0 }}>
          {result.error}
        </p>
      ) : null}
      {result?.summary != null ? (
        <>
          <pre className="hc-dashboard-pre" style={{ whiteSpace: "pre-wrap" }}>
            {result.summary}
          </pre>
          {result.commit ? (
            <p style={{ fontFamily: "var(--font-inter), Inter, sans-serif", fontSize: 13, color: C.muted, margin: 0 }}>
              Committed <code className="hc-dashboard-code">{result.commit.logicalPath}</code> · tx{" "}
              <code className="hc-dashboard-code">{result.commit.txHash}</code>
            </p>
          ) : null}
          {result.attestation ? (
            <details>
              <summary
                style={{
                  cursor: "pointer",
                  fontSize: 14,
                  fontFamily: "var(--font-inter), Inter, sans-serif",
                  fontWeight: 600,
                  color: C.text,
                }}
              >
                PC attestation metadata
              </summary>
              <pre
                className="hc-dashboard-pre"
                style={{ marginTop: 10, fontSize: 11, whiteSpace: "pre-wrap", maxHeight: 200, overflow: "auto" }}
              >
                {JSON.stringify(result.attestation, null, 2)}
              </pre>
            </details>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
