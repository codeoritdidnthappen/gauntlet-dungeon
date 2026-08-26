// Save storage — localStorage only, no backend, no accounts.
//
// Two separate mechanisms, per ARCHITECTURE.md §1b:
//   1. Obfuscation      — the payload is not human-readable at a glance.
//   2. Tamper detection — an HMAC-SHA256 checksum over the payload.
//
// This is NOT security. Anyone who reads the bundle can defeat it. The bar is
// "casual save-editing costs one extra step", and that is all it clears.

const SAVE_KEY = 'gauntlet.save.v1'
const SAVE_VERSION = 2

// Baked into the bundle on purpose — see the note above.
const SECRET = 'gauntlet-dungeon-9f3a71c4e28b'
const XOR_KEY = 'runthegauntlet'

const enc = new TextEncoder()
const dec = new TextDecoder()

/* ---------------------------------------------------------------- obfuscate */

function xorBytes(bytes) {
  const key = enc.encode(XOR_KEY)
  const out = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) out[i] = bytes[i] ^ key[i % key.length]
  return out
}

function bytesToBase64(bytes) {
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s)
}

function base64ToBytes(b64) {
  const s = atob(b64)
  const out = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i)
  return out
}

function obfuscate(text) {
  return bytesToBase64(xorBytes(enc.encode(text)))
}

function deobfuscate(payload) {
  return dec.decode(xorBytes(base64ToBytes(payload)))
}

/* ------------------------------------------------------------------- verify */

let keyPromise = null

function hmacKey() {
  if (!keyPromise) {
    keyPromise = crypto.subtle.importKey(
      'raw',
      enc.encode(SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
  }
  return keyPromise
}

async function checksumOf(payload) {
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(), enc.encode(payload))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Constant-time-ish compare. Not load-bearing, but free.
function sameChecksum(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/* --------------------------------------------------------------------- API */

/** True if anything is stored at all. Cheap, synchronous, does NOT validate. */
export function hasSaveRecord() {
  try {
    return localStorage.getItem(SAVE_KEY) !== null
  } catch {
    return false
  }
}

/**
 * Read and verify the save.
 * @returns {Promise<{status:'none'|'valid'|'invalid', data?:object, reason?:string}>}
 */
export async function loadSave() {
  let raw
  try {
    raw = localStorage.getItem(SAVE_KEY)
  } catch {
    return { status: 'invalid', reason: 'storage-unavailable' }
  }
  if (raw === null) return { status: 'none' }

  let record
  try {
    record = JSON.parse(raw)
  } catch {
    return { status: 'invalid', reason: 'unreadable' }
  }

  if (!record || typeof record.payload !== 'string' || typeof record.checksum !== 'string') {
    return { status: 'invalid', reason: 'malformed' }
  }
  if (record.v !== SAVE_VERSION) {
    return { status: 'invalid', reason: 'version-mismatch' }
  }

  let expected
  try {
    expected = await checksumOf(record.payload)
  } catch {
    return { status: 'invalid', reason: 'verify-failed' }
  }
  if (!sameChecksum(expected, record.checksum)) {
    return { status: 'invalid', reason: 'tampered' }
  }

  try {
    return { status: 'valid', data: JSON.parse(deobfuscate(record.payload)) }
  } catch {
    return { status: 'invalid', reason: 'corrupt' }
  }
}

/** Write a save. Resolves true on success. */
export async function writeSave(data) {
  try {
    const payload = obfuscate(JSON.stringify(data))
    const record = { v: SAVE_VERSION, payload, checksum: await checksumOf(payload) }
    localStorage.setItem(SAVE_KEY, JSON.stringify(record))
    return true
  } catch {
    return false
  }
}

/** Remove the save entirely. */
export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY)
    return true
  } catch {
    return false
  }
}
