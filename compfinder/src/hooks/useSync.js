import { useState, useEffect, useRef, useCallback } from 'react';
import { syncEnabled } from '../lib/supabase.js';
import { getCode, setCode, clearCode, pushSync, pullSync, subscribeSync } from '../lib/syncService.js';

const DEBOUNCE_MS = 1500;

export function useSync({ entries, categories, onRemoteUpdate }) {
  const [code, setCodeState]  = useState(() => syncEnabled ? getCode() : null);
  const [status, setStatus]   = useState(() => {
    if (!syncEnabled) return 'disabled';
    return getCode() ? 'idle' : 'inactive';
  });
  const debounceRef           = useRef(null);
  const mounted               = useRef(true);

  // Initial pull on mount (only if a passphrase is already saved)
  useEffect(() => {
    if (!syncEnabled || !code) return;
    pullSync(code).then(data => {
      if (!mounted.current || !data) return;
      onRemoteUpdate(data.entries, data.categories);
      setStatus('synced');
    });
    return () => { mounted.current = false; };
  }, [code]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!syncEnabled || !code) return;
    const unsub = subscribeSync(code, (data) => {
      if (!mounted.current) return;
      onRemoteUpdate(data.entries, data.categories);
      setStatus('synced');
    });
    return unsub;
  }, [code]);

  // Debounced push on local changes
  useEffect(() => {
    if (!syncEnabled || !code || !entries.length) return;
    clearTimeout(debounceRef.current);
    setStatus('syncing');
    debounceRef.current = setTimeout(() => {
      pushSync(code, entries, categories)
        .then(() => { if (mounted.current) setStatus('synced'); })
        .catch(() => { if (mounted.current) setStatus('error'); });
    }, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [entries, categories, code]);

  /** Set a user-chosen passphrase and start syncing */
  const setPassphrase = useCallback(async (phrase) => {
    const key = phrase.toLowerCase().trim();
    setCode(key);
    setCodeState(key);
    setStatus('syncing');
    const data = await pullSync(key);
    if (data) {
      onRemoteUpdate(data.entries, data.categories);
    } else {
      await pushSync(key, entries, categories);
    }
    if (mounted.current) setStatus('synced');
  }, [entries, categories, onRemoteUpdate]);

  /** Stop syncing and clear the saved passphrase */
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
