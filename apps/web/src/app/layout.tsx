import type { Metadata } from "next";
import "./globals.css";
import AppShell from "../components/AppShell";

export const metadata: Metadata = {
  title: "Nur Afiq Recycling - Enterprise Control Center",
  description: "Operational system for Nur Afiq Recycling.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
