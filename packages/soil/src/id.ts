const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";
const ID_LENGTH = 4;

export function generateTaskId(prefix: string): string {
  let result = "";
  for (let i = 0; i < ID_LENGTH; i++) {
    result += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `${prefix}${result}`;
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}
