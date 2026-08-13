-- Defense in depth for sensitive billing and audit tables.
-- RLS already blocks these operations; these revokes also remove the
-- underlying table privileges from browser-facing roles.

revoke insert, update, delete
on table public.subscriptions
from anon, authenticated;

revoke insert, update, delete
on table public.admin_action_logs
from anon, authenticated;

-- PostgreSQL functions grant EXECUTE to PUBLIC by default unless explicitly
-- revoked. Removing anon alone would not be sufficient while PUBLIC retains it.
revoke execute
on function public.admin_user_overview()
from public, anon;
