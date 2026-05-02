"use client";

import Link from "next/link";
import { C, DEFAULT_HERO_ACCENT } from "./colors";
import { ArchDiagram, HeroIllustration } from "./diagrams";
import {
  Btn,
  Card,
  CodeBlock,
  DemoFlow,
  FeatureCard,
  MemCard,
  Section,
  SectionHeader,
  PillBadge,
} from "./primitives";

const TS_CODE = `await hive.rememberPrivate("agent.writer.style-notes", {
  text: "Prefer concise technical explanations.",
  tags: ["private", "style"]
});

await hive.rememberShared("research.0g-storage.summary", {
  text: "0G Storage stores encrypted memory blobs and snapshots.",
  tags: ["0g", "storage", "research"]
});

const sharedMemory = await hive.recallShared(
  "research.0g-storage.summary"
);
const privateMemory = await hive.recallPrivate(
  "agent.writer.style-notes"
);

await hive.commitMemory({
  key: "research.0g-storage.summary",
  scope: "shared"
});`;

const BASH_CODE = `hiveclaw create-hive research-swarm
hiveclaw add-agent 0xResearcher
hiveclaw add-agent 0xPlanner
hiveclaw add-agent 0xWriter
hiveclaw remember --private agent.writer.style-notes
hiveclaw remember --shared research.0g-storage.summary
hiveclaw recall --shared research.0g-storage.summary
hiveclaw inspect-history research.0g-storage.summary`;

function ProblemSection({ accent }: { accent: string }) {
  const cards = [
    {
      title: "Private memory gets siloed",
      desc: "Each agent may know something useful, but that context usually stays trapped inside one runtime.",
      icon: "🔒",
    },
    {
      title: "Shared memory gets messy",
      desc: "Multi-agent systems need a common source of truth, not scattered files, hidden prompts, or duplicated notes.",
      icon: "📂",
    },
    {
      title: "Storage needs provenance",
      desc: "If agents rely on decentralized storage, they need encrypted payloads, hashes, versions, writers, and timestamps.",
      icon: "🔗",
    },
  ];
  return (
    <Section id="problem" accent={accent} tint>
      <SectionHeader accent={accent} eyebrow="The Problem" title="Agents remember alone. Hives need shared context." center />
      <div className="three-col" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
        {cards.map((c) => (
          <Card key={c.title} accent={accent}>
            <div style={{ fontSize: 28, marginBottom: 14 }}>{c.icon}</div>
            <h3
              style={{
                fontFamily: "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif",
                fontWeight: 700,
                fontSize: 17,
                color: C.text,
                marginBottom: 10,
                lineHeight: 1.3,
              }}
            >
              {c.title}
            </h3>
            <p style={{ fontFamily: "var(--font-inter), Inter, sans-serif", fontSize: 14, color: C.muted, lineHeight: 1.65 }}>{c.desc}</p>
          </Card>
        ))}
      </div>
    </Section>
  );
}

