import type { Metadata } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import "./globals.css";
import { WizardShell } from "@/components/WizardShell";

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
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <WizardShell>{children}</WizardShell>
      </body>
    </html>
  );
}
