import type { NextConfig } from "next";
import path from "node:path";

/** Resolve workspace package to TS sources so Vercel can build without a separate `tsup` step for hiveclaw-core. */
const hiveclawCoreSrc = path.join(__dirname, "../../packages/hiveclaw-core/src");
const hiveclawAliases: Record<string, string> = {
  "hiveclaw-core/hive-registry": path.join(hiveclawCoreSrc, "hive-registry.ts"),
  "hiveclaw-core/load-config": path.join(hiveclawCoreSrc, "load-config.ts"),
  "hiveclaw-core/ping-cli": path.join(hiveclawCoreSrc, "ping-cli.ts"),
  "hiveclaw-core/ping-resolved": path.join(hiveclawCoreSrc, "ping-resolved.ts"),
  "hiveclaw-core": path.join(hiveclawCoreSrc, "index.ts"),
};

const nextConfig: NextConfig = {
  transpilePackages: ["hiveclaw-core"],
  turbopack: {
    // Allow compiling sources under ../../packages when the app root is apps/hiveclaw-dashboard.
    root: path.join(__dirname, "../.."),
    resolveAlias: hiveclawAliases,
  },
  webpack: (config) => {
    config.resolve.alias = { ...config.resolve.alias, ...hiveclawAliases };
    // hiveclaw-core uses NodeNext `import "./x.js"` → compile `.ts` sources (see TS 5.0 extensionResolution).
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },
  // Avoid redirect /docs → /docs/: Next defaults strip trailing slashes on static paths,
  // which caused an infinite redirect loop with a trailing-slash redirect.
  async rewrites() {
    return [{ source: "/docs", destination: "/docs/index.html" }];
  },
};

export default nextConfig;
