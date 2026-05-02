import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Avoid redirect /docs → /docs/: Next defaults strip trailing slashes on static paths,
  // which caused an infinite redirect loop with a trailing-slash redirect.
  async rewrites() {
    return [{ source: "/docs", destination: "/docs/index.html" }];
  },
};

export default nextConfig;
