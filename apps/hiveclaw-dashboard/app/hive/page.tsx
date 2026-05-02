import { HiveRegistryPanel } from "../../components/HiveRegistryPanel";

export const metadata = {
  title: "Hive registry · HiveClaw",
};

export default function HivePage() {
  return (
    <main style={{ padding: "1.5rem" }}>
      <h1>Hive registry</h1>
      <p>
        Reads use public RPC + contract address. Writes use your browser wallet on{" "}
        <strong>0G Galileo testnet</strong> (chain id 16602). After connect, your{" "}
        <code>memberHives</code> populate the hive picker; use the hive id for memory ops.
      </p>
      <HiveRegistryPanel />
    </main>
  );
}
