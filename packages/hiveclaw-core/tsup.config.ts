import { defineConfig } from "tsup";

export default defineConfig({
  /** `hive-registry` entry is browser-safe (ethers only); main `index` pulls Node storage deps. */
  entry: [
    "src/index.ts",
    "src/hive-registry.ts",
    "src/ping-resolved.ts",
    "src/load-config.ts",
    "src/ping-cli.ts",
  ],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "node20",
});
