# Turning on the enquiry form

The form on every sales page posts to `/api/enquiry` (functions/api/enquiry.js).
Until the settings below are added it cannot store or send anything, so visitors are
offered a ready written email to hello@beyondesk.co.uk instead. Nothing is lost, but
nothing is recorded either.

## 1. Email alerts (Resend)

1. Create a Resend account and verify the sending domain (beyondesk.co.uk).
2. Create an API key.
3. In Cloudflare: Pages > staffora-site > Settings > Variables and secrets, add:
   - `RESEND_API_KEY` (secret)
   - `ENQUIRY_TO` the inbox that should receive enquiries (several allowed, comma separated)
   - `ENQUIRY_FROM` optional, for example `Beyondesk <enquiries@beyondesk.co.uk>`
4. Redeploy (any push, or Retry deployment in Cloudflare).

## 2. Lead database (Supabase)

Run this in the Supabase SQL editor:

```sql
create table if not exists public.enquiries (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  trade text, role text, start text, systems text, notes text,
  name text, company text, email text, phone text,
  page text, user_agent text, country text,
  status text not null default 'new'
);
alter table public.enquiries enable row level security;
-- No public policies: only the service key used by the Cloudflare function can write or read.
```

Then add to Cloudflare:

- `SUPABASE_URL` for example `https://xxxx.supabase.co`
- `SUPABASE_SERVICE_KEY` (secret) the service role key

## 3. Test

Submit the form on a phone and on a desktop. Check that the row appears in Supabase
and the alert email arrives within a minute. Then delete the test rows.

## Analytics events already sent

The form pushes these events to `window.dataLayer`, ready for whichever analytics tool is added:
`enquiry_start`, `enquiry_step`, `enquiry_submit`, `enquiry_fallback`, `sticky_cta_click`.
