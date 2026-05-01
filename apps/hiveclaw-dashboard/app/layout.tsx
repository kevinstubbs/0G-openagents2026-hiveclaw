import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HiveClaw Dashboard",
  description: "HiveClaw Phase 1 status",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
