import { pingSummary, runPing } from "hiveclaw-core";

export const dynamic = "force-dynamic";

export default async function StatusPage() {
  const result = await runPing();
  const text = pingSummary(result);
  const json = JSON.stringify(result, null, 2);

  return (
    <main className="app-shell">
      <h1>HiveClaw status</h1>
      <p>
        Rendered on the server using <code>hiveclaw-core</code> and the same env vars as the CLI.
      </p>
      <h2>Summary</h2>
      <pre>{text}</pre>
      <h2>JSON</h2>
      <pre>{json}</pre>
    </main>
  );
}
