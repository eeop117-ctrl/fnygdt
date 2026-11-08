# DEMUSICAL — Complete Cloudflare + Supabase build

## Included
- Discord-only authentication gate
- Feed without the broken `tracks -> profiles` PostgREST relationship
- Audio player
- Search
- My Wave
- Saved tracks
- Track publishing
- Public audio/covers Storage
- Profile avatar/banner/name
- Responsive futuristic UI
- SQL schema + RLS
- Cloudflare-ready static files

## 1. Supabase
Open SQL Editor and run `schema.sql` completely.

Required Storage buckets:
- `audio`
- `covers`

The SQL creates them as public and installs the required policies.

## 2. Discord
In Discord Developer Portal add this OAuth redirect URL:

https://aoncvlrojdhzjcjfyufs.supabase.co/auth/v1/callback

In Supabase Authentication -> Providers -> Discord enable Discord and enter the Discord Client ID/Secret.

In Supabase Authentication -> URL Configuration:
- Site URL = your Cloudflare Pages URL
- Redirect URLs = your Cloudflare Pages URL plus `/**`

## 3. Cloudflare
Upload these files as a static Pages project:
- index.html
- styles.css
- app.js
- _headers

No Node, npm or build step is required.

## 4. Important
The frontend uses only the Supabase publishable key. Do NOT put a Supabase service_role key into `app.js`.

## 5. If feed fails
The new app does NOT request `profiles(...)` inside the tracks query. It requests `tracks` directly, so no `tracks -> profiles` relationship is required. The UI also prints the actual Supabase error code/message instead of hiding it behind a generic message.
