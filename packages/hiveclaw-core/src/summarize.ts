export type SummarizeInput = {
  baseUrl: string;
  apiKey: string | undefined;
  /** Plaintext context snippets from decrypted memories. */
  blocks: { label: string; text: string }[];
  instruction?: string;
};

/** Captured Private Computer / OpenAI-compatible provenance for demos (headers + response meta). */
export type PcAttestationMetadata = {
  /** Selected HTTP response headers (x-* , attestation, tee, etc.). */
  headers: Record<string, string>;
  /** Top-level JSON fields aside from full choices payload (usage, id, model, …). */
  responseMeta: Record<string, unknown>;
};

export type SummarizeResult = {
  summary: string;
  /** Present when the upstream returned capturable provenance signals; null if none. */
  attestation: PcAttestationMetadata | null;
};

function collectAttestationHeaders(res: Response): Record<string, string> {
  const out: Record<string, string> = {};
  res.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (
      lower.startsWith("x-") ||
      lower.includes("attestation") ||
      lower.includes("tee") ||
      lower.includes("verif") ||
      lower.includes("signature")
    ) {
      out[key] = value;
    }
  });
  return out;
}

function collectResponseMeta(json: unknown): Record<string, unknown> {
  if (!json || typeof json !== "object") return {};
  const obj = json as Record<string, unknown>;
  const meta: Record<string, unknown> = {};
  for (const field of [
    "id",
    "model",
    "created",
    "usage",
    "system_fingerprint",
    "service_tier",
    "object",
  ]) {
    if (field in obj) meta[field] = obj[field];
  }
  return meta;
}

function buildAttestation(res: Response, json: unknown): PcAttestationMetadata | null {
  const headers = collectAttestationHeaders(res);
  const responseMeta = collectResponseMeta(json);
  if (Object.keys(headers).length === 0 && Object.keys(responseMeta).length === 0) {
    return null;
  }
  return { headers, responseMeta };
}

/** OpenAI-compatible chat completions against Private Computer / any compatible endpoint. */
export async function summarizeMemories(input: SummarizeInput): Promise<SummarizeResult> {
  const url = `${input.baseUrl.replace(/\/$/, "")}/v1/chat/completions`;
  const body = {
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system" as const,
        content:
          input.instruction ??
          "Summarize the following hive memory blocks concisely for another agent. Preserve facts and citations.",
      },
      {
        role: "user" as const,
        content: input.blocks.map((b) => `## ${b.label}\n${b.text}`).join("\n\n"),
      },
    ],
    temperature: 0.3,
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (input.apiKey) headers.Authorization = `Bearer ${input.apiKey}`;

  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`summarize HTTP ${res.status}: ${t.slice(0, 500)}`);
  }
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = json.choices?.[0]?.message?.content;
  if (!text) throw new Error("summarize: empty response");
  const attestation = buildAttestation(res, json);
  return { summary: text, attestation };
}
