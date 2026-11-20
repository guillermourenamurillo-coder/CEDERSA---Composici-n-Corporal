import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: "CEDERSA | Composición Corporal",
  description:
    "Plataforma de registro, análisis e interpretación de evaluaciones de composición corporal (BIA) del Centro de Estudios para el Desarrollo del Rendimiento Físico y la Salud (CEDERSA) — Universidad Nacional, CIEMHCAVI.",
  keywords: ["CEDERSA", "bioimpedancia", "BIA", "InBody", "composición corporal", "CIEMHCAVI"],
  authors: [{ name: "CEDERSA — Universidad Nacional" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
        <SonnerToaster position="top-right" richColors />
      </body>
    </html>
  );
}
