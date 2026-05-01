import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  target: "node20",
  external: ["openclaw", "hiveclaw-core", "ethers", "@0gfoundation/0g-storage-ts-sdk"],
});
