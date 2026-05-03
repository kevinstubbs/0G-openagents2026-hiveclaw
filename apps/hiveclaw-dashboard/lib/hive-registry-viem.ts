import { parseAbi } from "viem";

/**
 * Minimal HiveRegistry ABI for this dashboard (viem `parseAbi` does not accept every
 * ethers human-readable fragment — e.g. named tuple returns — so we omit unused views).
 */
export const hiveRegistryAbi = parseAbi([
  "function nextHiveId() view returns (uint256)",
  "function createHive(string name) returns (uint256)",
  "function members(uint256 hiveId, address account) view returns (bool)",
  "function addMember(uint256 hiveId, address member)",
  "function removeMember(uint256 hiveId, address member)",
  "function commitMemory(uint256 hiveId, bytes32 memoryKey, bytes32 storagePointer, bytes32 contentHash, uint256 keyVersion, string metadataURI)",
]);
