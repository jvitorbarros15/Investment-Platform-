import type { Metadata } from "next";
import { Syne, JetBrains_Mono, DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";

const syne = Syne({ subsets: ["latin"], variable: "--font-syne", display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });

export const metadata: Metadata = {
  title: "INVESTR — Personal Investment Platform",
  description: "Track your portfolio across Brazilian stocks, US equities, FIIs and crypto.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US" className={`h-full ${syne.variable} ${jetbrainsMono.variable} ${dmSans.variable}`}>
      <body className="h-full flex antialiased" style={{ background: "#0B0D12" }}>
        <Providers>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
