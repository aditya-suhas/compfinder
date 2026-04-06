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
 */

import { supabase, syncEnabled } from './supabase.js';

const CODE_KEY = 'compfinder_sync_code';

/** Generate a random 8-char uppercase alphanumeric code */
function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/** Load or create a sync code */
export function getOrCreateCode() {
  let code = localStorage.getItem(CODE_KEY);
  if (!code) {
    code = genCode();
    localStorage.setItem(CODE_KEY, code);
  }
  return code;
}

/** Persist a different sync code (switching devices) */
export function setCode(code) {
  localStorage.setItem(CODE_KEY, code.toUpperCase().trim());
}

export function clearCode() {
  localStorage.removeItem(CODE_KEY);
}

/** Push current state to Supabase */
export async function pushSync(code, entries, categories) {
  if (!syncEnabled || !supabase) return;
  try {
    await supabase.from('sync_data').upsert({
      code,
      entries,
      categories,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'code' });
  } catch {}
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
 * Returns an unsubscribe function.
 */
export function subscribeSync(code, onUpdate) {
  if (!syncEnabled || !supabase) return () => {};

  const channel = supabase
    .channel(`sync_${code}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'sync_data', filter: `code=eq.${code}` },
      (payload) => {
        if (payload.new) onUpdate(payload.new);
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}
