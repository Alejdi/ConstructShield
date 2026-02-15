import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegister } from "@/components/pwa/sw-register";
import { isRtl, type Locale } from "@/i18n/config";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1c1917",
};

export const metadata: Metadata = {
  title: "ConstructShield - Trusted Construction Marketplace",
  description:
    "A high-trust construction marketplace with video-verified milestone payments and escrow protection.",
  manifest: "/manifest.json",
  icons: {
    icon: "/images/logo.png",
    apple: "/images/logo.png",
  },
  appleWebApp: {
    capable: true,
    title: "ConstructShield",
    statusBarStyle: "black-translucent",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = (await getLocale()) as Locale;
  const messages = await getMessages();
  const dir = isRtl(locale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir}>
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          {children}
          <Toaster />
          <ServiceWorkerRegister />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
