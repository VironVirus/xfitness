import type { Metadata } from "next";
import Script from "next/script";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Xfitness",
  description: "Simple fitness booking, workouts, and member progress."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script src="https://checkout.flutterwave.com/v3.js" strategy="afterInteractive" />
        {process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID ? (
          <Script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" strategy="afterInteractive" />
        ) : null}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
