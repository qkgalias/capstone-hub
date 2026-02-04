import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import ParticleField from "./components/ParticleField";

export const metadata: Metadata = {
  title: "Capstone Materials Hub",
  description: "Personal dashboard for capstone materials"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={GeistMono.className}>
      <body>
        <ParticleField />
        <main className="min-h-screen relative z-10">{children}</main>
      </body>
    </html>
  );
}
