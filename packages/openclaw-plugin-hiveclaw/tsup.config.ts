import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  target: "node20",
  // Bundle hiveclaw-core so `openclaw plugins install` passes dependency scans:
  // pnpm workspaces symlink hiveclaw-core outside the plugin dir, which OpenClaw rejects.
  external: ["openclaw", "ethers", "@0gfoundation/0g-storage-ts-sdk"],
  noExternal: ["hiveclaw-core"],
});
