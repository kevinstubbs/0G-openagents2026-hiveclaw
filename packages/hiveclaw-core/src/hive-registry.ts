import {
  Contract,
  JsonRpcProvider,
  Wallet,
  ZeroHash,
  keccak256,
  toUtf8Bytes,
  type ContractTransactionResponse,
} from "ethers";

export { ZeroHash };

export function addressFromPrivateKey(privateKey: string): string {
  return new Wallet(privateKey).address;
}

export async function waitTxHash(tx: ContractTransactionResponse): Promise<string> {
  const receipt = await tx.wait();
  if (!receipt) throw new Error("Transaction was not mined");
  return receipt.hash;
}

/** @returns hex `0x` + 64 hex chars (bytes32) for `commitMemory` / lookups */
export function memoryKeyFromString(path: string): string {
  return keccak256(toUtf8Bytes(path));
}

export const HIVE_REGISTRY_ABI = [
  "function version() view returns (uint256)",
  "function nextHiveId() view returns (uint256)",
  "function createHive(string name) returns (uint256)",
  "function hives(uint256 hiveId) view returns (address creator, string name, uint256 createdAt, uint256 currentKeyVersion, bool exists)",
  "function members(uint256 hiveId, address account) view returns (bool)",
  "function addMember(uint256 hiveId, address member)",
  "function removeMember(uint256 hiveId, address member)",
  "function commitMemory(uint256 hiveId, bytes32 memoryKey, bytes32 storagePointer, bytes32 contentHash, uint256 keyVersion, string metadataURI)",
  "function latestMemory(uint256 hiveId, bytes32 memoryKey) view returns (tuple(uint256 hiveId, bytes32 memoryKey, bytes32 storagePointer, bytes32 contentHash, address writer, uint256 timestamp, uint256 keyVersion, string metadataURI) mem)",
  "function memoryHistoryLength(uint256 hiveId, bytes32 memoryKey) view returns (uint256)",
  "function memoryHistoryAt(uint256 hiveId, bytes32 memoryKey, uint256 index) view returns (tuple(uint256 hiveId, bytes32 memoryKey, bytes32 storagePointer, bytes32 contentHash, address writer, uint256 timestamp, uint256 keyVersion, string metadataURI))",
  "function memberHives(address who) view returns (uint256[])",
  "function hiveMemberCount(uint256 hiveId) view returns (uint256)",
  "function hiveMemberAt(uint256 hiveId, uint256 index) view returns (address)",
] as const;

export function getHiveRegistryReadonly(rpcUrl: string, contractAddress: string): Contract {
  const provider = new JsonRpcProvider(rpcUrl);
  return new Contract(contractAddress, HIVE_REGISTRY_ABI, provider);
}

export function getHiveRegistryWithSigner(
  rpcUrl: string,
  contractAddress: string,
  privateKey: string,
): { wallet: Wallet; contract: Contract } {
  const wallet = new Wallet(privateKey, new JsonRpcProvider(rpcUrl));
  const contract = new Contract(contractAddress, HIVE_REGISTRY_ABI, wallet);
  return { wallet, contract };
}

export type HiveRegistryReadSnapshot = {
  version: string;
  nextHiveId: string;
};

export async function readHiveRegistrySnapshot(
  rpcUrl: string,
  contractAddress: string,
): Promise<HiveRegistryReadSnapshot> {
  const c = getHiveRegistryReadonly(rpcUrl, contractAddress);
  const version = await c.version();
  const nextHiveId = await c.nextHiveId();
  return {
    version: String(version),
    nextHiveId: String(nextHiveId),
  };
}

export async function getMemberHives(
  rpcUrl: string,
  contractAddress: string,
  who: string,
): Promise<bigint[]> {
  const c = getHiveRegistryReadonly(rpcUrl, contractAddress);
  const raw: bigint[] = await c.memberHives(who);
  return raw.map((x) => BigInt(x));
}

export type HiveRegistryDetail = {
  hiveId: string;
  name: string;
  creator: string;
  memberCount: string;
  members: { address: string }[];
};

