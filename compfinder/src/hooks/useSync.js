import { useState, useEffect, useRef, useCallback } from 'react';
import { syncEnabled } from '../lib/supabase.js';
import { getCode, setCode, clearCode, pushSync, pullSync, subscribeSync } from '../lib/syncService.js';

const DEBOUNCE_MS = 1500;
// Grace period after a push to suppress the realtime echo from our own write
const ECHO_SUPPRESS_MS = 500;

export function useSync({ entries, categories, onRemoteUpdate }) {
  const [code, setCodeState] = useState(() => syncEnabled ? getCode() : null);
  const [status, setStatus]  = useState(() => {
    if (!syncEnabled) return 'disabled';
    return getCode() ? 'idle' : 'inactive';
  });

  const debounceRef  = useRef(null);
  const mounted      = useRef(true);
  const isPushing    = useRef(false);   // suppress realtime echo from our own push
  const onUpdateRef  = useRef(onRemoteUpdate);

  // Keep onUpdateRef current so subscription callback is never stale
  useEffect(() => { onUpdateRef.current = onRemoteUpdate; }, [onRemoteUpdate]);

  // Mark unmounted — separate from any effect cleanup so code changes don't flip it
  useEffect(() => {
    return () => { mounted.current = false; };
  }, []);

  // Pull on mount (or when code changes)
  useEffect(() => {
    if (!syncEnabled || !code) return;
    let cancelled = false;
    setStatus('syncing');
    pullSync(code).then(data => {
      if (cancelled || !mounted.current) return;
      if (data) {
        onUpdateRef.current(data.entries, data.categories);
        setStatus('synced');
      } else {
        setStatus('idle');
      }
    });
    return () => { cancelled = true; };
  }, [code]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!syncEnabled || !code) return;
    const unsub = subscribeSync(code, () => {
      // Ignore the echo from our own push
      if (!mounted.current || isPushing.current) return;
      // Don't trust payload — do a fresh pull (REPLICA IDENTITY may not be set)
      pullSync(code).then(data => {
        if (!mounted.current || !data) return;
        onUpdateRef.current(data.entries, data.categories);
        setStatus('synced');
      });
    });
    return unsub;
  }, [code]);

  // Debounced push on local changes
  useEffect(() => {
    if (!syncEnabled || !code) return;
    clearTimeout(debounceRef.current);
    setStatus('syncing');
    debounceRef.current = setTimeout(() => {
      isPushing.current = true;
      pushSync(code, entries, categories)
        .then(ok => {
          if (mounted.current) setStatus(ok ? 'synced' : 'error');
        })
        .catch(() => {
          if (mounted.current) setStatus('error');
        })
        .finally(() => {
          // Clear after grace period so subscription ignores the resulting realtime event
          setTimeout(() => { isPushing.current = false; }, ECHO_SUPPRESS_MS);
        });
    }, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [entries, categories, code]);

  // Set passphrase — just update the code; effects above handle pull + push automatically
  const setPassphrase = useCallback((phrase) => {
    const key = phrase.toLowerCase().trim();
    setCode(key);
    setCodeState(key);
  }, []);

  const disconnect = useCallback(() => {
    clearCode();
    setCodeState(null);
    setStatus('inactive');
  }, []);

  return {
    code,
    status,
    setPassphrase,
    disconnect,
    syncEnabled,
  };
}
