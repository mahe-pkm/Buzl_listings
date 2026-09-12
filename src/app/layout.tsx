import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { isStagingEnvironment, getAppBaseUrl } from "@/lib/staging";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const isStaging = isStagingEnvironment();

export const metadata: Metadata = {
  title: {
    default: "Buzl Directory — Verified Local Businesses & Services",
    template: "%s | Buzl Directory",
  },
  description:
    "Discover verified local businesses, specialized service providers, and accurate operating hours across India.",
  metadataBase: new URL(getAppBaseUrl()),
  icons: {
    icon: "/favicon.ico",
  },
  ...(isStaging
    ? {
        robots: {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
          },
        },
      }
    : {}),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FAFAFA] text-[#1F242E]">{children}</body>
    </html>
  );
}
