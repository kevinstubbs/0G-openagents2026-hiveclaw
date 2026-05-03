/** Landing “View GitHub” / nav when `NEXT_PUBLIC_GITHUB_URL` is unset. */
export const DEFAULT_GITHUB_REPO_URL =
  "https://github.com/kevinstubbs/0G-openagents2026-hiveclaw";

export function resolvePublicGithubUrl(propUrl?: string): string {
  const fromProp = typeof propUrl === "string" ? propUrl.trim() : "";
  if (fromProp.length > 0) return fromProp;
  const fromEnv = process.env.NEXT_PUBLIC_GITHUB_URL?.trim() ?? "";
  if (fromEnv.length > 0) return fromEnv;
  return DEFAULT_GITHUB_REPO_URL;
}
