import { pingSummary, runPing } from "hiveclaw-core";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

async function runDoctor(): Promise<void> {
  let result;
  try {
    result = await runPing();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`HiveClaw doctor failed: ${msg}`);
    process.exitCode = 1;
    return;
  }
  console.log(pingSummary(result));
  const badChain = Boolean(result.chainIdNote);
  const badBootstrap = result.bootstrap && !result.bootstrap.ok;
  const badStorage = !result.storage.ok && !result.storage.skipped;
  if (badChain || badBootstrap || badStorage) {
    process.exitCode = 1;
  }
}

const raw = hideBin(process.argv);
const argv = raw.length === 0 ? ["doctor"] : raw;

try {
  await yargs(argv)
    .scriptName("hiveclaw")
    .usage("$0 <command>")
    .command(
      "doctor",
      "Print chain id, block, bootstrap contract, and storage smoke status",
      () => {},
      async () => {
        await runDoctor();
      },
    )
    .command(
      "ping",
      "Alias for doctor",
      () => {},
      async () => {
        await runDoctor();
      },
    )
    .demandCommand(1, "Specify doctor or ping")
    .strict()
    .help()
    .alias("h", "help")
    .parseAsync();
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
}
