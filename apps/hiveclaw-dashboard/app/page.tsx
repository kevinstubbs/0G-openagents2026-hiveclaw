import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>HiveClaw</h1>
      <p>
        <Link href="/status">Status</Link> — chain and storage checks (same RPC as CLI when env matches).
      </p>
    </main>
  );
}
