"use client";

import type { CSSProperties, ReactNode } from "react";
import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { C } from "./colors";

function NavTextLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  const [hover, setHover] = useState(false);
  const color = active || hover ? C.text : C.muted;
  return (
    <Link
      href={href}
      style={{
        fontFamily: "var(--font-inter), Inter, sans-serif",
        fontSize: 14,
        fontWeight: active ? 600 : 500,
        color,
        textDecoration: "none",
        transition: "color 0.15s",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </Link>
  );
}

export function PillBadge({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "5px 14px",
        borderRadius: 999,
        border: `1.5px solid ${color}`,
        color,
        fontSize: 13,
        fontWeight: 600,
        fontFamily: "var(--font-inter), Inter, sans-serif",
        letterSpacing: "0.01em",
        background: color + "14",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export function Section({
  id,
  accent,
  tint,
  children,
  style,
}: {
  id?: string;
  accent: string;
  tint?: boolean;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const bg = tint ? accent + "0d" : C.bg;
  return (
    <section
      id={id}
      style={{
        background: bg,
        padding: "96px 0",
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>{children}</div>
    </section>
  );
}

export function SectionHeader({
  accent,
  eyebrow,
  title,
  subtitle,
  center,
}: {
  accent: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <div
      style={{
        textAlign: center ? "center" : "left",
        marginBottom: 56,
        maxWidth: center ? 640 : 560,
        margin: center ? "0 auto 56px" : "0 0 56px",
      }}
    >
      {eyebrow && (
        <div style={{ marginBottom: 12 }}>
          <PillBadge color={accent}>{eyebrow}</PillBadge>
        </div>
      )}
      <h2
        style={{
          fontFamily: "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif",
          fontSize: "clamp(28px, 4vw, 48px)",
          fontWeight: 800,
          color: C.text,
          margin: "0 0 16px",
          lineHeight: 1.15,
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          style={{
            fontFamily: "var(--font-inter), Inter, sans-serif",
            fontSize: 17,
            color: C.muted,
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function Card({
  accent,
  children,
  style,
  hoverable = true,
}: {
  accent: string;
  children: ReactNode;
  style?: CSSProperties;
  hoverable?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => hoverable && setHovered(true)}
      onMouseLeave={() => hoverable && setHovered(false)}
      style={{
        background: C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        padding: 24,
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
        boxShadow: hovered ? "0 12px 32px rgba(15,15,20,0.10)" : "0 1px 4px rgba(15,15,20,0.04)",
        transform: hovered ? "translateY(-2px)" : "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Btn({
  color,
  outline,
  children,
  href,
  small,
}: {
  color: string;
  outline?: boolean;
  children: ReactNode;
  href?: string;
  small?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const pad = small ? "8px 18px" : "12px 24px";
  const fs = small ? 14 : 15;
  const style: CSSProperties = outline
    ? {
        background: hovered ? color + "14" : "transparent",
        border: `1.5px solid ${color}`,
        color,
        padding: pad,
        borderRadius: 8,
        fontFamily: "var(--font-inter), Inter, sans-serif",
        fontWeight: 600,
        fontSize: fs,
        cursor: "pointer",
        textDecoration: "none",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        whiteSpace: "nowrap",
        transition: "background 0.15s",
      }
    : {
        background: hovered ? color + "dd" : color,
        border: `1.5px solid ${color}`,
        color: "#fff",
        padding: pad,
        borderRadius: 8,
        fontFamily: "var(--font-inter), Inter, sans-serif",
        fontWeight: 600,
        fontSize: fs,
        cursor: "pointer",
        textDecoration: "none",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        whiteSpace: "nowrap",
        transition: "background 0.15s",
      };
  const url = href ?? "#";
  const isInternal = url.startsWith("/");
  if (isInternal) {
    return (
      <Link
        href={url}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={style}
      >
        {children}
      </Link>
    );
  }
  return (
    <a
      href={url}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={style}
      target={url.startsWith("http") ? "_blank" : undefined}
      rel={url.startsWith("http") ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  );
}

export function MemCard({
  scope,
  memKey,
  writer,
  tags,
  preview,
  accent,
}: {
  scope: string;
  memKey: string;
  writer: string;
  tags: string[];
  preview: string;
  accent: string;
}) {
  const isShared = scope === "Shared";
  const scopeColor = isShared ? C.purple : C.blue;
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: C.bg,
        border: `1px solid ${hovered ? accent : C.border}`,
        borderRadius: 14,
        padding: "20px 22px",
        transition: "all 0.2s ease",
        boxShadow: hovered ? `0 8px 28px ${accent}22` : "0 1px 4px rgba(15,15,20,0.04)",
        transform: hovered ? "translateY(-2px)" : "none",
        fontFamily: "var(--font-inter), Inter, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span
          style={{
            padding: "3px 10px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            background: scopeColor + "18",
            color: scopeColor,
            border: `1px solid ${scopeColor}40`,
          }}
        >
          {scope}
        </span>
        <span style={{ fontSize: 11, color: C.muted }}>by {writer}</span>
      </div>
      <div
        style={{
          fontFamily: "var(--font-jetbrains), 'JetBrains Mono', monospace",
          fontSize: 12,
          color: accent,
          fontWeight: 600,
          marginBottom: 8,
          wordBreak: "break-all",
        }}
      >
        {memKey}
      </div>
      <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.55, margin: "0 0 12px" }}>&quot;{preview}&quot;</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {tags.map((t) => (
          <span
            key={t}
            style={{
              padding: "2px 8px",
              borderRadius: 999,
              fontSize: 11,
              color: C.muted,
              background: "#f4f4f6",
              border: `1px solid ${C.border}`,
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export function FeatureCard({
  accent,
  icon,
  title,
  desc,
}: {
  accent: string;
  icon: string;
  title: string;
  desc: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: C.bg,
        border: `1px solid ${hovered ? accent : C.border}`,
        borderRadius: 16,
        padding: "28px 24px",
        transition: "all 0.2s ease",
        boxShadow: hovered ? `0 10px 28px ${accent}20` : "0 1px 4px rgba(15,15,20,0.04)",
        transform: hovered ? "translateY(-3px)" : "none",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: accent + "18",
          border: `1.5px solid ${accent}40`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
          fontSize: 20,
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          fontFamily: "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif",
          fontWeight: 700,
          fontSize: 16,
          color: C.text,
          margin: "0 0 8px",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontFamily: "var(--font-inter), Inter, sans-serif",
          fontSize: 14,
          color: C.muted,
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        {desc}
      </p>
    </div>
  );
}

export function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    void navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", border: `1px solid ${C.border}` }}>
      <div
        style={{
          background: "#13111a",
          padding: "10px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-inter), Inter, sans-serif",
            fontSize: 12,
            color: "#666",
            fontWeight: 500,
          }}
        >
          {lang}
        </span>
        <button
          type="button"
          onClick={copy}
          style={{
            background: "none",
            border: "1px solid #333",
            color: "#aaa",
            padding: "3px 10px",
            borderRadius: 6,
            cursor: "pointer",
            fontFamily: "var(--font-inter), Inter, sans-serif",
            fontSize: 11,
            fontWeight: 500,
          }}
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <pre
        style={{
          background: "#1a1825",
          margin: 0,
          padding: "20px 24px",
          overflowX: "auto",
          fontFamily: "var(--font-jetbrains), 'JetBrains Mono', monospace",
          fontSize: 13,
          lineHeight: 1.75,
          color: "#e8e4f0",
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function DemoFlow() {
  const steps = [
    { id: 1, label: "Researcher", action: "Writes finding", color: C.blue },
    { id: 2, label: "Planner", action: "Turns into decision", color: C.purple },
    { id: 3, label: "Writer", action: "Recalls + drafts", color: C.orange },
    { id: 4, label: "Security", action: "Verifies hash", color: C.green },
    { id: 5, label: "Demo", action: "Sees ciphertext", color: C.red },
  ];
  return (
    <div
      className="demo-flow"
      style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "wrap", justifyContent: "center" }}
    >
      {steps.map((s, i) => (
        <Fragment key={s.id}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, minWidth: 100 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: s.color + "20",
                border: `2.5px solid ${s.color}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif",
                fontWeight: 800,
                fontSize: 20,
                color: s.color,
              }}
            >
              {s.id}
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-inter), Inter, sans-serif", fontWeight: 600, fontSize: 13, color: C.text }}>
                {s.label}
              </div>
              <div style={{ fontFamily: "var(--font-inter), Inter, sans-serif", fontSize: 11, color: C.muted }}>{s.action}</div>
            </div>
          </div>
          {i < steps.length - 1 && (
            <div
              style={{
                width: 40,
                height: 2,
                background: `linear-gradient(90deg, ${s.color}, ${steps[i + 1]!.color})`,
                margin: "0 4px",
                flexShrink: 0,
                marginTop: -24,
              }}
            />
          )}
        </Fragment>
      ))}
    </div>
  );
}

const SECTION_NAV: { label: string; hash: string }[] = [
  { label: "Features", hash: "features" },
  { label: "Architecture", hash: "architecture" },
  { label: "API", hash: "api" },
  { label: "Demo", hash: "demo" },
];

export function Nav({
  accent,
  githubUrl,
}: {
  accent: string;
  githubUrl?: string;
}) {
  const pathname = usePathname() ?? "";
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);
  const gh = githubUrl ?? "#";
  const docsActive = pathname === "/docs" || pathname.startsWith("/docs/");
  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: scrolled ? "rgba(255,255,255,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? `1px solid ${C.border}` : "none",
        transition: "all 0.25s ease",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 32px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
            <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" fill={accent} opacity="0.15" stroke={accent} strokeWidth="1.5" />
            <polygon points="14,7 21,10.5 21,17.5 14,21 7,17.5 7,10.5" fill={accent} opacity="0.3" />
            <circle cx="14" cy="14" r="4" fill={accent} />
          </svg>
          <span
            style={{
              fontFamily: "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif",
              fontWeight: 800,
              fontSize: 18,
              color: C.text,
              letterSpacing: "-0.02em",
            }}
          >
            Hive<span style={{ color: accent }}>Claw</span>
          </span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            {SECTION_NAV.map(({ label, hash }) => (
              <NavTextLink key={hash} href={`/#${hash}`} active={false}>
                {label}
              </NavTextLink>
            ))}
            <NavTextLink href="/docs/" active={docsActive}>
              Docs
            </NavTextLink>
            <NavTextLink href="/status" active={pathname === "/status"}>
              Status
            </NavTextLink>
            <NavTextLink href="/hive" active={pathname === "/hive"}>
              Memory
            </NavTextLink>
          </div>
          <Btn color={accent} small href={gh}>
            View GitHub
          </Btn>
        </div>
      </div>
    </nav>
  );
}
