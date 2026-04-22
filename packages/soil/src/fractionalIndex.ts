const BASE = 64;
const CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";

function charToVal(c: string): number {
  const i = CHARS.indexOf(c);
  if (i === -1) throw new Error(`Invalid fractional index character: ${c}`);
  return i;
}

function valToChar(v: number): string {
  if (v < 0 || v >= BASE) throw new Error(`Invalid fractional index value: ${v}`);
  return CHARS[v]!;
}

function _incrementKey(key: string): string {
  const last = key[key.length - 1];
  if (!last) throw new Error("Cannot increment empty key");
  const val = charToVal(last);
  if (val < BASE - 1) {
    return key.slice(0, -1) + valToChar(val + 1);
  }
  return _incrementKey(key.slice(0, -1)) + valToChar(Math.floor(BASE / 2));
}

function _decrementKey(key: string): string {
  const last = key[key.length - 1];
  if (!last) throw new Error("Cannot decrement empty key");
  const val = charToVal(last);
  if (val > 0) {
    return key.slice(0, -1) + valToChar(val - 1);
  }
  if (key.length <= 1) {
    throw new Error("Cannot decrement minimum fractional index");
  }
  return _decrementKey(key.slice(0, -1)) + valToChar(Math.floor(BASE / 2));
}

function midKey(a: string, b: string): string {
  let result = "";
  let i = 0;
  while (true) {
    const av = i < a.length ? charToVal(a[i]!) : 0;
    const bv = i < b.length ? charToVal(b[i]!) : BASE;
    if (av === bv) {
      result += valToChar(av);
      i++;
      continue;
    }
    const diff = bv - av;
    if (diff === 1) {
      result += valToChar(av);
      const nextAv = i + 1 < a.length ? charToVal(a[i + 1]!) : 0;
      if (nextAv === 0) {
        return result + valToChar(Math.floor(BASE / 2));
      }
      return result + midKey(a.slice(i + 1), "");
    }
    const mid = av + Math.floor(diff / 2);
    return result + valToChar(mid);
  }
}

export function keyBetween(a: string | null, b: string | null): string {
  if (a === null && b === null) return valToChar(Math.floor(BASE / 2));
  if (a === null) {
    const first = b![0];
    if (!first) return valToChar(Math.floor(BASE / 2));
    const val = charToVal(first);
    if (val > 1) return valToChar(Math.floor(val / 2));
    return valToChar(0) + keyBetween(null, b!.slice(1));
  }
  if (b === null) {
    const last = a[a.length - 1];
    if (!last) return valToChar(Math.floor(BASE / 2));
    const val = charToVal(last);
    if (val < BASE - 1) return a.slice(0, -1) + valToChar(val + 1);
    return a + valToChar(Math.floor(BASE / 2));
  }
  const commonLen = Math.min(a.length, b.length);
  for (let i = 0; i < commonLen; i++) {
    const av = charToVal(a[i]!);
    const bv = charToVal(b[i]!);
    if (av !== bv) {
      const diff = bv - av;
      if (diff > 1) {
        return a.slice(0, i) + valToChar(av + Math.floor(diff / 2));
      }
      return a.slice(0, i) + midKey(a.slice(i), b.slice(i));
    }
  }
  if (a.length < b.length) {
    const bv = charToVal(b[a.length]!);
    if (bv > 1) return a + valToChar(Math.floor(bv / 2));
    return a + valToChar(0) + keyBetween(null, b.slice(a.length + 1));
  }
  return a + valToChar(Math.floor(BASE / 2));
}
