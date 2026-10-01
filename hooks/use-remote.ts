'use client';
import { useEffect, useState } from 'react';
import { ApiError, getSessionVersion } from '@/lib/api';

export type Remote<T> = {status: 'loading' | 'ready' | 'error'; data?: T; error?: Error};
export function useRemote<T>(load: () => Promise<T>, enabled = true, revision = 0) {
 const [attempt, setAttempt] = useState(0);
 const [result, setResult] = useState<Remote<T>>({status:'loading'});
 useEffect(() => {
  if (!enabled) return;
  let active = true;
  const session = getSessionVersion();
  setResult({status:'loading'});
  load().then(data => {
   if (active && session === getSessionVersion()) setResult({status:'ready',data});
  }).catch(error => {
   if (active && session === getSessionVersion()) setResult({status:'error',error:error instanceof Error ? error : new ApiError(0,'No se pudo conectar con el servidor.')});
  });
  return () => { active = false; };
 }, [load, enabled, attempt, revision]);
 return {...result, retry: () => setAttempt(n => n + 1)};
}
