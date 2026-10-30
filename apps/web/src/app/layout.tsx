import type { Metadata } from "next";
import { BRAND } from "@xeno/shared";
import { QueryProvider } from "@/providers/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: `${BRAND.name} — XenoCRM`,
  description: BRAND.tagline,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-IN">
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}