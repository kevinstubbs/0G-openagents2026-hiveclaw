"use client";

import { C } from "@/components/landing/colors";
import { Card, CodeBlock, Section, SectionHeader } from "@/components/landing/primitives";

export function StatusResults({ summaryText, json }: { summaryText: string; json: string }) {
  return (
    <Section id="results" accent={C.blue} tint style={{ padding: "56px 0 88px" }}>
      <SectionHeader
        accent={C.blue}
        eyebrow="Live response"
        title="Ping results"
        subtitle="Same checks as the hiveclaw ping CLI: RPC reachability, storage, and registry when your env is configured."
        center
      />
      <div
        className="hc-dashboard-two-col"
        style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24, alignItems: "stretch" }}
      >
        <Card accent={C.green}>
          <h3
            style={{
              fontFamily: "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif",
              fontWeight: 700,
              fontSize: 16,
              color: C.text,
              margin: "0 0 14px",
            }}
          >
            Summary
          </h3>
          <pre className="hc-dashboard-pre">{summaryText}</pre>
        </Card>
        <Card accent={C.purple}>
          <h3
            style={{
              fontFamily: "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif",
              fontWeight: 700,
              fontSize: 16,
              color: C.text,
              margin: "0 0 14px",
            }}
          >
            Raw JSON
          </h3>
          <CodeBlock code={json} lang="JSON" />
        </Card>
      </div>
    </Section>
  );
}
