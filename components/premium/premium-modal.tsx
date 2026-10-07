"use client";
import { useEffect,useRef } from 'react';
import Link from 'next/link';
import { Crown,X } from 'lucide-react';
import { premiumCta,premiumPrice,type AccountAccess } from '@/lib/premium-access';
export function PremiumModal({open,onClose,title,description,access}: {open:boolean;onClose:()=>void;title:string;description:string;access:AccountAccess|null}) {
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const el=dialog.current;if(open&&!el?.open)el?.showModal();if(!open&&el?.open)el.close();return()=>{if(el?.open)el.close();};},[open]);
  return <dialog ref={dialog} onCancel={onClose} onClose={onClose} aria-labelledby="premium-modal-title" className="w-[calc(100%_-_2rem)] max-w-md rounded-3xl border border-white/15 bg-card p-6 text-white backdrop:bg-black/70">
    <button aria-label="Cerrar" onClick={onClose} className="float-right rounded-lg p-2"><X size={20}/></button><Crown className="text-lime" size={28}/><h2 id="premium-modal-title" className="mt-5 text-2xl font-black">{title}</h2><p className="mt-3 text-sm leading-6 text-white/60">{description}</p><p className="mt-5 text-2xl font-black text-lime">{premiumPrice(access?.price_monthly)}</p><Link href="/planes" className="mt-5 inline-block rounded-xl bg-lime px-5 py-3 font-black text-ink">{premiumCta(access)}</Link><p className="mt-4 text-xs text-white/45">Tu contenido guardado se conserva y se desbloquea al reactivar Premium.</p>
  </dialog>;
}
