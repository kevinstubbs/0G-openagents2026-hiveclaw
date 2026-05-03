import {
  addRegistryMember,
  addressFromPrivateKey,
  commitMemory,
  createHiveAndWait,
  fetchMemoryHistory,
  getHiveMemory,
  getHiveRegistryDetail,
  getLatestMemory,
  getMemberHives,
  isHiveMember,
  putHiveMemory,
  reflectAndCommitShared,
  resolveHiveKeyHex,
  type HiveclawConfig,
  memoryKeyFromString,
  pingSummary,
  removeRegistryMember,
  summarizeMemories,
  waitTxHash,
  ZeroHash,
} from "hiveclaw-core";
import { loadHiveclawConfig } from "hiveclaw-core/load-config";
import { runPing } from "hiveclaw-core/ping-cli";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

function requireRegistry(cfg: HiveclawConfig): string {
  const a = cfg.hiveRegistryContract;
  if (!a) throw new Error("Set HIVECLAW_HIVE_REGISTRY_CONTRACT to the deployed HiveRegistry address");
  return a;
}

function requireSigner(cfg: HiveclawConfig): string {
  const k = cfg.chainPrivateKey;
  if (!k) throw new Error("Set HIVECLAW_CHAIN_PRIVATE_KEY (or PRIVATE_KEY) for chain transactions");
  return k;
}

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
  const badHiveRegistry = result.hiveRegistry && !result.hiveRegistry.ok;
  const badStorage = !result.storage.ok && !result.storage.skipped;
  if (badChain || badBootstrap || badHiveRegistry || badStorage) {
    process.exitCode = 1;
  }
}

function parseBytes32Hex(s: string, label: string): string {
  const t = s.trim();
  if (!/^0x[0-9a-fA-F]{64}$/.test(t)) {
    throw new Error(`${label} must be a 32-byte hex string (0x + 64 hex chars)`);
  }
  return t;
}

const raw = hideBin(process.argv);
const argv = raw.length === 0 ? ["doctor"] : raw;

