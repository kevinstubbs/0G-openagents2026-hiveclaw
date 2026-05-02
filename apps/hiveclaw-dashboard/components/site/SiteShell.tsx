"use client";

import { DEFAULT_HERO_ACCENT } from "../landing/colors";
import { Nav } from "../landing/primitives";
import { SiteFooter } from "../landing/landing-sections";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const envGh = process.env.NEXT_PUBLIC_GITHUB_URL;
  const githubUrl = typeof envGh === "string" && envGh.length > 0 ? envGh : undefined;

  return (
    <>
      <Nav accent={DEFAULT_HERO_ACCENT} githubUrl={githubUrl} />
      {children}
      <SiteFooter accent={DEFAULT_HERO_ACCENT} githubUrl={githubUrl} />
    </>
  );
}
