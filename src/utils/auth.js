// SHA-256 hash using Web Crypto API (built-in, no library needed)
export async function hashPassword(password) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}
