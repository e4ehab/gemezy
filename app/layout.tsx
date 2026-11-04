// app/layout.tsx (global layout file)
import type { Metadata } from "next";
import { Inter, Cinzel } from "next/font/google";
import "./globals.css";
import { TRPCReactProvider } from "../trpc/client";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/toast";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { NuqsAdapter } from "nuqs/adapters/next/app";

// Main UI font
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

// Fantasy font (for titles, branding)
const cinzel = Cinzel({
  variable: "--font-fantasy",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Gemezy",
  description: "save your hidden gems and share them with the world",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TRPCReactProvider>
      <html
        lang="en"
        className="bg-background"
        style={{ backgroundColor: 'var(--background)' }}
        suppressHydrationWarning
      >
        <body className={`${inter.variable} ${cinzel.variable} antialiased bg-background min-h-screen`}>
          <NuqsAdapter>
            <ThemeProvider>
              <main className="bg-background min-h-screen">
                {children}
              </main>
              <Toaster />
              <SonnerToaster position="bottom-right" richColors />
            </ThemeProvider>
          </NuqsAdapter>
        </body>
      </html>
    </TRPCReactProvider>
  );
}