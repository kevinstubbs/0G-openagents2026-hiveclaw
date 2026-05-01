import { Contract, JsonRpcProvider } from "ethers";

const BOOTSTRAP_ABI = [
  "function version() view returns (uint256)",
  "function ping() view returns (string)",
] as const;

export async function getChainId(rpcUrl: string): Promise<bigint> {
  const provider = new JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();
  return network.chainId;
}

export async function getLatestBlockNumber(rpcUrl: string): Promise<bigint> {
  const provider = new JsonRpcProvider(rpcUrl);
  return provider.getBlockNumber().then(BigInt);
}

export type BootstrapReadResult =
  | { ok: true; address: string; version: string; ping: string }
  | { ok: false; address: string; error: string };

export async function readBootstrapContract(
  rpcUrl: string,
  address: string,
): Promise<BootstrapReadResult> {
  try {
    const provider = new JsonRpcProvider(rpcUrl);
    const c = new Contract(address, BOOTSTRAP_ABI, provider);
    const version = await c.version();
    const ping = await c.ping();
    return {
      ok: true,
      address,
      version: String(version),
      ping: String(ping),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, address, error: msg };
  }
}
