# Xfitness Webapp

Modern Next.js gym webapp with:

- animated landing page and custom gym visuals
- Supabase-ready auth, fitness quiz profiles, dashboards, and realtime class booking
- on-demand workout library, community challenges, and owner analytics
- OneSignal-ready push notification settings and Edge Function reminders
- Flutterwave-ready checkout flow with demo fallback

## Local development

```bash
npm install
npm run dev
```

### Local helper commands

If your machine does not already expose the right Node version on the default path, use the local wrapper commands in this repo:

```bash
npm run install:local
npm run dev:local
npm run build:local
npm run start:local
npm run netlify:check:local
```

These commands use the repo's local Node 20 runtime when it exists, keep npm cache files inside the project, and start dev mode with polling so file-watch limits do not spam `EMFILE` errors.

## Production build

```bash
npm run build
npm start
```

## Netlify deployment

This project is prepared for Netlify with:

- `netlify.toml`
- `.nvmrc`
- `package.json` Node engine pin
- `npm run netlify:check`

### Recommended Netlify setup

1. Import the repository into Netlify.
2. Leave the Next.js framework detection enabled.
3. Use `npm run build` as the build command.
4. Do not set a manual publish directory for Next.js.
5. Add the environment variables from `.env.example` in the Netlify dashboard.
6. Run `npm run netlify:check` locally if `npm` is on your default path, or `npm run netlify:check:local` if you want to use the repo's local Node wrapper.

### Netlify environment checklist

Required for live auth and database:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Optional but recommended for the full live experience:

- `NEXT_PUBLIC_ONESIGNAL_APP_ID`
- `NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY`
- `FLUTTERWAVE_SECRET_KEY`

### External service notes for Netlify

- If Supabase email confirmation is enabled, set your main Netlify production URL in Supabase Auth URL configuration.
- If you test auth flows on deploy previews, add the preview URL pattern you actually use in Supabase allowed redirect URLs.
- If you use OneSignal live, make sure your Netlify production domain is approved in the OneSignal web app setup.
- If you use Flutterwave live, make sure the Netlify production domain is allowed in your Flutterwave setup.

## Supabase setup

1. Create a Supabase project.
2. Copy the project URL and anon key into a local `.env.local` file using `.env.example` as the template.
3. Open the SQL editor in Supabase and run the schema in `supabase/schema.sql`.
4. In Authentication, make sure `Email` sign-in is enabled.
5. If you want instant post-signup login, turn off email confirmation in your Supabase auth settings. If you keep email confirmation on, the app will prompt the member to confirm first.
6. For gym owner accounts, add `user_role: "gym_owner"` to the user app metadata in Supabase Auth so `/admin` is unlocked.

```bash
npm run dev
```

The app stores:

- member profiles in the `profiles` table
- fitness quiz answers inside each member profile row
- booked sessions in the `bookings` table
- class schedules in the `class_schedules` table
- login activity in the `member_login_activity` table
- notification preferences in the `notification_preferences` profile field

Live class availability comes from `class_schedules.capacity` and `class_schedules.spots_taken`, which are kept in sync as bookings are created or cancelled.

### Required environment variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_ONESIGNAL_APP_ID=

NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=
FLUTTERWAVE_SECRET_KEY=
```

## Notifications setup

1. Create a OneSignal app for web push.
2. Add `NEXT_PUBLIC_ONESIGNAL_APP_ID` to `.env.local` and Netlify.
3. In Supabase Edge Function secrets, add:

```bash
ONESIGNAL_APP_ID=
ONESIGNAL_REST_API_KEY=
NOTIFICATION_CRON_SECRET=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

4. Deploy the Edge Function in `supabase/functions/dispatch-notifications`.
5. Schedule that function in Supabase so it runs on an interval, for example every 15 minutes.
6. Visit `/settings` in the app, opt into browser push, and save notification preferences.

The notification pipeline handles:

- upcoming class reminders
- goal nudges when weekly targets are close
- membership expiry alerts
- special event broadcasts

### Notes

- Without the required Supabase keys, the app uses demo fallback storage so you can preview flows.
- Without the OneSignal app ID, the notification settings page still saves preferences but browser push will stay inactive.
- Without Flutterwave keys, bookings still save in demo mode and the checkout button stays in setup mode.
- The Flutterwave logo URL uses the live site origin automatically, so Netlify deploy previews and production deploys work without a separate app URL variable.
- The payment verification request forwards the deployment ID header when Netlify provides it, which helps keep live sessions aligned during deploys.
