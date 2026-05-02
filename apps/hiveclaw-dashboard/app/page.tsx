import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>HiveClaw</h1>
      <p>
        <Link href="/status">Status</Link> — chain and storage checks (same RPC as CLI when env matches).
      </p>
      <p>
        <Link href="/hive">Hive registry</Link> — hives, members, <code>memberHives</code> picker, memory smoke (wallet + read-only).
      </p>
    </main>
  );
}
