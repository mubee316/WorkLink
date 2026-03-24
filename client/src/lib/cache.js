// Simple in-memory cache. Data persists for the lifetime of the browser session.
// Pages initialise from cache immediately (no skeleton on revisit), then
// revalidate in the background so data stays fresh.

const store = new Map();

export function getCache(key) {
  return store.get(key) ?? null;
}

export function setCache(key, value) {
  store.set(key, value);
}

export function invalidateCache(key) {
  store.delete(key);
}
