"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AccountAccess } from '@/lib/premium-access';
type AccessContext = { access: AccountAccess | null; loading: boolean; error: boolean; refresh: () => Promise<void> };
const Context = createContext<AccessContext>({ access: null, loading: true, error: false, refresh: async () => {} });
export function AccountAccessProvider({ initialAccess, children }: { initialAccess: AccountAccess | null; children: ReactNode }) {
  const [access,setAccess]=useState(initialAccess);const [loading,setLoading]=useState(!initialAccess);const [error,setError]=useState(false);
  const refresh=useCallback(async()=>{
    try { const response=await fetch('/api/billing/access', { cache:'no-store' });if(!response.ok) throw new Error();setAccess(await response.json());setError(false); }
    catch { setError(true); setAccess(null); } finally {setLoading(false);}
  },[]);
  useEffect(()=>{ if(!initialAccess) void refresh();const update=()=>{if(document.visibilityState==='visible') void refresh();};
    const timer=setInterval(update,60000);document.addEventListener('visibilitychange',update);
    return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',update);};
  },[initialAccess,refresh]);
  return <Context.Provider value={{access,loading,error,refresh}}>{children}</Context.Provider>;
}
export function useAccountAccess(){return useContext(Context);}
