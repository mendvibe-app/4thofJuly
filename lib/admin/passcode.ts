/** Lightweight fingerprint so passcode rotation invalidates old sessions. */
export function fingerprintPasscode(passcode: string): string {
  const s = passcode.toLowerCase().trim()
  let hash = 2166136261
  for (let i = 0; i < s.length; i++) {
    hash ^= s.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return `v1:${hash >>> 0}`
}
