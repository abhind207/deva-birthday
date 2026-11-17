# For Deva — birthday surprise & proposal website

React · TypeScript · Tailwind · Framer Motion · React Router · Supabase.
Routes: `/` · `/questions` · `/proposal` · `/letter` · `/reply` · `/admin` (private).

> **Status: written but not yet run.** The code was produced in an environment with no network access, so
> `npm install`, `npm run build` and every Supabase operation are untested. Work through the test list at the bottom
> before sending the link to anyone.

## 1. Supabase setup (about 10 minutes)

1. Create a project at supabase.com.
2. **SQL Editor → New query**, paste the whole of `supabase/schema.sql`, run it. This creates the six tables
   (`funny_questions`, `question_responses`, `proposal_responses`, `personal_replies`, `music_settings`,
   `website_analytics`), Row Level Security, the validated write functions and the private `music` storage bucket.
3. **Authentication → Users → Add user** — create your own email + password.
4. In the SQL editor make yourself an admin:
   ```sql
   insert into public.admin_users (user_id)
   select id from auth.users where email = 'you@example.com';
   ```
5. **Authentication → Sign In / Providers →** turn **off** “Allow new users to sign up”.
6. **Project Settings → API:** copy the Project URL and the **anon** key.

## 2. Run locally

```bash
cp .env.example .env      # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev               # opens on your LAN too, so you can test on a phone
```

Then open `/admin`, sign in, go to **Music**, upload an MP3 and make sure it is enabled.

## 3. Deploy

`npm run build` → deploy `dist/` to Netlify or Vercel. Refresh on any route works: `public/_redirects` (Netlify) and
`vercel.json` (Vercel) send every path to `index.html`. Add the two `VITE_` variables in the host's settings.

## How data is protected

- The browser only ever holds the public **anon** key. The service-role key is never used or needed.
- Visitors have **no direct table access**. They can only call five `SECURITY DEFINER` functions
  (`track_event`, `save_answer`, `proposal_no_attempt`, `proposal_yes`, `submit_reply`) that validate input
  (required fields, allowed values, length limits) and write exactly one kind of row.
- Reading answers, replies, analytics, or changing music settings requires a signed-in user listed in `admin_users`
  (checked inside Postgres via `is_admin()` in every policy, not just in the UI).
- Music files are playable by URL, but only admins can list, upload, replace or delete them.
- Text is stored exactly as typed and only ever rendered as plain text (never as HTML).
- Not included: rate limiting. For a personal surprise link this is fine; if it is shared widely, enable
  Supabase's rate limits / CAPTCHA or put the site behind Cloudflare.

## Behaviour notes

- **Photos:** `public/photos/deva-1.jpg` (welcome hero + letter) and `deva-3.jpg` (questions). `deva-3` had black bars
  from a screenshot; these were cropped off — the photo itself is unaltered. The third upload (dark, blurry, with a
  heart sticker) was deliberately not used.
- **NO button:** an “attempt” is a mouse pointer reaching it, a touch on it, or a keyboard press (debounced to 450 ms).
  Every attempt is saved with its timestamp. It moves anywhere on screen except over the question text or the YES button.
- **Music:** nothing plays until the visitor taps “Play some music?”. The `<audio>` element lives above the router, so
  it keeps playing across `/`, `/questions`, `/proposal`. Saying YES fades it out over the admin's fade duration and
  disables it for the rest of the visit (no music on `/letter` or `/reply`). *iPhone Safari ignores programmatic volume,
  so there the fade becomes a clean stop.*
- **Replies:** a reply is never queued silently — if it cannot be saved she sees an error and her text is kept.
  “Maybe Later” stores a `skipped` row with no text. Answers and analytics retry automatically if the network drops.
- **Refresh safe:** answers in progress survive a refresh (sessionStorage); her reply draft survives too.

## Test list before sharing

1. Visit every route directly and refresh on each.
2. Answer all three questions, go back and forward, check the rows in `/admin → Questions`.
3. On `/proposal`: chase NO on desktop and a phone, check the count and timestamps; press YES, check it lands in `/admin`.
4. Confirm the letter matches the original exactly.
5. Submit one reply, and separately press “Maybe Later”; check both statuses.
6. Upload an MP3, enable it, play it on `/`, confirm it continues to `/proposal` and fades after YES.
7. Try `/admin` signed out, and signed in with a non-admin account — neither should show data.
8. Open the browser console on every page and check for errors.
