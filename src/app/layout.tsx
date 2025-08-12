import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SSS Wallet - Secure Shamir Secret Sharing",
  description: "Split your crypto private keys into multiple shares using Shamir's Secret Sharing. Local-only cryptography, no data ever leaves your device.",
  keywords: ["Shamir Secret Sharing", "Bitcoin", "BSV", "Crypto Backup", "Private Key Security"],
  authors: [{ name: "SSS Wallet" }],
  openGraph: {
    title: "SSS Wallet - Secure Crypto Key Backup",
    description: "Split your crypto private keys securely with Shamir's Secret Sharing",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
