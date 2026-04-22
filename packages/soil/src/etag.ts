const FNV1A_32_OFFSET = 0x811c9dc5;
const FNV1A_32_PRIME = 0x01000193;

function fnv1a32(data: Uint8Array): number {
  let hash = FNV1A_32_OFFSET;
  for (let i = 0; i < data.length; i++) {
    const byte = data[i]!;
    hash ^= byte;
    hash = Math.imul(hash, FNV1A_32_PRIME);
  }
  return hash >>> 0;
}

export function computeEtag(content: string): string {
  const normalized = content.replace(/\r\n/g, "\n");
  const encoder = new TextEncoder();
  const bytes = encoder.encode(normalized);
  const hash = fnv1a32(bytes);
  return hash.toString(16).padStart(8, "0");
}
