// ─── Bolt Language — Runtime Helpers ───────────────────────────────────
// These functions are available to all Bolt programs at runtime.
// The generated JavaScript code calls these helpers directly.

// ── print ──────────────────────────────────────────────────────────
// Bolt's built-in print statement. Wraps console.log.
export function print(...args) {
  console.log(...args);
}

// ── Runtime error helper ────────────────────────────────────────────
export function boltPanic(message, line) {
  const err = new Error(`⚡ Bolt Runtime Error (line ${line}): ${message}`);
  err.boltLine = line;
  throw err;
}
