import { useState, useEffect, useRef, useCallback } from 'react';
import { syncEnabled } from '../lib/supabase.js';
import { getOrCreateCode, setCode, clearCode, pushSync, pullSync, subscribeSync } from '../lib/syncService.js';

const DEBOUNCE_MS = 1500;

export function useSync({ entries, categories, onRemoteUpdate }) {
  const [code, setCodeState]     = useState(() => syncEnabled ? getOrCreateCode() : null);
  const [status, setStatus]      = useState(syncEnabled ? 'idle' : 'disabled');
  const debounceRef              = useRef(null);
  const isLocalChange            = useRef(false);
  const mounted                  = useRef(true);

  // Initial pull on mount
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
      isLocalChange.current = false;
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

  const switchCode = useCallback(async (newCode) => {
    setCode(newCode);
    setCodeState(newCode);
    setStatus('syncing');
    const data = await pullSync(newCode);
    if (data) {
      onRemoteUpdate(data.entries, data.categories);
      setStatus('synced');
    } else {
      // New code — push current data to claim it
      await pushSync(newCode, entries, categories);
      setStatus('synced');
    }
  }, [entries, categories, onRemoteUpdate]);

  const regenerateCode = useCallback(async () => {
    clearCode();
    const newCode = getOrCreateCode();
    setCodeState(newCode);
    setStatus('syncing');
    await pushSync(newCode, entries, categories);
    setStatus('synced');
  }, [entries, categories]);

  return {
    code,
    status,
    switchCode,
    regenerateCode,
    syncEnabled,
  };
}
