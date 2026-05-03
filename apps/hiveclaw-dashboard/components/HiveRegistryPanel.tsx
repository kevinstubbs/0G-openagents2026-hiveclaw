"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  getHiveRegistryDetail,
  getLatestMemory,
  getMemberHives,
  memoryKeyFromString,
  type HiveRegistryDetail,
} from "hiveclaw-core/hive-registry";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { zeroHash } from "viem";
import {
  useAccount,
  useChainId,
  useConfig,
  usePublicClient,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { hiveRegistryAbi } from "@/lib/hive-registry-viem";
import { zeroGGalileo } from "@/lib/zero-g-chain";
import { C } from "@/components/landing/colors";
import { Card } from "@/components/landing/primitives";

const TARGET_CHAIN_ID = zeroGGalileo.id;

function PanelSection({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: ReactNode;
}) {
  return (
    <Card accent={accent}>
      <h2
        style={{
          fontFamily: "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif",
          fontWeight: 700,
          fontSize: 18,
          color: C.text,
          margin: "0 0 16px",
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </h2>
      <div style={{ display: "grid", gap: "1rem" }}>{children}</div>
    </Card>
  );
}

function getEnv() {
  const rpcUrl =
    process.env.NEXT_PUBLIC_HIVECLAW_RPC_URL ?? "https://evmrpc-testnet.0g.ai";
  const registry = process.env.NEXT_PUBLIC_HIVECLAW_HIVE_REGISTRY_CONTRACT ?? "";
  return { rpcUrl, registry };
}

function shortAddr(a: string) {
  if (a.length < 10) return a;
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function HiveRegistryPanel() {
  const { rpcUrl, registry } = useMemo(() => getEnv(), []);
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const config = useConfig();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending: txPending } = useWriteContract();

  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedHiveId, setSelectedHiveId] = useState("1");
  /** `null` = load in progress or not applicable; `[]` = loaded, wallet has no hives */
  const [myHiveIds, setMyHiveIds] = useState<bigint[] | null>(null);
  const [memberHivesError, setMemberHivesError] = useState<string | null>(null);
  const [detail, setDetail] = useState<HiveRegistryDetail | null>(null);
  const [checkHive, setCheckHive] = useState("1");
  const [checkAddr, setCheckAddr] = useState("");
  const [checkResult, setCheckResult] = useState<string | null>(null);
  const [createName, setCreateName] = useState("my-hive");
  const [mHive, setMHive] = useState("1");
  const [mAddr, setMAddr] = useState("");
  const [memKey, setMemKey] = useState("shared/smoke");
  const [latestPreview, setLatestPreview] = useState<string | null>(null);

  const chainOk = chainId === TARGET_CHAIN_ID;
  const contractAddress = (registry || undefined) as `0x${string}` | undefined;

  /** Keeps latest hive id for effects without re-running when the Read:hive input changes every keystroke */
  const selectedHiveIdRef = useRef(selectedHiveId);
  selectedHiveIdRef.current = selectedHiveId;

  const refreshMyHives = useCallback(async () => {
    if (!registry || !address) {
      setMyHiveIds(null);
      setMemberHivesError(null);
      return;
    }
    setMemberHivesError(null);
    setMyHiveIds(null);
    try {
      const ids = await getMemberHives(rpcUrl, registry, address);
      setMyHiveIds(ids);
    } catch (e) {
      setMyHiveIds([]);
      setMemberHivesError(e instanceof Error ? e.message : String(e));
    }
  }, [address, registry, rpcUrl]);

  useEffect(() => {
    void refreshMyHives();
  }, [refreshMyHives]);

  const loadHive = useCallback(async (hiveIdStr?: string) => {
    setMessage(null);
    if (!registry) {
      setMessage("Set NEXT_PUBLIC_HIVECLAW_HIVE_REGISTRY_CONTRACT.");
      return;
    }
    const idStr = hiveIdStr ?? selectedHiveIdRef.current;
    try {
      setBusy(true);
      const id = BigInt(idStr);
      const d = await getHiveRegistryDetail(rpcUrl, registry, id);
      setDetail(d);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
      setDetail(null);
    } finally {
      setBusy(false);
    }
  }, [registry, rpcUrl]);

  /** After wallet / member list updates: sync picker + load hive detail (no dep on selectedHiveId — avoids input keystroke spam). */
  useEffect(() => {
    if (!registry || !address) return;
    if (myHiveIds === null) return;
    if (myHiveIds.length === 0) {
      setDetail(null);
      return;
    }
    const idsStr = myHiveIds.map(String);
    const cur = selectedHiveIdRef.current;
    const pick = idsStr.includes(cur) ? cur : idsStr[0];
    if (!idsStr.includes(cur)) {
      setSelectedHiveId(pick);
      setMHive(pick);
      setCheckHive(pick);
    }
    void loadHive(pick);
  }, [registry, address, myHiveIds, loadHive]);

  const runMemberCheck = useCallback(async () => {
    setMessage(null);
    if (!registry || !contractAddress || !publicClient) {
      setMessage("Set NEXT_PUBLIC_HIVECLAW_HIVE_REGISTRY_CONTRACT.");
      return;
    }
    if (!checkAddr.startsWith("0x")) {
      setMessage("Enter a full 0x address for member check.");
      return;
    }
    try {
      setBusy(true);
      const ok = await publicClient.readContract({
        address: contractAddress,
        abi: hiveRegistryAbi,
        functionName: "members",
        args: [BigInt(checkHive), checkAddr as `0x${string}`],
      });
      setCheckResult(`member: ${ok}`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
      setCheckResult(null);
    } finally {
      setBusy(false);
    }
  }, [checkAddr, checkHive, contractAddress, publicClient, registry]);

  const doCreateHive = useCallback(async () => {
    setMessage(null);
    if (!registry || !contractAddress) {
      setMessage("Set NEXT_PUBLIC_HIVECLAW_HIVE_REGISTRY_CONTRACT.");
      return;
    }
    if (!chainOk) {
      setMessage("Switch to 0G Galileo testnet first.");
      return;
    }
    if (!publicClient) {
      setMessage("RPC client not ready; refresh the page.");
      return;
    }
    try {
      setBusy(true);
      const hash = await writeContractAsync({
        address: contractAddress,
        abi: hiveRegistryAbi,
        functionName: "createHive",
        args: [createName],
        chainId: TARGET_CHAIN_ID,
      });
      await waitForTransactionReceipt(config, { hash });
      const nextId = await publicClient.readContract({
        address: contractAddress,
        abi: hiveRegistryAbi,
        functionName: "nextHiveId",
      });
      setMessage(`Hive created. nextHiveId (latest id) = ${nextId}`);
      await refreshMyHives();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [chainOk, contractAddress, createName, publicClient, refreshMyHives, registry, writeContractAsync]);

  const doAddMember = useCallback(async () => {
    setMessage(null);
    if (!registry || !contractAddress) {
      setMessage("Set NEXT_PUBLIC_HIVECLAW_HIVE_REGISTRY_CONTRACT.");
      return;
    }
    if (!chainOk) {
      setMessage("Switch to 0G Galileo testnet first.");
      return;
    }
    if (!mAddr.startsWith("0x")) {
      setMessage("Enter a full 0x address for the member.");
      return;
    }
    try {
      setBusy(true);
      const hash = await writeContractAsync({
        address: contractAddress,
        abi: hiveRegistryAbi,
        functionName: "addMember",
        args: [BigInt(mHive), mAddr as `0x${string}`],
        chainId: TARGET_CHAIN_ID,
      });
      await waitForTransactionReceipt(config, { hash });
      setMessage(`addMember tx mined for ${shortAddr(mAddr)}`);
      await refreshMyHives();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [chainOk, contractAddress, mAddr, mHive, refreshMyHives, registry, writeContractAsync]);

  const doRemoveMember = useCallback(async () => {
    setMessage(null);
    if (!registry || !contractAddress) {
      setMessage("Set NEXT_PUBLIC_HIVECLAW_HIVE_REGISTRY_CONTRACT.");
      return;
    }
    if (!chainOk) {
      setMessage("Switch to 0G Galileo testnet first.");
      return;
    }
    if (!mAddr.startsWith("0x")) {
      setMessage("Enter a full 0x address for the member.");
      return;
    }
    try {
      setBusy(true);
      const hash = await writeContractAsync({
        address: contractAddress,
        abi: hiveRegistryAbi,
        functionName: "removeMember",
        args: [BigInt(mHive), mAddr as `0x${string}`],
        chainId: TARGET_CHAIN_ID,
      });
      await waitForTransactionReceipt(config, { hash });
      setMessage(`removeMember tx mined for ${shortAddr(mAddr)}`);
      await refreshMyHives();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [chainOk, contractAddress, mAddr, mHive, refreshMyHives, registry, writeContractAsync]);

  const doCommitSmoke = useCallback(async () => {
    setMessage(null);
    if (!registry || !contractAddress) {
      setMessage("Set NEXT_PUBLIC_HIVECLAW_HIVE_REGISTRY_CONTRACT.");
      return;
    }
    if (!chainOk) {
      setMessage("Switch to 0G Galileo testnet first.");
      return;
    }
    try {
      setBusy(true);
      const mk = memoryKeyFromString(memKey) as `0x${string}`;
      const hash = await writeContractAsync({
        address: contractAddress,
        abi: hiveRegistryAbi,
        functionName: "commitMemory",
        args: [
          BigInt(selectedHiveId),
          mk,
          zeroHash,
          zeroHash,
          BigInt(0),
          "",
        ],
        chainId: TARGET_CHAIN_ID,
      });
      await waitForTransactionReceipt(config, { hash });
      setMessage(`commitMemory mined for hive ${selectedHiveId}, key "${memKey}"`);
      await refreshMyHives();
      try {
        const mk = memoryKeyFromString(memKey);
        const m = await getLatestMemory(rpcUrl, registry, BigInt(selectedHiveId), mk);
        setLatestPreview(JSON.stringify(m, null, 2));
      } catch {
        /* optional preview refresh */
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [chainOk, contractAddress, memKey, refreshMyHives, registry, rpcUrl, selectedHiveId, writeContractAsync]);

  const doLatest = useCallback(async () => {
    setMessage(null);
    if (!registry) return;
    try {
      setBusy(true);
      const mk = memoryKeyFromString(memKey);
      const m = await getLatestMemory(rpcUrl, registry, BigInt(selectedHiveId), mk);
      setLatestPreview(JSON.stringify(m, null, 2));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
      setLatestPreview(null);
    } finally {
      setBusy(false);
    }
  }, [memKey, registry, rpcUrl, selectedHiveId]);

  const uiBusy = busy || txPending;

  const subtle = { fontFamily: "var(--font-inter), Inter, sans-serif", fontSize: 14, color: C.muted, margin: 0 };
  const labelRow = { display: "flex", flexWrap: "wrap" as const, gap: "0.65rem", alignItems: "center" };

  return (
    <div className="hc-dashboard-tools" style={{ display: "grid", gap: "1.25rem" }}>
      {!registry ? (
        <Card accent={C.orange}>
          <p role="alert" style={{ ...subtle, color: C.text, margin: 0 }}>
            Deploy HiveRegistry and set{" "}
            <code className="hc-dashboard-code">NEXT_PUBLIC_HIVECLAW_HIVE_REGISTRY_CONTRACT</code> to use this dashboard.
          </p>
        </Card>
      ) : null}

      <PanelSection title="Wallet" accent={C.blue}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
          <ConnectButton />
          {isConnected && !chainOk ? (
            <button
              type="button"
              disabled={!switchChain}
              onClick={() => switchChain?.({ chainId: TARGET_CHAIN_ID })}
            >
              Switch to 0G testnet
            </button>
          ) : null}
        </div>
        <p style={subtle}>
          Account {address ?? "—"} · chain {chainId}
          {!chainOk ? <span style={{ color: C.orange }}> · need chain 16602</span> : null}
        </p>
        {registry && address && myHiveIds === null ? <p style={subtle}>Loading your hives…</p> : null}
        {registry && address && memberHivesError ? (
          <p role="alert" style={{ ...subtle, color: C.red, whiteSpace: "pre-wrap" }}>
            Could not load your hives: {memberHivesError}
          </p>
        ) : null}
        {registry && address && myHiveIds !== null && myHiveIds.length > 0 ? (
          <p style={labelRow}>
            <span style={{ fontWeight: 600, color: C.text }}>Your hives</span>
            <label style={{ ...labelRow, gap: 8 }}>
              <span style={subtle}>Selected id</span>
              <select
                value={selectedHiveId}
                onChange={(e) => {
                  const v = e.target.value;
                  setSelectedHiveId(v);
                  setMHive(v);
                  setCheckHive(v);
                  void loadHive(v);
                }}
              >
                {myHiveIds.map((id) => (
                  <option key={String(id)} value={String(id)}>
                    {String(id)}
                  </option>
                ))}
              </select>
            </label>
          </p>
        ) : null}
        {registry && address && myHiveIds !== null && myHiveIds.length === 0 && !memberHivesError ? (
          <p style={subtle}>No hives for this wallet yet.</p>
        ) : null}
      </PanelSection>

      <PanelSection title="Read: hive" accent={C.purple}>
        <p style={labelRow}>
          <label style={{ ...labelRow, gap: 8 }}>
            <span style={{ fontWeight: 600, color: C.text }}>Hive id</span>
            <input
              value={selectedHiveId}
              onChange={(e) => setSelectedHiveId(e.target.value)}
              style={{ width: 120 }}
            />
          </label>
          <button type="button" disabled={uiBusy || !registry} onClick={() => void loadHive()}>
            Load
          </button>
        </p>
        {detail ? (
          <div
            style={{
              padding: "14px 16px",
              borderRadius: 12,
              background: C.bgAlt,
              border: `1px solid ${C.border}`,
            }}
          >
            <p style={{ fontFamily: "var(--font-inter), Inter, sans-serif", fontSize: 14, color: C.text, margin: "0 0 10px" }}>
              <strong>{detail.name}</strong>
              <span style={{ color: C.muted }}> · creator </span>
              <code className="hc-dashboard-code" style={{ fontSize: 12 }}>
                {detail.creator}
              </code>
              <span style={{ color: C.muted }}> · members {detail.memberCount}</span>
            </p>
            <ul
              style={{
                margin: 0,
                paddingLeft: 20,
                fontFamily: "var(--font-jetbrains), 'JetBrains Mono', monospace",
                fontSize: 12,
                color: C.muted,
                lineHeight: 1.6,
              }}
            >
              {detail.members.map((m) => (
                <li key={m.address}>{m.address}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </PanelSection>

      <PanelSection title="Read: member check" accent={C.green}>
        <p style={{ ...labelRow, alignItems: "flex-end" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontWeight: 600, fontSize: 13, color: C.text }}>Hive id</span>
            <input value={checkHive} onChange={(e) => setCheckHive(e.target.value)} style={{ width: 120 }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 200 }}>
            <span style={{ fontWeight: 600, fontSize: 13, color: C.text }}>Address</span>
            <input
              value={checkAddr}
              onChange={(e) => setCheckAddr(e.target.value)}
              placeholder="0x…"
              style={{ width: "100%", maxWidth: 420 }}
            />
          </label>
          <button type="button" disabled={uiBusy || !registry} onClick={() => void runMemberCheck()}>
            Check
          </button>
        </p>
        {checkResult ? <pre className="hc-dashboard-pre">{checkResult}</pre> : null}
      </PanelSection>

      <PanelSection title="Write: create hive" accent={C.orange}>
        <p style={labelRow}>
          <label style={{ ...labelRow, gap: 8 }}>
            <span style={{ fontWeight: 600, color: C.text }}>Name</span>
            <input value={createName} onChange={(e) => setCreateName(e.target.value)} style={{ width: 240 }} />
          </label>
          <button type="button" disabled={uiBusy || !registry} onClick={() => void doCreateHive()}>
            Create (sign)
          </button>
        </p>
      </PanelSection>

      <PanelSection title="Write: members (creator only)" accent={C.red}>
        <p style={{ ...labelRow, alignItems: "flex-end" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontWeight: 600, fontSize: 13, color: C.text }}>Hive id</span>
            <input value={mHive} onChange={(e) => setMHive(e.target.value)} style={{ width: 120 }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 200 }}>
            <span style={{ fontWeight: 600, fontSize: 13, color: C.text }}>Member</span>
            <input
              value={mAddr}
              onChange={(e) => setMAddr(e.target.value)}
              placeholder="0x…"
              style={{ width: "100%", maxWidth: 420 }}
            />
          </label>
        </p>
        <p style={labelRow}>
          <button type="button" disabled={uiBusy || !registry} onClick={() => void doAddMember()}>
            addMember
          </button>
          <button type="button" disabled={uiBusy || !registry} onClick={() => void doRemoveMember()}>
            removeMember
          </button>
        </p>
      </PanelSection>

      <PanelSection title="Memory: commit + latest (smoke)" accent={C.blue}>
        <p style={{ ...subtle, color: C.muted }}>
          Uses the selected hive id above. You must be a member to commit.
        </p>
        <p style={labelRow}>
          <label style={{ ...labelRow, gap: 8, flex: 1, minWidth: 200 }}>
            <span style={{ fontWeight: 600, color: C.text }}>Logical key</span>
            <input value={memKey} onChange={(e) => setMemKey(e.target.value)} style={{ flex: 1, minWidth: 180, maxWidth: 360 }} />
          </label>
        </p>
        <p style={labelRow}>
          <button type="button" disabled={uiBusy || !registry} onClick={() => void doCommitSmoke()}>
            commitMemory (zeros)
          </button>
          <button type="button" disabled={uiBusy || !registry} onClick={() => void doLatest()}>
            latestMemory
          </button>
        </p>
        {latestPreview ? <pre className="hc-dashboard-pre">{latestPreview}</pre> : null}
      </PanelSection>

      {message ? (
        <Card accent={C.purple}>
          <p role="status" style={{ fontFamily: "var(--font-inter), Inter, sans-serif", fontSize: 14, whiteSpace: "pre-wrap", margin: 0, color: C.text }}>
            {message}
          </p>
        </Card>
      ) : null}
    </div>
  );
}
