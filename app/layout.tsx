import type { Metadata } from "next";
import { Geist, Geist_Mono, Figtree, Lora } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import ErrorBoundary from "./Components/ErrorBoundary";
import AuthHeader from "./Components/AuthHeader";
import "./globals.css";
import { cn } from "../lib/utils";


import { Toaster } from "@/components/ui/sonner";

const figtree = Figtree({subsets:['latin'],variable:'--font-sans'});
const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  weight: ["400", "500", "600", "700"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LogMyClass",
  description: "Smart QR Attendance",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", figtree.variable, lora.variable)}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkProvider
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          signInFallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/dashboard"
        >
          <ErrorBoundary>
            <AuthHeader />
            {children}
            <Toaster />
          </ErrorBoundary>
        </ClerkProvider>
      </body>
    </html>
  );
}
