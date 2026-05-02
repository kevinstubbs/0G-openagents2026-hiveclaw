import { HiveRegistryPanel } from "../../../components/HiveRegistryPanel";
import { MemoryExplorer } from "../../../components/MemoryExplorer";

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
  return (
    <main className="app-shell">
      <h1>Hive registry &amp; memory</h1>
      <p>
        Reads use public RPC + contract address. Writes use your browser wallet on{" "}
        <strong>0G Galileo testnet</strong> (chain id 16602). After connect, your{" "}
        <code>memberHives</code> populate the hive picker; use the hive id for memory ops.
      </p>
      <HiveRegistryPanel />
      {registry ? <MemoryExplorer rpcUrl={rpcUrl} registry={registry} /> : null}
    </main>
  );
}
