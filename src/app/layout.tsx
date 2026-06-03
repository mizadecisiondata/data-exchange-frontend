import type { Metadata } from "next";
import { Toaster } from "sonner";
import { HelpBot } from "@/components/help-bot";
import { QueryProvider } from "@/components/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Decision Data - Data Exchange",
  description: "Plataforma Data Exchange de Decision Data"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <QueryProvider>{children}</QueryProvider>
        <HelpBot />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