function SolutionSection({ accent }: { accent: string }) {
  return (
    <Section id="solution" accent={accent}>
      <SectionHeader
        accent={accent}
        eyebrow="The Solution"
        title="Private thoughts. Shared hive memory."
        subtitle="HiveClaw gives every agent its own private namespace and a shared encrypted hive memory. Private memories stay local. Shared memories are encrypted before being stored on 0G Storage, with canonical pointers committed to a 0G Chain contract."
      />
      <div
        className="solution-grid"
        style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 0, alignItems: "start" }}
      >
        <div style={{ background: C.blue + "0d", border: `1px solid ${C.blue}33`, borderRadius: 20, padding: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.blue }} />
            <h3
              style={{
                fontFamily: "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif",
                fontWeight: 700,
                fontSize: 15,
                color: C.blue,
              }}
            >
              Private Agent Memories
            </h3>
          </div>
          {[
            { agent: "Agent A", items: ["preferences", "local scratchpad", "private task notes"] },
            { agent: "Agent B", items: ["draft plan", "intermediate reasoning", "personal tool state"] },
            { agent: "Agent C", items: ["cached observations", "local reminders"] },
          ].map((a) => (
            <div
              key={a.agent}
              style={{
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: "14px 16px",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-inter), Inter, sans-serif",
                  fontWeight: 600,
                  fontSize: 13,
                  color: C.blue,
                  marginBottom: 6,
                }}
              >
                {a.agent}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {a.items.map((item) => (
                  <span
                    key={item}
                    style={{
                      padding: "3px 10px",
                      borderRadius: 999,
                      background: C.blue + "14",
                      color: C.blue,
                      fontSize: 11,
                      fontFamily: "var(--font-inter), Inter, sans-serif",
                      fontWeight: 500,
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 20px",
            gap: 12,
            minWidth: 140,
            marginTop: 60,
          }}
        >
          <div style={{ width: 2, height: 40, background: `linear-gradient(${C.blue}, ${accent})` }} />
          <div
            style={{
              background: accent + "18",
              border: `2px solid ${accent}`,
              borderRadius: 14,
              padding: "12px 16px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif",
                fontWeight: 700,
                fontSize: 12,
                color: accent,
              }}
            >
              HiveClaw
            </div>
            <div style={{ fontFamily: "var(--font-inter), Inter, sans-serif", fontSize: 10, color: C.muted }}>Memory Router</div>
          </div>
          <div style={{ width: 2, height: 40, background: `linear-gradient(${accent}, ${C.purple})` }} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              fontSize: 10,
              color: C.muted,
              fontFamily: "var(--font-inter), Inter, sans-serif",
              textAlign: "center",
            }}
          >
            {["Encrypt", "↓", "0G Storage", "↓", "0G Chain pointer"].map((s) => (
              <span key={s} style={{ color: s === "↓" ? C.border : C.muted }}>
                {s}
              </span>
            ))}
          </div>
        </div>

        <div style={{ background: accent + "0d", border: `1px solid ${accent}33`, borderRadius: 20, padding: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: accent }} />
            <h3
              style={{
                fontFamily: "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif",
                fontWeight: 700,
                fontSize: 15,
                color: accent,
              }}
            >
              Shared Hive Memory
            </h3>
          </div>
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {[
                "project facts",
                "research findings",
                "decisions",
                "constraints",
                "reusable summaries",
                "verified outputs",
              ].map((item) => (
                <span
                  key={item}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 999,
                    background: accent + "14",
                    color: accent,
                    fontSize: 11,
                    fontFamily: "var(--font-inter), Inter, sans-serif",
                    fontWeight: 500,
                    border: `1px solid ${accent}33`,
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div
            style={{
              marginTop: 16,
              padding: "12px 16px",
              background: C.green + "0d",
              border: `1px solid ${C.green}33`,
              borderRadius: 12,
            }}
          >
            <div style={{ fontFamily: "var(--font-inter), Inter, sans-serif", fontSize: 12, color: C.green, fontWeight: 600, marginBottom: 4 }}>
              🔐 0G Storage
            </div>
            <div style={{ fontFamily: "var(--font-inter), Inter, sans-serif", fontSize: 11, color: C.muted }}>Encrypted blobs uploaded after routing</div>
          </div>
          <div
            style={{
              marginTop: 10,
              padding: "12px 16px",
              background: C.orange + "0d",
              border: `1px solid ${C.orange}33`,
              borderRadius: 12,
            }}
          >
            <div style={{ fontFamily: "var(--font-inter), Inter, sans-serif", fontSize: 12, color: C.orange, fontWeight: 600, marginBottom: 4 }}>
              ⛓ 0G Chain
            </div>
            <div style={{ fontFamily: "var(--font-inter), Inter, sans-serif", fontSize: 11, color: C.muted }}>
              HiveRegistry: pointers, hashes, versions, writers
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

function MemoryCardsSection({ accent }: { accent: string }) {
  const cards = [
    {
      scope: "Shared",
      memKey: "research.0g-storage.summary",
      writer: "Researcher Agent",
      tags: ["0G", "storage", "docs"],
      preview:
        "0G Storage is used for encrypted memory blobs and snapshots. The HiveRegistry contract stores the canonical pointer and content hash.",
      accent: C.purple,
    },
    {
      scope: "Shared",
      memKey: "product.decision.memory-model",
      writer: "Planner Agent",
      tags: ["architecture", "decision"],
      preview: "Use a hybrid memory model: KV for latest state, append-only commits for audit history.",
      accent: C.blue,
    },
    {
      scope: "Private",
      memKey: "agent.writer.style-notes",
      writer: "Writer Agent",
      tags: ["private", "style"],
      preview: "Prefer concise technical explanations. Avoid overclaiming security guarantees.",
      accent: C.orange,
    },
    {
      scope: "Shared",
      memKey: "demo.script.flow",
      writer: "Demo Agent",
      tags: ["demo", "hackathon"],
      preview:
        "Show five agents in a hive. One writes a finding, another recalls it, another verifies the hash, and an external reader sees ciphertext.",
      accent: C.green,
    },
    {
      scope: "Private",
      memKey: "agent.researcher.scratchpad",
      writer: "Researcher Agent",
      tags: ["private", "scratchpad"],
      preview: "Need to verify exact SDK call names before final README.",
      accent: C.muted,
    },
    {
      scope: "Shared",
      memKey: "risk.revocation-limit",
      writer: "Security Agent",
      tags: ["security", "limitation"],
      preview:
        "Removing an agent blocks future canonical writes, but any agent that already had the hive key may retain old decrypted memories.",
      accent: C.red,
    },
  ];
  return (
    <Section id="memory" accent={accent} tint>
      <SectionHeader accent={accent} eyebrow="Memory Examples" title="What does a hive actually remember?" center />
      <div className="mem-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
        {cards.map((c) => (
          <MemCard key={c.memKey} {...c} />
        ))}
      </div>
    </Section>
  );
}

function ArchSection({ accent }: { accent: string }) {
  const bullets = [
    "Private memories stay scoped to one agent.",
    "Shared memories are encrypted locally before upload.",
    "0G Storage stores encrypted memory blobs.",
    "0G Chain stores canonical pointers, hashes, versions, and writer history.",
    "HiveClaw SDK handles encryption, upload, recall, and verification.",
    "OpenClaw agents use simple memory tools.",
  ];
  return (
    <Section id="architecture" accent={accent}>
      <SectionHeader accent={accent} eyebrow="Architecture" title="Built as reusable agent infrastructure." />
      <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "start" }}>
        <div className="arch-diagram">
          <ArchDiagram />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 16 }}>
          {bullets.map((b, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: accent + "20",
                  border: `1.5px solid ${accent}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-inter), Inter, sans-serif",
                  fontWeight: 700,
                  fontSize: 11,
                  color: accent,
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                {i + 1}
              </div>
              <p style={{ fontFamily: "var(--font-inter), Inter, sans-serif", fontSize: 14, color: C.muted, lineHeight: 1.65 }}>{b}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

function FeaturesSection() {
  const feats = [
    { accent: C.purple, icon: "🧠", title: "Shared Hive Memory", desc: "A common encrypted memory layer for any number of agents." },
    { accent: C.blue, icon: "🔏", title: "Private Agent Memory", desc: "Per-agent namespaces for local context and scratchpads." },
    { accent: C.green, icon: "🔐", title: "Encrypted 0G Storage", desc: "Memory blobs are encrypted before decentralized storage." },
    { accent: C.orange, icon: "⛓", title: "On-chain Pointer Registry", desc: "0G Chain records which storage objects are canonical." },
    { accent: C.red, icon: "🕰", title: "Memory Versioning", desc: "Track updates to facts, summaries, decisions, and outputs." },
    { accent: C.purple, icon: "📜", title: "Provenance & Audit Trail", desc: "Know who wrote each memory, when, and with what content hash." },
  ];
  return (
    <Section id="features" accent={C.purple} tint>
      <SectionHeader accent={C.purple} eyebrow="Features" title="Everything an agent hive needs to remember." center />
      <div className="six-col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
        {feats.map((f) => (
          <FeatureCard key={f.title} {...f} />
        ))}
      </div>
    </Section>
  );
}

function APISection({ accent }: { accent: string }) {
  return (
    <Section id="api" accent={accent}>
      <SectionHeader accent={accent} eyebrow="Developer API" title="Simple tools for agent builders." />
      <div className="api-cols" style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: "var(--font-inter), Inter, sans-serif",
              fontWeight: 600,
              fontSize: 13,
              color: C.muted,
              marginBottom: 10,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            TypeScript SDK
          </div>
          <CodeBlock code={TS_CODE} lang="TypeScript" />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: "var(--font-inter), Inter, sans-serif",
              fontWeight: 600,
              fontSize: 13,
              color: C.muted,
              marginBottom: 10,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            CLI
          </div>
          <CodeBlock code={BASH_CODE} lang="bash" />
        </div>
      </div>
    </Section>
  );
}

function DemoSection({ accent }: { accent: string }) {
  return (
    <Section id="demo" accent={accent} tint>
      <SectionHeader
        accent={accent}
        eyebrow="Demo"
        title="Many agents, one hive memory."
        center
        subtitle="A Researcher writes a finding. A Planner turns it into a decision. A Writer recalls both to draft the submission. A Security Agent verifies the hash. An external reader only sees ciphertext."
      />
      <div style={{ marginBottom: 48 }}>
        <DemoFlow />
      </div>
      <div className="demo-agents" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
        {[
          { name: "Researcher", role: "Writes finding to shared hive memory", color: C.blue },
          { name: "Planner", role: "Reads finding, writes architecture decision", color: C.purple },
          { name: "Writer", role: "Recalls both memories, drafts submission", color: C.orange },
          { name: "Security", role: "Verifies content hash vs HiveRegistry", color: C.green },
          { name: "Demo", role: "External reader — sees only ciphertext", color: C.red },
        ].map((a) => (
          <div
            key={a.name}
            style={{
              background: C.bg,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: "20px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: a.color + "20",
                border: `2px solid ${a.color}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif",
                fontWeight: 800,
                fontSize: 14,
                color: a.color,
              }}
            >
              {a.name[0]}
            </div>
            <div
              style={{
                fontFamily: "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif",
                fontWeight: 700,
                fontSize: 13,
                color: C.text,
              }}
            >
              {a.name}
            </div>
            <div style={{ fontFamily: "var(--font-inter), Inter, sans-serif", fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{a.role}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function ZGSection({ accent }: { accent: string }) {
  const cards = [
    { title: "0G Storage", desc: "Encrypted memory blobs, snapshots, and memory object metadata.", color: C.green, icon: "🗄" },
    { title: "0G Chain", desc: "HiveRegistry contract for pointers, hashes, versions, writers, and timestamps.", color: C.orange, icon: "⛓" },
    { title: "0G Compute", desc: "Optional summarization, reflection loops, and memory compression.", color: C.blue, icon: "⚡" },
  ];
  return (
    <Section id="integration-0g" accent={accent}>
      <SectionHeader accent={accent} eyebrow="Integrations" title="Native 0G integration." center />
      <div className="three-col" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
        {cards.map((c) => (
          <Card key={c.title} accent={c.color}>
            <div style={{ fontSize: 28, marginBottom: 14 }}>{c.icon}</div>
            <h3
              style={{
                fontFamily: "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif",
                fontWeight: 700,
                fontSize: 17,
                color: c.color,
                marginBottom: 10,
              }}
            >
              {c.title}
            </h3>
            <p style={{ fontFamily: "var(--font-inter), Inter, sans-serif", fontSize: 14, color: C.muted, lineHeight: 1.65 }}>{c.desc}</p>
          </Card>
        ))}
      </div>
    </Section>
  );
}

function SecuritySection({ accent }: { accent: string }) {
  const points = [
    "Agents encrypt shared memory locally before upload.",
    "0G Storage never sees plaintext.",
    "The contract does not store secrets.",
    "The contract records only pointers, hashes, versions, writers, and provenance.",
    "Hive keys are pre-distributed to trusted hive agents for the MVP.",
    "The HiveRegistry contract controls canonical writes and memory history.",
    "Encryption protects the contents; the contract verifies the memory registry.",
  ];
  return (
    <Section id="security" accent={accent} tint>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "start" }} className="two-col">
        <div>
          <SectionHeader accent={accent} eyebrow="Security Model" title="Designed for untrusted storage." />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {points.map((p, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: accent,
                    marginTop: 8,
                    flexShrink: 0,
                  }}
                />
                <p style={{ fontFamily: "var(--font-inter), Inter, sans-serif", fontSize: 14, color: C.muted, lineHeight: 1.65 }}>{p}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingTop: 8 }}>
          <div
            style={{
              background: accent,
              borderRadius: 20,
              padding: "32px 28px",
              color: "#fff",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif",
                fontWeight: 800,
                fontSize: 22,
                marginBottom: 10,
                lineHeight: 1.2,
              }}
            >
              &quot;ACLs don&apos;t protect public storage. Encryption does.&quot;
            </div>
            <div style={{ fontFamily: "var(--font-inter), Inter, sans-serif", fontSize: 13, opacity: 0.8 }}>— HiveClaw security principle</div>
          </div>
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 22px" }}>
            <div style={{ fontFamily: "var(--font-inter), Inter, sans-serif", fontWeight: 600, fontSize: 13, color: accent, marginBottom: 8 }}>
              MVP scope
            </div>
            <p style={{ fontFamily: "var(--font-inter), Inter, sans-serif", fontSize: 13, color: C.muted, lineHeight: 1.65 }}>
              The MVP assumes trusted hive members share a hive key. Future versions can add per-member key envelopes and key rotation.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}

function CTASection({
  accent,
  githubUrl,
}: {
  accent: string;
  githubUrl?: string;
}) {
  const gh = githubUrl ?? "#";
  return (
    <Section id="cta" accent={accent}>
      <div style={{ textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
        <h2
          style={{
            fontFamily: "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif",
            fontWeight: 800,
            fontSize: "clamp(32px, 5vw, 56px)",
            color: C.text,
            marginBottom: 20,
            lineHeight: 1.1,
            letterSpacing: "-0.025em",
          }}
        >
          Give your agent hive a<br />
          <span style={{ color: accent }}>shared memory.</span>
        </h2>
        <p
          style={{
            fontFamily: "var(--font-inter), Inter, sans-serif",
            fontSize: 16,
            color: C.muted,
            marginBottom: 36,
            lineHeight: 1.6,
          }}
        >
          HiveClaw is open infrastructure. Drop it into any OpenClaw agent, connect to 0G, and your hive starts remembering together.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", alignItems: "center" }}>
          <Btn color={accent} href={gh}>
            View GitHub
          </Btn>
          <Btn color={accent} outline href="/hive">
            Hive dashboard
          </Btn>
          <Btn color={C.blue} outline href="/status">
            Chain status
          </Btn>
        </div>
      </div>
    </Section>
  );
}

export function SiteFooter({
  accent,
  githubUrl,
}: {
  accent: string;
  githubUrl?: string;
}) {
  const gh = githubUrl ?? "#";
  return (
    <footer style={{ background: C.text, color: "#fff", padding: "40px 32px" }}>
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden>
            <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" fill={accent} opacity="0.3" stroke={accent} strokeWidth="1.5" />
            <circle cx="14" cy="14" r="4" fill={accent} />
          </svg>
          <span style={{ fontFamily: "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, color: "#fff" }}>
            HiveClaw —{" "}
            <span style={{ color: accent, fontWeight: 400 }}>OpenClaw memory infrastructure for 0G agent hives.</span>
          </span>
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
          <Link href="/docs/" style={{ fontFamily: "var(--font-inter), Inter, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
            Docs
          </Link>
          <Link href="/hive" style={{ fontFamily: "var(--font-inter), Inter, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
            Memory &amp; registry
          </Link>
          <Link href="/status" style={{ fontFamily: "var(--font-inter), Inter, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
            Status
          </Link>
          <a
            href={gh}
            style={{ fontFamily: "var(--font-inter), Inter, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}

function HeroSection({ accent, githubUrl }: { accent: string; githubUrl?: string }) {
  const badges = ["OpenClaw Plugin", "0G Storage", "0G Chain", "Encrypted Memory", "Multi-Agent Hives", "Provenance Log"];
  const badgeColors = [C.purple, C.green, C.orange, C.blue, C.red, C.purple];
  const gh = githubUrl ?? "#";
  return (
    <section style={{ padding: "128px 0 80px", background: C.bg, borderBottom: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
        <div className="hero-inner" style={{ display: "flex", alignItems: "center", gap: 64 }}>
          <div className="hero-text" style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {badges.map((b, i) => (
                <PillBadge key={b} color={badgeColors[i]!}>
                  {b}
                </PillBadge>
              ))}
            </div>
            <h1
              style={{
                fontFamily: "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif",
                fontWeight: 800,
                fontSize: "clamp(32px, 5vw, 64px)",
                color: C.text,
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
              }}
            >
              Hive<span style={{ color: accent }}>Claw</span>:<br />
              Shared Memory
              <br />
              for Agent Hives
              <br />
              <span style={{ color: C.orange }}>on 0G</span>
            </h1>
            <p
              style={{
                fontFamily: "var(--font-inter), Inter, sans-serif",
                fontSize: 18,
                color: C.muted,
                lineHeight: 1.65,
                maxWidth: 500,
              }}
            >
              An OpenClaw extension that lets any number of AI agents keep private context, contribute to shared encrypted hive memory, and verify what the hive knows — using 0G Storage and an on-chain memory registry.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Btn color={accent} href={gh}>
                View GitHub
              </Btn>
              <Btn color={accent} outline href="/hive">
                Open dashboard
              </Btn>
            </div>
            <div
              style={{
                padding: "14px 20px",
                background: accent + "0d",
                border: `1px solid ${accent}33`,
                borderRadius: 12,
                display: "inline-flex",
                gap: 10,
                alignItems: "center",
                maxWidth: 440,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif",
                  fontSize: 14,
                  fontStyle: "italic",
                  color: C.text,
                  lineHeight: 1.5,
                }}
              >
                &quot;Every agent keeps its own thoughts. The hive remembers together.&quot;
              </span>
            </div>
          </div>
          <div className="hero-illu" style={{ flexShrink: 0 }}>
            <HeroIllustration />
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingPage({ githubUrl: githubUrlProp }: { githubUrl?: string }) {
  const heroAccent = DEFAULT_HERO_ACCENT;
  const envGh = process.env.NEXT_PUBLIC_GITHUB_URL;
  const githubUrl =
    githubUrlProp ?? (typeof envGh === "string" && envGh.length > 0 ? envGh : undefined);

  return (
    <div className="hc-landing">
      <HeroSection accent={heroAccent} githubUrl={githubUrl} />
      <ProblemSection accent={C.orange} />
      <SolutionSection accent={C.purple} />
      <MemoryCardsSection accent={C.blue} />
      <ArchSection accent={C.green} />
      <FeaturesSection />
      <APISection accent={C.purple} />
      <DemoSection accent={C.red} />
      <ZGSection accent={C.blue} />
      <SecuritySection accent={C.green} />
      <CTASection accent={heroAccent} githubUrl={githubUrl} />
    </div>
  );
}
