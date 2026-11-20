import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "CEDERSA | Composición Corporal",
  description:
    "Plataforma de registro, análisis e interpretación de evaluaciones de composición corporal (BIA) del Centro de Estudios para el Desarrollo del Rendimiento Físico y la Salud (CEDERSA) — Universidad Nacional, CIEMHCAVI.",
  keywords: ["CEDERSA", "bioimpedancia", "BIA", "InBody", "composición corporal", "CIEMHCAVI"],
  authors: [{ name: "CEDERSA — Universidad Nacional" }],
  icons: {
    icon: "/cedersa-logo.jpg",
    apple: "/cedersa-logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
        <SonnerToaster position="top-right" richColors />
      </body>
    </html>
  );
}
