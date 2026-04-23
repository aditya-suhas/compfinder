/**
 * Sync service — Supabase Realtime
 *
 * Table schema (run in Supabase SQL Editor):
 *
 *   create table if not exists sync_data (
 *     code         text        primary key,
 *     entries      jsonb       not null default '[]',
 *     categories   jsonb       not null default '[]',
 *     updated_at   timestamptz not null default now()
 *   );
 *
 *   alter table sync_data enable row level security;
 *
 *   create policy "open_access" on sync_data
 *     for all using (true) with check (true);
 *
 *   -- enable realtime
 *   alter publication supabase_realtime add table sync_data;
 *
 *   -- required: send full row on UPDATE events (not just the primary key)
 *   alter table sync_data replica identity full;
 */

import { supabase, syncEnabled } from './supabase.js';

const CODE_KEY = 'compfinder_sync_code';

/** Returns saved passphrase or null if sync is not set up */
export function getCode() {
  return localStorage.getItem(CODE_KEY) || null;
}

/** Save a passphrase (lowercased, trimmed) */
export function setCode(code) {
  localStorage.setItem(CODE_KEY, code.toLowerCase().trim());
}

export function clearCode() {
  localStorage.removeItem(CODE_KEY);
}

/** Push current state to Supabase. Returns true on success. */
export async function pushSync(code, entries, categories) {
  if (!syncEnabled || !supabase) return false;
  try {
    const { error } = await supabase.from('sync_data').upsert({
      code,
      entries,
      categories,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'code' });
    return !error;
  } catch { return false; }
}

/** Pull latest state from Supabase */
export async function pullSync(code) {
  if (!syncEnabled || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('sync_data')
      .select('entries, categories, updated_at')
      .eq('code', code)
      .single();
    if (error || !data) return null;
    return data;
  } catch { return null; }
}

/**
 * Subscribe to realtime changes on this code.
 * Calls onUpdate() with no arguments — caller should do a fresh pullSync.
 * Returns an unsubscribe function.
 */
export function subscribeSync(code, onUpdate) {
  if (!syncEnabled || !supabase) return () => {};

  const channel = supabase
    .channel(`sync_${code}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'sync_data', filter: `code=eq.${code}` },
      () => { onUpdate(); }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}
