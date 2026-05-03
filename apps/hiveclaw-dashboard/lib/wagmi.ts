import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "viem";
import { zeroGGalileo } from "./zero-g-chain";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (typeof process !== "undefined" && !projectId) {
  // Build still works; set a real id from https://cloud.reown.com/ (WalletConnect) for production.
  console.warn(
    "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. WalletConnect / mobile wallets may not work.",
  );
}

export const wagmiConfig = getDefaultConfig({
  appName: "HiveClaw",
  projectId: projectId ?? "00000000000000000000000000000000",
  chains: [zeroGGalileo],
  transports: {
    [zeroGGalileo.id]: http(),
  },
  ssr: true,
});
