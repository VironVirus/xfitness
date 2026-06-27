# Xfitness Webapp

Modern Next.js gym webapp with:

- animated landing page and custom gym visuals
- Supabase-ready auth, profiles, dashboards, and bookings
- OneSignal-ready push notification settings and Edge Function reminders
- Flutterwave-ready checkout flow with demo fallback

## Local development

```bash
npm install
npm run dev
```

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

### Recommended Netlify setup

1. Import the repository into Netlify.
2. Leave the Next.js framework detection enabled.
3. Use `npm run build` as the build command.
4. Do not set a manual publish directory for Next.js.
5. Add the environment variables from `.env.example` in the Netlify dashboard.

## Supabase setup

1. Create a Supabase project.
2. Copy the project URL and anon key into a local `.env.local` file using `.env.example` as the template.
3. Open the SQL editor in Supabase and run the schema in `supabase/schema.sql`.
4. In Authentication, make sure `Email` sign-in is enabled.
5. If you want instant post-signup login, turn off email confirmation in your Supabase auth settings. If you keep email confirmation on, the app will prompt the member to confirm first.

```bash
npm run dev
```

The app stores:

- member profiles in the `profiles` table
- fitness quiz answers inside each member profile row
- booked sessions in the `bookings` table
- class schedules in the `class_schedules` table
- notification preferences in the `notification_preferences` profile field

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
