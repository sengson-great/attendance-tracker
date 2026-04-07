import type { Metadata } from "next";
import { Geist, Geist_Mono, Kantumruy_Pro } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const kantumruyPro = Kantumruy_Pro({
  variable: "--font-kantumruy-pro",
  subsets: ["khmer", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ប្រព័ន្ធចុះវត្តមាន - Attendance Tracker",
  description: "ប្រព័ន្ធចុះវត្តមានបុគ្គលិកដោយប្រើ QR កូដ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="km">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${kantumruyPro.className} antialiased text-black`}
      >
        {children}
      </body>
    </html>
  );
}
