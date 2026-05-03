#!/usr/bin/env node
/**
 * Rewrite plugin package.json for a clean `npm install --omit=dev` (OpenClaw rejects
 * pnpm workspace symlinks under node_modules when scanning the plugin).
 */
import fs from "node:fs";

const path = process.argv[2];
if (!path) {
  console.error("usage: strip-openclaw-plugin-package-json.mjs <package.json>");
  process.exit(1);
}
const p = JSON.parse(fs.readFileSync(path, "utf8"));
delete p.devDependencies;
delete p.peerDependencies;
p.dependencies = {
  "@0gfoundation/0g-storage-ts-sdk":
    p.dependencies?.["@0gfoundation/0g-storage-ts-sdk"] ?? "^1.2.8",
  "@sinclair/typebox": p.dependencies?.["@sinclair/typebox"] ?? "^0.34.33",
  ethers: p.dependencies?.ethers ?? "6.13.1",
};
fs.writeFileSync(path, JSON.stringify(p, null, 2) + "\n");