try {
  await yargs(argv)
    .scriptName("hiveclaw")
    .usage("$0 <command>")
    .command(
      "doctor",
      "Print chain id, block, bootstrap, HiveRegistry, and storage smoke status",
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
    .command(
      "hive",
      "Create or inspect hives (HiveRegistry)",
      (y) =>
        y
          .command(
            "create <name>",
            "Create a hive (caller becomes creator and first member)",
            () => {},
            async (argv) => {
              const cfg = loadHiveclawConfig();
              const reg = requireRegistry(cfg);
              const pk = requireSigner(cfg);
              const { hiveId, txHash } = await createHiveAndWait(cfg.rpcUrl, reg, pk, String(argv.name));
              console.log(`tx ${txHash}`);
              console.log(`hiveId ${hiveId}`);
            },
          )
          .command(
            "show <hiveId>",
            "Print hive name, creator, and members",
            () => {},
            async (argv) => {
              const cfg = loadHiveclawConfig();
              const reg = requireRegistry(cfg);
              const id = BigInt(String(argv.hiveId));
              const detail = await getHiveRegistryDetail(cfg.rpcUrl, reg, id);
              console.log(`hiveId: ${detail.hiveId}`);
              console.log(`name: ${detail.name}`);
              console.log(`creator: ${detail.creator}`);
              console.log(`members (${detail.memberCount}):`);
              for (const m of detail.members) {
                console.log(`  ${m.address}`);
              }
            },
          )
          .command(
            "list",
            "List hive ids for a wallet (read-only RPC)",
            (y2) =>
              y2.option("wallet", {
                type: "string",
                describe: "0x address (required unless using --my with a configured signer)",
              }),
            async (argv) => {
              const cfg = loadHiveclawConfig();
              const reg = requireRegistry(cfg);
              let addr = argv.wallet as string | undefined;
              if (!addr) {
                const pk = cfg.chainPrivateKey;
                if (!pk) {
                  throw new Error("Pass --wallet 0x… or set HIVECLAW_CHAIN_PRIVATE_KEY for default wallet");
                }
                addr = addressFromPrivateKey(pk);
              }
              if (!addr.startsWith("0x")) throw new Error("wallet must be a 0x address");
              const ids = await getMemberHives(cfg.rpcUrl, reg, addr);
              if (ids.length === 0) {
                console.log("(no hives for this address)");
                return;
              }
              for (const id of ids) {
                console.log(String(id));
              }
            },
          )
          .command(
            "my",
            "List hive ids for the configured chain private key (same as hive list without --wallet)",
            () => {},
            async () => {
              const cfg = loadHiveclawConfig();
              const reg = requireRegistry(cfg);
              const pk = requireSigner(cfg);
              const addr = addressFromPrivateKey(pk);
              const ids = await getMemberHives(cfg.rpcUrl, reg, addr);
              if (ids.length === 0) {
                console.log("(no hives for this address)");
                return;
              }
              for (const id of ids) {
                console.log(String(id));
              }
            },
          )
          .demandCommand(1, "Specify hive subcommand (create | show | list | my)"),
      () => {},
    )
    .command(
      "member",
      "Add or remove members (creator only on-chain)",
      (y) =>
        y
          .command(
            "add <hiveId> <address>",
            "Add a member to a hive",
            () => {},
            async (argv) => {
              const cfg = loadHiveclawConfig();
              const reg = requireRegistry(cfg);
              const pk = requireSigner(cfg);
              const tx = await addRegistryMember(
                cfg.rpcUrl,
                reg,
                pk,
                BigInt(String(argv.hiveId)),
                String(argv.address),
              );
              console.log(`tx ${await waitTxHash(tx)}`);
            },
          )
          .command(
            "remove <hiveId> <address>",
            "Remove a member (cannot remove creator)",
            () => {},
            async (argv) => {
              const cfg = loadHiveclawConfig();
              const reg = requireRegistry(cfg);
              const pk = requireSigner(cfg);
              const tx = await removeRegistryMember(
                cfg.rpcUrl,
                reg,
                pk,
                BigInt(String(argv.hiveId)),
                String(argv.address),
              );
              console.log(`tx ${await waitTxHash(tx)}`);
            },
          )
          .command(
            "check <hiveId> <address>",
            "Print whether address is a hive member",
            () => {},
            async (argv) => {
              const cfg = loadHiveclawConfig();
              const reg = requireRegistry(cfg);
              const ok = await isHiveMember(cfg.rpcUrl, reg, BigInt(String(argv.hiveId)), String(argv.address));
              console.log(`member: ${ok}`);
            },
          )
          .demandCommand(1, "Specify member subcommand (add | remove | check)"),
      () => {},
    )
    .command(
      "memory",
      "HiveRegistry memory commits",
      (y) =>
        y
          .command(
            "commit <hiveId>",
            "commitMemory smoke: register a storage pointer + hash for a logical key (must be a member)",
            (y2) =>
              y2
                .option("key", {
                  type: "string",
                  default: "shared/smoke",
                  describe: "Logical key string (keccak256 UTF-8 → bytes32 memoryKey)",
                })
                .option("pointer", {
                  type: "string",
                  describe: "bytes32 storage pointer (default: 0x0…0)",
                })
                .option("hash", {
                  type: "string",
                  describe: "bytes32 content hash (default: 0x0…0)",
                })
                .option("key-version", {
                  type: "string",
                  default: "0",
                  describe: "uint256 keyVersion",
                })
                .option("metadata", {
                  type: "string",
                  default: "",
                  describe: "metadata URI string",
                }),
            async (argv) => {
              const cfg = loadHiveclawConfig();
              const reg = requireRegistry(cfg);
              const pk = requireSigner(cfg);
              const pointer = argv.pointer != null && String(argv.pointer) !== ""
                ? parseBytes32Hex(String(argv.pointer), "--pointer")
                : ZeroHash;
              const contentHash = argv.hash != null && String(argv.hash) !== ""
                ? parseBytes32Hex(String(argv.hash), "--hash")
                : ZeroHash;
              const memKey = memoryKeyFromString(String(argv.key));
              const kv = BigInt(String(argv["key-version"]));
              const tx = await commitMemory(
                cfg.rpcUrl,
                reg,
                pk,
                BigInt(String(argv.hiveId)),
                memKey,
                pointer,
                contentHash,
                kv,
                String(argv.metadata ?? ""),
              );
              console.log(`tx ${await waitTxHash(tx)}`);
              console.log(`memoryKey ${memKey}`);
            },
          )
          .command(
            "latest <hiveId>",
            "Read latestMemory for a logical key",
            (y2) =>
              y2.option("key", {
                type: "string",
                default: "shared/smoke",
                describe: "Logical key string (hashed like commit)",
              }),
            async (argv) => {
              const cfg = loadHiveclawConfig();
              const reg = requireRegistry(cfg);
              const memKey = memoryKeyFromString(String(argv.key));
              const m = await getLatestMemory(cfg.rpcUrl, reg, BigInt(String(argv.hiveId)), memKey);
              console.log(JSON.stringify(m, null, 2));
            },
          )
          .command(
            "put <hiveId>",
            "Encrypt + upload + commitMemory (shared or private lane)",
            (y2) =>
              y2
                .option("scope", {
                  choices: ["shared", "private"] as const,
                  default: "shared",
                  describe: "shared/* vs private/<your-address>/*",
                })
                .option("segment", {
                  type: "string",
                  demandOption: true,
                  describe: 'Path segment e.g. "findings/round1" or "notes"',
                })
                .option("message", {
                  type: "string",
                  describe: "UTF-8 plaintext body",
                })
                .option("file", {
                  type: "string",
                  describe: "Read plaintext from file instead of --message",
                }),
            async (argv) => {
              const cfg = loadHiveclawConfig();
              requireRegistry(cfg);
              requireSigner(cfg);
              let body = argv.message as string | undefined;
              if (argv.file) {
                const { readFile } = await import("node:fs/promises");
                body = await readFile(String(argv.file), "utf8");
              }
              if (!body) throw new Error("Provide --message or --file");
              const hiveId = BigInt(String(argv.hiveId));
              const pk = requireSigner(cfg);
              const agent = addressFromPrivateKey(pk);
              const hiveKey = resolveHiveKeyHex(hiveId, cfg);
              if (!hiveKey) {
                throw new Error(
                  "Set HIVECLAW_HIVE_KEY_HEX or HIVECLAW_HIVE_KEYS_JSON for this hive id",
                );
              }
              const r = await putHiveMemory({
                cfg,
                hiveId,
                plaintext: body,
                hiveKeyHex: hiveKey,
                segment: String(argv.segment),
                scope: argv.scope as "shared" | "private",
                agentAddress: agent,
              });
              console.log(JSON.stringify(r, null, 2));
            },
          )
          .command(
            "get <hiveId>",
            "Download latest ciphertext blob, decrypt, verify hash",
            (y2) =>
              y2
                .option("scope", {
                  choices: ["shared", "private"] as const,
                  demandOption: true,
                })
                .option("segment", {
                  type: "string",
                  demandOption: true,
                }),
            async (argv) => {
              const cfg = loadHiveclawConfig();
              requireRegistry(cfg);
              requireSigner(cfg);
              const hiveId = BigInt(String(argv.hiveId));
              const pk = requireSigner(cfg);
              const agent = addressFromPrivateKey(pk);
              const hiveKey = resolveHiveKeyHex(hiveId, cfg);
              if (!hiveKey) throw new Error("Set hive key env for this hive id");
              const r = await getHiveMemory({
                cfg,
                hiveId,
                hiveKeyHex: hiveKey,
                segment: String(argv.segment),
                scope: argv.scope as "shared" | "private",
                agentAddress: agent,
              });
              console.log(r.plaintext);
            },
          )
          .command(
            "history <hiveId>",
            "List on-chain commits for a logical key (metadata)",
            (y2) =>
              y2.option("key", {
                type: "string",
                demandOption: true,
                describe: "Full logical path e.g. shared/foo or private/0x…/bar",
              }),
            async (argv) => {
              const cfg = loadHiveclawConfig();
              const reg = requireRegistry(cfg);
              const mk = memoryKeyFromString(String(argv.key));
              const hist = await fetchMemoryHistory(cfg.rpcUrl, reg, BigInt(String(argv.hiveId)), mk);
              console.log(JSON.stringify(hist, null, 2));
            },
          )
          .demandCommand(1, "Specify memory subcommand (commit | latest | put | get | history)"),
      () => {},
    )
    .command(
      "summarize <hiveId>",
      "Recall segments + Private Computer summarization (needs PC URL + API key env)",
      (y) =>
        y
          .option("shared", {
            type: "array",
            default: [],
            describe: "Repeatable segment paths under shared/",
          })
          .option("private", {
            type: "array",
            default: [],
            describe: "Repeatable segment paths under private/<you>/",
          })
          .option("commit", {
            type: "boolean",
            default: false,
            describe: "After summarize, remember_shared to shared/<summary-segment>",
          })
          .option("summary-segment", {
            type: "string",
            default: "summary/rolling",
            describe: "When --commit: path under shared/",
          })
          .option("attestation-metadata", {
            type: "boolean",
            default: false,
            describe: "When --commit: store compact PC attestation JSON in metadataURI",
          })
          .option("json", {
            type: "boolean",
            default: false,
            describe: "Print JSON (summary, attestation, optional commit) instead of summary text only",
          }),
      async (argv) => {
        const cfg = loadHiveclawConfig();
        requireRegistry(cfg);
        requireSigner(cfg);
        const hiveId = BigInt(String(argv.hiveId));
        const pk = requireSigner(cfg);
        const agent = addressFromPrivateKey(pk);
        const hiveKey = resolveHiveKeyHex(hiveId, cfg);
        if (!hiveKey) throw new Error("Set hive key env for this hive id");
        const base = cfg.privateComputerBaseUrl;
        if (!base) throw new Error("Set HIVECLAW_PRIVATE_COMPUTER_URL");
        const blocks: { label: string; text: string }[] = [];
        const shared = argv.shared as string[];
        const priv = argv.private as string[];
        for (const seg of shared) {
          const r = await getHiveMemory({
            cfg,
            hiveId,
            hiveKeyHex: hiveKey,
            segment: seg,
            scope: "shared",
            agentAddress: agent,
          });
          blocks.push({ label: `shared:${r.logicalPath}`, text: r.plaintext });
        }
        for (const seg of priv) {
          const r = await getHiveMemory({
            cfg,
            hiveId,
            hiveKeyHex: hiveKey,
            segment: seg,
            scope: "private",
            agentAddress: agent,
          });
          blocks.push({ label: `private:${r.logicalPath}`, text: r.plaintext });
        }
        if (blocks.length === 0) {
          throw new Error("Pass --shared segment and/or --private segment (repeatable)");
        }
        const result = await summarizeMemories({
          baseUrl: base,
          apiKey: cfg.privateComputerApiKey,
          blocks,
        });

        let commitOut: Awaited<ReturnType<typeof putHiveMemory>> | undefined;
        if (argv.commit) {
          let metadataURI = "";
          if (argv["attestation-metadata"] && result.attestation) {
            const compact = JSON.stringify({ v: 1, pc: result.attestation });
            metadataURI = compact.length > 1900 ? `${compact.slice(0, 1897)}...` : compact;
          }
          commitOut = await putHiveMemory({
            cfg,
            hiveId,
            plaintext: result.summary,
            hiveKeyHex: hiveKey,
            segment: String(argv["summary-segment"]),
            scope: "shared",
            agentAddress: agent,
            metadataURI,
          });
        }

        if (argv.json) {
          console.log(
            JSON.stringify(
              {
                summary: result.summary,
                attestation: result.attestation,
                commit: commitOut,
              },
              null,
              2,
            ),
          );
        } else {
          console.log(result.summary);
          if (commitOut) {
            console.error(`committed shared/${String(argv["summary-segment"])} tx ${commitOut.txHash}`);
          }
          if (result.attestation && process.env.HIVECLAW_VERBOSE) {
            console.error("attestation:", JSON.stringify(result.attestation));
          }
        }
      },
    )
    .command(
      "reflect <hiveId>",
      "Reflection loop: summarize segments → commit summary to shared/<segment>",
      (y) =>
        y
          .option("shared", {
            type: "array",
            default: [],
            describe: "Repeatable segment paths under shared/",
          })
          .option("private", {
            type: "array",
            default: [],
            describe: "Repeatable segment paths under private/<you>/",
          })
          .option("summary-segment", {
            type: "string",
            default: "summary/rolling",
            describe: "Where to store the rolling summary under shared/",
          })
          .option("attestation-metadata", {
            type: "boolean",
            default: false,
            describe: "Store compact PC attestation JSON in on-chain metadataURI",
          })
          .option("json", {
            type: "boolean",
            default: false,
            describe: "Print full JSON result",
          }),
      async (argv) => {
        const cfg = loadHiveclawConfig();
        requireRegistry(cfg);
        requireSigner(cfg);
        const hiveId = BigInt(String(argv.hiveId));
        const pk = requireSigner(cfg);
        const agent = addressFromPrivateKey(pk);
        const hiveKey = resolveHiveKeyHex(hiveId, cfg);
        if (!hiveKey) throw new Error("Set hive key env for this hive id");
        const base = cfg.privateComputerBaseUrl;
        if (!base) throw new Error("Set HIVECLAW_PRIVATE_COMPUTER_URL");
        const shared = argv.shared as string[];
        const priv = argv.private as string[];
        if (shared.length === 0 && priv.length === 0) {
          throw new Error("Pass --shared and/or --private segment(s)");
        }
        const out = await reflectAndCommitShared({
          cfg,
          hiveId,
          agentAddress: agent,
          hiveKeyHex: hiveKey,
          sharedSegments: shared,
          privateSegments: priv,
          summarySegment: String(argv["summary-segment"]),
          privateComputerBaseUrl: base,
          privateComputerApiKey: cfg.privateComputerApiKey,
          attachAttestationToMetadataUri: Boolean(argv["attestation-metadata"]),
        });
        if (argv.json) {
          console.log(JSON.stringify(out, null, 2));
        } else {
          console.log(out.summarize.summary);
          console.error(`committed tx ${out.commit.txHash} → ${out.commit.logicalPath}`);
        }
      },
    )
    .demandCommand(1, "Specify a command")
    .strict()
    .help()
    .alias("h", "help")
    .parseAsync();
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
}
