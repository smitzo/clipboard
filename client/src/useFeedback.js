import { useCallback, useEffect, useRef, useState } from 'react';
import { sharing } from './sharing';

export function useFeedback({ copy = sharing.copy } = {}) {
  const [status, updateStatus] = useState({ type: 'idle', message: '' });
  const [copied, setCopied] = useState('');
  const copyTimer = useRef(); const generation = useRef(0); const mounted = useRef(true);
  const setStatus = useCallback(value => { if (mounted.current) updateStatus(value); }, []);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; generation.current++; clearTimeout(copyTimer.current); };
  }, []);
  useEffect(() => {
    if (!status.message) return;
    const timer = setTimeout(() => updateStatus({ type: 'idle', message: '' }), 3200);
    return () => clearTimeout(timer);
  }, [status]);
  const copyValue = useCallback(async (value, label) => {
    if (!value) return;
    const current = ++generation.current;
    clearTimeout(copyTimer.current); setCopied('');
    try {
      await copy(value);
      if (!mounted.current || generation.current !== current) return;
      setCopied(label);
      copyTimer.current = setTimeout(() => setCopied(''), 1800);
    } catch {
      if (mounted.current && generation.current === current) setStatus({ type: 'error', message: 'Could not copy. Please select and copy the text manually.' });
    }
  }, [copy, setStatus]);
  return { status, setStatus, copied, copyValue };
}
