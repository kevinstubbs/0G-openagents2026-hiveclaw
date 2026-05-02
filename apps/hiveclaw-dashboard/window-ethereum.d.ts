export {};

/** Injected wallet (MetaMask, etc.) */
type InjectedProvider = {
  request: (args: { method: string; params?: unknown[] | Record<string, string> }) => Promise<unknown>;
};

declare global {
  interface Window {
    ethereum?: InjectedProvider;
  }
}
