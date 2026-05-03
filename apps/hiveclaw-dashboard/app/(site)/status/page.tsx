import { pingSummary } from "hiveclaw-core";
import { runPing } from "hiveclaw-core/ping-cli";
import { DashboardChrome, DashboardNavActions } from "@/components/dashboard/DashboardChrome";
import { StatusResults } from "@/components/dashboard/StatusResults";
import { DEFAULT_HERO_ACCENT } from "@/components/landing/colors";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Status · HiveClaw",
};

export default async function StatusPage() {
  const result = await runPing();
  const text = pingSummary(result);
  const json = JSON.stringify(result, null, 2);

  return (
    <DashboardChrome
      eyebrow="Operations"
      title="HiveClaw status"
      subtitle="Server-rendered health check using hiveclaw-core and the same environment variables as the CLI."
      accent={DEFAULT_HERO_ACCENT}
      actions={<DashboardNavActions />}
    >
      <StatusResults summaryText={text} json={json} />
    </DashboardChrome>
  );
}
