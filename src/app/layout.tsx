import type { Metadata } from "next";
import { Bebas_Neue, Manrope } from "next/font/google";
import Script from "next/script";
import { Providers } from "@/components/providers";
import "./globals.css";

const headingFont = Bebas_Neue({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: "400"
});

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "Xfitness Club",
  description: "A cinematic gym webapp with Supabase-ready member profiles, session booking, dashboards, and Flutterwave payments."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${headingFont.variable} ${bodyFont.variable}`}>
        <Script src="https://checkout.flutterwave.com/v3.js" strategy="afterInteractive" />
        {process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID ? (
          <Script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" strategy="afterInteractive" />
        ) : null}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