export async function getHiveRegistryDetail(
  rpcUrl: string,
  contractAddress: string,
  hiveId: bigint,
): Promise<HiveRegistryDetail> {
  const c = getHiveRegistryReadonly(rpcUrl, contractAddress);
  const h: { name: string; creator: string } = await c.hives(hiveId);
  const n = Number(await c.hiveMemberCount(hiveId));
  const members: { address: string }[] = [];
  for (let i = 0; i < n; i += 1) {
    const addr: string = await c.hiveMemberAt(hiveId, i);
    members.push({ address: addr });
  }
  return {
    hiveId: hiveId.toString(),
    name: h.name,
    creator: h.creator,
    memberCount: String(n),
    members,
  };
}

export async function isHiveMember(
  rpcUrl: string,
  contractAddress: string,
  hiveId: bigint,
  account: string,
): Promise<boolean> {
  const c = getHiveRegistryReadonly(rpcUrl, contractAddress);
  return c.members(hiveId, account) as Promise<boolean>;
}

export async function createHive(
  rpcUrl: string,
  contractAddress: string,
  privateKey: string,
  name: string,
): Promise<ContractTransactionResponse> {
  const { contract } = getHiveRegistryWithSigner(rpcUrl, contractAddress, privateKey);
  return contract.createHive(name) as Promise<ContractTransactionResponse>;
}

export async function createHiveAndWait(
  rpcUrl: string,
  contractAddress: string,
  privateKey: string,
  name: string,
): Promise<{ txHash: string; hiveId: string }> {
  const tx = await createHive(rpcUrl, contractAddress, privateKey, name);
  const receipt = await tx.wait();
  if (!receipt) throw new Error("Transaction was not mined");
  const c = getHiveRegistryReadonly(rpcUrl, contractAddress);
  const id = await c.nextHiveId();
  return { txHash: receipt.hash, hiveId: String(id) };
}

export async function addRegistryMember(
  rpcUrl: string,
  contractAddress: string,
  privateKey: string,
  hiveId: bigint,
  member: string,
): Promise<ContractTransactionResponse> {
  const { contract } = getHiveRegistryWithSigner(rpcUrl, contractAddress, privateKey);
  return contract.addMember(hiveId, member) as Promise<ContractTransactionResponse>;
}

export async function removeRegistryMember(
  rpcUrl: string,
  contractAddress: string,
  privateKey: string,
  hiveId: bigint,
  member: string,
): Promise<ContractTransactionResponse> {
  const { contract } = getHiveRegistryWithSigner(rpcUrl, contractAddress, privateKey);
  return contract.removeMember(hiveId, member) as Promise<ContractTransactionResponse>;
}

export type MemoryCommitView = {
  hiveId: string;
  memoryKey: string;
  storagePointer: string;
  contentHash: string;
  writer: string;
  timestamp: string;
  keyVersion: string;
  metadataURI: string;
};

function formatCommit(raw: Record<string, unknown>): MemoryCommitView {
  return {
    hiveId: String(raw.hiveId),
    memoryKey: String(raw.memoryKey),
    storagePointer: String(raw.storagePointer),
    contentHash: String(raw.contentHash),
    writer: String(raw.writer),
    timestamp: String(raw.timestamp),
    keyVersion: String(raw.keyVersion),
    metadataURI: String(raw.metadataURI ?? ""),
  };
}

export async function getLatestMemory(
  rpcUrl: string,
  contractAddress: string,
  hiveId: bigint,
  memoryKey: string,
): Promise<MemoryCommitView> {
  const c = getHiveRegistryReadonly(rpcUrl, contractAddress);
  const mem = await c.latestMemory(hiveId, memoryKey);
  return formatCommit(mem as Record<string, unknown>);
}

export async function commitMemory(
  rpcUrl: string,
  contractAddress: string,
  privateKey: string,
  hiveId: bigint,
  memoryKey: string,
  storagePointer: string,
  contentHash: string,
  keyVersion: bigint,
  metadataURI: string,
): Promise<ContractTransactionResponse> {
  const { contract } = getHiveRegistryWithSigner(rpcUrl, contractAddress, privateKey);
  return contract.commitMemory(
    hiveId,
    memoryKey,
    storagePointer,
    contentHash,
    keyVersion,
    metadataURI,
  ) as Promise<ContractTransactionResponse>;
}
