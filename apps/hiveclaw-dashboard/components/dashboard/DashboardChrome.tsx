"use client";

import type { ReactNode } from "react";
import { C, DEFAULT_HERO_ACCENT } from "@/components/landing/colors";
import { Btn, PillBadge } from "@/components/landing/primitives";

export function DashboardChrome({
  eyebrow,
  title,
  subtitle,
  accent = DEFAULT_HERO_ACCENT,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: ReactNode;
  accent?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="hc-dashboard">
      <div className="hc-dashboard-inner">
        <header className="hc-dashboard-hero">
          <div style={{ marginBottom: 14 }}>
            <PillBadge color={accent}>{eyebrow}</PillBadge>
          </div>
          <h1
            style={{
              fontFamily: "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(28px, 4vw, 44px)",
              color: C.text,
              lineHeight: 1.12,
              letterSpacing: "-0.03em",
              margin: "0 0 16px",
            }}
          >
            {title}
          </h1>
          {subtitle ? (
            <div
              style={{
                fontFamily: "var(--font-inter), Inter, sans-serif",
                fontSize: 17,
                color: C.muted,
                lineHeight: 1.65,
                maxWidth: 720,
                margin: 0,
              }}
            >
              {subtitle}
            </div>
          ) : null}
          {actions ? (
            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
                marginTop: 24,
              }}
            >
              {actions}
            </div>
          ) : null}
        </header>
        {children}
      </div>
    </main>
  );
}

export function DashboardNavActions({ accent = DEFAULT_HERO_ACCENT }: { accent?: string }) {
  return (
    <>
      <Btn color={accent} outline small href="/">
        Home
      </Btn>
      <Btn color={C.blue} outline small href="/status">
        Chain status
      </Btn>
      <Btn color={C.green} outline small href="/hive">
        Hive dashboard
      </Btn>
    </>
  );
}
