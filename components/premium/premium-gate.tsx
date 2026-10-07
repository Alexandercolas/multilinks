"use client";
import Link from 'next/link';
import { LockKeyhole } from 'lucide-react';
import { canUseFeature,premiumCta,premiumPrice,type PremiumFeature,type AccountAccess } from '@/lib/premium-access';
import type { ReactNode } from 'react';
export function PremiumGate({feature,title,description,access,children}: {feature:PremiumFeature;title:string;description:string;access:AccountAccess|null;children?:ReactNode}) {
  if(canUseFeature(access,feature)) return children??null;
  return <section className="rounded-2xl border border-white/15 bg-card p-5"><h3 className="flex items-center gap-2 font-bold"><LockKeyhole size={17} className="text-lime"/>{title}<span className="text-xs text-lime">Premium</span></h3><p className="mt-3 text-sm text-white/50">{description}</p><Link href="/planes" className="mt-4 inline-block rounded-xl bg-lime px-4 py-2.5 text-sm font-black text-ink">{premiumCta(access)} · {premiumPrice(access?.price_monthly)}</Link></section>;
}
