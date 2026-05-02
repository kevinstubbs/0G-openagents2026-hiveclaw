"use client";

import {
  getHiveRegistryDetail,
  getLatestMemory,
  getMemberHives,
  HIVE_REGISTRY_ABI,
  memoryKeyFromString,
  type HiveRegistryDetail,
} from "hiveclaw-core/hive-registry";
import { BrowserProvider, Contract, JsonRpcProvider } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";

/** 0G Galileo testnet — https://docs.0g.ai/developer-hub/testnet/testnet-overview */
const ZERO_G_TESTNET_CHAIN_ID = BigInt(16602);
const ZERO_G_TESTNET_CHAIN_HEX = "0x40da";

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
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<bigint | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  /** Selected hive for reads/writes (string for inputs) */
  const [selectedHiveId, setSelectedHiveId] = useState("1");
  const [myHiveIds, setMyHiveIds] = useState<bigint[]>([]);
  const [detail, setDetail] = useState<HiveRegistryDetail | null>(null);
  const [checkHive, setCheckHive] = useState("1");
  const [checkAddr, setCheckAddr] = useState("");
  const [checkResult, setCheckResult] = useState<string | null>(null);
  const [createName, setCreateName] = useState("my-hive");
  const [mHive, setMHive] = useState("1");
  const [mAddr, setMAddr] = useState("");
  const [memKey, setMemKey] = useState("shared/smoke");
  const [latestPreview, setLatestPreview] = useState<string | null>(null);
  /** Avoid SSR/client mismatch: server has no `window.ethereum`; wait until mount to read it for UI. */
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chainOk = chainId !== null && chainId === ZERO_G_TESTNET_CHAIN_ID;
  const eth = mounted ? window.ethereum : undefined;

  const refreshMyHives = useCallback(async () => {
    if (!registry || !account) {
      setMyHiveIds([]);
      return;
    }
    try {
      const ids = await getMemberHives(rpcUrl, registry, account);
      setMyHiveIds(ids);
    } catch {
      setMyHiveIds([]);
    }
  }, [account, registry, rpcUrl]);

  useEffect(() => {
    void refreshMyHives();
  }, [refreshMyHives]);

  useEffect(() => {
    if (myHiveIds.length === 0) return;
    const ids = myHiveIds.map(String);
    if (!ids.includes(selectedHiveId)) {
      const first = ids[0];
      setSelectedHiveId(first);
      setMHive(first);
      setCheckHive(first);
    }
  }, [myHiveIds, selectedHiveId]);

  const connect = useCallback(async () => {
    setMessage(null);
    if (!eth) {
      setMessage("No injected wallet (install MetaMask or another EIP-1193 provider).");
      return;
    }
    try {
      setBusy(true);
      const provider = new BrowserProvider(eth);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      const net = await provider.getNetwork();
      setAccount(addr);
      setChainId(net.chainId);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [eth]);

  const refreshChain = useCallback(async () => {
    if (!eth) return;
    const provider = new BrowserProvider(eth);
    const net = await provider.getNetwork();
    setChainId(net.chainId);
  }, [eth]);

  const switchNetwork = useCallback(async () => {
    setMessage(null);
    if (!eth) return;
    try {
      setBusy(true);
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ZERO_G_TESTNET_CHAIN_HEX }],
      });
      await refreshChain();
    } catch (e: unknown) {
      const err = e as { code?: number };
      if (err?.code === 4902) {
        try {
          await eth.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: ZERO_G_TESTNET_CHAIN_HEX,
                chainName: "0G Galileo Testnet",
                nativeCurrency: { name: "OG", symbol: "OG", decimals: 18 },
                rpcUrls: [rpcUrl],
                blockExplorerUrls: ["https://chainscan-galileo.0g.ai"],
              },
            ],
          });
          await refreshChain();
        } catch (e2) {
          setMessage(e2 instanceof Error ? e2.message : String(e2));
        }
      } else {
        setMessage(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setBusy(false);
    }
  }, [eth, refreshChain, rpcUrl]);

  const loadHive = useCallback(async () => {
    setMessage(null);
    if (!registry) {
      setMessage("Set NEXT_PUBLIC_HIVECLAW_HIVE_REGISTRY_CONTRACT.");
      return;
    }
    try {
      setBusy(true);
      const id = BigInt(selectedHiveId);
      const d = await getHiveRegistryDetail(rpcUrl, registry, id);
      setDetail(d);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
      setDetail(null);
    } finally {
      setBusy(false);
    }
  }, [registry, rpcUrl, selectedHiveId]);

  const runMemberCheck = useCallback(async () => {
    setMessage(null);
    if (!registry) {
      setMessage("Set NEXT_PUBLIC_HIVECLAW_HIVE_REGISTRY_CONTRACT.");
      return;
    }
    if (!checkAddr.startsWith("0x")) {
      setMessage("Enter a full 0x address for member check.");
      return;
    }
    try {
      setBusy(true);
      const c = new Contract(registry, HIVE_REGISTRY_ABI, new JsonRpcProvider(rpcUrl));
      const ok: boolean = await c.members(BigInt(checkHive), checkAddr);
      setCheckResult(`member: ${ok}`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
      setCheckResult(null);
    } finally {
      setBusy(false);
    }
  }, [checkAddr, checkHive, registry, rpcUrl]);

  const withSigner = useCallback(async () => {
    if (!eth) throw new Error("Connect a wallet first.");
    if (!registry) throw new Error("Missing NEXT_PUBLIC_HIVECLAW_HIVE_REGISTRY_CONTRACT.");
    const provider = new BrowserProvider(eth);
    const signer = await provider.getSigner();
    return new Contract(registry, HIVE_REGISTRY_ABI, signer);
  }, [eth, registry]);

  const doCreateHive = useCallback(async () => {
    setMessage(null);
    if (!chainOk) {
      setMessage("Switch to 0G Galileo testnet first.");
      return;
    }
    try {
      setBusy(true);
      const c = await withSigner();
      const tx = (await c.createHive(createName)) as { wait: () => Promise<unknown> };
      await tx.wait();
      const ro = new Contract(registry, HIVE_REGISTRY_ABI, new JsonRpcProvider(rpcUrl));
      const nextId = await ro.nextHiveId();
      setMessage(`Hive created. nextHiveId (latest id) = ${nextId}`);
      await refreshMyHives();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [chainOk, createName, refreshMyHives, registry, rpcUrl, withSigner]);

  const doAddMember = useCallback(async () => {
    setMessage(null);
    if (!chainOk) {
      setMessage("Switch to 0G Galileo testnet first.");
      return;
    }
    try {
      setBusy(true);
      const c = await withSigner();
      const tx = (await c.addMember(BigInt(mHive), mAddr)) as { wait: () => Promise<unknown> };
      await tx.wait();
      setMessage(`addMember tx mined for ${shortAddr(mAddr)}`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [chainOk, mAddr, mHive, withSigner]);

  const doRemoveMember = useCallback(async () => {
    setMessage(null);
    if (!chainOk) {
      setMessage("Switch to 0G Galileo testnet first.");
      return;
    }
    try {
      setBusy(true);
      const c = await withSigner();
      const tx = (await c.removeMember(BigInt(mHive), mAddr)) as { wait: () => Promise<unknown> };
      await tx.wait();
      setMessage(`removeMember tx mined for ${shortAddr(mAddr)}`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [chainOk, mAddr, mHive, withSigner]);

  const doCommitSmoke = useCallback(async () => {
    setMessage(null);
    if (!chainOk) {
      setMessage("Switch to 0G Galileo testnet first.");
      return;
    }
    try {
      setBusy(true);
      const c = await withSigner();
      const mk = memoryKeyFromString(memKey);
      const tx = (await c.commitMemory(
        BigInt(selectedHiveId),
        mk,
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        0,
        "",
      )) as { wait: () => Promise<unknown> };
      await tx.wait();
      setMessage(`commitMemory mined for hive ${selectedHiveId}, key "${memKey}"`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [chainOk, memKey, selectedHiveId, withSigner]);

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

  return (
    <div style={{ display: "grid", gap: "1.5rem", maxWidth: 720 }}>
      {!registry ? (
        <p role="alert">
          Deploy HiveRegistry and set <code>NEXT_PUBLIC_HIVECLAW_HIVE_REGISTRY_CONTRACT</code> to use this page.
        </p>
      ) : null}

      <section>
        <h2>Wallet</h2>
        <p>
          <button type="button" disabled={busy || !eth} onClick={() => void connect()}>
            Connect
          </button>{" "}
          <button type="button" disabled={busy || !eth} onClick={() => void refreshChain()}>
            Refresh chain
          </button>{" "}
          <button type="button" disabled={busy || !eth} onClick={() => void switchNetwork()}>
            Switch to 0G testnet
          </button>
        </p>
        <p>
          account: {account ?? "—"} · chainId: {chainId !== null ? chainId.toString() : "—"}{" "}
          {chainId !== null && !chainOk ? "(need 16602)" : null}
        </p>
        {account && myHiveIds.length > 0 ? (
          <p>
            <label>
              Your hives (memberHives) — selected id:{" "}
              <select
                value={selectedHiveId}
                onChange={(e) => {
                  const v = e.target.value;
                  setSelectedHiveId(v);
                  setMHive(v);
                  setCheckHive(v);
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
        ) : account ? (
          <p style={{ fontSize: "0.9rem", opacity: 0.85 }}>No hives for this wallet yet, or still loading.</p>
        ) : null}
      </section>

      <section>
        <h2>Read: hive</h2>
        <p>
          <label>
            Hive id{" "}
            <input
              value={selectedHiveId}
              onChange={(e) => setSelectedHiveId(e.target.value)}
              style={{ width: 120 }}
            />
          </label>{" "}
          <button type="button" disabled={busy || !registry} onClick={() => void loadHive()}>
            Load
          </button>
        </p>
        {detail ? (
          <div>
            <p>
              <strong>{detail.name}</strong> — creator {detail.creator} — members: {detail.memberCount}
            </p>
            <ul>
              {detail.members.map((m) => (
                <li key={m.address}>{m.address}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section>
        <h2>Read: member check</h2>
        <p>
          <label>
            Hive id{" "}
            <input value={checkHive} onChange={(e) => setCheckHive(e.target.value)} style={{ width: 120 }} />
          </label>{" "}
          <label>
            Address{" "}
            <input
              value={checkAddr}
              onChange={(e) => setCheckAddr(e.target.value)}
              placeholder="0x…"
              style={{ width: 360 }}
            />
          </label>{" "}
          <button type="button" disabled={busy || !registry} onClick={() => void runMemberCheck()}>
            Check
          </button>
        </p>
        {checkResult ? <pre>{checkResult}</pre> : null}
      </section>

      <section>
        <h2>Write: create hive</h2>
        <p>
          <label>
            Name{" "}
            <input value={createName} onChange={(e) => setCreateName(e.target.value)} style={{ width: 240 }} />
          </label>{" "}
          <button type="button" disabled={busy || !registry} onClick={() => void doCreateHive()}>
            Create (sign)
          </button>
        </p>
      </section>

      <section>
        <h2>Write: members (creator only)</h2>
        <p>
          <label>
            Hive id{" "}
            <input value={mHive} onChange={(e) => setMHive(e.target.value)} style={{ width: 120 }} />
          </label>{" "}
          <label>
            Member{" "}
            <input
              value={mAddr}
              onChange={(e) => setMAddr(e.target.value)}
              placeholder="0x…"
              style={{ width: 360 }}
            />
          </label>
        </p>
        <p>
          <button type="button" disabled={busy || !registry} onClick={() => void doAddMember()}>
            addMember
          </button>{" "}
          <button type="button" disabled={busy || !registry} onClick={() => void doRemoveMember()}>
            removeMember
          </button>
        </p>
      </section>

      <section>
        <h2>Memory: commit + latest (smoke)</h2>
        <p>Uses the selected hive id above. You must be a member to commit.</p>
        <p>
          <label>
            Logical key{" "}
            <input value={memKey} onChange={(e) => setMemKey(e.target.value)} style={{ width: 280 }} />
          </label>
        </p>
        <p>
          <button type="button" disabled={busy || !registry} onClick={() => void doCommitSmoke()}>
            commitMemory (zeros)
          </button>{" "}
          <button type="button" disabled={busy || !registry} onClick={() => void doLatest()}>
            latestMemory
          </button>
        </p>
        {latestPreview ? <pre style={{ fontSize: 12, overflow: "auto" }}>{latestPreview}</pre> : null}
      </section>

      {message ? (
        <p role="status" style={{ whiteSpace: "pre-wrap" }}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
