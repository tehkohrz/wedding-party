import type { Metadata, Viewport } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import "./globals.css";
import { WizardShell } from "@/components/WizardShell";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";

// Display font — wedding/botanical character, used for headings.
// `variable` name must match the value referenced in app/globals.css's @theme block.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

// Body font — clean, neutral, lets the display font + colors carry personality.
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SitWhereAh",
  description: "Wedding seating & attendance",
  // Links the web app manifest (name, icons, standalone display).
  manifest: "/manifest.webmanifest",
  // iOS-specific: enables fullscreen "Add to Home Screen" behavior + names it.
  appleWebApp: {
    capable: true,
    title: "SitWhereAh",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  // theme_color equivalent — tints the iOS status bar / task switcher.
  themeColor: "#1FA6EB",
  // Kiosk-style: fill the screen edge-to-edge and stop guests accidentally
  // pinch-zooming the whole page (the map has its own zoom when enabled).
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${dmSans.variable} h-full antialiased`}
    >
      {/* overflow-x-hidden: clips the horizontal slide-in animation so it
          doesn't briefly create a horizontal scrollbar. Vertical scrolling
          (e.g. on /sandbox) is unaffected. */}
      <body className="min-h-full flex flex-col overflow-x-hidden bg-background text-foreground font-sans">
        <ServiceWorkerRegistrar />
        <WizardShell>{children}</WizardShell>
      </body>
    </html>
  );
}
