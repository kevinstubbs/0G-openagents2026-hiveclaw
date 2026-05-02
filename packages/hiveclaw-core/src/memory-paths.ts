/** Normalize checksummed or raw address for stable path segments (lowercase hex). */
export function normalizeAgentAddress(address: string): string {
  const a = address.trim().toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(a)) {
    throw new Error(`invalid agent address for memory path: ${address}`);
  }
  return a;
}

/** Logical path under shared namespace, e.g. `findings/foo`. */
export function sharedLogicalPath(segment: string): string {
  const s = segment.replace(/^\/+/, "").trim();
  return `shared/${s}`;
}

/** Logical path for agent-private lane: `private/0xabc.../notes`. */
export function privateLogicalPath(agentAddress: string, segment: string): string {
  const addr = normalizeAgentAddress(agentAddress);
  const s = segment.replace(/^\/+/, "").trim();
  return `private/${addr}/${s}`;
}
