'use client';

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./Providers";
import { Toaster } from "sonner";
import Navbar from "@/components/Navbar";
import { usePathname } from "next/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Interview Prep",
  description: "Prepare for interviews and get hired",
};

const pathname = usePathname();
const hideNavbar = pathname.startsWith("/call/");

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <Providers>
          <Toaster richColors />
          {!hideNavbar && <Navbar />}
          {children}
        </Providers>
      </body>
    </html>
  );
}
