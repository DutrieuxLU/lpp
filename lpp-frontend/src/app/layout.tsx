import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LPP - League Press Poll",
  description: "AP Poll-style human-voted ranking system for professional League of Legends esports teams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#010A13] text-[#F0E6D2]">
        {children}
      </body>
    </html>
  );
}