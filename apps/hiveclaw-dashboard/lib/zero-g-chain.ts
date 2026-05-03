import { defineChain } from "viem";

const rpcUrl =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_HIVECLAW_RPC_URL) ||
  "https://evmrpc-testnet.0g.ai";

/** 0G Galileo testnet — https://docs.0g.ai/developer-hub/testnet/testnet-overview */
export const zeroGGalileo = defineChain({
  id: 16_602,
  name: "0G Galileo Testnet",
  nativeCurrency: { name: "OG", symbol: "OG", decimals: 18 },
  rpcUrls: {
    default: { http: [rpcUrl] },
  },
  blockExplorers: {
    default: { name: "0G ChainScan", url: "https://chainscan-galileo.0g.ai" },
  },
});
