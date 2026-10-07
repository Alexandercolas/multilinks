import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AccountAccessProvider } from '@/components/premium/access-provider';
export const metadata:Metadata={title:'Dashboard',robots:{index:false,follow:false}};
export default async function DashboardLayout({children}:{children:React.ReactNode}) {
  const client=await createClient();const {data:{user}}=await client.auth.getUser();if(!user)redirect('/sign-in?next=/dashboard');
  const {data}=await client.rpc('account_access');
  return <AccountAccessProvider initialAccess={data??null}>{children}</AccountAccessProvider>;
}
