import type { Metadata } from "next";
import { Geist, Geist_Mono, Figtree } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import ErrorBoundary from "./Components/ErrorBoundary";
import "./globals.css";
import { cn } from "../lib/utils";
import { Show, UserButton, SignInButton, SignUpButton } from "@clerk/nextjs";
import { prisma } from "@/lib/prisma";


const figtree = Figtree({subsets:['latin'],variable:'--font-sans'});

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
  const adminExists = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true }
  })

  return (
    <html lang="en" className={cn("font-sans", figtree.variable)}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkProvider>
          <ErrorBoundary>
            <header>
              <Show when="signed-out">
                <SignInButton />
                {!adminExists && <SignUpButton />}
              </Show>
              <Show when="signed-in">
                <UserButton />
              </Show>
            </header>
            {children}
          </ErrorBoundary>
        </ClerkProvider>
      </body>
    </html>
  );
}
