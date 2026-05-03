import { DashboardChrome, DashboardNavActions } from "@/components/dashboard/DashboardChrome";
import { C } from "@/components/landing/colors";
import { Section, SectionHeader } from "@/components/landing/primitives";
import { HiveRegistryPanel } from "../../../components/HiveRegistryPanel";
import { MemoryExplorer } from "../../../components/MemoryExplorer";
import { zeroGGalileo } from "@/lib/zero-g-chain";

/** Wallet SDK touches browser-only APIs; avoid static prerender for this route. */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Hive registry · HiveClaw",
};

function explorerEnv() {
  const rpcUrl = process.env.NEXT_PUBLIC_HIVECLAW_RPC_URL ?? "https://evmrpc-testnet.0g.ai";
  const registry = process.env.NEXT_PUBLIC_HIVECLAW_HIVE_REGISTRY_CONTRACT ?? "";
  return { rpcUrl, registry };
}

export default function HivePage() {
  const { rpcUrl, registry } = explorerEnv();
  const explorerBase = zeroGGalileo.blockExplorers.default.url;

  return (
    <DashboardChrome
      eyebrow="0G Galileo"
      title="Hive registry & memory"
      accent={C.purple}
      actions={<DashboardNavActions accent={C.purple} />}
      subtitle={
        <>
          Reads use public RPC and the configured registry address. Writes use your browser wallet on{" "}
          <strong>0G Galileo testnet</strong> (chain id 16602). After you connect,{" "}
          <code className="hc-dashboard-code">memberHives</code> fill the hive picker; use that id for memory operations.
          {registry ? (
            <span style={{ display: "block", marginTop: 14 }}>
              <span style={{ color: C.muted }}>Registry · </span>
              <code className="hc-dashboard-code" style={{ wordBreak: "break-all" }}>
                {registry}
              </code>{" "}
              <a
                href={`${explorerBase}/address/${registry}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "var(--font-inter), Inter, sans-serif",
                  fontWeight: 600,
                  fontSize: 15,
                  color: C.blue,
                  textDecoration: "none",
                  borderBottom: `1px solid ${C.blue}55`,
                }}
              >
                View on 0G ChainScan
              </a>
            </span>
          ) : (
            <span
              role="status"
              style={{
                display: "block",
                marginTop: 14,
                padding: "12px 16px",
                borderRadius: 12,
                background: `${C.orange}12`,
                border: `1px solid ${C.orange}44`,
                color: C.text,
                fontSize: 15,
              }}
            >
              Set <code className="hc-dashboard-code">NEXT_PUBLIC_HIVECLAW_HIVE_REGISTRY_CONTRACT</code> in your env to
              enable registry reads and writes on this dashboard.
            </span>
          )}
        </>
      }
    >
      <Section id="hive-tools" accent={C.purple} tint style={{ padding: "48px 0 96px" }}>
        <SectionHeader
          accent={C.purple}
          eyebrow="Dashboard"
          title="Wallet, registry, and memory"
          subtitle="Connect with RainbowKit, inspect hive metadata, run smoke commits, and browse on-chain memory history."
          center
        />
        <div style={{ display: "grid", gap: 28, maxWidth: 920, margin: "0 auto" }}>
          <HiveRegistryPanel />
          {registry ? <MemoryExplorer rpcUrl={rpcUrl} registry={registry} /> : null}
        </div>
      </Section>
    </DashboardChrome>
  );
}
