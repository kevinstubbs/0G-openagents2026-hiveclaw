"use client";

import { resolvePublicGithubUrl } from "@/lib/github-url";
import { DEFAULT_HERO_ACCENT } from "../landing/colors";
import { Nav } from "../landing/primitives";
import { SiteFooter } from "../landing/landing-sections";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const githubUrl = resolvePublicGithubUrl();

  return (
    <>
      <Nav accent={DEFAULT_HERO_ACCENT} githubUrl={githubUrl} />
      {children}
      <SiteFooter accent={DEFAULT_HERO_ACCENT} githubUrl={githubUrl} />
    </>
  );
}
